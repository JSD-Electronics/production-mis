"use client";
import Modal from "@/components/Modal/page";
import { useQRCode } from "next-qrcode";
import { QRCodeSVG } from "qrcode.react";
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
  searchByJigFields,
  closeLooseCarton,
  getDeviceTestRecordsByProcessId,
  updateMarkAsComplete,
  createProcessLogs,
  registerDeviceAttempt,
  verifyCartonSticker,
} from "@/lib/api";
import {
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
  RotateCcw,
  Terminal,
  Cable,
  FileText,
  Cpu,
  Timer,
} from "lucide-react";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import StickerGenerator from "../viewTask-old/StickerGenerator";
import { toast } from "react-toastify";
import JigSection from "./components/JigSection";
import JigIdentificationSection from "./components/JigIdentificationSection";
import CartonDetailsPopup from "./components/CartonDetailsPopup";

interface Cart {
  cartonSerial: string;
  processId: string;
  devices: any[];
  cartonSize: { width: number; height: number; depth?: number };
  maxCapacity: number;
  weightCarton: number;
  status: "empty" | "partial" | "full";
  isLooseCarton?: boolean;
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
  expectedScanTypes: string[];
  currentScanStep: number;
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
  handlePrintCartonSticker: (elementId?: string) => void | Promise<void>;
  historyFilterDate: string;
  setHistoryFilterDate: (date: string) => void;
  handlePauseResume: () => void;
  handleStop: () => void;
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
  expectedScanTypes,
  currentScanStep,
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
  handlePauseResume,
  handleStop,
}: DeviceTestComponentProps) {
  const isCommon = assignedTaskDetails?.stageType === "common";
  const currentStageName =
    (Array.isArray(assignUserStage) ? assignUserStage?.[0]?.name : null) ||
    assignUserStage?.stage ||
    assignUserStage?.name ||
    "";
  const isPDIStage = currentStageName === "PDI";
  const isFGToStoreStage = currentStageName === "FG to Store";

  const cartonStickerTemplate = React.useMemo(() => {
    const fromProcess = processAssignUserStage?.subSteps?.find(
      (s: any) => s?.isPackagingStatus && !s?.disabled,
    )?.packagingData;
    const fromAssign = (assignUserStage as any)?.subSteps?.find(
      (s: any) => s?.isPackagingStatus && !s?.disabled,
    )?.packagingData;

    const fromAnyStage = (() => {
      const stages = Array.isArray(processData?.stages) ? processData.stages : [];
      for (const st of stages) {
        const sub = st?.subSteps?.find(
          (s: any) =>
            s?.isPackagingStatus &&
            !s?.disabled &&
            Array.isArray(s?.packagingData?.fields),
        );
        if (sub?.packagingData) return sub.packagingData;
      }
      return null;
    })();

    const candidate = fromProcess || fromAssign || fromAnyStage || null;
    return Array.isArray(candidate?.fields) ? candidate : null;
  }, [processAssignUserStage, assignUserStage, processData?.stages]);

  const getDeviceModelText = (device: any) =>
    device?.modelName || device?.model || device?.productModel || "N/A";

  const getDeviceImeiText = (device: any) => {
    const imeiDirect = device?.imeiNo || device?.imei || "";
    if (imeiDirect) return imeiDirect;

    const cf = device?.customFields;
    if (!cf || typeof cf !== "object") return "N/A";

    for (const stageKey of Object.keys(cf)) {
      const stageObj = (cf as any)?.[stageKey];
      if (!stageObj || typeof stageObj !== "object") continue;
      for (const k of Object.keys(stageObj)) {
        if (String(k).toLowerCase() === "imei") {
          const v = String(stageObj[k] ?? "").trim();
          if (v) return v;
        }
      }
    }

    return "N/A";
  };

  const [multiScanValues, setMultiScanValues] = useState<string[]>([]);
  useEffect(() => {
    if (Array.isArray(expectedScanTypes) && expectedScanTypes.length > 1) {
      setMultiScanValues((prev) => {
        const next = [...prev];
        next.length = expectedScanTypes.length;
        for (let i = 0; i < expectedScanTypes.length; i++) {
          if (typeof next[i] !== "string") next[i] = "";
        }
        return next;
      });
    } else {
      setMultiScanValues([]);
    }
  }, [expectedScanTypes.length]);
  useEffect(() => {
    if (processData?._id) {
      fetchExistingCartonsByProcessID();
      fetchProcessCartons();
    }
  }, [processData?._id]);

  // Keep next-qrcode for other parts of the page, but carton sticker uses qrcode.react (SVG)
  // for stable DOM printing without canvas cloning issues.
  const { SVG } = useQRCode();
  const [qrCartons, setQrCartons] = useState<{ [key: string]: boolean }>({});
  const [generatedCartonSticker, setGeneratedCartonSticker] = useState<
    Record<string, boolean>
  >({});
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSopOpen, setIsSopOpen] = useState(true);
  const [historySerialQuery, setHistorySerialQuery] = useState("");
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  const formatHistoryTime = (row: any) => {
    const createdAt = row?.deviceInfo?.createdAt || row?.createdAt;
    if (createdAt) {
      try {
        return new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch {
        // fall through
      }
    }
    return row?.timeTaken || "-";
  };

  const getHistoryTimestamp = (record: any) => {
    const raw =
      record?.createdAt ||
      record?.updatedAt ||
      record?.deviceInfo?.createdAt ||
      record?.logData?.createdAt ||
      null;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  };

  const getRecordFlowVersion = (record: any) => {
    const raw =
      record?.flowVersion ??
      record?.deviceInfo?.flowVersion ??
      record?.logData?.flowVersion ??
      null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const isFlowBoundaryRecord = (record: any) =>
    Boolean(record?.flowBoundary) ||
    String(record?.flowType || "").trim().toLowerCase() === "reset";

  const isTransferHistoryRecord = (record: any) => {
    const searchType = String(record?.searchType || "").trim().toLowerCase();
    const status = String(record?.status || "").trim().toLowerCase();
    const stageName = String(record?.stageName || record?.name || "")
      .trim()
      .toLowerCase();
    return (
      isFlowBoundaryRecord(record) ||
      searchType.includes("kit transfer") ||
      status === "transferred" ||
      stageName === "kit transfer approval"
    );
  };

  const visibleDeviceHistory = React.useMemo(() => {
    const history = Array.isArray(deviceHistory) ? [...deviceHistory] : [];
    if (history.length === 0) return history;

    const latestBoundary = history
      .filter(isFlowBoundaryRecord)
      .sort((a: any, b: any) => {
        const at = getHistoryTimestamp(a) ?? 0;
        const bt = getHistoryTimestamp(b) ?? 0;
        return bt - at;
      })[0];

    const boundaryVersion = latestBoundary ? getRecordFlowVersion(latestBoundary) : null;
    const boundaryTime = latestBoundary ? getHistoryTimestamp(latestBoundary) : null;
    if (boundaryVersion == null) return history.filter((record) => !isTransferHistoryRecord(record));

    return history.filter((record: any) => {
      if (isTransferHistoryRecord(record)) return false;
      const recordVersion = getRecordFlowVersion(record);
      if (recordVersion == null) {
        if (boundaryTime == null) return false;
        const recordTime = getHistoryTimestamp(record);
        return recordTime != null && recordTime >= boundaryTime;
      }
      return recordVersion === boundaryVersion;
    });
  }, [deviceHistory]);

  // Reset verification inputs whenever modal opens
  useEffect(() => {
    if (isVerifyStickerModal) {
      setMultiScanValues(expectedScanTypes.length > 0 ? new Array(expectedScanTypes.length).fill("") : []);
      setSerialNumber("");
    }
  }, [isVerifyStickerModal]);

  // Ref to hold the disconnect function from the jig interface
  const jigDisconnectRef = React.useRef<(() => void) | null>(null);

  const [cartonSerial, setCartonSerial] = useState<string[]>([]);
  const [cartonDetails, setCartonDetails] = useState<any[]>([]);
  const [cartonSearchQuery, setCartonSearchQuery] = useState("");
  const [selectedCarton, setSelectedCarton] = useState<string | null>(null);
  const [cartonDevices, setCartonDevices] = useState<any[]>([]);
  const [loadingCartonDevices, setLoadingCartonDevices] = useState(false);
  const [isCartonsLoading, setIsCartonsLoading] = useState(false);
  const [showNGModal, setShowNGModal] = useState(false);

  const selectedCartonObj = React.useMemo(() => {
    if (!selectedCarton) return null;
    const list = Array.isArray(cartonDetails) ? cartonDetails : [];
    return list.find((c: any) => c?.cartonSerial === selectedCarton) || null;
  }, [selectedCarton, cartonDetails]);
  const isSelectedCartonVerified = Boolean((selectedCartonObj as any)?.isStickerVerified);

  const cartonLabelData = React.useMemo(() => {
    if (!selectedCarton) return null;

    const carton = selectedCartonObj || {};
    const size = carton?.cartonSize || {};
    const p = carton?.packagingData || carton?.packagingData?.packagingData || {};

    const w = size?.width ?? p?.cartonWidth;
    const h = size?.height ?? p?.cartonHeight;
    const d = size?.depth ?? p?.cartonDepth;
    const dimensionsCm =
      w != null && h != null && d != null ? `${w}*${h}*${d}CM` : "N/A";

    const processName =
      processData?.processName ||
      processData?.name ||
      processData?.processCode ||
      "N/A";

    const modelName =
      product?.selectedProduct?.name || product?.name || product?.modelName || "N/A";

    return {
      cartonSerial: selectedCarton,
      serialNo: selectedCarton,
      deviceCount: Array.isArray(cartonDevices) ? cartonDevices.length : 0,
      maxCapacity: carton?.maxCapacity ?? p?.maxCapacity ?? "",
      processName,
      productName: product?.name || "N/A",
      modelName,
      dimensionsCm,
      weightCarton: carton?.weightCarton ?? p?.cartonWeight ?? "",
      createdAt: carton?.createdAt || new Date().toISOString(),
    };
  }, [selectedCarton, selectedCartonObj, cartonDevices, processData, product]);

  // Carton sticker is a fixed physical label: 80mm x 40mm.
  const cartonStickerMm = { w: 80, h: 40 };
  const cartonStickerPx = {
    w: Math.round(cartonStickerMm.w / 0.264583),
    h: Math.round(cartonStickerMm.h / 0.264583),
  };
  const packagingDescriptionHtml = React.useMemo(() => {
    const stageName = String(
      assignUserStage?.stage || assignedTaskDetails?.stageName || "",
    );
    const productStage = product?.stages?.find(
      (st: any) => String(st?.stageName || st?.name || "") === stageName,
    );
    const subSteps =
      (Array.isArray(processAssignUserStage?.subSteps) &&
      processAssignUserStage.subSteps.length > 0
        ? processAssignUserStage.subSteps
        : Array.isArray(productStage?.subSteps)
          ? productStage.subSteps
          : []) || [];
    const packagingStep = subSteps.find(
      (s: any) => s?.isPackagingStatus && !s?.disabled,
    );

    return packagingStep?.description ? String(packagingStep.description) : "";
  }, [
    assignUserStage?.stage,
    assignedTaskDetails?.stageName,
    processAssignUserStage?.subSteps,
    product?.stages,
  ]);
  const [ngReason, setNgReason] = useState<string | null>(null);
  const [ngDescription, setNgDescription] = useState<string>("");
  const [jigDecision, setJigDecision] = useState<"Pass" | "NG" | null>(null);
  const [currentJigStepIndex, setCurrentJigStepIndex] = useState(0);
  const [jigResults, setJigResults] = useState<
    Record<
      number,
      { status: "Pass" | "NG"; reason?: string; data?: any; timeTaken?: number }
    >
  >({});
  const stepStartTimeRef = React.useRef<number>(Date.now());
  const [stepTimeLeft, setStepTimeLeft] = useState<number | null>(null);
  const [isJigConnected, setIsJigConnected] = useState(false);
  const pendingJigErrorRef = React.useRef<string | null>(null);
  const [pendingJigErrorState, setPendingJigErrorState] = useState<
    string | null
  >(null); // For UI feedback if needed
  const totalProcessStartTimeRef = React.useRef<number>(Date.now());
  const [isPreviousStagesModalOpen, setIsPreviousStagesModalOpen] =
    useState(false);
  const [isCartonDevicesModalOpen, setIsCartonDevicesModalOpen] =
    useState(false);
  const [isVerifyCartonModal, setIsVerifyCartonModal] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<any[]>([]);
  const [selectedLogsTitle, setSelectedLogsTitle] =
    useState("Detailed Step Logs");
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isCartonDeviceHistoryOpen, setIsCartonDeviceHistoryOpen] =
    useState(false);
  const [cartonDeviceHistorySerial, setCartonDeviceHistorySerial] =
    useState<string>("");
  const [cartonDeviceHistoryRows, setCartonDeviceHistoryRows] = useState<any[]>(
    [],
  );
  const [isCartonDeviceHistoryLoading, setIsCartonDeviceHistoryLoading] =
    useState(false);
  // Cache process-level records to avoid refetching the full dataset on each history click.
  const processTestRecordsRef = React.useRef<any[] | null>(null);
  const processTestRecordsPromiseRef = React.useRef<Promise<any[]> | null>(null);
  const [isCartonPopupOpen, setIsCartonPopupOpen] = useState(false);
  const [manualFieldValues, setManualFieldValues] = useState<
    Record<string, string>
  >({});
  const [manualErrors, setManualErrors] = useState<
    Record<string, string | null>
  >({});
  const [isManualValuesModalOpen, setIsManualValuesModalOpen] = useState(false);

  const hasActiveDevice = React.useMemo(() => {
    if (!searchResult || !Array.isArray(deviceList)) return false;
    return deviceList.some((device: any) => device.serialNo === searchResult);
  }, [deviceList, searchResult]);
  const [hasManualValues, setHasManualValues] = useState(false);
  const [generatedCommand, setGeneratedCommand] = useState<string>("");
  const [isJigSearching, setIsJigSearching] = useState(false);
  const [jigSearchError, setJigSearchError] = useState<string | null>(null);

  const getPlanIdFromUrl = () => {
    if (typeof window === "undefined") return "";
    // Be robust to trailing slashes: always return the last non-empty segment.
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  };
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem("userDetails");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?._id || "";
    } catch {
      return "";
    }
  };
  const getAttemptStageName = () =>
    String(
      processAssignUserStage?.name ||
        processAssignUserStage?.stage ||
        assignUserStage?.name ||
        assignUserStage?.stage ||
        assignedTaskDetails?.stageName ||
        "",
    ).trim();
  const getAttemptKey = (serialOrDeviceId: string, stageName?: string) =>
    `${String(serialOrDeviceId || "").trim()}::${String(stageName || getAttemptStageName()).trim()}`;
  const registerAttempt = async (serialNo: string, deviceId?: string) => {
    const planId = getPlanIdFromUrl();
    const processId = processData?._id || assignedTaskDetails?.processId || "";
    const stageName = getAttemptStageName();
    if (!planId || !processId || (!serialNo && !deviceId)) return;
    try {
      const response = await registerDeviceAttempt({
        serialNo,
        deviceId,
        planId,
        processId,
        operatorId: getCurrentUserId(),
        stageName,
      });
      if (response?.attemptCount != null) {
        const key = getAttemptKey(serialNo || deviceId || "", stageName);
        setAttemptCounts((prev) => ({ ...prev, [key]: response.attemptCount }));
      }
    } catch (error) {
      console.error("Failed to register attempt", error);
    }
  };

  useEffect(() => {
    if (!searchResult) return;

    const stageData = Array.isArray(processAssignUserStage)
      ? processAssignUserStage[0]
      : processAssignUserStage;
    const isNgEnabledForStage = Boolean(
      stageData?.subSteps?.some((s: any) => !s?.disabled && s?.isCheckboxNGStatus),
    );

    // Some tasks only want attempts to be tracked (stage-wise analytics) without forcing an NG modal.
    // Keep the attempt counter, but disable the auto-NG popup for specific task ids.
    const AUTO_NG_DISABLED_PLAN_IDS = new Set([
      "6957502a10c5e95da96278a7",
    ]);
    const planId = getPlanIdFromUrl();
    // Also guard by pathname to avoid any mismatch between "plan id" and route params.
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (
      (planId && AUTO_NG_DISABLED_PLAN_IDS.has(planId)) ||
      pathname.includes("/operators/task/6957502a10c5e95da96278a7")
    ) {
      // If the modal was opened by auto-NG earlier, close it on this task.
      if (showNGModal && ngReason === "Auto NG after 3 attempts") {
        setShowNGModal(false);
        setNgReason(null);
        setNgDescription("");
      }
      return;
    }

    // Only auto-open NG when the current stage actually supports "Mark As NG".
    if (!isNgEnabledForStage) {
      if (showNGModal && ngReason === "Auto NG after 3 attempts") {
        setShowNGModal(false);
        setNgReason(null);
        setNgDescription("");
      }
      return;
    }

    const key = getAttemptKey(String(searchResult || ""));
    const count = attemptCounts[key] || 0;
    if (count >= 3 && !showNGModal) {
      setNgReason("Auto NG after 3 attempts");
      setNgDescription("");
      setShowNGModal(true);
    }
  }, [attemptCounts, searchResult, showNGModal, ngReason, processAssignUserStage, assignUserStage, assignedTaskDetails]);

  const handleJigIdentification = async (capturedFields: any) => {
    setIsJigSearching(true);
    setJigSearchError(null);
    try {
      const response = await searchByJigFields({
        jigFields: capturedFields,
        processId: processData?._id,
      });
      if (response && response.data) {
        const device = response.data;
        const serial = device.serialNo || device.serial_no;

        await getDeviceById(device._id);
        setSearchResult(serial);
        setSearchQuery(serial);
        registerAttempt(String(serial || ""), String(device._id || ""));

        // Match manual search reset behavior
        if (setIsStickerPrinted) setIsStickerPrinted(false);
        if (setIsVerifiedSticker) setIsVerifiedSticker(false);
        if (setIsDevicePassed) setIsDevicePassed(false);

        const stageData = Array.isArray(processAssignUserStage)
          ? processAssignUserStage[0]
          : processAssignUserStage;
        const hasPrinter = stageData?.subSteps?.some(
          (s: any) => s.isPrinterEnable && !s?.disabled,
        );
        if (setIsPassNGButtonShow) {
          setIsPassNGButtonShow(!hasPrinter);
        }

        toast.success(`Device Identified: ${serial}`);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Device not found";
      setJigSearchError(msg);
      if (err.response?.status === 409) {
        toast.error(msg);
      }
    } finally {
      setIsJigSearching(false);
    }
  };

  const handleVerifyCarton = async (scannedValue: string) => {
    const v = String(scannedValue || "").trim();
    if (!selectedCarton) {
      toast.error("No carton selected");
      return;
    }
    if (v !== String(selectedCarton).trim()) {
      toast.error("Incorrect carton serial. Please scan the correct carton.");
      return;
    }

    try {
      await verifyCartonSticker(String(selectedCarton));
      toast.success("Carton verified successfully!");
      setIsVerifyCartonModal(false);
      fetchProcessCartons();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Verification failed");
    }
  };

  const subStepsString = JSON.stringify(processAssignUserStage?.subSteps || []);
  const testSteps = React.useMemo(() => {
    return (
      processAssignUserStage?.subSteps?.filter(
        (s: any) =>
          !s?.disabled && (
            s.stepType === "jig" ||
            s.stepType === "manual" ||
            s.isPrinterEnable ||
            s.isPackagingStatus
          ),
      ) || []
    );
  }, [subStepsString]);

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
      if (Number.isNaN(from) || Number.isNaN(to))
        return { valid: true, message: null };
      if (num < from || num > to)
        return { valid: false, message: `Enter between ${from}-${to}` };
      return { valid: true, message: null };
    }
    if (vtype === "length") {
      const len = val.length;
      const from = Number(cf?.lengthFrom);
      const to = Number(cf?.lengthTo);
      if (Number.isNaN(from) || Number.isNaN(to))
        return { valid: true, message: null };
      if (len < from || len > to)
        return { valid: false, message: `Length ${from}-${to} chars` };
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

  const updateCustomFieldsDataIntoDB = async (
    values: Record<string, string>,
  ) => {
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
    const fields =
      currentSubStep?.jigFields && currentSubStep.jigFields.length > 0
        ? currentSubStep.jigFields
        : currentSubStep?.customFields;

    if (
      currentSubStep?.stepType === "manual" &&
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      const hasError = fields.some((cf: any) => {
        const name = cf?.fieldName || cf?.jigName;
        const v = manualFieldValues[name ?? ""] ?? "";
        const result = validateCustomField(cf, v);
        return !result.valid;
      });
      if (hasError) return;
    }
    if (
      currentSubStep?.stepType === "manual" &&
      Array.isArray(fields) &&
      fields.length > 0
    ) {
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
    if (!hasActiveDevice) {
      alert("Please scan/select a device before marking NG.");
      return;
    }
    const currentSubStep = testSteps[currentJigStepIndex];
    const fields =
      currentSubStep?.jigFields && currentSubStep.jigFields.length > 0
        ? currentSubStep.jigFields
        : currentSubStep?.customFields;

    if (
      currentSubStep?.stepType === "manual" &&
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      const collected: Record<string, string> = {};
      fields.forEach((cf: any) => {
        const name = cf?.fieldName || cf?.jigName;
        if (name) {
          collected[name] = manualFieldValues[name] ?? "";
        }
      });
      await updateCustomFieldsDataIntoDB(collected);
    }
    setNgReason("Manual failure / Timeout");
    setShowNGModal(true);
  };

  const handleManualNGFromModal = async () => {
    if (!hasActiveDevice) {
      alert("Please scan/select a device before marking NG.");
      return;
    }
    const currentSubStep = testSteps[currentJigStepIndex];
    const fields =
      currentSubStep?.jigFields && currentSubStep.jigFields.length > 0
        ? currentSubStep.jigFields
        : currentSubStep?.customFields;

    if (
      currentSubStep?.stepType === "manual" &&
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      const collected: Record<string, string> = {};
      fields.forEach((cf: any) => {
        const name = cf?.fieldName || cf?.jigName;
        if (name) {
          collected[name] = manualFieldValues[name] ?? "";
        }
      });
      await updateCustomFieldsDataIntoDB(collected);
    }

    setIsManualValuesModalOpen(false);
    setTimeout(() => setShowNGModal(true), 0);
  };
  const handleSubmitManualValues = () => {
    const currentSubStep = testSteps[currentJigStepIndex];
    const fields =
      currentSubStep?.jigFields && currentSubStep.jigFields.length > 0
        ? currentSubStep.jigFields
        : currentSubStep?.customFields;

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

  const handleStepDecision = (
    status: "Pass" | "NG",
    reason?: string,
    data?: any,
    isImmediate = true,
  ) => {
    if (jigDecision) {
      return;
    }

    // For the new requirement: If it's a non-immediate NG from the jig, store the reason and wait.
    if (status === "NG" && !isImmediate) {
      pendingJigErrorRef.current = reason || "Validation failed";
      setPendingJigErrorState(reason || "Validation failed");
      return;
    }

    const timeTaken = Math.round(
      (Date.now() - stepStartTimeRef.current) / 1000,
    );

    const newResults = {
      ...jigResults,
      [currentJigStepIndex]: { status, reason, data, timeTaken },
    };
    setJigResults(newResults);

    // IMMEDIATE NG CHECK: If any step fails, finalize immediately.
    if (status === "NG") {
      setJigDecision("NG");
      setNgReason(reason || "Manual failure / Timeout");
      setNgDescription("");
      setShowNGModal(true);
      setStepTimeLeft(null);
      pendingJigErrorRef.current = null;
      setPendingJigErrorState(null);
      // Disconnect jig if active
      // if (jigDisconnectRef.current) {
      //   jigDisconnectRef.current();
      // }
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

      const totalProcessTime = Math.round(
        (Date.now() - totalProcessStartTimeRef.current) / 1000,
      );

      if (finalStatus === "Pass") {
        handleUpdateStatus("Pass", "", { ...newResults, totalProcessTime });
      } else {
        setNgDescription("");
        setShowNGModal(true);
      }
    }
    setStepTimeLeft(null);
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
  };
  // ... rest of the file ...

  // Session tracking to prevent resets on background polling
  const [activeSessionSerial, setActiveSessionSerial] = useState<string>("");
  const timerStartedRef = React.useRef<string | null>(null);
  const timerDecisionTriggeredRef = React.useRef<string | null>(null);

  useEffect(() => {
    const currentSerial = typeof searchResult === "string" ? searchResult : (searchResult?.serialNo || "");

    // If the serial is valid and DIFFERENT from our current session, initialize a new test session
    if (currentSerial && currentSerial !== activeSessionSerial) {
      setActiveSessionSerial(currentSerial);
      setCurrentJigStepIndex(0);
      setJigResults({});
      setJigDecision(null);
      setIsJigConnected(false);
      setStepTimeLeft(null);
      setNgDescription("");
      timerStartedRef.current = null;
      timerDecisionTriggeredRef.current = null;
      stepStartTimeRef.current = Date.now();
      totalProcessStartTimeRef.current = Date.now();
    }
    // If the serial is cleared, reset everything
    else if (!currentSerial && activeSessionSerial) {
      setActiveSessionSerial("");
      setCurrentJigStepIndex(0);
      setJigResults({});
      setJigDecision(null);
      setStepTimeLeft(null);
      setNgDescription("");
      timerStartedRef.current = null;
      timerDecisionTriggeredRef.current = null;
    }
  }, [searchResult, activeSessionSerial]);

  // Handle step-level resets (timer results when moving between steps)
  useEffect(() => {
    if (activeSessionSerial) {
      stepStartTimeRef.current = Date.now();
      if (setIsStickerPrinted) setIsStickerPrinted(false);
      if (setIsVerifiedSticker) setIsVerifiedSticker(false);
      if (setIsAddedToCart) setIsAddedToCart(false);
      if (setIsVerifiedPackaging) setIsVerifiedPackaging(false);
    }
  }, [currentJigStepIndex, activeSessionSerial]);

  // Robust NG Timeout Timer
  useEffect(() => {
    if (testSteps.length === 0 || !activeSessionSerial) return;

    const currentSubStep = testSteps[currentJigStepIndex];
    const isJigStep = currentSubStep?.stepType === "jig";
    const canStartTimer = isJigStep ? isJigConnected : !!activeSessionSerial;
    const currentStepKey = `${activeSessionSerial}-${currentJigStepIndex}`;

    // Condition 1: If we have a finalized decision or no timeout configured, ensure timer is null
    if (jigDecision || isdevicePassed || !currentSubStep?.ngTimeout || currentSubStep.ngTimeout <= 0) {
      setStepTimeLeft(null);
      return;
    }

    // Condition 2: Check if we are ready to count (jig connected if needed)
    if (!canStartTimer) {
      return;
    }

    // Condition 3: Initialize time if this is a new step or it hasn't been started yet
    if (timerStartedRef.current !== currentStepKey) {
      setStepTimeLeft(currentSubStep.ngTimeout);
      timerStartedRef.current = currentStepKey;
      timerDecisionTriggeredRef.current = null;
    }

    // Condition 4: Start the countdown interval
    const timerId = setInterval(() => {
      setStepTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerId);
          // Only trigger NG if we haven't already for this specific step
          if (timerDecisionTriggeredRef.current !== currentStepKey) {
            timerDecisionTriggeredRef.current = currentStepKey;
            handleStepDecision("NG", pendingJigErrorRef.current || "Step timeout reached");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [
    activeSessionSerial,
    currentJigStepIndex,
    testSteps,
    jigDecision,
    isdevicePassed,
    isJigConnected,
  ]);
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

  const handleCloseLooseCarton = async (cartonSerial: string) => {
    try {
      const confirmed = window.confirm("Are you sure you want to close this partial carton?");
      if (!confirmed) return;
      await closeLooseCarton(cartonSerial);
      toast.success("Loose carton closed successfully!");
      setCartons((prev: any[]) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.cartonSerial === cartonSerial) {
          last.status = "full";
          last.isLooseCarton = true;
        }
        return copy;
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to close loose carton");
      console.error(e);
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
    setIsCartonsLoading(true);
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
        const details =
          result.cartonDetails || (Array.isArray(result) ? result : [result]);

        // Filter out cartons that are shifted to FG/Store
        const activeDetails = details.filter((c: any) => {
          const status = String(c.status || "").toLowerCase();
          return (
            !status.includes("store") &&
            !status.includes("fg") &&
            !status.includes("shipped")
          );
        });

        const serials = activeDetails.map((c: any) => c.cartonSerial);

        setCartonSerial(serials);
        setCartonDetails(activeDetails);
      }
      setProcessCartons(result);
    } finally {
      setIsCartonsLoading(false);
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
          c.processId === processData._id &&
          c.devices.length < c.maxCapacity &&
          !c.isLooseCarton &&
          c.status !== "full",
      );

      if (!targetCart) {
        targetCart = {
          cartonSerial: `CARTON-${Date.now()}`,
          processId: processData._id,
          devices: [],
          cartonSize: {
            width: packagingData.packagingData.cartonWidth,
            height: packagingData.packagingData.cartonHeight,
            depth: packagingData.packagingData.cartonDepth,
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
          cartonWidth: packagingData.packagingData.cartonWidth,
          cartonHeight: packagingData.packagingData.cartonHeight,
          cartonDepth: packagingData.packagingData.cartonDepth,
          cartonWeight: packagingData.packagingData.cartonWeight,
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
      const cartonList = Array.isArray(processCartons)
        ? processCartons
        : processCartons?.cartonDetails || [];
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

  const handleNG = (_dept: string | null, description: string) => {
    const desc = String(description || "").trim();
    if (!desc) return;
    const timeTaken = Math.round(
      (Date.now() - stepStartTimeRef.current) / 1000,
    );
    const reasonText =
      ngReason || pendingJigErrorState || "Manual failure / Timeout";
    const finalResults = {
      ...jigResults,
      [currentJigStepIndex]: {
        ...(jigResults[currentJigStepIndex] || {}),
        status: "NG",
        reason: reasonText,
        description: desc,
        timeTaken,
      },
    };
    setJigResults(finalResults);
    setJigDecision("NG");
    handleUpdateStatus("NG", selectAssignDeviceDepartment, finalResults, desc);
    setNgDescription("");
    setShowNGModal(false);
  };

  const handleRetry = () => {
    // Reset all test state
    setCurrentJigStepIndex(0);
    setJigResults({});
    setJigDecision(null);
    setNgReason(null);
    setNgDescription("");
    setIsJigConnected(false);
    setStepTimeLeft(null);
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
    setGeneratedCommand("");
    stepStartTimeRef.current = Date.now();

    // Close modal
  };

  const handleRefreshSession = () => {
    // Reset the scanned device
    setSearchQuery("");
    setSearchResult(null);
    setIsPassNGButtonShow(false);
    if (setIsStickerPrinted) setIsStickerPrinted(false);
    if (setIsVerifiedSticker) setIsVerifiedSticker(false);
    if (setIsAddedToCart) setIsAddedToCart(false);
    if (setIsVerifiedPackaging) setIsVerifiedPackaging(false);
    if (setIsDevicePassed) setIsDevicePassed(false);
    // Reset all jig / test state
    setCurrentJigStepIndex(0);
    setJigResults({});
    setJigDecision(null);
    setNgReason(null);
    setIsJigConnected(false);
    setStepTimeLeft(null);
    setShowNGModal(false);
    setNgDescription("");
    pendingJigErrorRef.current = null;
    setPendingJigErrorState(null);
    setGeneratedCommand("");
    setManualFieldValues({});
    setManualErrors({});
    setHasManualValues(false);
    setIsManualValuesModalOpen(false);
    stepStartTimeRef.current = Date.now();
    totalProcessStartTimeRef.current = Date.now();
  };

  const checkProcessCompletion = async () => {
    try {
      if (!processData?._id || !processData?.quantity) return;

      const recordResult = await getDeviceTestRecordsByProcessId(processData._id);
      const allRecords = recordResult.deviceTestRecords || [];

      const uniqueCompletedDevices = new Set();
      allRecords.forEach((r: any) => {
        const rStage = (r.name || r.stageName || "").toLowerCase();
        if (
          (rStage.includes("store") ||
            rStage.includes("fg") ||
            rStage.includes("finish")) &&
          (r.status === "Pass" || r.status === "Completed")
        ) {
          uniqueCompletedDevices.add(r.serialNo);
        }
      });

      if (uniqueCompletedDevices.size >= processData.quantity) {
        const formData = new FormData();
        formData.append("status", "completed");
        await updateMarkAsComplete(formData, processData._id);

        const userDetailsStr = localStorage.getItem("userDetails");
        const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};
        const logData = new FormData();
        logData.append("action", "PROCESS_COMPLETED");
        logData.append("processId", processData._id);
        logData.append("userId", userDetails?._id || "");
        logData.append("description", `${processData?.name || "Process"
          } was automatically marked as completed.`);

        await createProcessLogs(logData);
        toast.success("Process automatically completed!");
      }
    } catch (error) {
      console.error("Error checking process completion:", error);
    }
  };

  const ensureProcessRecords = async () => {
    if (Array.isArray(processTestRecordsRef.current)) {
      return processTestRecordsRef.current;
    }
    if (processTestRecordsPromiseRef.current) {
      return processTestRecordsPromiseRef.current;
    }

    const promise = (async () => {
      const recordResult = await getDeviceTestRecordsByProcessId(processData._id);
      const all = Array.isArray(recordResult?.deviceTestRecords)
        ? recordResult.deviceTestRecords
        : [];
      processTestRecordsRef.current = all;
      return all;
    })();

    processTestRecordsPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      processTestRecordsPromiseRef.current = null;
    }
  };

  const openCartonDeviceHistory = async (serialNo: string) => {
    if (!serialNo) return;

    // Open first so any global "outside click" handlers don't immediately close it
    // due to the same click event that triggered open.
    setCartonDeviceHistorySerial(String(serialNo));
    setCartonDeviceHistoryRows([]);
    setIsCartonDeviceHistoryOpen(true);

    if (!processData?._id) return;

    setIsCartonDeviceHistoryLoading(true);
    try {
      // Yield one frame so the modal paints immediately, even if the request/processing is heavy.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const allRecords = await ensureProcessRecords();
      const targetSerial = String(serialNo);

      // Fast filter without mapping the full array first.
      const rows: any[] = [];
      for (const r of allRecords) {
        if (String(r?.serialNo || "") !== targetSerial) continue;
        rows.push({
          _id: r?._id,
          serialNo: r?.serialNo,
          stageName: r?.stageName || r?.name || "N/A",
          status: r?.status || "N/A",
          assignedDeviceTo: r?.assignedDeviceTo || r?.assignedDeviceToDepartment || "",
          operator: r?.operatorName || r?.operator || r?.operatorId || "",
          createdAt: r?.createdAt || r?.updatedAt,
          logs: Array.isArray(r?.logs) ? r.logs : [],
        });
      }

      rows.sort((a: any, b: any) => {
        const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      });

      setCartonDeviceHistoryRows(rows);
    } catch (e: any) {
      toast.error(e?.message || "Unable to load device history");
    } finally {
      setIsCartonDeviceHistoryLoading(false);
    }
  };

  const openStageLogs = async (stageName: string, stageHistories: any[] = []) => {
    const targetSerial =
      typeof searchResult === "string"
        ? searchResult
        : searchResult?.serialNo || "";

    if (!targetSerial || !stageName || !processData?._id) return;

    setSelectedLogs([]);
    setSelectedLogsTitle(`${stageName} Logs`);
    setIsLogsModalOpen(true);

    try {
      let stageRecords = Array.isArray(stageHistories) ? [...stageHistories] : [];

      if (stageRecords.length === 0) {
        const normalizedStage = String(stageName).trim().toLowerCase();

        stageRecords = visibleDeviceHistory.filter((record: any) => {
          const recordSerial = String(record?.serialNo || "").trim();
          const recordStage = String(
            record?.stageName || record?.name || "",
          )
            .trim()
            .toLowerCase();

          return (
            recordSerial === String(targetSerial).trim() &&
            recordStage === normalizedStage
          );
        });
      }

      const normalizedRecords = stageRecords
        .sort((a: any, b: any) => {
          const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bt - at;
        });

      const stageLogs = normalizedRecords.flatMap((record: any) => {
        if (!Array.isArray(record?.logs) || record.logs.length === 0) {
          return [
            {
              stepName: record?.stageName || record?.name || stageName,
              status: record?.status || "N/A",
              createdAt:
                record?.createdAt ||
                record?.updatedAt ||
                new Date().toISOString(),
              logData: {
                terminalLogs: Array.isArray(record?.logData?.terminalLogs)
                  ? record.logData.terminalLogs
                  : [],
                reason: record?.logData?.reason || record?.reason,
                description:
                  record?.logData?.description || record?.ngDescription || "",
              },
            },
          ];
        }

        return record.logs.map((logGroup: any) => ({
          ...logGroup,
          stepName:
            logGroup?.stepName ||
            record?.stageName ||
            record?.name ||
            stageName,
          status: logGroup?.status || record?.status || "N/A",
          createdAt:
            logGroup?.createdAt ||
            record?.createdAt ||
            record?.updatedAt ||
            new Date().toISOString(),
          logData: {
            terminalLogs: Array.isArray(logGroup?.logData?.terminalLogs)
              ? logGroup.logData.terminalLogs
              : [],
            parsedData: logGroup?.logData?.parsedData,
            reason:
              logGroup?.logData?.reason ||
              record?.logData?.reason ||
              record?.reason,
            description:
              logGroup?.logData?.description ||
              record?.logData?.description ||
              record?.ngDescription ||
              "",
            timeTaken: logGroup?.logData?.timeTaken,
          },
        }));
      });

      setSelectedLogs(stageLogs);
    } catch (error: any) {
      setSelectedLogs([]);
      toast.error(error?.message || "Unable to load stage logs");
    }
  };

  const downloadSelectedLogs = () => {
    if (!Array.isArray(selectedLogs) || selectedLogs.length === 0) return;

    const safeTime = (value: any) => {
      if (!value) return "N/A";
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? String(value) : new Date(value).toLocaleString();
    };

    const content = selectedLogs
      .map((logGroup: any, index: number) => {
        const header = [
          `Step: ${logGroup?.stepName || `Step ${index + 1}`}`,
          `Status: ${logGroup?.status || "N/A"}`,
          `Created At: ${safeTime(logGroup?.createdAt)}`,
          logGroup?.logData?.reason
            ? `Reason: ${logGroup.logData.reason}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");

        const terminalLogs = Array.isArray(logGroup?.logData?.terminalLogs)
          ? logGroup.logData.terminalLogs
              .map((log: any) => {
                const timestamp =
                  log?.displayTimestamp || safeTime(log?.timestamp);
                const type = log?.type || "log";
                const message = log?.message || "";
                return `[${timestamp}] [${type}] ${message}`;
              })
              .join("\n")
          : "No terminal logs available for this step.";

        return `${header}\n\n${terminalLogs}`;
      })
      .join("\n\n----------------------------------------\n\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedLogsTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "logs"}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatHistoryLogTime = (log: any) => {
    if (log?.displayTimestamp) return log.displayTimestamp;
    const raw = log?.timestamp;
    if (!raw) return "N/A";
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return String(raw);
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
        await checkProcessCompletion();
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
        await checkProcessCompletion();
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
    currentStageName: string,
  ) => {
    if (!Array.isArray(deviceTestHistory) || deviceTestHistory.length === 0) {
      return true;
    }

    const lastEntry = deviceTestHistory[deviceTestHistory.length - 1];

    return !(
      lastEntry.stageName === currentStageName && lastEntry.status === "NG"
    );
  };

  const lastHistoryEntry =
    Array.isArray(visibleDeviceHistory) && visibleDeviceHistory.length > 0
      ? visibleDeviceHistory[visibleDeviceHistory.length - 1]
      : null;

  const hasQCResolved =
    Array.isArray(visibleDeviceHistory) &&
    visibleDeviceHistory.some((h: any) => {
      const s = (h?.status || "").toString().toLowerCase();
      return s.includes("resolved");
    });
  const isAssignedToQCorTRC =
    lastHistoryEntry?.assignedDeviceTo === "QC" ||
    lastHistoryEntry?.assignedDeviceTo === "TRC";
  const shouldHideJigInterface =
    !hasQCResolved && lastHistoryEntry?.status === "NG" && isAssignedToQCorTRC;

  return (
    <>
      {/* SOP Section
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300">
        <button
          onClick={() => setIsSopOpen(!isSopOpen)}
          className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">
              Standard Operating Procedure (SOP)
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
              Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400">
              {isSopOpen ? "Collapse" : "Expand"}
            </span>
            {isSopOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>

        {isSopOpen && (
          <div className="animate-in slide-in-from-top-2 border-t border-gray-50 px-5 pb-5 pt-2 duration-300">
            {product?.sopFile ? (
              <div className="space-y-3">
                {product?.sopFile.endsWith(".pdf") ? (
                  <iframe
                    src={product?.sopFile}
                    className="h-[500px] w-full rounded-lg border shadow-inner"
                    title="SOP PDF Preview"
                  />
                ) : product?.sopFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <div className="group relative">
                    <Image
                      src={product?.sopFile}
                      alt="SOP Preview"
                      width={800}
                      height={600}
                      className="max-h-[500px] w-full rounded-lg bg-gray-50 object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8">
                    <a
                      href={product?.sopFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-blue-800"
                    >
                      <BookOpenCheck className="h-5 w-5" />
                      Open SOP Reference
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-xs italic text-gray-400">
                <FileText className="h-8 w-8 opacity-20" />
                No SOP content found for this product.
              </div>
            )}
          </div>
        )}
      </div>
      */}

      {/* Devices Section */}
      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight text-gray-800">
                Device Testing
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                  <Timer className="h-3 w-3" />
                  ELAPSED: <span className="text-gray-900">{timerDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded border border-yellow-100 bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-600">
                  <Zap className="h-3 w-3" />
                  ACTIVE:{" "}
                  <span className="text-yellow-700">{deviceDisplay}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {processAssignUserStage?.subSteps?.some(
              (s: any) => s.isPackagingStatus && !s?.disabled,
            ) && (
                <button
                  onClick={() => setIsCartonPopupOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-emerald-700 active:scale-95"
                >
                  <ScanLine className="h-4 w-4" />
                  Verify & Move Cartons
                </button>
              )}
            <button
              onClick={handleRefreshSession}
              title="Refresh – clear current device and restart all operations"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 transition-all hover:border-orange-300 hover:bg-orange-100 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-indigo-700 active:scale-95"
            >
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Device Search Box */}
          <div
            className={`${isPaused && "blur-sm"
              } rounded-xl border border-gray-200 bg-white p-4 shadow-sm`}
          >
            {isCommon ? (
              <div className="flex flex-col space-y-8">
                {/* 1. Dashboard Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-blue-200/50 transform transition-all hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                      <Box className="h-6 w-6 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Cartons</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{(Array.isArray(processCartons) ? processCartons.length : processCartons?.cartonDetails?.length) || 0}</div>
                    <div className="text-[10px] font-medium opacity-80">Pending in stage</div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-green-200/50 transform transition-all hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                      <Cpu className="h-6 w-6 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Single Units</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{deviceList.filter(d => !cartonDetails.some(c => c.devices?.some((cd: any) => cd.serialNo === d.serialNo))).length}</div>
                    <div className="text-[10px] font-medium opacity-80">Not in cartons</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-purple-200/50 transform transition-all hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                      <ClipboardCheck className="h-6 w-6 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Assets</span>
                    </div>
                    <div className="text-3xl font-black mb-1">
                      {(() => {
                        const verifiedCartons = (cartonDetails || []).filter((c: any) => c.isStickerVerified).length;
                        return verifiedCartons;
                      })()}
                    </div>
                    <div className="text-[10px] font-medium opacity-80">Ready for next stage</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-orange-200/50 transform transition-all hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="h-6 w-6 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Today's Output</span>
                    </div>
                    <div className="text-3xl font-black mb-1">{checkedDevice.length}</div>
                    <div className="text-[10px] font-medium opacity-80">Devices processed</div>
                  </div>
                </div>

                {/* 2. Unified Search Area */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        <Search className="h-4 w-4" />
                        <span className="truncate">Scan Carton Serial or Device IMEI</span>
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-400">
                        Scan or type, then press Enter to search.
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:shrink-0">
                      <button
                        type="button"
                        className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition inline-flex items-center gap-2"
                      >
                        <ScanLine className="h-4 w-4 text-slate-500" />
                        Auto-Scan
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="relative">
                      <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <input
                        type="text"
                        placeholder="Scan or type..."
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = e.currentTarget.value.trim();
                            // First check cartons
                            const matchedCarton = (cartonSerial || []).find((c) => c === val);
                            if (matchedCarton) {
                              handleSearchCarton(val);
                              setSearchResult(""); // Clear device
                              e.currentTarget.value = "";
                              return;
                            }
                            // Then check devices
                            const matchedDevice = deviceList.find(
                              (d) => d.serialNo === val || d.imeiNo === val,
                            );
                            if (matchedDevice) {
                              setSearchResult(matchedDevice.serialNo);
                              setSelectedCarton(null); // Clear carton
                              if (matchedDevice?._id) {
                                getDeviceById(matchedDevice._id);
                              }
                              registerAttempt(
                                String(matchedDevice?.serialNo || ""),
                                String(matchedDevice?._id || ""),
                              );
                              e.currentTarget.value = "";
                              return;
                            }
                            toast.warning("Item not found in this stage");
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Access */}
                  {(cartonSerial || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                        Quick Access:
                      </span>
                      {(cartonSerial || []).slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleSearchCarton(c)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:scale-[0.99] transition"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Detailed Results Section */}
                <div className="relative">
                  {/* IF CARTON SELECTED */}
                  {selectedCarton && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 lg:gap-8">
                      {/* Left: Carton Identity Card */}
                      <div className="space-y-6 lg:sticky lg:top-6 self-start">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <span className="shrink-0 h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                  <Box className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                                    Carton Identity
                                  </div>
                                  <div className="mt-1 text-[18px] sm:text-[20px] font-extrabold text-slate-900 break-words leading-snug">
                                    {selectedCarton}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={
                                  "shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] " +
                                  (isSelectedCartonVerified
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100")
                                }
                              >
                                {isSelectedCartonVerified ? "Verified" : "Pending"}
                              </span>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Devices</div>
                                <div className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                                  {cartonDevices.length}
                                  <span className="ml-1 text-xs font-bold text-slate-500">pcs</span>
                                </div>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Stage</div>
                                <div className="mt-1 text-base font-extrabold text-slate-900 truncate">
                                  {String(assignUserStage?.stage || "N/A")}
                                </div>
                              </div>
                            </div>

                          </div>

                          <div className="px-5 sm:px-6 py-5 border-t border-slate-100 bg-slate-50/40">
                            <div className="space-y-3">
                              {isPDIStage || isFGToStoreStage ? (
                                !generatedCartonSticker[selectedCarton] ? (
                                  <button
                                    onClick={() =>
                                      setGeneratedCartonSticker((prev) => ({
                                        ...prev,
                                        [selectedCarton]: true,
                                      }))
                                    }
                                    className="w-full h-12 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.18em] shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition"
                                  >
                                    Generate Sticker
                                  </button>
                                ) : (
                                  <div className="space-y-4">
                                    <div
                                      id={`carton-sticker-print-${selectedCarton}`}
                                      aria-hidden="true"
                                      style={{
                                        position: "fixed",
                                        left: "-10000px",
                                        top: "-10000px",
                                        width: `${cartonStickerMm.w}mm`,
                                        height: `${cartonStickerMm.h}mm`,
                                        overflow: "hidden",
                                        pointerEvents: "none",
                                        background: "#fff",
                                      }}
                                    >
                                      <div
                                        data-sticker-width={cartonStickerPx.w}
                                        data-sticker-height={cartonStickerPx.h}
                                        data-sticker-mm-width={cartonStickerMm.w}
                                        data-sticker-mm-height={cartonStickerMm.h}
                                        className="actual-sticker-container"
                                        style={{
                                          width: `${cartonStickerMm.w}mm`,
                                          height: `${cartonStickerMm.h}mm`,
                                          background: "#fff",
                                          boxSizing: "border-box",
                                          // Physical borders in mm to avoid DPI-dependent px scaling.
                                          border: "0.6mm solid #000",
                                          padding: "0.5mm",
                                          fontFamily: "Arial, sans-serif",
                                          color: "#000",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            border: "0.3mm solid #000",
                                            boxSizing: "border-box",
                                            display: "grid",
                                            // Strict 80x40mm layout: header + body in mm.
                                            gridTemplateRows: "6mm 1fr",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {/* Header */}
                                          <div
                                            style={{
                                              borderBottom: "0.3mm solid #000",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontWeight: 900,
                                              // mm-only font sizing for physical print stability
                                              fontSize: "5mm",
                                              lineHeight: 1,
                                              textTransform: "uppercase",
                                              padding: "0 2mm",
                                              boxSizing: "border-box",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {String(cartonLabelData?.modelName || "N/A").toUpperCase()}
                                          </div>

                                          {/* Body */}
                                          <div
                                            style={{
                                              display: "grid",
                                              gridTemplateColumns: "55% 45%",
                                              height: "100%",
                                            }}
                                          >
                                            {/* Left table */}
                                            <div
                                              style={{
                                                display: "grid",
                                                gridTemplateRows: "repeat(4, 1fr)",
                                                borderRight: "0.3mm solid #000",
                                              }}
                                            >
                                              {(() => {
                                                const qty = `${Number(cartonLabelData?.deviceCount ?? 0) || 0} PCS`;
                                                let weight = String(cartonLabelData?.weightCarton ?? "").trim();
                                                if (!weight) weight = "N/A";
                                                if (weight !== "N/A" && !/kg/i.test(weight)) weight = `${weight} KG`;

                                                const rows: Array<[string, string]> = [
                                                  ["MODEL:", String(cartonLabelData?.modelName || "N/A")],
                                                  ["DIMENSIONS:", String(cartonLabelData?.dimensionsCm || "N/A")],
                                                  ["QUANTITY:", qty],
                                                  ["WEIGHT:", weight],
                                                ];

                                                return rows.map(([label, value], idx) => (
                                                  <div
                                                    key={idx}
                                                    style={{
                                                      borderBottom:
                                                        idx === rows.length - 1
                                                          ? "none"
                                                          : "0.3mm solid #000",
                                                      padding: "0.5mm 0.9mm 0.3mm",
                                                      boxSizing: "border-box",
                                                      display: "flex",
                                                      flexDirection: "column",
                                                      justifyContent: "center",
                                                      minHeight: 0,
                                                      overflow: "hidden",
                                                    }}
                                                  >
                                                    <div
                                                      style={{
                                                        fontSize: "2.1mm",
                                                        fontWeight: 900,
                                                        lineHeight: 1,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                      }}
                                                    >
                                                      {label}
                                                    </div>
                                                    <div
                                                      style={{
                                                        marginTop: "0.3mm",
                                                        fontSize: "3.3mm",
                                                        fontWeight: 900,
                                                        lineHeight: 1,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                      }}
                                                    >
                                                      {String(value || "N/A").toUpperCase()}
                                                    </div>
                                                  </div>
                                                ));
                                              })()}
                                            </div>

                                            {/* Right QR */}
                                            <div
                                              style={{
                                                display: "grid",
                                                gridTemplateRows: "4.5mm 1fr 4.5mm",
                                                padding: "0.8mm 1mm 0.6mm",
                                                boxSizing: "border-box",
                                                alignItems: "center",
                                                minHeight: 0,
                                                overflow: "hidden",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize: "2.2mm",
                                                  fontWeight: 900,
                                                  lineHeight: 1,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                MCQ SERIAL:
                                              </div>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  minHeight: 0,
                                                  overflow: "hidden",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    maxWidth: "22mm",
                                                    maxHeight: "22mm",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    overflow: "hidden",
                                                  }}
                                                >
                                                  <QRCodeSVG
                                                    value={String(cartonLabelData?.cartonSerial || selectedCarton)}
                                                    level="M"
                                                    marginSize={1}
                                                    bgColor="#ffffff"
                                                    fgColor="#000000"
                                                    // Render large internally; size is controlled by the mm box above.
                                                    size={512}
                                                    style={{ width: "100%", height: "100%", display: "block" }}
                                                  />
                                                </div>
                                              </div>
                                              <div
                                                style={{
                                                  textAlign: "left",
                                                  fontSize: "2.2mm",
                                                  fontWeight: 900,
                                                  lineHeight: 1,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                {String(
                                                  cartonLabelData?.cartonSerial ||
                                                  "N/A",
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <button
                                        onClick={() =>
                                          handlePrintCartonSticker(
                                            `carton-sticker-print-${selectedCarton}`,
                                          )
                                        }
                                        className="h-11 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.18em] hover:bg-slate-800 active:scale-[0.99] transition flex items-center justify-center gap-2"
                                      >
                                        <Printer className="h-4 w-4" /> Print
                                      </button>
                                      <button
                                        onClick={() => setIsVerifyCartonModal(true)}
                                        className="h-11 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.18em] hover:bg-indigo-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
                                      >
                                        <ClipboardCheck className="h-4 w-4" /> Verify
                                      </button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="space-y-4">
                                  {!qrCartons[selectedCarton] ? (
                                    <button
                                      onClick={() =>
                                        handleCommonGenerateQRCode(selectedCarton)
                                      }
                                      className="w-full h-12 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.18em] shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition"
                                    >
                                      Generate QR Label
                                    </button>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="flex justify-center p-6 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                                        <SVG
                                          text={selectedCarton}
                                          options={{
                                            errorCorrectionLevel: "M",
                                            margin: 2,
                                            width: 140,
                                            color: {
                                              dark: "#0f172a",
                                              light: "#ffffff",
                                            },
                                          }}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <button
                                          onClick={handlePrint}
                                          className="h-11 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.18em] hover:bg-slate-800 active:scale-[0.99] transition flex items-center justify-center gap-2"
                                        >
                                          <Printer className="h-4 w-4" /> Print
                                        </button>
                                        <button
                                          onClick={() => setIsVerifyCartonModal(true)}
                                          className="h-11 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.18em] hover:bg-indigo-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
                                        >
                                          <ClipboardCheck className="h-4 w-4" /> Verify
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Device Content Table */}
                      <div className="flex flex-col min-w-0">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
                              <List className="h-6 w-6 text-indigo-500" />
                              Carton Contents
                            </h3>
                            <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-[0.14em] whitespace-nowrap">
                              {cartonDevices.length} Units Manifested
                            </div>
                          </div>

                          <div className="flex-1 overflow-auto">
                            <table className="min-w-[640px] w-full text-left">
                              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
                                <tr className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                                  <th className="px-5 sm:px-6 py-3">Serial No</th>
                                  <th className="px-4 sm:px-5 py-3">Identity (Model/IMEI)</th>
                                  <th className="px-4 sm:px-5 py-3">Stage Status</th>
                                  <th className="px-4 sm:px-5 py-3 text-center">History</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cartonDevices.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                                      No devices found in this carton.
                                    </td>
                                  </tr>
                                ) : (
                                  cartonDevices.map((device: any) => (
                                    <tr
                                      key={device._id}
                                      className="hover:bg-slate-50/70 transition-colors"
                                    >
                                      <td className="px-5 sm:px-6 py-3">
                                        <span className="text-sm font-semibold text-slate-900">
                                          {device.serialNo}
                                        </span>
                                      </td>
                                      <td className="px-4 sm:px-5 py-3">
                                        <div className="flex flex-col">
                                          <span className="text-xs font-semibold text-slate-800 leading-snug">
                                            {getDeviceModelText(device)}
                                          </span>
                                          <span className="text-[11px] font-mono text-slate-400 tracking-tight">
                                            {getDeviceImeiText(device)}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 sm:px-5 py-3">
                                        <span
                                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${device.status === "Pass"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : device.status === "NG"
                                                ? "bg-rose-100 text-rose-700"
                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                          {device.status || "Pending"}
                                        </span>
                                      </td>
                                      <td className="px-4 sm:px-5 py-3 text-center">
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openCartonDeviceHistory(device?.serialNo);
                                          }}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition"
                                          aria-label={`History for ${device?.serialNo || "device"}`}
                                          title="View history"
                                        >
                                          <History className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-end gap-3">
                            {assignUserStage?.stage === "FG to Store" && (
                              <button
                                onClick={() => handleKeepInStore(selectedCarton)}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                              >
                                <Box className="h-4 w-4" /> Keep In Store
                              </button>
                            )}
                            <button
                              onClick={() => handleShiftToNextStage(selectedCarton)}
                              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                              <ArrowRightCircle className="h-4 w-4" /> Shift to Next Stage
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IF SINGLE DEVICE SELECTED */}
                  {searchResult && !selectedCarton && (
                    <div className="animate-in slide-in-from-bottom-6 duration-500 max-w-4xl mx-auto">
                      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 sm:px-10 py-6 sm:py-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                              <Cpu className="h-8 w-8 text-indigo-300" />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Target Device</h4>
                              <h2 className="text-2xl sm:text-3xl font-black break-all">{searchResult}</h2>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Active Asset</span>
                            </div>
                            <div className="mt-2 rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-100">
                              Attempts: {attemptCounts[getAttemptKey(String(searchResult || ""))] ?? 0}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                          <div className="space-y-8">
                            <div>
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Core Specifications</h5>
                              <div className="space-y-4">
                                <div className="flex justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">Model Name</span>
                                  <span className="text-sm font-black text-slate-800">{product?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">IMEI Primary</span>
                                  <span className="text-sm font-mono font-black text-indigo-600">{deviceHistory[0]?.deviceInfo?.imeiNo || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">Process State</span>
                                  <span className="text-sm font-black text-slate-800">{assignedTaskDetails?.stageName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                              <button
                                onClick={() => handleUpdateStatus("Pass")}
                                className="flex-1 py-4 sm:py-5 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="h-5 w-5" /> Pass & Verify
                              </button>
                              <button
                                onClick={() => {
                                  setNgDescription("");
                                  setShowNGModal(true);
                                }}
                                className="flex-1 py-4 sm:py-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 font-black text-sm uppercase tracking-widest hover:border-rose-500 hover:text-rose-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                              >
                                <XCircle className="h-5 w-5" /> Reject NG
                              </button>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Visual Manifest</h5>
                            <div className="aspect-square rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300">
                              <Package className="h-20 w-20 opacity-20" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Image preview not available</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <button
                            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-2"
                            onClick={handleRefreshSession}
                          >
                            <RotateCcw className="h-4 w-4" /> Reset Asset
                          </button>
                          <button
                            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            onClick={() => updateStageBySerialNo(searchResult, assignedTaskDetails?.processId)}
                          >
                            <ArrowRightCircle className="h-4 w-4" /> Move to Next Stage
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NO ITEM SELECTED - DASHBOARD VIEW */}
                  {!selectedCarton && !searchResult && (
                    <div className="animate-in fade-in duration-700">
                      <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-6 sm:p-10 lg:p-20 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 animate-pulse">
                          <ScanLine className="h-12 w-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Ready to Process</h3>
                        <p className="text-slate-400 text-sm max-w-sm">Scan a carton serial or a device identification number to begin processing items in this stage.</p>

                        <div className="mt-12 w-full max-w-2xl">
                          <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Items Pending This Stage</span>
                            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">View All</button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {cartonDetails.slice(0, 3).map((c: any) => (
                              <div key={c._id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all cursor-pointer group" onClick={() => handleSearchCarton(c.cartonSerial)}>
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <Box className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
                                  </div>
                                  <div className="text-left">
                                    <span className="block text-xs font-black text-slate-800">{c.cartonSerial}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{c.devices.length} Devices Manifested</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase text-slate-500 tracking-tighter">Pending</span>
                                  <ArrowRightCircle className="h-5 w-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                                </div>
                              </div>
                            ))}
                            {cartonDetails.length === 0 && (
                              <div className="p-10 text-center italic text-slate-400 text-xs">No pending items found in this stage.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {(() => {
                  const stageData = Array.isArray(processAssignUserStage)
                    ? processAssignUserStage[0]
                    : processAssignUserStage;
                  const currentStageName =
                    stageData?.stageName || stageData?.name || "";
                  const productStageData = product?.stages?.find(
                    (s: any) => s.stageName === currentStageName,
                  );

                  const searchType =
                    stageData?.searchType || productStageData?.searchType;
                  const jigStageFields =
                    stageData?.jigStageFields?.length > 0
                      ? stageData.jigStageFields
                      : productStageData?.jigStageFields || [];

                  if (searchType === "Through Jig Stages") {
                    return !searchResult ? (
                      <JigIdentificationSection
                        jigStageFields={jigStageFields}
                        onIdentify={handleJigIdentification}
                        isSearching={isJigSearching}
                        error={jigSearchError}
                      />
                    ) : null;
                  }

                  return (
                    <>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Search className="h-4 w-4 text-gray-500" />
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
                        onDeviceSelected={(device: any) =>
                          registerAttempt(
                            String(device?.serialNo || ""),
                            String(device?._id || "")
                          )
                        }
                        setIsPassNGButtonShow={setIsPassNGButtonShow}
                        setIsStickerPrinted={setIsStickerPrinted}
                        setIsVerifiedSticker={setIsVerifiedSticker}
                        checkIsPrintEnable={processAssignUserStage?.subSteps?.some(
                          (s: any) => s.isPrinterEnable && !s?.disabled,
                        )}
                        setIsDevicePassed={setIsDevicePassed}
                      />
                      {searchResult && (
                        <div className="mt-2 text-xs font-semibold text-indigo-600">
                          Attempts: {attemptCounts[getAttemptKey(String(searchResult || ""))] ?? 0}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* Verify Carton Modal */}
          <Modal
            isOpen={isVerifyCartonModal}
            onClose={() => setIsVerifyCartonModal(false)}
            title="Verify Carton Sticker"
            submitOption={false}
            onSubmit={() => { }}
          >
            <div className="space-y-6 p-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-blue-50 p-4 text-blue-600">
                  <ScanLine className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Scan Carton Label
                  </h4>
                  <p className="text-sm text-gray-500">
                    Please scan the carton serial from the printed label to verify.
                  </p>
                </div>
              </div>

              <input
                autoFocus
                placeholder="Scan Carton Serial..."
                className="font-mono placeholder:font-sans w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-center text-lg outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerifyCarton(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <div className="text-center">
                <span className="text-xs font-medium text-gray-400">
                  Verified cartons can be processed for shipping or PDI.
                </span>
              </div>
            </div>
          </Modal>

          {/* Device Result */}
          {searchResult && (
            <div className="mt-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-sm font-bold text-gray-800">
                    {searchResult}
                  </h3>
                  {visibleDeviceHistory.length > 0 && (
                    <button
                      onClick={() => setIsPreviousStagesModalOpen(true)}
                      className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                      <ListChecks className="h-3 w-3" />
                      View Previous Stages
                    </button>
                  )}
                </div>

                {/* Enhanced Stage Progress Badges */}
                <div className="no-scrollbar flex flex-nowrap gap-2.5 overflow-x-auto pb-2">
                  {(processData?.stages || []).map(
                    (stage: any, idx: number) => {
                      const stageHistories = visibleDeviceHistory.filter(
                        (h: any) => h.stageName === stage.stageName,
                      );
                      const hasHistory = stageHistories.length > 0;
                      const isPass = stageHistories.some(
                        (h: any) =>
                          h.status === "Pass" || h.status === "Completed",
                      );
                      const isNG =
                        !isPass &&
                        stageHistories.some((h: any) => h.status === "NG");

                      return (
                        <button
                          type="button"
                          key={idx}
                          disabled={!hasHistory}
                          onClick={() => openStageLogs(stage.stageName, stageHistories)}
                          className={`group relative flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isPass
                            ? "border-green-200 bg-green-50/50 text-green-700 shadow-sm hover:shadow-green-100/50"
                            : isNG
                              ? "border-red-200 bg-red-50/50 text-red-700 shadow-sm hover:shadow-red-100/50"
                              : "border-gray-100 bg-gray-50 text-gray-400 opacity-60"
                            } ${hasHistory ? "cursor-pointer hover:-translate-y-0.5" : "cursor-not-allowed"}`}
                        >
                          <div
                            className={`rounded-md p-1 ${isPass ? "bg-green-500/10" : isNG ? "bg-red-500/10" : "bg-gray-500/10"}`}
                          >
                            {isPass ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : isNG ? (
                              <XCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <Circle className="h-3 w-3 text-gray-300" />
                            )}
                          </div>
                          <span>{stage.stageName}</span>
                          {isPass && (
                            <div className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full border-2 border-white bg-green-500" />
                          )}
                        </button>
                      );
                    },
                  )}
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
                    <div className="mb-4 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Device History for {searchResult}
                      </span>
                    </div>
                    <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                      {visibleDeviceHistory.map((value, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                        >
                          <div className="overflow-hidden">
                            <span className="block text-xs font-bold text-gray-900">
                              {value?.stageName}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-gray-500">
                              {value?.serialNo}
                            </span>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${value?.status === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {value?.status}
                            </span>
                            {value?.assignedDeviceTo && (
                              <span className="text-[10px] text-gray-400">
                                To: {value?.assignedDeviceTo}
                              </span>
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
                  searchResult &&
                  !isdevicePassed &&
                  !shouldHideJigInterface && (
                    <div className="py-6">
                      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                        <div className="flex flex-col gap-6">
                          {(() => {
                            const currentSubStep =
                              testSteps[currentJigStepIndex];

                            return (
                              <>
                                {currentSubStep && (
                                  <>
                                    {/* PROGRESS BAR */}
                                    <div className="mb-2">
                                      <div className="mb-2 flex justify-between text-sm font-medium text-gray-500">
                                        <span className="flex items-center gap-2">
                                          <ListChecks className="h-4 w-4 text-primary" />
                                          Process Progress
                                        </span>
                                        <span className="font-bold text-gray-700">
                                          {Math.round(
                                            (currentJigStepIndex /
                                              testSteps.length) *
                                            100,
                                          )}
                                          %
                                        </span>
                                      </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                        <div
                                          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                          style={{
                                            width: `${(currentJigStepIndex / testSteps.length) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {packagingDescriptionHtml && (
                                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-slate-500" />
                                            <h5 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">
                                              Packaging Instructions
                                            </h5>
                                          </div>
                                          <p className="mt-1 text-xs font-medium text-slate-500">
                                            Review these checks before adding devices to the carton.
                                          </p>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto px-5 py-4 custom-scrollbar">
                                          <div
                                            className="prose prose-sm max-w-none text-slate-700 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_p]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ul]:my-2 [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:my-1.5"
                                            dangerouslySetInnerHTML={{
                                              __html: packagingDescriptionHtml,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* JIG STEP UI */}
                                    {testSteps.some(
                                      (s: any) => s.stepType === "jig",
                                    ) && (
                                        <div
                                          className={
                                            currentSubStep.stepType === "jig"
                                              ? "space-y-4"
                                              : "hidden"
                                          }
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                                                <Cpu className="h-5 w-5 text-blue-600" />
                                                {currentSubStep.stepName ||
                                                  currentSubStep.name ||
                                                  `Automated Test`}
                                              </h4>
                                              <p className="ml-7 text-sm text-gray-500">
                                                Step {currentJigStepIndex + 1}{" "}
                                                of {testSteps.length}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              {stepTimeLeft !== null && stepTimeLeft > 0 && (
                                                <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 animate-pulse">
                                                  <Timer className="h-4 w-4 text-orange-600" />
                                                  <span className="text-xs font-bold text-orange-700">
                                                    Timeout in {stepTimeLeft}s
                                                  </span>
                                                </div>
                                              )}
                                              <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                                                Automated Jig
                                              </span>
                                            </div>
                                          </div>
                                          <JigSection
                                            key={`jig-${searchResult?.serialNo || searchResult}`}
                                            subStep={currentSubStep}
                                            isLastStep={
                                              currentJigStepIndex ===
                                              testSteps.length - 1
                                            }
                                            onDataReceived={(data: any) => { }}
                                            onDecision={handleStepDecision}
                                            onDisconnect={(fn: () => void) => {
                                              jigDisconnectRef.current = fn;
                                            }}
                                            searchQuery={searchQuery}
                                            onConnectionChange={
                                              setIsJigConnected
                                            }
                                            finalResult={
                                              jigResults[currentJigStepIndex]
                                                ?.status
                                            }
                                            finalReason={
                                              jigResults[currentJigStepIndex]
                                                ?.reason
                                            }
                                            onStatusUpdate={(
                                              status: string,
                                            ) => {
                                              pendingJigErrorRef.current =
                                                status;
                                            }}
                                            generatedCommand={generatedCommand}
                                            setGeneratedCommand={
                                              setGeneratedCommand
                                            }
                                            autoConnect={!!searchResult}
                                          />
                                        </div>
                                      )}

                                    {/* MANUAL STEP UI */}
                                    {currentSubStep.stepType === "manual" &&
                                      !currentSubStep.isPrinterEnable &&
                                      !currentSubStep.isPackagingStatus && (
                                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                          <div className="flex items-start gap-4 border-b border-orange-100 bg-orange-50/50 px-6 py-5">
                                            <div className="shrink-0 rounded-lg bg-orange-100 p-2 text-orange-600 shadow-sm">
                                              <ClipboardCheck className="h-6 w-6" />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-3">
                                                <h5 className="text-lg font-bold text-gray-900">
                                                  Manual Verification
                                                </h5>
                                                <span className="rounded border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                                                  Required
                                                </span>
                                              </div>
                                              {currentSubStep?.description && (
                                                <div
                                                  className="prose prose-sm max-w-none text-gray-700 mt-3 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:my-1"
                                                  dangerouslySetInnerHTML={{
                                                    __html: currentSubStep.description,
                                                  }}
                                                />
                                              )}
                                              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                                Please physically inspect the
                                                device and verify correctly.
                                              </p>
                                            </div>
                                            {stepTimeLeft !== null && (
                                              <div className="ml-auto flex animate-pulse items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-red-600 shadow-sm">
                                                <Timer className="h-4 w-4" />
                                                <span className="text-xs font-black">
                                                  NG IN: {stepTimeLeft}s
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          <div className="p-6">
                                            {(() => {
                                              const fields =
                                                currentSubStep?.jigFields &&
                                                  currentSubStep.jigFields
                                                    .length > 0
                                                  ? currentSubStep.jigFields
                                                  : currentSubStep?.customFields;
                                              const hasFields =
                                                Array.isArray(fields) &&
                                                fields.length > 0;

                                              return (
                                                <>
                                                  {!hasManualValues &&
                                                    hasFields && (
                                                      <div className="flex w-100 justify-end">
                                                        <button
                                                          onClick={() =>
                                                            setIsManualValuesModalOpen(
                                                              true,
                                                            )
                                                          }
                                                          disabled={
                                                            !!jigDecision
                                                          }
                                                          className="flex w-100 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
                                                        >
                                                          <ClipboardList className="h-5 w-5" />
                                                          Add Value
                                                        </button>
                                                      </div>
                                                    )}
                                                  {(!hasFields ||
                                                    hasManualValues) && (
                                                      <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                                        <button
                                                          onClick={
                                                            handleManualPass
                                                          }
                                                          disabled={
                                                            !!jigDecision ||
                                                            (hasFields &&
                                                              fields.some(
                                                                (cf: any) => {
                                                                  const name =
                                                                    cf?.fieldName ||
                                                                    cf?.jigName;
                                                                  const v =
                                                                    manualFieldValues[
                                                                    name ?? ""
                                                                    ] ?? "";
                                                                  return !validateCustomField(
                                                                    cf,
                                                                    v,
                                                                  ).valid;
                                                                },
                                                              ))
                                                          }
                                                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision
                                                            ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none"
                                                            : "bg-success hover:bg-green-600"
                                                            }`}
                                                        >
                                                          <CheckCircle className="h-5 w-5" />
                                                          Confirm & Mark Pass
                                                        </button>
                                                        <button
                                                          onClick={
                                                            handleManualNG
                                                          }
                                                          disabled={
                                                            !!jigDecision
                                                          }
                                                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision
                                                            ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none"
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
                                      onClose={() =>
                                        setIsManualValuesModalOpen(false)
                                      }
                                      onSubmit={handleSubmitManualValues}
                                      title="Add Custom Values"
                                      extraActions={
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await handleManualNGFromModal();
                                          }}
                                          disabled={!!jigDecision || !hasActiveDevice}
                                          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 focus:outline-none active:scale-95 ${jigDecision
                                            ? "bg-gray-300 cursor-not-allowed shadow-none"
                                            : "bg-danger hover:bg-red-600 shadow-red-500/30"
                                            }`}
                                        >
                                          Mark NG
                                        </button>
                                      }
                                    >
                                      <div className="space-y-4">
                                        {/* Modal Header inside content for full control if standard modal header is hidden or simple */}
                                        <div className="text-center">
                                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                            <ClipboardList className="h-5 w-5 text-blue-600" />
                                          </div>
                                          <h3 className="text-lg font-bold text-gray-900">
                                            Enter Manual Values
                                          </h3>
                                          <p className="mt-1 text-sm text-gray-500">
                                            Please provide the required
                                            measurements/values below.
                                          </p>
                                        </div>

                                        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                          {(() => {
                                            const fields =
                                              currentSubStep?.jigFields &&
                                                currentSubStep.jigFields
                                                  .length > 0
                                                ? currentSubStep.jigFields
                                                : currentSubStep?.customFields;
                                            return Array.isArray(fields) &&
                                              fields.length > 0 ? (
                                              fields.map(
                                                (cf: any, idx: number) => {
                                                  const fname =
                                                    cf?.fieldName ||
                                                    cf?.jigName ||
                                                    `Field ${idx + 1}`;
                                                  const vtype =
                                                    cf?.validationType ||
                                                    "value";
                                                  const inputType =
                                                    vtype === "range" ||
                                                      vtype === "length"
                                                      ? "number"
                                                      : "text"; // Keep text for simplicity, validate logically
                                                  const val =
                                                    manualFieldValues[
                                                    fname
                                                    ] ?? "";
                                                  const res =
                                                    validateCustomField(
                                                      cf,
                                                      val,
                                                    );
                                                  const hasError =
                                                    (!res.valid &&
                                                      val.length > 0) ||
                                                    manualErrors[fname];

                                                  const baseCls =
                                                    "w-full rounded-lg border px-4 py-2 text-sm outline-none transition duration-200";
                                                  const normalCls =
                                                    "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
                                                  const errorCls =
                                                    "border-red-300 bg-white text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100";

                                                  return (
                                                    <div
                                                      key={idx}
                                                      className="animate-in fade-in slide-in-from-bottom-2 space-y-1 duration-300"
                                                      style={{
                                                        animationDelay: `${idx * 100}ms`,
                                                      }}
                                                    >
                                                      <label className="flex justify-between text-sm font-semibold text-gray-700">
                                                        <span>
                                                          {fname}{" "}
                                                          <span className="text-red-500">
                                                            *
                                                          </span>
                                                        </span>
                                                        <span className="text-xs font-normal text-gray-400">
                                                          {vtype === "range"
                                                            ? `Range: ${cf?.rangeFrom} - ${cf?.rangeTo}`
                                                            : vtype ===
                                                              "value"
                                                              ? `Exact: ${cf?.value}`
                                                              : "Required"}
                                                        </span>
                                                      </label>

                                                      <div className="relative">
                                                        <input
                                                          type={
                                                            inputType ===
                                                              "number"
                                                              ? "number"
                                                              : "text"
                                                          }
                                                          value={val}
                                                          autoFocus={
                                                            idx === 0
                                                          }
                                                          onChange={(e) => {
                                                            const v =
                                                              e.target.value;
                                                            setManualFieldValues(
                                                              (prev) => ({
                                                                ...prev,
                                                                [fname]: v,
                                                              }),
                                                            );
                                                            const r =
                                                              validateCustomField(
                                                                cf,
                                                                v,
                                                              );
                                                            setManualErrors(
                                                              (prev) => ({
                                                                ...prev,
                                                                [fname]:
                                                                  r.valid
                                                                    ? null
                                                                    : r.message ||
                                                                    "Invalid value",
                                                              }),
                                                            );
                                                          }}
                                                          placeholder={`Enter ${fname}`}
                                                          className={`${baseCls} ${hasError ? errorCls : normalCls}`}
                                                        />
                                                        {val && !hasError && (
                                                          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-green-100 p-1 text-green-700">
                                                            <Check className="h-3 w-3" />
                                                          </div>
                                                        )}
                                                      </div>
                                                      {hasError && (
                                                        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                                                          <AlertTriangle className="h-3 w-3" />
                                                          {manualErrors[
                                                            fname
                                                          ] || res.message}
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                },
                                              )
                                            ) : (
                                              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
                                                No custom fields configured
                                                for this manual step.
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
                                          <div id="printing-stack-section" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                            <div className="mb-6 flex items-center gap-3">
                                              <Printer className="h-6 w-6 text-primary" />
                                              <h3 className="text-xl font-bold text-gray-900">
                                                Printing Stack
                                              </h3>
                                            </div>
                                            <div
                                              id="sticker-preview"
                                              className="space-y-4"
                                            >
                                              {currentSubStep.printerFields?.map(
                                                (field: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    className="mb-4 flex justify-center"
                                                  >
                                                    <StickerGenerator
                                                      stickerData={field}
                                                      deviceData={deviceList.filter(
                                                        (d: any) =>
                                                          String(
                                                            d.serialNo ||
                                                            d.serial_no ||
                                                            "",
                                                          ).trim() ===
                                                          String(
                                                            searchResult ||
                                                            "",
                                                          ).trim(),
                                                      )}
                                                    />
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                            <div className="mt-6 flex justify-center">
                                              <button
                                                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-primary/90 active:scale-95"
                                                onClick={handlePrintSticker}
                                              >
                                                <Printer className="h-5 w-5" />
                                                Print Sticker
                                              </button>
                                            </div>
                                          </div>
                                        ) : !isVerifiedSticker ? (
                                          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                                              <ScanLine className="h-10 w-10 text-green-600" />
                                            </div>
                                            <h3 className="mb-2 text-2xl font-bold text-gray-900">
                                              Verify Sticker
                                            </h3>
                                            <p className="mx-auto mb-8 max-w-xs text-gray-500">
                                              Please scan or enter the serial
                                              number to proceed.
                                            </p>
                                            <button
                                              className="mx-auto flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-green-700 active:scale-95"
                                              onClick={() => {
                                                const types: string[] = [];
                                                try {
                                                  currentSubStep?.printerFields?.forEach((pf: any) => {
                                                    (pf?.fields || []).forEach((f: any) => {
                                                      if (f?.type === "barcode" || f?.type === "qrcode") {
                                                        const s = String(f?.slug || f?.name || "").toLowerCase();
                                                        if (s.includes("serial")) types.push("serial");
                                                        else if (s.includes("imei")) types.push("imei");
                                                        else if (s.includes("ccid")) types.push("ccid");
                                                        else types.push("any");
                                                      }
                                                    });
                                                  });
                                                } catch { }
                                                handleVerifySticker(types);
                                              }}
                                            >
                                              <ScanLine className="h-5 w-5" />
                                              Start Verification
                                            </button>
                                            <Modal
                                              isOpen={isVerifyStickerModal}
                                              submitText={
                                                expectedScanTypes.length > 1 && currentScanStep < expectedScanTypes.length - 1
                                                  ? "Next"
                                                  : "Submit"
                                              }
                                              onSubmit={() => {
                                                if (expectedScanTypes.length > 1) {
                                                  const val = multiScanValues[currentScanStep] || "";
                                                  setSerialNumber(val);
                                                }
                                                handleVerifyStickerModal();
                                              }}
                                              onClose={
                                                closeVerifyStickerModal
                                              }
                                              title="Verify Sticker"
                                            >
                                              <div className="space-y-4">
                                                {expectedScanTypes.length > 1 ? (
                                                  <>
                                                    <div className="text-left text-xs font-semibold text-gray-500">
                                                      Scan {currentScanStep + 1} of {expectedScanTypes.length}
                                                    </div>
                                                    {(() => {
                                                      const t = expectedScanTypes[currentScanStep];
                                                      return (
                                                        <div className="space-y-2">
                                                          <label className="block text-sm font-bold text-gray-700">
                                                            {t ? `Enter / Scan ${t.toUpperCase()}` : "Enter / Scan Code"}
                                                          </label>
                                                          <input
                                                            type="text"
                                                            value={multiScanValues[currentScanStep] || ""}
                                                            autoComplete="off"
                                                            onChange={(e) => {
                                                              const next = [...multiScanValues];
                                                              next[currentScanStep] = e.target.value;
                                                              setMultiScanValues(next);
                                                              setSerialNumber(e.target.value);
                                                            }}
                                                            placeholder={`Scan ${t || "code"}...`}
                                                            className="w-full rounded-xl border-2 border-primary bg-gray-50 px-4 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                                            autoFocus
                                                          />
                                                        </div>
                                                      );
                                                    })()}
                                                  </>
                                                ) : (
                                                  <>
                                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                                      Enter / Scan Code
                                                    </label>
                                                    <input
                                                      type="text"
                                                      value={serialNumber || ""}
                                                      autoComplete="off"
                                                      onChange={(e) =>
                                                        setSerialNumber(
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="Scan QR code..."
                                                      className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                                      autoFocus
                                                    />
                                                  </>
                                                )}
                                                <div className="flex justify-end pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      closeVerifyStickerModal();
                                                      if (setIsStickerPrinted) setIsStickerPrinted(false);
                                                    }}
                                                    className="text-sm font-semibold text-primary hover:underline"
                                                  >
                                                    Reprint Sticker
                                                  </button>
                                                </div>
                                              </div>
                                            </Modal>
                                          </div>
                                        ) : (
                                          <div id="manual-verification-anchor" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                            <div className="flex items-start gap-4 border-b border-orange-100 bg-orange-50/50 px-6 py-5 text-left">
                                              <div className="shrink-0 rounded-lg bg-orange-100 p-2 text-orange-600 shadow-sm">
                                                <ClipboardCheck className="h-6 w-6" />
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-3">
                                                  <h5 className="text-lg font-bold text-gray-900">
                                                    Manual Verification
                                                  </h5>
                                                  <span className="rounded border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                                                    Sticker Verified
                                                  </span>
                                                </div>
                                                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                                  Please physically inspect
                                                  the printed sticker on the
                                                  device.
                                                </p>
                                              </div>
                                            </div>
                                            <div className="p-6">
                                              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                                <button
                                                  onClick={() =>
                                                    handleStepDecision("Pass")
                                                  }
                                                  disabled={!!jigDecision}
                                                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none" : "bg-success hover:bg-green-600"}`}
                                                >
                                                  <CheckCircle className="h-5 w-5" />{" "}
                                                  Confirm Pass
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    handleStepDecision("NG")
                                                  }
                                                  disabled={!!jigDecision}
                                                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none" : "bg-danger hover:bg-red-600"}`}
                                                >
                                                  <XCircle className="h-5 w-5" />{" "}
                                                  Mark NG
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
                                          const isCarton =
                                            currentSubStep.packagingData
                                              ?.packagingType === "Carton";
                                          return (
                                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                                              <div className="mb-4 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                  <Box className="h-6 w-6 text-primary" />
                                                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    {isCarton
                                                      ? " Carton Details"
                                                      : "ðŸ“„ Single Device Sticker"}
                                                  </h3>
                                                </div>
                                                {isCarton && (
                                                  <button
                                                    onClick={() =>
                                                      setIsCartonDevicesModalOpen(
                                                        true,
                                                      )
                                                    }
                                                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
                                                  >
                                                    <List className="h-4 w-4" />
                                                    View Devices (
                                                    {cartons[
                                                      cartons.length - 1
                                                    ]?.devices?.length || 0}
                                                    )
                                                  </button>
                                                )}
                                              </div>
                                              <hr className="mb-4 border-gray-300 dark:border-gray-700" />
                                              {isCarton ? (
                                                <>
                                                  <div className="grid gap-4 text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                                                    <p className="flex items-center gap-2">
                                                      <Package className="h-5 w-5 text-blue-500" />{" "}
                                                      <span className="font-medium">
                                                        Dimensions:
                                                      </span>{" "}
                                                      {
                                                        currentSubStep
                                                          ?.packagingData
                                                          ?.cartonWidth
                                                      }{" "}
                                                      x{" "}
                                                      {
                                                        currentSubStep
                                                          ?.packagingData
                                                          ?.cartonHeight
                                                      }
                                                      {" "}x{" "}
                                                      {
                                                        currentSubStep
                                                          ?.packagingData
                                                          ?.cartonDepth
                                                      }
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                      <Weight className="h-5 w-5 text-green-500" />{" "}
                                                      <span className="font-medium">
                                                        Weight:
                                                      </span>{" "}
                                                      {
                                                        currentSubStep
                                                          ?.packagingData
                                                          ?.cartonWeight
                                                      }{" "}
                                                      kg
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                      <Layers className="h-5 w-5 text-purple-500" />{" "}
                                                      <span className="font-medium">
                                                        Capacity:
                                                      </span>{" "}
                                                      {
                                                        currentSubStep
                                                          ?.packagingData
                                                          ?.maxCapacity
                                                      }
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                      <ClipboardCheck className="h-5 w-5 text-orange-500" />{" "}
                                                      <span className="font-medium">
                                                        Issued:
                                                      </span>{" "}
                                                      {
                                                        processData?.issuedCartons
                                                      }
                                                    </p>
                                                  </div>

                                                  {(() => {
                                                    const activeCarton =
                                                      cartons[
                                                      cartons.length - 1
                                                      ];
                                                    const capacity =
                                                      currentSubStep
                                                        ?.packagingData
                                                        ?.maxCapacity ||
                                                      activeCarton?.maxCapacity ||
                                                      0;
                                                    const isFull =
                                                      activeCarton &&
                                                      (activeCarton.devices?.length >= capacity ||
                                                        activeCarton.isLooseCarton ||
                                                        activeCarton.status === "full");

                                                    if (isFull) {
                                                      const cartonDeviceData =
                                                        [
                                                          {
                                                            serialNo:
                                                              activeCarton.cartonSerial,
                                                            cartonSerial:
                                                              activeCarton.cartonSerial,
                                                            deviceCount:
                                                              activeCarton
                                                                .devices
                                                                ?.length || 0,
                                                            maxCapacity:
                                                              capacity,
                                                            productName:
                                                              product?.name,
                                                            weight:
                                                              activeCarton.weightCarton ||
                                                              currentSubStep
                                                                ?.packagingData
                                                                ?.cartonWeight,
                                                            createdAt:
                                                              activeCarton.createdAt ||
                                                              new Date().toISOString(),
                                                          },
                                                        ];

                                                      return (
                                                        <div
                                                          className={`mt-6 rounded-2xl border-2 border-dashed p-6 transition-all ${isCartonBarcodePrinted ? "border-green-200 bg-green-50/50" : "border-primary/20 bg-primary/5"}`}
                                                        >
                                                          <div className="mb-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                              <Printer
                                                                className={`h-6 w-6 ${isCartonBarcodePrinted ? "text-green-600" : "text-primary"}`}
                                                              />
                                                              <div>
                                                                <h4 className="text-lg font-bold text-gray-900">
                                                                  Carton
                                                                  Sticker
                                                                </h4>
                                                                {isCartonBarcodePrinted && (
                                                                  <span className="text-[10px] font-black uppercase tracking-wider text-green-600">
                                                                    Already
                                                                    Printed
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                            <button
                                                              onClick={
                                                                handlePrintCartonSticker
                                                              }
                                                              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white shadow-lg transition-all active:scale-95 ${isCartonBarcodePrinted ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}`}
                                                            >
                                                              <Printer className="h-5 w-5" />
                                                              {isCartonBarcodePrinted
                                                                ? "Reprint Sticker"
                                                                : "Print Sticker"}
                                                            </button>
                                                          </div>
                                                          <div
                                                            id="carton-sticker-preview"
                                                            className="flex justify-center overflow-hidden rounded-xl border bg-white p-4 shadow-inner"
                                                          >
                                                            <StickerGenerator
                                                              stickerData={
                                                                currentSubStep?.packagingData
                                                              }
                                                              deviceData={
                                                                cartonDeviceData
                                                              }
                                                            />
                                                          </div>
                                                          <p
                                                            className={`mt-3 text-center text-xs font-medium ${isCartonBarcodePrinted ? "text-green-600/60" : "text-primary/60"}`}
                                                          >
                                                            Carton Full
                                                            Capacity (
                                                            {capacity}/
                                                            {capacity})
                                                          </p>
                                                        </div>
                                                      );
                                                    } else if (activeCarton && activeCarton.devices?.length > 0) {
                                                      return (
                                                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                                                          <div>
                                                            <p className="font-bold text-orange-800 flex items-center gap-2">
                                                              <AlertTriangle className="h-4 w-4" />
                                                              Partial Carton ({activeCarton.devices.length}/{capacity})
                                                            </p>
                                                            <p className="text-xs text-orange-600 mt-1">This carton is not full. You can choose to close it early.</p>
                                                          </div>
                                                          <button
                                                            className="mt-3 sm:mt-0 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-orange-700 transition-colors"
                                                            onClick={() => handleCloseLooseCarton(activeCarton.cartonSerial)}
                                                          >
                                                            <Package className="h-4 w-4" />
                                                            Close Loose Carton
                                                          </button>
                                                        </div>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                  {!isAddedToCart ? (
                                                    <div className="mt-6 flex justify-center gap-4">
                                                      <button
                                                        className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow hover:bg-green-700"
                                                        onClick={() =>
                                                          handleAddToCart(
                                                            currentSubStep,
                                                          )
                                                        }
                                                      >
                                                        <PlusCircle className="h-5 w-5" />{" "}
                                                        Add To Cart
                                                      </button>
                                                      <button
                                                        className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-white shadow hover:bg-danger"
                                                        onClick={() =>
                                                          handleStepDecision(
                                                            "NG",
                                                          )
                                                        }
                                                      >
                                                        <XCircle className="h-5 w-5" />{" "}
                                                        NG
                                                      </button>
                                                    </div>
                                                  ) : !isVerifiedPackaging ? (
                                                    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-6">
                                                      <ScanLine className="h-8 w-8 text-blue-600" />
                                                      <p className="text-sm font-bold text-blue-800">
                                                        Please Verify Device
                                                        in Carton
                                                      </p>
                                                      <button
                                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white"
                                                        onClick={
                                                          handleVerifyPackaging
                                                        }
                                                      >
                                                        Start Verification
                                                      </button>
                                                      <Modal
                                                        isOpen={
                                                          isVerifyPackagingModal
                                                        }
                                                        onSubmit={
                                                          handleVerifyPackagingModal
                                                        }
                                                        onClose={
                                                          closeVerifyPackagingModal
                                                        }
                                                        title="Verify Packaging"
                                                      >
                                                        <div className="space-y-4">
                                                          <label className="mb-2 block text-sm font-bold text-gray-700">
                                                            Enter / Scan
                                                            Serial Number
                                                          </label>
                                                          <input
                                                            type="text"
                                                            value={
                                                              serialNumber ||
                                                              ""
                                                            }
                                                            autoComplete="off"
                                                            onChange={(e) =>
                                                              setSerialNumber(
                                                                e.target
                                                                  .value,
                                                              )
                                                            }
                                                            placeholder="Scan device serial..."
                                                            className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                                            autoFocus
                                                          />
                                                        </div>
                                                      </Modal>
                                                    </div>
                                                  ) : (
                                                    <div id="manual-verification-anchor" className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                                      <div className="flex items-start gap-4 border-b border-orange-100 bg-orange-50/50 px-6 py-5 text-left">
                                                        <div className="shrink-0 rounded-lg bg-orange-100 p-2 text-orange-600 shadow-sm">
                                                          <ClipboardCheck className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                          <div className="flex items-center gap-3">
                                                            <h5 className="text-lg font-bold text-gray-900">
                                                              Manual
                                                              Verification
                                                            </h5>
                                                            <span className="rounded border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                                                              Packaging
                                                              Verified
                                                            </span>
                                                          </div>
                                                          <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                                            Please ensure the
                                                            device is
                                                            correctly placed
                                                            in the carton.
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="p-6">
                                                        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                                          <button
                                                            onClick={() =>
                                                              handleStepDecision(
                                                                "Pass",
                                                              )
                                                            }
                                                            disabled={
                                                              !!jigDecision
                                                            }
                                                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none" : "bg-success hover:bg-green-600"}`}
                                                          >
                                                            <CheckCircle className="h-5 w-5" />{" "}
                                                            Confirm Pass
                                                          </button>
                                                          <button
                                                            onClick={() =>
                                                              handleStepDecision(
                                                                "NG",
                                                              )
                                                            }
                                                            disabled={
                                                              !!jigDecision
                                                            }
                                                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none" : "bg-danger hover:bg-red-600"}`}
                                                          >
                                                            <XCircle className="h-5 w-5" />{" "}
                                                            Mark NG
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                <>
                                                  {!isStickerPrinted ? (
                                                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                                      <div className="mb-6 flex items-center gap-3">
                                                        <Printer className="h-6 w-6 text-primary" />
                                                        <h3 className="font-outfit text-xl font-bold text-gray-900">
                                                          Packaging Sticker
                                                        </h3>
                                                      </div>
                                                      <div
                                                        id="sticker-preview"
                                                        className="mb-4 flex justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6"
                                                      >
                                                        <StickerGenerator
                                                          stickerData={
                                                            currentSubStep.packagingData
                                                          }
                                                          deviceData={deviceList.filter(
                                                            (d: any) =>
                                                              d.serialNo ===
                                                              searchResult,
                                                          )}
                                                        />
                                                      </div>
                                                      <div className="mt-6 flex justify-center">
                                                        <button
                                                          className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-primary/90 active:scale-95"
                                                          onClick={
                                                            handlePrintSticker
                                                          }
                                                        >
                                                          <Printer className="h-5 w-5" />
                                                          Print Packaging
                                                          Sticker
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : !isVerifiedSticker ? (
                                                    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                                                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                                                        <ScanLine className="h-10 w-10 text-green-600" />
                                                      </div>
                                                      <h3 className="font-outfit mb-2 text-2xl font-bold text-gray-900">
                                                        Verify Sticker
                                                      </h3>
                                                      <p className="mx-auto mb-8 max-w-xs text-gray-500">
                                                        Please scan or enter
                                                        the serial number for
                                                        verification.
                                                      </p>
                                                      <button
                                                        className="mx-auto flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-green-700 active:scale-95"
                                                        onClick={() => {
                                                          const types: string[] = [];
                                                          try {
                                                            currentSubStep?.printerFields?.forEach((pf: any) => {
                                                              (pf?.fields || []).forEach((f: any) => {
                                                                if (f?.type === "barcode" || f?.type === "qrcode") {
                                                                  const s = String(f?.slug || f?.name || "").toLowerCase();
                                                                  if (s.includes("serial")) types.push("serial");
                                                                  else if (s.includes("imei")) types.push("imei");
                                                                  else if (s.includes("ccid")) types.push("ccid");
                                                                  else types.push("any");
                                                                }
                                                              });
                                                            });
                                                          } catch { }
                                                          handleVerifySticker(types);
                                                        }}
                                                      >
                                                        <ScanLine className="h-5 w-5" />
                                                        Start Verification
                                                      </button>
                                                      <Modal
                                                        isOpen={
                                                          isVerifyStickerModal
                                                        }
                                                        submitText={
                                                          expectedScanTypes.length > 1 && currentScanStep < expectedScanTypes.length - 1
                                                            ? "Next"
                                                            : "Submit"
                                                        }
                                                        onSubmit={
                                                          handleVerifyStickerModal
                                                        }
                                                        onClose={
                                                          closeVerifyStickerModal
                                                        }
                                                        title="Verify Sticker"
                                                      >
                                                        <div className="space-y-4">
                                                          {expectedScanTypes.length > 1 ? (
                                                            <>
                                                              <div className="text-left text-xs font-semibold text-gray-500">
                                                                Scan {currentScanStep + 1} of {expectedScanTypes.length}
                                                              </div>
                                                              {(() => {
                                                                const t = expectedScanTypes[currentScanStep];
                                                                return (
                                                                  <div className="space-y-2">
                                                                    <label className="block text-sm font-bold text-gray-700">
                                                                      {t ? `Enter / Scan ${t.toUpperCase()}` : "Enter / Scan Code"}
                                                                    </label>
                                                                    <input
                                                                      type="text"
                                                                      value={serialNumber || ""}
                                                                      autoComplete="off"
                                                                      onChange={(e) => setSerialNumber(e.target.value)}
                                                                      placeholder={`Scan ${t || "code"}...`}
                                                                      className="w-full rounded-xl border-2 border-primary bg-gray-50 px-4 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                                                      autoFocus
                                                                    />
                                                                  </div>
                                                                );
                                                              })()}
                                                            </>
                                                          ) : (
                                                            <>
                                                              <label className="mb-2 block text-sm font-bold text-gray-700">
                                                                Enter / Scan Code
                                                              </label>
                                                              <input
                                                                type="text"
                                                                value={
                                                                  serialNumber ||
                                                                  ""
                                                                }
                                                                autoComplete="off"
                                                                onChange={(e) =>
                                                                  setSerialNumber(
                                                                    e.target
                                                                      .value,
                                                                  )
                                                                }
                                                                placeholder="Scan QR code..."
                                                                className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                                                autoFocus
                                                              />
                                                            </>
                                                          )}
                                                          <div className="flex justify-end pt-1">
                                                            <button
                                                              type="button"
                                                              onClick={() => {
                                                                closeVerifyStickerModal();
                                                                if (setIsStickerPrinted) setIsStickerPrinted(false);
                                                              }}
                                                              className="text-sm font-semibold text-primary hover:underline"
                                                            >
                                                              Reprint Sticker
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </Modal>
                                                    </div>
                                                  ) : (
                                                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
                                                      <div className="flex items-start gap-4 border-b border-orange-100 bg-orange-50/50 px-6 py-5 text-left">
                                                        <div className="shrink-0 rounded-lg bg-orange-100 p-2 text-orange-600 shadow-sm">
                                                          <ClipboardCheck className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                          <div className="flex items-center gap-3">
                                                            <h5 className="text-lg font-bold text-gray-900">
                                                              Manual
                                                              Verification
                                                            </h5>
                                                            <span className="rounded border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                                                              Sticker Verified
                                                            </span>
                                                          </div>
                                                          <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                                            Please physically
                                                            inspect the
                                                            packaging sticker
                                                            on the device.
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="p-6">
                                                        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                                          <button
                                                            onClick={() =>
                                                              handleStepDecision(
                                                                "Pass",
                                                              )
                                                            }
                                                            disabled={
                                                              !!jigDecision
                                                            }
                                                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none" : "bg-success hover:bg-green-600"}`}
                                                          >
                                                            <CheckCircle className="h-5 w-5" />{" "}
                                                            Confirm Pass
                                                          </button>
                                                          <button
                                                            onClick={() =>
                                                              handleStepDecision(
                                                                "NG",
                                                              )
                                                            }
                                                            disabled={
                                                              !!jigDecision
                                                            }
                                                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${jigDecision ? "cursor-not-allowed bg-gray-400 opacity-50 shadow-none" : "bg-danger hover:bg-red-600"}`}
                                                          >
                                                            <XCircle className="h-5 w-5" />{" "}
                                                            Mark NG
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

                        <div className="space-y-6">
                          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                <ClipboardList className="h-4 w-4 text-gray-500" />
                                Stage Summary
                              </h4>
                            </div>
                            <div
                              className="divide-y divide-gray-100"
                              style={{
                                maxHeight: "601px",
                                overflowY: "auto",
                              }}
                            >
                              {testSteps.map((step: any, index: number) => {
                                const status = jigResults[index]?.status;
                                return (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${status === "Pass"
                                          ? "bg-green-100 text-green-700"
                                          : status === "NG"
                                            ? "bg-red-100 text-red-700"
                                            : index === currentJigStepIndex
                                              ? "animate-pulse bg-blue-100 text-blue-700"
                                              : "bg-gray-100 text-gray-500"
                                          }`}
                                      >
                                        {index + 1}
                                      </div>
                                      <div>
                                        <span
                                          className={`block text-sm font-medium ${index === currentJigStepIndex ? "text-gray-900" : "text-gray-600"}`}
                                        >
                                          {step.stepName ||
                                            step.name ||
                                            (step.isPrinterEnable
                                              ? "Printing"
                                              : step.isPackagingStatus
                                                ? "Packaging"
                                                : `Step ${index + 1}`)}
                                        </span>
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                          {step.stepType ||
                                            (step.isPrinterEnable
                                              ? "printer"
                                              : step.isPackagingStatus
                                                ? "packaging"
                                                : "manual")}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex min-w-[80px] justify-end">
                                      {status === "Pass" && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                          <Check className="h-3 w-3" /> Pass
                                        </span>
                                      )}
                                      {status === "NG" && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                          <XCircle className="h-3 w-3" />{" "}
                                          Failed
                                        </span>
                                      )}
                                      {!status && (
                                        <div className="flex flex-col items-end gap-1">
                                          {index === currentJigStepIndex ? (
                                            <>
                                              <span className="animate-pulse text-xs font-bold text-blue-600">
                                                In Progress
                                              </span>
                                              {stepTimeLeft !== null && (
                                                <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 animate-pulse">
                                                  <Timer className="h-3 w-3" />
                                                  {stepTimeLeft}s
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-xs font-medium text-gray-400">
                                                Pending
                                              </span>
                                              {step.ngTimeout > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                                                  <Timer className="h-3 w-3" />
                                                  {step.ngTimeout}s
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Carton Details (Moved from Recent Activity) */}
                          {(isPDIStage ||
                            processAssignUserStage?.subSteps?.some(
                              (s: any) => s.isPackagingStatus && !s?.disabled,
                            )) && (
                              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 bg-slate-50/60 px-5 sm:px-6 py-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                                        <Box className="h-4 w-4 text-orange-500" />
                                        Carton Details
                                      </h4>
                                    </div>

                                    <button
                                      onClick={() => setIsCartonPopupOpen(true)}
                                      className="shrink-0 inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] font-black uppercase tracking-[0.14em] text-indigo-700 hover:bg-indigo-100 active:scale-[0.99] transition"
                                    >
                                      <ScanLine className="h-4 w-4" />
                                      Verify & Move
                                    </button>
                                  </div>
                                </div>
                                <div className="p-0">
                                  <div className="overflow-auto">
                                    <table className="min-w-[560px] w-full text-left">
                                      <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                        <tr>
                                          <th className="px-5 sm:px-6 py-3">
                                            Serial
                                          </th>
                                          <th className="px-4 sm:px-5 py-3">
                                            Status
                                          </th>
                                          <th className="px-4 sm:px-5 py-3 text-right">
                                            Timestamp
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                      {(() => {
                                        const cartonList = Array.isArray(
                                          processCartons,
                                        )
                                          ? processCartons
                                          : processCartons?.cartonDetails || [];
                                        return cartonList.length > 0 ? (
                                          cartonList.map(
                                            (row: any, rowIndex: number) => (
                                              <tr
                                                key={rowIndex}
                                                className="transition-colors hover:bg-slate-50/70"
                                              >
                                                <td className="px-5 sm:px-6 py-3 text-sm font-semibold text-slate-900">
                                                  {row?.cartonSerial}
                                                </td>
                                                <td className="px-4 sm:px-5 py-3">
                                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-600">
                                                    {String(row?.status || "N/A")}
                                                  </span>
                                                </td>
                                                <td className="px-4 sm:px-5 py-3 text-right">
                                                  <span className="text-[12px] font-mono text-slate-500">
                                                  {new Date(
                                                    row?.createdAt,
                                                  ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                  })}
                                                  </span>
                                                </td>
                                              </tr>
                                            ),
                                          )
                                        ) : (
                                          <tr>
                                            <td
                                              colSpan={3}
                                              className="p-8 text-center text-sm text-slate-400"
                                            >
                                              No cartons found
                                            </td>
                                          </tr>
                                        );
                                      })()}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Next Device Selection */}
                      {jigDecision && (
                        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-6">
                          <h4
                            className={`text-xl font-black ${jigDecision === "Pass" ? "text-green-600" : "text-red-600"}`}
                          >
                            STAGE COMPLETE: {jigDecision}
                          </h4>
                          <button
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl transition-all hover:bg-blue-700 active:scale-95"
                            onClick={() => {
                              if (jigDecision === "NG") {
                                // Open the assignment modal (same behavior as Report Issue NG)
                                setNgDescription("");
                                setShowNGModal(true);
                                return;
                              }
                              if (jigDisconnectRef.current)
                                jigDisconnectRef.current();
                              if (searchResult && setDeviceList) {
                                setDeviceList((prev: any[]) =>
                                  prev.filter(
                                    (d: any) => d.serialNo !== searchResult,
                                  ),
                                );
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
                  ngDescription={ngDescription}
                  setNgDescription={setNgDescription}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          className="flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-primary/20"
          onClick={handlePauseResume}
        >
          <Coffee className="h-4 w-4" />
          {isPaused ? "Resume Work" : "Take Break"}
        </button>
        <button
          className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-danger"
          onClick={handleStop}
        >
          <SquareStop className="h-4 w-4" />
          Stop
        </button>
      </div>

      {/* History Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isHistoryOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`relative h-full w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ${isHistoryOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b bg-gray-50/50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <History className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="h-[calc(100vh-64px)] space-y-6 overflow-y-auto">
            <div className="px-4 pt-4">
              <input
                type="text"
                value={historySerialQuery}
                onChange={(e) => setHistorySerialQuery(e.target.value)}
                placeholder="Search serial number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {/* Tested History List */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <ListChecks className="h-4 w-4 text-indigo-500" />
                  Devices
                </h4>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {checkedDevice.length} Today
                </span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 font-medium uppercase tracking-wider text-gray-500">
                    <tr className="bg-white">
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {checkedDevice.length > 0 ? (
                      checkedDevice
                        .filter((row) => {
                          if (!historySerialQuery.trim()) return true;
                          const serial = String(row?.deviceInfo?.serialNo || "").toLowerCase();
                          return serial.includes(historySerialQuery.trim().toLowerCase());
                        })
                        .map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="transition-colors hover:bg-gray-50/50"
                          >
                            <td className="px-4 py-3">
                              <span className="block font-bold text-gray-900">
                                {row?.deviceInfo?.serialNo}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {row?.stageName}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${row?.status === "Pass"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {row?.status}
                              </span>
                            </td>
                            <td className="font-mono px-4 py-3 text-right italic text-gray-500">
                              {formatHistoryTime(row)}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-10 text-center text-xs text-gray-400"
                        >
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
      </div>
      <Modal
        isOpen={isCartonDevicesModalOpen}
        onClose={() => setIsCartonDevicesModalOpen(false)}
        title="Devices in Current Carton"
        onSubmit={() => { }}
        submitOption={false}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 font-bold text-gray-700">
              <tr>
                <th className="px-4 py-3">Serial No</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cartons &&
                cartons.length > 0 &&
                Array.isArray(cartons[cartons.length - 1]?.devices) ? (
                cartons[cartons.length - 1].devices.map(
                  (device: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {device?.serialNo || device || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="whitespace-nowrap rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                          In Carton
                        </span>
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="p-8 text-center italic text-gray-400"
                  >
                    No devices added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        title={selectedLogsTitle}
        submitOption={false}
        onSubmit={() => { }}
      >
        <div className="rounded-b-xl bg-gray-900 p-4">
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={downloadSelectedLogs}
              disabled={selectedLogs.length === 0}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${selectedLogs.length > 0
                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  : "cursor-not-allowed bg-slate-800/60 text-slate-500"
                }`}
            >
              <FileText className="h-4 w-4" />
              Download History
            </button>
          </div>
          <div className="font-mono max-h-[70vh] overflow-y-auto text-xs">
          {selectedLogs.map((logGroup: any, gIndex: number) => (
            <div key={gIndex} className="mb-6 last:mb-0">
              <div className="mb-2 flex items-center gap-2 border-b border-gray-700 pb-1">
                <span className="font-bold uppercase tracking-widest text-blue-400">
                  {logGroup.stepName}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${logGroup.status === "Pass" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}
                >
                  {logGroup.status}
                </span>
                <span className="ml-auto text-[10px] text-gray-500">
                  {new Date(logGroup.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {logGroup.logData?.terminalLogs?.length > 0 ? (
                <div className="space-y-1">
                  {logGroup.logData.terminalLogs.map(
                    (log: any, lIndex: number) => (
                      <div key={lIndex} className="flex gap-2">
                        <span className="shrink-0 text-gray-600">
                          [
                          {formatHistoryLogTime(log)}
                          ]
                        </span>
                        <span
                          className={`
                        ${log.type === "error"
                              ? "text-red-400"
                              : log.type === "success"
                                ? "text-green-400"
                                : log.type === "info"
                                  ? "text-blue-300"
                                  : "text-gray-300"
                            }
                      `}
                        >
                          {log.message}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="italic text-gray-500">
                  No terminal logs available for this step.
                </div>
              )}

              {logGroup.logData?.reason && (
                <div className="mt-2 rounded border border-red-900/30 bg-red-900/20 p-2 text-red-300">
                  <span className="font-bold">Failure Reason:</span>{" "}
                  {logGroup.logData.reason}
                </div>
              )}
            </div>
          ))}
          {selectedLogs.length === 0 && (
            <div className="py-10 text-center italic text-gray-500">
              No logs found for this record.
            </div>
          )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCartonDeviceHistoryOpen}
        onClose={() => setIsCartonDeviceHistoryOpen(false)}
        title={`Device History - ${cartonDeviceHistorySerial || ""}`}
        submitOption={false}
        onSubmit={() => { }}
      >
        <div className="max-h-[72vh] overflow-hidden">
          {isCartonDeviceHistoryLoading ? (
            <div className="p-10 text-center text-sm font-medium text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="max-h-[64vh] overflow-auto">
                <table className="min-w-[780px] w-full text-left text-sm table-fixed">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
                    <tr className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-5 py-3 w-[36%]">Stage</th>
                      <th className="px-4 py-3 w-[14%]">Status</th>
                      <th className="px-4 py-3 w-[18%]">Assigned To</th>
                      <th className="px-4 py-3 w-[20%]">Created At</th>
                      <th className="px-4 py-3 w-[12%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartonDeviceHistoryRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                          No history found for this device.
                        </td>
                      </tr>
                    ) : (
                      cartonDeviceHistoryRows.map((r: any) => (
                        <tr
                          key={r._id || `${r.stageName}-${r.createdAt}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-900 leading-snug break-words">
                              {r.stageName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${r.status === "Pass" || r.status === "Completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : r.status === "NG"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-slate-600">
                              {r.assignedDeviceTo || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[12px] font-mono text-slate-600">
                              {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={!r.logs || r.logs.length === 0}
                              onClick={() => {
                                setSelectedLogsTitle(
                                  `${r.stageName || "Detailed Step"} Logs`,
                                );
                                setSelectedLogs(r.logs || []);
                                setIsLogsModalOpen(true);
                              }}
                              className={`inline-flex items-center justify-center h-9 px-3 rounded-lg text-xs font-black uppercase tracking-[0.12em] transition ${r.logs && r.logs.length > 0
                                  ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                            >
                              Logs
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <CartonDetailsPopup
        isOpen={isCartonPopupOpen}
        onClose={() => setIsCartonPopupOpen(false)}
        cartons={
          Array.isArray(processCartons)
            ? processCartons
            : processCartons?.cartonDetails || []
        }
        processData={processData}
        product={product}
        assignUserStage={assignUserStage}
        onUpdate={() => {
          fetchExistingCartonsByProcessID();
          fetchProcessCartons();
        }}
        isLoading={isCartonsLoading}
      />
    </>
  );
}

