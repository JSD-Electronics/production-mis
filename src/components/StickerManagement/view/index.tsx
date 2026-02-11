"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Tag,
  Hash,
  AlertCircle,
  Calendar
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import {
  createStickerField,
  deleteStickerField,
  getStickerFields,
  deleteStickerFieldMultiple,
} from "@/lib/api";

// Assuming 'Stages' type is generic or reused, defining local interface for clarity
interface StickerField {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

const ViewStickerManagementComponent = () => {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StickerField[]>([]);
  const [selectedRows, setSelectedRows] = useState<StickerField[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal & Popup State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [targetId, setTargetId] = useState("");

  // Form State
  const [fieldName, setFieldName] = useState("");
  const [editingId, setEditingId] = useState("");

  // Fetch Logic
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getStickerFields();
      setData(result?.data || []);
    } catch (error) {
      console.error("Error fetching sticker fields:", error);
      toast.error("Failed to fetch sticker fields.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Actions
  const handleOpenModal = (row?: StickerField) => {
    if (row) {
      setEditingId(row._id);
      setFieldName(row.name);
    } else {
      setEditingId("");
      setFieldName("");
    }
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteStickerField(targetId);
      toast.success("Field deleted successfully!");
      setShowPopup(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete field.");
    }
  };

  const handleMultipleDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteStickerFieldMultiple(selectedIds);
      toast.success(`${selectedRows.length} fields deleted successfully!`);
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      console.error("Error deleting multiple fields:", error);
      toast.error("Failed to delete selected fields.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!fieldName.trim()) {
        toast.error("Field name is required");
        return;
      }

      const formData = new FormData();
      formData.append("name", fieldName);

      const slug = fieldName
        .split(" ")
        .map((word) => word.toLowerCase())
        .join("_");
      formData.append("slug", slug);

      if (editingId) {
        formData.append("stickerFieldId", editingId);
      }

      const result = await createStickerField(formData);
      if (result && result.status == 200) {
        setIsModalOpen(false);
        fetchData();
        toast.success(result.message || "Sticker Field Saved Successfully");
      }
    } catch (error) {
      console.error("Error saving field:", error);
      toast.error("An error occurred while saving.");
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: data.length
    }
  }, [data]);

  // Columns
  const columns: TableColumn<StickerField>[] = [
    {
      name: "Field Name",
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Tag size={20} />
          </div>
          <div>
            <span className="block text-sm font-bold text-gray-900 dark:text-white">
              {row.name}
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              Slug: {row.slug}
            </span>
          </div>
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
            onClick={() => {
              setTargetId(row._id);
              setShowPopup(true);
            }}
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
      <Breadcrumb pageName="View Sticker" parentName="Sticker Management" />

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Sticker Fields</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Configure dynamic fields for sticker generation templates.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Add Sticker Field
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mr-5">
            <Hash size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Fields</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search fields..."
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
              onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No sticker fields found.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showPopup && (
        <ConfirmationPopup
          message="Are you sure you want to delete this field?"
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Sticker Field" : "New Sticker Field"}
        submitOption={true}
      >
        <div className="pt-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Field Name</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. Serial Number"
                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewStickerManagementComponent;
