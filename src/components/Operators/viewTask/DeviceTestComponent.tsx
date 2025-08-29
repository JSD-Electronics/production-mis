"use client";
import Modal from "@/components/Modal/page";
import { useQRCode } from "next-qrcode";
import SearchableInput from "@/components/SearchableInput/SearchableInput";
import {
  createCarton,
  fetchCartonByProcessID,
  fetchCartons,
  shiftToPDI,
} from "@/lib/api";
import {
  FileText,
  Cpu,
  Timer,
  Zap,
  Search,
  BookOpenCheck,
  ListChecks,
  AlertTriangle,
  Coffee,
  SquareStop,
  CheckCircle,
  XCircle,
  Printer,
  ScanLine,
  Box,
  PlusCircle,
  Barcode,
  Package,
  Weight,
  Layers,
  ClipboardCheck,
  ClipboardList,
  Check,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import StickerGenerator from "../viewTask-old/StickerGenerator";

interface Cart {
  cartonSerial: string;
  processId: string;
  devices: any[];
  cartonSize: { width: number; height: number };
  maxCapacity: number;
  weightCarton: number;
  status: "empty" | "partial" | "full";
}
interface DeviceTestComponentProps {
  product: any;
  isPaused: any;
  setIsPaused: any;
  setStartTest: any;
  timerDisplay: any;
  setDevicePause: any;
  deviceDisplay: any;
  deviceList: any[];
  checkedDevice: any[];
  searchQuery: any;
  setSearchQuery: any;
  handleNoResults: any;
  getDeviceById: any;
  setSearchResult: any;
  setIsPassNGButtonShow: any;
  setIsStickerPrinted: any;
  searchResult: any;
  deviceHistory: any[];
  notFoundError: any;
  openReportIssueModel: any;
  isReportIssueModal: any;
  handleSubmitReport: any;
  closeReportIssueModal: any;
  setIssueType: any;
  setIssueDescription: any;
  processAssignUserStage: any;
  isStickerPrinted: any;
  isPassNGButtonShow: any;
  handlePrintSticker: any;
  handleVerifySticker: any;
  isVerifyStickerModal: any;
  handleVerifyStickerModal: any;
  closeVerifyStickerModal: any;
  serialNumber: any;
  setSerialNumber: any;
  handleUpdateStatus: any;
  processData: any;
  setCartons: any;
  cartons: any;
  isVerifiedSticker: any;
  setIsCartonBarCodePrinted: any;
  isCartonBarcodePrinted: any;
  setProcessCartons: any;
  processCartons: any[];
}
export default function DeviceTestComponent({
  product,
  isPaused,
  setIsPaused,
  setStartTest,
  timerDisplay,
  setDevicePause,
  deviceDisplay,
  deviceList,
  checkedDevice,
  searchQuery,
  setSearchQuery,
  handleNoResults,
  getDeviceById,
  setSearchResult,
  setIsPassNGButtonShow,
  setIsStickerPrinted,
  searchResult,
  deviceHistory,
  notFoundError,
  openReportIssueModel,
  isReportIssueModal,
  handleSubmitReport,
  closeReportIssueModal,
  setIssueType,
  setIssueDescription,
  processAssignUserStage,
  isStickerPrinted,
  isPassNGButtonShow,
  handlePrintSticker,
  handleVerifySticker,
  isVerifyStickerModal,
  handleVerifyStickerModal,
  closeVerifyStickerModal,
  serialNumber,
  setSerialNumber,
  handleUpdateStatus,
  processData,
  setCartons,
  cartons,
  isVerifiedSticker,
  setIsCartonBarCodePrinted,
  isCartonBarcodePrinted,
  setProcessCartons,
  processCartons,
}: DeviceTestComponentProps) {
  useEffect(() => {
    fetchExistingCartonsByProcessID();
    fetchProcessCartons();
  }, []);

  const { Canvas } = useQRCode();
  const [qrCartons, setQrCartons] = useState<{ [key: string]: boolean }>({});
  const handlePrint = () => {
    setIsCartonBarCodePrinted(true);
    const printContents = document.getElementById("barcode-area")?.innerHTML;
    console.log("printContents ==>", printContents);
    const printWindow = window.open("", "_blank", "width=600,height=400");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Carton Barcode</title>
          </head>
          <body style="text-align:center;">
            ${printContents}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };
  const handleGenerateQRCode = async (carton: any) => {
    try {
      if (!carton.cartonSerial) {
        // Case 1: New carton → save first
        const response = await createCarton(carton);
        if (response?.newCartonModel) {
          alert("Carton saved! Now generating QR Code...");
          setQrCartons((prev) => ({
            ...prev,
            [response.newCartonModel.cartonSerial]: true,
          }));
        }
      } else {
        // Case 2: Existing carton → just generate QR
        setQrCartons((prev) => ({
          ...prev,
          [carton.cartonSerial]: true,
        }));
      }
    } catch (error) {
      console.error("Error generating QR Code:", error);
    }
  };
  const fetchProcessCartons = async () => {
    try {
      let result = await fetchCartons(processData._id);
      setProcessCartons(result);
    } catch (error) {
      console.error("Error fetching cartons:", error);
    }
  };
  const fetchExistingCartonsByProcessID = async () => {
    try {
      setCartons([]);
      const result = await fetchCartonByProcessID(processData._id);
      const cartons = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [result];
      const transformed = cartons.map((carton: any) => ({
        ...carton,
        devices: carton.devices?.map((d: any) => d.serialNo) || [],
      }));
      console.log("transformed ==>", transformed);
      setCartons(transformed);
    } catch (error) {
      console.error("Error fetching cartons:", error);
    }
  };
  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
    setDevicePause((prev) => !prev);
  };
  const handleStop = () => {
    setIsPaused(true);
    setStartTest(false);
  };
  const handleAddToCart = async (packagingData: any) => {
    if (!searchResult) {
      alert("No device selected to add.");
      return;
    }

    const selectedDevice = deviceList.find(
      (d: any) => d.serialNo === searchResult,
    );

    if (!selectedDevice) {
      alert("Selected device not found.");
      return;
    }

    let newCarton: Cart | null = null;

    setCartons((prevCarts: Cart[]) => {
      console.log("prevCarts ==>", prevCarts);
      const deviceExists = prevCarts.some((c) =>
        c.devices.includes(selectedDevice.serialNo),
      );
      if (deviceExists) {
        alert("This device is already in a carton!");
        return prevCarts;
      }

      let updatedCarts = [...prevCarts];
      let targetCart = updatedCarts.find(
        (c) =>
          c.processId === processData._id && c.devices.length < c.maxCapacity,
      );

      if (!targetCart) {
        targetCart = {
          cartonSerial: `CARTON-${Date.now()}`,
          processId: processData._id,
          devices: [],
          cartonSize: {
            width: packagingData.packagingData.cartonWidth,
            height: packagingData.packagingData.cartonHeight,
          },
          maxCapacity: packagingData.packagingData.maxCapacity,
          weightCarton: packagingData.packagingData.cartonWeight,
          status: "empty",
        };

        updatedCarts.push(targetCart);
        newCarton = targetCart;
      }

      targetCart.devices = [...targetCart.devices, selectedDevice.serialNo];

      targetCart.status =
        targetCart.devices.length >= targetCart.maxCapacity
          ? "full"
          : "partial";
      if (targetCart.status == "partial") {
        setIsCartonBarCodePrinted(false);
      }
      return updatedCarts;
    });

    // 🔹 Backend call after state update
    try {
      await createCarton({
        cartonSerial: newCarton
          ? newCarton.cartonSerial
          : `CARTON-${Date.now()}`,
        processId: processData._id,
        devices: [selectedDevice._id],
        packagingData: {
          width: packagingData.packagingData.cartonWidth,
          height: packagingData.packagingData.cartonHeight,
          weight: packagingData.packagingData.cartonWeight,
          maxCapacity: packagingData.packagingData.maxCapacity,
        },
      });
      setSerialNumber("");
      handleUpdateStatus("Pass");
    } catch (error) {
      console.error("Failed to create carton on backend:", error);
    }
  };
  const handleShiftToPDI = async () => {
    try {
      if (processCartons.length === 0) {
        alert("No cartons available to shift.");
        return;
      }
      const cartonSerials = processCartons.map((row) => row.cartonSerial);
      const formData = new FormData();
      cartonSerials.forEach((serial, index) => {
        formData.append(`cartons[${index}]`, serial);
      });
      const response = await shiftToPDI(formData);
      if (response) {
        const data = await response.json();
        alert("Cartons shifted to PDI successfully!");
        setProcessCartons([]);
      } else {
        console.error("Failed to shift cartons:", response.statusText);
        alert("Error shifting cartons to PDI.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while shifting cartons.");
    }
  };

  return (
    <>
      {/* SOP Section */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-gray-800 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-blue-600" />
            Standard Operating Procedure (SOP)
          </h3>
          <span className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
            Active
          </span>
        </div>

        {/* SOP Content */}
        <div className="text-gray-700 mt-4 space-y-3 text-sm">
          {product?.sopFile ? (
            <div className="mt-4">
              <h3 className="text-md text-gray-800 mb-2 flex items-center gap-2 font-semibold">
                <BookOpenCheck className="h-5 w-5 text-green-600" />
                SOP Preview
              </h3>

              {product?.sopFile.endsWith(".pdf") ? (
                // PDF Preview
                <iframe
                  src={product?.sopFile}
                  className="h-96 w-full rounded-lg border"
                  title="SOP PDF Preview"
                />
              ) : product?.sopFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                // Image Preview
                <Image
                  src={product?.sopFile}
                  alt="SOP Preview"
                  width={600}
                  height={400}
                  className="h-96 w-full rounded-lg object-contain"
                />
              ) : (
                // Fallback
                <a
                  href={product?.sopFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-700 px-5 py-2 text-white"
                >
                  Open SOP File
                </a>
              )}
            </div>
          ) : (
            <div className="text-gray-500 mt-2 text-center">No SOP Found</div>
          )}
        </div>
      </div>

      {/* Devices Section */}
      <div className="mt-6 rounded-2xl bg-white from-white to-white p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-gray-800 flex items-center gap-2 text-lg font-semibold">
            <Cpu className="h-5 w-5 text-indigo-600" />
            Devices
          </h3>
          <p className="bg-gray-100 text-gray-700 flex items-center gap-1 rounded-full px-3 py-1 text-sm">
            <Timer className="text-gray-500 h-4 w-4" />
            <b>Elapsed:</b> <span>{timerDisplay}</span>
          </p>
        </div>

        {/* Content */}
        <div className="mt-5 grid grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="space-y-4">
            {/* Testing Time */}
            <div className="flex justify-end">
              <p className="text-gray-700 flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm">
                <Zap className="h-4 w-4 text-yellow-600" />
                <b>Testing:</b> {deviceDisplay}
              </p>
            </div>

            {/* Device Search Box */}
            <div
              className={`${
                isPaused && "blur-sm"
              } border-gray-200 rounded-xl border bg-white p-4 shadow-sm`}
            >
              <label className="text-gray-600 mb-2 flex items-center gap-2 text-sm font-semibold">
                <Search className="text-gray-500 h-4 w-4" />
                Search Device
              </label>
              <SearchableInput
                options={deviceList}
                checkedDevice={checkedDevice}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNoResults={handleNoResults}
                setSearchResult={setSearchResult}
                getDeviceById={getDeviceById}
                setIsPassNGButtonShow={setIsPassNGButtonShow}
                setIsStickerPrinted={setIsStickerPrinted}
              />

              {/* Device Result */}
              {searchResult ? (
                <div className="mt-4">
                  <h3 className="text-gray-800 border-b pb-2 text-sm font-bold">
                    {searchResult}
                  </h3>
                  {deviceHistory.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-gray-600 mb-2 flex items-center gap-2 text-xs font-semibold">
                        <ListChecks className="text-gray-500 h-4 w-4" />
                        Previous Stages
                      </h5>
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 text-gray-600">
                            <tr>
                              <th className="px-2 py-1">Serial</th>
                              <th className="px-2 py-1">Stage</th>
                              <th className="px-2 py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deviceHistory.map((value, index) => (
                              <tr key={index} className="border-t text-center">
                                <td className="px-2 py-1">{value?.serialNo}</td>
                                <td className="px-2 py-1">
                                  {value?.stageName}
                                </td>
                                <td
                                  className={`px-2 py-1 font-medium ${
                                    value?.status === "Pass"
                                      ? "text-green-600"
                                      : value?.status === "NG"
                                        ? "text-red-500"
                                        : "text-gray-500"
                                  }`}
                                >
                                  {value?.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="my-3 w-full">
                    {/* CASE 1: Printing Stage */}
                    {processAssignUserStage?.subSteps?.some(
                      (s: any) => s.isPrinterEnable,
                    ) && (
                      <>
                        {/* Print Sticker */}
                        {!isStickerPrinted && !isPassNGButtonShow && (
                          <>
                            {processAssignUserStage.subSteps.map(
                              (subStep: any, subIndex: number) =>
                                subStep.isPrinterEnable &&
                                subStep.printerFields.map(
                                  (printerField: any, printerIndex: number) => (
                                    <div
                                      id="sticker-preview"
                                      key={`${subIndex}-${printerIndex}`}
                                      className="bg-gray-100 mb-4 flex items-center justify-center rounded-xl border p-4 shadow-sm"
                                    >
                                      <StickerGenerator
                                        stickerData={printerField}
                                        deviceData={deviceList.filter(
                                          (d: any) =>
                                            d.serialNo === searchResult,
                                        )}
                                      />
                                    </div>
                                  ),
                                ),
                            )}
                            <div className="flex justify-center">
                              <button
                                className="mx-2 my-2 flex items-center gap-2 rounded-lg bg-primary px-2.5 py-2 text-white shadow hover:bg-primary/80"
                                onClick={handlePrintSticker}
                              >
                                <Printer className="h-5 w-5" />
                                Print Sticker
                              </button>
                            </div>
                          </>
                        )}

                        {/* Verify Sticker */}
                        {!isVerifiedSticker &&
                          isStickerPrinted &&
                          !isPassNGButtonShow && (
                            <div className="flex justify-center">
                              <button
                                type="button"
                                className="my-2 flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-white shadow hover:bg-green-700"
                                onClick={handleVerifySticker}
                              >
                                <ScanLine className="h-5 w-5" />
                                Verify Sticker
                              </button>
                              <Modal
                                isOpen={isVerifyStickerModal}
                                onSubmit={handleVerifyStickerModal}
                                onClose={closeVerifyStickerModal}
                                title="Verify Sticker"
                              >
                                <div className="space-y-4">
                                  <label className="block text-sm font-medium text-black dark:text-white">
                                    Enter / Scan Serial Number
                                  </label>
                                  <input
                                    type="text"
                                    name="serialNumber"
                                    value={serialNumber || ""}
                                    autoComplete="off"
                                    onChange={(e) =>
                                      setSerialNumber(e.target.value)
                                    }
                                    placeholder="Scan QR code or enter serial number"
                                    className="border-gray-300 dark:border-gray-600 dark:bg-gray-800 w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:text-white"
                                  />
                                </div>
                              </Modal>
                            </div>
                          )}
                        {/* Pass / NG */}
                        {isPassNGButtonShow &&
                          !processAssignUserStage?.subSteps?.some(
                            (subStep: any) => subStep.isPackagingStatus,
                          ) && (
                            <div className="flex justify-center gap-4 p-6">
                              <button
                                className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-white shadow hover:bg-green-500"
                                onClick={() => handleUpdateStatus("Pass")}
                              >
                                <CheckCircle className="h-5 w-5" />
                                Pass
                              </button>
                              <button
                                className="hover:bg-red-600 flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-white shadow"
                                onClick={() => handleUpdateStatus("NG")}
                              >
                                <XCircle className="h-5 w-5" />
                                NG
                              </button>
                            </div>
                          )}
                      </>
                    )}

                    {/* CASE 2: Packaging Stage */}
                    {isPassNGButtonShow &&
                      processAssignUserStage?.subSteps?.some(
                        (s: any) => s.isPackagingStatus,
                      ) && (
                        <div className="py-6">
                          {processAssignUserStage.subSteps.map(
                            (subStep: any, index: number) => {
                              if (!subStep.isPackagingStatus) return null;

                              const isCarton =
                                subStep.packagingData?.packagingType ===
                                "Carton";

                              return (
                                <div
                                  key={index}
                                  className="border-gray-200 dark:border-gray-700 dark:bg-gray-900 mb-8 rounded-2xl border bg-white p-6 shadow-lg"
                                >
                                  {/* Header */}
                                  <div className="mb-4 flex items-center gap-2">
                                    <Box className="h-6 w-6 text-primary" />
                                    <h3 className="text-gray-900 text-xl font-semibold dark:text-white">
                                      {isCarton
                                        ? "📦 Carton Details"
                                        : "📄 Single Device Sticker"}
                                    </h3>
                                  </div>
                                  <hr className="border-gray-300 dark:border-gray-700 mb-4" />
                                  {isCarton ? (
                                    <>
                                      {/* Carton Info Grid */}
                                      <div className="text-gray-700 dark:text-gray-300 grid gap-4 sm:grid-cols-2">
                                        <p className="flex items-center gap-2">
                                          <Package className="h-5 w-5 text-blue-500" />
                                          <span className="font-medium">
                                            Dimensions:
                                          </span>{" "}
                                          {subStep?.packagingData?.cartonWidth}{" "}
                                          ×{" "}
                                          {subStep?.packagingData?.cartonHeight}
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <Weight className="h-5 w-5 text-green-500" />
                                          <span className="font-medium">
                                            Weight:
                                          </span>{" "}
                                          {subStep?.packagingData?.cartonWeight}{" "}
                                          kg
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <Layers className="h-5 w-5 text-purple-500" />
                                          <span className="font-medium">
                                            Max Capacity:
                                          </span>{" "}
                                          {subStep?.packagingData?.maxCapacity}
                                        </p>
                                        <p className="flex items-center gap-2">
                                          <ClipboardCheck className="h-5 w-5 text-orange-500" />
                                          <span className="font-medium">
                                            Issued Cartons:
                                          </span>{" "}
                                          {processData?.issuedCartons}
                                        </p>
                                      </div>
                                      {/* Actions */}
                                      <div className="mt-6 flex justify-center gap-4">
                                        <button
                                          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700"
                                          onClick={() =>
                                            handleAddToCart(subStep)
                                          }
                                        >
                                          <PlusCircle className="h-5 w-5" />
                                          Add To Cart
                                        </button>
                                        <button
                                          className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-white shadow hover:bg-danger"
                                          onClick={() =>
                                            handleUpdateStatus("NG")
                                          }
                                        >
                                          <XCircle className="h-5 w-5" />
                                          NG
                                        </button>
                                      </div>
                                      {/* Devices in carton */}
                                      <div className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 mt-6 rounded-lg border p-4">
                                        <h4 className="text-gray-900 mb-3 flex items-center gap-2 text-base font-semibold dark:text-white">
                                          Devices in this Carton
                                        </h4>

                                        {cartons?.length > 0 ? (
                                          cartons.map(
                                            (carton: any, index: number) => (
                                              <div
                                                key={index}
                                                className="dark:border-gray-600 mb-6 rounded-lg border p-4"
                                              >
                                                <p className="mb-2">
                                                  <strong>
                                                    Carton Serial No:
                                                  </strong>{" "}
                                                  {carton.cartonSerial}
                                                </p>

                                                <ul className="dark:text-gray-300 list-disc pl-6 text-sm">
                                                  {carton.devices?.length >
                                                  0 ? (
                                                    carton.devices.map(
                                                      (
                                                        serial: string,
                                                        i: number,
                                                      ) => (
                                                        <li key={i}>
                                                          {serial}
                                                        </li>
                                                      ),
                                                    )
                                                  ) : (
                                                    <p className="text-gray-500 dark:text-gray-400 italic">
                                                      No devices in this carton.
                                                    </p>
                                                  )}
                                                </ul>

                                                {/* QR Code + Button */}
                                                {!isCartonBarcodePrinted &&
                                                  carton.status && (
                                                    <div className="mt-4 flex flex-col items-center gap-3">
                                                      <button
                                                        type="button"
                                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700"
                                                        onClick={() =>
                                                          handleGenerateQRCode(
                                                            carton,
                                                          )
                                                        }
                                                      >
                                                        Generate Carton QR Code
                                                      </button>

                                                      {qrCartons[
                                                        carton.cartonSerial
                                                      ] && (
                                                        <>
                                                          {" "}
                                                          <div
                                                            id="barcode-area"
                                                            className="rounded-lg bg-white p-2 shadow"
                                                          >
                                                            <Canvas
                                                              text={
                                                                carton.cartonSerial
                                                              }
                                                              options={{
                                                                level: "M", // ✅ correct prop for error correction
                                                                margin: 2,
                                                                scale: 4,
                                                                width: 180,
                                                                color: {
                                                                  dark: "#000000",
                                                                  light:
                                                                    "#ffffff",
                                                                },
                                                              }}
                                                            />
                                                            <p className="mt-2 text-center font-semibold">
                                                              {
                                                                carton.cartonSerial
                                                              }
                                                            </p>
                                                          </div>
                                                          <button
                                                            type="button"
                                                            onClick={
                                                              handlePrint
                                                            }
                                                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                                                          >
                                                            🖨 Print Carton
                                                          </button>
                                                        </>
                                                      )}
                                                    </div>
                                                  )}
                                              </div>
                                            ),
                                          )
                                        ) : (
                                          <p className="text-gray-500 dark:text-gray-400 italic">
                                            No devices added yet.
                                          </p>
                                        )}
                                      </div>
                                      {/* Barcode Section */}
                                    </>
                                  ) : (
                                    <>
                                      {/* Single Device Sticker */}
                                      <div className="mt-6 flex justify-center">
                                        <StickerGenerator
                                          stickerData={subStep.packagingData}
                                          deviceData={deviceList.filter(
                                            (d: any) =>
                                              d.serialNo === searchResult,
                                          )}
                                        />
                                      </div>
                                      <div className="mt-6 flex justify-center gap-4">
                                        <button
                                          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700"
                                          onClick={() =>
                                            handleUpdateStatus("Pass")
                                          }
                                        >
                                          <CheckCircle className="h-5 w-5" />
                                          Pass
                                        </button>
                                        <button
                                          className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-white shadow hover:bg-danger"
                                          onClick={() =>
                                            handleUpdateStatus("NG")
                                          }
                                        >
                                          <XCircle className="h-5 w-5" />
                                          NG
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}

                    {/* CASE 3: Normal Pass/NG */}
                    {!processAssignUserStage?.subSteps?.some(
                      (s: any) => s.isPrinterEnable || s.isPackagingStatus,
                    ) && (
                      <div className="flex justify-center gap-4 p-6">
                        <button
                          className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-white shadow hover:bg-green-500"
                          onClick={() => handleUpdateStatus("Pass")}
                        >
                          <CheckCircle className="h-5 w-5" />
                          Pass
                        </button>
                        <button
                          className="hover:bg-red-600 flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-white shadow"
                          onClick={() => handleUpdateStatus("NG")}
                        >
                          <XCircle className="h-5 w-5" />
                          NG
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-center">
                  <div className="flex w-100 justify-center">
                    <p className="text-red-500 text-sm">{notFoundError}</p>
                  </div>
                  <div className="flex justify-center">
                    {notFoundError && (
                      <>
                        <button
                          type="button"
                          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-danger to-danger px-4 py-2 text-xs font-semibold text-white shadow hover:from-danger hover:to-danger"
                          onClick={openReportIssueModel}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Report Issue
                        </button>
                        <Modal
                          isOpen={isReportIssueModal}
                          onSubmit={handleSubmitReport}
                          onClose={closeReportIssueModal}
                          title="Report Issue"
                        >
                          <div className="space-y-6">
                            {/* Issue Type */}
                            <div>
                              <label className="text-gray-700 dark:text-gray-200 mb-2 block text-sm font-medium">
                                Choose Issue Type{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  className="border-gray-300 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-full rounded-lg border bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500"
                                  onChange={(e) => setIssueType(e.target.value)}
                                >
                                  <option value="">
                                    -- Select an Issue --
                                  </option>
                                  <option value="not_found">
                                    📦 Device Not Found
                                  </option>
                                  <option value="technical_fault">
                                    ⚡ Technical Fault
                                  </option>
                                </select>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <label className="text-gray-700 dark:text-gray-200 mb-2 block text-sm font-medium">
                                Description{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                rows={5}
                                onChange={(e) =>
                                  setIssueDescription(e.target.value)
                                }
                                placeholder="Please describe the issue in detail..."
                                className="border-gray-300 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500"
                              ></textarea>
                              <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                                Be as specific as possible (e.g., device serial
                                no, error steps).
                              </p>
                            </div>
                          </div>
                        </Modal>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Tested History */}
          <div className="grid gap-y-3 ">
            <div className="border-gray-200 rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="bg-gray-100 text-gray-700 sticky top-0 flex items-center justify-center gap-2 rounded-t-xl py-2 text-center text-sm font-bold">
                <ListChecks className="h-4 w-4 text-indigo-600" />
                Tested History (Today)
              </h3>
              <div className="overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-1">Serial</th>
                      <th className="px-2 py-1">Stage</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkedDevice.length > 0 ? (
                      checkedDevice.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-gray-50 border-t text-center"
                        >
                          <td className="px-2 py-1">
                            {row?.deviceInfo?.serialNo}
                          </td>
                          <td className="px-2 py-1">{row?.stageName}</td>
                          <td
                            className={`px-2 py-1 font-medium ${
                              row?.status === "Pass"
                                ? "text-green-600"
                                : row?.status === "NG"
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {row?.status}
                          </td>
                          <td className="px-2 py-1">{row?.timeTaken}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-gray-500 py-2 text-center"
                        >
                          No devices checked yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-gray-200 rounded-xl border bg-white p-5 py-2 shadow-sm">
              <h3 className="bg-gray-100 text-gray-700 sticky top-0 flex items-center justify-center gap-2 rounded-t-xl py-2 text-center text-sm font-bold">
                <ListChecks className="h-4 w-4 text-indigo-600" />
                Carton Details
              </h3>
              <div className="max-h-[247px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-1">Serial</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processCartons.length > 0 ? (
                      processCartons.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-gray-50 border-t text-center"
                        >
                          <td className="px-2 py-1">{row?.cartonSerial}</td>
                          <td className="px-2 py-1">{row?.status}</td>
                          <td className="px-2 py-1">{row?.createdAt}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-2 text-center">
                          No Result Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {processCartons.length > 0 && (
                  <div className="flex items-end justify-end py-2">
                    <button
                      className="flex items-center gap-2 rounded-lg bg-[#0FADCF] px-4 py-2 text-sm font-semibold text-white shadow"
                      onClick={handleShiftToPDI}
                    >
                      Shift To PDI
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-yellow-500 hover:to-yellow-600"
            onClick={handlePauseResume}
          >
            <Coffee className="h-4 w-4" />
            {isPaused ? "Break Off" : "Break"}
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-danger to-danger px-4 py-2 text-sm font-semibold text-white shadow hover:from-danger hover:to-danger"
            onClick={handleStop}
          >
            <SquareStop className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>
    </>
  );
}
