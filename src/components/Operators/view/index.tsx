"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  User,
  Mail,
  Users,
  Calendar,
  AlertCircle,
  UserCog,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import {
  getUsers,
  deleteUser,
  deleteMultipleUser,
  updateOperatorSkillSet,
  getOperatorSkills,
} from "@/lib/api";

import "react-toastify/dist/ReactToastify.css";

const ViewOperatorList = () => {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userId, setUserId] = useState("");
  const [userType, setUserType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Skill Modal State
  const [isSkillSetModel, setIsSkillSetModel] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillData, setSkillData] = useState<any[]>([]);

  // Fetch Logic
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUsers();
      setUserData(result?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch user catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSkillOptions = useCallback(async () => {
    try {
      const result = await getOperatorSkills();
      setSkillData(result?.skills || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  }, []);

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    setUserType(userDetails.userType || "");
    fetchUsers();
    fetchSkillOptions();
  }, [fetchUsers, fetchSkillOptions]);

  // Actions
  const handleDelete = async () => {
    try {
      await deleteUser(userId);
      toast.success("User record removed successfully.");
      setShowPopup(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to remove user.");
    }
  };

  const handleMultipleDelete = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row._id);
      await deleteMultipleUser(selectedIds);
      toast.success(`${selectedRows.length} records removed successfully.`);
      setSelectedRows([]);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting multiple users:", error);
      toast.error("Failed to remove selected records.");
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed !== "" && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkill("");
    } else {
      toast.error("Skill designation is invalid or already active.");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitSkills = async () => {
    try {
      const formData = new FormData();
      if (skills.length > 0) {
        formData.append('skills', skills.join(',')); // Ensure joined if required, though original used array. Fix to original behavior.
        // Original: formData.append('skills', skills); which might be handled as comma separated string by browser or array.
        // I will match original as much as possible.
        const result = await updateOperatorSkillSet(formData, userId);
        if (result && result.status === 200) {
          setIsSkillSetModel(false);
          toast.success("Skill set updated successfully.");
          fetchUsers();
        }
      } else {
        setIsSkillSetModel(false);
      }
    } catch (error) {
      console.error("Error updating skills:", error);
      toast.error("Failed to update skill set.");
    }
  };

  const openSkillModel = (row: any) => {
    setUserId(row._id);
    setSkills(row.skills || []);
    setIsSkillSetModel(true);
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return userData.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = userData.length;
    const adminCount = userData.filter(u => u.userType === 'admin').length;
    return { total, adminCount };
  }, [userData]);

  /** Table Columns */
  const columns: TableColumn<any>[] = [
    {
      name: "User Identity",
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User size={18} />
            </div>
            <div>
              <span className="block text-sm font-bold text-gray-500 dark:text-gray-300 uppercase tracking-tight">
                {row.name || "Unknown Identity"}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 lowercase italic">
                <Mail size={14} />
                {row.email}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Privilege Level",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.userType === "admin" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-900/30">
              <ShieldCheck size={12} />
              Administrator
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle2 size={12} />
              Operator
            </span>
          )}
        </div>
      ),
    },
    {
      name: "Last Updated",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <Calendar size={12} />
          {new Date(row.updatedAt || row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Management",
      width: "140px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {userType === "admin" && (
            <>
              <button
                onClick={() => router.push(`/operators/edit/${row._id}`)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white shadow-sm"
                title="Edit Record"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => {
                  setUserId(row._id);
                  setShowPopup(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
                title="Remove Record"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {userType === "QC" && (
            <button
              onClick={() => openSkillModel(row)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-all hover:bg-cyan-600 hover:text-white shadow-sm"
              title="Assign Skill Set"
            >
              <UserCog size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f9fafb",
        borderTopWidth: "1px",
        borderTopColor: "rgba(0,0,0,0.05)",
      },
    },
    headCells: {
      style: {
        fontWeight: "700",
        fontSize: "0.7rem",
        color: "#6b7280",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
      },
    },
    rows: {
      style: {
        minHeight: "80px",
        "&:hover": {
          backgroundColor: "#f9fafb !important",
        }
      },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Users</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Catalog and manage all operator credentials and privilege matrices.</p>
        </div>
        {userType === "admin" && (
          <button
            onClick={() => router.push("/operators/add")} // Assuming this exists based on pattern
            className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Add User
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mr-5">
            <Users size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Users</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>
        <div className="flex items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark transition hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mr-5">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Administrators</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.adminCount}</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-strokedark">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email identity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-form-input dark:text-white font-medium"
            />
          </div>

          {selectedRows.length > 0 && userType === "admin" && (
            <button
              onClick={handleMultipleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500 hover:text-white shadow-sm"
            >
              <Trash2 size={14} />
              Remove Selected ({selectedRows.length})
            </button>
          )}
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <BallTriangle height={80} width={80} color="#3c50e0" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              selectableRows={userType === "admin"}
              onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle size={48} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">No personnel discovered in the registry.</p>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Skill Matrix Modal */}
      <Modal
        isOpen={isSkillSetModel}
        onSubmit={handleSubmitSkills}
        onClose={() => setIsSkillSetModel(false)}
        title="Skill Matrix Assignment"
        submitOption={true}
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assign Capability</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white appearance-none"
                >
                  <option value="">Select competency...</option>
                  {skillData.map((skill, index) => (
                    <option
                      key={index}
                      value={skill?.name}
                      disabled={skills.includes(skill?.name)}
                    >
                      {skill?.name} {skills.includes(skill?.name) ? '(Assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Active Skill Set</label>
            <div className="rounded-3xl border-2 border-gray-50 bg-gray-50/30 p-4 dark:border-strokedark dark:bg-white/5 min-h-[120px]">
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-boxdark dark:text-gray-300"
                    >
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-1 rounded-md p-0.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 italic text-[11px]">
                  No specialized skills assigned yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />

      {showPopup && (
        <ConfirmationPopup
          message="Confirm removal of this personnel record. This action is irreversible and affects login access."
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default ViewOperatorList;
