"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Wrench,
  Tag,
  Calendar,
  AlertCircle,
  Hash,
  Layers,
  FolderOpen,
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import {
  viewJig,
  deleteJig,
  deleteMultipleJig,
  createJig,
  viewJigCategory,
  fetchJigByJigId,
} from "@/lib/api";

interface JigData {
  _id: string;
  name: string;
  jigCategory?: string;
  createdAt: string;
  updatedAt: string;
}

interface JigCategory {
  _id: string;
  name: string;
}

const ViewJig = () => {
  const router = useRouter();

  // Table state
  const [loading, setLoading] = useState(true);
  const [jigData, setJigData] = useState<JigData[]>([]);
  const [selectedRows, setSelectedRows] = useState<JigData[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clearSelected, setClearSelected] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [jigCategoryId, setJigCategoryId] = useState("");
  const [jigCategories, setJigCategories] = useState<JigCategory[]>([]);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch jigs list
  const fetchJigs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await viewJig();
      setJigData(result?.Jigs || []);
    } catch (error) {
      console.error("Error fetching jigs:", error);
      toast.error("Failed to fetch Jigs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch jig categories for dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const result = await viewJigCategory();
      setJigCategories(result?.JigCategories || []);
    } catch (error) {
      console.error("Error fetching jig categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchJigs();
    fetchCategories();
  }, [fetchJigs, fetchCategories]);

  // Filtered data
  const filteredData = useMemo(() => {
    return jigData.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jigCategory?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [jigData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const categories = new Set(
      jigData.map((j) => j.jigCategory).filter(Boolean),
    );
    return {
      total: jigData.length,
      categories: categories.size,
      recent: jigData.filter(
        (d) =>
          new Date(d.createdAt) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
    };
  }, [jigData]);

  // Open modal for Add
  const handleOpenAddModal = () => {
    setEditingId(null);
    setName("");
    setJigCategoryId("");
    setSubmitDisabled(false);
    setIsModalOpen(true);
  };

  // Open modal for Edit — pre-fill from API
  const handleOpenEditModal = async (id: string) => {
    setEditingId(id);
    setName("");
    setJigCategoryId("");
    setSubmitDisabled(false);
    setModalLoading(true);
    setIsModalOpen(true);
    try {
      const result = await fetchJigByJigId(id);
      const jig = result?.Jigs;
      setName(jig?.name || "");
      setJigCategoryId(jig?.jigCategory || "");
    } catch (error) {
      console.error("Error fetching jig for edit:", error);
      toast.error("Failed to load jig details.");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit (create or update)
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Jig name is required.");
      return;
    }
    setSubmitDisabled(true);
    try {
      const formData = new FormData();
      if (editingId) formData.append("id", editingId);
      formData.append("name", name);
      formData.append("jigCategory", jigCategoryId);

      const result = await createJig(formData);
      if (result && result.status === 200) {
        toast.success(
          editingId ? "Jig updated successfully!" : "Jig created successfully!",
        );
        setIsModalOpen(false);
        fetchJigs();
      } else {
        throw new Error(result?.message || "Operation failed.");
      }
    } catch (error: any) {
      console.error("Error saving jig:", error);
      toast.error(error?.message || "An error occurred while saving.");
      setSubmitDisabled(false);
    }
  };

  // Delete single
  const handleDeleteConfirm = (id: string) => {
    setTargetId(id);
    setShowPopup(true);
  };

  const handleDelete = async () => {
    try {
      await deleteJig(targetId);
      toast.success("Jig deleted successfully!");
      setShowPopup(false);
      fetchJigs();
    } catch (error) {
      console.error("Error deleting jig:", error);
      toast.error("Failed to delete Jig.");
    }
  };

  // Delete multiple
  const handleMultipleDelete = async () => {
    try {
      if (selectedRows.length === 0) return;
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleJig(selectedIds);
      toast.success(`${selectedRows.length} jig(s) deleted successfully!`);
      setSelectedRows([]);
      setClearSelected((prev) => !prev);
      fetchJigs();
    } catch (error) {
      console.error("Error deleting multiple jigs:", error);
      toast.error("Failed to delete selected jigs.");
    }
  };

  // Helper: resolve category name from id
  const getCategoryName = (categoryIdOrName?: string) => {
    if (!categoryIdOrName) return null;
    const found = jigCategories.find((c) => c._id === categoryIdOrName);
    return found ? found.name : categoryIdOrName;
  };

  const columns: TableColumn<JigData>[] = [
    {
      name: "Jig",
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wrench size={20} />
          </div>
          <div>
            <span className="block text-sm font-bold text-gray-900 dark:text-white">
              {row.name}
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              ID: {row._id.slice(-6)}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Category",
      sortable: true,
      cell: (row) => {
        const catName = getCategoryName(row.jigCategory);
        return (
          <div className="flex items-center gap-1.5">
            {catName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                <Tag size={11} />
                {catName}
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">No category</span>
            )}
          </div>
        );
      },
    },
    {
      name: "Created Date",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Calendar size={14} />
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Last Updated",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Calendar size={14} />
          {new Date(row.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row._id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => handleDeleteConfirm(row._id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f9fafb",
        borderTopWidth: "1px",
        borderTopColor: "rgba(0,0,0,0.05)",
        borderBottomWidth: "1px",
        borderBottomColor: "rgba(0,0,0,0.05)",
      },
    },
    headCells: {
      style: {
        fontWeight: "700",
        fontSize: "0.7rem",
        color: "#6b7280",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        paddingLeft: "24px",
        paddingRight: "24px",
      },
    },
    rows: {
      style: {
        minHeight: "72px",
        fontSize: "0.875rem",
        backgroundColor: "#ffffff",
        "&:hover": {
          backgroundColor: "#f9fafb !important",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "24px",
        paddingRight: "24px",
      },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb pageName="View Jig" parentName="Jig Management" />

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">
            Jig Management
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">
            Manage and track all production jigs and fixtures.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Add Jig
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mr-5">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Total Jigs
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.total}
            </h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mr-5">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Categories Used
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.categories}
            </h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mr-5">
            <Hash size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Added This Week
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.recent}
            </h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search jigs or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white font-medium"
            />
          </div>

          {selectedRows.length > 0 && (
            <button
              onClick={handleMultipleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500 hover:text-white shadow-sm"
            >
              <Trash2 size={14} />
              Remove Selected ({selectedRows.length})
            </button>
          )}
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <BallTriangle height={80} width={80} color="#3c50e0" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              selectableRows
              clearSelectedRows={clearSelected}
              onSelectedRowsChange={(state) =>
                setSelectedRows(state.selectedRows)
              }
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No Jigs found.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showPopup && (
        <ConfirmationPopup
          message="Are you sure you want to delete this Jig? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}

      {/* Add / Edit Jig Modal */}
      <Modal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Jig" : "Add New Jig"}
        submitOption={true}
        submitDisabled={submitDisabled}
      >
        {modalLoading ? (
          <div className="flex h-32 items-center justify-center">
            <BallTriangle height={50} width={50} color="#3c50e0" />
          </div>
        ) : (
          <div className="pt-4 space-y-5">
            {/* Jig Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Jig Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Wrench
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                  size={18}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fixture Type A"
                  required
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
            </div>

            {/* Jig Category */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Jig Category
              </label>
              <div className="relative">
                <FolderOpen
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                  size={18}
                />
                <select
                  value={jigCategoryId}
                  onChange={(e) => setJigCategoryId(e.target.value)}
                  className="w-full appearance-none rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                >
                  <option value="">— Select Category —</option>
                  {jigCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewJig;
