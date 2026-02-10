"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchList, updateInventoryById, updateKitsEntry } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Package,
  RotateCcw,
  LayoutGrid,
  Box,
  Warehouse,
  Search,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  History,
  Check,
  X,
  Plus
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewReturnedKits = () => {
  const [productionManagerData, setProductionManagerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isReturnedKitModel, setReturnedKitModel] = useState(false);
  const [kitsRecieved, setKitRecieved] = useState<any>(0);
  const [cartonRecieved, setCartonRecieved] = useState<any>(0);
  const [processDetails, setProcessDetails] = useState<any>({});

  useEffect(() => {
    getRemainingKitsToProcess();
  }, []);

  const getRemainingKitsToProcess = async () => {
    try {
      setLoading(true);
      const result = await fetchList("/process/viewReturnToStore");
      setProductionManagerData(result.kits || []);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
      toast.error("Failed to load returned kits data");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnKits = async () => {
    try {
      const userDetailsStr = localStorage.getItem("userDetails");
      const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;

      if (!userDetails?._id) {
        toast.error("User details not found. Please log in again.");
        return;
      }

      const form = new FormData();
      form.append("processID", processDetails.pID);
      form.append("selectedProduct", processDetails.selectedProduct);
      form.append("returnedKits", kitsRecieved);
      form.append("returnedCarton", cartonRecieved);
      form.append("userId", userDetails._id);
      form.append("status", "RECIVED");

      const result = await updateKitsEntry(form, processDetails._id);
      if (result?.status === 200) {
        toast.success("Kits returned to store successfully!");
        setReturnedKitModel(false);
        getRemainingKitsToProcess(); // Refresh list
      } else {
        toast.error("Failed to process return. Please try again.");
      }
    } catch (error) {
      console.error("Error while creating kits entry:", error);
      toast.error("An error occurred while processing return.");
    }
  };

  const handleReturnedKitsModel = (data: any) => {
    setProcessDetails(data);
    // Auto-fill with the expected amounts
    setKitRecieved(data.issuedKits - data.consumedKits);
    setCartonRecieved(data.issuedCartons - data.consumedCartons);
    setReturnedKitModel(true);
  };

  // Memoized Filter
  const filteredData = useMemo(() => {
    return productionManagerData.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.processName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productionManagerData, searchTerm]);

  // Memoized Stats
  const stats = useMemo(() => {
    const totalItems = productionManagerData.length;
    const totalReturnedKits = productionManagerData.reduce((sum, item) => sum + (item.issuedKits - item.consumedKits), 0);
    const pendingCount = productionManagerData.filter(item => item.returnKitsStatus === "SEND_TO_STORE").length;
    return { totalItems, totalReturnedKits, pendingCount };
  }, [productionManagerData]);

  const columns = [
    {
      name: "Process & Product",
      sortable: true,
      grow: 2,
      cell: (row: any) => (
        <div className="flex flex-col py-3">
          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-xs">
            {row.processName || "Process Name"}
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
            <LayoutGrid size={12} className="text-primary" />
            <span>{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Kit Breakdown",
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col py-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Issued</span>
              <span className="text-sm font-medium text-gray-700">{row.issuedKits}</span>
            </div>
            <ArrowRight size={12} className="text-gray-300" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Used</span>
              <span className="text-sm font-medium text-gray-700">{row.consumedKits}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Returned (Net)",
      sortable: true,
      cell: (row: any) => {
        const netKits = row.issuedKits - row.consumedKits;
        const netCartons = row.issuedCartons - row.consumedCartons;
        return (
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-bold text-emerald-600">
                <RotateCcw size={14} />
                <span>{netKits} Kits</span>
              </div>
              {netCartons > 0 && (
                <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-gray-500">
                  <Box size={10} />
                  <span>{netCartons} Cartons</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      name: "Status",
      sortable: true,
      cell: (row: any) => {
        const statuses: Record<string, { label: string; color: string; icon: any }> = {
          SEND_TO_STORE: { label: "In Transit", color: "bg-blue-100 text-blue-700 ring-blue-500/20", icon: RotateCcw },
          RECIVED: { label: "Accepted", color: "bg-emerald-100 text-emerald-700 ring-emerald-500/20", icon: CheckCircle2 },
          DEFAULT: { label: "Completed", color: "bg-gray-100 text-gray-600 ring-gray-200", icon: ClipboardList }
        };
        const s = statuses[row.returnKitsStatus] || statuses.DEFAULT;
        const Icon = s.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${s.color}`}>
            <Icon size={10} />
            {s.label}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.returnKitsStatus !== "RECIVED" ? (
            <button
              onClick={() => handleReturnedKitsModel(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
              title="Process Return"
            >
              <Check size={16} />
            </button>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          )}
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
        minHeight: "72px",
        "&:hover": {
          backgroundColor: "#f9fafb !important",
        }
      },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Return Kit Intake</h1>
        <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Process and verify kits returning from production floor to storage.</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Pending Returns", value: stats.pendingCount, icon: RotateCcw, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Kits Returning", value: stats.totalReturnedKits, icon: Box, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Processes", value: stats.totalItems, icon: Warehouse, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mr-5`}>
              <stat.icon size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        <div className="flex border-b border-gray-100 p-6 dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product or process..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white font-medium"
            />
          </div>
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
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Package size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No returned kits found.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={isReturnedKitModel}
        onSubmit={handleReturnKits}
        onClose={() => setReturnedKitModel(false)}
        title="Verify Returned Stock"
      >
        <div className="space-y-6 pt-2">
          {/* Process Context */}
          <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100 dark:bg-meta-4 dark:ring-strokedark">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Incoming From</p>
              <h4 className="text-base font-black text-gray-900 dark:text-white">{processDetails?.processName}</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <Box size={14} className="text-blue-500" />
                Kits Received
              </label>
              <input
                type="number"
                value={kitsRecieved}
                onChange={(e) => setKitRecieved(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all dark:bg-form-input dark:text-white"
              />
              <p className="text-[10px] text-gray-400 italic">Expected: {processDetails.issuedKits - processDetails.consumedKits}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <LayoutGrid size={14} className="text-emerald-500" />
                Cartons Received
              </label>
              <input
                type="number"
                value={cartonRecieved}
                onChange={(e) => setCartonRecieved(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all dark:bg-form-input dark:text-white"
              />
              <p className="text-[10px] text-gray-400 italic">Expected: {processDetails.issuedCartons - processDetails.consumedCartons}</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:bg-amber-900/10 dark:border-amber-900/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                Confirming this will return these quantities back into the available stock inventory for future processes.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewReturnedKits;
