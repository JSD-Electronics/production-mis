"use client";

import React, { useEffect, useState, useMemo } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Package,
  Layers,
  Calendar,
  AlertCircle
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import ConfirmationPopup from "@/components/Confirmation/page";
import { viewProduct, deleteProduct, deleteMultipleProduct } from "@/lib/api";
import { Stages } from "@/types/stage";

import "react-toastify/dist/ReactToastify.css";

const ViewProductList = () => {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [stageData, setStageData] = useState<Stages[]>([]);
  const [selectedRows, setSelectedRows] = useState<Stages[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [productId, setProductId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /** Fetch Products */
  const getStages = async () => {
    try {
      setLoading(true);
      const result = await viewProduct();
      setStageData(result?.Products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStages();
  }, []);

  /** Single Delete */
  const handleDelete = async () => {
    try {
      await deleteProduct(productId);
      toast.success("Product deleted successfully!");
      setShowPopup(false);
      getStages();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    }
  };

  /** Multiple Delete */
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleProduct(selectedIds);
      toast.success("Selected products deleted successfully!");
      setSelectedRows([]);
      getStages();
    } catch (error) {
      console.error("Error deleting products:", error);
      toast.error("Failed to delete selected products.");
    }
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return stageData.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stageData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalProducts = stageData.length;
    const totalStages = stageData.reduce((sum, item) => sum + (item.stages?.length || 0), 0);
    return { totalProducts, totalStages };
  }, [stageData]);

  /** Table Columns */
  const columns: TableColumn<Stages>[] = [
    {
      name: "Product Name",
      sortable: true,
      grow: 2,
      cell: (row: any) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package size={16} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-[11px]">
              {row.name || "Unnamed Product"}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "No of Stages",
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Layers size={14} className="text-primary" />
          <span className="text-xs font-bold">{row.stages?.length || 0} Stages</span>
        </div>
      ),
    },
    {
      name: "Last Updated",
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <Calendar size={12} />
            {new Date(row.updatedAt || row.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/product/edit/${row._id}`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white shadow-sm"
            title="Edit Product"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => {
              setProductId(row._id);
              setShowPopup(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
            title="Delete Product"
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
      },
    },
    headCells: {
      style: {
        fontWeight: "700",
        fontSize: "0.7rem",
        color: "#6b7280",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
      },
    },
    rows: {
      style: {
        minHeight: "80px",
        "&:hover": {
          backgroundColor: "#f9fafb !important",
        }
      },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">View Products</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Manage and configure manufacturing stages for your product catalog.</p>
        </div>
        <button
          onClick={() => router.push("/product/add")}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mr-5">
            <Package size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Products</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalProducts}</h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mr-5">
            <Layers size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Active Stages</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalStages}</h3>
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
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white font-medium"
            />
          </div>

          {selectedRows.length > 0 && (
            <button
              onClick={handleMultipleRowsDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500 hover:text-white shadow-sm"
            >
              <Trash2 size={14} />
              Delete Selected ({selectedRows.length})
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
                  <p className="text-sm font-medium">No products discovered yet.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Confirmation Popup */}
      {showPopup && (
        <ConfirmationPopup
          message="Are you sure you want to delete this product?"
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default ViewProductList;
