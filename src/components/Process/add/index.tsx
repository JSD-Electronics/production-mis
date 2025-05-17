"use client";
import React from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import {
  createProcess,
  viewProduct,
  createProcessLogs,
  getOrderConfirmationNumers
} from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProcess = () => {
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [orderConfirmationNo, setOrderConfirmationNo] = useState("");
  const [ocNoArr,setOcNoArr] = useState([]);
  const [descripition, setDescripition] = useState("");
  const [processID, setProcessID] = useState("");
  const [quantity, setQuantity] = useState("");
  const [products, setProduct] = useState([]);
  const [isProcessSubmitButtonDisabled, setProcessSubmitButtonDisabled] = useState(false); 
  React.useEffect(() => {
    getAllProduct();
    getOrderConfirmationNumbersList();
  }, []);
  const getOrderConfirmationNumbersList = async () => {
    try {
      let response = await getOrderConfirmationNumers();
      setOcNoArr(response.getOrderConfirmationNo);
    } catch (error) {
      console.log('Error Fethcing Order Confirmation Numbers', error?.message);
    }
  };
  const getAllProduct = async () => {
    try {
      let result = await viewProduct();
      setProduct(result.Products);
    } catch (error) {
      console.log("Error Fetching Products:", error);
    }
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const formData = {
        name,
        selectedProduct,
        orderConfirmationNo,
        processID,
        quantity,
        descripition,
      };
      const result = await createProcess(formData);
      if (result && result.status === 200) {
        let userDetails = JSON.parse(localStorage.getItem("userDetails"));
        const formData3 = new FormData();
        formData3.append("action", "CREATE");
        formData3.append("processId", result?.newProcess?._id || "");
        formData3.append("userId", userDetails?._id || "");
        formData3.append("description",`Process Created Successfully By ${userDetails?.name}`);
        try {
          const result = await createProcessLogs(formData3);
          if (result && result.status === 200) {
            toast.success("Process submitted successfully!");
          } else {
            console.error("Error Creating Process Logs");
          }
        } catch (error) {
          console.error("Error creating plan logs: ", error);
        }
      }
    } catch (error) {
      console.error("Error submitting Process:", error?.message);
      toast.error("Failed to submit Process. Please try again.");
    }
  };

  return (
    <>
      <Breadcrumb parentName="Process" pageName="Add Process" />
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
                Add Process
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-2">
                {/* Operator Name Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Process Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Process Name"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Product
                  </label>
                  <select
                    value={selectedProduct || ""}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
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
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Order Confirmation
                    </label>
                    <select
                      value={orderConfirmationNo || ""}
                      onChange={(e) => setOrderConfirmationNo(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                    >
                      <option value="" className="text-body dark:text-bodydark">
                        Please Select
                      </option>
                      {ocNoArr.map((oc, index) => (
                        <option
                          key={index}
                          value={oc.orderConfirmationNo
                          }
                          className="text-body dark:text-bodydark"
                        >
                          {oc.orderConfirmationNo}
                        </option>
                      ))}
                    </select>
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
                    />
                  </div>
                </div>
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter Quantity"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
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

export default AddProcess;
