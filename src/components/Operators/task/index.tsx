"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import { getTaskByUserId, updateStatusRecivedKitToLine } from "@/lib/api";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Eye,
  CheckCircle2,
  XCircle,
  Layers,
  MapPin,
  Clock,
  Package,
  AlertCircle,
  Search,
  CheckCircle,
  ClipboardList,
  Calendar,
  UserCheck
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";

const TaskComponent = () => {
  const router = useRouter();

  // State
  const [taskList, setTaskList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOperatorAssignedKitModel, setOperatorAssignedKitModel] = useState(false);
  const [selectRecievedId, setSelectedRecievedId] = useState("");
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [seatDetails, setSeatDetails] = useState<any>({});
  const [assignTaskDetails, setAssignTaskDetails] = useState<any>({});

  useEffect(() => {
    const userDetailsStr = localStorage.getItem("userDetails");
    if (userDetailsStr) {
      const userDetails = JSON.parse(userDetailsStr);
      getOperatorTask(userDetails._id);
    }
  }, []);

  const getOperatorTask = async (id: any) => {
    try {
      setLoading(true);
      const result = await getTaskByUserId(id);
      setTaskList(result?.task || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorRecievedKit = (data: any) => {
    setSeatDetails({});
    setSelectedRecievedId("");
    setAssignTaskDetails(data);

    data.kitRecievedSeatDetails?.forEach((value: any) => {
      if (
        data?.seatDetails?.rowNumber === value?.rowNumber &&
        data?.seatDetails?.seatNumber === value?.seatNumber
      ) {
        setSelectedProcessId(data.processId);
        setSeatDetails(value);
        setSelectedRecievedId(data.kitRecievedConfirmationId);
      }
    });
    setOperatorAssignedKitModel(true);
  };

  const updateStatusRecievedKits = async (id: string, status: string) => {
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("processId", selectedProcessId);

      if (status === "CONFIRM") {
        formData.append('processStatus', 'active');
      } else {
        formData.append("issuedKitsStatus", "REJECTED");
        formData.append('processStatus', 'waiting_for_line_feeding');
      }

      const result = await updateStatusRecivedKitToLine(id, formData);
      if (result && result.status === 200) {
        toast.success(status === "CONFIRM" ? "Kits accepted successfully!" : "Kits rejected");
        setOperatorAssignedKitModel(false);
        const userDetailsStr = localStorage.getItem("userDetails");
        if (userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          getOperatorTask(userDetails._id);
        }
      }
    } catch (error) {
      console.error("Error updating kit status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleViewProcess = (id: any) => {
    router.push(`/operators/task/${id}`);
  };

  // Memoized Calculations
  const filteredTasks = useMemo(() => {
    return taskList.filter(task =>
      task.processName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.roomDetails?.floorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [taskList, searchTerm]);

  const stats = useMemo(() => {
    const total = taskList.length;
    const active = taskList.filter(t => t.status === "active").length;
    const pendingKits = taskList.filter(t => t.kitRecievedConfirmationStatus === "PENDING").length;
    const completed = taskList.filter(t => t.status === "completed").length;
    return { total, active, pendingKits, completed };
  }, [taskList]);

  const columns = [
    {
      name: "Task Details",
      selector: (row: any) => row.processName,
      sortable: true,
      grow: 2,
      cell: (row: any) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{row.processName}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-primary" />
              <span>{row?.roomDetails?.floorName}</span>
            </div>
            {row.stageType?.toLowerCase() !== "common" && (
              <div className="flex items-center gap-1">
                <Layers size={12} className="text-amber-500" />
                <span>Seat {row?.seatDetails?.rowNumber}-{row?.seatDetails?.seatNumber}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      name: "Shift Timing",
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
            <Clock size={12} className="text-blue-500" />
            <span>{row?.ProcessShiftMappings?.startTime} - {row?.ProcessShiftMappings?.endTime}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 italic">
            <Calendar size={10} />
            {new Date(row?.planDetails?.startDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      name: "Kits Info",
      sortable: true,
      cell: (row: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
            <Package size={14} className="text-indigo-500" />
            <span>{row?.assignedKitsToOperator || 0}</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-medium tracking-tight">Units Assigned</p>
        </div>
      ),
    },
    {
      name: "Kit Status",
      selector: (row: any) => row.issuedKitsStatus,
      sortable: true,
      cell: (row: any) => {
        const statuses: Record<string, { label: string; color: string }> = {
          ISSUED: { label: "Issued", color: "bg-emerald-100 text-emerald-700 ring-emerald-500/20" },
          PARTIALLY_ISSUED: { label: "Partial", color: "bg-amber-100 text-amber-700 ring-amber-500/20" },
          REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 ring-rose-500/20" },
          NOT_ISSUED: { label: "Pending", color: "bg-gray-100 text-gray-700 ring-gray-500/20" },
        };
        const s = statuses[row.issuedKitsStatus] || { label: "Unknown", color: "bg-gray-100 text-gray-600" };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ring-1 ring-inset ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      name: "Work Status",
      selector: (row: any) => row.status,
      sortable: true,
      cell: (row: any) => {
        const statuses: Record<string, { label: string; color: string; icon: any }> = {
          active: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Clock },
          completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
          waiting_for_kits_confirmation: { label: "Confirm Kits", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
          waiting_for_line_feeding: { label: "Line Feeding", color: "bg-indigo-100 text-indigo-700", icon: Layers },
          default: { label: row.status?.replace(/_/g, " ") || "Draft", color: "bg-gray-100 text-gray-600", icon: ClipboardList }
        };
        const s = statuses[row.status] || statuses.default;
        const Icon = s.icon;
        return (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${s.color}`}>
            <Icon size={12} />
            <span className="capitalize">{s.label}</span>
          </div>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: any) => {
        if (row.status === "completed") {
          return (
            <span className="text-xs text-emerald-600 font-bold italic">Completed</span>
          );
        }

        const canView =
          row.status !== "completed" &&
          row.kitRecievedConfirmationStatus !== "ASSIGN_TO_OPERATOR" &&
          row.kitRecievedConfirmationStatus !== "REJECT";

        const needsConfirmation = row.kitRecievedConfirmationStatus !== "REJECT";

        return (
          <div className="flex items-center gap-2">
            {canView ? (
              <button
                onClick={() => handleViewProcess(row.planId)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                title="Open Task"
              >
                <Eye size={18} />
              </button>
            ) : needsConfirmation ? (
              <button
                onClick={() => handleOperatorRecievedKit(row)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition hover:bg-orange-600 hover:text-white"
                title="Verify Kits"
              >
                <UserCheck size={18} />
              </button>
            ) : (
              <span className="text-xs text-gray-400 font-medium italic">
                No Actions
              </span>
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">My Production Tasks</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Manage your assigned production processes and kit verifications.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Assignments", value: stats.total, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Currently Active", value: stats.active, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Kits Pending", value: stats.pendingKits, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Tasks Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-md">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
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
              placeholder="Search tasks or rooms..."
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
              data={filteredTasks}
              pagination
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ClipboardList size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No tasks found for today.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Kit Verification Modal */}
      <Modal
        isOpen={isOperatorAssignedKitModel}
        onSubmit={() => { }}
        onClose={() => setOperatorAssignedKitModel(false)}
        title="Verify Assigned Kits"
        submitOption={false}
      >
        <div className="space-y-6 pt-2">
          {assignTaskDetails?.stageType?.toLowerCase() !== "common" && (
            <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Assigned Workstation</p>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Row {seatDetails?.rowNumber} • Seat {seatDetails?.seatNumber}
                </h4>
              </div>
            </div>
          )}

          {/* Allocation Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4 dark:border-strokedark">
              <p className="text-xs font-bold text-gray-400 uppercase">Received Kits</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{seatDetails?.issuedKits || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 dark:border-strokedark">
              <p className="text-xs font-bold text-gray-400 uppercase">Shortage</p>
              <p className="mt-1 text-2xl font-black text-rose-600">
                {Math.max(0, (assignTaskDetails.requiredKits || 0) - (seatDetails?.issuedKits || 0))}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t dark:border-strokedark">
            <button
              onClick={() => updateStatusRecievedKits(selectRecievedId, "CONFIRM")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              <CheckCircle2 size={18} />
              Accept Kits
            </button>
            <button
              onClick={() => updateStatusRecievedKits(selectRecievedId, "REJECT")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-6 py-3 font-bold text-rose-600 border border-rose-200 transition hover:bg-rose-100 active:scale-95"
            >
              <XCircle size={18} />
              Reject
            </button>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default TaskComponent;
