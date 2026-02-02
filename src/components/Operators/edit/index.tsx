"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import React, { useState } from "react";
import Select from "react-select";
import {
  updateUser,
  getUserDetail,
  getOperatorSkills,
  getUserType,
} from "../../../lib/api";
import { Trash2, User, Mail, Lock, Calendar, Users } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditOperators = () => {
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
      ":hover": {
        backgroundColor: "#C7D2FE",
        color: "#1E3A8A",
      },
    }),
  };
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getUser(id);
    getSkillField();
    getUserTypeRoles();
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
  const getSkillField = async () => {
    try {
      let result = await getOperatorSkills();
      let options = [];
      result.skills.map((value, index) => {
        options.push({ value: value._id, label: value.name });
      });
      setSkillFieldData(options);
    } catch (error) {
      console.error("Error Fetching Shifts:", error);
    }
  };
  const getUser = async (id: any) => {
    let result = await getUserDetail(id);
    setName(result.user.name);
    setEmail(result.user.email);
    setEmployeeCode(result.user.employeeCode);
    setPassword(result.user.password);
    setDateOfBirth(result.user.dateOfBirth);
    setPhoneNumber(result.user.phoneNumber);
    setGender(result.user.gender);
    setUserType(result.user.userType);
    // let options = []
    // result.user.skills.map((value, index) => {

    // })
    setSkills(result.user.skills);
  };
  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && !skills.includes(newSkill.trim())) {
      setSkills((prevSkills) => [...prevSkills, newSkill.trim()]);
      setNewSkill("");
    } else {
      toast.error("Skill is empty or already exists.");
    }
  };
  const handleRemoveSkill = (index: any) => {
    setSkills((prevSkills) => prevSkills.filter((_, i) => i !== index));
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
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

      const result = await updateUser(formData, id);
      toast.success("User details submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");
    }
  };
  const handleChange = (selected) => {
    const selectedValues = selected ? selected.map((opt) => opt.label) : [];
    
    setSkills(selectedValues);
  };

  return (
    <>
      <Breadcrumb parentName="User Management" pageName="Edit User" />
      <div className="grid gap-9 pt-5">
        <div className="flex flex-col gap-9">
          <div className="rounded-2xl border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
            {/* Header */}
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                <Users size={18} /> User Management
              </h3>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 px-8 pr-8 pt-6 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Name
                  </label>
                  <div className="relative">
                    <User
                      className="text-gray-400 absolute left-3 top-3"
                      size={18}
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Name"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>
                </div>

                {/* Employee Code */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Enter Employee Code"
                    className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="text-gray-400 absolute left-3 top-3"
                      size={18}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Email"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="text-gray-400 absolute left-3 top-3"
                      size={18}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <DatePickerOne
                    formLabel="Date of Birth"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    value={dateOfBirth}
                    setValue={setDateOfBirth}
                    icon={<Calendar className="text-gray-400" size={18} />}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>

                {/* User Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    User Type
                  </label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  >
                    {userRoles.map((userRole, index) => (
                      <option key={index} value={userRole?.name}>
                        {userRole?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div className="grid gap-6 px-8 pr-8 pt-6 sm:grid-cols-1">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Skills
                  </label>
                  <Select
                    options={skillData}
                    isMulti
                    styles={customStyles}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    classNamePrefix="select"
                    placeholder="Select Skills"
                  />
                </div>

                {/* Skills Set */}
                <div className="border-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg border px-4 py-3 shadow-sm dark:border-strokedark">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Skills Set
                  </label>
                  <ul className="list-none space-y-3">
                    {skills.map((skill, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-md bg-white px-4 py-2 shadow-sm dark:bg-form-input"
                      >
                        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                          {skill}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="flex items-center justify-center rounded-md bg-danger px-2 py-1 text-white transition duration-300 hover:opacity-80"
                          aria-label="Remove Skill"
                        >
                          <Trash2 size={16} />
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

              {/* Submit */}
              <div className="flex justify-end px-8 py-6">
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white shadow-md transition hover:bg-green-700"
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

export default EditOperators;
