"use client";
import React, { useState } from "react";
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
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./process.css";
const ViewProcess = () => {
  const [showMarkAsCompletePopup, setShowMarkAsCompletePopup] =
    React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [shiftData, setShiftData] = React.useState<Stages[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [isAddQuantityModel, setIsAddQuantityModel] = useState(false);
  const [addMoreQuantity, setMoreQuantity] = useState(0);
  const [selectedProcessID, setSelectedProcessID] = useState("");
  const [id, setID] = useState("");
  const [orderConfirmationNo, setOrderConfirmationNo] = useState("");
  const [ocNoArr, setOcNoArr] = useState([]);
  const closeAddQuantityModel = () => {
    setIsAddQuantityModel(false);
  };
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getProcess();
    getOrderConfirmationNumbersList();
  }, []);
  const getOrderConfirmationNumbersList = async () => {
    try {
      let response = await getOrderConfirmationNumers();
      setOcNoArr(response.getOrderConfirmationNo);
    } catch (error) {
      console.log("Error Fethcing Order Confirmation Numbers", error?.message);
    }
  };
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
      getProcess();
      toast.success("Process deleted successfully!");
      setShowPopup(false);
      
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
  const handleLogs = (id: string) => {
    window.open(`/process/logs/${id}`, "_blank");
  };
  const handleViewPlaning = (id: string) => {
    window.open(`/planing-scheduling/viewPlaning/${id}`, "_blank");
  };
  const handleAddPlaning = (id: string) => {
    window.open(`/planing-scheduling/add/${id}`, "_blank");
  };
  const handleAddQuantity = (id: string) => {
    setID(id);
    setIsAddQuantityModel(true);
  };
  const handleSubmitQuantity = async () => {
    try {
      let formData = new FormData();
      formData.append("quantity", addMoreQuantity);
      let response = await updateQuantity(formData, id);
      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      const formData3 = new FormData();
      formData3.append("action", "PROCESS_EXTENDED");
      formData3.append("processId", id || "");
      formData3.append("userId", userDetails?._id || "");
      formData3.append(
        "description",
        `${addMoreQuantity} Quantity is added into process ${name}`,
      );
      try {
        const logResult = await createProcessLogs(formData3);
        if (logResult && logResult.status === 200) {
          toast.success("Process updated successfully!");
          setID(id);
          getProcess();
        } else {
          console.error("Error Creating Process Logs");
        }
      } catch (error) {
        console.error("Error creating plan logs: ", error);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
    setIsAddQuantityModel(false);
  };
  const handleMarkAsCompleteButton = (id: String) => {
    setShowMarkAsCompletePopup(true);
    setSelectedProcessID(id);
  };
  const handleSubmitMarkAsCompleted = async () => {
    try {
      let filteredProcess = shiftData.filter(
        (value) => value._id === selectedProcessID,
      );
      let formData = new FormData();
      let formData3 = new FormData();
      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      formData.append("status", "completed");
      let result = await updateMarkAsComplete(formData, selectedProcessID);
      formData3.append("action", "PROCESS_EXTENDED");
      formData3.append("processId", selectedProcessID || "");
      formData3.append("userId", userDetails?._id || "");
      formData3.append(
        "description",
        `${filteredProcess[0].name} is marked as completed by ${userDetails?.name}`,
      );
      const logResult = await createProcessLogs(formData3);
      if (logResult && logResult.status === 200) {
        toast.success("Process updated successfully!");
        setID(id);
        setShowMarkAsCompletePopup(false);
        getProcess();
      } else {
        console.error("Error Creating Process Logs");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };
  const handleSubmitFilter = async () => {
    let data = shiftData.filter((value, index) => {
      value.orderConfirmationNo != orderConfirmationNo;
    });
    setShiftData(data);
  };
  const handleClearFilter = async () => {
    setOrderConfirmationNo("");
    setShiftData([]);
    getProcess();
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
      name: "Process ID",
      selector: (row: Shifts) => row?.processID,
      sortable: true,
    },
    {
      name: "Product Name",
      selector: (row: Shifts) => row?.productName,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row: Shifts) => row.name,
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row: Shifts) => row?.quantity,
      sortable: true,
    },
    {
      name: "Schedule",
      selector: (row: Shifts) =>
        row.status != "waiting_schedule" ? (
          <>
            <button
              onClick={() => handleViewPlaning(row.planing._id)}
              className="rounded bg-blue-500 px-3 py-1 text-white"
              data-tooltip-id="view-planing-tooltip"
              data-tooltip-content="View Planning"
            >
              <FiEye fontSize={"16"} />
            </button>
            <Tooltip id="view-planing-tooltip" place="top" />
          </>
        ) : (
          <>
            <button
              onClick={() => handleAddPlaning(row?._id)}
              className="rounded bg-blue-500 px-3 py-1 text-white"
              data-tooltip-id="add-planing-tooltip"
              data-tooltip-content="Add Planning"
            >
              <FiPlus fontSize={"16"} />
            </button>
            <Tooltip id="add-planing-tooltip" place="top" />
          </>
        ),
      sortable: true,
    },
    {
      name: "Issued Kits",
      selector: (row: Shifts) => row?.issuedKits,
      sortable: true,
    },
    {
      name: "Issued Cartons",
      selector: (row: Shifts) => row?.issuedCartons || 0,
      sortable: true,
    },
    {
      name: "FG to Store",
      selector: (row: Shifts) => row?.fgToStore,
      sortable: true,
    },
    {
      name: "Dispatch Status",
      selector: (row: Shifts) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-normal break-words ${
            row?.dispatchStatus === "dispatched"
              ? "text-green-100"
              : "text-danger"
          }`}
        >
          {row?.dispatchStatus}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Delivery Status",
      selector: (row: Shifts) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-normal break-words ${
            row?.deliverStatus === "delivered"
              ? "text-green-100"
              : "text-yellow-700"
          }`}
        >
          {row?.deliverStatus}
        </span>
      ),
      sortable: true,
    }, 
    {
      name: "Mark As Complete",
      selector: (row: Shifts) =>
        row?.status == "active" && (
          <button
            type="button"
            onClick={() => handleMarkAsCompleteButton(row?._id)}
            className="flex items-center justify-between gap-1 rounded-md bg-green-500 px-3 py-1 text-white transition hover:bg-green-500"
          >
            <svg
              width="15px"
              height="15px"
              viewBox="0 0 24 24"
              fill="none"
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
                {" "}
                <path
                  d="M4 12.6111L8.92308 17.5L20 6.5"
                  stroke="#ffffff"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>{" "}
              </g>
            </svg>{" "}
          </button>
        ),
      sortable: true,
    },
    {
      name: "ADD More Quantity",
      selector: (row: Shifts) =>
        row?.status !== "waiting_schedule" && row?.status !== "completed" ? (
          <button
            type="button"
            onClick={() => handleAddQuantity(row._id)}
            className="flex items-center justify-between gap-1 rounded-md bg-blue-700 px-3 py-1 text-white transition hover:bg-blue-600"
          >
            <svg
              fill="#ffffff"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              width="10px"
              height="10px"
              viewBox="0 0 45.402 45.402"
            >
              <g>
                <path
                  d="M41.267,18.557H26.832V4.134C26.832,1.851,24.99,0,22.707,0c-2.283,0-4.124,1.851-4.124,4.135v14.432H4.141
                c-2.283,0-4.139,1.851-4.138,4.135c-0.001,1.141,0.46,2.187,1.207,2.934c0.748,0.749,1.78,1.222,2.92,1.222h14.453V41.27
                c0,1.142,0.453,2.176,1.201,2.922c0.748,0.748,1.777,1.211,2.919,1.211c2.282,0,4.129-1.851,4.129-4.133V26.857h14.435
                c2.283,0,4.134-1.867,4.133-4.15C45.399,20.425,43.548,18.557,41.267,18.557z"
                />
              </g>
            </svg>{" "}
            Add
          </button>
        ) : null,
    },
    {
      name: "Status",
      selector: (row: Shifts) => row?.status,
      sortable: true,
      cell: (row: Inventory) => {
        const statusStyles = {
          waiting_schedule: {
            label: "Waiting Schedule",
            backgroundColor: "#f39c12",
          },
          Waiting_Kits_allocation: {
            label: "Waiting Kits Allocation",
            backgroundColor: "#6c757d",
          },
          Waiting_Kits_approval: {
            label: "Waiting Kits Approval",
            backgroundColor: "#17a2b8",
          },
          active: {
            label: "Active",
            backgroundColor: "#ffc107",
          },
          down_time_hold: {
            label: "Down Time Hold",
            backgroundColor: "#dc3545",
          },
          completed: {
            label: "Completed",
            backgroundColor: "#248f0d",
          },
          default: {
            label: "Process Created",
            backgroundColor: "#343a40",
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
    {
      name: "Actions",
      cell: (row: Shifts) => (
        <div className="flex items-center space-x-1">
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => handleLogs(row._id)}
            className="bg-blue hover:bg-blue flex transform items-center justify-center rounded-full p-2 text-white shadow-lg transition-transform hover:scale-105"
          >
            <svg width="14px" height="14px" viewBox="0 0 16 16" fill="none">
              <g fill="#000000">
                <path d="M5.314 1.256a.75.75 0 01-.07 1.058L3.889 3.5l1.355 1.186a.75.75 0 11-.988 1.128l-2-1.75a.75.75 0 010-1.128l2-1.75a.75.75 0 011.058.07zM7.186 1.256a.75.75 0 00.07 1.058L8.611 3.5 7.256 4.686a.75.75 0 10.988 1.128l2-1.75a.75.75 0 000-1.128l-2-1.75a.75.75 0 00-1.058.07zM2.75 7.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75zM2 11.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2.75 13.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
              </g>
            </svg>
          </button>
          {row?.status != "completed" && (
            <>
              <button
                onClick={() => handleEdit(row._id)}
                className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
                data-tooltip-id="edit-process-tooltip"
                data-tooltip-content="Edit Process"
              >
                <FiEdit size={16} />
              </button>
              <Tooltip id="edit-process-tooltip" place="top" />

              {/* Delete Button */}
              <button
                onClick={() => handlepopup(row._id)}
                data-tooltip-id="delete-process-tooltip"
                data-tooltip-content="Delete Process"
                className="transform rounded-full bg-danger p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-danger"
              >
                <FiTrash size={16} />
              </button>
            </>
          )}
          <Tooltip id="delete-process-tooltip" place="top" />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
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
            <div className="flex justify-between">
              <div className="my-1 flex items-center justify-center gap-2">
                <select
                  value={orderConfirmationNo || ""}
                  onChange={(e) => setOrderConfirmationNo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-stroke bg-transparent px-4 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                >
                  <option value="" className="text-body dark:text-bodydark">
                    Please Select
                  </option>
                  {ocNoArr.map((oc, index) => (
                    <option
                      key={index}
                      value={oc?.orderConfirmationNo}
                      className="text-body dark:text-bodydark"
                    >
                      {oc?.orderConfirmationNo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSubmitFilter}
                  className={`h-8 rounded bg-primary px-3 font-semibold text-white`}
                >
                  <svg
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                        stroke="#ffffff"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{" "}
                    </g>
                  </svg>
                </button>
                {orderConfirmationNo != "" && (
                  <button
                    onClick={handleClearFilter}
                    className="h-8 rounded px-2 font-semibold text-info underline"
                  >
                    clear
                  </button>
                )}
              </div>
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
                cells: {
                  style: {
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                    lineHeight: "1.4",
                    maxWidth: "200px",
                  },
                },
              }}
            />
          </>
        )}
        {showMarkAsCompletePopup && (
          <ConfirmationPopup
            message="Are you sure you want to Mark as Completed this Process?"
            onConfirm={() => handleSubmitMarkAsCompleted()}
            onCancel={() => setShowMarkAsCompletePopup(false)}
          />
        )}
        {showPopup && (
          <ConfirmationPopup
            message="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete()}
            onCancel={() => setShowPopup(false)}
          />
        )}
      </div>
      <Modal
        isOpen={isAddQuantityModel}
        onSubmit={handleSubmitQuantity}
        onClose={closeAddQuantityModel}
        title={"ADD Quantity Production"}
      >
        <div className="pb-3">
          <div className="justify-between">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Quantity
            </label>
            <div className="flex items-center  gap-3">
              <input
                type="number"
                value={addMoreQuantity}
                onChange={(e) => setMoreQuantity(e.target.value)}
                placeholder="Enter Quantity"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ViewProcess;
