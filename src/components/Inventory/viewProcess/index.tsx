"use client";
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  fetchList,
  updateInventoryById,
  getProcessByProductID,
  deleteProcess,
  updateIssueKit,
  updateIssueCarton
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEye, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewProcessInventory = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [inventoryData, setInventoryData] = React.useState([]);
  const [isInventoryModel, setIsInventoryModel] = React.useState(false);
  const [inventoryDetails, setInventoryDetails] = React.useState({});
  const [inventoryID, setInventoryID] = useState("");
  const [updatedQuantity, setUpdatedQuantity] = React.useState(0);
  const [updatedCartonQuantity, setUpdatedCartonQuantity] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [processes, setProcesses] = React.useState([]);
  const [productName, setProductName] = React.useState("");
  const [packagingData, setPackagingData] = useState([]);
  const [processName, setProcessName] = React.useState("");
  const [isIssueKitModel, setIsIssueKitModel] = React.useState(false);
  const [isIssueCartonModel, setIsIssueCartonModel] = React.useState(false);
  const [selectedProcess, setSelectedProcess] = React.useState("");
  const [selectedProcessDetails, setSelectedProcessDetails] = React.useState(
    {},
  );
  const [issueKitProcess, setIssueKitProcess] = React.useState("");
  const [issueCartonProcess, setIssueCartonProcess] = React.useState("");
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();
  const closeIssuedKitsModal = () => {
    setIsIssueKitModel(false);
  };
  const closeIssuedCartonModal = () => {
    setIsIssueCartonModel(false);
  };
  const closeInventoryModal = () => {
    setIsInventoryModel(false);
  };
  React.useEffect(() => {
    getInventory();
  }, []);
  const getInventory = async () => {
    try {
      let result = await fetchList("/inventory/process/get");
      setInventoryData(result.processInventory);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteProcess(productId);
      toast.success("Process deleted successfully!");
      setShowPopup(false);
      getInventory();
    } catch (error) {
      console.error("Error deleting Process:", error);
    }
  };
  const handleEdit = (process: any) => {
    setInventoryID(process._id);
    setProcessName(process.name);
    setIsInventoryModel(true);
    setUpdatedQuantity(0);
    setUpdatedCartonQuantity(0);
    inventoryData.map((value, index) => {
      if (value._id === process._id) {
        value?.productDetails?.stages.map((stage, index) => {
          stage?.subSteps
            .filter((value1) => value1.isPackagingStatus)
            .forEach((value1) => {
              setPackagingData((prev) => [...prev, value1]);
            });
        });
        setInventoryDetails(value);
      }
    });
  };
  const handleSubmitInventory = async () => {
    try {
      setIsInventoryModel(true);

      if (!inventoryID) {
        console.error("Inventory ID is missing");
        return;
      }

      const existingItem = inventoryData.find(
        (value) => value._id === inventoryID,
      );
      const currentQuantity = existingItem
        ? parseInt(existingItem.quantity) || 0
        : 0;
      const currentCartonQuantity = existingItem
        ? parseInt(existingItem.cartonQuantity) || 0
        : 0;
      const additionalQuantity = parseInt(updatedQuantity) || 0;
      const additionalCartonQuantity = parseInt(updatedCartonQuantity) || 0;

      const finalCartonQuantity =
        currentCartonQuantity + additionalCartonQuantity;
      const finalQuantity = currentQuantity + additionalQuantity;

      let formData = new FormData();
      formData.append("quantity", finalQuantity);
      formData.append("cartonQuantity", finalCartonQuantity);

      if (finalQuantity > 0) {
        formData.append("status", "In Stock");
      }

      const result = await updateInventoryById(inventoryID, formData);

      if (result && result.status === 200) {
        console.log("Inventory updated successfully");
        setIsInventoryModel(false);
        getInventory();
      } else {
        console.error("Failed to update inventory", result);
      }
    } catch (error) {
      console.error("Error updating inventory", error);
    }
  };
  const getProcesses = async (id: String) => {
    try {
      let result = await getProcessByProductID(id);
      let process = result.ProcessByProductID.filter(
        (value) =>
          value.status == "Waiting_Kits_allocation" ||
          value.kitStatus == "partially_issued",
      );
      setProcesses(process);
    } catch (error) {
      console.error("Error Fetching Process:", error);
    }
  };
  const handleProcessType = (event: string) => {
    let process = processes.filter(
      (value: any) =>
        (value.status == "Waiting_Kits_allocation" ||
          value.kitStatus == "partially_issued") &&
        value._id === event,
    );
    setSelectedProcess(event);
    setSelectedProcessDetails(process[0]);
  };
  const handleSubmitCarton = async () => {
    try {
      let data = new FormData();
      data.append("process", selectedProcess);
      data.append("issueCartonProcess", issueCartonProcess);
      let result = await updateIssueCarton(data);
      getInventory();
      toast.success(result?.message || "Kits Issued Successfully !!");
      setIsIssueKitModel(false);
    } catch (error) {
      console.error("Error Fetching Process:", error);
    }
  };
  const handleSubmitIssuedKit = async () => {
    try {
      let data = new FormData();
      data.append("process", selectedProcess);
      data.append("issuedKits", issueKitProcess);
      if (issueKitProcess === selectedProcessDetails?.quantity) {
        data.append("kitStatus", "issued");
      } else {
        data.append("kitStatus", "partially_issued");
      }
      data.append("status", "Waiting_Kits_approval");
      let result = await updateIssueKit(data);
      getInventory();
      toast.success(result?.message || "Kits Issued Successfully !!");
      setIsIssueKitModel(false);
    } catch (error) {
      console.error("Error Fetching Process:", error);
    }
  };
  const openIssueKits = (inventory: any) => {
    setInventoryID(inventory._id);
    setProductName(inventory?.productName);
    getProcesses(inventory?.productDetails?._id);
    setIsIssueKitModel(true);
  };
  const openIssueCarton = (inventory: any) => {
    setInventoryID(inventory._id);
    setProductName(inventory?.productName);
    getProcesses(inventory?.productType);
    setIsIssueCartonModel(true);
  };

  const columns = [
    {
      name: "ID",
      selector: (row: Inventory, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "OC No",
      selector: (row: Inventory, index: number) => row?.orderConfirmationNo,
      sortable: true,
    },
    {
      name: "PID",
      selector: (row: Inventory, index: number) => row?.processID,
      sortable: true,
    },
    {
      name: "Product",
      selector: (row: Inventory, index: number) => row?.productName,
      sortable: true,
    },
    {
      name: "Process Name",
      selector: (row: Inventory) => row?.name,
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row: Inventory) => parseInt(row?.processQuantity),
      sortable: true,
    },
    {
      name: "Issued kits",
      selector: (row: Inventory) => parseInt(row?.issuedKits),
      sortable: true,
    },
    {
      name: "Required Kits",
      selector: (row: Inventory, index: number) =>
        parseInt(row?.processQuantity),
      sortable: true,
    },
    {
      name: "Available Kits",
      selector: (row: Inventory, index: number) =>
        parseInt(row?.inventoryQuantity),
      sortable: true,
    },
    {
      name: "Shortage",
      selector: (row: Inventory, index: number) =>
        Math.abs(row?.processQuantity - row?.issuedKits),
      sortable: true,
    },
    {
      name: "Surplus",
      selector: (row: Inventory, index: number) => {
        return row?.issuedKits > row?.processQuantity
          ? Math.abs(row?.inventoryQuantity - row?.processQuantity)
          : 0;
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Inventory) => row?.status,
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
              padding: "5px 10px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row: Inventory) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleEdit(row)}
            className="transform rounded-full bg-blue-500 p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
          >
            <FiEye size={14} />
          </button>
          <button
            onClick={() => openIssueKits(row)}
            className="transform rounded-full bg-warning p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-warning"
          >
            <svg
              width="12px"
              height="12px"
              viewBox="0 0 48 48"
              fill="#ffffff"
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
                <g id="Layer_2" data-name="Layer 2">
                  {" "}
                  <g id="invisible_box" data-name="invisible box">
                    {" "}
                    <rect width="48" height="48" fill="none"></rect>{" "}
                  </g>{" "}
                  <g id="Medical">
                    {" "}
                    <g>
                      {" "}
                      <path d="M19,29h3v3a2,2,0,0,0,4,0V29h3a2,2,0,0,0,0-4H26V22a2,2,0,0,0-4,0v3H19a2,2,0,0,0,0,4Z"></path>{" "}
                      <path d="M42,12H33V8a4,4,0,0,0-4-4H19a4,4,0,0,0-4,4v4H6a4,4,0,0,0-4,4V39a4,4,0,0,0,4,4H42a4,4,0,0,0,4-4V16A4,4,0,0,0,42,12ZM19,8H29v4H19Zm16,8V39H13V16ZM6,16H9V39H6ZM42,39H39V16h3Z"></path>{" "}
                    </g>{" "}
                  </g>{" "}
                </g>{" "}
              </g>
            </svg>
          </button>
          <button
            onClick={() => openIssueCarton(row)}
            className="transform rounded-full bg-success p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-success"
          >
            <svg
              fill="#ffffff"
              height="12px"
              width="12px"
              version="1.1"
              id="Capa_1"
              viewBox="0 0 491.616 491.616"
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
                <g>
                  {" "}
                  <g id="Icons_4_">
                    {" "}
                    <g>
                      {" "}
                      <path d="M428.202,176.195c-0.006-5.52-1.263-10.965-3.678-15.928L358.202,23.95C351.105,9.399,336.068,0,319.89,0H171.724 c-16.177,0-31.213,9.399-38.31,23.964L67.025,160.678c-2.408,4.958-3.662,10.398-3.666,15.911l-0.242,288.588 c0,14.574,11.869,26.439,26.449,26.439H402.05c14.58,0,26.449-11.866,26.449-26.439L428.202,176.195z M328.223,38.533 l56.964,117.196H262.464V33.331h57.426C323.405,33.331,326.693,35.383,328.223,38.533z M163.394,38.55 c1.529-3.167,4.817-5.219,8.33-5.219h57.41v122.398H106.429L163.394,38.55z M395.162,458.282H96.45V189.06h298.712V458.282z"></path>{" "}
                      <path d="M147.199,255.865c0,13.813,11.199,25,25,25h147.219c13.801,0,25.001-11.188,25.001-25c0-13.81-11.2-25-25.001-25H172.199 C158.398,230.865,147.199,242.055,147.199,255.865z"></path>{" "}
                    </g>{" "}
                  </g>{" "}
                </g>{" "}
              </g>
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <Breadcrumb
        pageName="View Process Inventory"
        parentName="Process Inventory"
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
            <DataTable
              className="dark:bg-bodyDark"
              columns={columns}
              data={inventoryData}
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
            <Modal
              isOpen={isIssueCartonModel}
              onSubmit={handleSubmitCarton}
              onClose={closeIssuedCartonModal}
              title={"Issue Carton (" + productName + ")"}
            >
              {processes.length > 0 ? (
                <div className="pb-3">
                  <div className="justify-between">
                    <div className="w-full px-2">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Process Type
                      </label>
                      <select
                        value={selectedProcess || ""}
                        onChange={(e) => handleProcessType(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                      >
                        <option
                          value=""
                          className="text-body dark:text-bodydark"
                        >
                          Please Select
                        </option>
                        {processes.map((process, index) => (
                          <option
                            key={index}
                            value={process?._id}
                            className="text-body dark:text-bodydark"
                          >
                            {process?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full px-2 pt-4">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Issue Cartons
                      </label>
                      <input
                        type="number"
                        placeholder="Issue Cartons"
                        onChange={(e) => {
                          setIssueCartonProcess(e.target.value);
                        }}
                        value={issueCartonProcess}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <p>No Running Processes Available!</p>
                </div>
              )}
            </Modal>
            <Modal
              isOpen={isIssueKitModel}
              onSubmit={handleSubmitIssuedKit}
              onClose={closeIssuedKitsModal}
              title={"Issue Kits (" + productName + ")"}
            >
              {processes.length > 0 ? (
                <div className="pb-3">
                  <div className="justify-between">
                    <div className="w-full px-2">
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Process Type
                      </label>
                      <select
                        value={selectedProcess || ""}
                        onChange={(e) => handleProcessType(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                      >
                        <option
                          value=""
                          className="text-body dark:text-bodydark"
                        >
                          Please Select
                        </option>
                        {processes.map((process, index) => (
                          <option
                            key={index}
                            value={process?._id}
                            className="text-body dark:text-bodydark"
                          >
                            {process?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedProcessDetails &&
                      Object.keys(selectedProcessDetails).length > 0 && (
                        <>
                          <div className="grid px-3 py-3 sm:grid-cols-2">
                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                              <strong className="font-medium">
                                Process Name:
                              </strong>{" "}
                              {selectedProcessDetails?.name}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                              <strong className="font-medium">
                                Kits Needed:
                              </strong>{" "}
                              {parseInt(selectedProcessDetails?.quantity) -
                                parseInt(selectedProcessDetails?.issuedKits)}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 mb-2">
                              <strong className="font-medium">
                                Kits Issued:
                              </strong>{" "}
                              {parseInt(selectedProcessDetails?.issuedKits)}
                            </div>
                          </div>
                          <div className="w-full px-2 pt-4">
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                              Issue Kit
                            </label>
                            <input
                              type="number"
                              placeholder="Issue Kit"
                              min="1"
                              max={
                                parseInt(selectedProcessDetails?.quantity) -
                                parseInt(selectedProcessDetails?.issuedKits)
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const maxLimit =
                                  parseInt(selectedProcessDetails?.quantity) -
                                  parseInt(selectedProcessDetails?.issuedKits);
                                if (
                                  value === "" ||
                                  (parseInt(value) > 0 &&
                                    parseInt(value) <= maxLimit)
                                ) {
                                  setIssueKitProcess(value);
                                } else {
                                  alert(
                                    "Kits assigned cannot exceed the required amount.",
                                  );
                                }
                              }}
                              value={issueKitProcess}
                              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                            {issueKitProcess &&
                              (parseInt(issueKitProcess) < 1 ||
                                parseInt(issueKitProcess) >
                                  parseInt(selectedProcessDetails?.quantity) -
                                    parseInt(
                                      selectedProcessDetails?.issuedKits,
                                    )) && (
                                <p className="text-red-500 mt-1 text-sm">
                                  Invalid quantity. Please enter a value between
                                  1 and{" "}
                                  {parseInt(selectedProcessDetails?.quantity) -
                                    parseInt(
                                      selectedProcessDetails?.issuedKits,
                                    )}
                                  .
                                </p>
                              )}
                          </div>
                        </>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <p>No Running Processes Available!</p>
                </div>
              )}
            </Modal>
            <Modal
              isOpen={isInventoryModel}
              onSubmit={handleSubmitInventory}
              onClose={closeInventoryModal}
              title={"Inventory Details (" + processName + ")"}
              submitOption={false}
            >
              <div>
                <div>
                  <strong>Process Details </strong>
                </div>
                <div className="grid py-2 sm:grid-cols-2">
                  <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                    <strong className="font-medium">Process Name :</strong>{" "}
                    {inventoryDetails?.name}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                    <strong className="font-medium">Process Id :</strong>{" "}
                    {inventoryDetails?.processID}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                    <strong className="font-medium">Required kits :</strong>{" "}
                    {inventoryDetails?.processQuantity}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                    <strong className="font-medium">Issued Kits :</strong>{" "}
                    {inventoryDetails?.issuedKits}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                    <strong className="font-medium">Kits Shortage :</strong>{" "}
                    {Math.abs(
                      inventoryDetails?.processQuantity -
                        inventoryDetails?.issuedKits,
                    )}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                    <strong className="font-medium">Surplus Kits :</strong>{" "}
                    {inventoryDetails?.issuedKits >
                    inventoryDetails?.processQuantity
                      ? Math.abs(
                          inventoryDetails?.inventoryQuantity -
                            inventoryDetails?.processQuantity,
                        )
                      : 0}
                  </div>
                </div>
                {packagingData.length > 0 && (
                  <>
                    <div>
                      <strong>Carton Details</strong>
                    </div>
                    <div className="grid py-2 sm:grid-cols-2">
                      <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                        <strong className="font-medium">
                          Required Cartons :
                        </strong>{" "}
                        {parseInt(inventoryDetails?.processQuantity) /
                          packagingData[0]?.packagingData?.maxCapacity}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                        <strong className="font-medium">
                          Cartons Shortage :
                        </strong>{" "}
                        {Math.abs(
                          parseInt(inventoryDetails?.processQuantity) /
                            packagingData[0]?.packagingData?.maxCapacity -
                            inventoryDetails?.cartonQuantity,
                        )}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                        <strong className="font-medium">
                          Surplus Cartons :
                        </strong>{" "}
                        {inventoryDetails?.cartonQuantity >
                        inventoryDetails?.processQuantity /
                          packagingData[0]?.packagingData?.maxCapacity
                          ? Math.abs(
                              parseInt(inventoryDetails?.processQuantity) /
                                packagingData[0]?.packagingData?.maxCapacity -
                                inventoryDetails?.cartonQuantity,
                            )
                          : 0}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                        <strong className="font-medium">Updated At :</strong>{" "}
                        {new Date(
                          inventoryDetails?.updatedAt,
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2 px-3">
                        <strong className="font-medium">Created At :</strong>{" "}
                        {new Date(
                          inventoryDetails?.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Modal>
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

export default ViewProcessInventory;
