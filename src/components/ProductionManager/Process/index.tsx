"use client";
import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  fetchList,
  updateInventoryById,
  updateProductionStatus,
  updateIssuedKitsToLine,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Eye,
  Check,
  X,
  Search,
  Layers,
  Cpu,
  Package,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewProcessInventory = () => {
  const router = useRouter();

  // State Management
  const [productionManagerData, setProductionManagerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  // Modal States
  const [isInventoryModel, setIsInventoryModel] = useState(false);
  const [inventoryDetails, setInventoryDetails] = useState<any>({});
  const [inventoryID, setInventoryID] = useState("");
  const [updatedQuantity, setUpdatedQuantity] = useState(0);
  const [updatedCartonQuantity, setUpdatedCartonQuantity] = useState(0);
  const [packagingData, setPackagingData] = useState<any[]>([]);
  const [processName, setProcessName] = useState("");

  const [issuedKitsToLineModel, setIssuedKitsToLineModel] = useState(false);
  const [processData, setProcessData] = useState<any>({});
  const [startLineStage, setStartLineStage] = useState<any[]>([
    { key: "", data: [], assignedKitsToStage: [], issuedKits: 0 },
  ]);

  React.useEffect(() => {
    getProductionManagerProcess();
  }, []);

  const getProductionManagerProcess = async () => {
    try {
      setLoading(true);
      let result = await fetchList("/production-manger/process/get");
      setProductionManagerData(result.Processes || []);
    } catch (error) {
      console.error("Error Fetching Process:", error);
      toast.error("Failed to fetch processes");
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };

  const closeInventoryModal = () => {
    setIsInventoryModel(false);
  };

  const closeIssuedKitsToLineModel = () => {
    setIssuedKitsToLineModel(false);
  };

  const handleKitsToLine = async () => {
    try {
      const assignedStageParams = JSON.parse(processData.assignStages);
      const updatedStageData = { ...assignedStageParams };
      let seatDetails: any[] = [];
      let issuedKits = 0;
      let totalAssignedKit = 0;
      let issuedKitsStatus = "";

      startLineStage.forEach((stage) => {
        const key = stage.key;
        const original = assignedStageParams[key]?.[0];
        const updates = stage.data?.[0] || {};
        issuedKits += parseInt(updates?.totalUPHA || 0);
        totalAssignedKit = stage.issuedKits;
        let seatsInfo = key.split("-");
        seatDetails.push({
          rowNumber: seatsInfo[0],
          seatNumber: seatsInfo[1],
          issuedKits: parseInt(updates?.totalUPHA || 0),
        });
        if (!original) return;
        updatedStageData[key] = [
          {
            ...original,
            ...updates,
          },
        ];
      });

      if (totalAssignedKit != issuedKits && issuedKits > 0) {
        issuedKitsStatus = "PARTIALLY_ISSUED";
      } else if (totalAssignedKit == issuedKits) {
        issuedKitsStatus = "ISSUED";
      } else {
        issuedKitsStatus = "NOT_ISSUED";
      }

      let formData = new FormData();
      formData.append("planId", processData.planId);
      formData.append("processId", processData._id);
      formData.append("issuedKits", issuedKits.toString());
      formData.append("seatDetails", JSON.stringify(seatDetails));
      formData.append("issuedKitsStatus", issuedKitsStatus);
      formData.append("assignedStage", JSON.stringify(updatedStageData));
      formData.append("processStatus", "waiting_for_kits_confirmation");

      let result = await updateIssuedKitsToLine(formData);
      if (result) {
        setIssuedKitsToLineModel(false);
        getProductionManagerProcess();
        toast.success(result?.message || "Kits assigned to line successfully!");
      }
    } catch (error) {
      console.error("Error updating stage data:", error);
      toast.error("An error occurred while assigning kits.");
    }
  };

  const handleEdit = (process: any) => {
    setInventoryID(process._id);
    setProcessName(process.name);
    setUpdatedQuantity(0);
    setUpdatedCartonQuantity(0);

    // Find matching process internally instead of mapping blindly
    const targetProcess = productionManagerData.find((p) => p._id === process._id);
    if (targetProcess) {
      let packData: any[] = [];
      targetProcess?.productDetails?.stages?.forEach((stage: any) => {
        stage?.subSteps
          ?.filter((val: any) => val.isPackagingStatus)
          .forEach((val: any) => {
            packData.push(val);
          });
      });
      setPackagingData(packData);
      setInventoryDetails(targetProcess);
    }
    setIsInventoryModel(true);
  };

  const handleSubmitInventory = async () => {
    try {
      if (!inventoryID) {
        toast.error("Inventory ID is missing");
        return;
      }
      const existingItem = productionManagerData.find((value) => value._id === inventoryID);
      const currentQuantity = existingItem ? parseInt(existingItem.quantity) || 0 : 0;
      const currentCartonQuantity = existingItem ? parseInt(existingItem.cartonQuantity) || 0 : 0;
      const additionalQuantity = parseInt(updatedQuantity.toString()) || 0;
      const additionalCartonQuantity = parseInt(updatedCartonQuantity.toString()) || 0;

      const finalCartonQuantity = currentCartonQuantity + additionalCartonQuantity;
      const finalQuantity = currentQuantity + additionalQuantity;

      let formData = new FormData();
      formData.append("quantity", finalQuantity.toString());
      formData.append("cartonQuantity", finalCartonQuantity.toString());

      if (finalQuantity > 0) {
        formData.append("status", "In Stock");
      }

      const result = await updateInventoryById(inventoryID, formData);
      if (result && result.status === 200) {
        setIsInventoryModel(false);
        toast.success("Inventory updated successfully.");
        getProductionManagerProcess();
      } else {
        toast.error("Failed to update inventory.");
      }
    } catch (error) {
      console.error("Error updating inventory", error);
    }
  };

  const handleStatusUpdate = async (data: any, status: string) => {
    try {
      let form = new FormData();
      form.append("id", data?._id);
      form.append("status", status);
      if (status === "Waiting_Kits_allocation") {
        let returnedKits = (data?.quantity || 0) - (data?.issuedKits || 0);
        form.append("issuedKits", returnedKits.toString());
      }
      let result = await updateProductionStatus(form);
      if (result && result.status === 200) {
        toast.success("Production status updated successfully!");
        getProductionManagerProcess();
      }
    } catch (error) {
      console.error("Error updating status", error);
      toast.error("Failed to update status.");
    }
  };

  const handleIssuedKits = (row: any) => {
    setProcessData({});
    let assignedStages;
    try {
      assignedStages = JSON.parse(row.assignStages);
    } catch (e) {
      assignedStages = {};
    }
    let productStages = row.stages?.length || 0;
    let repeatCount = row.repeatCount || 0;
    const Objectkeys = Object.keys(assignedStages);
    const selectedStageEntries: any[] = [];

    for (let i = 0; i < repeatCount; i++) {
      const index = i * productStages;
      const key = Objectkeys[index];
      if (key && assignedStages[key]) {
        selectedStageEntries.push({
          key,
          data: assignedStages[key] || [],
          issuedKits: row.issuedKits,
          issuedCartons: row.issuedCartons,
        });
      }
    }
    setProcessData(row);
    setStartLineStage(selectedStageEntries);
    setIssuedKitsToLineModel(true);
  };

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return productionManagerData.filter((item: any) => {
      const searchStr = `${item.name} ${item.processID} ${item.status}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [productionManagerData, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = productionManagerData.length;
    const active = productionManagerData.filter((p: any) => p.status === "active").length;
    const completed = productionManagerData.filter((p: any) => p.status === "completed").length;
    const awaitingApproval = productionManagerData.filter((p: any) => p.status === "Waiting_Kits_approval").length;

    return { total, active, completed, awaitingApproval };
  }, [productionManagerData]);

  const columns = [
    {
      name: "Process Info",
      selector: (row: any) => row?.name,
      sortable: true,
      grow: 2,
      cell: (row: any) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{row.name}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {row.processID}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            <Layers size={12} />
            <span className="truncate">{row.productName || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Quantities",
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col py-2 gap-1 text-xs">
          <div className="flex justify-between w-full min-w-[100px]">
            <span className="text-gray-500">Target:</span>
            <span className="font-semibold dark:text-white">{parseInt(row?.quantity || 0)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-gray-500">Kits:</span>
            <span className="font-semibold text-blue-600">{parseInt(row?.issuedKits || 0)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-gray-500">Cartons:</span>
            <span className="font-semibold text-purple-600">{parseInt(row?.issuedCartons || 0)}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Kit Distribution",
      selector: (row: any) => parseInt(row.assignedKitsToOperator || 0),
      sortable: true,
      cell: (row: any) => {
        const statusClassMap: Record<string, string> = {
          ISSUED: "bg-emerald-100 text-emerald-800 border-emerald-200",
          PARTIALLY_ISSUED: "bg-amber-100 text-amber-800 border-amber-200",
          NOT_ISSUED: "bg-rose-100 text-rose-800 border-rose-200",
        };
        const labelMap: Record<string, string> = {
          ISSUED: "Fully Issued",
          PARTIALLY_ISSUED: "Partially Issued",
          NOT_ISSUED: "Not Issued",
        };
        const statusClass = statusClassMap[row.issuedKitsStatus] || "bg-gray-100 text-gray-800 border-gray-200";
        const displayLabel = labelMap[row.issuedKitsStatus] || "Pending Info";

        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
              {displayLabel}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              To Operator: {parseInt(row.assignedKitsToOperator || 0)}
            </span>
          </div>
        );
      },
    },
    {
      name: "Process Status",
      selector: (row: any) => row?.status,
      sortable: true,
      grow: 1.5,
      cell: (row: any) => {
        const statusClasses: Record<string, string> = {
          waiting_schedule: "bg-orange-100 text-orange-800 border-orange-200",
          Waiting_Kits_allocation: "bg-violet-100 text-violet-800 border-violet-200",
          Waiting_Kits_approval: "bg-teal-100 text-teal-800 border-teal-200",
          waiting_for_line_feeding: "bg-blue-100 text-blue-800 border-blue-200",
          waiting_for_kits_confirmation: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
          active: "bg-emerald-100 text-emerald-800 border-emerald-200",
          down_time_hold: "bg-rose-100 text-rose-800 border-rose-200",
          completed: "bg-gray-100 text-gray-800 border-gray-200",
          default: "bg-gray-100 text-gray-800 border-gray-200",
        };
        const labelMap: Record<string, string> = {
          waiting_schedule: "Waiting Schedule",
          Waiting_Kits_allocation: "Waiting Kits Allocation",
          Waiting_Kits_approval: "Awaiting Kits Approval",
          waiting_for_line_feeding: "Waiting For Line Feeding",
          waiting_for_kits_confirmation: "Awaiting Kits Confirmation",
          active: "Active IN-PROG",
          down_time_hold: "Down Time Hold",
          completed: "Completed",
          default: "Process Created",
        };
        const cls = statusClasses[row?.status] || statusClasses.default;
        const label = labelMap[row?.status] || row?.status;

        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
            {label}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {/* Details Button */}
          <button
            onClick={() => handleEdit(row)}
            className="group relative flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            title="View Details"
          >
            <Eye size={16} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap z-50">View Details</span>
          </button>

          {/* Action logic */}
          {row.status == "Waiting_Kits_approval" && (
            <>
              <button
                onClick={() => handleStatusUpdate(row, "waiting_for_line_feeding")}
                className="group relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20"
                title="Approve Kits"
              >
                <Check size={16} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap z-50">Approve</span>
              </button>
              <button
                onClick={() => handleStatusUpdate(row, "Waiting_Kits_allocation")}
                className="group relative flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white dark:bg-rose-900/20"
                title="Reject Kits"
              >
                <X size={16} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap z-50">Reject</span>
              </button>
            </>
          )}

          {(row.status === "waiting_for_line_feeding" || row.issuedKitsStatus === "PARTIALLY_ISSUED") && (
            <button
              onClick={() => handleIssuedKits(row)}
              className="group relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white dark:bg-blue-900/20"
              title="Assign Kits to Line"
            >
              <Package size={16} />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100 whitespace-nowrap z-50">Assign Kits to Line</span>
            </button>
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
        fontSize: "0.75rem",
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Line Production Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage process lifecycle, kit approvals, and line assignments.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Planned", value: stats.total, icon: Cpu, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Execution", value: stats.active, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Approvals", value: stats.awaitingApproval, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Completed", value: stats.completed, icon: Layers, color: "text-gray-600", bg: "bg-gray-100" },
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

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        {/* Search Bar */}
        <div className="flex border-b border-gray-100 p-6 dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search running processes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
        </div>

        {/* Data Table */}
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

      {/* View Details Modal */}
      <Modal
        isOpen={isInventoryModel}
        onSubmit={() => setIsInventoryModel(false)}
        onClose={closeInventoryModal}
        title="Process Details"
        submitOption={false}
      >
        <div className="space-y-6 pt-2">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 dark:bg-meta-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Process Name</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{inventoryDetails?.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Process ID</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{inventoryDetails?.processID}</p>
            </div>
          </div>

          {/* Kit Information */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
              <Package size={16} className="text-primary" />
              Resource Allocation Summary
            </h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl border border-gray-100 p-4 text-sm dark:border-strokedark">
              <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                <span className="text-gray-500">Target Kits:</span>
                <span className="font-bold">{inventoryDetails?.processQuantity || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                <span className="text-gray-500">Issued Kits:</span>
                <span className="font-bold text-emerald-600">{inventoryDetails?.issuedKits || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                <span className="text-gray-500">Kits Shortage:</span>
                <span className="font-bold text-rose-500">
                  {Math.abs((inventoryDetails?.processQuantity || 0) - (inventoryDetails?.issuedKits || 0))}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                <span className="text-gray-500">Surplus Kits:</span>
                <span className="font-bold text-blue-500">
                  {((inventoryDetails?.issuedKits || 0) > (inventoryDetails?.processQuantity || 0)) ? Math.abs((inventoryDetails?.inventoryQuantity || 0) - (inventoryDetails?.processQuantity || 0)) : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Carton Information */}
          {packagingData && packagingData.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                <Layers size={16} className="text-purple-500" />
                Carton Distribution
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl border border-gray-100 p-4 text-sm dark:border-strokedark">
                <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                  <span className="text-gray-500">Req. Cartons:</span>
                  <span className="font-bold">
                    {Math.ceil((inventoryDetails?.processQuantity || 0) / (packagingData[0]?.packagingData?.maxCapacity || 1))}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-strokedark">
                  <span className="text-gray-500">Issued Cartons:</span>
                  <span className="font-bold">{inventoryDetails?.cartonQuantity || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Kits to Line Modal */}
      <Modal
        isOpen={issuedKitsToLineModel}
        onSubmit={handleKitsToLine}
        onClose={closeIssuedKitsToLineModel}
        title="Assign Kits to Line (Stage Mapping)"
        submitOption={true}
      >
        <div className="space-y-4 pt-2">
          {startLineStage?.map((value, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm border-b border-gray-200 pb-3 mb-3 dark:border-strokedark">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Location</span>
                  <span className="font-medium text-gray-900 dark:text-white mt-0.5">Row {value.key.split('-')[0]}, Seat {value.key.split('-')[1]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Stage</span>
                  <span className="font-medium text-gray-900 dark:text-white mt-0.5">{value.data[0]?.name || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Kits Allocated</span>
                  <span className="font-medium text-blue-600 mt-0.5">{value.issuedKits} Total</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                  Kits to assign this line
                </label>
                <input
                  type="number"
                  min="0"
                  max={value.issuedKits}
                  required
                  value={value.data?.[0]?.totalUPHA || ""}
                  onChange={(e) => {
                    let kitsValue = parseInt(e.target.value) || 0;
                    if (kitsValue > value.issuedKits) kitsValue = value.issuedKits;

                    const updatedStages = [...startLineStage];
                    const updatedStage = { ...updatedStages[index] };

                    if (!Array.isArray(updatedStage.data)) updatedStage.data = [];
                    updatedStage.data[0] = { ...updatedStage.data[0], totalUPHA: kitsValue };

                    updatedStages[index] = updatedStage;
                    setStartLineStage(updatedStages);
                  }}
                  placeholder="Quantity"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewProcessInventory;
