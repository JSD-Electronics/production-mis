"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import {
  createOperatorSkill,
  deleteStickerField,
  getOperatorSkills,
  deleteStickerFieldMultiple,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import React from "react";
import DataTable from "react-data-table-component";
import { FiEdit, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ViewSkillManagementComponent = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [fieldName, setFieldName] = React.useState("");
  const closeModal = () => setIsModalOpen(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [stickerFieldData, setStickerFieldData] = React.useState<Stages[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [skillFieldId, setSkillFieldId] = React.useState("");
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const router = useRouter();

  React.useEffect(() => {
    getSkillField();
  }, []);
  const getSkillField = async () => {
    try {
      let result = await getOperatorSkills();
      setStickerFieldData(result.skills);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteStickerField(productId);
      toast.success("Shift deleted successfully!");
      setShowPopup(false);
      getSkillField();
    } catch (error) {
      console.error("Error deleting Shift:", error);
    }
  };
  const handleEdit = (data: any) => {
    setFieldName(data.name);
    setSkillFieldId(data._id);
    setIsModalOpen(true);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteStickerFieldMultiple(selectedIds);
      setSelectedRows([]);
      toast.success("Shift(s) Deleted Successfully!");
      getSkillField();
    } catch (error) {
      console.error("Error Deleting Shift(s):", error);
    }
  };
  const handlepopup = (id: string) => {
    setProductId(id);
    setShowPopup(true);
  };
  const handleSubmitSkills = async () => {
    try {
      let slug = fieldName
      .split(" ")
      .map((word) => word.toLowerCase())
      .join("_");
      const formData = new FormData();
      formData.append("name", fieldName);
      formData.append("slug", slug);
      if (skillFieldId != "") {
        formData.append("skillFieldId", skillFieldId);
      }
      const result = await createOperatorSkill(formData);
      if (result && result.status == 200) {
        setIsModalOpen(false);
        getSkillField();
        toast.success(result.message || "Skills Field Created Successfully");
      }
      return false;
    } catch (error) {
      console.log("Error Creating Submit Skills ==>", error);
    }
  };
  const handleAddSkillManagement = () => {
    setFieldName("");
    setSkillFieldId("");
    setIsModalOpen(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: Shifts, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row: Shifts) => row.name,
      sortable: true,
    },
    {
      name: "Slug",
      selector: (row: Shifts) => row.slug,
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: Shifts) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Updated At",
      selector: (row: Shifts) => new Date(row.createdAt).toLocaleDateString(),
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
      <Breadcrumb pageName="View Skills" parentName="Skills Management" />
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
            <div className="mb-4 mt-4 flex justify-end gap-3 text-right text-end">
              <button
                onClick={() => handleAddSkillManagement()}
                className={`rounded bg-primary px-4 py-2 font-semibold text-white`}
              >
                ADD Skills
              </button>
              <button
                onClick={handleMultipleRowsDelete}
                disabled={selectedRows.length === 0}
                className={`rounded bg-danger px-4 py-2 font-semibold text-white`}
              >
                Delete
              </button>
            </div>
            <Modal
              isOpen={isModalOpen}
              onSubmit={handleSubmitSkills}
              onClose={closeModal}
              title={
                skillFieldId ? "Update Skill" : "Add Skill"
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="Field Name"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
            </Modal>
            <DataTable
              className="dark:bg-bodyDark"
              columns={columns}
              data={stickerFieldData}
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

export default ViewSkillManagementComponent;
