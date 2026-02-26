"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchList, updateInventoryById, createProcessKits, getUseTypeByType } from "@/lib/api";
import { Inventory } from "@/types/inventory";
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
  Send,
  Check,
  X,
  Plus,
  Clock,
  Layers
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewProcessInventory = () => {
  const router = useRouter();

  // State
  const [productionManagerData, setProductionManagerData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInventoryModel, setIsInventoryModel] = useState(false);
  const [inventoryDetails, setInventoryDetails] = useState<any>({});
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermission();
    getRemainingKitsToProcess();
  }, []);

  const checkPermission = async () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const userType = userDetails.userType;

      if (!userType) {
        router.push("/");
        return;
      }

      if (userType.toLowerCase() === "admin") {
        setHasPermission(true);
        return;
      }

      const result = await getUseTypeByType();
      const permissions = result.userType[0].roles;
      const normalizedUserType = userType.toLowerCase().replace(/\s+/g, "_");

      // The key for "Remaining Kits" in roles is "remaining_kits"
      const permitted = permissions["remaining_kits"]?.[normalizedUserType];

      if (!permitted) {
        toast.error("You do not have permission to access this page.");
        router.push("/dashboard");
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/dashboard");
    }
  };

  const getRemainingKitsToProcess = async () => {
    try {
      setLoading(true);
      const result = await fetchList("/production-manger/getRemainingKit");
      setProductionManagerData(result.Processes || []);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
      toast.error("Failed to load remaining kits data");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnKits = async (data: Inventory) => {
    try {
      const userDetailsStr = localStorage.getItem("userDetails");
      const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;

      if (!userDetails?._id) {
        toast.error("User details not found. Please log in again.");
        return;
      }

      const form = new FormData();
      form.append("processId", data._id);
      form.append(
        "returnedKits",
        String((parseInt((data as any).issuedKits, 10) || 0) -
          (parseInt((data as any).consumedKits, 10) || 0)),
      );
      form.append(
        "returnedCarton",
        String((parseInt((data as any).issuedCartons, 10) || 0) -
          (parseInt((data as any).consumedCartons, 10) || 0)),
      );
      form.append("userId", String(userDetails._id));
      form.append("status", "SEND_TO_STORE");

      const result = await createProcessKits(form);
      if (result?.status === 200) {
        toast.success("Kits sent to store successfully!");
        getRemainingKitsToProcess(); // Refresh list
      } else {
        toast.error("Failed to initiate return. Please try again.");
      }
    } catch (error: any) {
      console.error("Error while creating kits entry:", error?.message);
      toast.error("An error occurred while creating kits entry.");
    }
  };

  // Memoized Filter
  const filteredData = useMemo(() => {
    return productionManagerData.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item as any).processName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productionManagerData, searchTerm]);

  // Memoized Stats
  const stats = useMemo(() => {
    const totalProcesses = productionManagerData.length;
    const totalRemainingKits = productionManagerData.reduce((sum, item) => sum + ((item as any).issuedKits - (item as any).consumedKits), 0);
    const pendingReturn = productionManagerData.filter(item => (item as any).returnKitsStatus === "").length;
    return { totalProcesses, totalRemainingKits, pendingReturn };
  }, [productionManagerData]);

  const columns = [
    {
      name: "Process Information",
      sortable: true,
      grow: 2,
      cell: (row: any) => (
        <div className="flex flex-col py-3">
          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-[11px]">
            {row.processName || "Process Name"}
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium lowercase first-letter:uppercase">
            <LayoutGrid size={12} className="text-primary" />
            <span>{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Kit Usage",
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col py-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1 text-center">Issued</span>
              <span className="text-xs font-bold text-gray-700 text-center">{row.issuedKits || 0}</span>
            </div>
            <ArrowRight size={12} className="text-gray-300" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1 text-center">Used</span>
              <span className="text-xs font-bold text-gray-700 text-center">{row.consumedKits || 0}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Remaining Net",
      sortable: true,
      cell: (row: any) => {
        const netKits = (row.issuedKits || 0) - (row.consumedKits || 0);
        const netCartons = (row.issuedCartons || 0) - (row.consumedCartons || 0);
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-black text-rose-500">
              <RotateCcw size={14} />
              <span className="text-sm">{netKits} Units</span>
            </div>
            {netCartons > 0 && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Box size={10} />
                <span>{netCartons} Cartons</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      sortable: true,
      cell: (row: any) => {
        const statuses: Record<string, { label: string; color: string; icon: any }> = {
          SEND_TO_STORE: { label: "Sent to Store", color: "bg-blue-100 text-blue-700 ring-blue-500/20", icon: Send },
          RECIVED: { label: "Received", color: "bg-emerald-100 text-emerald-700 ring-emerald-500/20", icon: CheckCircle2 },
          "": { label: "In Production", color: "bg-amber-100 text-amber-700 ring-amber-500/20", icon: Clock },
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
          {row.returnKitsStatus === "" ? (
            <button
              onClick={() => handleReturnKits(row)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark shadow-md active:scale-95"
              title="Return Surplus to Store"
            >
              <Send size={16} />
            </button>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <CheckCircle2 size={18} />
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
        minHeight: "80px",
        "&:hover": {
          backgroundColor: "#f9fafb !important",
        }
      },
    },
  };

  if (hasPermission === null) return null;
  if (hasPermission === false) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Production Kit Reconciliation</h1>
        <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Track and return surplus components from completed production lines back to storage.</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Active Processes", value: stats.totalProcesses, icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Wait For Return", value: stats.pendingReturn, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Net Surplus Kits", value: stats.totalRemainingKits, icon: RotateCcw, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mr-5`}>
              <stat.icon size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        {/* Search Bar */}
        <div className="flex border-b border-gray-100 p-6 dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by process or product..."
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
                  <p className="text-sm font-medium">Clear inventory. No surplus components detected.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewProcessInventory;
