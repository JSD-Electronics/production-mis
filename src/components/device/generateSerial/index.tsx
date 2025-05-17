"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  viewProduct,
  viewProcessByProductId,
  createDevice,
  getLastEntryBasedUponPrefixAndSuffix,
} from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const GenerateSerialComponent = () => {
  const [products, setProduct] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [productId, setProductId] = useState("");
  const [processId, setProcessId] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [showProcessType, setShowProcessType] = useState(false);
  const [enableZero, setEnabledZero] = useState<boolean>(false);
  const [isGenerateSerials, setIsGenerateSerials] = useState(false);
  const [lastSerialNo, setLastSerialNo] = useState("");
  const [serials, setSerials] = useState([]);
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
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type, value, checked } = e.target;

    let val = type === "checkbox" ? checked : value;
    const numericVal = parseInt(val as string, 10);
    if (name === "noOfSerialRequired") {
      if (numericVal > 5000) {
        val = "5000";
        toast.error("Value should be below 5000");
      }
    }
    if (name === "noOfZeroRequired") {
      if(!enableZero){
        val = 0
      }
      if (numericVal > 10) {
        val = "10";
        toast.error("Value should be below 10");
      }
    }
    setForm((prevForm) => ({
      ...prevForm,
      [name]: val,
    }));
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
    prefix: any,
    noOfSerialRequired: number,
    suffix: any,
    noOfZeroRequired,
    stepBy = 1,
    repeatTimes = 1,
  ) {
    let start = 1;
    const lastEntry = await getLastEntry(prefix, suffix);
    if (lastEntry) {
      start += parseInt(lastEntry.serialNo.split("-")[1]);
      noOfSerialRequired += start;
      setLastSerialNo(lastEntry.serialNo);
    }
    const serials: string[] = [];
    for (let i = start; i < noOfSerialRequired; i += stepBy) {
      const paddedNumber = enableZero
        ? String(i).padStart(noOfZeroRequired, "0")
        : i;
      for (let r = 0; r < repeatTimes; r++) {
        serials.push(`${prefix}${paddedNumber}${suffix}`);
      }
    }
    if (serials) {
      setSerials(serials);
    }
    // return serials;
  }
  const handleGenerateSerials = async () => {
    if(form.noOfSerialRequired != 0){
      generateSerials(
        form.prefix,
        parseInt(form.noOfSerialRequired),
        form.suffix,
        form.noOfZeroRequired,
      );
      setIsGenerateSerials(true);
    } else {
      toast.error("No of serial is required!!");
    }

  };

  const handlesubmit = async () => {
    try {
      let product = products.filter((value) => value._id == productId);
      console.log("product ===>", product);
      console.log("enableZero ===>", enableZero);
      let stage = product[0].stages[0].stageName;
      let formData = new FormData();

      formData.append("selectedProduct", productId);
      formData.append("prefix", form.prefix);
      formData.append("noOfSerialRequired", form.noOfSerialRequired);
      formData.append("lastSerialNo", lastSerialNo);
      formData.append("suffix", form.suffix);
      if(enableZero){
        formData.append("noOfZeroRequired", form.noOfZeroRequired);
      }else {
        formData.append("noOfZeroRequired", form.noOfZeroRequired);
      }
      formData.append("enableZero", enableZero);
      formData.append("processId", processId);
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
      <Breadcrumb pageName="Generate Serials" parentName="Device Maangement " />
      <div className="grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
          <div className="py-4">
            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
              Product Type
            </label>
            <select
              value={productId || ""}
              //   onChange={(e) => handleSelectedProduct(e.target.value)}
              className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              disabled={true}
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
            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
              Process Type
            </label>
            <select
              value={processId || ""}
              disabled={true}
              className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">Please Select</option>
              {processes?.map((process) => (
                <option
                  key={process._id}
                  value={process._id}
                  className="text-body dark:text-bodydark"
                >
                  {process.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div>
              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                Prefix Code:
              </label>
              <input
                name="prefix"
                value={form.prefix}
                onChange={handleChange}
                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              />
            </div>

            <div className="flex gap-4 py-3">
              {/* <div className="flex-1">
                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                  Sequence No. From:
                </label>
                <input
                  type="number"
                  name="sequenceFrom"
                  value={form.sequenceFrom}
                  onChange={handleChange}
                  className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                />
              </div> */}
              <div className="flex-1">
                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                  No of Serial Required
                </label>
                <input
                  type="number"
                  name="noOfSerialRequired"
                  max={"5000"}
                  value={form.noOfSerialRequired}
                  onChange={handleChange}
                  className="dark:bg-form-input1 relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark"
                />
              </div>
            </div>
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
              {enableZero && (
                <div className="flex-1">
                  <input
                    type="number"
                    name="noOfZeroRequired"
                    max={"10"}
                    value={form.noOfZeroRequired}
                    onChange={handleChange}
                    className="dark:bg-form-input1 relative z-20 w-20 appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark"
                  />
                </div>
              )}
            </div>
            <div className="py-3">
              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                Suffix Code:
              </label>
              <input
                name="suffix"
                value={form.suffix}
                onChange={handleChange}
                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              />
            </div>
          </div>
          <div className="bg-gray-100 rounded py-4">
            <h2 className="mb-2 font-semibold">Serial Report:</h2>
            {serials.length > 0 ? (
              <ul className="grid h-64 grid-cols-6 overflow-x-auto pl-6">
                {serials.map((serial, index) => (
                  <li key={index}>{serial}</li>
                ))}
              </ul>
            ) : (
              <p>No serials generated yet.</p>
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4 text-right">
            <button
              type="button"
              className="w-40 rounded-lg bg-graydark px-2 py-2 text-sm text-white hover:bg-graydark"
              onClick={() => {setIsGenerateSerials(false);}}
            >
              Cancel
            </button>
            {!isGenerateSerials && (
              <button
                type="button"
                className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-400"
                onClick={handleGenerateSerials}
              >
                Generate Serials
              </button>
            )}
            {isGenerateSerials && (
              <button
                type="button"
                className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-400"
                onClick={handlesubmit}
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateSerialComponent;
