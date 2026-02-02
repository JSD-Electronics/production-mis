"use client";
import React from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  viewJig,
  deleteJig,
  deleteMultipleJig,
  getFGInventoryToShift,
} from "@/lib/api";
import { Stages } from "@/types/stage";
import { Shifts } from "@/types/shift";
import { Inventory } from "@/types/inventory";
import { useRouter } from "next/navigation";
import { FiEye, FiTrash, FiX } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/Modal/page";
const ViewFGToStore = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [fgToStore, setFGToStore] = React.useState<Shifts[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState<Shifts[]>([]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();
  const [isOpenViewFGDetails, setOpenViewFGDetails] = React.useState(false);
  const [selectedCarton, setSelectedCarton] = React.useState<any | null>(null);

  const handleView = (carton: any) => {
    setSelectedCarton(carton);
    setOpenViewFGDetails(true);
  };

  const handleClose = () => {
    setSelectedCarton(null);
    setOpenViewFGDetails(false);
  };
  React.useEffect(() => {
    getFgToStore();
  }, []);
  const getFgToStore = async () => {
    try {
      let result = await getFGInventoryToShift();
      setFGToStore(result?.data);
    } catch (error) {
      console.error("Error fetching stages:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteJig(productId);
      toast.success("Jig Deleted Successfully!!");
      setShowPopup(false);
      getFgToStore();
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };
  const handleEdit = (id: string) => {
    router.push(`/product/edit/${id}`);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row: Shifts) => row._id);
      await deleteMultipleJig(selectedIds);
      setSelectedRows([]);
      toast.success("Jig deleted successfully!");
      getFgToStore();
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };
  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };
  const handleAddJig = () => {
    router.push("/jig/add");
  };
  const columns = [
    {
      name: "ID",
      selector: (row: any, index?: number) => (index ?? 0) + 1,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row: any) => row.name,
      sortable: true,
    },
    {
      name: "Carton Received",
      selector: (row: Shifts) => row?.cartons?.length || 0,
      sortable: true,
    },
    {
      name: "Total Device Received",
      selector: (row: Shifts) =>
        (row?.cartons?.length ?? 0) > 0
          ? (row?.cartons?.length ?? 0) * parseInt(String(row?.cartons?.[0]?.maxCapacity || 0))
          : 0,
      sortable: true,
    },

    {
      name: "Created At",
      selector: (row: any) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Shifts) => row?.status,
      sortable: true,
      cell: (row: any) => {
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

        const status = row?.status || "default";
        const { label, backgroundColor } =
          (statusStyles as any)[status] || statusStyles.default;

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
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => handleView(row.cartons)} // pass cartons
            className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
          >
            <FiEye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div>
        {/* ... your DataTable with columns + rows */}
        {/* modal */}

        <Modal
          isOpen={isOpenViewFGDetails}
          onSubmit={() => { }}
          onClose={handleClose}
          title="FG Items"
        >
          {/* Header */}
          {/* Scrollable Content */}
          <div className="mt-6 max-h-[65vh] space-y-6 overflow-y-auto pr-2">
            {selectedCarton?.map((carton: any) => (
              <div
                key={carton._id}
                className="border-gray-200 rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Carton Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-700 text-lg font-semibold">
                    {carton.cartonSerial}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${carton.cartonStatus === "FG_TO_STORE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {carton.cartonStatus}
                  </span>
                </div>
                <p className="text-gray-500 mt-1 text-sm">
                  Capacity:{" "}
                  <span className="text-gray-700 font-medium">
                    {carton.maxCapacity}
                  </span>
                </p>

                {/* Devices Table */}
                <div className="mt-4 overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Serial No
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          IMEI
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Model
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Stage
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-gray-200 divide-y">
                      {carton.devices.map((device: any) => (
                        <tr
                          key={device._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-2">{device.serialNo}</td>
                          <td className="px-4 py-2">
                            {device.imeiNo || (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {device.modelName || (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-2">{device.currentStage}</td>
                          <td
                            className={`px-4 py-2 font-medium ${device.status === "Pass"
                              ? "text-green-600"
                              : device.status === "Fail"
                                ? "text-red-600"
                                : "text-gray-500"
                              }`}
                          >
                            {device.status || "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
      <ToastContainer
        position="top-center"
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Breadcrumb with more padding and background color */}
      <Breadcrumb
        pageName="View Process FG Inventory"
        parentName="FG Store Management"
      />
      <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
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
              data={fgToStore}
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

export default ViewFGToStore;
