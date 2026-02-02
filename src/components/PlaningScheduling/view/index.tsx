"use client";
import React from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewPlaning, deletePlan } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewShift = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [planingData, setPlaningData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getPlanningAndScheduling();
  }, []);
  const getPlanningAndScheduling = async () => {
    try {
      let result = await viewPlaning();
      setPlaningData(result.plans);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deletePlan(productId);
      toast.success("Planing & Scheduling deleted successfully!");
      setShowPopup(false);
      getPlanningAndScheduling();
    } catch (error) {
      console.error("Error deleting Shift:", error);
    }
  };
  const handleEdit = (id: string) => {
    router.push(`/planing-scheduling/edit/${id}`);
  };
  const handleLogs = (id: string) => {
    router.push(`/process/logs/${id}`);
  };
  const handleView = (id: string) => {
    router.push(`/planing-scheduling/viewPlaning/${id}`);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultiplePlaning(selectedIds);
      setSelectedRows([]);
      toast.success("planing(s) Deleted Successfully!!");
      getPlanningAndScheduling();
    } catch (error) {
      console.error("Error Deleting Planing(s):", error);
    }
  };
  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: planingData, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Process Name",
      selector: (row: planingData) => row?.processName,
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row: planingData) => row?.startDate,
      sortable: true,
    },
    {
      name: "Status",
      sortable: true,
      cell: (row: Inventory) => {
        const statusStyles = {
          waiting_schedule: {
            label: "Waiting Schedule",
            backgroundColor: "#f39c12",
          },
          Waiting_Kits_allocation: {
            label: "Waiting Kits Allocation",
            backgroundColor: "#9b59b6",
          },
          Waiting_Kits_approval: {
            label: "Waiting Kits Approval",
            backgroundColor: "#1abc9c",
          },
          waiting_for_line_feeding: {
            label: "Waiting For Line Feeding",
            backgroundColor: "#3498db",
          },
          waiting_for_kits_confirmation: {
            label: "Waiting For Kits Confirmation",
            backgroundColor: "#e67e22",
          },
          active: {
            label: "Active",
            backgroundColor: "#f1c40f",
          },
          down_time_hold: {
            label: "Down Time Hold",
            backgroundColor: "#e74c3c",
          },
          completed: {
            label: "Completed",
            backgroundColor: "#2ecc71",
          },
          default: {
            label: "Process Created",
            backgroundColor: "#95a5a6",
          },
        };
        const status = row?.status;
        const { label, backgroundColor } = statusStyles[status] || statusStyles.default;
        return (
          <span
            style={{
              backgroundColor,
              color: "#fff",
              padding: "5px 5px",
              borderRadius: "5px",
              fontSize: "11px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: planingData) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleView(row._id)}
            className="flex transform items-center justify-center rounded-full bg-success p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-success"
          >
            <svg
              fill="#ffffff"
              width="14px"
              height="14px"
              viewBox="0 0 30 30"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#ffffff"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M14.474 10.002c-1.1 0-2.157.462-2.966 1.195-.925.84-1.508 2.047-1.508 3.294 0 .665 1 .688 1 .024 0-.965.466-1.93 1.182-2.58.627-.57 1.47-.908 2.318-.934.655 0 .672-.998-.026-.998zM15 8c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 1c3.32 0 6 2.68 6 6s-2.68 6-6 6-6-2.68-6-6 2.68-6 6-6zm0-3c-4.883 0-8.625 1.953-11.13 4.02-1.254 1.033-2.2 2.095-2.843 2.968-.32.437-.565.826-.736 1.15-.17.325-.29.52-.29.862 0 .34.12.537.29.86.172.326.416.715.737 1.152.642.873 1.59 1.935 2.842 2.968C6.374 22.047 10.116 24 15 24c4.883 0 8.625-1.953 11.13-4.02 1.254-1.033 2.2-2.095 2.843-2.968.32-.437.565-.826.736-1.15.17-.325.29-.52.29-.862 0-.34-.12-.537-.29-.86-.172-.326-.416-.715-.737-1.152-.642-.873-1.59-1.935-2.842-2.968C23.626 7.953 19.884 6 15 6zm0 1c4.617 0 8.125 1.838 10.494 3.79 1.185.978 2.082 1.984 2.674 2.79.296.403.515.758.656 1.024.175.327.136.55 0 .792-.147.263-.36.62-.656 1.024-.592.806-1.49 1.812-2.674 2.79C23.124 21.16 19.617 23 15 23s-8.125-1.838-10.494-3.79c-1.185-.978-2.082-1.984-2.674-2.79-.296-.403-.51-.76-.656-1.024-.14-.25-.17-.485 0-.792.145-.264.36-.62.656-1.024.592-.806 1.49-1.812 2.674-2.79C6.876 8.84 10.383 7 15 7z"></path>
              </g>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleLogs(row.selectedProcess)}
            className="bg-gray-100 hover:bg-gray-500 flex transform items-center justify-center rounded-full p-1 text-white shadow-lg transition-transform hover:scale-105"
          >
            <svg width="14px" height="14px" viewBox="0 0 16 16" fill="none">
              <g fill="#000000">
                <path d="M5.314 1.256a.75.75 0 01-.07 1.058L3.889 3.5l1.355 1.186a.75.75 0 11-.988 1.128l-2-1.75a.75.75 0 010-1.128l2-1.75a.75.75 0 011.058.07zM7.186 1.256a.75.75 0 00.07 1.058L8.611 3.5 7.256 4.686a.75.75 0 10.988 1.128l2-1.75a.75.75 0 000-1.128l-2-1.75a.75.75 0 00-1.058.07zM2.75 7.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75zM2 11.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2.75 13.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
              </g>
            </svg>
          </button>
          {row.status != "completed" && (
            <>
              <button
                type="button"
                onClick={() => handleEdit(row._id)}
                className="transform rounded-full bg-blue-500 p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
              >
                <FiEdit size={14} />
              </button>
              <button
                type="button"
                onClick={() => handlepopup(row._id)}
                className="transform rounded-full bg-danger p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-danger"
              >
                <FiTrash size={14} />
              </button>
            </>

          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Breadcrumb with more padding and background color */}
      <Breadcrumb
        pageName="View Planing & Scheduling"
        parentName="Planing & Scheduling Management"
      />
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
                className={`rounded bg-danger px-4 py-2 font-semibold text-white ${selectedRows.length === 0
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
              data={planingData}
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
            message="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete()}
            onCancel={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ViewShift;
