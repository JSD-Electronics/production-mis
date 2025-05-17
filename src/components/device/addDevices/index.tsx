"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewProduct, viewProcessByProductId, createDevice } from "@/lib/api";
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
      <div className="grid grid-cols-1 bg-white shadow-lg dark:bg-boxdark sm:grid-cols-1">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
          <div className="py-4">
            <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
              Product Type
            </label>
            <select
              value={selectedProduct || ""}
              onChange={(e) => handleSelectedProduct(e.target.value)}
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
          {showProcessType && (
            <div className="py-4">
              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                Process Type
              </label>
              <select
                value={selectedProcess || ""}
                onChange={(e) => {
                  setSelectedProcess(e.target.value);
                }}
                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              >
                <option value="">Please Select</option>
                {processes?.map((process, index) => (
                  <>
                    <option
                      key={index}
                      value={process?._id}
                      className="text-body dark:text-bodydark"
                    >
                      {process?.name}
                    </option>
                  </>
                ))}
              </select>
            </div>
          )}
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
              <div className="flex-1">
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
              </div>
              <div className="flex-1">
                <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                  Sequence No. To:
                </label>
                <input
                  type="number"
                  name="sequenceTo"
                  max={"10000"}
                  value={form.sequenceTo}
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
          <div className="bg-gray-100 rounded p-4">
            <h2 className="mb-2 font-semibold">Serial Report:</h2>
            {serials.length > 0 ? (
              <ul className="grid grid-cols-6 pl-6 h-64 overflow-x-auto">
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

export default AddDeviceComponent;
