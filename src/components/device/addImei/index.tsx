"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewProduct, createIMEI } from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const AddImeiComponent = () => {
  const [products, setProduct] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  useEffect(() => {
    getProduct();
  }, []);
  const getProduct = async () => {
    try {
      let result = await viewProduct();
      setProduct(result.Products);
    } catch (error) {
      console.error(`Error Fetching Products: ${error}`);
    }
  };
  const handleFileUpload = (event:any) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("Please select a file.");
      return;
    }
    // if (!file.name.endsWith(".csv")) {
    //   console.error("Please upload a CSV file.");
    //   return;
    // }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split("\n").map((row) => row.trim()).filter(Boolean);
      let parsedData = rows.map((row) => {
        return row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((field) => field.replace(/^"|"$/g, "").trim()) || [];
      });
    //   parsedData = parsedData.map(row => row.slice(1));
  
      console.log("Processed CSV Data:", parsedData);
      setCsvData(parsedData);
    };
    reader.readAsText(file);
  };
  

  const handlesubmit = async () => {
    try {
      let formData = new FormData();
      formData.append("selectedProduct", selectedProduct);
      formData.append("imei", JSON.stringify(csvData));
      let result = await createIMEI(formData);
      if (result && result?.status === 200) {
        toast.success(result?.message || "IMEIs Added Successfully !!");
      } else {
        throw new Error(result?.message || "Failed to create Device");
      }
    } catch (error) {
      console.error("Error Creating Device:", error);
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
      <Breadcrumb pageName="Add IMEI" parentName="Device Maangement " />
      <div className="grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
          <div className="py-4">
            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
              Product Type
            </label>
            <select
              value={selectedProduct || ""}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">Please Select</option>
              {products?.map((product, index) => (
                <>
                  <option
                    key={index}
                    value={product?._id}
                    className="text-body dark:text-bodydark"
                  >
                    {product?.name}
                  </option>
                </>
              ))}
            </select>
          </div>
          <div className="py-4">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Attach file
            </label>
            <input
              type="file"
              className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
              onChange={handleFileUpload}
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 text-right">
            <button
              type="button"
              className="w-40 rounded-lg bg-graydark px-2 py-2 text-sm text-white hover:bg-graydark"
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-400"
              onClick={handlesubmit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddImeiComponent;
