"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  viewProduct,
  viewProcessByProductId,
  createDevice,
  getLastEntryBasedUponPrefixAndSuffix,
} from "@/lib/api";
import {
  Package,
  Workflow,
  Hash,
  PlusSquare,
  XCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GenerateSerialComponent = () => {
  const [products, setProduct] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [productId, setProductId] = useState("");
  const [processId, setProcessId] = useState("");
  const [serials, setSerials] = useState<string[]>([]);
  const [lastSerialNo, setLastSerialNo] = useState("");
  const [isGenerateSerials, setIsGenerateSerials] = useState(false);
  const [enableZero, setEnabledZero] = useState(false);

  const [form, setForm] = useState({
    prefix: "ABC-",
    noOfSerialRequired: 0,
    suffix: "-X",
    noOfZeroRequired: 0,
  });

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    if (pathParts.length >= 5) {
      setProductId(pathParts[3]);
      setProcessId(pathParts[4]);
    }
    getProcess(pathParts[3]);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    let val = type === "checkbox" ? checked : value;
    const numericVal = parseInt(val as string, 10);

    if (name === "noOfSerialRequired" && numericVal > 5000) {
      val = "5000";
      toast.error("Value should be below 5000");
    }
    if (name === "noOfZeroRequired") {
      if (!enableZero) val = 0;
      if (numericVal > 10) {
        val = "10";
        toast.error("Value should be below 10");
      }
    }

    setForm((prevForm) => ({ ...prevForm, [name]: val }));
  };

  const getLastEntry = async (prefix: any, suffix: any) => {
    try {
      let response = await getLastEntryBasedUponPrefixAndSuffix(prefix, suffix);
      return response.data;
    } catch (error) {
      console.error("Error Creating Device:", error);
    }
  };

  async function generateSerials(
    prefix: string,
    noOfSerialRequired: number,
    suffix: string,
    noOfZeroRequired: number,
  ) {
    let start = 1;
    const lastEntry = await getLastEntry(prefix, suffix);
    if (lastEntry) {
      start += parseInt(lastEntry.serialNo.split("-")[1]);
      noOfSerialRequired += start;
      setLastSerialNo(lastEntry.serialNo);
    }
    const generatedSerials: string[] = [];
    for (let i = start; i < noOfSerialRequired; i++) {
      const paddedNumber = enableZero
        ? String(i).padStart(noOfZeroRequired, "0")
        : i;
      generatedSerials.push(`${prefix}${paddedNumber}${suffix}`);
    }
    setSerials(generatedSerials);
  }

  const handleGenerateSerials = async () => {
    if (form.noOfSerialRequired > 0) {
      generateSerials(
        form.prefix,
        parseInt(form.noOfSerialRequired as any),
        form.suffix,
        form.noOfZeroRequired,
      );
      setIsGenerateSerials(true);
    } else {
      toast.error("Number of serials is required!");
    }
  };

  const handlesubmit = async () => {
    try {
      let product = products.find((value) => value._id == productId);
      let stage = product?.stages[0]?.stageName || "";

      let formData = new FormData();
      formData.append("selectedProduct", productId);
      formData.append("prefix", form.prefix);
      formData.append("noOfSerialRequired", form.noOfSerialRequired.toString());
      formData.append("lastSerialNo", lastSerialNo);
      formData.append("suffix", form.suffix);
      formData.append("noOfZeroRequired", form.noOfZeroRequired.toString());
      formData.append("enableZero", enableZero.toString());
      formData.append("processId", processId);
      formData.append("currentStage", stage);

      let result = await createDevice(formData);
      if (result?.status === 200) {
        toast.success(result?.message || "Device Created Successfully!");
      } else {
        throw new Error(result?.message || "Failed to create Device");
      }
    } catch (error) {
      console.error("Error Creating Device:", error);
    }
  };

  return (
    <>
      <ToastContainer position="top-center" />
      <Breadcrumb pageName="Generate Serials" parentName="Device Management" />

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-boxdark">
        {/* Product & Process */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="text-gray-700 mb-2 flex items-center gap-2 text-sm font-semibold dark:text-bodydark">
              <Package className="h-4 w-4 text-primary" /> Product Type
            </label>
            <select
              value={productId || ""}
              disabled
              className="border-gray-300 bg-gray-100 w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/30 disabled:cursor-not-allowed dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">Please Select</option>
              {products?.map((product, index) => (
                <option key={index} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-700 mb-2 flex items-center gap-2 text-sm font-semibold dark:text-bodydark">
              <Workflow className="h-4 w-4 text-primary" /> Process Type
            </label>
            <select
              value={processId || ""}
              disabled
              className="border-gray-300 bg-gray-100 w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/30 disabled:cursor-not-allowed dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">Please Select</option>
              {processes?.map((process) => (
                <option key={process._id} value={process._id}>
                  {process.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prefix, Suffix & Serial Inputs */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="text-gray-700 mb-2 flex items-center gap-2 text-sm font-semibold dark:text-bodydark">
              <Hash className="h-4 w-4 text-primary" /> Prefix Code
            </label>
            <input
              name="prefix"
              value={form.prefix}
              onChange={handleChange}
              className="border-gray-300 w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/30 dark:border-form-strokedark dark:bg-form-input"
            />
          </div>

          <div>
            <label className="text-gray-700 mb-2 flex items-center gap-2 text-sm font-semibold dark:text-bodydark">
              <PlusSquare className="h-4 w-4 text-primary" /> No. of Serials
              Required
            </label>
            <input
              type="number"
              name="noOfSerialRequired"
              max={5000}
              value={form.noOfSerialRequired}
              onChange={handleChange}
              className="border-gray-300 w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/30 dark:border-form-strokedark dark:bg-form-input"
            />
          </div>
        </div>

        {/* Zero Toggle & Suffix */}
        <div className="mt-6 flex items-center gap-4">
          <label className="text-gray-700 flex cursor-pointer items-center gap-2 text-sm font-semibold dark:text-bodydark">
            <input
              type="checkbox"
              checked={enableZero}
              onChange={() => setEnabledZero(!enableZero)}
              className="border-gray-300 h-4 w-4 rounded text-primary focus:ring-primary"
            />
            Add Leading Zeros
          </label>
          {enableZero && (
            <input
              type="number"
              name="noOfZeroRequired"
              max={10}
              value={form.noOfZeroRequired}
              onChange={handleChange}
              className="border-gray-300 w-20 rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/30 dark:border-form-strokedark dark:bg-form-input"
            />
          )}
        </div>

        <div className="mt-6">
          <label className="text-gray-700 mb-2 flex items-center gap-2 text-sm font-semibold dark:text-bodydark">
            <Hash className="h-4 w-4 text-primary" /> Suffix Code
          </label>
          <input
            name="suffix"
            value={form.suffix}
            onChange={handleChange}
            className="border-gray-300 w-full rounded-lg border px-4 py-2 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/30 dark:border-form-strokedark dark:bg-form-input"
          />
        </div>

        {/* Serial Report */}
        <div className="bg-gray-50 dark:bg-gray-800 mt-8 rounded-lg p-4 shadow-inner">
          <h2 className="text-gray-800 mb-3 flex items-center gap-2 text-base font-semibold dark:text-white">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Serial Report
          </h2>
          {serials.length > 0 ? (
            <div className="border-gray-200 dark:border-gray-700 dark:bg-gray-900 h-64 overflow-y-auto rounded-lg border bg-white p-3 text-sm">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {serials.map((serial, index) => (
                  <li
                    key={index}
                    className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1 text-center text-xs font-medium"
                  >
                    {serial}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-danger" /> No serials
              generated yet.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setIsGenerateSerials(false)}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition"
          >
            <XCircle className="h-4 w-4" /> Cancel
          </button>
          {!isGenerateSerials ? (
            <button
              type="button"
              onClick={handleGenerateSerials}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <PlusSquare className="h-4 w-4" /> Generate Serials
            </button>
          ) : (
            <button
              type="button"
              onClick={handlesubmit}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-500"
            >
              <CheckCircle2 className="h-4 w-4" /> Submit
            </button>
          )}
        </div>
      </div>
    </>

    // <>
    //   <ToastContainer position="top-center" />
    //   <Breadcrumb pageName="Generate Serials" parentName="Device Management" />

    //   <div className="rounded-lg bg-white p-6 mt-6 shadow-md dark:bg-boxdark">
    //     {/* Product & Process */}
    //     <div className="grid gap-6 sm:grid-cols-2">
    //       <div>
    //         <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-bodydark">
    //           Product Type
    //         </label>
    //         <select
    //           value={productId || ""}
    //           disabled
    //           className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed dark:border-form-strokedark dark:bg-form-input"
    //         >
    //           <option value="">Please Select</option>
    //           {products?.map((product, index) => (
    //             <option key={index} value={product._id}>
    //               {product.name}
    //             </option>
    //           ))}
    //         </select>
    //       </div>

    //       <div>
    //         <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-bodydark">
    //           Process Type
    //         </label>
    //         <select
    //           value={processId || ""}
    //           disabled
    //           className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed dark:border-form-strokedark dark:bg-form-input"
    //         >
    //           <option value="">Please Select</option>
    //           {processes?.map((process) => (
    //             <option key={process._id} value={process._id}>
    //               {process.name}
    //             </option>
    //           ))}
    //         </select>
    //       </div>
    //     </div>

    //     {/* Prefix, Suffix & Serial Inputs */}
    //     <div className="mt-6 grid gap-6 sm:grid-cols-2">
    //       <div>
    //         <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-bodydark">
    //           Prefix Code
    //         </label>
    //         <input
    //           name="prefix"
    //           value={form.prefix}
    //           onChange={handleChange}
    //           className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-form-strokedark dark:bg-form-input"
    //         />
    //       </div>

    //       <div>
    //         <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-bodydark">
    //           No. of Serials Required
    //         </label>
    //         <input
    //           type="number"
    //           name="noOfSerialRequired"
    //           max={5000}
    //           value={form.noOfSerialRequired}
    //           onChange={handleChange}
    //           className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-form-strokedark dark:bg-form-input"
    //         />
    //       </div>
    //     </div>

    //     {/* Zero Toggle & Suffix */}
    //     <div className="mt-6 flex items-center gap-4">
    //       <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 dark:text-bodydark">
    //         <input
    //           type="checkbox"
    //           checked={enableZero}
    //           onChange={() => setEnabledZero(!enableZero)}
    //           className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    //         />
    //         Add Leading Zeros
    //       </label>
    //       {enableZero && (
    //         <input
    //           type="number"
    //           name="noOfZeroRequired"
    //           max={10}
    //           value={form.noOfZeroRequired}
    //           onChange={handleChange}
    //           className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-form-strokedark dark:bg-form-input"
    //         />
    //       )}
    //     </div>

    //     <div className="mt-6">
    //       <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-bodydark">
    //         Suffix Code
    //       </label>
    //       <input
    //         name="suffix"
    //         value={form.suffix}
    //         onChange={handleChange}
    //         className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-form-strokedark dark:bg-form-input"
    //       />
    //     </div>

    //     {/* Serial Report */}
    //     <div className="mt-8 rounded-md bg-gray-50 p-4 shadow-inner dark:bg-gray-800">
    //       <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white">
    //         Serial Report
    //       </h2>
    //       {serials.length > 0 ? (
    //         <div className="h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
    //           <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
    //             {serials.map((serial, index) => (
    //               <li
    //                 key={index}
    //                 className="rounded-md bg-gray-100 px-2 py-1 text-center text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
    //               >
    //                 {serial}
    //               </li>
    //             ))}
    //           </ul>
    //         </div>
    //       ) : (
    //         <p className="text-sm text-gray-500">No serials generated yet.</p>
    //       )}
    //     </div>

    //     {/* Buttons */}
    //     <div className="mt-6 flex justify-end gap-4">
    //       <button
    //         type="button"
    //         onClick={() => setIsGenerateSerials(false)}
    //         className="rounded-md bg-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
    //       >
    //         Cancel
    //       </button>
    //       {!isGenerateSerials ? (
    //         <button
    //           type="button"
    //           onClick={handleGenerateSerials}
    //           className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
    //         >
    //           Generate Serials
    //         </button>
    //       ) : (
    //         <button
    //           type="button"
    //           onClick={handlesubmit}
    //           className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-500"
    //         >
    //           Submit
    //         </button>
    //       )}
    //     </div>
    //   </div>
    // </>
  );
};

export default GenerateSerialComponent;
