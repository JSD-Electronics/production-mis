"use client";
import React, { useEffect, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewShift, deleteShift, deleteMultipleShifts } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ShiftInterval {
  startTime: string;
  endTime: string;
  breakTime: boolean;
}

interface Shifts {
  _id: string;
  name: string;
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

  const handleEdit = (id: string) => {
    router.push(`/shift-management/edit/${id}`);
  };

  const openDeletePopup = (id: string) => {
    setSelectedShiftId(id);
    setShowPopup(true);
  };

  // Define table columns
  const columns: TableColumn<Shifts>[] = [
    {
      name: "ID",
      selector: (_row, index) => index + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Start Time",
      selector: (row) => row?.intervals?.[0]?.startTime || "-",
      sortable: true,
    },
    {
      name: "End Time",
      selector: (row) => row?.intervals?.[row.intervals.length - 1]?.endTime || "-",
      sortable: true,
    },
    {
      name: "Break Time",
      cell: (row) => {
        const breakSlots = row.intervals
          ?.filter((slot) => slot.breakTime)
          ?.map((slot) => `(${slot.startTime} - ${slot.endTime})`)
          ?.join("\n");
        return (
          <div style={{ whiteSpace: "pre-line" }}>{breakSlots || "-"}</div>
        );
      },
    },
    {
      name: "Created At",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Updated At",
      selector: (row) => new Date(row.updatedAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-3.5">
          {/* Edit Button */}
          <button
            onClick={() => handleEdit(row._id)}
            className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
          >
            <FiEdit size={16} />
          </button>
          {/* Delete Button */}
          <button
            onClick={() => openDeletePopup(row._id)}
            className="transform rounded-full bg-danger p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-danger"
          >
            <FiTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <Breadcrumb pageName="View Shifts" parentName="Shift Management" />
      <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
        <ToastContainer position="top-center" />
        {loading ? (
          <div className="flex justify-center">
            <BallTriangle height={100} width={100} color="#4fa94d" ariaLabel="loading" />
          </div>
        ) : (
          <>
            <div className="mb-4 mt-4 text-right">
              <button
                onClick={handleMultipleDelete}
                disabled={selectedRows.length === 0}
                className={`rounded bg-red-600 px-4 py-2 font-semibold text-white ${selectedRows.length === 0
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-red-700"
                  }`}
              >
                Delete Selected
              </button>
            </div>
            <DataTable
              columns={columns}
              data={shiftData}
              pagination
              selectableRows
              onSelectedRowsChange={({ selectedRows }) =>
                setSelectedRows(selectedRows)
              }
              highlightOnHover
              pointerOnHover
              customStyles={{
                headCells: {
                  style: {
                    fontWeight: "bold",
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                  },
                },
                rows: {
                  style: {
                    minHeight: "72px",
                    "&:hover": {
                      backgroundColor: "#f1f5f9",
                    },
                  },
                },
                pagination: {
                  style: {
                    padding: "12px",
                    border: "none",
                  },
                },
                cells: {
                  style: {
                    padding: "12px",
                    "& > div:first-child": {
                      whiteSpace: "break-spaces",
                      overflow: "hidden",
                      textOverflow: "inherit",
                    },
                  },
                },
              }}
            />
          </>
        )}
        {showPopup && (
          <ConfirmationPopup
            message="Are you sure you want to delete this shift?"
            onConfirm={handleDelete}
            onCancel={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ViewShift;
