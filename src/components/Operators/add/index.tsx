"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import React, { useState } from "react";
import Select from 'react-select';
import { createUser, getUserType,getOperatorSkills } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddOperators = () => {
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("M");
  const [userRoles, setUserRole] = useState([]);
  const [userType, setUserType] = useState("Operator");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillData, setSkillFieldData] = useState([]);
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#fff",
      borderColor: state.isFocused ? "#6366F1" : "#D1D5DB",
      borderWidth: "1.5px",
      borderRadius: "0.75rem",
      padding: "0.25rem 0.5rem",
      boxShadow: state.isFocused ? "0 0 0 1px #6366F1" : "none",
      "&:hover": {
        borderColor: "#6366F1",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6B7280",
      fontSize: "0.875rem",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#E0E7FF",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#3730A3",
      fontWeight: 500,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#4F46E5",
      cursor: "pointer",
      ':hover': {
        backgroundColor: "#C7D2FE",
        color: "#1E3A8A",
      },
    }),
  };
  React.useEffect(() => {
    getUserTypeRoles();
    getSkillField();
  }, []);
  const getUserTypeRoles = async () => {
    try {
      let result = await getUserType();
      setUserRole(result.userType);
    } catch (error) {
      console.error("Error Fetching user Roles.");
      toast.error("Error Fetching user Roles.");
    }
  };
  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && !skills.includes(newSkill.trim())) {
      setSkills((prevSkills) => [...prevSkills, newSkill.trim()]);
      setNewSkill("");
    } else {
      toast.error("Skill is empty or already exists.");
    }
  };
  const getSkillField = async () => {
    try {
      let result = await getOperatorSkills();
      let options = [];
      result.skills.map((value,index) => {
        options.push({value: value._id, label:value.name})
      });
      setSkillFieldData(options);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    }
  };
  const handleRemoveSkill = (index: any) => {
    setSkills((prevSkills) => prevSkills.filter((_, i) => i !== index));
  };
  const handleStageChange = (index: any, event: any, param: any) => {
    const newStages = [...stages];
    newStages[index][param] = event.target.value;
    // setStages(newStages);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const formData = {
        name,
        employeeCode,
        email,
        password,
        dateOfBirth,
        phoneNumber,
        gender,
        userType,
        skills,
      };

      const result = await createUser(formData);
      toast.success("User details submitted successfully!");
      setName("");
      setEmployeeCode("");
      setEmail("");
      setPassword("");
      setDateOfBirth("");
      setPhoneNumber("");
      setGender("");
      setUserType("");
      setSkills([]);
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");
    }
  };
  const handleChange = (selected) => {
    //setSkills(selected); // update local state
     const selectedValues = selected ? selected.map((opt) => opt.label) : [];
    console.log('Selected Values:', selectedValues);
    setSkills(selectedValues);
  };

  return (
    <>
      <Breadcrumb parentName="User Management" pageName="Add User" />
      <div className="grid gap-9">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                User Management
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-2">
                {/* Operator Name Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Name"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                {/* Employee Code Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Employee Code
                    </label>
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="Enter Employee Code"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                {/* Email Address Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Email Address"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                {/* Password Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                {/* Date of Birth Field */}
                <div className="space-x-4">
                  <DatePickerOne
                    formLabel="Date Of Birth"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    value={dateOfBirth}
                    setValue={setDateOfBirth}
                  />
                </div>
                {/* Phone Number Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter Phone Number"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                {/* Gender Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-6 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>
                {/* User Type Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      User Type
                    </label>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-6 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    >
                      {userRoles.map((userRole, index) => (
                        <option
                          key={index}
                          value={userRole?.name}
                          className="text-body dark:text-bodydark"
                        >
                          {userRole?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-1">
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Skills
                    </label>
                    <Select
                      options={skillData}
                      isMulti
                      styles={customStyles}
                      // value={newSkill}
                      onChange={handleChange}
                      className="basic-multi-select w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      classNamePrefix="select"
                      placeholder="Select Skills"
                    />
                    {/* <select
                      // onChange={(e) => {
                      //   handleStageChange(index, e, "requiredSkill");
                      // }}
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
                          // disabled={skills.includes(skill?.name) ? true : false}
                        >
                          {skill?.name}
                        </option>
                      ))}
                    </select> */}
                    {/* <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Enter a skill"
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="rounded-md bg-blue-700 px-4 py-2 text-white transition hover:bg-blue-600"
                      >
                        <svg
                          fill="#ffffff"
                          version="1.1"
                          id="Capa_1"
                          xmlns="http://www.w3.org/2000/svg"
                          width="20px"
                          height="20px"
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
                    </div> */}
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
              {/* Submit Button */}
              <div className="col-span-2 flex justify-end p-8 pr-8">
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddOperators;
