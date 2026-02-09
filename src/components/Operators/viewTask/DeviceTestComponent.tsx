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
  getPDICartonByProcessId,
  getCartonsIntoStore,
  keepCartonInStore,
  updateStageBySerialNo,
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
  Circle,
  QrCode,
  ArrowRightCircle,
  History,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  List,
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
  setIsVerifiedSticker: (val: boolean) => void;
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
  processStagesName: any;
  setDeviceList: any;
  isAddedToCart: boolean;
  setIsAddedToCart: (val: boolean) => void;
  isVerifiedPackaging: boolean;
  setIsVerifiedPackaging: (val: boolean) => void;
  isVerifyPackagingModal: boolean;
  handleVerifyPackaging: () => void;
  handleVerifyPackagingModal: () => void;
  closeVerifyPackagingModal: () => void;
  handlePrintCartonSticker: () => void;
  historyFilterDate: string;
  setHistoryFilterDate: (date: string) => void;
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
  isStickerPrinted,
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
  isPassNGButtonShow,
  handlePrintSticker,
  handleVerifySticker,
  isVerifyStickerModal,
  handleVerifyStickerModal,
  closeVerifyStickerModal,
  isVerifiedSticker,
  setIsVerifiedSticker,
  serialNumber,
  setSerialNumber,
  handleUpdateStatus,
  processData,
  setCartons,
  cartons,
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
  isAddedToCart,
  setIsAddedToCart,
  isVerifiedPackaging,
  setIsVerifiedPackaging,
  isVerifyPackagingModal,
  handleVerifyPackaging,
  handleVerifyPackagingModal,
  closeVerifyPackagingModal,
  handlePrintCartonSticker,
  historyFilterDate,
  setHistoryFilterDate,
}: DeviceTestComponentProps) {
  useEffect(() => {
    if (processData?._id) {
      fetchExistingCartonsByProcessID();
      fetchProcessCartons();
    }
  }, [processData?._id]);

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
  const [isCartonDevicesModalOpen, setIsCartonDevicesModalOpen] = useState(false);
  const [isVerifyCartonModal, setIsVerifyCartonModal] = useState(false);
  const [manualFieldValues, setManualFieldValues] = useState<Record<string, string>>({});
  const [manualErrors, setManualErrors] = useState<Record<string, string | null>>({});
  const [isManualValuesModalOpen, setIsManualValuesModalOpen] = useState(false);
  const [hasManualValues, setHasManualValues] = useState(false);
  const [generatedCommand, setGeneratedCommand] = useState<string>("");

  const handleVerifyCarton = (scannedValue: string) => {
    if (scannedValue === selectedCarton) {
      alert("Carton Verified Successfully!");
      setIsVerifyCartonModal(false);
    } else {
      alert("Incorrect Carton Serial! Please scan the correct carton.");
    }
  };

  const testSteps = React.useMemo(() => {
    return (
      processAssignUserStage?.subSteps?.filter(
        (s: any) =>
          s.stepType === "jig" ||
          s.stepType === "manual" ||
          s.isPrinterEnable ||
          s.isPackagingStatus,
      ) || []
    );
  }, [processAssignUserStage]);

  const validateCustomField = (cf: any, valRaw: string) => {
    const fname = cf?.fieldName || cf?.jigName || "";
    const vtype = cf?.validationType || "value";
    const val = (valRaw ?? "").trim();
    if (!fname) return { valid: false, message: "Field name missing" };
    if (val.length === 0) return { valid: false, message: "Value is required" };
    if (vtype === "value") {
      const expected = (cf?.value ?? "").trim();
      if (!expected) return { valid: true, message: null };
      if (val === expected) return { valid: true, message: null };
      return { valid: false, message: `Expected "${expected}"` };
    }
    if (vtype === "range") {
      const num = Number(val);
      const from = Number(cf?.rangeFrom);
      const to = Number(cf?.rangeTo);
      if (Number.isNaN(num)) return { valid: false, message: "Enter a number" };
      if (Number.isNaN(from) || Number.isNaN(to)) return { valid: true, message: null };
      if (num < from || num > to) return { valid: false, message: `Enter between ${from}-${to}` };
      return { valid: true, message: null };
    }
    if (vtype === "length") {
      const len = val.length;
      const from = Number(cf?.lengthFrom);
      const to = Number(cf?.lengthTo);
      if (Number.isNaN(from) || Number.isNaN(to)) return { valid: true, message: null };
      if (len < from || len > to) return { valid: false, message: `Length ${from}-${to} chars` };
      return { valid: true, message: null };
    }
    return { valid: true, message: null };
  };

  useEffect(() => {
    setManualFieldValues({});
    setManualErrors({});
    setHasManualValues(false);
    setIsManualValuesModalOpen(false);
  }, [currentJigStepIndex]);

  const updateCustomFieldsDataIntoDB = async (values: Record<string, string>) => {
    try {
      const targetSerial = searchResult || searchQuery;
      if (!targetSerial) return;

      const formData = new FormData();
      formData.append("customFields", JSON.stringify(values));
      await updateStageBySerialNo(targetSerial, formData);

      // Update local state so that subsequent steps (like printing) see the new data
      if (setDeviceList) {
        setDeviceList((prev: any[]) =>
          prev.map((d) => {
            const dSerial = d.serialNo || d.serial_no || d.serialNo;
            if (String(dSerial).trim() === String(targetSerial).trim()) {
              return { ...d, customFields: values, custom_fields: values };
            }
            return d;
          }),
        );
      }
    } catch (error) {
      console.error("Failed to update custom fields", error);
    }
  };

  const handleManualPass = async () => {
    const currentSubStep = testSteps[currentJigStepIndex];
    const fields = currentSubStep?.jigFields && currentSubStep.jigFields.length > 0 ? currentSubStep.jigFields : currentSubStep?.customFields;

    if (currentSubStep?.stepType === "manual" && Array.isArray(fields) && fields.length > 0) {
      const hasError = fields.some((cf: any) => {
        const name = cf?.fieldName || cf?.jigName;
        const v = manualFieldValues[name ?? ""] ?? "";
        const result = validateCustomField(cf, v);
        return !result.valid;
      });
      if (hasError) return;
    }
    if (currentSubStep?.stepType === "manual" && Array.isArray(fields) && fields.length > 0) {
      const collected: Record<string, string> = {};
      fields.forEach((cf: any) => {
        const name = cf?.fieldName || cf?.jigName;
        if (name) {
          collected[name] = manualFieldValues[name] ?? "";
        }
      });
      await updateCustomFieldsDataIntoDB(collected);
    }
    handleStepDecision("Pass");
  };

  const handleManualNG = async () => {
    const currentSubStep = testSteps[currentJigStepIndex];
    const fields = currentSubStep?.jigFields && currentSubStep.jigFields.length > 0 ? currentSubStep.jigFields : currentSubStep?.customFields;

    if (currentSubStep?.stepType === "manual" && Array.isArray(fields) && fields.length > 0) {
      const collected: Record<string, string> = {};
      fields.forEach((cf: any) => {
        const name = cf?.fieldName || cf?.jigName;
        if (name) {
          collected[name] = manualFieldValues[name] ?? "";
        }
      });
      await updateCustomFieldsDataIntoDB(collected);
    }
    handleStepDecision("NG");
  };
  const handleSubmitManualValues = () => {
    const currentSubStep = testSteps[currentJigStepIndex];
    const fields = currentSubStep?.jigFields && currentSubStep.jigFields.length > 0 ? currentSubStep.jigFields : currentSubStep?.customFields;

    if (!Array.isArray(fields) || fields.length === 0) {
      setHasManualValues(true);
      setIsManualValuesModalOpen(false);
      return;
    }
    const newErrors: Record<string, string | null> = {};
    let allValid = true;
    fields.forEach((cf: any) => {
      const name = cf?.fieldName || cf?.jigName || "";
      const v = manualFieldValues[name] ?? "";
      const res = validateCustomField(cf, v);
      newErrors[name] = res.valid ? null : res.message || "Invalid value";
      if (!res.valid) allValid = false;
    });
    setManualErrors(newErrors);
    if (allValid) {
      setHasManualValues(true);
      setIsManualValuesModalOpen(false);
    }
  };

  const handleStepDecision = (status: "Pass" | "NG", reason?: string, data?: any, isImmediate = true) => {
    if (jigDecision) {

      return;
    }


    // For the new requirement: If it's a non-immediate NG from the jig, store the reason and wait.
    if (status === "NG" && !isImmediate) {

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
    setGeneratedCommand("");
    stepStartTimeRef.current = Date.now();
  }, [searchResult]);

  useEffect(() => {
    // Reset start time when step index changes
    stepStartTimeRef.current = Date.now();

    if (setIsStickerPrinted) setIsStickerPrinted(false);
    if (setIsVerifiedSticker) setIsVerifiedSticker(false);
    if (setIsAddedToCart) setIsAddedToCart(false);
    if (setIsVerifiedPackaging) setIsVerifiedPackaging(false);
  }, [currentJigStepIndex, searchResult]);
  const handlePrint = () => {
    setIsCartonBarCodePrinted(true);
    const printContents = document.getElementById("barcode-area")?.innerHTML;

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
        // Case 1: New carton â†’ save first
        const response = await createCarton(carton);
        if (response?.newCartonModel) {
          alert("Carton saved! Now generating QR Code...");
          setQrCartons((prev) => ({
            ...prev,
            [response.newCartonModel.cartonSerial]: true,
          }));
        }
      } else {
        // Case 2: Existing carton â†’ just generate QR
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
        // Case 1: New carton â†’ save first
        const response = await createCarton(carton);
        if (response?.newCartonModel) {
          alert("Carton saved! Now generating QR Code...");
          setQrCartons((prev) => ({
            ...prev,
            [response.newCartonModel.cartonSerial]: true,
          }));
        }
      } else {
        // Case 2: Existing carton â†’ just generate QR
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
      let result;
      const currentStageName = assignUserStage?.stage || "";

      if (currentStageName === "PDI") {
        result = await getPDICartonByProcessId(processData._id);
      } else if (currentStageName === "FG to Store") {
        result = await getCartonsIntoStore(processData?._id);
      } else {
        result = await fetchCartons(processData._id);
      }

      if (result) {

        const details = result.cartonDetails || (Array.isArray(result) ? result : [result]);

        // Filter out cartons that are shifted to FG/Store
        const activeDetails = details.filter((c: any) => {
          const status = String(c.status || '').toLowerCase();
          return !status.includes('store') && !status.includes('fg') && !status.includes('shipped');
        });

        const serials = activeDetails.map((c: any) => c.cartonSerial);

        setCartonSerial(serials);
        setCartonDetails(activeDetails);
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

    // ðŸ”¹ Backend call after state update
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
      setIsAddedToCart(true);
      fetchExistingCartonsByProcessID();
      fetchProcessCartons();
    } catch (error) {
      console.error("Failed to create carton on backend:", error);
    }
  };
  const handleShiftToPDI = async () => {
    try {
      const cartonList = Array.isArray(processCartons) ? processCartons : processCartons?.cartonDetails || [];
      if (cartonList.length === 0) {
        alert("No cartons available to shift.");
        return;
      }
      const cartonSerials = cartonList.map((row: any) => row.cartonSerial);
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
    // if (
    //   currentStageIndex !== -1 &&
    //   qcStageIndex !== -1 &&
    //   currentStageIndex <= qcStageIndex
    // ) {
    options.unshift({ label: "TRC", value: "TRC" });
    // }
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

    handleUpdateStatus("NG", selectAssignDeviceDepartment, jigResults);
    setShowNGModal(false);

  };

  const handleRetry = () => {


    // Reset all test state
    setCurrentJigStepIndex(0);
    setJigResults({});
    setJigDecision(null);
    setNgReason(null);
    setIsJigConnected(false);
    setStepTimeLeft(null);
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
    setGeneratedCommand("");
    stepStartTimeRef.current = Date.now();

    // Close modal

  };

  const handleShiftToNextStage = async (cartonSerial: any) => {
    if (!cartonSerial) {
      alert("No carton selected.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("selectedCarton", cartonSerial);
      let result = await shiftToNextCommonStage(processData._id, formData);
      if (result) {
        const data = result;
        alert("Cartons shifted to STORE successfully!");
        fetchExistingCartonsByProcessID();
        fetchProcessCartons();
        setSelectedCarton("");
        setLoadingCartonDevices(true);
        setCartonDevices([]);
        setCartonSearchQuery("");
        setIsPassNGButtonShow(false);
        setIsVerifiedSticker(false);
        setIsStickerPrinted(false);
        return false;
      } else {
        console.error("Failed to shift cartons:", result.statusText);
        alert("Error shifting cartons to STORE.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while shifting cartons.");
    }
  };

  const handleKeepInStore = async (cartonSerial: any) => {
    if (!cartonSerial) {
      alert("No carton selected.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("selectedCarton", cartonSerial);
      let result = await keepCartonInStore(processData._id, formData);
      if (result) {
        alert("Carton kept in store successfully!");
        fetchExistingCartonsByProcessID();
        fetchProcessCartons();
        setSelectedCarton("");
        setLoadingCartonDevices(true);
        setCartonDevices([]);
        setCartonSearchQuery("");
        setIsPassNGButtonShow(false);
        setIsVerifiedSticker(false);
        setIsStickerPrinted(false);
        return false;
      } else {
        console.error("Failed to keep carton in store:", result.statusText);
        alert("Error keeping carton in store.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while keeping carton in store.");
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

  const hasQCResolved =
    Array.isArray(deviceHistory) &&
    deviceHistory.some((h: any) => {
      const s = (h?.status || "").toString().toLowerCase();
      return s.includes("resolved");
    });
  const isAssignedToQCorTRC = lastHistoryEntry?.assignedDeviceTo === "QC" || lastHistoryEntry?.assignedDeviceTo === "TRC";
  const shouldHideJigInterface = !hasQCResolved && lastHistoryEntry?.status === "NG" && isAssignedToQCorTRC;

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
                  onNoResults={(query) => {
                    // console.log("No results for carton:", query);
                  }}
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
                  setIsVerifiedSticker={setIsVerifiedSticker}
                  checkIsPrintEnable={processAssignUserStage?.subSteps?.some(
                    (s: any) => s.isPrinterEnable,
                  )}
                  setIsDevicePassed={setIsDevicePassed}
                />
              </>
            )}

            {selectedCarton && (
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Left Sidebar: Carton Info & QR */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-full flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                      <Package className="w-40 h-40 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        Carton Serial
                      </h3>
                      <div className="flex items-center gap-2 relative z-10">
                        <h2 className="text-xl font-black text-gray-800 break-all leading-tight">
                          {selectedCarton}
                        </h2>
                      </div>

                      {(() => {
                        const currentCarton = cartonDetails.find(
                          (c: any) => c.cartonSerial === selectedCarton,
                        );
                        const isFull = currentCarton?.status === "full";
                        const count = cartonDevices.length;

                        return (
                          <div className="mt-5 relative z-10">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${isFull
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                                }`}
                            >
                              {isFull ? (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              ) : (
                                <Box className="w-3.5 h-3.5" />
                              )}
                              {currentCarton?.status?.toUpperCase() || "OPEN"}
                            </span>
                            <div className="mt-4 flex items-center justify-between text-sm">
                              <span className="text-gray-500 font-medium">Contents</span>
                              <span className="text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{count} Devices</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-8 space-y-3 relative z-10">
                      {!qrCartons[selectedCarton] ? (
                        <button
                          onClick={() => handleCommonGenerateQRCode(selectedCarton)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                        >
                          <QrCode className="h-4 w-4" />
                          Generate QR Code
                        </button>
                      ) : (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                          <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 mb-4 w-full flex justify-center">
                            <Canvas
                              text={selectedCarton}
                              options={{
                                errorCorrectionLevel: "M",
                                margin: 2,
                                scale: 4,
                                width: 150,
                                color: { dark: "#000000", light: "#ffffff" },
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button
                              onClick={handlePrint}
                              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white shadow hover:bg-black hover:-translate-y-0.5 transition-all"
                            >
                              <Printer className="h-4 w-4" />
                              Print
                            </button>
                            <button
                              onClick={() => setIsVerifyCartonModal(true)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-3 text-xs font-bold text-white shadow hover:bg-purple-700 hover:-translate-y-0.5 transition-all"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                              Verify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Device List Table */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <List className="w-5 h-5 text-gray-400" />
                        Device List
                      </h4>
                    </div>

                    {loadingCartonDevices ? (
                      <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mb-4"></div>
                        <span className="text-sm font-medium">Loading devices...</span>
                      </div>
                    ) : cartonDevices.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 italic flex flex-col items-center justify-center h-full">
                        <Box className="w-12 h-12 text-gray-200 mb-2" />
                        No devices found in this carton.
                      </div>
                    ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 text-left text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                            <tr>
                              <th className="px-6 py-4">Serial No</th>
                              <th className="px-6 py-4">Model & IMEI</th>
                              <th className="px-6 py-4">Current Stage</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Date Added</th>
                              <th className="px-6 py-4 text-center">History</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {cartonDevices.map((device, index) => (
                              <React.Fragment key={device._id || index}>
                                <tr className="group hover:bg-blue-50/30 transition-colors">
                                  <td className="px-6 py-4 font-bold text-gray-800 text-sm">
                                    {device.serialNo}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-gray-900 font-medium">{device.modelName || "N/A"}</span>
                                      <span className="text-[10px] text-gray-400 font-mono mt-0.5">{device.imeiNo || "N/A"}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex rounded px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
                                      {device.currentStage}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${device.status === "Pass"
                                        ? "bg-green-100 text-green-700"
                                        : device.status === "Fail" || device.status === "NG"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                      {device.status === "Pass" && <Check className="w-3 h-3" />}
                                      {(device.status === "Fail" || device.status === "NG") && <X className="w-3 h-3" />}
                                      {device.status || "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(device.createdAt).toLocaleDateString()}
                                    <span className="block text-[10px] text-gray-400">
                                      {new Date(device.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {device.testRecords?.length > 0 ? (
                                      <div className="relative group/tooltip">
                                        <span className="cursor-help text-xs font-medium text-blue-600 border-b border-dotted border-blue-600">
                                          {device.testRecords.length} Records
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 text-xs">-</span>
                                    )}
                                  </td>
                                </tr>
                                {/* Expanded Details for Records */}
                                {device.testRecords?.length > 0 && (
                                  <tr className="bg-gray-50/50">
                                    <td colSpan={6} className="px-6 py-3 border-b border-gray-100 shadow-inner">
                                      <div className="flex gap-2 overflow-x-auto pb-1">
                                        {device.testRecords.map((record: any, rIndex: number) => (
                                          <div key={rIndex} className="flex-shrink-0 bg-white rounded-lg border border-gray-200 p-3 min-w-[200px] shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{record.stageName}</span>
                                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${record.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{record.status}</span>
                                            </div>
                                            <div className="text-xs space-y-1 text-gray-600">
                                              <div className="flex justify-between"><span>Seat:</span> <span className="font-medium text-gray-900">{record.seatNumber}</span></div>
                                              <div className="flex justify-between"><span>User:</span> <span className="font-medium text-gray-900">{record.operatorId}</span></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
                      {assignUserStage?.stage === "FG to Store" && (
                        <button
                          onClick={() => handleKeepInStore(selectedCarton)}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                          <Box className="h-5 w-5" />
                          Keep in Store
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleShiftToNextStage(selectedCarton)
                        }
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 transition-all active:scale-95"
                      >
                        Shift to Next Stage
                        <ArrowRightCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Verify Carton Modal */}
                <Modal
                  isOpen={isVerifyCartonModal}
                  onClose={() => setIsVerifyCartonModal(false)}
                  title="Verify Carton Sticker"
                  submitOption={false}
                  onSubmit={() => { }}
                >
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                        <ScanLine className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Scan QR Code</h4>
                        <p className="text-sm text-gray-500">Please scan the printed carton sticker QR code to verify details.</p>
                      </div>
                    </div>

                    <input
                      autoFocus
                      placeholder="Scan Carton QR Code..."
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-center text-lg font-mono placeholder:font-sans focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleVerifyCarton(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="text-center">
                      <span className="text-xs text-gray-400 font-medium">Verified cartons can be processed for shipping or PDI.</span>
                    </div>
                  </div>
                </Modal>





                {/* Device List Hidden */}
                <div style={{ display: 'none' }}>
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
                      <div className="flex justify-end p-4 gap-3">
                        {assignUserStage?.stage === "FG to Store" && (
                          <button
                            type="button"
                            onClick={() => handleKeepInStore(selectedCarton)}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
                          >
                            <Box className="h-4 w-4" />
                            Keep in Store
                          </button>
                        )}
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center border-b pb-4 justify-between">
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

                  {/* Enhanced Stage Progress Badges */}
                  <div className="flex flex-nowrap gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                    {(processData?.stages || []).map((stage: any, idx: number) => {
                      const stageHistories = deviceHistory.filter((h: any) => h.stageName === stage.stageName);
                      const isPass = stageHistories.some((h: any) => h.status === "Pass" || h.status === "Completed");
                      const isNG = !isPass && stageHistories.some((h: any) => h.status === "NG");

                      return (
                        <div
                          key={idx}
                          className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${isPass
                            ? "bg-green-50/50 text-green-700 border-green-200 shadow-sm hover:shadow-green-100/50"
                            : isNG
                              ? "bg-red-50/50 text-red-700 border-red-200 shadow-sm hover:shadow-red-100/50"
                              : "bg-gray-50 text-gray-400 border-gray-100 opacity-60"
                            }`}
                        >
                          <div className={`p-1 rounded-md ${isPass ? 'bg-green-500/10' : isNG ? 'bg-red-500/10' : 'bg-gray-500/10'}`}>
                            {isPass ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : isNG ? (
                              <XCircle className="w-3 h-3 text-red-600" />
                            ) : (
                              <Circle className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                          <span>{stage.stageName}</span>
                          {isPass && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
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

                  {/* CASE 3: Unified Sequential Flow (Jig, Manual, Printing, Packaging) */}
                  {testSteps.length > 0 &&
                    !deviceHistory.some(
                      (h: any) =>
                        h.stageName ===
                        (assignUserStage?.name ||
                          assignUserStage?.[0]?.name ||
                          assignUserStage?.stage),
                    ) &&
                    // (!isdevicePassed || jigDecision) &&
                    !shouldHideJigInterface && (
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
                                            Process Progress
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

                                      {/* JIG STEP UI */}
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
                                            onDataReceived={(data: any) => { }}
                                            onDecision={handleStepDecision}
                                            onDisconnect={(fn: () => void) => {
                                              jigDisconnectRef.current = fn;
                                            }}
                                            searchQuery={searchQuery}
                                            onConnectionChange={setIsJigConnected}
                                            finalResult={jigResults[currentJigStepIndex]?.status}
                                            finalReason={jigResults[currentJigStepIndex]?.reason}
                                            onStatusUpdate={(status: string) => {
                                              pendingJigErrorRef.current = status;
                                            }}
                                            generatedCommand={generatedCommand}
                                            setGeneratedCommand={setGeneratedCommand}
                                          />
                                        </div>
                                      )}

                                      {/* MANUAL STEP UI */}
                                      {currentSubStep.stepType === "manual" && !currentSubStep.isPrinterEnable && !currentSubStep.isPackagingStatus && (
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
                                                Please physically inspect the device and verify correctly.
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
                                            {(() => {
                                              const fields = currentSubStep?.jigFields && currentSubStep.jigFields.length > 0 ? currentSubStep.jigFields : currentSubStep?.customFields;
                                              const hasFields = Array.isArray(fields) && fields.length > 0;

                                              return (
                                                <>
                                                  {!hasManualValues && hasFields && (
                                                    <div className="flex justify-end w-100">
                                                      <button
                                                        onClick={() => setIsManualValuesModalOpen(true)}
                                                        disabled={!!jigDecision}
                                                        className="flex items-center w-100 justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
                                                      >
                                                        <ClipboardList className="h-5 w-5" />
                                                        Add Value
                                                      </button>
                                                    </div>
                                                  )}
                                                  {(
                                                    !hasFields ||
                                                    hasManualValues
                                                  ) && (
                                                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                        <button
                                                          onClick={handleManualPass}
                                                          disabled={
                                                            !!jigDecision ||
                                                            (hasFields &&
                                                              fields.some((cf: any) => {
                                                                const name = cf?.fieldName || cf?.jigName;
                                                                const v = manualFieldValues[name ?? ""] ?? "";
                                                                return !validateCustomField(cf, v).valid;
                                                              }))
                                                          }
                                                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision
                                                            ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none"
                                                            : "bg-success hover:bg-green-600"
                                                            }`}
                                                        >
                                                          <CheckCircle className="h-5 w-5" />
                                                          Confirm & Mark Pass
                                                        </button>
                                                        <button
                                                          onClick={handleManualNG}
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
                                                    )}
                                                </>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                      <Modal
                                        isOpen={isManualValuesModalOpen}
                                        onClose={() => setIsManualValuesModalOpen(false)}
                                        onSubmit={handleSubmitManualValues}
                                        title="Add Custom Values"
                                      >
                                        <div className="space-y-6">
                                          {/* Modal Header inside content for full control if standard modal header is hidden or simple */}
                                          <div className="text-center">
                                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                                              <ClipboardList className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">Enter Manual Values</h3>
                                            <p className="text-sm text-gray-500 mt-1">Please provide the required measurements/values below.</p>
                                          </div>

                                          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-5">
                                            {(() => {
                                              const fields = currentSubStep?.jigFields && currentSubStep.jigFields.length > 0 ? currentSubStep.jigFields : currentSubStep?.customFields;
                                              return Array.isArray(fields) && fields.length > 0 ? (
                                                fields.map((cf: any, idx: number) => {
                                                  const fname = cf?.fieldName || cf?.jigName || `Field ${idx + 1}`;
                                                  const vtype = cf?.validationType || "value";
                                                  const inputType = vtype === "range" || vtype === "length" ? "number" : "text"; // Keep text for simplicity, validate logically
                                                  const val = manualFieldValues[fname] ?? "";
                                                  const res = validateCustomField(cf, val);
                                                  const hasError = (!res.valid && val.length > 0) || (manualErrors[fname]);

                                                  const baseCls = "w-full rounded-lg border px-4 py-3 text-sm outline-none transition duration-200";
                                                  const normalCls = "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
                                                  const errorCls = "border-red-300 bg-white text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100";

                                                  return (
                                                    <div key={idx} className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                                      <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                                        <span>{fname} <span className="text-red-500">*</span></span>
                                                        <span className="text-xs font-normal text-gray-400">
                                                          {vtype === "range" ? `Range: ${cf?.rangeFrom} - ${cf?.rangeTo}` :
                                                            vtype === "value" ? `Exact: ${cf?.value}` : "Required"}
                                                        </span>
                                                      </label>

                                                      <div className="relative">
                                                        <input
                                                          type={inputType === "number" ? "number" : "text"}
                                                          value={val}
                                                          autoFocus={idx === 0}
                                                          onChange={(e) => {
                                                            const v = e.target.value;
                                                            setManualFieldValues((prev) => ({ ...prev, [fname]: v }));
                                                            const r = validateCustomField(cf, v);
                                                            setManualErrors((prev) => ({ ...prev, [fname]: r.valid ? null : r.message || "Invalid value" }));
                                                          }}
                                                          placeholder={`Enter ${fname}`}
                                                          className={`${baseCls} ${hasError ? errorCls : normalCls}`}
                                                        />
                                                        {val && !hasError && (
                                                          <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 p-1 rounded-full">
                                                            <Check className="w-3 h-3" />
                                                          </div>
                                                        )}
                                                      </div>
                                                      {hasError && (
                                                        <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                                                          <AlertTriangle className="w-3 h-3" />
                                                          {manualErrors[fname] || res.message}
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                })
                                              ) : (
                                                <div className="p-4 text-center text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                                  No custom fields configured for this manual step.
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </Modal>

                                      {/* PRINTING STEP UI */}
                                      {currentSubStep.isPrinterEnable && (
                                        <div className="space-y-6">
                                          {!isStickerPrinted ? (
                                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                              <div className="flex items-center gap-3 mb-6">
                                                <Printer className="h-6 w-6 text-primary" />
                                                <h3 className="text-xl font-bold text-gray-900">Printing Stack</h3>
                                              </div>
                                              <div id="sticker-preview" className="space-y-4">
                                                {currentSubStep.printerFields?.map((field: any, idx: number) => (
                                                  <div key={idx} className="flex justify-center mb-4">
                                                    <StickerGenerator
                                                      stickerData={field}
                                                      deviceData={deviceList.filter((d: any) =>
                                                        String(d.serialNo || d.serial_no || "").trim() === String(searchResult || "").trim()
                                                      )}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                              <div className="flex justify-center mt-6">
                                                <button
                                                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-white font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                                                  onClick={handlePrintSticker}
                                                >
                                                  <Printer className="h-5 w-5" />
                                                  Print Sticker
                                                </button>
                                              </div>
                                            </div>
                                          ) : !isVerifiedSticker ? (
                                            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                                              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <ScanLine className="h-10 w-10 text-green-600" />
                                              </div>
                                              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Sticker</h3>
                                              <p className="text-gray-500 mb-8 max-w-xs mx-auto">Please scan or enter the serial number to proceed.</p>
                                              <button
                                                className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3.5 text-white font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95 mx-auto"
                                                onClick={handleVerifySticker}
                                              >
                                                <ScanLine className="h-5 w-5" />
                                                Start Verification
                                              </button>
                                              <Modal isOpen={isVerifyStickerModal} onSubmit={handleVerifyStickerModal} onClose={closeVerifyStickerModal} title="Verify Sticker">
                                                <div className="space-y-4">
                                                  <label className="block text-sm font-bold text-gray-700 mb-2">Enter / Scan Serial Number</label>
                                                  <input
                                                    type="text"
                                                    value={serialNumber || ""}
                                                    autoComplete="off"
                                                    onChange={(e) => setSerialNumber(e.target.value)}
                                                    placeholder="Scan QR code..."
                                                    className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-base font-medium focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                    autoFocus
                                                  />
                                                </div>
                                              </Modal>
                                            </div>
                                          ) : (
                                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                              <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-start gap-4 text-left">
                                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600 shadow-sm shrink-0">
                                                  <ClipboardCheck className="h-6 w-6" />
                                                </div>
                                                <div>
                                                  <div className="flex items-center gap-3">
                                                    <h5 className="text-lg font-bold text-gray-900">Manual Verification</h5>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase border border-orange-200">Sticker Verified</span>
                                                  </div>
                                                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">Please physically inspect the printed sticker on the device.</p>
                                                </div>
                                              </div>
                                              <div className="p-6">
                                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                  <button
                                                    onClick={() => handleStepDecision("Pass")}
                                                    disabled={!!jigDecision}
                                                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none" : "bg-success hover:bg-green-600"}`}
                                                  >
                                                    <CheckCircle className="h-5 w-5" /> Confirm Pass
                                                  </button>
                                                  <button
                                                    onClick={() => handleStepDecision("NG")}
                                                    disabled={!!jigDecision}
                                                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none" : "bg-danger hover:bg-red-600"}`}
                                                  >
                                                    <XCircle className="h-5 w-5" /> Mark NG
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* PACKAGING STEP UI */}
                                      {currentSubStep.isPackagingStatus && (
                                        <div className="space-y-6">
                                          {(() => {
                                            const isCarton = currentSubStep.packagingData?.packagingType === "Carton";
                                            return (
                                              <div className="border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-2xl border bg-white p-6 shadow-lg">
                                                <div className="mb-4 flex items-center justify-between gap-2">
                                                  <div className="flex items-center gap-2">
                                                    <Box className="h-6 w-6 text-primary" />
                                                    <h3 className="text-gray-900 text-xl font-semibold dark:text-white">
                                                      {isCarton ? "ðŸ“¦ Carton Details" : "ðŸ“„ Single Device Sticker"}
                                                    </h3>
                                                  </div>
                                                  {isCarton && (
                                                    <button
                                                      onClick={() => setIsCartonDevicesModalOpen(true)}
                                                      className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                                                    >
                                                      <List className="h-4 w-4" />
                                                      View Devices ({cartons[cartons.length - 1]?.devices?.length || 0})
                                                    </button>
                                                  )}
                                                </div>
                                                <hr className="border-gray-300 dark:border-gray-700 mb-4" />
                                                {isCarton ? (
                                                  <>
                                                    <div className="text-gray-700 dark:text-gray-300 grid gap-4 sm:grid-cols-2">
                                                      <p className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-500" /> <span className="font-medium">Dimensions:</span> {currentSubStep?.packagingData?.cartonWidth} Ã— {currentSubStep?.packagingData?.cartonHeight}</p>
                                                      <p className="flex items-center gap-2"><Weight className="h-5 w-5 text-green-500" /> <span className="font-medium">Weight:</span> {currentSubStep?.packagingData?.cartonWeight} kg</p>
                                                      <p className="flex items-center gap-2"><Layers className="h-5 w-5 text-purple-500" /> <span className="font-medium">Capacity:</span> {currentSubStep?.packagingData?.maxCapacity}</p>
                                                      <p className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-orange-500" /> <span className="font-medium">Issued:</span> {processData?.issuedCartons}</p>
                                                    </div>

                                                    {(() => {
                                                      const activeCarton = cartons[cartons.length - 1];
                                                      const capacity = currentSubStep?.packagingData?.maxCapacity || activeCarton?.maxCapacity || 0;
                                                      const isFull = activeCarton && activeCarton.devices?.length >= capacity;

                                                      if (isFull) {
                                                        const cartonDeviceData = [{
                                                          serialNo: activeCarton.cartonSerial,
                                                          cartonSerial: activeCarton.cartonSerial,
                                                          deviceCount: activeCarton.devices?.length || 0,
                                                          maxCapacity: capacity,
                                                          productName: product?.name,
                                                          weight: activeCarton.weightCarton || currentSubStep?.packagingData?.cartonWeight,
                                                          createdAt: activeCarton.createdAt || new Date().toISOString(),
                                                        }];

                                                        return (
                                                          <div className={`mt-6 p-6 rounded-2xl border-2 border-dashed transition-all ${isCartonBarcodePrinted ? 'bg-green-50/50 border-green-200' : 'bg-primary/5 border-primary/20'}`}>
                                                            <div className="flex items-center justify-between mb-4">
                                                              <div className="flex items-center gap-2">
                                                                <Printer className={`h-6 w-6 ${isCartonBarcodePrinted ? 'text-green-600' : 'text-primary'}`} />
                                                                <div>
                                                                  <h4 className="text-lg font-bold text-gray-900">Carton Sticker</h4>
                                                                  {isCartonBarcodePrinted && <span className="text-[10px] font-black uppercase text-green-600 tracking-wider">Already Printed</span>}
                                                                </div>
                                                              </div>
                                                              <button
                                                                onClick={handlePrintCartonSticker}
                                                                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-white font-bold shadow-lg transition-all active:scale-95 ${isCartonBarcodePrinted ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                                                              >
                                                                <Printer className="h-5 w-5" />
                                                                {isCartonBarcodePrinted ? 'Reprint Sticker' : 'Print Sticker'}
                                                              </button>
                                                            </div>
                                                            <div id="carton-sticker-preview" className="bg-white p-4 rounded-xl border shadow-inner flex justify-center overflow-hidden">
                                                              <StickerGenerator
                                                                stickerData={currentSubStep?.packagingData}
                                                                deviceData={cartonDeviceData}
                                                              />
                                                            </div>
                                                            <p className={`text-center text-xs mt-3 font-medium ${isCartonBarcodePrinted ? 'text-green-600/60' : 'text-primary/60'}`}>
                                                              Carton Full Capacity ({capacity}/{capacity})
                                                            </p>
                                                          </div>
                                                        );
                                                      }
                                                      return null;
                                                    })()}
                                                    {!isAddedToCart ? (
                                                      <div className="mt-6 flex justify-center gap-4">
                                                        <button
                                                          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700"
                                                          onClick={() => handleAddToCart(currentSubStep)}
                                                        >
                                                          <PlusCircle className="h-5 w-5" /> Add To Cart
                                                        </button>
                                                        <button
                                                          className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-white shadow hover:bg-danger"
                                                          onClick={() => handleStepDecision("NG")}
                                                        >
                                                          <XCircle className="h-5 w-5" /> NG
                                                        </button>
                                                      </div>
                                                    ) : !isVerifiedPackaging ? (
                                                      <div className="mt-6 flex flex-col items-center gap-4 p-6 bg-blue-50 rounded-xl border border-blue-100">
                                                        <ScanLine className="h-8 w-8 text-blue-600" />
                                                        <p className="text-sm font-bold text-blue-800">Please Verify Device in Carton</p>
                                                        <button
                                                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white font-bold"
                                                          onClick={handleVerifyPackaging}
                                                        >
                                                          Start Verification
                                                        </button>
                                                        <Modal isOpen={isVerifyPackagingModal} onSubmit={handleVerifyPackagingModal} onClose={closeVerifyPackagingModal} title="Verify Packaging">
                                                          <div className="space-y-4">
                                                            <label className="block text-sm font-bold text-gray-700 mb-2">Enter / Scan Serial Number</label>
                                                            <input
                                                              type="text"
                                                              value={serialNumber || ""}
                                                              autoComplete="off"
                                                              onChange={(e) => setSerialNumber(e.target.value)}
                                                              placeholder="Scan device serial..."
                                                              className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-base font-medium focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                              autoFocus
                                                            />
                                                          </div>
                                                        </Modal>
                                                      </div>
                                                    ) : (
                                                      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                                        <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-start gap-4 text-left">
                                                          <div className="p-2 bg-orange-100 rounded-lg text-orange-600 shadow-sm shrink-0">
                                                            <ClipboardCheck className="h-6 w-6" />
                                                          </div>
                                                          <div>
                                                            <div className="flex items-center gap-3">
                                                              <h5 className="text-lg font-bold text-gray-900">Manual Verification</h5>
                                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase border border-orange-200">Packaging Verified</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">Please ensure the device is correctly placed in the carton.</p>
                                                          </div>
                                                        </div>
                                                        <div className="p-6">
                                                          <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                            <button
                                                              onClick={() => handleStepDecision("Pass")}
                                                              disabled={!!jigDecision}
                                                              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none" : "bg-success hover:bg-green-600"}`}
                                                            >
                                                              <CheckCircle className="h-5 w-5" /> Confirm Pass
                                                            </button>
                                                            <button
                                                              onClick={() => handleStepDecision("NG")}
                                                              disabled={!!jigDecision}
                                                              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none" : "bg-danger hover:bg-red-600"}`}
                                                            >
                                                              <XCircle className="h-5 w-5" /> Mark NG
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                ) : (
                                                  <>
                                                    {!isStickerPrinted ? (
                                                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                                        <div className="flex items-center gap-3 mb-6">
                                                          <Printer className="h-6 w-6 text-primary" />
                                                          <h3 className="text-xl font-bold text-gray-900 font-outfit">Packaging Sticker</h3>
                                                        </div>
                                                        <div id="sticker-preview" className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 flex justify-center mb-4">
                                                          <StickerGenerator
                                                            stickerData={currentSubStep.packagingData}
                                                            deviceData={deviceList.filter((d: any) => d.serialNo === searchResult)}
                                                          />
                                                        </div>
                                                        <div className="flex justify-center mt-6">
                                                          <button
                                                            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-white font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                                                            onClick={handlePrintSticker}
                                                          >
                                                            <Printer className="h-5 w-5" />
                                                            Print Packaging Sticker
                                                          </button>
                                                        </div>
                                                      </div>
                                                    ) : !isVerifiedSticker ? (
                                                      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                          <ScanLine className="h-10 w-10 text-green-600" />
                                                        </div>
                                                        <h3 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">Verify Sticker</h3>
                                                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Please scan or enter the serial number for verification.</p>
                                                        <button
                                                          className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3.5 text-white font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95 mx-auto"
                                                          onClick={handleVerifySticker}
                                                        >
                                                          <ScanLine className="h-5 w-5" />
                                                          Start Verification
                                                        </button>
                                                        <Modal isOpen={isVerifyStickerModal} onSubmit={handleVerifyStickerModal} onClose={closeVerifyStickerModal} title="Verify Sticker">
                                                          <div className="space-y-4">
                                                            <label className="block text-sm font-bold text-gray-700 mb-2">Enter / Scan Serial Number</label>
                                                            <input
                                                              type="text"
                                                              value={serialNumber || ""}
                                                              autoComplete="off"
                                                              onChange={(e) => setSerialNumber(e.target.value)}
                                                              placeholder="Scan QR code..."
                                                              className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-base font-medium focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                              autoFocus
                                                            />
                                                          </div>
                                                        </Modal>
                                                      </div>
                                                    ) : (
                                                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                                        <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-start gap-4 text-left">
                                                          <div className="p-2 bg-orange-100 rounded-lg text-orange-600 shadow-sm shrink-0">
                                                            <ClipboardCheck className="h-6 w-6" />
                                                          </div>
                                                          <div>
                                                            <div className="flex items-center gap-3">
                                                              <h5 className="text-lg font-bold text-gray-900">Manual Verification</h5>
                                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase border border-orange-200">Sticker Verified</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">Please physically inspect the packaging sticker on the device.</p>
                                                          </div>
                                                        </div>
                                                        <div className="p-6">
                                                          <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                            <button
                                                              onClick={() => handleStepDecision("Pass")}
                                                              disabled={!!jigDecision}
                                                              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none" : "bg-success hover:bg-green-600"}`}
                                                            >
                                                              <CheckCircle className="h-5 w-5" /> Confirm Pass
                                                            </button>
                                                            <button
                                                              onClick={() => handleStepDecision("NG")}
                                                              disabled={!!jigDecision}
                                                              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "bg-gray-400 cursor-not-allowed opacity-50 shadow-none" : "bg-danger hover:bg-red-600"}`}
                                                            >
                                                              <XCircle className="h-5 w-5" /> Mark NG
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          <div className="space-y-6" >
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" >
                              <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4 text-gray-500" />
                                  Stage Summary
                                </h4>
                              </div>
                              <div className="divide-y divide-gray-100" style={{ maxHeight: '601px', overflowY: 'auto' }}>
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
                                            {step.stepName || step.name || (step.isPrinterEnable ? "Printing" : step.isPackagingStatus ? "Packaging" : `Step ${index + 1}`)}
                                          </span>
                                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                            {step.stepType || (step.isPrinterEnable ? "printer" : step.isPackagingStatus ? "packaging" : "manual")}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex justify-end min-w-[80px]">
                                        {status === 'Pass' && <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-100"><Check className="w-3 h-3" /> Pass</span>}
                                        {status === 'NG' && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-100"><XCircle className="w-3 h-3" /> Failed</span>}
                                        {!status && index === currentJigStepIndex && <span className="text-xs text-blue-600 font-bold animate-pulse">In Progress...</span>}
                                        {!status && index !== currentJigStepIndex && <span className="text-xs text-gray-400 font-medium">Pending</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Carton Details (Moved from Recent Activity) */}
                            {processAssignUserStage?.subSteps?.some((s: any) => s.isPackagingStatus) && (
                              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mt-6">
                                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
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
                                      {(() => {
                                        const cartonList = Array.isArray(processCartons) ? processCartons : processCartons?.cartonDetails || [];
                                        return cartonList.length > 0 ? (
                                          cartonList.map((row: any, rowIndex: number) => (
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
                                        );
                                      })()}
                                    </tbody>
                                  </table>
                                  {(Array.isArray(processCartons) ? processCartons.length > 0 : processCartons?.cartonDetails?.length > 0) && (
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

                        {/* Next Device Selection */}
                        {jigDecision && (
                          <div className="flex flex-col items-center gap-4 mt-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h4 className={`text-xl font-black ${jigDecision === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                              STAGE COMPLETE: {jigDecision}
                            </h4>
                            <button
                              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-white font-bold shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                              onClick={() => {
                                if (jigDisconnectRef.current) jigDisconnectRef.current();
                                if (searchResult && setDeviceList) {
                                  setDeviceList((prev: any[]) => prev.filter((d: any) => d.serialNo !== searchResult));
                                }
                                setSearchResult("");
                                setSearchQuery("");
                                setJigDecision(null);
                                setCurrentJigStepIndex(0);
                                setJigResults({});
                                setGeneratedCommand("");
                                window.scrollTo(0, 0);
                              }}
                            >
                              <ArrowRightCircle className="h-6 w-6" />
                              Move to Next Device
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                                  ðŸ“¦ Device Not Found
                                </option>
                                <option value="technical_fault">
                                  âš¡ Technical Fault
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
        </div >
      </div >

      {/* Footer */}
      < div className="mt-4 flex justify-end gap-3" >
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
      </div >

      {/* History Drawer */}
      < div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isHistoryOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
      >
        {/* Backdrop */}
        < div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`relative h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 transform ${isHistoryOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto space-y-6">
            {/* Tested History List */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
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
                    <tr className="bg-white">
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

          </div>
        </div>
      </div >
      <Modal
        isOpen={isCartonDevicesModalOpen}
        onClose={() => setIsCartonDevicesModalOpen(false)}
        title="Devices in Current Carton"
        onSubmit={() => { }}
        submitOption={false}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-3">Serial No</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cartons && cartons.length > 0 && Array.isArray(cartons[cartons.length - 1]?.devices) ? (
                cartons[cartons.length - 1].devices.map((device: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{device?.serialNo || device || "N/A"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">In Carton</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-gray-400 italic">No devices added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
