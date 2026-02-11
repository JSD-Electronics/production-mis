"use client";

import React, { useEffect, useState, useMemo } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Calendar,
  Palmtree,
  Clock,
  AlertCircle
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import ConfirmationPopup from "@/components/Confirmation/page";
import {
  fetchHolidays,
  deleteHolidays,
  deleteMultipleHoliday,
  createHoliday
} from "@/lib/api";
import Modal from "@/components/Modal/page";

import "react-toastify/dist/ReactToastify.css";

const ViewHoliday = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  const [showPopup, setShowPopup] = useState(false);
  const [holidayId, setHolidayId] = useState("");
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };

  useEffect(() => {
    getHolidays();
  }, []);

  const getHolidays = async () => {
    try {
      setLoading(true);
      const result = await fetchHolidays();
      setHolidays(result.holidays || []);
    } catch (error) {
      console.error("Error Fetching Holidays:", error);
      toast.error("Failed to fetch holidays.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHolidays(holidayId);
      toast.success("Holiday deleted successfully!");
      setShowPopup(false);
      getHolidays();
    } catch (error) {
      console.error("Error deleting Holiday:", error);
      toast.error("Failed to delete holiday.");
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleEdit = (data: any) => {
    setHolidayName(data.holidayName);
    setHolidayDate(formatDate(data.holidayDate));
    setHolidayId(data._id);
    setIsModalOpen(true);
  };

  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleHoliday(selectedIds);
      toast.success("Holiday(s) deleted successfully!");
      setSelectedRows([]);
      getHolidays();
    } catch (error) {
      console.error("Error Deleting Holiday(s):", error);
      toast.error("Failed to delete selected holidays.");
    }
  };

  const handleAddHoliday = () => {
    setHolidayName("");
    setHolidayDate("");
    setHolidayId("");
    setIsModalOpen(true);
  };

  const handlesubmitHoliday = async () => {
    if (!holidayName || !holidayDate) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("holidayName", holidayName);
      formData.append("holidayDate", holidayDate);
      if (holidayId !== "") {
        formData.append("holidayId", holidayId);
      }
      const result = await createHoliday(formData);
      if (result && result.status === 200) {
        toast.success(result.message || "Holiday updated successfully");
        setIsModalOpen(false);
        getHolidays();
      } else {
        throw new Error(result.message || "Failed to process holiday");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    }
  };

  const handlepopup = (id: string) => {
    setHolidayId(id);
    setShowPopup(true);
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    if (!Array.isArray(holidays)) return [];
    return holidays.filter((item: any) =>
      (item.holidayName || "").toLowerCase().includes((searchTerm || "").toLowerCase())
    );
  }, [holidays, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalHolidays = Array.isArray(holidays) ? holidays.length : 0;
    const upcomingHolidays = Array.isArray(holidays)
      ? holidays.filter((h: any) => h.holidayDate && new Date(h.holidayDate) >= new Date()).length
      : 0;
    return { totalHolidays, upcomingHolidays };
  }, [holidays]);

  const columns: TableColumn<any>[] = [
    {
      name: "Holiday Name",
      sortable: true,
      grow: 2,
      cell: (row: any) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palmtree size={16} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-[11px]">
              {row.holidayName || "Unnamed Holiday"}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Date",
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Calendar size={14} className="text-primary" />
          <span className="text-xs font-bold">
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(row.holidayDate))}
          </span>
        </div>
      ),
    },
    {
      name: "Created At",
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <Clock size={12} />
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white shadow-sm"
            title="Edit Holiday"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => handlepopup(row._id)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
            title="Delete Holiday"
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Holiday</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Manage and schedule company-wide holidays and observances.</p>
        </div>
        <button
          onClick={handleAddHoliday}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Add Holiday
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mr-5">
            <Palmtree size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Holidays</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalHolidays}</h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mr-5">
            <Calendar size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Upcoming Events</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.upcomingHolidays}</h3>
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
              placeholder="Search by holiday name..."
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
              onSelectedRowsChange={handleRowSelected}
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No holidays scheduled yet.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal for Add/Update Holiday */}
      <Modal
        isOpen={isModalOpen}
        onSubmit={handlesubmitHoliday}
        onClose={closeModal}
        title={holidayId ? "Modify Holiday" : "Provision Holiday"}
      >
        <div className="space-y-6 py-4 px-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Holiday Designation
            </label>
            <div className="relative">
              <Palmtree className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g. Independence Day"
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:text-white dark:border-strokedark"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Observance Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:text-white dark:border-strokedark"
              />
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Confirmation Popup */}
      {showPopup && (
        <ConfirmationPopup
          message="This action will permanently remove this holiday from the schedule. Continue?"
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default ViewHoliday;
