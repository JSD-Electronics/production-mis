"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { viewEsimApns, createEsimApn, updateEsimApn, deleteEsimApn, viewEsimMakes, viewEsimProfiles } from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatDate = (value: any) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString();
};

export default function EsimApnPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [makes, setMakes] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        apnName: "",
        esimMake: "",
        esimProfile1: "",
        remarks: "",
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [resApns, resMakes, resProfiles] = await Promise.all([
                viewEsimApns(),
                viewEsimMakes(),
                viewEsimProfiles(),
            ]);

            const list = Array.isArray(resApns?.data) ? resApns.data : [];
            setRows(list);
            setMakes(resMakes.data || []);
            setProfiles(resProfiles.data || []);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load data.");
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
            const name = String(r?.apnName ?? "").toLowerCase();
            const make = String(r?.esimMake ?? "").toLowerCase();
            return name.includes(q) || make.includes(q);
        });
    }, [query, rows]);

    const profile1Options = useMemo(() => {
        if (!formData.esimProfile2) return profiles;
        return profiles.filter((p) => {
            const names = Array.isArray(p.name) ? p.name : [p.name];
            return !names.includes(formData.esimProfile2);
        });
    }, [profiles, formData.esimProfile2]);

    const profile2Options = useMemo(() => {
        if (!formData.esimProfile1) return profiles;
        return profiles.filter((p) => {
            const names = Array.isArray(p.name) ? p.name : [p.name];
            return !names.includes(formData.esimProfile1);
        });
    }, [profiles, formData.esimProfile1]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateEsimApn(editingId, formData);
                toast.success("ESIM APN updated successfully");
            } else {
                await createEsimApn(formData);
                toast.success("ESIM APN created successfully");
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ apnName: "", esimMake: "", esimProfile1: "", remarks: "" });
            load();
        } catch (e: any) {
            toast.error(e?.message || "Operation failed");
        }
    };

    const handleEdit = (row: any) => {
        setEditingId(row._id);
        setFormData({
            apnName: row.apnName,
            esimMake: row.esimMake,
            esimProfile1: row.esimProfile1,
            remarks: row.remarks || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteEsimApn(id);
            toast.success("ESIM APN deleted successfully");
            load();
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        }
    };
    const getEsimMakeNameById = (id: string) => {
        const esimMake = makes.find((m) => m.simId === id);
        return esimMake ? esimMake.name : "";
    };

    return (
        <DefaultLayout>
            <div className="mx-auto max-w-270">
                <Breadcrumb pageName="ESIM APN Master" parentName="ESIM Master" />
                <ToastContainer />

                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-medium text-black dark:text-white">ESIM APN List</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ apnName: "", esimMake: "", esimProfile1: "", remarks: "" });
                                        setShowModal(true);
                                    }}
                                    className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                >
                                    Add ESIM APN
                                </button>
                                <Link
                                    href="/esim-master"
                                    className="rounded border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                                >
                                    Back to Master
                                </Link>
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
                                placeholder="Search by APN Name or Make"
                                className="w-full max-w-md rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                            />
                        </div>

                        <div className="max-h-[65vh] overflow-y-auto rounded-md border border-gray-300 dark:border-strokedark">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-gray-100 dark:bg-boxdark">
                                    <tr>
                                        <th className="border-b p-2">APN Name</th>
                                        <th className="border-b p-2">Esim Make</th>
                                        <th className="border-b p-2">Profile</th>
                                        <th className="border-b p-2">Created At</th>
                                        <th className="border-b p-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row, index) => (
                                        <tr key={row._id || index} className="border-b hover:bg-gray-50 dark:hover:bg-strokedark">
                                            <td className="p-2 font-medium text-black dark:text-white">{row.apnName}</td>
                                            <td className="p-2">{getEsimMakeNameById(row.esimMake)}</td>
                                            <td className="p-2">{row.esimProfile1}</td>
                                            <td className="p-2">{formatDate(row.createdAt)}</td>
                                            <td className="p-2 text-left">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(row)} className="text-primary hover:underline">Edit</button>
                                                    <button onClick={() => handleDelete(row._id)} className="text-danger hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-gray-500">
                                                No ESIM APNs found.
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
                    <div className="w-full max-w-lg rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                {editingId ? "Edit ESIM APN" : "Add ESIM APN"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6.5">
                            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                                <div className="mb-4.5">
                                    <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">APN Name <span className="text-meta-1">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.apnName}
                                        onChange={(e) => setFormData({ ...formData, apnName: e.target.value })}
                                        placeholder="Enter APN Name"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>

                                <div className="mb-4.5">
                                    <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Esim Make <span className="text-meta-1">*</span></label>
                                    <select
                                        required
                                        value={formData.esimMake}
                                        onChange={(e) => setFormData({ ...formData, esimMake: e.target.value })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    >
                                        <option value="">Select Make</option>
                                        {makes.map((m) => (
                                            <option key={m._id} value={m.simId}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4.5">
                                    <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Esim Profile <span className="text-meta-1">*</span></label>
                                    <select
                                        required
                                        value={formData.esimProfile1}
                                        onChange={(e) => setFormData({ ...formData, esimProfile1: e.target.value })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
                            </div>

                            <div className="mb-6">
                                <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Remarks</label>
                                <textarea
                                    rows={2}
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder="Enter remarks (optional)"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                ></textarea>
                            </div>

                            <div className="flex gap-4.5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex w-full justify-center rounded border border-stroke py-3 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded bg-primary py-3 px-6 font-medium text-gray hover:bg-opacity-90"
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
