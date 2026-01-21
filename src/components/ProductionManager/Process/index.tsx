"use client";
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  fetchList,
  updateInventoryById,
  updateProductionStatus,
  updateIssuedKitsToLine,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEye, FiCheck, FiTrash, FiX } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewProcessInventory = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [productionManagerData, setProductionManagerData] = React.useState([]);
  const [isInventoryModel, setIsInventoryModel] = React.useState(false);
  const [inventoryDetails, setInventoryDetails] = React.useState({});
  const [inventoryID, setInventoryID] = useState("");
  const [updatedQuantity, setUpdatedQuantity] = React.useState(0);
  const [updatedCartonQuantity, setUpdatedCartonQuantity] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [packagingData, setPackagingData] = useState([]);
  const [processName, setProcessName] = React.useState("");
  const [issuedKitsToLineModel, setIssuedKitsToLineModel] =
    React.useState(false);
  const [processData, setProcessData] = useState({});
  const [assignedStage, setAssignedStage] = React.useState([]);
  const [startLineStage, setStartLineStage] = React.useState([
    {
      key: "",
      data: [],
      assignedKitsToStage: [],
      issuedKits: 0,
    },
  ]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();
  const closeInventoryModal = () => {
    setIsInventoryModel(false);
  };
  const closeIssuedKitsToLineModel = () => {
    setIssuedKitsToLineModel(false);
  };
  React.useEffect(() => {
    getProductionManagerProcess();
  }, []);
  const handleKitsToLine = async () => {
    try {
      const assignedStage = JSON.parse(processData.assignStages);
      const updatedStageData = { ...assignedStage };
      let seatDetails = [];
      let issuedKits = 0;
      let totalAssignedKit = 0;
      let issuedKitsStatus = "";
      startLineStage.forEach((stage) => {
        const key = stage.key;
        const original = assignedStage[key]?.[0];
        const updates = stage.data?.[0] || {};
        issuedKits += parseInt(updates?.totalUPHA);
        totalAssignedKit = stage.issuedKits;
        let seatsInfo = key.split("-");
        seatDetails.push({
          rowNumber: seatsInfo[0],
          seatNumber: seatsInfo[1],
          issuedKits: parseInt(updates?.totalUPHA),
        });
        if (!original) return;
        updatedStageData[key] = [
          {
            ...original,
            ...updates,
          },
        ];
      });
      if (totalAssignedKit != issuedKits && issuedKits > 0) {
        issuedKitsStatus = "PARTIALLY_ISSUED";
      } else if (totalAssignedKit == issuedKits) {
        issuedKitsStatus = "ISSUED";
      } else {
        issuedKitsStatus = "NOT_ISSUED";
      }
      let formData = new FormData();
      formData.append("planId", processData.planId);
      formData.append("processId", processData._id);
      formData.append("issuedKits", parseInt(issuedKits));
      formData.append("seatDetails", JSON.stringify(seatDetails));
      formData.append("issuedKitsStatus", issuedKitsStatus);
      formData.append("assignedStage", JSON.stringify(updatedStageData));
      formData.append("processStatus", "waiting_for_kits_confirmation");
      let result = await updateIssuedKitsToLine(formData);
      if (result) {
        setIssuedKitsToLineModel(false);
        getProductionManagerProcess();
        toast.success(result?.message || "Device Created Successfully !!");
      }
    } catch (error) {
      console.error("Error Update Stage Data:", error);
    }
  };

  const getProductionManagerProcess = async () => {
    try {
      let result = await fetchList("/production-manger/process/get");
      setProductionManagerData(result.Processes);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
    } finally {
      setLoading(false);
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
        getProductionManagerProcess();
      } else {
        console.error("Failed to update inventory", result);
      }
    } catch (error) {
      console.error("Error updating inventory", error);
    }
  };
  const handleStatusUpdate = async (data, status) => {
    try {
      let form = new FormData();
      form.append("id", data?._id);
      form.append("status", status);
      if (status === "Waiting_Kits_allocation") {
        let returnedKits = data?.quantity - data?.issuedKits;
        form.append("issuedKits", returnedKits);
      }
      let result = await updateProductionStatus(form);
      if (result && result.status === 200) {
        toast.success("Production Update Successfully!");
      }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };
  const handleIssuedKits = (row: any) => {
    setProcessData({});
    let assignedStages = JSON.parse(row.assignStages);
    let productStages = row.stages.length;
    let repeatCount = row.repeatCount;
    const keys = Object.keys(assignedStages);
    const selectedStageEntries: any[] = [];
    for (let i = 0; i < repeatCount; i++) {
      const index = i * productStages;
      const key = keys[index];
      if (assignedStages[key]) {
        selectedStageEntries.push({
          key,
          data: assignedStages[key],
          issuedKits: row.issuedKits,
          issuedCartons: row.issuedCartons,
        });
      }
    }
    // return false;
    setProcessData(row);
    setStartLineStage(selectedStageEntries);
    setIssuedKitsToLineModel(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: Inventory, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Product Name",
      selector: (row: Inventory) => row?.name,
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row: Inventory) => parseInt(row?.quantity),
      sortable: true,
    },
    {
      name: "Issued kits",
      selector: (row: Inventory) => parseInt(row?.issuedKits),
      sortable: true,
    },
    {
      name: "Issued Carton",
      selector: (row: Inventory) => parseInt(row.issuedCartons),
      sortable: true,
    },
    {
      name: "Issued kit to Operator",
      selector: (row: Inventory) => parseInt(row.assignedKitsToOperator),
      sortable: true,
    },
    {
      name: "Issued Kit Status",
      selector: (row: Inventory) => {
        const statusClassMap: Record<string, string> = {
          ISSUED: "bg-green-600",
          PARTIALLY_ISSUED: "bg-amber-500",
          NOT_ISSUED: "bg-red-600",
        };
        const labelMap: Record<string, string> = {
          ISSUED: "Issued",
          PARTIALLY_ISSUED: "Partially Issued",
          NOT_ISSUED: "Not Issued",
        };
        const statusClass =
          statusClassMap[row.issuedKitsStatus] || "bg-gray-600";
        const displayLabel = labelMap[row.issuedKitsStatus] || "Unknown";
        return (
          <span className={`inline-block rounded px-2.5 py-1 text-[11px] font-semibold text-white ${statusClass}`}>
            {displayLabel}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Inventory) => row?.status,
      sortable: true,
      cell: (row: Inventory) => {
        const statusClasses = {
          waiting_schedule: "bg-orange-500",
          Waiting_Kits_allocation: "bg-violet-600",
          Waiting_Kits_approval: "bg-teal-600",
          waiting_for_line_feeding: "bg-blue-600",
          waiting_for_kits_confirmation: "bg-orange-600",
          active: "bg-amber-500",
          down_time_hold: "bg-red-600",
          completed: "bg-green-600",
          default: "bg-gray-500",
        } as Record<string, string>;
        const status = row?.status;
        const labelMap = {
          waiting_schedule: "Waiting Schedule",
          Waiting_Kits_allocation: "Waiting Kits Allocation",
          Waiting_Kits_approval: "Waiting Kits Approval",
          waiting_for_line_feeding: "Waiting For Line Feeding",
          waiting_for_kits_confirmation: "Waiting For Kits Confirmation",
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
      cell: (row: Inventory) => (
        <div className="flex items-center space-x-1">
          {row.status == "Waiting_Kits_approval" && (
            <>
              <button
                onClick={() =>
                  handleStatusUpdate(row, "waiting_for_line_feeding")
                }
                className="transform rounded-full bg-blue-500 p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
              >
                <FiCheck size={16} />
              </button>
              <button
                onClick={() => handleStatusUpdate(row, "Waiting_Kits_allocation")}
                className="transform rounded-full bg-danger p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-danger"
              >
                <FiX size={16} />
              </button>
            </>
          )}
          {(row.status === "waiting_for_line_feeding" ||
            row.issuedKitsStatus === "PARTIALLY_ISSUED") && (
              <button
                onClick={() => handleIssuedKits(row)}
                className="transform rounded-full bg-[#34D399] p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#34D399]"
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
                      d="M18 18.86H17.24C16.44 18.86 15.68 19.17 15.12 19.73L13.41 21.42C12.63 22.19 11.36 22.19 10.58 21.42L8.87 19.73C8.31 19.17 7.54 18.86 6.75 18.86H6C4.34 18.86 3 17.53 3 15.89V4.97998C3 3.33998 4.34 2.01001 6 2.01001H18C19.66 2.01001 21 3.33998 21 4.97998V15.89C21 17.52 19.66 18.86 18 18.86Z"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      stroke-miterlimit="10"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>{" "}
                    <path
                      d="M11.9999 10.0001C13.2868 10.0001 14.33 8.95687 14.33 7.67004C14.33 6.38322 13.2868 5.34009 11.9999 5.34009C10.7131 5.34009 9.66992 6.38322 9.66992 7.67004C9.66992 8.95687 10.7131 10.0001 11.9999 10.0001Z"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>{" "}
                    <path
                      d="M16 15.6601C16 13.8601 14.21 12.4001 12 12.4001C9.79 12.4001 8 13.8601 8 15.6601"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>{" "}
                  </g>
                </svg>
              </button>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen p-6">
      <Breadcrumb pageName="View Process" parentName="Production Manager" />
      <div className="mt-6 rounded-xl bg-white/90 backdrop-blur-md p-6 shadow-2xl ring-1 ring-black/5 dark:bg-boxdark/90 dark:ring-white/10">
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
              className="min-w-full text-sm"
              columns={columns}
              data={productionManagerData}
              pagination
              selectableRows
              onSelectedRowsChange={handleRowSelected}
              highlightOnHover
              pointerOnHover
              customStyles={{
                headCells: {
                  style: {
                    fontWeight: "600",
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                  },
                },
                rows: {
                  style: {
                    minHeight: "60px",
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
            <Modal
              isOpen={issuedKitsToLineModel}
              onSubmit={handleKitsToLine}
              onClose={closeIssuedKitsToLineModel}
              title={"Assign Kits to Line"}
              submitOption={true}
            >
              <div>
                {startLineStage?.map((value, index) => (
                  <div key={index} className="mb-2">
                    <div className="grid grid-cols-2 pb-6">
                      <div>
                        <strong>Row & Seat Number:</strong> {value.key}
                      </div>
                      <div className="text-gray-700 block text-sm font-medium">
                        <strong>Stage Name:</strong> {value.data[0]?.name}
                      </div>
                      <div>
                        <strong>Kit Issued:</strong> {value.issuedKits}
                      </div>
                      <div>
                        <strong>Carton Issued :</strong> {value.issuedCartons}
                      </div>
                    </div>
                    <div>
                      <label className="mb-3 block text-sm text-black dark:text-white">
                        Line Number {index + 1}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={value.issuedKits / startLineStage.length}
                        required={true}
                        value={value.data?.[0]?.totalUPHA || ""}
                        onChange={(e) => {
                          let kitsValue = parseInt(e.target.value) || 0;
                          if (kitsValue > value.issuedKits) {
                            kitsValue = value.issuedKits;
                          }

                          const updatedStages = [...startLineStage];
                          const updatedStage = { ...updatedStages[index] };

                          if (!Array.isArray(updatedStage.data)) {
                            updatedStage.data = [];
                          }

                          updatedStage.data[0] = {
                            ...updatedStage.data[0],
                            totalUPHA: kitsValue,
                          };

                          updatedStages[index] = updatedStage;
                          setStartLineStage(updatedStages);
                        }}
                        placeholder="No of kits Issued to stage"
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
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
