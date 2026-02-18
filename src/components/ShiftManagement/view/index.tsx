"use client";

import React, { useEffect, useState, useMemo } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Clock,
  Coffee,
  Calendar,
  AlertCircle,
  LayoutGrid
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import ConfirmationPopup from "@/components/Confirmation/page";
import { viewShift, deleteShift, deleteMultipleShifts } from "@/lib/api";

import "react-toastify/dist/ReactToastify.css";

interface ShiftInterval {
  startTime: string;
  endTime: string;
  breakTime: boolean;
}

interface Shifts {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  totalBreakTime: string;
  intervals: ShiftInterval[];
  createdAt: string;
  updatedAt: string;
}

const ViewShift = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftData, setShiftData] = useState<Shifts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Shifts[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const result = await viewShift();
      setShiftData(result.Shifts || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast.error("Failed to load shifts.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShiftId) return;
    try {
      await deleteShift(selectedShiftId);
      toast.success("Shift deleted successfully!");
      setShowPopup(false);
      fetchShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast.error("Failed to delete shift.");
    }
  };

  const handleMultipleDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      if (selectedIds.length === 0) return;

      await deleteMultipleShifts(selectedIds);
      setSelectedRows([]);
      toast.success("Selected shift(s) deleted successfully!");
      fetchShifts();
    } catch (error) {
      console.error("Error deleting multiple shifts:", error);
      toast.error("Failed to delete selected shifts.");
    }
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return shiftData.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shiftData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalShifts = shiftData.length;
    return { totalShifts };
  }, [shiftData]);

  /** Table Columns */
  const columns: TableColumn<Shifts>[] = [
    {
      name: "Shift Name",
      sortable: true,
      grow: 2,
      cell: (row: Shifts) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock size={16} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-[11px]">
              {row.name || "Unnamed Shift"}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Time Span",
      sortable: true,
      cell: (row: Shifts) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] dark:bg-white/5 uppercase">Start</span>
            {row?.startTime || row?.intervals?.[0]?.startTime || "-"}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] dark:bg-white/5 uppercase">End</span>
            {row?.endTime || row?.intervals?.[row?.intervals?.length - 1]?.endTime || "-"}
          </div>
        </div>
      ),
    },
    {
      name: "Break Details",
      cell: (row: Shifts) => {
        const breakSlots = row.intervals?.filter((slot) => slot.breakTime);
        return (
          <div className="flex flex-col gap-1 py-2">
            {breakSlots && breakSlots.length > 0 ? (
              breakSlots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                  <Coffee size={12} className="text-amber-500" />
                  {slot.startTime} - {slot.endTime}
                </div>
              ))
            ) : (
              <span className="text-xs font-medium text-gray-400">No Breaks</span>
            )}
          </div>
        );
      },
    },
    {
      name: "Last Updated",
      sortable: true,
      cell: (row: Shifts) => (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <Calendar size={12} />
          {new Date(row.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row: Shifts) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/shift-management/edit/${row._id}`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white shadow-sm"
            title="Edit Shift"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedShiftId(row._id);
              setShowPopup(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
            title="Delete Shift"
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">View Shifts</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Configure and manage manufacturing work shifts and break schedules.</p>
        </div>
        <button
          onClick={() => router.push("/shift-management/add")}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          New Shift
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mr-5">
            <LayoutGrid size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Defined Shifts</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalShifts}</h3>
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
              placeholder="Search by shift name..."
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
              onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No shifts discovered yet.</p>
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
          message="Confirm deletion of this manufacturing shift? This may affect production logs."
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default ViewShift;
