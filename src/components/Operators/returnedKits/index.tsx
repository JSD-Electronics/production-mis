"use client";
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { Stages } from "@/types/stage";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  getUsers,
  deleteUser,
  deleteMultipleUser,
  updateOperatorSkillSet,
  getOperatorSkills,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { BallTriangle } from "react-loader-spinner";
import ConfirmationPopup from "@/components/Confirmation/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/Modal/page";
import { faComment } from "@fortawesome/free-solid-svg-icons";
const ReturnedKits = () => {
  const [showPopup, setShowPopup] = React.useState(false);
  const [userType, setUserType] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [stageData, setStageData] = React.useState<Stages[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [isSkillSetModel, setIsSkillSetModel] = React.useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillData, setSkillData] = useState([]);
  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };
  const closeSkillModel = () => {
    setIsSkillSetModel(false);
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
    let userDetails = JSON.parse(localStorage.getItem("userDetails"));
    setUserType(userDetails.userType);
    getStages();
    getSkillField();
  }, []);
  const getSkillField = async () => {
    try {
      let result = await getOperatorSkills();
      setSkillData(result.skills);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    } finally {
      setLoading(false);
    }
  };
  const getStages = async () => {
    try {
      let result = await getUsers();
      setStageData(result.users);
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
      getStages();
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };
  const handleEdit = (id: string) => {
    router.push(`/operators/edit/${id}`);
  };
  const handleMultipleRowsDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleUser(selectedIds);
      setSelectedRows([]);
      toast.success("User deleted successfully!");
      getStages();
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
  const handleSubmitSkills = async () => {
    try {
      const formData = new FormData();
      if (skills.length > 0) {
        formData.append('skills', skills);
        let result = await updateOperatorSkillSet(formData, userId);
        if (result && result.status == 200) {
          setIsSkillSetModel(false);
          toast.success("Skills added successfully!");
        }
      } else {
        setIsSkillSetModel(false);
      }
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };
  const handleAddskill = (row: string) => {
    setUserId(row?._id);
    setSkills(row?.skills);
    setIsSkillSetModel(true);
  };
  const columns = [
    {
      name: "ID",
      selector: (row: Stages, index: number) => index + 1,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row: Stages) => row.name,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: Stages) => row?.email,
      sortable: true,
    },
    {
      name: "Phone Number",
      selector: (row: Stages) => row?.phoneNumber,
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
          {userType == "admin" && (
            <>
              {/* Edit Button */}
              <button
                onClick={() => handleEdit(row._id)}
                className="transform rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-600"
              >
                <FiEdit size={16} />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handlepopup(row._id)}
                className="bg-red-500 hover:bg-red-600 transform rounded-full p-2 text-white shadow-lg transition-transform hover:scale-105"
              >
                <FiTrash size={16} />
              </button>
            </>
          )}
          {userType == "QC" && (
            <>
              {/* ADD Skils op Button */}
              <button
                onClick={() => handleAddskill(row)}
                className="transform rounded-full bg-[#0FADCF] p-1 text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#0FADCF]"
              >
                <svg
                  fill="#ffffff"
                  width="25px"
                  height="25px"
                  viewBox="0 0 100 100"
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
                    <path
                      d="M43.84,46.76a5.35,5.35,0,1,1,5.46-5.34A5.41,5.41,0,0,1,43.84,46.76Z"
                      fill-rule="evenodd"
                    ></path>
                    <path
                      d="M77.33,55.7,70.06,44.9V44A24,24,0,0,0,46.19,20a22,22,0,0,0-5.67.7A23.89,23.89,0,0,0,22.31,44a21.92,21.92,0,0,0,3.58,12.7c4.18,6,7,10.8,5.27,17.3a4.58,4.58,0,0,0,.9,4.2A4.43,4.43,0,0,0,35.74,80h19.6A4.72,4.72,0,0,0,60,76.2a5,5,0,0,0,.2-1.2,2.37,2.37,0,0,1,2.39-2H64a4.72,4.72,0,0,0,4.68-3.4A41.31,41.31,0,0,0,70.16,60h5.17a2.78,2.78,0,0,0,2.19-1.6A2.86,2.86,0,0,0,77.33,55.7ZM57.49,47.33l-1,1.57a2.22,2.22,0,0,1-1.76.94,2.38,2.38,0,0,1-.72-.16l-2.65-1a11.64,11.64,0,0,1-3.85,2.2l-.48,2.91a2,2,0,0,1-2,1.65h-2a2,2,0,0,1-2-1.65l-.48-2.91a10,10,0,0,1-3.69-2l-2.81,1a2.38,2.38,0,0,1-.72.16,2.1,2.1,0,0,1-1.76-1l-1-1.65a1.94,1.94,0,0,1,.48-2.51l2.33-1.89a10.11,10.11,0,0,1-.24-2.12,9.41,9.41,0,0,1,.24-2L31.1,36.88a1.92,1.92,0,0,1-.48-2.51l1-1.65a2,2,0,0,1,1.76-1,2.38,2.38,0,0,1,.72.16l2.81,1a11.52,11.52,0,0,1,3.69-2.12L41,28a1.91,1.91,0,0,1,2-1.57h2a1.92,1.92,0,0,1,2,1.49l.48,2.83a11.31,11.31,0,0,1,3.69,2l2.81-1a2.38,2.38,0,0,1,.72-.16,2.1,2.1,0,0,1,1.76,1l1,1.65A2,2,0,0,1,57,36.8l-2.33,1.89a9.56,9.56,0,0,1,.24,2.12,9.41,9.41,0,0,1-.24,2L57,44.74A2,2,0,0,1,57.49,47.33Z"
                      fill-rule="evenodd"
                    ></path>
                  </g>
                </svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Breadcrumb with more padding and background color */}
      <Breadcrumb pageName="View User" parentName="User Management" />
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
                className={`rounded bg-danger px-4 py-2 font-semibold text-white ${
                  selectedRows.length === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-red-700"
                }`}
              >
                Delete
              </button>
            </div>
            <DataTable
              className="dark:bg-bodyDark"
              columns={columns}
              data={stageData}
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
        isOpen={isSkillSetModel}
        onSubmit={handleSubmitSkills}
        onClose={closeSkillModel}
        title={"ADD Skills"}
        submitOption={true}
      >
        <div>
          <div className="grid gap-6 pt-4 sm:grid-cols-1">
            <div className="space-x-4">
              <div className="w-full">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Skills
                </label>
                <div className="flex gap-4">
                  <select
                    value={newSkill || ""}
                    onChange={(e) => {
                      setNewSkill(e.target.value);
                    }}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                  >
                    <option value="" className="text-body dark:text-bodydark">
                      Please Select
                    </option>
                    {skillData.map((skill, index) => (
                      <option
                        key={index}
                        value={skill?.name}
                        className="text-body dark:text-bodydark"
                        disabled={skills.includes(skill?.name) ? true : false}
                      >
                        {skill?.name} {skills.includes(skill?.name) ? '(Selected)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-md bg-blue-700 px-4 py-1 text-white transition hover:bg-blue-600"
                  >
                    <svg
                      fill="#ffffff"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="15px"
                      height="15px"
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
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Skills Input Section */}
            <div className="space-x-4">
              <div className="border-gray-300 bg-gray-50 dark:bg-gray-800 items-center justify-between rounded-lg border px-4 py-2 shadow-sm transition dark:border-strokedark">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Skills Set
                </label>
                <ul className="list-none space-y-3 pl-0">
                  {skills.map((skill, index) => (
                    <li
                      key={index}
                      className="dark:bg-gray-800 flex items-center rounded-lg px-4 py-2 shadow-sm transition"
                    >
                      <h4 className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {skill}
                      </h4>
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-4 flex items-center justify-center rounded-md bg-danger px-2 py-1 text-white transition duration-300 hover:bg-danger focus:outline-none"
                        aria-label="Remove Skill"
                      >
                        <svg
                          width="20px"
                          height="20px"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                {skills.length === 0 && (
                  <p className="text-gray-500 mt-2 text-center text-sm">
                    No skills added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReturnedKits;
