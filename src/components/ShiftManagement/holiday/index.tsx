"use client";
import React from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  fetchHolidays,
  deleteHolidays,
  deleteMultipleHoliday,
  createHoliday,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/Modal/page";
import DateTimePicker from "@/components/DateTimePicker/dateTimePicker";
const ViewHoliday = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const closeModal = () => setIsModalOpen(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [holidayId, setHolidayId] = React.useState("");
  const [holidays, setHolidays] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [holidayName, setHolidayName] = React.useState("");
  const [holidayDate, setHolidayDate] = React.useState("");
  const [selectedRows, setSelectedRows] = React.useState([]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getHolidays();
  }, []);
  const getHolidays = async () => {
    try {
      let result = await fetchHolidays();
      setHolidays(result.holidays);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteHolidays(holidayId);
      toast.success("Shift deleted successfully!");
      setShowPopup(false);
      getHolidays();
    } catch (error) {
      console.error("Error deleting Shift:", error);
    }
  };
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };
  const handleEdit = (data: any) => {
    setHolidayName(data.holidayName);
    setHolidayDate(formatDate(data.holidayDate));
    setHolidayId(data._id);
    setIsModalOpen(true);

    // router.push(`/shift-management/edit/${id}`);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleHoliday(selectedIds);
      setSelectedRows([]);
      toast.success("Holiday(s) Deleted Successfully!");
      getHolidays();
    } catch (error) {
      console.error("Error Deleting Holiday(s):", error);
    }
  };
  const handleAddHoliday = () => {
    setHolidayName("");
    setHolidayDate("");
    setHolidayId("");
    setIsModalOpen(true);
  };

  const handlesubmitHoliday = async () => {
    try {
      const formData = new FormData();
      formData.append("holidayName", holidayName);
      formData.append("holidayDate", holidayDate);
      if (holidayId != "") {
        formData.append("holidayId", holidayId);
      }
      const result = await createHoliday(formData);
      setIsModalOpen(false);
      getHolidays();
      if (result && result.status === 200) {
        toast.success(result.message || "Holiday Created Successfully");
      } else {
        throw new Error(result.message || "Failed to create Holiday");
      }
    } catch (error) {
      console.log("Error Submitting Holiday !!", error);
    }
  };
  const handlepopup = (id: string) => {
    setHolidayId(id);
    setShowPopup(true);
  };
  const columns = [
    {
      name: "S no",
      selector: (row: Holiday, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row: Holiday) => row.holidayName,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row: Holiday) =>
        row?.holidayDate
          ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date(row.holidayDate))
          : "",
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: Holiday) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Updated At",
      selector: (row: Holiday) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: Shifts) => (
        <div className="flex items-center space-x-3.5">
          {/* Edit Button */}
          <button
            onClick={() => handleEdit(row)}
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
      <Breadcrumb pageName="Holiday" parentName="Shift Management" />
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
            <div className="mb-4 mt-4 flex justify-end gap-3 text-right">
              <button
                onClick={handleAddHoliday}
                className={`rounded bg-primary px-4 py-2 font-semibold text-white `}
              >
                Add Holiday
              </button>
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
            <>
              <Modal
                isOpen={isModalOpen}
                onSubmit={handlesubmitHoliday}
                onClose={closeModal}
                title={holidayId ? "Update Holiday" : "Add Holiday"}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Holiday Name
                    </label>
                    <input
                      type="text"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="Default Input"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Date
                    </label>
                    <div>
                      <input
                        type="date"
                        value={holidayDate}
                        onChange={(e) => setHolidayDate(e.target.value)}
                        placeholder=""
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </Modal>
            </>
            <DataTable
              className="dark:bg-bodyDark"
              columns={columns}
              data={holidays}
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

export default ViewHoliday;
