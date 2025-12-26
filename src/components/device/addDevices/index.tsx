"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewProduct, viewProcessByProductId, createDevice } from "@/lib/api";
import {
  Package,
  Workflow,
  Hash,
  ToggleLeft,
  XCircle,
  CheckCircle,
  ListOrdered,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const AddDeviceComponent = () => {
  const [products, setProduct] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [showProcessType, setShowProcessType] = useState(false);
  const [enableZero, setEnabledZero] = useState<boolean>(false);
  const [serials, setSerials] = useState([]);
  const [form, setForm] = useState({
    prefix: "ABC-",
    sequenceFrom: 1,
    sequenceTo: 99,
    suffix: "-X",
  });
  useEffect(() => {
    getProduct();
  }, []);
  const getProcess = async (id) => {
    try {
      let result = await viewProcessByProductId(id);
      setProcesses(result.Processes);
    } catch (error) {
      console.error(`Error Fetching Process: ${error?.message}`);
    }
  };
  const getProduct = async () => {
    try {
      let result = await viewProduct();
      setProduct(result.Products);
    } catch (error) {
      console.error(`Error Fetching Products: ${error}`);
    }
  };
  const handleFileUpload = (event) => {
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
        .slice(1)
        .map((row) => row.split(",").map((field) => field.trim()))
        .filter((row) => row.every((field) => field));
      setCsvData(rows);
    };
    reader.readAsText(file);
  };
  const handleSelectedProduct = (value: any) => {
    setSelectedProduct(value);
    getProcess(value);
    setShowProcessType(true);
  };
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type, value, checked } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? true : value,
    }));
  };
  function generateSerials(
    prefix: any,
    sequenceFrom: number,
    sequenceTo: number,
    suffix: any,
    stepBy = 1,
    repeatTimes = 1,
  ) {
    console.log("sequenceFrom ==>", sequenceFrom);
    console.log("sequenceTo ==>", sequenceTo);
    const serials: string[] = [];
    for (let i = sequenceFrom; i <= sequenceTo; i += stepBy) {
      const paddedNumber = enableZero ? String(i).padStart(3, "0") : i;
      for (let r = 0; r < repeatTimes; r++) {
        serials.push(`${prefix}${paddedNumber}${suffix}`);
      }
    }
    console.log("serials ==>", serials);
    setSerials(serials);
    return serials;
  }

  const handlesubmit = async () => {
    try {
      console.log("form ====", form);
      generateSerials(
        form.prefix,
        form.sequenceFrom,
        form.sequenceTo,
        form.suffix,
      );
      let product = products.filter((value) => value._id == selectedProduct);
      let stage = product[0].stages[0].stageName;
      let formData = new FormData();

      formData.append("selectedProduct", selectedProduct);
      // formData.append("devices", JSON.stringify(csvData));
      formData.append("currentStage", stage);
      let result = await createDevice(formData);
      if (result && result?.status === 200) {
        toast.success(result?.message || "Device Created Successfully !!");
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
      <Breadcrumb pageName="Add Devices" parentName="Device Maangement " />
      <div className="grid grid-cols-1 rounded-xl border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
        {/* Product Type */}
        <div className="py-4">
          <label className="text-gray-800 mb-2 flex items-center gap-2 text-sm font-medium dark:text-bodydark">
            <Package className="h-4 w-4 text-primary" />
            Product Type
          </label>
          <select
            value={selectedProduct || ""}
            onChange={(e) => handleSelectedProduct(e.target.value)}
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

        {/* Process Type */}
        {showProcessType && (
          <div className="py-4">
            <label className="text-gray-800 mb-2 flex items-center gap-2 text-sm font-medium dark:text-bodydark">
              <Workflow className="h-4 w-4 text-primary" />
              Process Type
            </label>
            <select
              value={selectedProcess || ""}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">Please Select</option>
              {processes?.map((process, index) => (
                <option
                  key={index}
                  value={process?._id}
                  className="text-body dark:text-bodydark"
                >
                  {process?.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prefix */}
        <div className="py-3">
          <label className="text-gray-800 mb-2 flex items-center gap-2 text-sm font-medium dark:text-bodydark">
            <Hash className="h-4 w-4 text-primary" />
            Prefix Code
          </label>
          <input
            name="prefix"
            value={form.prefix}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input"
          />
        </div>

        {/* Sequence */}
        <div className="flex gap-4 py-3">
          <div className="flex-1">
            <label className="text-gray-800 mb-2 block text-sm font-medium dark:text-bodydark">
              Sequence No. From
            </label>
            <input
              type="number"
              name="sequenceFrom"
              value={form.sequenceFrom}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input"
            />
          </div>
          <div className="flex-1">
            <label className="text-gray-800 mb-2 block text-sm font-medium dark:text-bodydark">
              Sequence No. To
            </label>
            <input
              type="number"
              name="sequenceTo"
              max="10000"
              value={form.sequenceTo}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input"
            />
          </div>
        </div>

        {/* Add Zero Toggle */}
        <div className="flex items-center gap-2 py-3">
          <div>
            <label
              htmlFor="toggle1"
              className="flex cursor-pointer select-none items-center gap-3"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="toggle1"
                  className="sr-only"
                  checked={enableZero}
                  onChange={() => {
                    setEnabledZero(!enableZero);
                  }}
                />
                <div className="block h-8 w-14 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
                <div
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition ${
                    enableZero &&
                    "!right-1 !translate-x-full !bg-primary dark:!bg-white"
                  }`}
                ></div>
              </div>
              Add "0" to Number:
            </label>
          </div>
        </div>

        {/* Suffix */}
        <div className="py-3">
          <label className="text-gray-800 mb-2 block text-sm font-medium dark:text-bodydark">
            Suffix Code
          </label>
          <input
            name="suffix"
            value={form.suffix}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-form-input"
          />
        </div>

        {/* Serial Report */}
        <div className="border-gray-300 bg-gray-50 dark:bg-gray-800 mt-6 rounded-lg border border-dashed p-4 dark:border-strokedark">
          <h2 className="text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm font-semibold">
            <ListOrdered className="h-4 w-4 text-primary" />
            Serial Report
          </h2>
          {serials.length > 0 ? (
            <ul className="grid h-64 grid-cols-6 gap-2 overflow-y-auto rounded-md border border-stroke bg-white p-3 text-sm dark:border-strokedark dark:bg-boxdark">
              {serials.map((serial, index) => (
                <li
                  key={index}
                  className="rounded-md bg-primary/10 px-2 py-1 text-center text-xs font-medium text-primary dark:bg-primary/20"
                >
                  {serial}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No serials generated yet.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            className="flex w-36 items-center justify-center gap-2 rounded-lg bg-gray px-4 py-2 text-sm shadow-md transition focus:ring-2"
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

export default AddDeviceComponent;
