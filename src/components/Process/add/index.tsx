"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  createProcess,
  viewProduct,
  createProcessLogs,
  getOrderConfirmationNumers,
} from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FileText,
  Package,
  ClipboardList,
  Hash,
  Layers,
  AlignLeft,
} from "lucide-react"; // âœ… Import icons

const AddProcess = () => {
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [orderConfirmationNo, setOrderConfirmationNo] = useState("");
  const [ocNoArr, setOcNoArr] = useState([]);
  const [descripition, setDescripition] = useState("");
  const [processID, setProcessID] = useState("");
  const [quantity, setQuantity] = useState("");
  const [products, setProduct] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getAllProduct();
    getOrderConfirmationNumbersList();
  }, []);

  const getOrderConfirmationNumbersList = async () => {
    try {
      let response = await getOrderConfirmationNumers();
      setOcNoArr(response.getOrderConfirmationNo);
    } catch (error) {

    }
  };

  const getAllProduct = async () => {
    try {
      let result = await viewProduct();
      setProduct(result.Products);
    } catch (error) {

    }
  };

  const validateForm = () => {
    let tempErrors: any = {};
    if (!name.trim()) tempErrors.name = "Process Name is required.";
    if (!selectedProduct) tempErrors.selectedProduct = "Product is required.";
    if (!processID.trim()) tempErrors.processID = "Process ID is required.";
    if (!quantity || Number(quantity) <= 0)
      tempErrors.quantity = "Quantity must be greater than 0.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    setIsSubmitting(true);

    try {
      let selectedProductObj = products.find(
        (value) => value._id == selectedProduct
      );
      const formData = new FormData();
      formData.append("name", name);
      formData.append("selectedProduct", selectedProduct);
      formData.append("orderConfirmationNo", orderConfirmationNo);
      formData.append("processID", processID);
      formData.append("quantity", quantity);
      formData.append("descripition", descripition);
      formData.append("stages", JSON.stringify(selectedProductObj?.stages));
      formData.append(
        "commonStages",
        JSON.stringify(selectedProductObj?.commonStages)
      );
      const result = await createProcess(formData);
      if (result && result.status === 200) {
        let userDetails = JSON.parse(localStorage.getItem("userDetails"));
        const formData3 = new FormData();
        formData3.append("action", "CREATE");
        formData3.append("processId", result?.newProcess?._id || "");
        formData3.append("userId", userDetails?._id || "");
        formData3.append(
          "description",
          `Process Created Successfully By ${userDetails?.name}`
        );

        try {
          const result = await createProcessLogs(formData3);
          if (result && result.status === 200) {
            toast.success("Process submitted successfully!");
            // reset form
            setName("");
            setSelectedProduct("");
            setOrderConfirmationNo("");
            setProcessID("");
            setQuantity("");
            setDescripition("");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputWrapper = "relative flex items-center";
  const iconClass = "absolute left-3 text-gray-400 dark:text-gray-500 w-5 h-5";
  const inputClass = (field: string) =>
    `w-full rounded-lg border-[1.5px] bg-transparent pl-10 pr-5 py-3 outline-none transition 
     ${errors[field] ? "border-danger focus:border-danger" : "border-stroke focus:border-primary"}
     dark:border-form-strokedark dark:bg-form-input dark:text-white`;

  return (
    <>
      <Breadcrumb parentName="Process" pageName="Add Process" />
      <ToastContainer position="top-center" />

      <div className="grid gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-xl border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark flex justify-between items-center">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                âž• Add New Process
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Process Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Process Name
                </label>
                <div className={inputWrapper}>
                  <FileText className={iconClass} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Process Name"
                    className={inputClass("name")}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-danger">{errors.name}</p>
                )}
              </div>

              {/* Product */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Product
                </label>
                <div className={inputWrapper}>
                  <Package className={iconClass} />
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className={inputClass("selectedProduct")}
                  >
                    <option value="">Please Select</option>
                    {products.map((product, index) => (
                      <option key={index} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.selectedProduct && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.selectedProduct}
                  </p>
                )}
              </div>

              {/* Order Confirmation */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Order Confirmation
                </label>
                <div className={inputWrapper}>
                  <ClipboardList className={iconClass} />
                  <select
                    value={orderConfirmationNo}
                    onChange={(e) => setOrderConfirmationNo(e.target.value)}
                    className={inputClass("orderConfirmationNo")}
                  >
                    <option value="">Please Select</option>
                    {ocNoArr.map((oc, index) => (
                      <option key={index} value={oc.orderConfirmationNo}>
                        {oc.orderConfirmationNo}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.orderConfirmationNo && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.orderConfirmationNo}
                  </p>
                )}
              </div>

              {/* Process ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Process ID
                </label>
                <div className={inputWrapper}>
                  <Hash className={iconClass} />
                  <input
                    type="text"
                    value={processID}
                    onChange={(e) => setProcessID(e.target.value)}
                    placeholder="Enter Process ID"
                    className={inputClass("processID")}
                  />
                </div>
                {errors.processID && (
                  <p className="mt-1 text-sm text-danger">{errors.processID}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Quantity
                </label>
                <div className={inputWrapper}>
                  <Layers className={iconClass} />
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        setQuantity(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    min="1"
                    placeholder="Enter Quantity"
                    className={inputClass("quantity")}
                  />
                </div>
                {errors.quantity && (
                  <p className="mt-1 text-sm text-danger">{errors.quantity}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Description
                </label>
                <div className={inputWrapper}>
                  <AlignLeft className={iconClass} />
                  <textarea
                    rows={5}
                    value={descripition}
                    onChange={(e) => setDescripition(e.target.value)}
                    placeholder="Enter Description"
                    className={`${inputClass("descripition")} resize-none`}
                  />
                </div>
                {errors.descripition && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.descripition}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-md px-6 py-2 font-medium text-white shadow 
                    ${isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
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
