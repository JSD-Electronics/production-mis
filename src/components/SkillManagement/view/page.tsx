"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ConfirmationPopup from "@/components/Confirmation/page";
import Modal from "@/components/Modal/page";
import {
  createOperatorSkill,
  deleteOperatorSkill,
  getOperatorSkills,
  deleteOperatorSkillMultiple,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import {
  Plus,
  Trash2,
  Search,
  Edit,
  Trash,
  PlusCircle,
  XCircle,
  ShieldCheck
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CardDataStats from "@/components/CardDataStats";

const ViewSkillManagementComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [skillIdToDelete, setSkillIdToDelete] = useState("");
  const [skillData, setSkillData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [skillFieldId, setSkillFieldId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    getSkillField();
  }, []);

  const getSkillField = async () => {
    try {
      let result = await getOperatorSkills();
      setSkillData(result.skills || []);
    } catch (error) {
      console.error("Error Fetching Skills:", error);
      toast.error("Failed to fetch skills");
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelected = (state: any) => {
    setSelectedRows(state.selectedRows);
  };

  const handleDelete = async () => {
    try {
      await deleteOperatorSkill(skillIdToDelete);
      toast.success("Skill deleted successfully!");
      setShowPopup(false);
      getSkillField();
    } catch (error) {
      console.error("Error deleting Skill:", error);
      toast.error("Error deleting skill");
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
      await deleteOperatorSkillMultiple(selectedIds);
      setSelectedRows([]);
      toast.success("Skill(s) Deleted Successfully!");
      getSkillField();
    } catch (error) {
      console.error("Error Deleting Skill(s):", error);
      toast.error("Error deleting multiple skills");
    }
  };

  const handlepopup = (id: string) => {
    setSkillIdToDelete(id);
    setShowPopup(true);
  };

  const handleSubmitSkills = async () => {
    if (!fieldName.trim()) {
      toast.error("Skill name is required");
      return;
    }

    try {
      let slug = fieldName
        .trim()
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
        toast.success(result.message || "Skill Saved Successfully");
      }
    } catch (error) {
      console.error("Error saving skill:", error);
      toast.error("Error saving skill");
    }
  };

  const handleAddSkill = () => {
    setFieldName("");
    setSkillFieldId("");
    setIsModalOpen(true);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return skillData;
    const q = searchQuery.toLowerCase();
    return skillData.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
    );
  }, [skillData, searchQuery]);

  const columns = [
    {
      name: "ID",
      selector: (row: any, index?: number) => (index ?? 0) + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Skill Name",
      selector: (row: any) => row.name,
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black dark:text-white">{row.name}</span>
        </div>
      )
    },
    {
      name: "Slug",
      selector: (row: any) => row.slug,
      sortable: true,
      cell: (row: any) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-primary dark:bg-gray-700">
          {row.slug}
        </code>
      )
    },
    {
      name: "Created At",
      selector: (row: any) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: any) => (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleEdit(row)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white shadow-sm"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handlepopup(row._id)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white shadow-sm"
            title="Delete"
          >
            <Trash size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Breadcrumb pageName="Skill View" parentName="Settings" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CardDataStats title="Total Skills" total={String(skillData.length)} rate="">
            <ShieldCheck className="text-primary" size={24} />
          </CardDataStats>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5">
          <ToastContainer position="top-center" autoClose={3000} />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <BallTriangle height={80} width={80} color="#3C50E0" />
              <p className="mt-4 text-gray-500 font-medium">Loading skills...</p>
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-6 md:flex-row">
                <div className="relative w-full max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search skills by name or slug..."
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleMultipleRowsDelete}
                    disabled={selectedRows.length === 0}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition shadow-sm ${selectedRows.length === 0
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                      }`}
                  >
                    <Trash2 size={16} />
                    Delete Selected ({selectedRows.length})
                  </button>
                  <button
                    onClick={handleAddSkill}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-opacity-90 active:scale-95"
                  >
                    <PlusCircle size={18} />
                    Add New Skill
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="p-2">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  pagination
                  selectableRows
                  onSelectedRowsChange={handleRowSelected}
                  highlightOnHover
                  pointerOnHover
                  customStyles={{
                    header: {
                      style: {
                        display: 'none'
                      }
                    },
                    headCells: {
                      style: {
                        fontWeight: "700",
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        padding: "16px",
                      },
                    },
                    rows: {
                      style: {
                        minHeight: "64px",
                        borderBottom: "1px solid #f1f5f9",
                        "&:hover": {
                          backgroundColor: "#f8fafc",
                        },
                      },
                    },
                    cells: {
                      style: {
                        padding: "16px",
                      },
                    },
                    pagination: {
                      style: {
                        borderTop: "1px solid #f1f5f9",
                        padding: "12px",
                      }
                    }
                  }}
                  noDataComponent={
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                      <ShieldCheck size={48} />
                      <p className="mt-2 font-medium">No skills found</p>
                    </div>
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal for Add/Update */}
      <Modal
        isOpen={isModalOpen}
        onSubmit={handleSubmitSkills}
        onClose={() => setIsModalOpen(false)}
        title={skillFieldId ? "Update Skill" : "Create New Skill"}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white">
              Skill Name
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g. Soldering Specialist"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              The slug will be automatically generated from the name.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {showPopup && (
        <ConfirmationPopup
          message="Are you sure you want to permanently delete this skill? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default ViewSkillManagementComponent;
