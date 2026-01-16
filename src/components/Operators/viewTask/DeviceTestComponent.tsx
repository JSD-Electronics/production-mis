"use client";
import Modal from "@/components/Modal/page";
import { useQRCode } from "next-qrcode";
import SearchableInput from "@/components/SearchableInput/SearchableInput";
import CartonSearchableInput from "@/components/SearchableInput/CartonSearchableInput";
import NGModel from "@/components/Operators/viewTask/components/NGModal";
import {
  createCarton,
  fetchCartonByProcessID,
  fetchCartons,
  shiftToPDI,
  shiftToNextCommonStage,
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
  QrCode,
  ArrowRightCircle,
  History,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import StickerGenerator from "../viewTask-old/StickerGenerator";
import JigSection from "./components/JigSection";

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
  setCartons: (val: any) => void;
  cartons: any;
  isVerifiedSticker: any;
  setIsCartonBarCodePrinted: (val: boolean) => void;
  isCartonBarcodePrinted: boolean;
  setProcessCartons: (val: any) => void;
  processCartons: any;
  assignedTaskDetails: any;
  assignUserStage: any;
  setIsDevicePassed: any;
  isdevicePassed: any;
  setAsssignDeviceDepartment: any;
  selectAssignDeviceDepartment: any;
  processStagesName: any; setDeviceList: any;
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
  setDeviceList,
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
  assignedTaskDetails,
  assignUserStage,
  setIsDevicePassed,
  isdevicePassed,
  setAsssignDeviceDepartment,
  selectAssignDeviceDepartment,
  processStagesName,
}: DeviceTestComponentProps) {
  useEffect(() => {
    fetchExistingCartonsByProcessID();
    fetchProcessCartons();
  }, []);

  const { Canvas } = useQRCode();
  const [qrCartons, setQrCartons] = useState<{ [key: string]: boolean }>({});
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSopOpen, setIsSopOpen] = useState(false);

  // Ref to hold the disconnect function from the jig interface
  const jigDisconnectRef = React.useRef<(() => void) | null>(null);

  const [cartonSerial, setCartonSerial] = useState<string[]>([]);
  const [cartonDetails, setCartonDetails] = useState<any[]>([]);
  const [cartonSearchQuery, setCartonSearchQuery] = useState("");
  const [selectedCarton, setSelectedCarton] = useState<string | null>(null);
  const [cartonDevices, setCartonDevices] = useState<any[]>([]);
  const [loadingCartonDevices, setLoadingCartonDevices] = useState(false);
  const [showNGModal, setShowNGModal] = useState(false);
  const [ngReason, setNgReason] = useState<string | null>(null);
  const [jigDecision, setJigDecision] = useState<"Pass" | "NG" | null>(null);
  const [currentJigStepIndex, setCurrentJigStepIndex] = useState(0);
  const [jigResults, setJigResults] = useState<Record<number, { status: "Pass" | "NG"; reason?: string; data?: any; timeTaken?: number }>>(
    {}
  );
  const stepStartTimeRef = React.useRef<number>(Date.now());
  const [stepTimeLeft, setStepTimeLeft] = useState<number | null>(null);
  const [isJigConnected, setIsJigConnected] = useState(false);
  const pendingJigErrorRef = React.useRef<string | null>(null);
  const [pendingJigErrorState, setPendingJigErrorState] = useState<string | null>(null); // For UI feedback if needed
  const [isPreviousStagesModalOpen, setIsPreviousStagesModalOpen] = useState(false);

  const testSteps = React.useMemo(() => {
    return processAssignUserStage?.subSteps?.filter(
      (s: any) => s.stepType === "jig" || s.stepType === "manual"
    ) || [];
  }, [processAssignUserStage]);

  const handleStepDecision = (status: "Pass" | "NG", reason?: string, data?: any, isImmediate = true) => {
    console.log(
      `[DeviceTestComponent] handleStepDecision -> Step ${currentJigStepIndex + 1} finalized:`,
      { status, reason, data }
    );

    // For the new requirement: If it's a non-immediate NG from the jig, store the reason and wait.
    if (status === "NG" && !isImmediate) {
      console.log(`[DeviceTestComponent] NG detected but waiting for timeout:`, reason);
      pendingJigErrorRef.current = reason || "Validation failed";
      setPendingJigErrorState(reason || "Validation failed");
      return;
    }

    const timeTaken = Math.round((Date.now() - stepStartTimeRef.current) / 1000);

    const newResults = {
      ...jigResults,
      [currentJigStepIndex]: { status, reason, data, timeTaken },
    };
    setJigResults(newResults);

    // IMMEDIATE NG CHECK: If any step fails, finalize immediately.
    if (status === "NG") {
      setJigDecision("NG");
      setNgReason(reason || "Manual failure / Timeout");
      setShowNGModal(true);
      setStepTimeLeft(null);
      pendingJigErrorRef.current = null;
      setPendingJigErrorState(null);
      // Disconnect jig if active
      if (jigDisconnectRef.current) {
        jigDisconnectRef.current();
      }
      return; // Stop further processing/advancing
    }

    if (currentJigStepIndex < testSteps.length - 1) {
      // Auto-advance
      setCurrentJigStepIndex((prev) => prev + 1);
    } else {
      // Finalize - verify all passed
      const allPassed =
        Object.values(newResults).every((s) => s.status === "Pass") &&
        status === "Pass";
      const finalStatus = allPassed ? "Pass" : "NG";
      setJigDecision(finalStatus);

      if (finalStatus === "Pass") {
        handleUpdateStatus("Pass", "", newResults);
      } else {
        setShowNGModal(true);
      }
    }
    setStepTimeLeft(null);
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
  };
  // ... rest of the file ... 


  useEffect(() => {
    if (testSteps.length === 0) return;
    const currentSubStep = testSteps[currentJigStepIndex];

    // For jig steps, timer starts as soon as a device is scanned.
    const isJigStep = currentSubStep?.stepType === "jig";
    const canStartTimer = !!searchResult;

    if (isJigStep && currentSubStep?.ngTimeout > 0 && !jigDecision && !isdevicePassed && searchResult && canStartTimer) {
      setStepTimeLeft(currentSubStep.ngTimeout);
      const timer = setInterval(() => {
        setStepTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            handleStepDecision("NG", pendingJigErrorRef.current || "Step timeout reached");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setStepTimeLeft(null);
    }
  }, [currentJigStepIndex, testSteps, jigDecision, isdevicePassed, searchResult]);

  // Reset test state when scanning a new device
  useEffect(() => {
    setCurrentJigStepIndex(0);
    setJigResults({});
    setJigDecision(null);
    setIsJigConnected(false);
    setStepTimeLeft(null);
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
    stepStartTimeRef.current = Date.now();
  }, [searchResult]);

  useEffect(() => {
    // Reset start time when step index changes
    stepStartTimeRef.current = Date.now();
  }, [currentJigStepIndex]);
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
  const handleCommonGenerateQRCode = async (carton: any) => {
    try {
      if (!carton) {
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
        setQrCartons((prev: Record<string, boolean>) => ({
          ...prev,
          [carton]: true,
        }));
      }
    } catch (error) {
      console.error("Error generating QR Code:", error);
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
        setQrCartons((prev: Record<string, boolean>) => ({
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
      if (result) {
        setCartonSerial(result.cartonSerials);
        setCartonDetails(result.cartonDetails);
      }
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
    setIsPaused((prev: boolean) => !prev);
    setDevicePause((prev: boolean) => !prev);
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

    let newCartonObj: any = null;

    setCartons((prevCarts: Cart[]) => {
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
        newCartonObj = targetCart;
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
        cartonSerial: newCartonObj
          ? newCartonObj.cartonSerial
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
      if (!processCartons || (Array.isArray(processCartons) && processCartons.length === 0) || (processCartons.cartonDetails && processCartons.cartonDetails.length === 0)) {
        alert("No cartons available to shift.");
        return;
      }
      const cartonSerials = processCartons?.cartonDetails?.map((row: any) => row.cartonSerial) || [];
      const formData = new FormData();
      cartonSerials.forEach((serial: string, index: number) => {
        formData.append(`cartons[${index}]`, serial);
      });
      const response = await shiftToPDI(formData);
      if (response) {
        const data = response;
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
  const isCommon =
    (assignedTaskDetails?.stageType ?? "").toLowerCase() === "common";
  const handleSearchCarton = (carton: any) => {
    let data = cartonDetails.filter(
      (value, index) => value.cartonSerial == carton,
    );
    setSelectedCarton(data[0].cartonSerial);
    setLoadingCartonDevices(false);
    setCartonDevices(data[0].devices);
    console.log("data ==>", data);
  };
  const getNGAssignOptions = () => {
    const options: any[] = [];

    if (
      !Array.isArray(assignUserStage) ||
      assignUserStage.length === 0 ||
      !Array.isArray(processStagesName)
    ) {
      return options;
    }

    const currentStageName = assignUserStage[0].name;

    const currentStageIndex = processStagesName.indexOf(currentStageName);
    const qcStageIndex = processStagesName.indexOf("Functional Quality Check");
    options.push({ label: "QC", value: "QC" });
    if (
      currentStageIndex !== -1 &&
      qcStageIndex !== -1 &&
      currentStageIndex <= qcStageIndex
    ) {
      options.unshift({ label: "TRC", value: "TRC" });
    }
    if (currentStageIndex > 0) {
      const previousStages = processStagesName.slice(0, currentStageIndex);

      previousStages.forEach((stage) => {
        options.push({
          label: stage,
          value: stage,
        });
      });
    }

    return options;
  };

  const handleNG = () => {
    console.log('selectAssignDeviceDepartment ==>', selectAssignDeviceDepartment);
    handleUpdateStatus("NG", selectAssignDeviceDepartment, jigResults);
    setShowNGModal(false);

  };

  const handleRetry = () => {
    console.log('[DeviceTestComponent] Retrying test from beginning...');

    // Reset all test state
    setCurrentJigStepIndex(0);
    setJigResults({});
    setJigDecision(null);
    setNgReason(null);
    setIsJigConnected(false);
    setStepTimeLeft(null);
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
    stepStartTimeRef.current = Date.now();

    // Close modal
    setShowNGModal(false);

    console.log('[DeviceTestComponent] Test state reset. Ready to retry.');
  };

  const handleShiftToNextStage = async (selectedCarton: any) => {
    try {
      const formData = new FormData();
      formData.append("selectedCarton", selectedCarton);
      let result = await shiftToNextCommonStage(processData._id, formData);
      if (result) {
        const data = result;
        alert("Cartons shifted to STORE successfully!");
        fetchExistingCartonsByProcessID();
        setSelectedCarton("");
        setLoadingCartonDevices(true);
        setCartonDevices([]);
        setCartonSearchQuery("");
      } else {
        console.error("Failed to shift cartons:", result.statusText);
        alert("Error shifting cartons to STORE.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while shifting cartons.");
    }
  };
  const canShowPassNGButtons = (
    deviceTestHistory: any[],
    currentStageName: string
  ) => {
    if (!Array.isArray(deviceTestHistory) || deviceTestHistory.length === 0) {
      return true;
    }

    const lastEntry = deviceTestHistory[deviceTestHistory.length - 1];

    return !(
      lastEntry.stageName === currentStageName &&
      lastEntry.status === 'NG'
    );
  };

  const lastHistoryEntry =
    Array.isArray(deviceHistory) && deviceHistory.length > 0
      ? deviceHistory[deviceHistory.length - 1]
      : null;

  const shouldHideJigInterface =
    lastHistoryEntry?.status === "NG" &&
    (lastHistoryEntry?.assignedDeviceTo === "QC" ||
      lastHistoryEntry?.assignedDeviceTo === "TRC");

  return (
    <>
      {/* SOP Section */}
      <div className="mt-4 rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
        <button
          onClick={() => setIsSopOpen(!isSopOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-gray-800 text-sm font-bold">Standard Operating Procedure (SOP)</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
              Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-medium">{isSopOpen ? 'Collapse' : 'Expand'}</span>
            {isSopOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </button>

        {isSopOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
            {product?.sopFile ? (
              <div className="space-y-3">
                {product?.sopFile.endsWith(".pdf") ? (
                  <iframe
                    src={product?.sopFile}
                    className="h-[500px] w-full rounded-lg border shadow-inner"
                    title="SOP PDF Preview"
                  />
                ) : product?.sopFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <div className="relative group">
                    <Image
                      src={product?.sopFile}
                      alt="SOP Preview"
                      width={800}
                      height={600}
                      className="max-h-[500px] w-full rounded-lg object-contain bg-gray-50 p-2"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <a
                      href={product?.sopFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-800 transition-all"
                    >
                      <BookOpenCheck className="h-5 w-5" />
                      Open SOP Reference
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 py-8 text-center text-xs italic flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 opacity-20" />
                No SOP content found for this product.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Devices Section */}
      <div className="mt-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-gray-800 text-base font-bold leading-tight">Device Testing</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded text-[10px] font-bold text-gray-500 border border-gray-100">
                  <Timer className="h-3 w-3" />
                  ELAPSED: <span className="text-gray-900">{timerDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-50 rounded text-[10px] font-bold text-yellow-600 border border-yellow-100">
                  <Zap className="h-3 w-3" />
                  ACTIVE: <span className="text-yellow-700">{deviceDisplay}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all active:scale-95"
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">

          {/* Device Search Box */}
          <div
            className={`${isPaused && "blur-sm"
              } border-gray-200 rounded-xl border bg-white p-4 shadow-sm`}
          >
            {assignedTaskDetails.stageType == "common" ? (
              <>
                <label className="text-gray-600 mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Search className="text-gray-500 h-4 w-4" />
                  Search Carton
                </label>
                <CartonSearchableInput
                  cartons={cartonSerial}
                  searchQuery={cartonSearchQuery}
                  setSearchQuery={setCartonSearchQuery}
                  onSelect={(carton) => handleSearchCarton(carton)}
                  onNoResults={(query) =>
                    console.log("No carton found for:", query)
                  }
                />
              </>
            ) : (
              <>
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
                  checkIsPrintEnable={processAssignUserStage?.subSteps?.some(
                    (s: any) => s.isPrinterEnable,
                  )}
                  setIsDevicePassed={setIsDevicePassed}
                />
              </>
            )}

            {selectedCarton && (
              <div className="mt-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
                  <h3 className="text-gray-800 flex items-center gap-2 text-lg font-semibold">
                    <Package className="h-5 w-5 text-blue-600" />
                    Carton:{" "}
                    <span className="text-blue-600">{selectedCarton}</span>
                  </h3>
                  {!qrCartons[selectedCarton] && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCommonGenerateQRCode(selectedCarton)
                      }
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                    >
                      <QrCode className="h-4 w-4" />
                      Generate QR
                    </button>
                  )}
                </div>

                {/* QR Code Section */}
                {qrCartons[selectedCarton] && (
                  <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow">
                    <Canvas
                      text={selectedCarton}
                      options={{
                        errorCorrectionLevel: "M",
                        margin: 2,
                        scale: 4,
                        width: 200,
                        color: {
                          dark: "#000000",
                          light: "#ffffff",
                        },
                      }}
                    />
                    <p className="mt-3 text-base font-semibold">
                      {selectedCarton}
                    </p>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="mt-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
                    >
                      <Printer className="h-4 w-4" />
                      Print Carton
                    </button>
                  </div>
                )}

                {/* Device List */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  {loadingCartonDevices ? (
                    <p className="text-gray-500 p-4">Loading devices...</p>
                  ) : cartonDevices.length === 0 ? (
                    <p className="text-red-500 p-4">
                      No devices found for this carton.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Serial No</th>
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3">IMEI</th>
                            <th className="px-4 py-3">Stage</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created At</th>
                            <th className="px-4 py-3">Test Records</th>
                          </tr>
                        </thead>
                        <tbody className="divide-gray-200 divide-y">
                          {cartonDevices.map((device, index) => (
                            <tr
                              key={device._id || index}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="text-gray-800 px-4 py-3 font-medium">
                                {device.serialNo}
                              </td>
                              <td className="px-4 py-3">
                                {device.modelName || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                {device.imeiNo || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                {device.currentStage}
                              </td>
                              <td
                                className={`px-4 py-3 font-semibold ${device.status === "Pass"
                                  ? "text-green-600"
                                  : device.status === "Fail"
                                    ? "text-red-600"
                                    : "text-gray-500"
                                  }`}
                              >
                                {device.status || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                {new Date(device.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                {device.testRecords &&
                                  device.testRecords.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full rounded-md border text-xs">
                                      <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                          <th className="px-2 py-1">Stage</th>
                                          <th className="px-2 py-1">
                                            Status
                                          </th>
                                          <th className="px-2 py-1">Seat</th>
                                          <th className="px-2 py-1">Time</th>
                                          <th className="px-2 py-1">
                                            Operator
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {device.testRecords.map(
                                          (record: any, rIndex: number) => (
                                            <tr key={record._id || rIndex}>
                                              <td className="px-2 py-1">
                                                {record.stageName}
                                              </td>
                                              <td
                                                className={`px-2 py-1 font-semibold ${record.status === "Pass"
                                                  ? "text-green-600"
                                                  : "text-red-600"
                                                  }`}
                                              >
                                                {record.status}
                                              </td>
                                              <td className="px-2 py-1">
                                                {record.seatNumber}
                                              </td>
                                              <td className="px-2 py-1">
                                                {record.timeConsumed}
                                              </td>
                                              <td className="px-2 py-1">
                                                {record.operatorId}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    No Records
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end p-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleShiftToNextStage(selectedCarton)
                          }
                          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                        >
                          <ArrowRightCircle className="h-4 w-4" />
                          Shift to Next Stage
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Device Result */}
            {searchResult ? (
              <div className="mt-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-gray-800 text-sm font-bold">
                    {searchResult}
                  </h3>
                  {deviceHistory.length > 0 && (
                    <button
                      onClick={() => setIsPreviousStagesModalOpen(true)}
                      className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      <ListChecks className="h-3 w-3" />
                      View Previous Stages
                    </button>
                  )}
                </div>

                {isPreviousStagesModalOpen && (
                  <Modal
                    isOpen={isPreviousStagesModalOpen}
                    onClose={() => setIsPreviousStagesModalOpen(false)}
                    title="Previous Stages"
                    onSubmit={() => setIsPreviousStagesModalOpen(false)}

                  >
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-4">
                        <ListChecks className="text-gray-400 h-4 w-4" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Device History for {searchResult}</span>
                      </div>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {deviceHistory.map((value, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="overflow-hidden">
                              <span className="block text-xs font-bold text-gray-900">{value?.stageName}</span>
                              <span className="block text-[10px] text-gray-500 mt-0.5">{value?.serialNo}</span>
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${value?.status === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {value?.status}
                              </span>
                              {value?.assignedDeviceTo && (
                                <span className="text-[10px] text-gray-400">To: {value?.assignedDeviceTo}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Modal>
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
                                      className="bg-white mb-4 flex items-center justify-center rounded-xl border p-4"
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

                        {!processAssignUserStage?.subSteps?.some(
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
                                                                errorCorrectionLevel: "M",
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
                  {/* CASE 3: Jig/Manual Stage (Multi-step) */}
                  {!deviceHistory.some((h: any) => h.stageName === (assignUserStage?.name || assignUserStage?.[0]?.name || assignUserStage?.stage)) && processAssignUserStage?.subSteps?.some(
                    (s: any) => s.stepType === "jig" || s.stepType === "manual",
                  ) && (
                      (!isdevicePassed || jigDecision) && !shouldHideJigInterface && (
                        <div className="py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <div className="flex flex-col gap-6">
                              {(() => {
                                const currentSubStep = testSteps[currentJigStepIndex];

                                return (
                                  <>
                                    {currentSubStep && (
                                      <>
                                        {/* PROGRESS BAR */}
                                        <div className="mb-2">
                                          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                                            <span className="flex items-center gap-2">
                                              <ListChecks className="w-4 h-4 text-primary" />
                                              Test Progress
                                            </span>
                                            <span className="text-gray-700 font-bold">{Math.round(((currentJigStepIndex) / testSteps.length) * 100)}%</span>
                                          </div>
                                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                            <div
                                              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                                              style={{ width: `${((currentJigStepIndex) / testSteps.length) * 100}%` }}
                                            />
                                          </div>
                                        </div>

                                        {/* PERSISTENT JIG SECTION (Maintains connection across manual steps) */}
                                        {testSteps.some((s: any) => s.stepType === "jig") && (
                                          <div className={currentSubStep.stepType === "jig" ? "space-y-4" : "hidden"}>
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                  <Cpu className="w-5 h-5 text-blue-600" />
                                                  {currentSubStep.stepName || currentSubStep.name || `Automated Test`}
                                                </h4>
                                                <p className="text-sm text-gray-500 ml-7">
                                                  Step {currentJigStepIndex + 1} of {testSteps.length}
                                                </p>
                                              </div>
                                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wide border border-blue-200">
                                                Automated Jig
                                              </span>
                                            </div>
                                            <JigSection
                                              key={`jig-${searchResult?.serialNo || searchResult}`}
                                              subStep={currentSubStep}
                                              isLastStep={currentJigStepIndex === testSteps.length - 1}
                                              onDataReceived={(data: any) => {
                                                // Optional: log or handle raw data
                                              }}
                                              onDecision={handleStepDecision}
                                              onDisconnect={(fn: () => void) => {
                                                jigDisconnectRef.current = fn;
                                              }}
                                              searchQuery={searchQuery}
                                              onConnectionChange={setIsJigConnected}
                                              finalResult={jigResults[currentJigStepIndex]?.status}
                                              finalReason={jigResults[currentJigStepIndex]?.reason}
                                              onStatusUpdate={(status) => {
                                                pendingJigErrorRef.current = status;
                                              }}
                                            />
                                          </div>
                                        )}

                                        {/* MANUAL STEP UI */}
                                        {currentSubStep.stepType === "manual" && (
                                          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                            <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-start gap-4">
                                              <div className="p-2 bg-orange-100 rounded-lg text-orange-600 shadow-sm shrink-0">
                                                <ClipboardCheck className="h-6 w-6" />
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-3">
                                                  <h5 className="text-lg font-bold text-gray-900">
                                                    Manual Verification
                                                  </h5>
                                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase border border-orange-200">
                                                    Required
                                                  </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                  Please physically inspect the device and verify the following checkpoints before proceeding.
                                                </p>
                                              </div>
                                              {stepTimeLeft !== null && (
                                                <div className="ml-auto flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-red-600 shadow-sm animate-pulse">
                                                  <Timer className="h-4 w-4" />
                                                  <span className="text-xs font-black">
                                                    NG IN: {stepTimeLeft}s
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            <div className="p-6">
                                              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                <button
                                                  onClick={() => handleStepDecision("Pass")}
                                                  disabled={!!jigDecision}
                                                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision
                                                    ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none"
                                                    : "bg-success hover:bg-green-600"
                                                    }`}
                                                >
                                                  <CheckCircle className="h-5 w-5" />
                                                  Confirm & Mark Pass
                                                </button>
                                                <button
                                                  onClick={() => handleStepDecision("NG")}
                                                  disabled={!!jigDecision}
                                                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision
                                                    ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none"
                                                    : "bg-danger hover:bg-red-600"
                                                    }`}
                                                >
                                                  <XCircle className="h-5 w-5" />
                                                  Report Issue (NG)
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            <div className="space-y-6">
                              {/* Summary of Jig Steps */}
                              {(() => {
                                if (testSteps.length > 0) {
                                  return (
                                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                          <ClipboardList className="w-4 h-4 text-gray-500" />
                                          Stage Summary
                                        </h4>
                                        {Object.keys(jigResults).length > 0 && (
                                          <div className="flex items-center gap-2 text-[11px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                                            <Timer className="w-3 h-3" />
                                            Total Time: {Object.values(jigResults).reduce((acc, curr) => acc + (curr.timeTaken || 0), 0)}s
                                          </div>
                                        )}
                                      </div>
                                      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                        {testSteps.map((step: any, index: number) => {
                                          const status = jigResults[index]?.status;
                                          return (
                                            <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                                              <div className="flex items-center gap-3">
                                                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${status === 'Pass' ? 'bg-green-100 text-green-700' :
                                                  status === 'NG' ? 'bg-red-100 text-red-700' :
                                                    index === currentJigStepIndex ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                                      'bg-gray-100 text-gray-500'
                                                  }`}>
                                                  {index + 1}
                                                </div>
                                                <div>
                                                  <span className={`block text-sm font-medium ${index === currentJigStepIndex ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {step.stepName || step.name || `Test ${index + 1}`}
                                                  </span>
                                                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                    {step.stepType}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end min-w-[80px]">
                                                  {jigResults[index]?.timeTaken !== undefined && (
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                                                      <Timer className="w-3 h-3" /> {jigResults[index].timeTaken}s
                                                    </span>
                                                  )}
                                                  {step.stepType === "jig" && step.ngTimeout > 0 && (
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                      Timeout: {step.ngTimeout}s
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="min-w-[80px] flex justify-end">
                                                  {status === 'Pass' && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-100">
                                                      <Check className="w-3 h-3" /> Pass
                                                    </span>
                                                  )}
                                                  {status === 'NG' && (
                                                    <div className="flex flex-col items-end gap-1">
                                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-100">
                                                        <XCircle className="w-3 h-3" /> Failed
                                                      </span>
                                                    </div>
                                                  )}
                                                  {!status && index === currentJigStepIndex && (
                                                    <>
                                                      {stepTimeLeft !== null && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 border border-red-100 animate-pulse">
                                                          <Timer className="w-3 h-3" /> {stepTimeLeft}s
                                                        </span>
                                                      )}
                                                    </>
                                                  )}
                                                  {!status && index !== currentJigStepIndex && (
                                                    <span className="text-xs text-gray-400 font-medium">Pending</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                          {/* Next/Reset Button after Jig Decision */}
                          {jigDecision && (
                            <div className="flex flex-col items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h4 className={`text-lg font-bold ${jigDecision === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                                Test Result: {jigDecision}
                              </h4>
                              <button
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                                onClick={() => {
                                  // Disconnect COM port if connected
                                  if (jigDisconnectRef.current) {
                                    jigDisconnectRef.current();
                                  }

                                  // Strictly remove the device from the list
                                  if (searchResult && setDeviceList) {
                                    setDeviceList((prev: any[]) => prev.filter((d: any) => d.serialNo !== searchResult));
                                  }

                                  setSearchResult("");
                                  setSearchQuery("");
                                  setJigDecision(null);
                                  setCurrentJigStepIndex(0);
                                  setJigResults({});
                                  window.scrollTo(0, 0); // Optional: scroll to top for new scan
                                }}
                              >
                                <ArrowRightCircle className="h-5 w-5" />
                                Move to Next Device
                              </button>
                            </div>
                          )}

                          {/* Pass/NG Buttons for Jig Stage (Manual Override) */}

                        </div>
                      )
                    )}
                  {/* CASE 4: Normal Pass/NG */}
                  {/* {canShowPassNGButtons(deviceHistory, processAssignUserStage?.stageName) && isPassNGButtonShow &&
                      !processAssignUserStage?.subSteps?.some(
                        (s: any) => s.isPrinterEnable || s.isPackagingStatus || s.stepType === "jig",
                      ) && (
                        <div className="flex justify-center gap-4 p-6">
                          <button
                            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-white shadow hover:bg-green-500"
                            onClick={() => handleUpdateStatus("Pass", "")}
                          >
                            <CheckCircle className="h-5 w-5" />
                            Pass
                          </button>
                          <button
                            className="hover:bg-red-600 flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-white shadow"
                            onClick={() => setShowNGModal(true)}
                          >
                            <XCircle className="h-5 w-5" />
                            NG
                          </button>
                        </div>
                      )} */}
                </div>
                <NGModel
                  showNGModal={showNGModal}
                  setShowNGModal={setShowNGModal}
                  selectAssignDeviceDepartment={selectAssignDeviceDepartment}
                  setAsssignDeviceDepartment={setAsssignDeviceDepartment}
                  getNGAssignOptions={getNGAssignOptions}
                  handleNG={handleNG}
                  reason={ngReason}
                  isJigStep={testSteps.some((s: any) => s.stepType === "jig")}
                  onRetry={handleRetry}
                />
              </div>
            ) : (
              <div className="mt-3 text-center">
                <div className="flex justify-center">
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
        {/* Footer */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            className="flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-primary/20 transition-colors"
            onClick={handlePauseResume}
          >
            <Coffee className="h-4 w-4" />
            {isPaused ? "Break Off" : "Break"}
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white shadow hover:bg-danger transition-colors"
            onClick={handleStop}
          >
            <SquareStop className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>
      {/* History Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isHistoryOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`relative h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 transform ${isHistoryOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </h3>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-6">
            {/* Tested History List */}
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-indigo-500" />
                  Devices
                </h4>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {checkedDevice.length} Today
                </span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {checkedDevice.length > 0 ? (
                      checkedDevice.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900 block">{row?.deviceInfo?.serialNo}</span>
                            <span className="text-[10px] text-gray-500">{row?.stageName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${row?.status === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {row?.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 font-mono italic">
                            {row?.timeTaken}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-gray-400 text-xs">
                          No devices tested today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Carton Details (Conditional) */}
            {processAssignUserStage?.subSteps?.some((s: any) => s.isPackagingStatus) && (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Box className="h-4 w-4 text-orange-500" />
                    Carton Details
                  </h4>
                </div>
                <div className="p-0">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Serial</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {processCartons?.cartonDetails?.length > 0 ? (
                        processCartons.cartonDetails.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900">{row?.cartonSerial}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">{row?.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-400">
                              {new Date(row?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-gray-400 italic">No cartons found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {processCartons?.cartonDetails?.length > 0 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                      <button
                        className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
                        onClick={handleShiftToPDI}
                      >
                        Shift to PDI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
