"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { createJig, viewJigCategory, fetchJigByJigId } from "@/lib/api";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddJig = () => {
  const [name, setName] = useState("");
  const [jigCategoryId, setJigCategoryID] = useState("");
  const [id, setID] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [jigCategoryData, setJigCategoryData] = useState([]);
  const validateForm = () => {
    return true;
  };
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getJigCategoryById(id);
    getJigCategory();
  }, []);
  const getJigCategory = async () => {
    try {
      let result = await viewJigCategory();
      setJigCategoryData(result.JigCategories);
    } catch (error) {
      console.error("Error fetching stages:", error);
    }
  };
  const getJigCategoryById = async (id: any) => {
    try {
      let result = await fetchJigByJigId(id);
      let JigsModel = result.Jigs;

      setName(JigsModel?.name);
      setJigCategoryID(JigsModel?.jigCategory);
      //setJigCategoryData(result.JigCategories);
    } catch (error) {
      console.error("Error fetching stages:", error);
    }
  };
  const handlesubmit = async () => {
    setSubmitDisabled(true);
    const formData = new FormData();
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    if (id) {
      formData.append("id", id);
    }
    formData.append("name", name);
    formData.append("jigCategory", jigCategoryId);
    try {
      const result = await createJig(formData);
      if (result && result.status === 200) {
        toast.success(result.message || "Jig Created Successfully");
      } else {
        throw new Error(result.message || "Failed to create stage");
      }
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while creating the stage.",
      );
      setSubmitDisabled(false);
    }
  };
  return (
    <>
      <ToastContainer
        position="top-center"
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Breadcrumb pageName="Add Jig" parentName="Jig Maangement " />
      <div className="grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1">
        <div className="flex flex-col gap-9">
          {/* <!-- Contact Form --> */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Add Jig Form
              </h3>
            </div>
            <form action="#">
              <div className="flex flex-col gap-5.5 p-6.5">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Jig Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Jig Categories
                  </label>
                  <select
                    value={jigCategoryId}
                    onChange={(e) => setJigCategoryID(e.target.value)}
                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                  >
                    <option value="" className="text-body dark:text-bodydark">
                      Select Jig Category
                    </option>
                    {jigCategoryData?.map((jigCategory, index) => (
                      <option
                        key={index}
                        value={jigCategory._id}
                        className="text-body dark:text-bodydark"
                      >
                        {jigCategory.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-12 flex justify-end gap-5">
                  <button
                    type="button"
                    onClick={handlesubmit}
                    disabled={submitDisabled}
                    className="mt-4 flex items-center rounded-md bg-[#34D399] px-4 py-2 text-white"
                  >
                    {submitDisabled ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddJig;
