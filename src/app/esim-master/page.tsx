"use client";
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import {
  viewEsimMasters,
  createEsimMaster,
  updateEsimMaster,
  deleteEsimMaster,
  viewEsimMakes,
  viewEsimProfiles,
  bulkDeleteEsimMaster,
  getAPNByMakeAndProfile,
} from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/common/Loader";
import Pagination from "@/components/common/Pagination";

const initialFormData = {
  ccid: "",
  esimMake: "",
  profile1: "",
  profile2: "",
  apnProfile1: "",
  apnProfile2: "",
  remarks: "",
};

const formatDate = (value: any) => {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString();
};

const normalizeEsimMasterResponse = (payload: any) => {
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.esimMasters)
        ? payload.esimMasters
        : [];

  const total = Number(payload?.pagination?.total);

  return {
    data,
    total: Number.isFinite(total) ? total : data.length,
  };
};

export default function EsimMasterListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [makes, setMakes] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const deferredQueryInput = useDeferredValue(queryInput);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQuery(deferredQueryInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [deferredQueryInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resMaster = await viewEsimMasters({
        page,
        pageSize,
        query,
      });

      const normalized = normalizeEsimMasterResponse(resMaster);
      setRows(normalized.data);
      setTotalRows(normalized.total);
      setSelectedIds((prev) => prev.filter((id) => normalized.data.some((row: any) => row._id === id)));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  const ensureReferenceData = useCallback(async () => {
    if (makes.length > 0 && profiles.length > 0) {
      return;
    }

    setReferenceLoading(true);
    try {
      const [resMakes, resProfiles] = await Promise.all([
        viewEsimMakes(),
        viewEsimProfiles(),
      ]);
      setMakes(Array.isArray(resMakes?.data) ? resMakes.data : []);
      setProfiles(Array.isArray(resProfiles?.data) ? resProfiles.data : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load reference data.");
    } finally {
      setReferenceLoading(false);
    }
  }, [makes.length, profiles.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentPageIds = useMemo(
    () => rows.map((row) => row?._id).filter(Boolean),
    [rows],
  );

  const allCurrentRowsSelected = useMemo(
    () => currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id)),
    [currentPageIds, selectedIds],
  );

  const profile1Options = useMemo(() => {
    if (!formData.profile2) return profiles;
    return profiles.filter((p) => {
      const names = Array.isArray(p.name) ? p.name : [p.name];
      return !names.includes(formData.profile2);
    });
  }, [profiles, formData.profile2]);

  const profile2Options = useMemo(() => {
    if (!formData.profile1) return profiles;
    return profiles.filter((p) => {
      const names = Array.isArray(p.name) ? p.name : [p.name];
      return !names.includes(formData.profile1);
    });
  }, [profiles, formData.profile1]);

  const openCreateModal = async () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
    await ensureReferenceData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateEsimMaster(editingId, formData);
        toast.success("ESIM Master updated successfully");
      } else {
        await createEsimMaster(formData);
        toast.success("ESIM Master created successfully");
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(initialFormData);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Operation failed");
    }
  };

  const handleEdit = async (row: any) => {
    setEditingId(row._id);
    setFormData({
      ccid: row.ccid || "",
      esimMake: row.esimMake || "",
      profile1: row.profile1 || "",
      profile2: row.profile2 || "",
      apnProfile1: row.apnProfile1 || "",
      apnProfile2: row.apnProfile2 || "",
      remarks: row.remarks || "",
    });
    setShowModal(true);
    await ensureReferenceData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteEsimMaster(id);
      toast.success("ESIM Master deleted successfully");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) return;
    try {
      setLoading(true);
      await bulkDeleteEsimMaster(selectedIds);
      toast.success(`${selectedIds.length} records deleted successfully`);
      setSelectedIds([]);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Bulk delete failed");
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (allCurrentRowsSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const getAPNBYMakeAndProfileFunc = async (profileValue: string, profileSlot: "1" | "2") => {
    const profileKey = profileSlot === "1" ? "profile1" : "profile2";
    const apnKey = profileSlot === "1" ? "apnProfile1" : "apnProfile2";

    if (!formData.esimMake || !profileValue) {
      setFormData((prev) => ({ ...prev, [profileKey]: profileValue, [apnKey]: "" }));
      return;
    }

    try {
      const response = await getAPNByMakeAndProfile(formData.esimMake, profileValue);
      setFormData((prev) => ({
        ...prev,
        [profileKey]: profileValue,
        [apnKey]: response?.data?.apnName || "",
      }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch APN profiles");
    }
  };

  return (
    <DefaultLayout>
      {loading && rows.length === 0 ? (
        <Loader />
      ) : (
        <>
          <div className="mx-auto max-w-270">
            <Breadcrumb pageName="ESIM Masters" parentName="" />
            <ToastContainer />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-black dark:text-white">ESIM Master List</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void openCreateModal()}
                      className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                    >
                      Add ESIM Master
                    </button>
                    <Link
                      href="/esim-master/bulk-upload"
                      className="rounded border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      Bulk Upload
                    </Link>
                    {selectedIds.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="rounded bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                      >
                        Delete Selected ({selectedIds.length})
                      </button>
                    )}
                    <Link
                      href="/esim-make"
                      className="rounded border border-secondary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary hover:text-white transition-colors"
                    >
                      Manage Makes
                    </Link>
                    <Link
                      href="/esim-profile"
                      className="rounded border border-warning px-4 py-2 text-sm font-medium text-warning hover:bg-warning hover:text-white transition-colors"
                    >
                      Manage Profiles
                    </Link>
                    <Link
                      href="/esim-apn"
                      className="rounded border border-success px-4 py-2 text-sm font-medium text-success hover:bg-success hover:text-white transition-colors"
                    >
                      Manage APNs
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-6.5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {loading ? "Loading records..." : `${totalRows} records`}
                  </div>
                  <input
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Search by CCID or Make"
                    className="w-full max-w-md rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  />
                </div>

                <div className="max-h-[65vh] overflow-y-auto rounded-md border border-gray-300 dark:border-strokedark">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-boxdark">
                      <tr>
                        <th className="border-b p-2">
                          <input
                            type="checkbox"
                            checked={allCurrentRowsSelected}
                            onChange={toggleSelectAll}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="border-b p-2">CCID</th>
                        <th className="border-b p-2">Make</th>
                        <th className="border-b p-2">Profile 1</th>
                        <th className="border-b p-2">Profile 2</th>
                        <th className="border-b p-2">APN 1</th>
                        <th className="border-b p-2">APN 2</th>
                        <th className="border-b p-2">Created At</th>
                        <th className="border-b p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row._id || index} className="border-b hover:bg-gray-50 dark:hover:bg-strokedark">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(row._id)}
                              onChange={() => toggleSelect(row._id)}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="p-2">{row.ccid}</td>
                          <td className="p-2">{row.esimMake}</td>
                          <td className="max-w-xs truncate p-2" title={row.profile1}>
                            {row.profile1}
                          </td>
                          <td className="max-w-xs truncate p-2" title={row.profile2}>
                            {row.profile2}
                          </td>
                          <td className="p-2">{row.apnProfile1}</td>
                          <td className="p-2">{row.apnProfile2}</td>
                          <td className="p-2">{formatDate(row.createdAt)}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => void handleEdit(row)} className="text-primary hover:underline">Edit</button>
                              <button onClick={() => handleDelete(row._id)} className="text-danger hover:underline">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && rows.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-gray-500">
                            No ESIM Masters found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {referenceLoading && showModal && (
                  <div className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Loading makes and profiles...
                  </div>
                )}

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={totalRows}
                  onPageChange={setPage}
                  onPageSizeChange={(n) => {
                    setPageSize(n);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark custom-scrollbar">
                <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke py-4 px-6.5 dark:border-strokedark flex items-center justify-between">
                  <h3 className="font-medium text-black dark:text-white">
                    {editingId ? "Edit ESIM Master" : "Add ESIM Master"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                    type="button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-6.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">CCID <span className="text-meta-1">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.ccid}
                        onChange={(e) => setFormData((prev) => ({ ...prev, ccid: e.target.value }))}
                        placeholder="Enter CCID"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">ESIM Make</label>
                      <select
                        value={formData.esimMake}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          esimMake: e.target.value,
                          apnProfile1: "",
                          apnProfile2: "",
                        }))}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      >
                        <option value="">Select Make</option>
                        {makes.map((m) => (
                          <option key={m._id} value={m.simId}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">Profile 1</label>
                      <select
                        value={formData.profile1}
                        onChange={(e) => void getAPNBYMakeAndProfileFunc(e.target.value, "1")}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      >
                        <option value="">Select Profile</option>
                        {profile1Options.map((p) => {
                          const names = Array.isArray(p.name) ? p.name : [p.name];
                          const mainName = names[0] || p.profileId;
                          return (
                            <optgroup key={p._id} label={mainName}>
                              {names.map((n: string, idx: number) => (
                                <option key={`${p._id}-${idx}`} value={n}>{n}</option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">Profile 2</label>
                      <select
                        value={formData.profile2}
                        onChange={(e) => void getAPNBYMakeAndProfileFunc(e.target.value, "2")}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      >
                        <option value="">Select Profile</option>
                        {profile2Options.map((p) => {
                          const names = Array.isArray(p.name) ? p.name : [p.name];
                          const mainName = names[0] || p.profileId;
                          return (
                            <optgroup key={p._id} label={mainName}>
                              {names.map((n: string, idx: number) => (
                                <option key={`${p._id}-${idx}`} value={n}>{n}</option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">APN Profile 1</label>
                      <input
                        type="text"
                        required
                        value={formData.apnProfile1}
                        onChange={(e) => setFormData((prev) => ({ ...prev, apnProfile1: e.target.value }))}
                        placeholder="APN Profile 1"
                        disabled={true}
                        readOnly={true}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">APN Profile 2</label>
                      <input
                        type="text"
                        required
                        value={formData.apnProfile2}
                        onChange={(e) => setFormData((prev) => ({ ...prev, apnProfile2: e.target.value }))}
                        placeholder="APN Profile 2"
                        disabled={true}
                        readOnly={true}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Enter Remarks (optional)"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="rounded border border-stroke px-6 py-2 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                    >
                      {editingId ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </DefaultLayout>
  );
}