"use client";

import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  fetchList,
  updateInventoryById,
  getProcessByProductID,
  deleteProcess,
  updateIssueKit,
  updateIssueCarton
} from "@/lib/api";
import { Inventory } from "@/types/inventory";
import { useRouter } from "next/navigation";
import {
  Eye,
  Trash2,
  Box,
  Truck,
  Search,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Hash,
  Calendar,
  AlertCircle,
  PackageCheck
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AllocationManagement = () => {
  const router = useRouter();

  // State Management
  const [inventoryData, setInventoryData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [isDetailsModel, setIsDetailsModel] = useState(false);
  const [isIssueKitModel, setIsIssueKitModel] = useState(false);
  const [isIssueCartonModel, setIsIssueCartonModel] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Form State
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState("");
  const [selectedProcessDetails, setSelectedProcessDetails] = useState<any>({});
  const [issueKitProcess, setIssueKitProcess] = useState("");
  const [issueCartonProcess, setIssueCartonProcess] = useState("");
  const [packagingData, setPackagingData] = useState<any[]>([]);

  useEffect(() => {
    getInventory();
  }, []);

  const getInventory = async () => {
    try {
      setLoading(true);
      const result = await fetchList("/inventory/process/get");
      setInventoryData(result.processInventory);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
      toast.error("Failed to fetch process inventory");
    } finally {
      setLoading(false);
    }
  };

  const getProcesses = async (id: string) => {
    try {
      const result = await getProcessByProductID(id);
      const filtered = result.ProcessByProductID.filter(
        (value: any) => value.status === "Waiting_Kits_allocation" || value.kitStatus === "partially_issued"
      );
      setProcesses(filtered);
    } catch (error) {
      console.error("Error Fetching Process:", error);
    }
  };

  const handleOpenDetails = (process: Inventory) => {
    setSelectedInventory(process);
    setIsDetailsModel(true);

    // Extract packaging data if exists
    const packData: any[] = [];
    process.productDetails?.stages.forEach((stage: any) => {
      stage?.subSteps
        .filter((step: any) => step.isPackagingStatus)
        .forEach((step: any) => packData.push(step));
    });
    setPackagingData(packData);
  };

  const openIssueKits = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setSelectedProcess(inventory._id);
    setSelectedProcessDetails(inventory);
    setIsIssueKitModel(true);
    setIssueKitProcess("");
  };

  const openIssueCarton = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setSelectedProcess(inventory._id);
    setSelectedProcessDetails(inventory);
    setIsIssueCartonModel(true);
    setIssueCartonProcess("");
  };

  const handleSubmitCarton = async () => {
    try {
      if (selectedProcessDetails.status === "completed") {
        toast.error("Process is already fully allocated");
        return;
      }
      const data = new FormData();
      data.append("process", selectedProcess);
      data.append("issueCartonProcess", issueCartonProcess);
      await updateIssueCarton(data);
      toast.success("Cartons Issued Successfully!");
      setIsIssueCartonModel(false);
      getInventory();
    } catch (error) {
      console.error("Error issuing cartons:", error);
      toast.error("Failed to issue cartons");
    }
  };

  const handleSubmitIssuedKit = async () => {
    try {
      const data = new FormData();
      data.append("process", selectedProcess);
      data.append("issuedKits", issueKitProcess);

      if (selectedProcessDetails.status === "completed") {
        toast.error("Process is already fully allocated");
        return;
      }
      const needed = (selectedProcessDetails.processQuantity || 0) - (selectedProcessDetails.issuedKits || 0);
      const input = parseInt(issueKitProcess) || 0;

      if (needed <= 0) {
        toast.error("Allocation already complete");
        return;
      }

      if (input <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      if (input > needed) {
        toast.error("Cannot allocate more than required");
        return;
      }

      data.append("kitStatus", input >= needed ? "issued" : "partially_issued");
      data.append("status", "Waiting_Kits_approval");

      await updateIssueKit(data);
      toast.success("Kits Issued Successfully!");
      setIsIssueKitModel(false);
      getInventory();
    } catch (error) {
      console.error("Error issuing kits:", error);
      toast.error("Failed to issue kits");
    }
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return inventoryData.filter((item) => {
      const searchStr = `${item.productName} ${item.name} ${item.orderConfirmationNo} ${item.processID}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [inventoryData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = inventoryData.length;
    const critical = inventoryData.filter(item => (item.processQuantity - item.issuedKits) > 50).length;
    const pendingApproval = inventoryData.filter(item => item.status === "Waiting_Kits_approval").length;
    const completed = inventoryData.reduce((sum, item) => sum + (item.fgCount || 0), 0);

    return { total, critical, pendingApproval, completed };
  }, [inventoryData]);

  const columns = [
    {
      name: "Process Information",
      selector: (row: Inventory) => row.name,
      sortable: true,
      grow: 2,
      cell: (row: Inventory) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{row.name}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {row.processID}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <Layers size={12} />
            <span>{row.productName}</span>
            <span className="text-gray-300">|</span>
            <Hash size={12} />
            <span>OC: {row.orderConfirmationNo || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Allocation Progress",
      sortable: true,
      grow: 1.5,
      cell: (row: Inventory) => {
        const percent = Math.min(100, Math.round((row.issuedKits / row.processQuantity) * 100));
        const shortage = Math.max(0, row.processQuantity - row.issuedKits);
        return (
          <div className="w-full pr-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {row.issuedKits} / {row.processQuantity} Kits
              </span>
              <span className={shortage > 0 ? "text-amber-600 font-bold" : "text-emerald-600"}>
                {shortage > 0 ? `-${shortage} Short` : "Ready"}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${percent === 100 ? "bg-emerald-500" : percent > 50 ? "bg-blue-500" : "bg-amber-500"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      name: "Completed (FG)",
      selector: (row: Inventory) => row.fgToStore || 0,
      sortable: true,
      cell: (row: Inventory) => (
        <div className="flex items-center gap-1.5 font-bold text-emerald-600">
          <PackageCheck size={14} />
          <span>{row.fgToStore || 0}</span>
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row: Inventory) => row.status,
      sortable: true,
      cell: (row: Inventory) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          Waiting_Kits_allocation: { label: "Allocation Pending", color: "bg-amber-100 text-amber-800" },
          Waiting_Kits_approval: { label: "Awaiting Approval", color: "bg-blue-100 text-blue-800" },
          completed: { label: "Fully Allocated", color: "bg-emerald-100 text-emerald-800" },
          active: { label: "Active Production", color: "bg-purple-100 text-purple-800" },
        };
        const s = statusMap[row.status] || { label: row.status.replace(/_/g, " "), color: "bg-gray-100 text-gray-800" };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: Inventory) => {
        const kitComplete = row.issuedKits >= row.processQuantity || row.status === "completed";

        // Calculate estimated cartons needed if packaging info exists
        let cartonsNeeded = 0;
        const packStep = row.productDetails?.stages
          ?.flatMap((s: any) => s.subSteps || [])
          .find((step: any) => step.isPackagingStatus);

        if (packStep?.packagingData?.maxCapacity) {
          cartonsNeeded = Math.ceil(row.processQuantity / packStep.packagingData.maxCapacity);
        }

        const cartonComplete = (cartonsNeeded > 0 && row.cartonQuantity >= cartonsNeeded) || row.status === "completed";

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenDetails(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              title="View Details"
            >
              <Eye size={16} />
            </button>

            {!kitComplete && (
              <button
                onClick={() => openIssueKits(row)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                title="Issue Kits"
              >
                <Box size={16} />
              </button>
            )}

            {!cartonComplete && (
              <button
                onClick={() => openIssueCarton(row)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20"
                title="Issue Carton"
              >
                <Truck size={16} />
              </button>
            )}
          </div>
        );
      },
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
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Process Allocation</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor and fulfill kit requirements for active production lines.</p>
        </div>
        <button
          onClick={() => router.push("/inventory/view")}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          <ArrowLeft size={16} />
          Back to Stock Master
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Processes", value: stats.total, icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Shortage Alerts", value: stats.critical, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Approval Pending", value: stats.pendingApproval, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Devices Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        <div className="flex border-b border-gray-100 p-6 dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Process, Product or OC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
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
            />
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModel}
        onSubmit={() => setIsDetailsModel(false)}
        onClose={() => setIsDetailsModel(false)}
        title="Process Inventory Details"
        submitOption={false}
      >
        {selectedInventory && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 dark:bg-meta-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Process Name</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{selectedInventory.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Process ID</p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">{selectedInventory.processID}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                <Box size={16} className="text-primary" />
                Kit Allocation Summary
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl border border-gray-100 p-4 text-sm dark:border-strokedark">
                <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                  <span className="text-gray-500">Required:</span>
                  <span className="font-bold">{selectedInventory.processQuantity}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                  <span className="text-gray-500">Issued:</span>
                  <span className="font-bold text-emerald-600">{selectedInventory.issuedKits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-rose-500">Shortage:</span>
                  <span className="font-bold text-rose-600">
                    {Math.max(0, selectedInventory.processQuantity - selectedInventory.issuedKits)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                  <span className="text-gray-500">Available Stock:</span>
                  <span className="font-bold">{selectedInventory.inventoryQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed (FG):</span>
                  <span className="font-bold text-emerald-600">{selectedInventory.fgCount || 0}</span>
                </div>
              </div>
            </div>

            {packagingData.length > 0 && (
              <div className="space-y-3 border-t pt-6 dark:border-strokedark">
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                  <Truck size={16} className="text-emerald-500" />
                  Carton Fulfillment
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl border border-gray-100 p-4 text-sm dark:border-strokedark">
                  <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                    <span className="text-gray-500">Est. Needed:</span>
                    <span className="font-bold">
                      {Math.ceil(selectedInventory.processQuantity / (packagingData[0]?.packagingData?.maxCapacity || 1))}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                    <span className="text-gray-500">Allocated:</span>
                    <span className="font-bold">{selectedInventory.cartonQuantity}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 rounded-lg bg-blue-50/50 p-3 text-[10px] text-gray-500 dark:bg-white/5">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                Created: {new Date(selectedInventory.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                Updated: {new Date(selectedInventory.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Allocation Modals (Kit/Carton) */}

      {/* Issue Kits Modal */}
      <Modal
        isOpen={isIssueKitModel}
        onSubmit={handleSubmitIssuedKit}
        onClose={() => setIsIssueKitModel(false)}
        title={`Allocate Kits: ${selectedInventory?.productName}`}
        submitDisabled={
          (() => {
            const needed = (selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0);
            const input = parseInt(issueKitProcess) || 0;
            return selectedInventory?.status === "completed" || needed <= 0 || input <= 0 || input > needed;
          })()
        }
      >
        <div className="space-y-5 pt-2">
          <div className="rounded-xl bg-gray-50 p-5 space-y-3 dark:bg-meta-4 ring-1 ring-gray-100 dark:ring-strokedark">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-bold uppercase">Process Name:</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedInventory?.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-bold uppercase">Pending Requirement:</span>
              <span className={`font-bold ${((selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0)) === 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {Math.max(0, (selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0))} Kits
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-strokedark">
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Amount to Allocate</label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder={((selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0)) === 0 ? "Allocation Complete" : "Enter quantity"}
                  value={issueKitProcess}
                  onChange={(e) => setIssueKitProcess(e.target.value)}
                  disabled={((selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0)) <= 0}
                  className={`w-full rounded-lg border py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed ${parseInt(issueKitProcess) > ((selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0))
                    ? "border-rose-500 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/10 bg-white"
                    : "border-primary bg-white"
                    }`}
                />
              </div>
              {parseInt(issueKitProcess) > ((selectedInventory?.processQuantity || 0) - (selectedInventory?.issuedKits || 0)) && (
                <p className="mt-1 text-[10px] font-bold text-rose-500">Cannot allocate more than pending requirement</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Issue Carton Modal */}
      <Modal
        isOpen={isIssueCartonModel}
        onSubmit={handleSubmitCarton}
        onClose={() => setIsIssueCartonModel(false)}
        title={`Allocate Cartons: ${selectedInventory?.productName}`}
      >
        <div className="space-y-5 pt-2">
          <div className="rounded-xl bg-gray-50 p-5 space-y-3 dark:bg-meta-4 ring-1 ring-gray-100 dark:ring-strokedark">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-bold uppercase">Process Name:</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedInventory?.name}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-strokedark">
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Carton Quantity</label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="Enter cartons"
                  value={issueCartonProcess}
                  onChange={(e) => setIssueCartonProcess(e.target.value)}
                  className="w-full rounded-lg border border-primary bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AllocationManagement;
