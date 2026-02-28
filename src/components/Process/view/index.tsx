"use client";
import React, { useState, useMemo, useEffect } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  viewProcess,
  deleteProcess,
  deleteMultipleProcesses,
  updateQuantity,
  createProcessLogs,
  updateMarkAsComplete,
  getOrderConfirmationNumers,
} from "@/lib/api";
import Modal from "@/components/Modal/page";
import { useRouter } from "next/navigation";
import { Tooltip } from "react-tooltip";
import { FiEdit, FiEye, FiPlus, FiTrash } from "react-icons/fi";
import { Search, Trash2, XCircle, Activity, CheckCircle, Clock, PauseCircle, Truck, PackageCheck, Plus } from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./process.css";
import CardDataStats from "@/components/CardDataStats";

// --- Custom Status Component ---
const StatusBadge = ({ status }: any) => {
  const labelMap: any = {
    waiting_schedule: "Waiting Schedule",
    waiting_for_kits_confirmation: "Kits Pending",
    Waiting_Kits_allocation: "Kits Allocation",
    Waiting_Kits_approval: "Kits Approval",
    active: "Active",
    down_time_hold: "On Hold",
    completed: "Completed",
    default: "Created",
  };

  const colorMap: any = {
    waiting_schedule: "bg-orange-500",
    waiting_for_kits_confirmation: "bg-fuchsia-500",
    Waiting_Kits_allocation: "bg-indigo-500",
    Waiting_Kits_approval: "bg-cyan-500",
    active: "bg-emerald-500",
    down_time_hold: "bg-rose-500",
    completed: "bg-slate-500",
    default: "bg-gray-500",
  };

  const label = labelMap[status] || labelMap.default;
  const color = colorMap[status] || colorMap.default;

  return (
    <span className={`inline-block rounded px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
};

const ViewProcess = () => {
  const router = useRouter();

  // State
  const [shiftData, setShiftData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderConfirmationNo, setOrderConfirmationNo] = useState("");
  const [ocNoArr, setOcNoArr] = useState([]);

  // Modal States
  const [showPopup, setShowPopup] = useState(false);
  const [showMarkAsCompletePopup, setShowMarkAsCompletePopup] = useState(false);
  const [isAddQuantityModel, setIsAddQuantityModel] = useState(false);
  const [selectedProcessID, setSelectedProcessID] = useState("");
  const [productId, setProductId] = useState("");
  const [addMoreQuantity, setMoreQuantity] = useState(0);

  useEffect(() => {
    getProcess();
    getOrderConfirmationNumbersList();
  }, []);

  const getOrderConfirmationNumbersList = async () => {
    try {
      const response = await getOrderConfirmationNumers();
      setOcNoArr(response.getOrderConfirmationNo || []);
    } catch (error) {
      console.error("Error fetching OC numbers:", error);
    }
  };

  const getProcess = async () => {
    try {
      setLoading(true);
      const result = await viewProcess();
      setShiftData(result.Processes || []);
    } catch (error) {
      console.error("Error Fetching Processes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };

  const handleLogs = (id: string) => {
    window.open(`/process/logs/${id}`, "_blank");
  };

  const handleEdit = (id: string) => {
    router.push(`/process/edit/${id}`);
  };

  const handleViewPlaning = (id: string) => {
    window.open(`/planing-scheduling/viewPlaning/${id}`, "_blank");
  };

  const handleAddPlaning = (id: string) => {
    window.open(`/planing-scheduling/add/${id}`, "_blank");
  };

  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProcess(productId);
      getProcess();
      toast.success("Process deleted successfully!");
      setShowPopup(false);
    } catch (error) {
      console.error("Error deleting Process:", error);
      toast.error("Failed to delete process");
    }
  };

  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleProcesses(selectedIds);
      setSelectedRows([]);
      toast.success("Processes deleted successfully!");
      getProcess();
    } catch (error) {
      console.error("Error Deleting Processes:", error);
      toast.error("Failed to delete multiple processes");
    }
  };

  const handleMarkAsCompleteButton = (id: string) => {
    setSelectedProcessID(id);
    setShowMarkAsCompletePopup(true);
  };

  const handleSubmitMarkAsCompleted = async () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const filteredProcess = shiftData.find((v: any) => v._id === selectedProcessID);

      const formData = new FormData();
      formData.append("status", "completed");
      await updateMarkAsComplete(formData, selectedProcessID);

      const logData = new FormData();
      logData.append("action", "PROCESS_COMPLETED");
      logData.append("processId", selectedProcessID);
      logData.append("userId", userDetails?._id || "");
      logData.append("description", `${filteredProcess?.name || "Process"} was marked as completed by ${userDetails?.name}`);

      await createProcessLogs(logData);

      toast.success("Process marked as completed!");
      setShowMarkAsCompletePopup(false);
      getProcess();
    } catch (error) {
      console.error("Error completion:", error);
      toast.error("Failed to update status");
    }
  };

  const handleAddQuantity = (id: string) => {
    setSelectedProcessID(id);
    setIsAddQuantityModel(true);
  };

  const handleSubmitQuantity = async () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const formData = new FormData();
      formData.append("quantity", String(addMoreQuantity));
      formData.append("status", 'partially_issued');
      await updateQuantity(formData, selectedProcessID);

      const logData = new FormData();
      logData.append("action", "PROCESS_EXTENDED");
      logData.append("processId", selectedProcessID);
      logData.append("userId", userDetails?._id || "");
      logData.append("description", `${addMoreQuantity} Quantity added to process`);

      await createProcessLogs(logData);

      toast.success("Quantity updated successfully!");
      setIsAddQuantityModel(false);
      getProcess();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to add quantity");
    }
  };

  // Calculations
  const summary = useMemo(() => {
    const s = { active: 0, completed: 0, waiting_schedule: 0, down_time_hold: 0 };
    shiftData.forEach(r => {
      if (r?.status === "active") s.active++;
      else if (r?.status === "completed") s.completed++;
      else if (r?.status === "waiting_schedule") s.waiting_schedule++;
      else if (r?.status === "down_time_hold") s.down_time_hold++;
    });
    return s;
  }, [shiftData]);

  const displayData = useMemo(() => {
    return shiftData.filter((row: any) => {
      const matchesOC = orderConfirmationNo ? String(row?.orderConfirmationNo) === orderConfirmationNo : true;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || [
        row?.orderConfirmationNo,
        row?.processID,
        row?.productName,
        row?.name
      ].some(f => String(f || "").toLowerCase().includes(q));
      return matchesOC && matchesSearch;
    });
  }, [shiftData, searchQuery, orderConfirmationNo]);

  const columns = [
    {
      name: "ID",
      selector: (row: any, index?: number) => (index ?? 0) + 1,
      width: "60px",
      sortable: true,
    },
    {
      name: "OC No",
      selector: (row: any) => row?.orderConfirmationNo,
      sortable: true,
      grow: 1,
    },
    {
      name: "Product",
      selector: (row: any) => row?.productName,
      sortable: true,
      grow: 1.5,
    },
    {
      name: "Process Name",
      selector: (row: any) => row?.name,
      sortable: true,
      grow: 1.5,
    },
    {
      name: "Qty",
      selector: (row: any) => row?.quantity,
      width: "80px",
      sortable: true,
    },
    {
      name: "Schedule",
      width: "100px",
      cell: (row: any) => (
        row.status !== "waiting_schedule" ? (
          <>
            <button
              onClick={() => handleViewPlaning(row.planing?._id)}
              className="flex items-center justify-center rounded bg-primary p-2 text-white shadow hover:bg-opacity-90"
              data-tooltip-id={`view-plan-${row._id}`}
              data-tooltip-content="View Planning"
            >
              <FiEye size={14} />
            </button>
            <Tooltip id={`view-plan-${row._id}`} />
          </>
        ) : (
          <>
            <button
              onClick={() => handleAddPlaning(row?._id)}
              className="flex items-center justify-center rounded bg-primary p-2 text-white shadow hover:bg-opacity-90"
              data-tooltip-id={`add-plan-${row._id}`}
              data-tooltip-content="Add Planning"
            >
              <FiPlus size={14} />
            </button>
            <Tooltip id={`add-plan-${row._id}`} />
          </>
        )
      )
    },
    {
      name: "Logistics",
      cell: (row: any) => (
        <div className="flex flex-col gap-1 py-1 text-[11px] font-medium text-gray-500">
          <div className="flex items-center gap-1"><Truck size={10} /> {row?.dispatchStatus || 'Pending'}</div>
          <div className="flex items-center gap-1"><PackageCheck size={10} /> {row?.deliverStatus || 'Pending'}</div>
        </div>
      ),
      grow: 1.2
    },
    {
      name: "Complete",
      width: "90px",
      cell: (row: any) => (
        row?.status === "active" && (
          <button
            onClick={() => handleMarkAsCompleteButton(row?._id)}
            className="flex items-center justify-center rounded bg-success p-2 text-white shadow hover:bg-opacity-90"
            title="Mark as Complete"
          >
            <CheckCircle size={14} />
          </button>
        )
      )
    },
    {
      name: "Status",
      selector: (row: any) => row?.status,
      sortable: true,
      cell: (row: any) => <StatusBadge status={row?.status} />
    },
    {
      name: "Actions",
      width: "150px",
      cell: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleLogs(row._id)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:scale-105"
            title="View Logs"
          >
            <FiEye size={14} />
          </button>
          {row?.status !== "completed" && (
            <>
              <button
                onClick={() => handleEdit(row._id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-warning text-white shadow-md transition hover:scale-105"
                title="Edit Process"
              >
                <FiEdit size={14} />
              </button>
              <button
                onClick={() => handlepopup(row._id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white shadow-md transition hover:scale-105"
                title="Delete"
              >
                <FiTrash size={14} />
              </button>
            </>
          )}
          {row?.status !== "waiting_schedule" && row?.status !== "completed" && (
            <button
              onClick={() => handleAddQuantity(row._id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:scale-105"
              title="Add Quantity"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <Breadcrumb pageName="View Process" parentName="Process" />

      <div className="mt-6 rounded-lg bg-white p-5 shadow-lg dark:bg-boxdark md:p-6">
        <ToastContainer position="top-center" closeOnClick pauseOnHover />

        {loading ? (
          <div className="flex justify-center py-12">
            <BallTriangle height={80} width={80} color="#3B82F6" />
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={orderConfirmationNo}
                  onChange={(e) => setOrderConfirmationNo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input sm:w-56"
                >
                  <option value="">All Active Orders</option>
                  {ocNoArr.map((oc: any, i) => (
                    <option key={i} value={oc?.orderConfirmationNo}>{oc?.orderConfirmationNo}</option>
                  ))}
                </select>

                <div className="relative w-64">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="h-10 w-full rounded-lg border border-stroke bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input shadow-sm"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedRows.length > 0 && (
                  <button
                    onClick={handleMultipleRowsDelete}
                    className="flex items-center gap-2 rounded bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-opacity-90"
                  >
                    <Trash2 size={16} /> Delete ({selectedRows.length})
                  </button>
                )}
                <button
                  onClick={() => router.push('/process/add')}
                  className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-opacity-90"
                >
                  <FiPlus size={16} /> New Process
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardDataStats title="Active Processes" total={`${summary.active}`} rate="">
                <Activity className="text-primary" size={22} />
              </CardDataStats>
              <CardDataStats title="Completed" total={`${summary.completed}`} rate="">
                <CheckCircle className="text-success" size={22} />
              </CardDataStats>
              <CardDataStats title="Waiting Schedule" total={`${summary.waiting_schedule}`} rate="">
                <Clock className="text-warning" size={22} />
              </CardDataStats>
              <CardDataStats title="On Hold" total={`${summary.down_time_hold}`} rate="">
                <PauseCircle className="text-danger" size={22} />
              </CardDataStats>
            </div>

            {/* Table */}
            <div className="mt-8 overflow-hidden rounded-lg border border-stroke shadow-sm dark:border-strokedark">
              <DataTable
                columns={columns as any}
                data={displayData}
                pagination
                selectableRows
                onSelectedRowsChange={handleRowSelected}
                highlightOnHover
                pointerOnHover
                fixedHeader
                fixedHeaderScrollHeight="600px"
                customStyles={{
                  headCells: {
                    style: {
                      fontWeight: "bold",
                      backgroundColor: "#F9FAFB",
                      color: "#374151",
                      padding: "16px",
                    },
                  },
                  rows: {
                    style: {
                      minHeight: "60px",
                    },
                  },
                  cells: {
                    style: {
                      padding: "16px",
                    },
                  },
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Popups & Modals */}
      {showMarkAsCompletePopup && (
        <ConfirmationPopup
          message="Are you sure you want to mark this process as completed?"
          onConfirm={handleSubmitMarkAsCompleted}
          onCancel={() => setShowMarkAsCompletePopup(false)}
        />
      )}
      {showPopup && (
        <ConfirmationPopup
          message="Are you sure you want to delete this process?"
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}

      <Modal isOpen={isAddQuantityModel} onSubmit={handleSubmitQuantity} onClose={() => setIsAddQuantityModel(false)} title="Add Production Quantity">
        <div className="pb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
            Quantity to Add
          </label>
          <input
            type="number"
            value={addMoreQuantity}
            onChange={(e) => setMoreQuantity(Number(e.target.value))}
            placeholder="Enter quantity"
            className="w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ViewProcess;
