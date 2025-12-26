"use client";
import React, { useState } from "react";
import { createJigCategory } from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/Modal/page";

const AddCategoryModal = ({ isOpen, onClose, onSuccess,name,setName,status,setStatus,categoryModelName,categoryId }) => {

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitDisabled(true);

    const formData = new FormData();
    formData.append("id", categoryId);
    formData.append("name", name);
    formData.append("status", status);

    try {
      const result = await createJigCategory(formData);
      if (result && result.status === 200) {
        toast.success(result.message || "Jig Category Created Successfully");
        onSuccess?.(); // callback to refresh parent data if needed
        onClose();
      } else {
        throw new Error(result.message || "Failed to create category");
      }
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while creating the category.",
      );
      setSubmitDisabled(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}

      <Modal
        isOpen={isOpen}
        onSubmit={handleSubmit}
        onClose={onClose}
        title={categoryModelName}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Jig Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            required
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </Modal>
    </>
  );
};

export default AddCategoryModal;
