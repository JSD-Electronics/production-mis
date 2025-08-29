"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState } from "react";
import {
  updateProcess,
  getProcessByID,
  viewProduct,
  createProcessLogs,
  updateQuantity,
} from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import Modal from "@/components/Modal/page";
import "react-toastify/dist/ReactToastify.css";

const EditProcess = () => {
  const [name, setName] = useState("");
  const [isAddQuantityModel, setIsAddQuantityModel] = useState(false);

  const [orderConfirmationNo, setOrderConfirmationNo] = useState("");
  const [descripition, setDescripition] = useState("");
  const [processID, setProcessID] = useState("");
  const [quantity, setQuantity] = useState("");
  const [products, setProduct] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [processStatus, setProcessStatus] = useState("");
  const [addMoreQuantity, setMoreQuantity] = useState(0);
  const closeAddQuantityModel = () => {
    setIsAddQuantityModel(false);
  };
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getProcess(id);
    getAllProduct();
  }, []);
  const getAllProduct = async () => {
    try {
      let result = await viewProduct();
      setProduct(result.Products);
    } catch (error) {
      console.log("Error Fetching Products:", error);
    }
  };
  const getProcess = async (id: any) => {
    try {
      let result = await getProcessByID(id);
      setName(result.name);
      setOrderConfirmationNo(result.orderConfirmationNo);
      setSelectedProduct(result.selectedProduct);
      setDescripition(result.descripition);
      setProcessID(result.processID);
      setQuantity(result.quantity);
      setProcessStatus(result?.status);
    } catch (error) {
      console.error("Error Fetching Process:");
      toast.error("Failed to Fetching Process. Please try again.");
    }
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      const existingProcess = await getProcessByID(id);

      let selectedProductObj = products.find((value) => value._id == selectedProduct);
      const formData = new FormData();
      formData.append("name",name);
      formData.append("selectedProduct",selectedProduct);
      formData.append("orderConfirmationNo",orderConfirmationNo);
      formData.append("processID",processID);
      formData.append("quantity", quantity);
      formData.append("descripition",descripition);
      if(processStatus != "active" || processStatus != "down_time_hold" || processStatus != "completed"){
        formData.append("stages",JSON.stringify(selectedProductObj?.stages));
        formData.append("commonStages",JSON.stringify(selectedProductObj?.commonStages));
      }

      const result = await updateProcess(formData, id);

      if (result && result.status == 200) {
        let userDetails = JSON.parse(localStorage.getItem("userDetails"));
        const pathname = window.location.pathname;
        const id = pathname.split("/").pop();
        const formData3 = new FormData();
        formData3.append("action", "UPDATE");
        formData3.append("processId", id || "");
        formData3.append("userId", userDetails?._id || "");

        // Detect changes
        let changes = [];
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== existingProcess[key]) {
            changes.push(
              `${key} updated from "${existingProcess[key]}" to "${formData[key]}"`,
            );
          }
        });

        // Convert changes array into a string for logging
        const changeDescription = changes.length
          ? `Process Edited By ${userDetails?.name}. Changes: ${changes.join(", ")}`
          : `Process Edited By ${userDetails?.name}. No significant changes.`;

        formData3.append("description", changeDescription);

        try {
          const logResult = await createProcessLogs(formData3);
          if (logResult && logResult.status === 200) {
            toast.success("Process updated successfully!");
          } else {
            console.error("Error Creating Process Logs");
          }
        } catch (error) {
          console.error("Error creating plan logs: ", error);
        }
      }
    } catch (error) {
      console.error("Error updating Process:", error);
      toast.error("Failed to update Process. Please try again.");
    }
  };
  const handleAddQuantity = () => {
    setIsAddQuantityModel(true);
  };
  const handleSubmitQuantity = async () => {
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      let formData = new FormData();
      formData.append("quantity", addMoreQuantity);
      let response = await updateQuantity(formData, id);
      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      const formData3 = new FormData();
      formData3.append("action", "PROCESS_EXTENDED");
      formData3.append("processId", id || "");
      formData3.append("userId", userDetails?._id || "");
      formData3.append( "description",`${addMoreQuantity} Quantity is added into process ${name}`);

      try {
        const logResult = await createProcessLogs(formData3);
        if (logResult && logResult.status === 200) {
          toast.success("Process updated successfully!");
          getProcess(id);
        } else {
          console.error("Error Creating Process Logs");
        }
      } catch (error) {
        console.error("Error creating plan logs: ", error);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
    setIsAddQuantityModel(false);
  };

  return (
    <>
      <Breadcrumb parentName="Process" pageName="Edit Process" />
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
                Edit Process
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-2">
                {/* Operator Name Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Process Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Process Name"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      readOnly={
                        processStatus == "process_created" ? false : true
                      }
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Product
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                    disabled={processStatus == "process_created" ? false : true}
                  >
                    <option value="" className="text-body dark:text-bodydark">
                      Please Select
                    </option>
                    {products.map((product, index) => (
                      <option
                        key={index}
                        value={product._id}
                        className="text-body dark:text-bodydark"
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-x-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Order Confirmation
                    </label>
                    <input
                      type="text"
                      value={orderConfirmationNo}
                      onChange={(e) => setOrderConfirmationNo(e.target.value)}
                      placeholder="Enter Process Name"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      readOnly={
                        processStatus == "process_created" ? false : true
                      }
                    />
                  </div>
                </div>
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Process ID
                    </label>
                    <input
                      type="text"
                      value={processID}
                      onChange={(e) => setProcessID(e.target.value)}
                      placeholder="Enter Process Name"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      readOnly={
                        processStatus == "process_created" ? false : true
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-1">
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Quantity
                    </label>
                    <div className="flex items-center  gap-3">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter Quantity"
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        readOnly={
                          processStatus == "process_created" ? false : true
                        }
                      />
                      {processStatus != "process_created" && (
                        <button
                          type="button"
                          onClick={handleAddQuantity}
                          className="flex items-center justify-between rounded-md bg-blue-700 px-3 py-2.5 text-white transition hover:bg-blue-600"
                        >
                          <svg
                            fill="#ffffff"
                            version="1.1"
                            id="Capa_1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="10px"
                            height="10px"
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
                          </svg>{" "}
                          Add
                        </button>
                      )}

                      <Modal
                        isOpen={isAddQuantityModel}
                        onSubmit={handleSubmitQuantity}
                        onClose={closeAddQuantityModel}
                        title={"ADD Quantity Production"}
                      >
                        <div className="pb-3">
                          <div className="justify-between">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Quantity
                            </label>
                            <div className="flex items-center  gap-3">
                              <input
                                type="number"
                                value={addMoreQuantity}
                                onChange={(e) =>
                                  setMoreQuantity(e.target.value)
                                }
                                placeholder="Enter Quantity"
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>
                      </Modal>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 pr-8 pt-4">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Description
                  </label>
                  <textarea
                    rows={6}
                    value={descripition}
                    onChange={(e) => setDescripition(e.target.value)}
                    readOnly={processStatus == "process_created" ? false : true}
                    placeholder="Description"
                    className="w-full rounded-lg border-[1.5px] border-primary bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input dark:text-white"
                  ></textarea>
                </div>
              </div>
              {/* Submit Button */}
              <div className="col-span-2 flex justify-end p-8 pr-8">
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProcess;
