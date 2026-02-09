"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { viewEsimProfiles, createEsimProfile, updateEsimProfile, deleteEsimProfile } from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EsimProfilePage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        profileId: "",
        name: [] as string[],
        activeStatus: true,
        remarks: "",
    });
    const [nameInput, setNameInput] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await viewEsimProfiles();
            setRows(res.data || []);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load ESIM Profiles.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => {
            const profileId = String(r?.profileId ?? "").toLowerCase();
            const names = Array.isArray(r?.name) ? r.name.map((n: string) => String(n).toLowerCase()) : [String(r?.name ?? "").toLowerCase()];
            return profileId.includes(q) || names.some((n: string) => n.includes(q));
        });
    }, [query, rows]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.length === 0) {
            toast.error("Please add at least one profile name.");
            return;
        }
        try {
            if (editingId) {
                await updateEsimProfile(editingId, formData);
                toast.success("ESIM Profile updated successfully");
            } else {
                await createEsimProfile(formData);
                toast.success("ESIM Profile created successfully");
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ profileId: "", name: [], activeStatus: true, remarks: "" });
            setNameInput("");
            load();
        } catch (e: any) {
            toast.error(e?.message || "Operation failed");
        }
    };

    const handleEdit = (row: any) => {
        setEditingId(row._id);
        setFormData({
            profileId: row.profileId,
            name: Array.isArray(row.name) ? row.name : [row.name],
            activeStatus: row.activeStatus,
            remarks: row.remarks || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteEsimProfile(id);
            toast.success("ESIM Profile deleted successfully");
            load();
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        }
    };

    return (
        <DefaultLayout>
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="ESIM Profiles" parentName="" />
                <ToastContainer />

                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-medium text-black dark:text-white">ESIM Profile List</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ profileId: "", name: [], activeStatus: true, remarks: "" });
                                        setNameInput("");
                                        setShowModal(true);
                                    }}
                                    className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                >
                                    Add ESIM Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6.5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                {filtered.length} records
                            </div>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by Profile ID or Name"
                                className="w-full max-w-md rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                            />
                        </div>

                        <div className="max-h-[65vh] overflow-y-auto rounded-md border border-gray-300 dark:border-strokedark">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-gray-100 dark:bg-boxdark">
                                    <tr>
                                        <th className="border-b p-2">Profile ID</th>
                                        <th className="border-b p-2">Name</th>
                                        <th className="border-b p-2">Status</th>
                                        <th className="border-b p-2">Remarks</th>
                                        <th className="border-b p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr key={row._id} className="border-b hover:bg-gray-50 dark:hover:bg-strokedark">
                                            <td className="p-2">{row.profileId}</td>
                                            <td className="p-2">
                                                {Array.isArray(row.name) ? row.name.join(", ") : row.name}
                                            </td>
                                            <td className="p-2">
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.activeStatus ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                                                    {row.activeStatus ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="p-2">{row.remarks}</td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEdit(row)} className="text-primary hover:underline">Edit</button>
                                                    <button onClick={() => handleDelete(row._id)} className="text-danger hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-gray-500">
                                                No ESIM Profiles found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark custom-scrollbar">
                        <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                {editingId ? "Edit ESIM Profile" : "Add ESIM Profile"}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6.5">
                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Profile ID <span className="text-meta-1">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.profileId}
                                    onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                                    placeholder="Enter Profile ID"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Profile Names <span className="text-meta-1">*</span></label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.name.map((tag, index) => (
                                        <span key={index} className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, name: formData.name.filter((_, i) => i !== index) })}
                                                className="hover:text-danger"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = nameInput.trim();
                                                if (val && !formData.name.includes(val)) {
                                                    setFormData({ ...formData, name: [...formData.name, val] });
                                                    setNameInput("");
                                                }
                                            }
                                        }}
                                        placeholder="Add name and press Enter"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const val = nameInput.trim();
                                            if (val && !formData.name.includes(val)) {
                                                setFormData({ ...formData, name: [...formData.name, val] });
                                                setNameInput("");
                                            }
                                        }}
                                        className="rounded bg-primary px-3 py-2 text-white text-xs font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Press Enter or click Add to include multiple names.</p>
                            </div>

                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Active Status</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="radio"
                                            checked={formData.activeStatus === true}
                                            onChange={() => setFormData({ ...formData, activeStatus: true })}
                                            name="activeStatus"
                                        />
                                        <span>Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="radio"
                                            checked={formData.activeStatus === false}
                                            onChange={() => setFormData({ ...formData, activeStatus: false })}
                                            name="activeStatus"
                                        />
                                        <span>Inactive</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Remarks</label>
                                <textarea
                                    rows={2}
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder="Enter Remarks"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded border border-stroke py-2 px-4 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90"
                                >
                                    {editingId ? "Update" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DefaultLayout>
    );
}
