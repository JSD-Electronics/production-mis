"use client";
import React from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewProcess, deleteProcess,deleteMultipleProcesses } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewProcess = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [shiftData, setShiftData] = React.useState<Stages[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getProcess();
  }, []);
  const getProcess = async () => {
    try {
      let result = await viewProcess();
      setShiftData(result.Processes);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteProcess(productId);
      toast.success("Process deleted successfully!");
      setShowPopup(false);
      getProcess();
    } catch (error) {
      console.error("Error deleting Process:", error);
    }
  };
  const handleEdit = (id: string) => {
    router.push(`/process/edit/${id}`);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleProcesses(selectedIds);
      setSelectedRows([]);
      toast.success("Shift(s) Deleted Successfully!");
      getProcess();
    } catch (error) {
      console.error("Error Deleting Shift(s):", error);
    }
  };
  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: Shifts, index: number) => index + 1,
      sortable: true,
    },
    {
        name: "Order confirmation no",
        selector: (row: Shifts) => row?.orderConfirmationNo,
        sortable: true,
    },
    {
      name: "Name",
      selector: (row: Shifts) => row.name,
      sortable: true,
    },

    {
      name: "Quantity",
      selector: (row: Shifts) => row?.
      quantity,
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: Shifts) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Updated At",
      selector: (row: Shifts) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: Shifts) => (
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
            onClick={() => handlepopup(row._id)}
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
      {/* Breadcrumb with more padding and background color */}
      <Breadcrumb pageName="View Process" parentName="Process" />
      <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        {loading ? (
          <div className="flex justify-center">
            <BallTriangle
              height={100}
              width={100}
              color="#4fa94d"
              ariaLabel="loading"
            />
          </div>
        ) : (
          <>
            <div className="mb-4 mt-4 text-right">
              <button
                onClick={handleMultipleRowsDelete}
                disabled={selectedRows.length === 0}
                className={`rounded bg-danger px-4 py-2 font-semibold text-white ${
                  selectedRows.length === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-red-700"
                }`}
              >
                Delete
              </button>
            </div>
            <DataTable
              className="dark:bg-bodyDark"
              columns={columns}
              data={shiftData}
              pagination
              selectableRows
              onSelectedRowsChange={handleRowSelected}
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
              }}
            />
          </>
        )}
        {showPopup && (
          <ConfirmationPopup
            message="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete()}
            onCancel={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ViewProcess;
