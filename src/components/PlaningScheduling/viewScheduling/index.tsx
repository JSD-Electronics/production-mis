"use client";
import React from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getPlanningAndSchedulingDate, deletePlan } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewScheduling = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [planingData, setPlaningData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [selectedFilterStartDate, setSelectedFilterStartDate] = React.useState("");
  const [selectedFilterEndDate, setSelectedFilterEndDate] = React.useState("");
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getPlanningAndSchedulingDateWise();
  }, []);
  const getPlanningAndSchedulingDateWise = async () => {
    try {
      let result = await getPlanningAndSchedulingDate();
      
      setPlaningData(result.plans);
    } catch (error) {
      console.error("Error Fetching Shifts:", error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deletePlan(productId);
      toast.success("Planing & Scheduling deleted successfully!");
      setShowPopup(false);
      getPlanningAndSchedulingDateWise();
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
      // getPlanningAndSchedulingDateWise();
    } catch (error) {
      console.error("Error Deleting Planing(s):", error);
    }
  };
  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };
  const formatDateToMMDDYYYY = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const handleFilter = async () => {
    try {
      if (selectedFilterStartDate != "" && selectedFilterEndDate != "") {
        setPlaningData([]);
        let result = await getPlanningAndSchedulingDate(selectedFilterStartDate, selectedFilterEndDate);
        
        setPlaningData(result.plans);
      } else {
        alert("Choose Dates before filtering the data.")
      }
    } catch (error) {
      console.error("Error filtering data:", error);
    }
  }
  const columns = [
    {
      name: "Order Confirmation No",
      selector: (row: planingData) => row.processDetails.orderConfirmationNo,
      sortable: true,
    },
    {
      name: "Process ID",
      selector: (row: planingData) => row.processDetails.processID,
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row: planingData) => formatDateToMMDDYYYY(row.startDate),
      sortable: true,
    },

    {
      name: "Process Name",
      selector: (row: planingData) => row?.processName,
      sortable: true,
    },
    {
      name: "Target UPH",
      selector: (row: planingData) => parseInt(row?.totalUPHA),
      sortable: true,
    },
    {
      name: "Achieved UPH",
      selector: (row: planingData) => row?.consumedKit,
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
        const { label, backgroundColor } =
          statusStyles[status] || statusStyles.default;
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
            <div className="flex flex-wrap items-center justify-between">
              <div className="my-1 flex gap-2">
                <input
                  type="date"
                  value={selectedFilterStartDate}
                  onChange={(e) => setSelectedFilterStartDate(e.target.value)}
                  placeholder="Enter Downtime"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-2 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
                <input
                  type="date"
                  value={selectedFilterEndDate}
                  onChange={(e) => setSelectedFilterEndDate(e.target.value)}
                  placeholder="Enter Downtime"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-2 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
                <button onClick={handleFilter} className={`rounded bg-primary px-3 font-semibold text-white`}>
                  <svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </button>
              </div>
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

export default ViewScheduling;
