"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import {
  updateUser,
  getUserDetail,
  getOperatorSkills,
  getUserType,
} from "../../../lib/api";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import {
  User,
  Hash,
  Mail,
  Lock,
  Briefcase,
  Users,
  Wrench,
  CheckCircle2,
  Save,
  Calendar
} from "lucide-react";

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
  const [skills, setSkills] = useState<string[]>([]);
  const [skillData, setSkillFieldData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    if (id) {
      getUser(id);
    }
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
      result.skills.map((value: any) => {
        options.push({ value: value._id, label: value.name });
      });
      setSkillFieldData(options as any);
    } catch (error) {
      console.error("Error Fetching Skills:", error);
    }
  };

  const getUser = async (id: string) => {
    try {
      setLoading(true);
      let result = await getUserDetail(id);
      if (result?.user) {
        setName(result.user.name || "");
        setEmail(result.user.email || "");
        setEmployeeCode(result.user.employeeCode || "");
        setPassword(result.user.password || ""); // Often APIs don't return passwords for security, but keeping logic
        setDateOfBirth(result.user.dateOfBirth || "");
        setPhoneNumber(result.user.phoneNumber || "");
        setGender(result.user.gender || "M");
        setUserType(result.user.userType || "Operator");
        setSkills(result.user.skills || []);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (selected) => {
    const selectedValues = selected ? selected.map((opt: any) => opt.label) : [];
    setSkills(selectedValues);
  };

  const selectedSkillOptions = skillData.filter((opt: any) => skills.includes(opt.label));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

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

      await updateUser(formData, id);
      toast.success("User identity updated successfully!");

      setTimeout(() => {
        window.location.href = "/operators/view";
      }, 1500);

    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to update user details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      boxShadow: "none",
      padding: "2px 0",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "0.875rem",
      fontWeight: 600,
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#eff6ff",
      borderRadius: "0.5rem",
      border: "1px solid #bfdbfe",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "#1d4ed8",
      fontWeight: 700,
      fontSize: "0.75rem",
      textTransform: "uppercase",
      padding: "2px 6px",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "#1d4ed8",
      ":hover": {
        backgroundColor: "#dbeafe",
        color: "#1e40af",
        borderTopRightRadius: "0.5rem",
        borderBottomRightRadius: "0.5rem",
      },
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#111827",
      fontWeight: 600,
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: "1rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: "1px solid #f3f4f6",
      overflow: "hidden",
      zIndex: 50,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#eff6ff" : "white",
      color: state.isFocused ? "#1d4ed8" : "#374151",
      fontWeight: state.isSelected ? 700 : 500,
      cursor: "pointer",
      padding: "10px 16px",
    }),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Edit User</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Update personnel credentials and operational privileges.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          {loading ? "Updating..." : "Update User"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-12 space-y-8">

          {/* Identity Card */}
          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-boxdark dark:ring-strokedark">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">User Identity</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Personal & Access Credentials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Employee Code</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="e.g. EMP-2024-001"
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john.doe@company.com"
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <DatePickerOne
                  formLabel="Date Of Birth"
                  name="dateOfBirth"
                  id="dateOfBirth"
                  value={dateOfBirth}
                  setValue={setDateOfBirth}
                  labelClass="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block"
                  inputClass="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  icon={<Calendar className="text-gray-300" size={18} />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                <div className="relative">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setGender("M")}
                      className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all ${gender === "M"
                        ? "bg-blue-50 text-blue-600 ring-2 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-white/5"
                        }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("F")}
                      className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all ${gender === "F"
                        ? "bg-pink-50 text-pink-600 ring-2 ring-pink-100 dark:bg-pink-900/20 dark:text-pink-400"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-white/5"
                        }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Skills Card */}
          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-boxdark dark:ring-strokedark">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Role & Competency</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Privileges and Operational Skills</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">System Role</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full appearance-none rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  >
                    <option value="">Select privilege level...</option>
                    {userRoles.map((role: any, index) => (
                      <option key={index} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Skills</label>
                <div className="relative rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-2 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10 dark:border-strokedark dark:bg-form-input">
                  <div className="flex items-center pl-2">
                    <Wrench className="text-gray-300 mr-2" size={18} />
                    <div className="flex-1">
                      <Select
                        options={skillData}
                        isMulti
                        value={selectedSkillOptions}
                        onChange={handleChange}
                        styles={customStyles}
                        className="w-full"
                        classNamePrefix="select"
                        placeholder="Update operational competencies..."
                        isLoading={skillData.length === 0}
                      />
                    </div>
                  </div>
                </div>
                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-900/30">
                        <CheckCircle2 size={12} />
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EditOperators;
