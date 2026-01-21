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
import { Search, Trash2, XCircle, Activity, CheckCircle, Clock, PauseCircle, Truck, PackageCheck } from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./process.css";
import CardDataStats from "@/components/CardDataStats";
const ViewProcess = () => {
  const [showMarkAsCompletePopup, setShowMarkAsCompletePopup] =
    React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [shiftData, setShiftData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);
  const [isAddQuantityModel, setIsAddQuantityModel] = useState(false);
  const [addMoreQuantity, setMoreQuantity] = useState(0);
  const [selectedProcessID, setSelectedProcessID] = useState("");
  const [id, setID] = useState("");
  const [orderConfirmationNo, setOrderConfirmationNo] = useState("");
  const [ocNoArr, setOcNoArr] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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
      console.log("Error Fethcing Order Confirmation Numbers", (error as any)?.message);
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
      const selectedIds = selectedRows.map((row: any) => row._id);
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
      formData.append("quantity", String(addMoreQuantity));
      formData.append("status", 'partially_issued');
      let response = await updateQuantity(formData, id);
      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      const formData3 = new FormData();
      formData3.append("action", "PROCESS_EXTENDED");
      formData3.append("processId", id || "");
      formData3.append("userId", userDetails?._id || "");
      formData3.append(
        "description",
        `${addMoreQuantity} Quantity is added into process ${(shiftData.find(s => s._id === id) as any)?.name || ""}`,
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
  const handleMarkAsCompleteButton = (id: string) => {
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
      let userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
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
    return;
  };
  const handleClearFilter = async () => {
    setOrderConfirmationNo("");
  };

  const columns = [
    {
      name: "ID",
      selector: (row: any, index?: number) => (index ?? 0) + 1,
      sortable: true,
    },
    {
      name: "Order confirmation no",
      selector: (row: any) => row?.orderConfirmationNo,
      sortable: true,
    },
    {
      name: "Process ID",
      selector: (row: any) => row?.processID,
      sortable: true,
    },
    {
      name: "Product Name",
      selector: (row: any) => row?.productName,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row: Shifts) => row.name,
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row: any) => row?.quantity,
      sortable: true,
    },
    {
      name: "Schedule",
      selector: (row: any) =>
        row.status != "waiting_schedule" ? (
          <>
            <button
              onClick={() => handleViewPlaning(row.planing._id)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-white shadow-sm transition hover:bg-primary/90"
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
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-white shadow-sm transition hover:bg-primary/90"
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
      selector: (row: Shifts) => {
        const dispatched = row?.dispatchStatus === "dispatched";
        const cls = dispatched ? "bg-green-500 text-white" : "bg-danger text-white";
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
            <Truck size={12} /> {row?.dispatchStatus}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Delivery Status",
      selector: (row: Shifts) => {
        const delivered = row?.deliverStatus === "delivered";
        const cls = delivered ? "bg-green-500 text-white" : "bg-yellow-500 text-white";
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
            <PackageCheck size={12} /> {row?.deliverStatus}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Mark As Complete",
      selector: (row: Shifts) =>
        row?.status == "active" && (
          <button
            type="button"
            onClick={() => handleMarkAsCompleteButton(row?._id)}
            className="flex items-center justify-between gap-1 rounded-md bg-green-600 px-3 py-1 text-white transition hover:bg-green-700"
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
            className="flex items-center justify-between gap-1 rounded-md bg-primary px-3 py-1 text-white transition hover:bg-primary/90"
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
        const statusClasses = {
          waiting_schedule: "bg-orange-500",
          Waiting_Kits_allocation: "bg-gray-600",
          Waiting_Kits_approval: "bg-sky-600",
          active: "bg-amber-500",
          down_time_hold: "bg-red-600",
          completed: "bg-green-600",
          default: "bg-gray-800",
        } as Record<string, string>;

        const status = row?.status;
        const labelMap = {
          waiting_schedule: "Waiting Schedule",
          Waiting_Kits_allocation: "Waiting Kits Allocation",
          Waiting_Kits_approval: "Waiting Kits Approval",
          active: "Active",
          down_time_hold: "Down Time Hold",
          completed: "Completed",
          default: "Process Created",
        } as Record<string, string>;
        const cls = statusClasses[status] || statusClasses.default;
        const label = labelMap[status] || labelMap.default;

        return (
          <span className={`inline-block rounded px-2.5 py-1 text-[11px] font-semibold text-white ${cls}`}>
            {label}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: Shifts) => (
        <div className="flex items-center gap-1">
          {/* Logs Button */}
          <button
            type="button"
            onClick={() => handleLogs(row._id)}
            className="flex items-center justify-center rounded-full bg-blue-600 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="#000">
              <g fill="currentColor">
                <path d="M5.314 1.256a.75.75 0 01-.07 1.058L3.889 3.5l1.355 1.186a.75.75 0 11-.988 1.128l-2-1.75a.75.75 0 010-1.128l2-1.75a.75.75 0 011.058.07zM7.186 1.256a.75.75 0 00.07 1.058L8.611 3.5 7.256 4.686a.75.75 0 10.988 1.128l2-1.75a.75.75 0 000-1.128l-2-1.75a.75.75 0 00-1.058.07zM2.75 7.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75zM2 11.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2.75 13.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
              </g>
            </svg>
          </button>

          {row?.status !== "completed" && (
            <>
              {/* Edit Button */}
              <button
                onClick={() => handleEdit(row._id)}
                className="flex items-center justify-center rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
                data-tooltip-id="edit-process-tooltip"
                data-tooltip-content="Edit Process"
              >
                <FiEdit size={12} />
              </button>
              <Tooltip id="edit-process-tooltip" place="top" />

              {/* Delete Button */}
              <button
                onClick={() => handlepopup(row._id)}
                data-tooltip-id="delete-process-tooltip"
                data-tooltip-content="Delete Process"
                className="hover:bg-red-700 flex items-center justify-center rounded-full bg-danger p-2 text-white shadow-lg transition-transform hover:scale-105"
              >
                <FiTrash size={12} />
              </button>
              <Tooltip id="delete-process-tooltip" place="top" />
            </>
          )}
        </div>
      ),
    },
  ];

  const displayData = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shiftData
      .filter((row: any) =>
        orderConfirmationNo
          ? String(row?.orderConfirmationNo) === String(orderConfirmationNo)
          : true,
      )
      .filter((row: any) => {
        if (!q) return true;
        const fields = [
          row?.orderConfirmationNo,
          row?.processID,
          row?.productName,
          row?.name,
        ];
        return fields.some((f) =>
          f ? String(f).toLowerCase().includes(q) : false,
        );
      });
  }, [shiftData, searchQuery, orderConfirmationNo]);

  const summary = React.useMemo(() => {
    const s = {
      active: 0,
      completed: 0,
      waiting_schedule: 0,
      down_time_hold: 0,
    };
    shiftData.forEach((r: any) => {
      if (r?.status === "active") s.active++;
      else if (r?.status === "completed") s.completed++;
      else if (r?.status === "waiting_schedule") s.waiting_schedule++;
      else if (r?.status === "down_time_hold") s.down_time_hold++;
    });
    return s;
  }, [shiftData]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb pageName="View Process" parentName="Process" />

      {/* Main Card */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-xl ring-1 ring-black/5 md:p-6">
        <ToastContainer position="top-center" closeOnClick pauseOnHover />

        {loading ? (
          <div className="flex justify-center py-12">
            <BallTriangle height={80} width={80} color="#3B82F6" />
          </div>
        ) : (
          <>
            {/* 🔹 Top Action Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Left: Filter */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={orderConfirmationNo || ""}
                  onChange={(e) => setOrderConfirmationNo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm dark:border-strokedark dark:bg-form-input sm:w-56"
                >
                  <option value="">Please Select</option>
                  {ocNoArr.map((oc, index) => (
                    <option key={index} value={oc?.orderConfirmationNo}>
                      {oc?.orderConfirmationNo}
                    </option>
                  ))}
                </select>

                {/* Search + Clear */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmitFilter}
                    className="flex h-9 items-center justify-center rounded bg-primary px-3 text-white shadow-sm transition hover:bg-primary/90"
                  >
                    <Search size={16} />
                  </button>

                  {/* {orderConfirmationNo && (
                    <button
                      onClick={handleClearFilter}
                      className="text-info flex items-center gap-1 text-sm font-semibold hover:underline"
                    >
                      <XCircle size={16} /> Clear
                    </button>
                  )} */}
                </div>
                {(orderConfirmationNo || searchQuery) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {orderConfirmationNo && (
                      <span className="group inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30 shadow-sm">
                        OC: {orderConfirmationNo}
                        <button
                          onClick={() => setOrderConfirmationNo("")}
                          className="rounded-full bg-primary/20 p-0.5 text-primary transition group-hover:bg-primary/30"
                          aria-label="Clear OC filter"
                        >
                          <XCircle size={14} />
                        </button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="group inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-300 shadow-sm">
                        Search: {searchQuery}
                        <button
                          onClick={() => setSearchQuery("")}
                          className="rounded-full bg-gray-200 p-0.5 text-gray-700 transition group-hover:bg-gray-300"
                          aria-label="Clear search"
                        >
                          <XCircle size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Delete */}
              <div className="text-right">
                <button
                  onClick={handleMultipleRowsDelete}
                  disabled={selectedRows.length === 0}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition ${selectedRows.length === 0
                    ? "cursor-not-allowed bg-danger/50"
                    : "bg-danger hover:bg-danger/90"
                    }`}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardDataStats title="Active Processes" total={`${summary.active}`} rate="">
                <Activity className="text-primary" size={22} />
              </CardDataStats>
              <CardDataStats title="Completed" total={`${summary.completed}`} rate="">
                <CheckCircle className="text-green-600" size={22} />
              </CardDataStats>
              <CardDataStats title="Waiting Schedule" total={`${summary.waiting_schedule}`} rate="">
                <Clock className="text-amber-500" size={22} />
              </CardDataStats>
              <CardDataStats title="On Hold" total={`${summary.down_time_hold}`} rate="">
                <PauseCircle className="text-red-600" size={22} />
              </CardDataStats>
            </div>

            {/* 🔹 Table */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white custom-scroll">
              <DataTable
                className="min-w-full text-sm"
                columns={columns as any}
                data={displayData}
                pagination
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                selectableRows
                selectableRowsHighlight
                onSelectedRowsChange={handleRowSelected}
                highlightOnHover
                pointerOnHover
                striped
                dense
                fixedHeader
                fixedHeaderScrollHeight="500px"
                subHeader
                subHeaderAlign="left"
                subHeaderWrap
                subHeaderComponent={
                  <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <div className="relative w-64">
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="h-9 w-full rounded-lg border border-stroke bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm"
                      />
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 shadow-sm">
                        Active: {summary.active}
                      </span>
                      <span className="rounded-full bg-gradient-to-r from-green-100 to-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200 shadow-sm">
                        Completed: {summary.completed}
                      </span>
                      <span className="rounded-full bg-gradient-to-r from-orange-100 to-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 shadow-sm">
                        Waiting: {summary.waiting_schedule}
                      </span>
                      <span className="rounded-full bg-gradient-to-r from-red-100 to-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 shadow-sm">
                        Hold: {summary.down_time_hold}
                      </span>
                    </div>
                  </div>
                }
                customStyles={{
                  headCells: {
                    style: {
                      fontWeight: "600",
                      backgroundColor: "#f9fafb",
                      color: "#111827",
                      padding: "12px",
                      borderBottom: "1px solid #e5e7eb",
                      boxShadow: "inset 0 -1px 0 0 rgba(229,231,235,1)",
                    },
                  },
                  rows: {
                    style: {
                      minHeight: "54px",
                      borderBottom: "1px solid #f3f4f6",
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                      },
                    },
                  },
                  cells: {
                    style: {
                      padding: "12px",
                      maxWidth: "220px",
                      "& > div:first-child": {
                        whiteSpace: "break-spaces",
                        overflow: "hidden",
                        textOverflow: "inherit",
                        wordBreak: "break-word",
                        lineHeight: "1.4",
                      },
                    },
                  },
                }}
                conditionalRowStyles={[
                  {
                    when: (row: any) => row?.status === "completed",
                    style: { backgroundColor: "#f0fdf4", borderLeft: "3px solid #22c55e" },
                  },
                  {
                    when: (row: any) => row?.status === "active",
                    style: { backgroundColor: "#fffbeb", borderLeft: "3px solid #f59e0b" },
                  },
                  {
                    when: (row: any) => row?.status === "down_time_hold",
                    style: { backgroundColor: "#fef2f2", borderLeft: "3px solid #ef4444" },
                  },
                ]}
              />
            </div>
          </>
        )}

        {/* 🔹 Popups */}
        {showMarkAsCompletePopup && (
          <ConfirmationPopup
            message="Are you sure you want to mark this process as completed?"
            onConfirm={handleSubmitMarkAsCompleted}
            onCancel={() => setShowMarkAsCompletePopup(false)}
          />
        )}
        {showPopup && (
          <ConfirmationPopup
            message="Are you sure you want to delete this item?"
            onConfirm={handleDelete}
            onCancel={() => setShowPopup(false)}
          />
        )}
      </div>

      {/* 🔹 Modal: Add Quantity */}
      <Modal
        isOpen={isAddQuantityModel}
        onSubmit={handleSubmitQuantity}
        onClose={closeAddQuantityModel}
        title="Add Quantity Production"
      >
        <div className="pb-3">
          <label className="text-gray-800 mb-2 block text-sm font-medium dark:text-white">
            Quantity
          </label>
          <input
            type="number"
            value={addMoreQuantity}
            onChange={(e) => setMoreQuantity(e.target.value)}
            placeholder="Enter Quantity"
            className="w-full rounded-lg border border-stroke px-4 py-2 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          />
        </div>
      </Modal>
    </div>
    // <div className="bg-gray-100 min-h-screen p-4 md:p-6">
    //   <Breadcrumb pageName="View Process" parentName="Process" />

    //   <div className="mt-6 rounded-lg bg-white p-4 shadow-lg md:p-6">
    //     <ToastContainer
    //       position="top-center"
    //       closeOnClick
    //       pauseOnFocusLoss
    //       draggable
    //       pauseOnHover
    //     />

    //     {loading ? (
    //       <div className="flex justify-center">
    //         <BallTriangle
    //           height={100}
    //           width={100}
    //           color="#4fa94d"
    //           ariaLabel="loading"
    //         />
    //       </div>
    //     ) : (
    //       <>
    //         {/* 🔹 Filter + Action Bar */}
    //         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    //           {/* Left: Select + Filter */}
    //           <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    //             <select
    //               value={orderConfirmationNo || ""}
    //               onChange={(e) => setOrderConfirmationNo(e.target.value)}
    //               className="h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input sm:w-56"
    //             >
    //               <option value="">Please Select</option>
    //               {ocNoArr.map((oc, index) => (
    //                 <option key={index} value={oc?.orderConfirmationNo}>
    //                   {oc?.orderConfirmationNo}
    //                 </option>
    //               ))}
    //             </select>

    //             <div className="flex items-center gap-2">
    //               <button
    //                 onClick={handleSubmitFilter}
    //                 className="flex h-9 items-center justify-center rounded bg-primary px-3 text-white hover:bg-primary/90"
    //               >
    //                 <svg
    //                   width="16"
    //                   height="16"
    //                   viewBox="0 0 24 24"
    //                   fill="none"
    //                   stroke="currentColor"
    //                 >
    //                   <path
    //                     d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
    //                     strokeWidth="2"
    //                     strokeLinecap="round"
    //                     strokeLinejoin="round"
    //                   />
    //                 </svg>
    //               </button>

    //               {orderConfirmationNo && (
    //                 <button
    //                   onClick={handleClearFilter}
    //                   className="text-info text-sm font-semibold underline"
    //                 >
    //                   Clear
    //                 </button>
    //               )}
    //             </div>
    //           </div>

    //           {/* Right: Delete Button */}
    //           <div className="text-right">
    //             <button
    //               onClick={handleMultipleRowsDelete}
    //               disabled={selectedRows.length === 0}
    //               className={`rounded px-4 py-2 text-sm font-semibold text-white transition ${
    //                 selectedRows.length === 0
    //                   ? "cursor-not-allowed bg-danger/50"
    //                   : "hover:bg-red-700 bg-danger"
    //               }`}
    //             >
    //               Delete
    //             </button>
    //           </div>
    //         </div>

    //         {/* 🔹 Table */}
    //         <div className="mt-6 overflow-x-auto rounded-md">
    //           <DataTable
    //             className="min-w-full text-sm"
    //             columns={columns}
    //             data={shiftData}
    //             pagination
    //             selectableRows
    //             onSelectedRowsChange={handleRowSelected}
    //             highlightOnHover
    //             pointerOnHover
    //             customStyles={{
    //               headCells: {
    //                 style: {
    //                   fontWeight: "bold",
    //                   backgroundColor: "#f8f9fa",
    //                   padding: "12px",
    //                 },
    //               },
    //               rows: {
    //                 style: {
    //                   minHeight: "60px",
    //                   "&:hover": {
    //                     backgroundColor: "#f1f5f9",
    //                   },
    //                 },
    //               },
    //               cells: {
    //                 style: {
    //                   wordBreak: "break-word",
    //                   whiteSpace: "normal",
    //                   lineHeight: "1.4",
    //                   maxWidth: "200px",
    //                 },
    //               },
    //             }}
    //           />
    //         </div>
    //       </>
    //     )}

    //     {/* 🔹 Popups */}
    //     {showMarkAsCompletePopup && (
    //       <ConfirmationPopup
    //         message="Are you sure you want to Mark as Completed this Process?"
    //         onConfirm={() => handleSubmitMarkAsCompleted()}
    //         onCancel={() => setShowMarkAsCompletePopup(false)}
    //       />
    //     )}
    //     {showPopup && (
    //       <ConfirmationPopup
    //         message="Are you sure you want to delete this item?"
    //         onConfirm={() => handleDelete()}
    //         onCancel={() => setShowPopup(false)}
    //       />
    //     )}
    //   </div>

    //   {/* 🔹 Modal */}
    //   <Modal
    //     isOpen={isAddQuantityModel}
    //     onSubmit={handleSubmitQuantity}
    //     onClose={closeAddQuantityModel}
    //     title="Add Quantity Production"
    //   >
    //     <div className="pb-3">
    //       <label className="text-gray-800 mb-2 block text-sm font-medium dark:text-white">
    //         Quantity
    //       </label>
    //       <input
    //         type="number"
    //         value={addMoreQuantity}
    //         onChange={(e) => setMoreQuantity(e.target.value)}
    //         placeholder="Enter Quantity"
    //         className="w-full rounded-lg border border-stroke px-4 py-2 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
    //       />
    //     </div>
    //   </Modal>
    // </div>
  );
};

export default ViewProcess;
