"use client";
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchList, updateInventoryById, createProcessKits } from "@/lib/api";
import { Inventory } from "@/types/inventory";
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
  const [productionManagerData, setProductionManagerData] = React.useState<Inventory[]>([]);
  const [isInventoryModel, setIsInventoryModel] = React.useState(false);
  const [inventoryDetails, setInventoryDetails] = React.useState<any>({});
  const [inventoryID, setInventoryID] = useState("");
  const [updatedQuantity, setUpdatedQuantity] = React.useState(0);
  const [updatedCartonQuantity, setUpdatedCartonQuantity] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState<Inventory[]>([]);
  const [packagingData, setPackagingData] = useState<any[]>([]);
  const [processName, setProcessName] = React.useState("");
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();
  const closeInventoryModal = () => {
    setIsInventoryModel(false);
  };
  React.useEffect(() => {
    getRemainingKitsToProcess();
  }, []);
  const getRemainingKitsToProcess = async () => {
    try {
      let result = await fetchList("/production-manger/getRemainingKit");

      setProductionManagerData(result.Processes);
    } catch (error) {
      console.error("Error Fetching Inventory:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitInventory = async () => {
    try {
      setIsInventoryModel(true);

      if (!inventoryID) {
        console.error("Inventory ID is missing");
        return;
      }

      const existingItem = productionManagerData.find(
        (value: Inventory) => value._id === inventoryID,
      );
      const currentQuantity = existingItem
        ? parseInt(String(existingItem.processQuantity)) || 0
        : 0;
      const currentCartonQuantity = existingItem
        ? parseInt(String(existingItem.cartonQuantity)) || 0
        : 0;
      const additionalQuantity = parseInt(String(updatedQuantity)) || 0;
      const additionalCartonQuantity = parseInt(String(updatedCartonQuantity)) || 0;

      const finalCartonQuantity =
        currentCartonQuantity + additionalCartonQuantity;
      const finalQuantity = currentQuantity + additionalQuantity;

      let formData = new FormData();
      formData.append("quantity", String(finalQuantity));
      formData.append("cartonQuantity", String(finalCartonQuantity));

      if (finalQuantity > 0) {
        formData.append("status", "In Stock");
      }

      const result = await updateInventoryById(inventoryID, formData);

      if (result && result.status === 200) {
        
        setIsInventoryModel(false);
        getRemainingKitsToProcess();
      } else {
        console.error("Failed to update inventory", result);
      }
    } catch (error) {
      console.error("Error updating inventory", error);
    }
  };
  const handleReturnKits = async (data: Inventory) => {
    try {
      let userDetails = JSON.parse(localStorage.getItem("userDetails") ?? "{}");

      if (!userDetails?._id) {
        toast.error("User details not found. Please log in again.");
        return;
      }

      let form = new FormData();
      form.append("processId", data._id);
      form.append(
        "returnedKits",
        String((parseInt((data as any).issuedKits, 10) || 0) -
          (parseInt((data as any).consumedKits, 10) || 0)),
      );
      form.append(
        "returnedCarton",
        String((parseInt((data as any).issuedCartons, 10) || 0) -
          (parseInt((data as any).consumedCartons, 10) || 0)),
      );
      form.append("userId", String(userDetails._id));
      form.append("status", "SEND_TO_STORE");

      let result = await createProcessKits(form);
      if (result?.status === 200) {
        toast.success("Kits Entry Created Successfully !!");
      } else {
        toast.error("Failed to create kits entry. Please try again.");
      }
    } catch (error: any) {
      console.error("Error while creating kits entry:", error?.message);
      toast.error("An error occurred while creating kits entry.");
    }
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
      selector: (row: any) => parseInt(String(row?.quantity || 0)),
      sortable: true,
    },
    {
      name: "Remaining kits",
      selector: (row: Inventory) => (row as any)?.issuedKits - (row as any)?.consumedKits,
      sortable: true,
    },
    {
      name: "Remaining Cartons",
      selector: (row: Inventory) => (row as any).issuedCartons - (row as any).consumedCartons,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Inventory) => row?.status,
      sortable: true,
      cell: (row: Inventory) => {
        const statusStyles = {
          SEND_TO_STORE: {
            label: "Send to Store",
            backgroundColor: "#17a2b8",
          },
          RECIVED: {
            label: "Recieved",
            backgroundColor: "#248f0d",
          },
          DEFAULT: {
            label: "Process Completed",
            backgroundColor: "#27968f",
          },
        };
        const status = (row as any).returnKitsStatus;
        const { label, backgroundColor } =
          (statusStyles as any)[status] || statusStyles.DEFAULT;
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
      cell: (row: Inventory) =>
        (row as any)?.returnKitsStatus === "" && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleReturnKits(row)}
              className="transform rounded-full bg-blue-500 p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
            >
              <FiCheck size={16} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <Breadcrumb
        pageName="View Remaining Kits"
        parentName="Production Manager"
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
              columns={columns as any}
              data={productionManagerData}
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
            onConfirm={() => { }}
            onCancel={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ViewProcessInventory;
