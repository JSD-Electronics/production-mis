"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Tag,
  Calendar,
  AlertCircle,
  Hash,
  CheckCircle2,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import {
  viewJigCategory,
  deleteJigCategories,
  deleteMultipleJigCategories,
  createJigCategory,
} from "@/lib/api";

interface JigCategoryData {
  _id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ViewJigCategory = () => {

  const [loading, setLoading] = useState(true);
  const [jigCategoryData, setJigCategoryData] = useState<JigCategoryData[]>([]);
  const [selectedRows, setSelectedRows] = useState<JigCategoryData[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clearSelected, setClearSelected] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("1");
  const [submitDisabled, setSubmitDisabled] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const result = await viewJigCategory();
      setJigCategoryData(result?.JigCategories || []);
    } catch (error) {
      console.error("Error fetching jig categories:", error);
      toast.error("Failed to fetch Jig Categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredData = useMemo(() => {
    return jigCategoryData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [jigCategoryData, searchTerm]);

  const stats = useMemo(() => {
    const active = jigCategoryData.filter((c) => c.status === "1").length;
    return {
      total: jigCategoryData.length,
      active,
      inactive: jigCategoryData.length - active,
    };
  }, [jigCategoryData]);

  const handleOpenModal = (row?: JigCategoryData) => {
    if (row) {
      setEditingId(row._id);
      setName(row.name);
      setStatus(row.status);
    } else {
      setEditingId(null);
      setName("");
      setStatus("1");
    }
    setSubmitDisabled(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSubmitDisabled(true);
    try {
      const formData = new FormData();
      if (editingId) formData.append("id", editingId);
      formData.append("name", name);
      formData.append("status", status);

      const result = await createJigCategory(formData);
      if (result && (result.status === 200 || result.status === 201)) {
        toast.success(
          editingId
            ? "Jig Category updated successfully!"
            : "Jig Category created successfully!",
        );
        setIsModalOpen(false);
        fetchCategories();
      } else {
        throw new Error(result?.message || "Operation failed.");
      }
    } catch (error: any) {
      console.error("Error submitting jig category:", error);
      toast.error(error?.message || "An error occurred while saving.");
      setSubmitDisabled(false);
    }
  };

  const handleDeleteConfirm = (id: string) => {
    setTargetId(id);
    setShowPopup(true);
  };

  const handleDelete = async () => {
    try {
      await deleteJigCategories(targetId);
      toast.success("Jig Category deleted successfully!");
      setShowPopup(false);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting jig category:", error);
      toast.error("Failed to delete Jig Category.");
    }
  };

  const handleMultipleDelete = async () => {
    try {
      if (selectedRows.length === 0) return;
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleJigCategories(selectedIds);
      toast.success(`${selectedRows.length} category(ies) deleted successfully!`);
      setSelectedRows([]);
      setClearSelected((prev) => !prev);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting multiple jig categories:", error);
      toast.error("Failed to delete selected categories.");
    }
  };

  const columns: TableColumn<JigCategoryData>[] = [
    {
      name: "Category",
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FolderOpen size={20} />
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
      name: "Status",
      sortable: true,
      cell: (row) => (
        <div>
          {row.status === "1" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={12} />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">
              <XCircle size={12} />
              Inactive
            </span>
          )}
        </div>
      ),
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
            onClick={() => handleOpenModal(row)}
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
      <Breadcrumb pageName="View Jig Categories" parentName="Jig Management" />

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">
            Jig Categories
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">
            Manage and organize jig categories for production.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mr-5">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Total Categories
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.total}
            </h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mr-5">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Active
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.active}
            </h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 mr-5">
            <Hash size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Inactive
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.inactive}
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
              placeholder="Search categories..."
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
                  <p className="text-sm font-medium">No Jig Categories found.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showPopup && (
        <ConfirmationPopup
          message="Are you sure you want to delete this category? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Jig Category" : "New Jig Category"}
        submitOption={true}
      >
        <div className="pt-4 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Category Name
            </label>
            <div className="relative">
              <FolderOpen
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

          {/* Status */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewJigCategory;
