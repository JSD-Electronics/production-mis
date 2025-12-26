"use client";

import React, { useEffect, useState, useCallback } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationPopup from "@/components/Confirmation/page";
import { viewRoom, deleteRoomPlan, deleteMultipleRoomPlan } from "@/lib/api";
import { Stages } from "@/types/stage";

import "react-toastify/dist/ReactToastify.css";

const ViewProduct = () => {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [stageData, setStageData] = useState<Stages[]>([]);
  const [selectedRows, setSelectedRows] = useState<Stages[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showMultipleDeletePopup, setShowMultipleDeletePopup] = useState(false);
  const [productId, setProductId] = useState("");

  /** Fetch Room Plans */
  const getStages = useCallback(async () => {
    try {
      const result = await viewRoom();
      setStageData(result.RoomPlan || []);
    } catch (error) {
      console.error("Error fetching stages:", error);
      toast.error("Failed to fetch room plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getStages();
  }, [getStages]);

  /** Single Delete */
  const handleDelete = async () => {
    try {
      await deleteRoomPlan(productId);
      toast.success("Room deleted successfully!");
      setShowPopup(false);
      getStages();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room.");
    }
  };

  /** Multiple Delete */
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleRoomPlan(selectedIds);
      toast.success("Selected rooms deleted successfully!");
      setSelectedRows([]);
      setShowMultipleDeletePopup(false);
      getStages();
    } catch (error) {
      console.error("Error deleting multiple rooms:", error);
      toast.error("Failed to delete selected rooms.");
    }
  };

  /** Table Columns */
  const columns: TableColumn<Stages>[] = [
    {
      name: "ID",
      selector: (_, index) => index + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => row?.floorName,
      sortable: true,
    },
    {
      name: "No of Lines",
      selector: (row) => row?.lines?.length,
      sortable: true,
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
            onClick={() => router.push(`/roomMapping/edit/${row._id}`)}
            className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition hover:scale-105 hover:bg-blue-600"
          >
            <FiEdit size={16} />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => {
              setProductId(row._id);
              setShowPopup(true);
            }}
            className="transform rounded-full bg-danger p-2 text-white shadow-lg transition hover:scale-105 hover:bg-danger"
          >
            <FiTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Breadcrumb */}
      <Breadcrumb pageName="View Room" parentName="Room Management" />

      <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
        <ToastContainer position="top-center" />

        {loading ? (
          <div className="flex justify-center">
            <BallTriangle height={100} width={100} color="#4fa94d" ariaLabel="loading" />
          </div>
        ) : (
          <>
            {/* Bulk Delete Button */}
            <div className="mb-4 text-right">
              <button
                onClick={() => setShowMultipleDeletePopup(true)}
                disabled={selectedRows.length === 0}
                className={`rounded bg-danger px-4 py-2 font-semibold text-white transition ${
                  selectedRows.length === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-red-600"
                }`}
              >
                Delete Selected
              </button>
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={stageData}
              pagination
              selectableRows
              onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
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
                  style: { padding: "12px", border: "none" },
                },
              }}
            />
          </>
        )}

        {/* Confirmation Popups */}
        {showPopup && (
          <ConfirmationPopup
            message="Are you sure you want to delete this room?"
            onConfirm={handleDelete}
            onCancel={() => setShowPopup(false)}
          />
        )}
        {showMultipleDeletePopup && (
          <ConfirmationPopup
            message="Are you sure you want to delete the selected rooms?"
            onConfirm={handleMultipleRowsDelete}
            onCancel={() => setShowMultipleDeletePopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ViewProduct;
