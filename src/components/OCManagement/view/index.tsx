"use client";
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  getUsers,
  getOrderConfirmationNumers,
  createOrderConfirmationNumbers,
  deleteUser,
  deleteMultipleUser,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/Modal/page";
import { faComment } from "@fortawesome/free-solid-svg-icons";
const ViewOrderNumber = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [userType, setUserType] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [orderConfirmationData, setOrderConfirmationData] = React.useState<
    Stages[]
  >([]);
  const [orderConfirmationId,setOrderConfirmationID] = React.useState();
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [isOrderConfirmationModel, setIsOrderConfirmationModel] =
    React.useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillData, setSkillData] = useState([]);
  const [ocno, setOcno] = useState("");
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const closeOrderConfirmationModel = () => {
    setIsOrderConfirmationModel(false);
  };
  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && !skills.includes(newSkill.trim())) {
      setSkills((prevSkills) => [...prevSkills, newSkill.trim()]);
      setNewSkill("");
    } else {
      toast.error("Skill is empty or already exists.");
    }
  };
  const router = useRouter();

  React.useEffect(() => {
    getOrderConfirmationNo();
  }, []);

  const getOrderConfirmationNo = async () => {
    try {
      let result = await getOrderConfirmationNumers();
      setOrderConfirmationData(result.getOrderConfirmationNo);
    } catch (error) {
      console.error("Error fetching User:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteUser(userId);
      toast.success("User deleted successfully!");
      setShowPopup(false);
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };
  const handleEdit = (data: string) => {
    setOcno(data?.orderConfirmationNo);
    setOrderConfirmationID(data?._id);
    setIsOrderConfirmationModel(true);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleUser(selectedIds);
      setSelectedRows([]);
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };
  const handleRemoveSkill = (index: any) => {
    setSkills((prevSkills) => prevSkills.filter((_, i) => i !== index));
  };
  const handlepopup = (id: string) => {
    setUserId(id);
    setShowPopup(true);
  };
  const handleSubmitOrderConfirmationNumber = async () => {
    try {
      let formData = new FormData();
      if(orderConfirmationId){
        formData.append("id", orderConfirmationId);
      }else{
        formData.append("id", "");
      }
      formData.append("orderConfirmationNo", ocno);
      let result = await createOrderConfirmationNumbers(formData);
      if (result && result.status == 200) {
        toast.success("Order Confirmation No submitted successfully!");
      } else if (result && result.status == 204) {
        console.error(result.message);
        toast.error(result.message);
      }
      setIsOrderConfirmationModel(false); 
    } catch (error) {
      
      console.error("Error deleting stage:", error);
    }
  };
  const handleAddskill = (row: string) => {
    setUserId(row?._id);
    setSkills(row?.skills);
  };
  const handleAddOrderConfirmationNumber = () => {
    setIsOrderConfirmationModel(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: Stages, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Order Confirmation No",
      selector: (row: Stages) => row.orderConfirmationNo,
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row: Stages) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Updated At",
      selector: (row: Stages) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: Stages) => (
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => handleEdit(row)}
            className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
          >
            <FiEdit size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Breadcrumb with more padding and background color */}
      <Breadcrumb pageName="View OC" parentName="OC Management" />
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
            <div className="mb-4 mt-4 flex justify-end gap-2 text-right">
              <button
                onClick={handleAddOrderConfirmationNumber}
                className={`rounded bg-primary px-4 py-2 font-semibold text-white`}
              >
                Add
              </button>
            </div>
            <DataTable
              className="dark:bg-bodyDark"
              columns={columns}
              data={orderConfirmationData}
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
      <Modal
        isOpen={isOrderConfirmationModel}
        onSubmit={handleSubmitOrderConfirmationNumber}
        onClose={closeOrderConfirmationModel}
        title={"ADD Order Confirmation Number"}
        submitOption={true}
      >
        <div>
          <div className="grid gap-6 pt-4 sm:grid-cols-1">
            <div className="space-x-4">
              <div className="w-full">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Order Confirmation Number
                </label>
                <input
                  type="text"
                  value={ocno}
                  onChange={(e) => setOcno(e.target.value)}
                  placeholder="Enter Order Confirmation Number"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ViewOrderNumber;
