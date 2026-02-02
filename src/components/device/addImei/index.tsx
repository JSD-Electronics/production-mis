"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewProduct, createIMEI } from "@/lib/api";
import { Upload, FileType, Package, XCircle, CheckCircle } from "lucide-react";
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
  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("Please select a file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);
      let parsedData = rows.map((row) => {
        return (
          row
            .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
            ?.map((field) => field.replace(/^"|"$/g, "").trim()) || []
        );
      });
      
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
      <div className="grid grid-cols-1 rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark sm:grid-cols-1">
        {/* Product Type */}
        <div className="py-4">
          <label className="text-gray-800 mb-2 flex items-center gap-2 text-sm font-medium dark:text-bodydark">
            <Package className="h-4 w-4 text-primary" />
            Product Type
          </label>
          <select
            value={selectedProduct || ""}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input"
          >
            <option value="">Please Select</option>
            {products?.map((product, index) => (
              <option
                key={index}
                value={product?._id}
                className="text-body dark:text-bodydark"
              >
                {product?.name}
              </option>
            ))}
          </select>
        </div>

        {/* Attach File */}
        <div className="py-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FileType className="h-4 w-4 text-primary" />
            Attach File
          </label>
          <div className="relative flex items-center">
            <Upload className="text-gray-500 dark:text-gray-300 absolute left-3 h-5 w-5" />
            <input
              type="file"
              className="w-full cursor-pointer rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-4 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary/90 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input dark:file:bg-primary"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            className="bg-gray hover:bg-gray focus:ring-gray flex w-36 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm shadow-md transition focus:ring-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            className="flex w-36 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-md transition hover:bg-green-700 focus:ring-2 focus:ring-green-400"
            onClick={handlesubmit}
          >
            <CheckCircle className="h-4 w-4" />
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default AddImeiComponent;
