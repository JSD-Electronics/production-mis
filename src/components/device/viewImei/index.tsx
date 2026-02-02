"use client";
import React from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewIMEI, deleteIMEI, deleteMultipleIMEI } from "@/lib/api";
import { PlaningData } from "@/types/planning";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewImei = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [planingData, setPlaningData] = React.useState<PlaningData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState<PlaningData[]>([]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getIMEI();
  }, []);
  const getIMEI = async () => {
    try {
      let result = await viewIMEI();
      setPlaningData(result.imei);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteIMEI(productId);
      toast.success("IMEI deleted successfully!");
      setShowPopup(false);
      getIMEI();
    } catch (error) {
      console.error("Error deleting Shift:", error);
    }
  };
  const handleEdit = (id: string) => {
    router.push(`/planing-scheduling/edit/${id}`);
  };

  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row: PlaningData) => row._id);
      await deleteMultipleIMEI(selectedIds);
      setSelectedRows([]);
      toast.success("IMEI(s) Deleted Successfully!!");
      getIMEI();
    } catch (error) {
      console.error("Error Deleting IMEI(s):", error);
    }
  };
  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: any, index?: number) => (index ?? 0) + 1,
      sortable: true,
    },
    {
      name: "Product Name",
      selector: (row: PlaningData) => row?.productName,
      sortable: true,
    },
    {
      name: "IMEI",
      selector: (row: PlaningData) => row?.imeiNo,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row: PlaningData) =>
        row?.status == "Active" ? (
          <span
            style={{
              backgroundColor: "#ffc107",
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Active
          </span>
        ) : (
          <span
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Pending
          </span>
        ),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: PlaningData) => (
        <div className="flex items-center space-x-3.5">
          <button
            type="button"
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
      <Breadcrumb pageName="View Imei" parentName="Device Management" />
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
              columns={columns as any}
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

export default ViewImei;
