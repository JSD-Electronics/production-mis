"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import BasicInformation from "./BasicInformation";
import DeviceTestComponent from "./DeviceTestComponent";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQRCode } from "next-qrcode";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { printStickerElements } from "@/lib/sticker/printSticker";
import { resolveStickerValue } from "@/lib/sticker/resolveStickerValue";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getPlaningAndSchedulingById,
  getProcessByID,
  getShift,
  getProductById,
  getDeviceByProductId,
  createDeviceTestEntry,
  getOverallDeviceTestEntry,
  getDeviceTestEntryByOperatorId,
  getDeviceTestRecordsByProcessId,
  getLatestDeviceTestsByPlanId,
  getDeviceTestByDeviceId,
  createReport,
  getOverallProgressByOperatorId,
  getOperatorTaskByUserID,
  getOperatorTaskDevice,
  createCarton,
  updatePlaningAndScheduling,
  // Operator work tracking
  startOperatorWorkSession,
  getActiveOperatorWorkSession,
  stopOperatorWorkSession,
  startOperatorWorkBreak,
  endOperatorWorkBreak,
  logOperatorWorkEvent,
} from "@/lib/api";
import { calculateTimeDifference } from "@/lib/common";
import SearchableInput from "@/components/SearchableInput/SearchableInput";
import { RefreshCw, Video, ExternalLink, Coffee } from "lucide-react";
import { resolvePreviousStageEligibility } from "./stageEligibility";
import useOperatorTaskBootstrap from "./hooks/useOperatorTaskBootstrap";
import {
  getParallelSeatEntries,
  getSeatAssignmentForDevice,
  getSeatStageEntry,
  normalizeAssignedStagesPayload,
} from "@/lib/parallelStageRouting";

// Utility: safely read current user from localStorage
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("userDetails");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const SHOULD_LOG_OPERATOR_SUBMIT_TIMINGS = String(
  process.env.NEXT_PUBLIC_LOG_OPERATOR_PASS_TIMINGS || "",
).toLowerCase() === "true";

type Device = any;
type Carton = any;

interface Product {
  _id: string;
  name: string;
  orderConfirmationNo?: string;
  processID?: string | number;
  sopFile?: string;
  stages?: any[];
  commonStages?: any[];
}

interface User {
  _id: string;
  name: string;
  role?: string;
}

interface Props {
  isFullScreenMode: boolean;
  setIsFullScreenMode: (v: boolean) => void;
}

const ViewTaskDetailsComponent: React.FC<Props> = ({
  isFullScreenMode,
  setIsFullScreenMode,
}) => {
  const [getPlaningAndScheduling, setPlaningAndScheduling] = useState<any>(null);
  const [product, setProduct] = useState<any>({});
  const [shift, setShift] = useState<any>({});
  const [selectedProduct, setSelectedProduct] = useState<any>({});
  const [operatorDetails, setOperatorDetail] = useState<any[]>([]);
  const [assignUserStage, setAssignUserStage] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [elapsedDevicetime, setElapsedDevicetime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [taskStatus, setTaskStaus] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState("00:00:00");
  const [deviceDisplay, setDeviceisplay] = useState("00:00:00");
  const [isDevicePause, setDevicePause] = useState(true);
  const [timeDifference, setTimeDifference] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalNg, setTotalNg] = useState(0);
  const [overallTotalAttempts, setOverallTotalAttempts] = useState(0);
  const [overallTotalCompleted, setOverallTotalCompleted] = useState(0);
  const [overallTotalNg, setOverallTotalNg] = useState(0);
  const [wipKits, setWipKits] = useState(0);
  const [lineIssueKits, setLineIssueKits] = useState(0);
  const [kitsShortage, setKitsShortage] = useState(0);
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [choosenDevice, setChoosenDevice] = useState("");
  const [checkedDevice, setCheckedDevice] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [showOnScan, setShowOnScan] = useState(false);
  const [notFoundError, setNotFoundError] = useState("");
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [isDeviceHistoryLoading, setIsDeviceHistoryLoading] = useState(false);
  const [isDeviceSectionShow, setIsDeviceSectionShow] = useState(false);
  const [isReportIssueModal, setIsReportIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [searchedSerialNo, setSearchedSerialNo] = useState("");
  const [operatorSeatInfo, setOperatorSeatInfo] = useState<any>(null);
  const [isPassNGButtonShow, setIsPassNGButtonShow] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [isStickerPrinted, setIsStickerPrinted] = useState(false);
  const [isVerifyStickerModal, setIsVerifyStickerModal] = useState(false);
  const [isDownTimeEnable, setIsDownTimeAvailable] = useState(false);
  const [getDownTimeVal, setDownTimeVal] = useState<any>({});
  const [processStatus, setProcessStatus] = useState("");
  const [processData, setProcessData] = useState<any>({});
  const [processAssignUserStage, setProcessAssignUserStage] = useState<any>({});
  const [selectedProcess, setSelectedProcess] = useState("");
  const [assignedTaskDetails, setAssignedTaskDetails] = useState<any>(null);
  const [isScanModalOpen, setScanModalOpen] = useState(false);
  const [scanslug, setScanSlug] = useState("");
  const [isScanValuePass, setIsScanValuePass] = useState<boolean[]>([]);
  const [isCheckValueButtonHide, setCheckValueButtonHide] = useState<boolean[]>([]);
  const [scanValue, setScanValue] = useState<string[]>([]);
  const [moveToPackaging, setMoveToPackaging] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [startTest, setStartTest] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("operator_startTest") === "true";
    }
    return false;
  });
  const [operatorStartTime, setOperatorStartTime] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("operator_startTime") || "";
    }
    return "";
  });
  const [totalBreakTime, setTotalBreakTime] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("operator_totalBreakTime") || 0);
    }
    return 0;
  });
  const [breakStartTime, setBreakStartTime] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("operator_breakStartTime") || 0);
    }
    return 0;
  });
  const [cartons, setCartons] = useState<any[]>([]);
  const [isCartonBarcodePrinted, setIsCartonBarCodePrinted] = useState(false);
  const [isVerifiedSticker, setIsVerifiedSticker] = useState(false);
  const [expectedScanTypes, setExpectedScanTypes] = useState<string[]>([]);
  const [currentScanStep, setCurrentScanStep] = useState(0);
  const [pendingOpenVerify, setPendingOpenVerify] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isVerifiedPackaging, setIsVerifiedPackaging] = useState(false);
  const [isVerifyPackagingModal, setIsVerifyPackagingModal] = useState(false);
  const [processCartons, setProcessCartons] = useState<any>([]);
  const [isdevicePassed, setIsDevicePassed] = useState(false);
  const [processStagesName, setProcessStageName] = useState<string[]>([]);
  const [selectAssignDeviceDepartment, setAsssignDeviceDepartment] =
    useState<string>("");
  const [resetDeviceIds, setResetDeviceIds] = useState<string[]>([]);
  const isSubmitting = React.useRef<boolean>(false);
  const resolveSearchRequestIdRef = React.useRef(0);
  const resolvedScanDeviceRef = React.useRef<any>(null);
  const verifyTargetSerialRef = React.useRef<string>("");
  const { SVG } = useQRCode();
  const [historyFilterDate, setHistoryFilterDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [historySerialQuery, setHistorySerialQuery] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [operatorSessionId, setOperatorSessionId] = useState<string | null>(null);
  const [taskPlanId, setTaskPlanId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    setTaskPlanId(pathname.split("/").pop() || "");
    const user = getCurrentUser();
    setCurrentUserId(String(user?._id || ""));
  }, []);

  const {
    data: taskBootstrapData,
    loadBootstrap,
    refreshNow: refreshTaskSummary,
  } = useOperatorTaskBootstrap({
    planId: taskPlanId,
    operatorId: currentUserId,
    enabled: Boolean(taskPlanId && currentUserId),
    pollMs: 10000,
  });

  const overtimeStats = useMemo(() => {
    const summary = getPlaningAndScheduling?.overtimeSummary || {};
    const windows = Array.isArray(getPlaningAndScheduling?.overtimeWindows)
      ? getPlaningAndScheduling.overtimeWindows
      : [];
    const activeWindows = windows.filter((w: any) => w?.active);

    const nextActive = activeWindows
      .map((w: any) => ({ ...w, toTs: new Date(w?.to || 0).getTime() }))
      .filter((w: any) => Number.isFinite(w.toTs) && w.toTs >= Date.now())
      .sort((a: any, b: any) => a.toTs - b.toTs)[0];

    return {
      totalWindows: Number(summary?.totalWindows || activeWindows.length || 0),
      totalMinutes: Number(summary?.totalMinutes || 0),
      nextEndsAt: nextActive?.to ? new Date(nextActive.to) : null,
    };
  }, [getPlaningAndScheduling]);

  const currentAssignedStageName = useMemo(
    () =>
      String(
        (Array.isArray(assignUserStage)
          ? assignUserStage?.[0]?.name || assignUserStage?.[0]?.stageName
          : assignUserStage?.name || assignUserStage?.stageName || assignUserStage?.stage) || "",
      ).trim(),
    [assignUserStage],
  );
  const isCommonStageView = useMemo(
    () =>
      assignedTaskDetails?.stageType === "common" ||
      (Array.isArray(processData?.commonStages)
        ? processData.commonStages.some(
            (stage: any) =>
              String(stage?.stageName || stage?.name || "").trim().toLowerCase() ===
              String(currentAssignedStageName || "").trim().toLowerCase(),
          )
        : false),
    [assignedTaskDetails?.stageType, processData?.commonStages, currentAssignedStageName],
  );

  const getNormalizedPlanAssignedStages = (planData: any = getPlaningAndScheduling) => {
    const isCommon = assignedTaskDetails?.stageType === "common";
    const stageField = isCommon ? "assignedCustomStages" : "assignedStages";
    return normalizeAssignedStagesPayload(
      JSON.parse(planData?.[stageField] || "{}"),
      processData?.stages || [],
    );
  };

  const selectedDevice = useMemo(
    () =>
      deviceList.find(
        (device: any) =>
          String(device?.serialNo || device?.serial_no || "").trim() ===
          String(searchResult || "").trim(),
      ) || null,
    [deviceList, searchResult],
  );

  const stageEligibility = useMemo(
    () =>
      resolvePreviousStageEligibility({
        processStages: processData?.stages,
        currentStageName: currentAssignedStageName,
        serialNo:
          selectedDevice?.serialNo ||
          selectedDevice?.serial_no ||
          searchResult,
        deviceHistory,
        deviceCurrentStage:
          selectedDevice?.currentStage ||
          selectedDevice?.stageName ||
          "",
      }),
    [processData?.stages, currentAssignedStageName, selectedDevice, searchResult, deviceHistory],
  );

  const ensureOperatorSession = React.useCallback(
    async (): Promise<string | null> => {
      try {
        if (operatorSessionId) return operatorSessionId;

        if (typeof window === "undefined") return null;

        const pathname = window.location.pathname;
        const planIdFromUrl = pathname.split("/").pop() || "";
        const processId = selectedProcess || processData?._id || "";

        if (!processId) return null;

        // Try to reuse any active session first
        try {
          const active = await getActiveOperatorWorkSession(processId);
          const existing = active?.session;
          if (existing?._id) {
            setOperatorSessionId(existing._id);
            return existing._id;
          }
        } catch (error) {
          // Non-fatal we'll try to create a new one
          console.error("Failed to fetch active operator session:", error);
        }

        // Create a new session
        const payload: any = { processId };
        if (planIdFromUrl) payload.planId = planIdFromUrl;
        payload.taskUrl = window.location.href;

        const started = await startOperatorWorkSession(payload);
        const session = started?.session;
        if (session?._id) {
          setOperatorSessionId(session._id);
          return session._id;
        }
        return null;
      } catch (error) {
        console.error("Failed to ensure operator work session:", error);
        return null;
      }
    },
    [operatorSessionId, selectedProcess, processData],
  );

  const safeLogOperatorEvent = React.useCallback(
    async (
      actionName: string,
      payload: any = {},
      actionType: string = "UI",
      existingSessionId?: string | null,
    ) => {
      try {
        if (typeof window === "undefined") return;
        const sessionId = existingSessionId || (await ensureOperatorSession());
        if (!sessionId) return;

        await logOperatorWorkEvent(sessionId, {
          actionType,
          actionName,
          payload,
          pageUrl: window.location.pathname,
          clientOccurredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to log operator work event: ${actionName}`, error);
      }
    },
    [ensureOperatorSession],
  );
  const applyTaskBootstrapData = React.useCallback((payload: any) => {
    if (!payload) return;

    const planData = payload?.plan || {};
    const processPayload = payload?.process || {};
    const productPayload = payload?.product || {};
    const shiftPayload = payload?.shift || {};
    const counters = payload?.counters || {};
    const insights = payload?.insights || {};
    const operatorScope = insights?.operatorScope || {};
    const mergedCounters = {
      ...counters,
      wipKits:
        operatorScope?.wip !== undefined ? operatorScope.wip : counters?.wipKits,
      lineIssueKits:
        operatorScope?.lineIssueKits !== undefined
          ? operatorScope.lineIssueKits
          : counters?.lineIssueKits,
      kitsShortage:
        operatorScope?.kitsShortage !== undefined
          ? operatorScope.kitsShortage
          : counters?.kitsShortage,
      overallTotalCompleted:
        operatorScope?.pass !== undefined
          ? operatorScope.pass
          : counters?.overallTotalCompleted,
      overallTotalNg:
        operatorScope?.ng !== undefined
          ? operatorScope.ng
          : counters?.overallTotalNg,
      overallTotalAttempts:
        operatorScope?.tested !== undefined
          ? operatorScope.tested
          : counters?.overallTotalAttempts,
    };
    const normalizedProduct = productPayload?._id
      ? {
          ...productPayload,
          product: productPayload,
          processID:
            productPayload?.processID ||
            processPayload?.processID ||
            processPayload?._id ||
            planData?.selectedProcess ||
            "",
        }
      : {};

    setPlaningAndScheduling({
      ...planData,
      overtimeSummary: payload?.overtimeSummary || planData?.overtimeSummary || {},
    });
    setAssignedTaskDetails(payload?.assignedTaskDetails || null);
    setAssignUserStage(payload?.assignUserStage || null);
    setProcessAssignUserStage(payload?.processAssignUserStage || {});
    setProcessData(processPayload || {});
    setProcessStatus(
      processPayload?.status || planData?.processStatus || planData?.status || "",
    );
    setSelectedProcess(
      String(payload?.selectedProcess || processPayload?._id || planData?.selectedProcess || ""),
    );
    setSelectedProduct(normalizedProduct);
    setProduct(normalizedProduct);
    setShift(shiftPayload || {});
    setProcessStageName(Array.isArray(payload?.processStagesName) ? payload.processStagesName : []);
    setDeviceList(Array.isArray(payload?.compactQueue) ? payload.compactQueue : []);
    setOperatorSeatInfo(payload?.operatorSeatInfo || null);
    setWipKits(Number(mergedCounters?.wipKits || 0));
    setLineIssueKits(Number(mergedCounters?.lineIssueKits || 0));
    setKitsShortage(Number(mergedCounters?.kitsShortage || 0));
    setOverallTotalCompleted(Number(mergedCounters?.overallTotalCompleted || 0));
    setOverallTotalNg(Number(mergedCounters?.overallTotalNg || 0));
    setOverallTotalAttempts(Number(mergedCounters?.overallTotalAttempts || 0));
    setTotalAttempts(Number(mergedCounters?.totalAttempts || 0));
    setTotalCompleted(Number(mergedCounters?.totalCompleted || 0));
    setTotalNg(Number(mergedCounters?.totalNg || 0));

    const downTimePayload = payload?.downTime || {};
    setIsDownTimeAvailable(Boolean(downTimePayload?.enabled));
    setDownTimeVal(downTimePayload?.value || {});

    if (shiftPayload?.startTime || shiftPayload?.endTime) {
      setTimeDifference(calculateTimeDifference(shiftPayload?.startTime, shiftPayload?.endTime));
    }

    setLastSyncTime(new Date());
  }, []);

  const refreshTaskSummaryNow = React.useCallback(async () => {
    try {
      const refreshedTask = await refreshTaskSummary();
      if (refreshedTask) {
        applyTaskBootstrapData({
          ...(taskBootstrapData || {}),
          ...refreshedTask,
        });
        setLastSyncTime(new Date());
      }
    } catch {
      // Ignore summary refresh errors from carton mutation paths.
    }
  }, [applyTaskBootstrapData, refreshTaskSummary, taskBootstrapData]);


  useEffect(() => {
    getDeviceTestEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilterDate, historySerialQuery]);

  useEffect(() => {
    if (taskBootstrapData) {
      applyTaskBootstrapData(taskBootstrapData);
    }
  }, [taskBootstrapData, applyTaskBootstrapData]);

  const runSync = async () => {
    setIsSyncing(true);
    try {
      await getDeviceTestEntry();
      const refreshed = await refreshTaskSummary();
      if (refreshed) {
        applyTaskBootstrapData(refreshed);
      }
      setLastSyncTime(new Date());
    } finally {
      setIsSyncing(false);
    }
  };
  const closeScanModal = () => {
    setScanModalOpen(false);
  };
  const handleCreatingCarton = async () => {
    try {
      // createCarton implementation
    } catch (error: any) {

    }
  };
  const getAssignedTask = async (id: any) => {
    try {
      let response = await getOperatorTaskByUserID(id);
      return response.task;
    } catch (error) {

    }
  };
  const closeVerifyStickerModal = () => {
    setIsVerifyStickerModal(false);
    setExpectedScanTypes([]);
    setCurrentScanStep(0);
    setSerialNumber("");
    verifyTargetSerialRef.current = "";
    isSubmitting.current = false;
  };
  const filterDevicesForCurrentSeat = React.useCallback(
    ({
      devices = [],
      latestRecords = [],
      operatorStageName = "",
      processId = "",
      processStages = [],
      normalizedAssignedStages = {},
    }: {
      devices?: any[];
      latestRecords?: any[];
      operatorStageName?: string;
      processId?: string;
      processStages?: any[];
      normalizedAssignedStages?: Record<string, any>;
    }) => {
      const trimmedStageName = String(operatorStageName || "").trim();
      const firstStageName = String(processStages?.[0]?.stageName || "").trim();
      const seatKey = operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber;
      const currentSeatStage = getSeatStageEntry(normalizedAssignedStages, seatKey);
      const parallelSeats = getParallelSeatEntries({
        assignedStages: normalizedAssignedStages,
        stageName: trimmedStageName,
        lineIndex: currentSeatStage?.lineIndex,
        parallelGroupKey: currentSeatStage?.parallelGroupKey,
      });

      const latestRecordMap = new Map<string, any>();
      (Array.isArray(latestRecords) ? latestRecords : []).forEach((record: any) => {
        const serial = String(
          record?.serialNo ||
          record?.serial ||
          record?.device?.serialNo ||
          record?.deviceInfo?.serialNo ||
          "",
        ).trim();
        if (!serial) return;
        latestRecordMap.set(serial, record);
      });

      return (Array.isArray(devices) ? devices : []).filter((device: any) => {
        const deviceProcessId = String(device?.processID || device?.processId || "");
        const deviceStatus = String(device?.status || "").trim().toLowerCase();
        const deviceCurrentStage = String(device?.currentStage || "").trim();
        const deviceSerial = String(device?.serialNo || device?.serial_no || "").trim();
        const latestPlanRecord = deviceSerial ? latestRecordMap.get(deviceSerial) : null;
        const latestStatus = String(latestPlanRecord?.status || "").trim().toLowerCase();
        const latestIsReverted = latestStatus === "reverted" || latestStatus === "removed";

        const stageMatches =
          deviceCurrentStage === trimmedStageName ||
          (!deviceCurrentStage && trimmedStageName && trimmedStageName === firstStageName);

        if (!(deviceProcessId === String(processId) && deviceStatus !== "ng" && stageMatches)) {
          return false;
        }

        // For downstream stages, only count devices that already belong to this plan.
        if (trimmedStageName !== firstStageName && !latestPlanRecord) {
          return false;
        }

        if (
          latestPlanRecord?.assignedSeatKey &&
          !latestIsReverted &&
          String(latestPlanRecord.assignedSeatKey) !== String(seatKey)
        ) {
          return false;
        }

        if (parallelSeats.length <= 1) {
          return true;
        }

        if (latestIsReverted) {
          return true;
        }

        const latestAssignment = getSeatAssignmentForDevice({
          records: latestRecords,
          serialNo: deviceSerial,
          currentStageName: trimmedStageName,
        });

        if (!latestAssignment?.assignedSeatKey) {
          return false;
        }

        return String(latestAssignment.assignedSeatKey) === String(seatKey);
      });
    },
    [assignedTaskDetails?.stageType, operatorSeatInfo?.rowNumber, operatorSeatInfo?.seatNumber],
  );
  const getOverallProgress = async (id: any) => {
    try {
      if (!getPlaningAndScheduling) return;
      const processId = getPlaningAndScheduling.selectedProcess;
      if (!processId) return;

      // 1. Fetch latest records per device/stage for this plan
      const productId = selectedProduct?._id || selectedProduct?.product?._id;
      const [latestRecordResult, fallbackRecordResult, deviceResult] = await Promise.all([
        getLatestDeviceTestsByPlanId(id, processId).catch(() => null),
        getDeviceTestRecordsByProcessId(processId).catch(() => null),
        productId ? getDeviceByProductId(productId).catch(() => null) : Promise.resolve(null),
      ]);
      let allRecords: any[] = latestRecordResult?.deviceTestRecords || [];
      if (!Array.isArray(allRecords) || allRecords.length === 0) {
        const rawRecords = fallbackRecordResult?.deviceTestRecords || [];
        allRecords = rawRecords.filter(
          (record: any) => String(record?.planId) === String(id),
        );
      }

      // 2. Identify current stages assigned to this seat
      const isCommon = assignedTaskDetails?.stageType === "common";
      const stageField = isCommon ? "assignedCustomStages" : "assignedStages";
        const assignedStages = normalizeAssignedStagesPayload(
          JSON.parse(getPlaningAndScheduling?.[stageField] || "{}"),
          processData?.stages || [],
        );
        const seatKey = operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber;

        const seatStages = Array.isArray(assignedStages?.[seatKey])
          ? assignedStages[seatKey]
          : (assignedStages?.[seatKey] ? [assignedStages[seatKey]] : []);

        const targetStageNames = new Set(seatStages.map((s: any) => (s.name || s.stageName)?.trim()).filter(Boolean));
        if (targetStageNames.size === 0) {
          setWipKits(0);
          setLineIssueKits(0);
          setKitsShortage(0);
          setOverallTotalCompleted(0);
          setOverallTotalNg(0);
          setOverallTotalAttempts(0);
          return;
        }

      // 3. Filter records for CURRENT stage (GLOBAL across all operators/plans in this process instance)
      let globalPass = 0;
      let globalNg = 0;
      let globalTested = 0;

      allRecords.forEach((r: any) => {
        const rStage = (r.name || r.stageName)?.trim();
        // Only count records if the stage matches AND it belongs to the current plan
        if (targetStageNames.has(rStage) && String(r.planId) === String(id)) {
          globalTested++;
          if (r.status === "Pass" || r.status === "Completed") globalPass++;
          else if (r.status === "NG" || r.status === "Fail") globalNg++;
        }
      });

      const cap = parseInt(processData?.quantity, 10) || 0;
      if (cap > 0) {
        const total = globalPass + globalNg;
        if (total > cap) {
          const cappedPass = Math.min(globalPass, cap);
          const remaining = Math.max(cap - cappedPass, 0);
          const cappedNg = Math.min(globalNg, remaining);
          globalPass = cappedPass;
          globalNg = cappedNg;
          globalTested = Math.min(globalTested, cap);
        }
      }

      setOverallTotalCompleted(globalPass);
      setOverallTotalNg(globalNg);
      setOverallTotalAttempts(globalTested);

        // 4. Calculate WIP for the current seat only.
        const seatFilteredDevices = filterDevicesForCurrentSeat({
          devices: deviceResult?.data || [],
          latestRecords: allRecords,
          operatorStageName: Array.from(targetStageNames)[0] as string,
          processId,
          processStages: processData?.stages || [],
          normalizedAssignedStages: assignedStages,
        });
        const seatProcessedTotal = seatStages.reduce((sum: number, stageEntry: any) => {
          const passed = Number(stageEntry?.passedDevice || 0);
          const ng = Number(stageEntry?.ngDevice || 0);
          return sum + (Number.isFinite(passed) ? passed : 0) + (Number.isFinite(ng) ? ng : 0);
        }, 0);
        const effectiveSeatWip = seatFilteredDevices.length;
        const seatIssuedTotal = effectiveSeatWip + seatProcessedTotal;

        setWipKits(effectiveSeatWip);
        setLineIssueKits(seatIssuedTotal);
        setKitsShortage(Math.max(seatIssuedTotal - effectiveSeatWip - seatProcessedTotal, 0));
        setOverallTotalCompleted(globalPass);
        setOverallTotalNg(globalNg);
        setOverallTotalAttempts(globalTested);
    } catch (error: any) {
      console.error("Error fetching process-wide progress:", error);
    }
  };

  const getDeviceById = async (id: any) => {
    setIsDeviceHistoryLoading(true);
    try {
      if (taskPlanId && currentUserId) {
        const optimized = await getOperatorTaskDevice(taskPlanId, currentUserId, { deviceId: id });
        const history = Array.isArray(optimized?.data?.history)
          ? optimized.data.history
          : Array.isArray(optimized?.history)
            ? optimized.history
            : [];
        setDeviceHistory(history);
        setNotFoundError("");
        return history;
      }

      const result = await getDeviceTestByDeviceId(id);
      if (result && result.status == 200) {
        setDeviceHistory(result.data);
        setNotFoundError("");
        return result.data;
      }

      setDeviceHistory([]);
      return [];
    } catch (error) {
      setDeviceHistory([]);
      return [];
    } finally {
      setIsDeviceHistoryLoading(false);
    }
  };

  const resolveSearchQuery = React.useCallback(async (rawQuery: string) => {
    const query = String(rawQuery || "").trim();
    if (!query) {
      return { ok: false };
    }
    const requestId = ++resolveSearchRequestIdRef.current;
    const isLatestRequest = () => requestId === resolveSearchRequestIdRef.current;

    const normalizeScanToken = (value: any) =>
      String(value ?? "")
        .replace(/[\r\n]+/g, " ")
        .trim()
        .toLowerCase();
    const parseFlexibleScanTokens = (input: string) => {
      const normalizedInput = String(input || "").replace(/[\r\n]+/g, ",");
      const tokens = normalizedInput
        .split(/[,\|;]+/)
        .map((token) => normalizeScanToken(token))
        .filter(Boolean);
      return Array.from(new Set(tokens));
    };
    const collectDeviceIdentityValues = (device: any) => {
      const values = new Set<string>();
      const addValue = (raw: any) => {
        const token = normalizeScanToken(raw);
        if (token) values.add(token);
      };

      addValue(device?.serialNo);
      addValue(device?.serial_no);
      addValue(device?.serial);
      addValue(device?.imeiNo);
      addValue(device?.imei_no);
      addValue(device?.imei);
      addValue(device?.ccid);
      addValue(device?.iccid);

      const scanCustomFields = (source: any) => {
        if (!source || typeof source !== "object") return;

        if (Array.isArray(source)) {
          source.forEach((entry) => scanCustomFields(entry));
          return;
        }

        Object.entries(source).forEach(([rawKey, rawValue]) => {
          const key = normalizeScanToken(rawKey).replace(/\s+/g, "");
          const isIdentityKey =
            key.includes("serial") ||
            key === "sn" ||
            key === "sno" ||
            key.includes("imei") ||
            key.includes("ccid") ||
            key.includes("iccid");

          if (rawValue && typeof rawValue === "object") {
            scanCustomFields(rawValue);
            return;
          }

          if (isIdentityKey) addValue(rawValue);
        });
      };

      scanCustomFields(device?.customFields);
      scanCustomFields(device?.custom_fields);
      return values;
    };
    const doesScanMatchDevice = (scanInput: string, device: any) => {
      const tokens = parseFlexibleScanTokens(scanInput);
      if (!tokens.length || !device) return false;
      const candidateValues = collectDeviceIdentityValues(device);
      return tokens.every((token) => candidateValues.has(token));
    };
    const permuteTriplet = (items: string[]) => {
      if (items.length !== 3) return [];
      const [a, b, c] = items;
      return [
        [a, b, c],
        [a, c, b],
        [b, a, c],
        [b, c, a],
        [c, a, b],
        [c, b, a],
      ];
    };
    const buildScanCandidates = (input: string) => {
      const base = String(input || "").trim();
      const tokens = parseFlexibleScanTokens(base);
      const candidates: string[] = [];

      if (base) candidates.push(base);
      if (tokens.length > 0) candidates.push(tokens.join(","));

      if (tokens.length === 3) {
        const looksImei = (value: string) => /^\d{15}$/.test(value);
        const looksCcid = (value: string) => /^\d{18,22}[a-z]?$/i.test(value);
        const imeiToken = tokens.find((token) => looksImei(token));
        const ccidToken = tokens.find((token) => looksCcid(token));
        const serialToken = tokens.find((token) => token !== imeiToken && token !== ccidToken);

        if (serialToken && imeiToken && ccidToken) {
          candidates.push([serialToken, imeiToken, ccidToken].join(","));
        }

        permuteTriplet(tokens).forEach((triplet) => candidates.push(triplet.join(",")));
      }

      tokens.forEach((token) => candidates.push(token));

      return Array.from(
        new Set(
          candidates
            .map((candidate) => String(candidate || "").trim())
            .filter(Boolean),
        ),
      );
    };
    const applyResolvedDevice = (optimized: any, fallbackInput: string) => {
      if (!isLatestRequest()) {
        return { ok: false, stale: true };
      }
      const history = Array.isArray(optimized?.data?.history)
        ? optimized.data.history
        : Array.isArray(optimized?.history)
          ? optimized.history
          : [];
      const resolvedDevice = optimized?.data?.device || optimized?.device || null;
      const resolvedSerial = String(
        resolvedDevice?.serialNo || resolvedDevice?.serial_no || fallbackInput || query,
      ).trim();

      setDeviceHistory(history);
      setSearchResult(resolvedSerial);
      setSearchQuery(resolvedSerial);
      setNotFoundError("");
      setSearchedSerialNo(resolvedSerial);
      resolvedScanDeviceRef.current = resolvedDevice || null;
      return { ok: true, device: resolvedDevice, history };
    };

    if (!(taskPlanId && currentUserId)) {
      if (isLatestRequest()) {
        setNotFoundError("No results found for: " + query);
        setSearchedSerialNo(query);
      }
      return { ok: false };
    }

    if (isLatestRequest()) {
      setIsDeviceHistoryLoading(true);
    }
    let lastError: any = null;
    try {
      const candidates = buildScanCandidates(query);
      for (const candidate of candidates) {
        if (!isLatestRequest()) {
          return { ok: false, stale: true };
        }
        try {
          const optimized = await getOperatorTaskDevice(taskPlanId, currentUserId, {
            scanInput: candidate,
          });
          return applyResolvedDevice(optimized, candidate);
        } catch (error: any) {
          lastError = error;
        }
      }

      const localMatchedDevice = Array.isArray(deviceList)
        ? deviceList.find((device: any) => doesScanMatchDevice(query, device))
        : null;
      if (localMatchedDevice) {
        if (!isLatestRequest()) {
          return { ok: false, stale: true };
        }
        const resolvedSerial = String(
          localMatchedDevice?.serialNo || localMatchedDevice?.serial_no || query,
        ).trim();
        setDeviceHistory([]);
        setSearchResult(resolvedSerial);
        setSearchQuery(resolvedSerial);
        setNotFoundError("");
        setSearchedSerialNo(resolvedSerial);
        resolvedScanDeviceRef.current = localMatchedDevice;
        return { ok: true, device: localMatchedDevice, history: [] };
      }

      const message =
        lastError?.message ||
        lastError?.error ||
        lastError?.response?.data?.message ||
        "No matching device found for the scanned input";

      const activeResolvedDevice = resolvedScanDeviceRef.current || selectedDevice || null;
      const isSeatUnavailable = /not available for this seat/i.test(String(message || ""));
      if (
        isSeatUnavailable &&
        activeResolvedDevice &&
        doesScanMatchDevice(query, activeResolvedDevice)
      ) {
        if (isLatestRequest()) {
          const resolvedSerial = String(
            activeResolvedDevice?.serialNo || activeResolvedDevice?.serial_no || query,
          ).trim();
          setNotFoundError("");
          setSearchedSerialNo(resolvedSerial);
          setSearchResult(resolvedSerial);
          setSearchQuery(resolvedSerial);
        }
        return { ok: true, device: activeResolvedDevice, history: deviceHistory || [] };
      }

      if (isLatestRequest()) {
        setDeviceHistory([]);
        resolvedScanDeviceRef.current = null;
        setNotFoundError(message);
        setSearchedSerialNo(query);
        toast.error(message);
      }
      return { ok: false, error: message };
    } finally {
      if (isLatestRequest()) {
        setIsDeviceHistoryLoading(false);
      }
    }
  }, [currentUserId, taskPlanId, deviceList, selectedDevice, deviceHistory]);

  const getDeviceTestEntry = async () => {
    try {
      const userDetails = getCurrentUser();
      const result = await getDeviceTestEntryByOperatorId(userDetails?._id, historyFilterDate, historySerialQuery);
      let devices = result.data;
      const updatedDeviceHistory = devices.map((value: any) => {
        return {
          deviceInfo: value,
          stageName: value?.stageName,
          status: value?.status,
          assignedDeviceTo: value?.assignedDeviceTo,
          timeTaken: value?.timeConsumed,
        };
      });
      setCheckedDevice(updatedDeviceHistory);
      return updatedDeviceHistory;
    } catch (error: any) {
      if (error?.status === 404) {
        setCheckedDevice([]);
      }
    }
  };
  const getDeviceTestEntryOverall = async () => {
    try {
      const result = await getOverallDeviceTestEntry();
      return result.DeviceTestEntry;
    } catch (error) {
      console.error("Error Fetching Devices:", error);
    }
  };
  const getDevices = async (
    id: any,
    assignStageToUser: any,
    pId: any,
    processStages: any[] = [],
  ) => {
    try {
      const [result, latestRecordResult] = await Promise.all([
        getDeviceByProductId(id),
        getLatestDeviceTestsByPlanId(
          window.location.pathname.split("/").pop(),
          pId,
        ).catch(() => null),
      ]);
      const operatorStageName = String(
        Array.isArray(assignStageToUser)
          ? assignStageToUser?.[0]?.name || assignStageToUser?.[0]?.stageName || ""
          : assignStageToUser?.name || assignStageToUser?.stageName || "",
      ).trim();
      const isCommon = assignedTaskDetails?.stageType === "common";
      const stageField = isCommon ? "assignedCustomStages" : "assignedStages";
      const normalizedAssignedStages = normalizeAssignedStagesPayload(
        JSON.parse(getPlaningAndScheduling?.[stageField] || "{}"),
        processStages || processData?.stages || [],
      );
      const latestRecords = latestRecordResult?.deviceTestRecords || [];
      const filteredDeviceList = filterDevicesForCurrentSeat({
        devices: result?.data || [],
        latestRecords,
        operatorStageName,
        processId: pId,
        processStages,
        normalizedAssignedStages,
      });

      setDeviceList(filteredDeviceList);
      setWipKits(filteredDeviceList.length);
    } catch (error) {
      console.error("Error Fetching Devices:", error);
    }
  };
  useEffect(() => {
    const savedTime = localStorage.getItem("elapsedTime");
    const savedDisplayItem = localStorage.getItem("deviceDisplayTime");
    const savedIsPaused = localStorage.getItem("operator_isPaused");
    const savedIsDevicePause = localStorage.getItem("operator_isDevicePause");

    if (savedIsPaused !== null) {
      setIsPaused(savedIsPaused === "true");
    }
    if (savedIsDevicePause !== null) {
      setDevicePause(savedIsDevicePause === "true");
    }
    if (savedDisplayItem) {
      const n = Number(savedDisplayItem);
      setElapsedDevicetime(n);
      setDeviceisplay(formatTime(n));
    }
    if (savedTime) {
      const n = Number(savedTime);
      setElapsedTime(n);
      setTimerDisplay(formatTime(n));
    }
  }, []);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isDevicePause) {
      timer = setInterval(() => {
        setElapsedDevicetime((prev) => {
          const updatedTime = prev + 1;
          setDeviceisplay(formatTime(updatedTime));
          localStorage.setItem("deviceDisplayTime", String(updatedTime));
          return updatedTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isDevicePause]);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused) {
      timer = setInterval(() => {
        setElapsedTime((prev) => {
          const updatedTime = prev + 1;
          setTimerDisplay(formatTime(updatedTime));
          localStorage.setItem("elapsedTime", String(updatedTime));
          return updatedTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused]);
  const handleSubmitReport = async () => {
    try {
      const user = getCurrentUser();
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop() || "";
      let formData = new FormData();
      formData.append("serialNo", searchedSerialNo);
      formData.append("reportedBy", String(user?._id || ""));
      formData.append("processId", String(id));
      formData.append("currentStage", String(assignUserStage?.name || ""));
      formData.append("issueType", issueType);
      formData.append("issueDescription", issueDescription);
      const response = await createReport(formData);
      if (response && response.status == 200) {
        setIsReportIssueModal(false);
        setSearchResult("");
        resolvedScanDeviceRef.current = null;
        setSearchQuery("");
        setIsPassNGButtonShow(false);
        setIsVerifiedSticker(false);
        setIsStickerPrinted(false);
        // Log report submission as an operator event
        safeLogOperatorEvent(
          "REPORT_ISSUE_SUBMIT",
          {
            serialNo: searchedSerialNo,
            issueType,
            issueDescription,
            processId: id,
            stageName: assignUserStage?.name || "",
          },
          "OPERATION",
        );
        return false;
      }
    } catch (error: any) {
      console.error(error?.message ?? error);
    }
  };
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  const handleStart = () => {
    const now = new Date().toISOString();
    if (!operatorStartTime) {
      setOperatorStartTime(now);
      localStorage.setItem("operator_startTime", now);
    }
    setIsPaused(false);
    localStorage.setItem("operator_isPaused", "false");
    setTaskStaus(true);
    setIsDeviceSectionShow(true);
    setDevicePause(false);
    localStorage.setItem("operator_isDevicePause", "false");
    // Ensure backend session exists and log start event (fire-and-forget)
    safeLogOperatorEvent(
      "TASK_START",
      {
        operatorStartTime: now,
        selectedProcess,
        planId: getPlaningAndScheduling?._id,
      },
      "SESSION",
    );
  };
  const handlePauseResume = () => {
    const goingOnBreak = !isPaused;

    setIsPaused((prev) => {
      const next = !prev;
      localStorage.setItem("operator_isPaused", String(next));
      const now = Date.now();
      if (next) {
        // Just went on break
        setBreakStartTime(now);
        localStorage.setItem("operator_breakStartTime", String(now));
      } else {
        // Just resumed work
        if (breakStartTime) {
          const duration = Math.floor((now - breakStartTime) / 1000); // duration in seconds
          setTotalBreakTime((prevTotal) => {
            const nextTotal = prevTotal + duration;
            localStorage.setItem("operator_totalBreakTime", String(nextTotal));
            return nextTotal;
          });
          setBreakStartTime(0);
          localStorage.removeItem("operator_breakStartTime");
        }
      }
      return next;
    });
    setDevicePause((prev) => {
      const next = !prev;
      localStorage.setItem("operator_isDevicePause", String(next));
      return next;
    });
    // Call backend break APIs + log events (fire-and-forget)
    (async () => {
      try {
        const sessionId = await ensureOperatorSession();
        if (!sessionId) return;
        if (goingOnBreak) {
          await startOperatorWorkBreak(sessionId, { reason: "UI_BREAK" });
          await safeLogOperatorEvent(
            "BREAK_START",
            { reason: "UI_BREAK" },
            "SESSION",
            sessionId,
          );
        } else {
          await endOperatorWorkBreak(sessionId);
          await safeLogOperatorEvent(
            "BREAK_END",
            {},
            "SESSION",
            sessionId,
          );
        }
      } catch (error) {
        console.error("Failed to sync break with backend:", error);
      }
    })();
  };
  const handleStop = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to stop your work?",
      );
      if (!confirmed) {
        return;
      }
    }
    setIsPaused(true);
    localStorage.setItem("operator_isPaused", "true");
    setTaskStaus(false);
    setStartTest(false);
    localStorage.setItem("operator_startTest", "false");
    localStorage.removeItem("operator_startTime");
    localStorage.removeItem("operator_totalBreakTime");
    localStorage.removeItem("operator_breakStartTime");
    setOperatorStartTime("");
    setTotalBreakTime(0);
    setBreakStartTime(0);
    // Stop backend session and log stop event (fire-and-forget)
    (async () => {
      try {
        const sessionId = await ensureOperatorSession();
        if (!sessionId) return;
        await stopOperatorWorkSession(sessionId, {
          status: "completed",
          stopReason: "USER_STOP_BUTTON",
        });
        await safeLogOperatorEvent(
          "SESSION_STOP",
          {
            status: "completed",
            totalBreakTime,
          },
          "SESSION",
          sessionId,
        );
        setOperatorSessionId(null);
      } catch (error) {
        console.error("Failed to stop operator work session:", error);
      }
    })();
  };
  const getProduct = async (id: any, assignStageToUser: any) => {
    try {
      let result = await getProductById(id);

      setSelectedProduct(result);
      return;
    } catch (error) {

    }
  };
  const fetchProcessByID = async (id: any, assignStageToUser: any) => {
    try {
      const result = await getProcessByID(id);
      const stages: string[] = [];
      (result?.stages || []).forEach((value: any) => {
        if (value?.stageName) stages.push(value.stageName);
      });
      setProcessStageName(stages);
      setProcessStatus(result?.status);
      setProcessData(result);
      const processStage = (result?.stages || []).find((value: any) => {
        return (
          value.stageName ===
          (Array.isArray(assignStageToUser)
            ? assignStageToUser[0]?.name
            : assignStageToUser?.name)
        );
      });
      setProcessAssignUserStage(processStage);
      getDevices(
        result?.selectedProduct,
        assignStageToUser,
        result?._id,
        result?.stages || [],
      );
      getProduct(result.selectedProduct, assignStageToUser);
      setProduct(result);
    } catch (error: any) {

    }
  };
  const getShiftByID = async (id: any) => {
    try {
      let result = await getShift(id);
      let diff = calculateTimeDifference(result?.startTime, result?.endTime);
      setTimeDifference(diff);
      setShift(result);
    } catch (error) {

    }
  };
  const getPlaningAndSchedulingByID = async (id: any) => {
    try {
      const payload = await loadBootstrap();
      if (payload) {
        applyTaskBootstrapData(payload);
      }
      return payload;
    } catch (error: any) {
      console.error("Error fetching planning data:", error);
      return null;
    }
  };
  useEffect(() => {
    if (!isDownTimeEnable) return;
    if (!getDownTimeVal?.to) return;

    const endTimeMs = new Date(getDownTimeVal.to).getTime();
    if (Number.isNaN(endTimeMs)) return;

    const remainingMs = endTimeMs - Date.now();
    if (remainingMs <= 0) {
      setIsDownTimeAvailable(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsDownTimeAvailable(false);
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      if (id) getPlaningAndSchedulingByID(id);
    }, remainingMs + 250);

    return () => clearTimeout(timeoutId);
  }, [isDownTimeEnable, getDownTimeVal?.to]);
  const toggleFullScreenMode = () => {
    setIsFullScreenMode(!isFullScreenMode);
  };
  const handleChoosenDevice = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setChoosenDevice(event.target.value);
  };
  const handleUpdateStatus = async (
    status: string,
    deviceDepartment: string,
    subStepResults?: any,
    ngDescription?: string,
  ) => {
    if (isSubmitting.current) {

      return;
    }
    isSubmitting.current = true;
    setIsStatusSubmitting(true);
    try {
      let deviceInfo = deviceList.filter((device: any) => device.serialNo === searchResult);
      const deviceId = deviceInfo?.[0]?._id || "";
      const stageData = Array.isArray(assignUserStage)
        ? assignUserStage[0]
        : assignUserStage;
      const currentSeatKey = `${operatorSeatInfo?.rowNumber}-${operatorSeatInfo?.seatNumber}`;
      const normalizedAssignedStages = getNormalizedPlanAssignedStages();
      const currentSeatStage = getSeatStageEntry(normalizedAssignedStages, currentSeatKey) || stageData;

      const targetSerial =
        deviceInfo?.[0]?.serialNo ||
        selectedDevice?.serialNo ||
        searchResult ||
        "";
      const eligibility = resolvePreviousStageEligibility({
        processStages: processData?.stages,
        currentStageName: stageData?.name || stageData?.stageName || stageData?.stage || "",
        serialNo: targetSerial,
        deviceHistory,
        deviceCurrentStage:
          deviceInfo?.[0]?.currentStage ||
          selectedDevice?.currentStage ||
          "",
      });

      if (!eligibility.isEligible) {
        toast.error(eligibility.message || "Previous stage must be passed before testing this device.");
        isSubmitting.current = false;
        setIsStatusSubmitting(false);
        return;
      }

      const currentStageName = String(
        stageData?.stageName || stageData?.name || stageData?.stage || "",
      ).trim();

      if (status === "Pass") {
        setIsStickerPrinted(false);
        setIsVerifiedSticker(false);
        setIsAddedToCart(false);
        setIsVerifiedPackaging(false);
        setIsDevicePassed(true);
      }
      // Save device test entry
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();

      const userDetails = getCurrentUser();

      // Construct logs array if subStepResults exist
      let logs: any[] = [];
      if (subStepResults) {
        // Filter steps to match the indexing used in DeviceTestComponent
        const processStageData = Array.isArray(processAssignUserStage)
          ? processAssignUserStage[0]
          : processAssignUserStage;

        const testSteps =
          processStageData?.subSteps?.filter(
            (s: any) =>
              !s?.disabled &&
              (
                s.stepType === "jig" ||
                s.stepType === "manual" ||
                s.isPrinterEnable ||
                s.isPackagingStatus
              ),
          ) || [];

        // 

        // Construct logs array based on new schema
        logs = Object.keys(subStepResults).map((key) => {
          const index = Number(key);
          const result = subStepResults[key]; // { status, reason, data, timeTaken }
          const stepDef = testSteps[index];

          // Preserve the full terminal history so the logs modal can show
          // the complete command -> response -> validation flow.
          const terminalLogs = Array.isArray(result.data?.terminalLogs)
            ? result.data.terminalLogs
            : [];

          return {
            stepName: stepDef?.stepName || stepDef?.name || "Unknown Step",
            stepType: stepDef?.stepType || "unknown",
            logData: {
              // Include optimized terminal logs
              terminalLogs: terminalLogs,
              // Include parsed data (already compact)
              parsedData: result.data?.parsedData,
              // Include other essential data
              reason: result.reason,
              description: result.description,
              timeTaken: result.timeTaken,
            },
            status: result.status,
            createdAt: new Date().toISOString(),
          };
        });


      }

      // WIP and stat updates are now handled by the backend during createDeviceTestEntry.
      // We will refresh the plan data after the submission is successful to ensure consistency.

      // Build JSON payload
      const payload: any = {
        ...(deviceId ? { deviceId } : {}),
        processId: selectedProcess || "",
        planId: id || "",
        productId: selectedProduct?.product?._id || "",
        operatorId: userDetails?._id || "",
        serialNo:
          deviceInfo?.[0]?.serialNo ||
          selectedDevice?.serialNo ||
          searchResult ||
          "",
        seatNumber: currentSeatKey,
        stageName: currentStageName,
        currentLogicalStage: currentStageName,
        currentSeatKey,
        stageInstanceId: currentSeatStage?.stageInstanceId || "",
        parallelGroupKey: currentSeatStage?.parallelGroupKey || "",
        deviceCurrentStage:
          deviceInfo?.[0]?.currentStage ||
          selectedDevice?.currentStage ||
          "",
        status: status,
        timeConsumed: deviceDisplay,
        totalBreakTime: String(totalBreakTime),
        startTime: operatorStartTime,
        endTime: new Date().toISOString(),
        logs: logs,
        flowVersion: Number(deviceInfo?.[0]?.flowVersion || selectedDevice?.flowVersion || 1),
        flowStartedAt: deviceInfo?.[0]?.flowStartedAt || selectedDevice?.flowStartedAt || null,
      };

      if (status === "NG") {
        payload.ngDescription = String(ngDescription || "").trim();
        // Use the passed argument 'deviceDepartment' which contains the selected NG assignment (QC, TRC, Previous Stage)
        payload.assignedDeviceTo = deviceDepartment || selectAssignDeviceDepartment || "";

        // Find the failing step to extract reason and logs for top-level access
        const failingStepKey = Object.keys(subStepResults || {}).find(key => subStepResults[key].status === "NG");
        if (failingStepKey) {
          const failingResult = subStepResults[failingStepKey];
          payload.reason = failingResult.reason;
          // Also set logData for top-level if needed by detail page
          payload.logData = {
            reason: failingResult.reason,
            description: failingResult.description || payload.ngDescription,
            terminalLogs: (logs.find(l => l.status === "NG")?.logData?.terminalLogs) || []
          };
        }
      }

      const submitStartedAt =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      let result = await createDeviceTestEntry(payload);

      if (result && (result.status === 200 || result.status === 201)) {
        const resultType = String(
          result?.resultType || result?.data?.resultType || "",
        ).trim().toLowerCase();
        const actionStatus = String(
          result?.actionStatus || result?.data?.actionStatus || status || "",
        ).trim().toUpperCase();
        const isNgResult = resultType === "ng" || actionStatus === "NG";

        // Prepend to show at top of "Recent Activity"
        setCheckedDevice((prev) => [
          {
            deviceInfo: deviceInfo?.[0] || { serialNo: searchResult },
            stageName: stageData?.name || currentStageName,
            status: isNgResult ? "NG" : "Pass",
            timeTaken: deviceDisplay,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        setTotalAttempts((prev) => prev + 1);
        if (isNgResult) {
          setTotalNg((prev) => prev + 1);
        } else {
          setTotalCompleted((prev) => prev + 1);
        }

        const serialToRemove =
          deviceInfo?.[0]?.serialNo ||
          selectedDevice?.serialNo ||
          searchResult;
        if (serialToRemove) {
          setDeviceList((prev) => prev.filter((device: any) => device.serialNo !== serialToRemove));
          setWipKits((prev) => Math.max(prev - 1, 0));
        }

        // Reset UI for next device immediately; server reconciliation continues in background.
        setElapsedDevicetime(0);
        setDeviceisplay("00:00:00");
        setSearchQuery("");
        setNotFoundError("");
        setSearchResult("");
        resolvedScanDeviceRef.current = null;
        setIsPassNGButtonShow(false);
        setIsDevicePassed(false);
        setIsStickerPrinted(false);
        setIsVerifiedSticker(false);
        setIsAddedToCart(false);
        setIsVerifiedPackaging(false);

        toast.success(isNgResult ? "Device marked as NG" : "Device passed successfully");

        if (SHOULD_LOG_OPERATOR_SUBMIT_TIMINGS) {
          const submitFinishedAt =
            typeof performance !== "undefined" && typeof performance.now === "function"
              ? performance.now()
              : Date.now();
          console.info(
            "[operator-submit-timing]",
            JSON.stringify({
              actionStatus: isNgResult ? "NG" : "Pass",
              durationMs: Math.round(submitFinishedAt - submitStartedAt),
              planId: id || "",
              processId: selectedProcess || processData?._id || "",
              serialNo: serialToRemove || "",
            }),
          );
        }

        void refreshTaskSummary()
          .then((refreshedTask) => {
            if (refreshedTask) {
              applyTaskBootstrapData({
                ...(taskBootstrapData || {}),
                ...refreshedTask,
              });
              setLastSyncTime(new Date());
            }
          })
          .catch(() => null);
        // Log device test submission as an operator event
        safeLogOperatorEvent(
          "DEVICE_TEST_SUBMIT",
          {
            status,
            serialNo: deviceInfo?.[0]?.serialNo || searchResult,
            stageName: stageData?.name ?? "",
            processId: selectedProcess || "",
            planId: id || "",
          },
          "OPERATION",
        );
      } else {
        toast.error(result?.message || "Error creating device test entry");
      }
    } catch (error: any) {

      toast.error(error?.message || "Error creating device test entry");
    } finally {
      isSubmitting.current = false;
      setIsStatusSubmitting(false);
    }
  };
  const handlePrintCartonSticker = async (elementId: string = "carton-sticker-preview") => {
    const stickerElement = document.getElementById(elementId);
    if (!stickerElement) {
      toast.error("Carton sticker preview not found");
      return;
    }

    // Prefer DOM/SVG printing when the sticker is explicitly dimensioned (mm).
    // This avoids raster scaling artifacts and keeps output 1:1 with the preview.
    const mmSticker = stickerElement.querySelector(
      ".actual-sticker-container[data-sticker-mm-width]",
    ) as HTMLElement | null;
    if (mmSticker) {
      const { printStickerElements } = await import("@/lib/sticker/printSticker");
      const res = await printStickerElements({
        // Use a parent root so selector can find the sticker node(s).
        root: stickerElement,
        title: "Print Carton Sticker",
        selector: ".actual-sticker-container",
      });
      if (!res.ok) toast.error(res.message || "Unable to print sticker");
      else setIsCartonBarCodePrinted(true);
      return;
    }

    // Fallback: legacy raster print (kept for older StickerGenerator templates which
    // rely on app CSS and canvas rendering).
    const actualSticker = stickerElement.querySelector('[data-sticker-width]') as HTMLElement | null;
    const captureEl = actualSticker || (stickerElement as HTMLElement);
    const widthPx = actualSticker ? parseInt(actualSticker.getAttribute("data-sticker-width") || "400") : 400;
    const heightPx = actualSticker ? parseInt(actualSticker.getAttribute("data-sticker-height") || "250") : 250;

    const stickerWidthMM = Number((widthPx * 0.264583).toFixed(2)) || 100;
    const stickerHeightMM = Number((heightPx * 0.264583).toFixed(2)) || 60;

    html2canvas(captureEl, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    }).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow popups to print stickers");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Carton Sticker</title>
            <style>
              @page { size: ${stickerWidthMM}mm ${stickerHeightMM}mm; margin: 0; }
              html, body { margin: 0; padding: 0; width: ${stickerWidthMM}mm; height: ${stickerHeightMM}mm; background: #fff; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              img { width: ${stickerWidthMM}mm; height: ${stickerHeightMM}mm; object-fit: contain; display: block; }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="Sticker">
            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); window.onafterprint = function() { window.close(); }; }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setIsCartonBarCodePrinted(true);
    });
  };

  const handleNoResults = (query: string) => {
    setNotFoundError(`No results found for: ${query}`);
    setSearchedSerialNo(query);
  };
  const calculateEfficiency = (totalAttempts: number, upha: number, timeDifference: number) => {
    if (!upha || timeDifference <= 0) {
      return 0;
    }
    return ((totalAttempts / (upha * timeDifference)) * 100).toFixed(2);
  };
  const closeReportIssueModal = () => {
    setIsReportIssueModal(false);
  };
  const openReportIssueModel = () => {
    setIsReportIssueModal(true);
  };
  const handlePrintSticker = () => {
    const tryPrint = (attempt = 0) => {
      try {
        const sec = document.getElementById("printing-stack-section");
        sec?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch { }
      const stickerRoot = document.getElementById("sticker-preview");
      if (!stickerRoot) {
        if (attempt < 10) {
          // Ensure printing UI is visible and try again shortly
          setIsPassNGButtonShow(false);
          setIsVerifiedSticker(false);
          try {
            const sec = document.getElementById("printing-stack-section");
            sec?.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch { }
          setTimeout(() => tryPrint(attempt + 1), 150);
        }
        return;
      }
      setIsVerifiedSticker(false);

      printStickerElements({ root: stickerRoot, scale: 6, title: "Print Sticker" })
        .then((res) => {
          if (!res.ok) {
            toast.error(
              res.reason === "popup-blocked"
                ? "Please allow popups to print stickers"
                : res.message || "Sticker preview not found",
            );
            return;
          }
          setIsStickerPrinted(true);
        })
        .catch(() => {
          toast.error("Failed to print sticker");
        });
      setIsPassNGButtonShow(false);
    };
    tryPrint(0);
  };
  const handleVerifySticker = (types?: string[]) => {
    setSerialNumber("");
    const targetSerial = String(
      selectedDevice?.serialNo ||
      selectedDevice?.serial_no ||
      resolvedScanDeviceRef.current?.serialNo ||
      resolvedScanDeviceRef.current?.serial_no ||
      searchResult ||
      "",
    ).trim();
    verifyTargetSerialRef.current = targetSerial;
    const normalizeVerifyType = (value: any) => {
      const raw = String(value || "").trim().toLowerCase();
      if (!raw) return "";
      if (raw.startsWith("combined:")) {
        const combinedParts = raw
          .slice("combined:".length)
          .split(",")
          .map((entry) => String(entry || "").trim().toLowerCase())
          .filter(Boolean);
        if (combinedParts.length > 1) {
          return `combined:${combinedParts.join(",")}`;
        }
        return combinedParts[0] || "";
      }
      if (raw.includes("serial")) return "serial";
      if (raw.includes("imei")) return "imei";
      if (raw.includes("ccid")) return "ccid";
      return raw;
    };
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
    const preferConfiguredCombined = (arr: string[]) => {
      const normalized = uniq(arr.map((value) => normalizeVerifyType(value)).filter(Boolean));
      const combined = normalized.filter((entry) => entry.startsWith("combined:"));
      if (combined.length === 0) return normalized;

      const preferredCombined = [...combined].sort((left, right) => {
        const leftCount = left.slice("combined:".length).split(",").filter(Boolean).length;
        const rightCount = right.slice("combined:".length).split(",").filter(Boolean).length;
        return rightCount - leftCount;
      })[0];

      return preferredCombined ? [preferredCombined] : normalized;
    };

    try {
      let derived = Array.isArray(types)
        ? preferConfiguredCombined(types)
        : [];

      if (derived.length === 0) {
        const active = deviceList.find(
          (d: any) =>
            String(d?.serialNo || d?.serial_no || "").trim() === String(searchResult || "").trim(),
        );
        const hasInCF = (keyLike: string) => {
          let cf = active?.customFields;
          if (typeof cf === "string") {
            try {
              cf = JSON.parse(cf);
            } catch {
              cf = null;
            }
          }
          const vals: string[] = [];
          const collect = (o: any) => {
            if (!o || typeof o !== "object") return;
            Object.keys(o).forEach((k) => {
              const v = o[k];
              if (v && typeof v !== "object") {
                if (String(k).toLowerCase().includes(keyLike)) vals.push(String(v));
              } else if (v && typeof v === "object") collect(v);
            });
          };
          collect(cf);
          return vals.length > 0;
        };
        const hasImei =
          !!(active?.imeiNo || active?.imei || active?.imei_no || active?.deviceInfo?.imei) ||
          hasInCF("imei");
        const hasCcid = !!active?.ccid || hasInCF("ccid");
        const hasSerial =
          !!(active?.serialNo || active?.serial_no || active?.deviceInfo?.serialNo) ||
          hasInCF("serial");
        const ordered: string[] = [];
        if (hasCcid) ordered.push("ccid");
        if (hasSerial) ordered.push("serial");
        if (hasImei) ordered.push("imei");
        derived = preferConfiguredCombined(ordered);
      }

      setExpectedScanTypes(derived);
      setCurrentScanStep(0);
      setPendingOpenVerify(true);
    } catch {
      setExpectedScanTypes(
        Array.isArray(types)
          ? preferConfiguredCombined(types)
          : [],
      );
      setCurrentScanStep(0);
      setPendingOpenVerify(true);
    }
  };
  useEffect(() => {
    if (pendingOpenVerify) {
      setIsVerifyStickerModal(true);
      setPendingOpenVerify(false);
    }
  }, [pendingOpenVerify, expectedScanTypes]);
  const handleVerifyPackaging = () => {
    setSerialNumber("");
    setIsVerifyPackagingModal(true);
  };
  const closeVerifyPackagingModal = () => {
    setIsVerifyPackagingModal(false);
  };
  const handleVerifyStickerModal = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    const input = String(serialNumber || "").trim();
    if (!input) {
      toast.error("Sticker Verification Failed. Please try again.");
      isSubmitting.current = false;
      return;
    }

    const lc = (v: any) => String(v || "").trim().toLowerCase();
    const normalizeVerifyType = (value: any) => {
      const raw = String(value || "").trim().toLowerCase();
      if (!raw) return "";
      if (raw.startsWith("combined:")) {
        const parts = raw
          .slice("combined:".length)
          .split(",")
          .map((entry) => String(entry || "").trim().toLowerCase())
          .filter(Boolean);
        return parts.length > 1 ? `combined:${parts.join(",")}` : parts[0] || "";
      }
      if (raw.includes("serial")) return "serial";
      if (raw.includes("imei")) return "imei";
      if (raw.includes("ccid")) return "ccid";
      return raw;
    };
    const splitCombinedTokens = (value: any): string[] =>
      String(value || "")
        .split(/[\n\r,;|]+/)
        .map((entry) =>
          String(entry || "")
            .trim()
            .replace(/^["'`]+|["'`]+$/g, ""),
        )
        .filter(Boolean);
    const normalizeCombinedValue = (value: any) =>
      splitCombinedTokens(value)
        .map((entry) => entry.toLowerCase())
        .join(",");
    const normalizeCombinedToken = (value: any) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const matchCombinedByOrder = (expectedValues: string[], scannedValues: string[]) => {
      if (expectedValues.length === 0 || scannedValues.length === 0) return false;
      if (expectedValues.length !== scannedValues.length) return false;
      return expectedValues.every(
        (value, index) => normalizeCombinedToken(value) === normalizeCombinedToken(scannedValues[index]),
      );
    };

    const candidates: string[] = [];
    candidates.push(lc(input));

    let parsed: any = null;
    try {
      parsed = JSON.parse(input);
    } catch { }
    if (!parsed) {
      try {
        const u = new URL(input);
        const params: Record<string, string> = {};
        u.searchParams.forEach((val, key) => {
          params[key] = val;
        });
        parsed = params;
      } catch { }
    }
    if (!parsed) {
      const kvs: Record<string, string> = {};
      const lines = input.split(/[\n,&]/);
      lines.forEach((line) => {
        const m = line.match(/([^:=\s]+)\s*[:=]\s*(\S+)/);
        if (m) kvs[m[1]] = m[2];
      });
      if (Object.keys(kvs).length) parsed = kvs;
    }

    const getParsed = (k: string) => {
      if (!parsed) return "";
      const keys = [k, k.toLowerCase(), k.toUpperCase(), k.replace(/_/g, ""), k.replace(/-/g, "")];
      for (const key of keys) {
        if (parsed[key] !== undefined) return String(parsed[key]);
      }
      return "";
    };

    const currentVerifySpec = normalizeVerifyType(
      expectedScanTypes.length > 0 ? expectedScanTypes[currentScanStep] : "",
    );
    const combinedVerifyFields = currentVerifySpec.startsWith("combined:")
      ? currentVerifySpec
          .slice("combined:".length)
          .split(",")
          .map((entry) => String(entry || "").trim().toLowerCase())
          .filter(Boolean)
      : [];

    const getParsedByVerifyField = (fieldName: string) => {
      const normalized = String(fieldName || "").trim().toLowerCase();
      if (!normalized) return "";
      const aliasMap = new Set([normalized, normalized.replace(/[^a-z0-9]/g, "")]);
      if (normalized.includes("serial")) {
        ["serial", "serialno", "serial_no"].forEach((alias) => aliasMap.add(alias));
      }
      if (normalized.includes("imei")) {
        ["imei", "imei_no"].forEach((alias) => aliasMap.add(alias));
      }
      if (normalized.includes("ccid")) {
        ["ccid"].forEach((alias) => aliasMap.add(alias));
      }
      const aliasCandidates = Array.from(aliasMap.values());
      for (let i = 0; i < aliasCandidates.length; i += 1) {
        const value = getParsed(aliasCandidates[i]);
        if (value) return String(value);
      }
      return "";
    };

    const serialCandidates = [getParsed("serial_no"), getParsed("serialNo"), getParsed("serial")].filter(Boolean);
    const imeiCandidates = [getParsed("imei"), getParsed("imei_no"), getParsed("IMEI")].filter(Boolean);
    const ccidCandidates = [getParsed("ccid"), getParsed("CCID")].filter(Boolean);
    serialCandidates.forEach((v) => candidates.push(lc(v)));
    imeiCandidates.forEach((v) => candidates.push(lc(v)));
    ccidCandidates.forEach((v) => candidates.push(lc(v)));

    let explicitType: "serial" | "imei" | "ccid" | null = null;
    const presentTypes = [
      serialCandidates.length > 0 ? "serial" : null,
      imeiCandidates.length > 0 ? "imei" : null,
      ccidCandidates.length > 0 ? "ccid" : null,
    ].filter(Boolean) as ("serial" | "imei" | "ccid")[];
    if (presentTypes.length === 1) {
      explicitType = presentTypes[0]!;
    }

    const getCustomFieldValuesByType = (
      d: any,
      type: "serial" | "imei" | "ccid",
    ): string[] => {
      const cf = d?.customFields || d?.custom_fields || d?.customfields;
      let obj = cf;
      if (typeof obj === "string") {
        try {
          obj = JSON.parse(obj);
        } catch {
          obj = null;
        }
      }
      if (!obj || typeof obj !== "object") return [];
      const vals: string[] = [];
      const typeKey = type === "serial" ? "serial" : type;
      const collect = (o: any) => {
        Object.keys(o).forEach((k) => {
          const val = o[k];
          if (val && typeof val !== "object") {
            if (String(k).toLowerCase().includes(typeKey)) vals.push(lc(val));
          } else if (val && typeof val === "object") {
            collect(val);
          }
        });
      };
      collect(obj);
      return vals;
    };

    const resolveDeviceSerial = (d: any) =>
      lc(d?.serialNo || d?.serial_no || d?.deviceInfo?.serialNo);
    const verificationTargetSerial = String(
      verifyTargetSerialRef.current || searchResult || "",
    ).trim();
    let activeStickerDevice =
      deviceList.find((d: any) => resolveDeviceSerial(d) === lc(verificationTargetSerial)) ||
      (selectedDevice &&
      resolveDeviceSerial(selectedDevice) === lc(verificationTargetSerial)
        ? selectedDevice
        : null) ||
      null;

    if (
      !activeStickerDevice &&
      resolvedScanDeviceRef.current &&
      resolveDeviceSerial(resolvedScanDeviceRef.current) === lc(verificationTargetSerial)
    ) {
      activeStickerDevice = resolvedScanDeviceRef.current;
    }

    if (!activeStickerDevice && verificationTargetSerial && taskPlanId && currentUserId) {
      try {
        const optimized = await getOperatorTaskDevice(taskPlanId, currentUserId, {
          scanInput: verificationTargetSerial,
        });
        const resolvedDevice = optimized?.data?.device || optimized?.device || null;
        if (
          resolvedDevice &&
          resolveDeviceSerial(resolvedDevice) === lc(verificationTargetSerial)
        ) {
          activeStickerDevice = resolvedDevice;
          resolvedScanDeviceRef.current = resolvedDevice;
        }
      } catch {
        // Ignore refresh errors and continue with existing behavior.
      }
    }

    if (!activeStickerDevice) {
      toast.error(
        "Current serial context is missing. Scan/select the serial first, then verify sticker.",
      );
      isSubmitting.current = false;
      return;
    }

    const matchesCombinedScan = (d: any): boolean => {
      if (!d || combinedVerifyFields.length === 0) return false;
      const expectedCombinedValues = combinedVerifyFields.map((slug) =>
        resolveStickerValue(
          {
            type: "qrcode",
            sourceFields: [{ slug, name: slug }],
          },
          d,
        ),
      );
      if (
        expectedCombinedValues.length !== combinedVerifyFields.length ||
        expectedCombinedValues.some((value) => !normalizeCombinedToken(value))
      ) {
        return false;
      }

      const expectedCombined = normalizeCombinedValue(expectedCombinedValues.join(","));
      if (!expectedCombined) return false;

      const directCombined = normalizeCombinedValue(input);
      if (directCombined && directCombined === expectedCombined) {
        return true;
      }

      const scannedTokens = splitCombinedTokens(input);
      if (matchCombinedByOrder(expectedCombinedValues, scannedTokens)) {
        return true;
      }

      const parsedCombined = combinedVerifyFields
        .map((slug) => getParsedByVerifyField(slug))
        .filter((value) => String(value || "").trim() !== "");

      if (parsedCombined.length === combinedVerifyFields.length) {
        if (normalizeCombinedValue(parsedCombined.join(",")) === expectedCombined) {
          return true;
        }
        return matchCombinedByOrder(expectedCombinedValues, parsedCombined);
      }

      return false;
    };

    const matchesExplicit = (d: any): boolean => {
      if (!explicitType) return false;
      const serialVals = [d?.serialNo, d?.serial_no, d?.deviceInfo?.serialNo].map(lc).filter(Boolean);
      const imeiVals = [d?.imeiNo, d?.imei, d?.imei_no, d?.deviceInfo?.imei].map(lc).filter(Boolean);
      const ccidVals = [d?.ccid].map(lc).filter(Boolean);
      const cfSerial = getCustomFieldValuesByType(d, "serial");
      const cfImei = getCustomFieldValuesByType(d, "imei");
      const cfCcid = getCustomFieldValuesByType(d, "ccid");
      if (explicitType === "serial") {
        return serialCandidates.map(lc).some((c) => serialVals.includes(c) || cfSerial.includes(c));
      }
      if (explicitType === "imei") {
        return imeiCandidates.map(lc).some((c) => imeiVals.includes(c) || cfImei.includes(c));
      }
      if (explicitType === "ccid") {
        return ccidCandidates.map(lc).some((c) => ccidVals.includes(c) || cfCcid.includes(c));
      }
      return false;
    };

    const inMultiMode = expectedScanTypes.length > 1;
    const requiredType: "serial" | "imei" | "ccid" | "any" | null =
      combinedVerifyFields.length > 0
        ? null
        : expectedScanTypes.length > 0
          ? (normalizeVerifyType(expectedScanTypes[currentScanStep]) as any || "any")
          : null;

    const matchesRequiredOnly = (d: any): boolean => {
      if (!requiredType || requiredType === "any") {
        return false;
      }
      if (explicitType && explicitType !== requiredType) return false;
      const sn = [d?.serialNo, d?.serial_no, d?.deviceInfo?.serialNo].map(lc).filter(Boolean);
      const imei = [d?.imeiNo, d?.imei, d?.imei_no, d?.deviceInfo?.imei].map(lc).filter(Boolean);
      const ccid = [d?.ccid].map(lc).filter(Boolean);
      const raw = lc(input);
      const serialCands = serialCandidates.length > 0 ? serialCandidates.map(lc) : [raw];
      const imeiCands = imeiCandidates.length > 0 ? imeiCandidates.map(lc) : [raw];
      const ccidCands = ccidCandidates.length > 0 ? ccidCandidates.map(lc) : [raw];
      const cfVals = getCustomFieldValuesByType(d, requiredType as any);
      if (requiredType === "serial") {
        return serialCands.some((c) => sn.includes(c) || cfVals.includes(c));
      }
      if (requiredType === "imei") {
        return imeiCands.some((c) => imei.includes(c) || cfVals.includes(c));
      }
      if (requiredType === "ccid") {
        return ccidCands.some((c) => ccid.includes(c) || cfVals.includes(c));
      }
      return false;
    };

    const matchesAnyInput = (d: any): boolean => {
      const sn = [d?.serialNo, d?.serial_no, d?.deviceInfo?.serialNo]
        .map(lc)
        .filter(Boolean);
      const imei = [d?.imeiNo, d?.imei, d?.imei_no, d?.deviceInfo?.imei]
        .map(lc)
        .filter(Boolean);
      const ccid = [d?.ccid].map(lc).filter(Boolean);
      const anyDirect =
        sn.some((v) => candidates.includes(v)) ||
        imei.some((v) => candidates.includes(v)) ||
        ccid.some((v) => candidates.includes(v));
      if (anyDirect) return true;
      const fromCFAny = [
        ...getCustomFieldValuesByType(d, "serial"),
        ...getCustomFieldValuesByType(d, "imei"),
        ...getCustomFieldValuesByType(d, "ccid"),
      ];
      return fromCFAny.some((v) => candidates.includes(v));
    };

    const matchesInputForDevice = (d: any): boolean => {
      if (!d) return false;
      if (combinedVerifyFields.length > 0) {
        return matchesCombinedScan(d);
      }
      if (requiredType && requiredType !== "any") {
        return matchesRequiredOnly(d);
      }
      if (explicitType) {
        return matchesExplicit(d);
      }
      return matchesAnyInput(d);
    };

    const found = combinedVerifyFields.length > 0
      ? activeStickerDevice && matchesCombinedScan(activeStickerDevice)
        ? activeStickerDevice
        : undefined
      : matchesInputForDevice(activeStickerDevice)
        ? activeStickerDevice
        : undefined;

    if (found) {
      if (inMultiMode && currentScanStep < expectedScanTypes.length - 1) {
        const nextStep = currentScanStep + 1;
        const nextType = expectedScanTypes[nextStep] || "code";
        toast.success(`Code ${currentScanStep + 1} verified. Scan next: ${String(nextType).toUpperCase()}`);
        setCurrentScanStep(nextStep);
        setSerialNumber("");
        isSubmitting.current = false;
      } else {
        toast.success("Sticker Verification Successful.");
        setIsVerifiedSticker(true);
        setIsVerifyStickerModal(false);
        setExpectedScanTypes([]);
        setCurrentScanStep(0);
        verifyTargetSerialRef.current = "";
        try {
          setTimeout(() => {
            if (typeof document !== "undefined") {
              const el = document.getElementById("manual-verification-anchor");
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
        } catch { }
        isSubmitting.current = false;
      }
    } else {
      if (combinedVerifyFields.length > 0) {
        toast.error(
          `Sticker verification failed. Please scan the combined code for ${combinedVerifyFields
            .map((field) => field.toUpperCase())
            .join(", ")}.`,
        );
      } else {
        const activeSerial = String(
          activeStickerDevice?.serialNo ||
          activeStickerDevice?.serial_no ||
          verificationTargetSerial,
        ).trim();
        const matchedOtherDevice = deviceList.find((device: any) => {
          const serial = String(
            device?.serialNo || device?.serial_no || device?.deviceInfo?.serialNo || "",
          ).trim();
          if (!serial || lc(serial) === lc(activeSerial)) return false;
          return matchesInputForDevice(device);
        });
        if (matchedOtherDevice) {
          toast.error(
            `Scanned code belongs to ${matchedOtherDevice?.serialNo || matchedOtherDevice?.serial_no}. It does not match current serial ${activeSerial}.`,
          );
          isSubmitting.current = false;
          return;
        }

        if (inMultiMode && requiredType && requiredType !== "any") {
          toast.error(`Scan ${currentScanStep + 1} failed. Please scan ${String(requiredType).toUpperCase()}.`);
        } else {
          toast.error("Sticker Verification Failed. Please try again.");
        }
      }
      isSubmitting.current = false;
    }
  };
  const handleVerifyPackagingModal = () => {
    const matchedDevice = deviceList.find(
      (d: any) => d.serialNo?.toLowerCase() === serialNumber.toLowerCase(),
    );

    if (matchedDevice && matchedDevice.serialNo === searchResult) {
      toast.success("Packaging verified successfully!");
      setIsVerifiedPackaging(true);
      setIsVerifyPackagingModal(false);
      setSerialNumber("");
    } else {
      toast.error("Serial number does not match. Try again.");
    }
  };
  const handleSubmitScan = () => {
    alert("hello");
  };
  const handlePrintField = (index: number) => {
    let newValues = [...isScanValuePass];
    let buttonValues = [...isCheckValueButtonHide];
    if (scanValue[index] === searchResult) {
      newValues[index] = true;
      buttonValues[index] = true;
    } else {
      newValues[index] = false;
    }
    setCheckValueButtonHide(buttonValues);
    setIsScanValuePass(newValues);
  };
  const handleScanValue = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    let newValues = [...scanValue];
    newValues[index] = event.target.value;
    setScanValue(newValues);
  };
  const handleAddToCart = async (device: Device, packageData: any) => {
    try {
      const lastCarton = cartons[cartons.length - 1];

      if (!lastCarton || lastCarton.devices.length >= lastCarton.maxCapacity) {
        const pathname = window.location.pathname;
        const processId = pathname.split("/").pop() || "";

        const formData = new FormData();
        formData.append("processId", String(processId));
        formData.append(
          "cartonSize",
          JSON.stringify({
            length:
              packageData.length ||
              packageData.cartonLength ||
              packageData.depth ||
              packageData.cartonDepth,
            width: packageData.width || packageData.cartonWidth,
            height: packageData.height || packageData.cartonHeight,
          }),
        );
        formData.append("maxCapacity", String(packageData.maxCapacity));
        formData.append("status", "empty");
        formData.append("weightCarton", String(packageData.cartonWeight));
        const newCartonData = await createCarton(formData);
        const newCarton: any = {
          id: newCartonData.id,
          cartonSerial:
            newCartonData?.newCartonModel?.cartonSerial ||
            newCartonData?.cartonSerial ||
            "",
          devices: [device],
          maxCapacity: packageData.maxCapacity,
          cartonSize: {
            length:
              packageData.length ||
              packageData.cartonLength ||
              packageData.depth ||
              packageData.cartonDepth,
            width: packageData.width || packageData.cartonWidth,
            height: packageData.height || packageData.cartonHeight,
          },
          weight: packageData.cartonWeight,
          status: "partial",
        };

        setCartons([newCarton]);
        // Log cart creation + first device add as an operator event
        safeLogOperatorEvent(
          "PACKAGING_ADD_TO_CART",
          {
            cartonId: newCartonData.id,
            deviceSerial: device?.serialNo,
            maxCapacity: packageData.maxCapacity,
          },
          "OPERATION",
        );
      } else {
        setCartons((prev: any[]) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          last.devices = [...(last.devices || []), device];
          if (last.devices.length === last.maxCapacity) {
            last.status = "full";
          } else {
            last.status = "partial";
          }
          copy[copy.length - 1] = last;
          return copy;
        });
        // Log subsequent device add to existing carton
        const existingCarton = lastCarton;
        safeLogOperatorEvent(
          "PACKAGING_ADD_TO_CART",
          {
            cartonId: existingCarton?.cartonSerial || existingCarton?.id,
            deviceSerial: device?.serialNo,
          },
          "OPERATION",
        );
      }
    } catch (error: any) {
      console.error("Error Creating/Updating Carton", error?.message ?? error);
    }
  };
  const handleMoveToPackaging = () => {
    try {
      let formData = new FormData();
      formData.append("processID", processData._id);
      formData.append("processID", processData._id);
      formData.append("processID", processData._id);
      formData.append("processID", processData._id);
      formData.append("processID", processData._id);
      return false;
      // createCatron
      setIsVerifyStickerModal(false);
      setMoveToPackaging(true);
    } catch (error: any) {

    }
  };
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm">
        <Breadcrumb
          pageName={`${product?.name} - ${assignUserStage?.[0]?.name || assignUserStage?.stage || ""}`}
          parentName="Task Management"
        />
        {isDownTimeEnable && (
          <span className="bg-red-100 text-red-700 rounded-lg px-3 py-1 text-sm font-medium">
            On Hold
          </span>
        )}
      </div>
      <ToastContainer
        position="top-center"
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Seat Info + Last Sync bar */}
      <div className="mt-4 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-sm">
          <h5 className="text-gray-700 font-semibold">Seat Details:</h5>
          <p className="text-gray-800">
            Line Number: {operatorSeatInfo?.rowNumber}, Seat Number:{" "}
            {operatorSeatInfo?.seatNumber}
          </p>
        </div>

        {/* Last Sync button */}
        <button
          onClick={runSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95
            ${isSyncing
              ? "border-indigo-200 bg-indigo-50 text-indigo-400 cursor-not-allowed"
              : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm"
            }`}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""
              }`}
          />
          {isSyncing
            ? "Syncing..."
            : lastSyncTime
              ? `Last sync: ${lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Sync Now"}
        </button>
      </div>
      {/* Stats */}
      {!isCommonStageView && (
      <div className="mt-4 grid grid-cols-1 gap-4 px-6 md:grid-cols-4">
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-5 shadow">
          <h3 className="text-lg font-bold text-blue-700">UPH Target</h3>
          <div className="mt-2 space-y-1 text-sm text-blue-900">
              <p>
                <b>WIP Kits:</b> {wipKits}
              </p>
              <p>
                <b>Line issue kit:</b> {lineIssueKits}
              </p>
              <p>
                <b>Kits Shortage:</b> {kitsShortage}
              </p>
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-green-500 bg-green-50 p-5 shadow">
          <h3 className="text-lg font-bold text-green-700">Devices</h3>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <span>Tested: {overallTotalAttempts}</span>
            <span className="text-green-700">Pass: {overallTotalCompleted}</span>
            <span className="text-red-600">NG: {overallTotalNg}</span>
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-yellow-500 bg-yellow-50 p-5 shadow">
          <h3 className="text-lg font-bold text-yellow-700">Efficiency</h3>
          <p className="mt-2 text-sm">
            <b>Process:</b>{" "}
            {calculateEfficiency(
              overallTotalAttempts,
              (Array.isArray(assignUserStage) ? assignUserStage[0]?.upha : assignUserStage?.upha) || 0,
              timeDifference,
            )}
            %
          </p>
          <p className="text-sm">
            <b>Today:</b>{" "}
            {calculateEfficiency(
              totalAttempts,
              (Array.isArray(assignUserStage) ? assignUserStage[0]?.upha : assignUserStage?.upha) || 0,
              timeDifference,
            )}
            %
          </p>
        </div>
        <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-5 shadow">
          <h3 className="text-lg font-bold text-indigo-700">Overtime</h3>
          <div className="mt-2 flex flex-col gap-1 text-sm text-indigo-900">
            <span>
              <b>Active Windows:</b> {overtimeStats.totalWindows}
            </span>
            <span>
              <b>Total Minutes:</b> {overtimeStats.totalMinutes}
            </span>
            <span className="truncate" title={overtimeStats.nextEndsAt ? overtimeStats.nextEndsAt.toLocaleString() : "No active overtime window"}>
              <b>Next End:</b>{" "}
              {overtimeStats.nextEndsAt
                ? overtimeStats.nextEndsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Reference Videos section */}
      {(() => {
        const customStages = processData?.stages || [];
        const commonStages = processData?.commonStages || [];

        const allVideos: any[] = [];
        [...customStages, ...commonStages].forEach((stage: any) => {
          const links = Array.isArray(stage.videoLinks)
            ? stage.videoLinks
            : (stage.videoLink ? [stage.videoLink] : []);

          links.forEach((link: string, i: number) => {
            if (link && link.trim()) {
              allVideos.push({
                stageName: stage.stageName || stage.name,
                url: link,
                part: links.length > 1 ? i + 1 : null
              });
            }
          });
        });

        if (allVideos.length === 0) return null;

        return (
          <div className="mt-6 px-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2 text-red-600">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Process Help Videos</h3>
                      <p className="text-xs text-gray-500">Visual guides for each stage of production</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    {allVideos.length} Video{allVideos.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allVideos.map((video, idx) => (
                    <a
                      key={idx}
                      href={video.url.startsWith('http') ? video.url : `https://${video.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 rounded-xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:border-red-100 hover:bg-red-50/50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm group-hover:bg-red-50">
                        <Video className="h-5 w-5 text-red-500 transition-transform group-hover:scale-110" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-bold text-gray-700 group-hover:text-red-700">
                            {video.stageName} {video.part ? `(Part ${video.part})` : ''}
                          </h4>
                          <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="truncate text-[10px] text-gray-400 group-hover:text-red-400">
                          {video.url}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="px-6 pb-12">
        {isDownTimeEnable && (
          <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-10 shadow-2xl text-center max-w-lg border border-red-100">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-100 opacity-75"></div>
                <div className="relative rounded-full bg-red-50 p-6">
                  <Coffee className="h-16 w-16 text-red-600" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">System On Hold</h2>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1 text-orange-700 text-sm font-bold mb-4">
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                  DOWNTIME ACTIVE
                </div>

                <p className="text-gray-600 text-lg leading-relaxed">
                  This process is temporarily suspended due to
                  <strong className="text-red-700"> {getDownTimeVal?.description || getDownTimeVal?.downTimeType || "scheduled maintenance"}</strong>.
                </p>

                {getDownTimeVal?.to && (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Estimated Resume Time</span>
                    <span className="text-2xl font-black text-gray-800 tabular-nums">
                      {new Date(getDownTimeVal.to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 w-full border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500 italic">
                  Task inputs and timers are automatically paused. <br />
                  Please wait for the process to be resumed.
                </p>
              </div>
            </div>
          </div>
        )}

        {startTest ? (
          <DeviceTestComponent
            product={product}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            setStartTest={(val: boolean) => {
              setStartTest(val);
              localStorage.setItem("operator_startTest", String(val));
            }}
            timerDisplay={timerDisplay}
            setDevicePause={setDevicePause}
            deviceDisplay={deviceDisplay}
            deviceList={deviceList}
            expectedScanTypes={expectedScanTypes}
            currentScanStep={currentScanStep}
            setDeviceList={setDeviceList}
            checkedDevice={checkedDevice}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleNoResults={handleNoResults}
            getDeviceById={getDeviceById}
            resolveSearchQuery={resolveSearchQuery}
            setSearchResult={setSearchResult}
            setIsPassNGButtonShow={setIsPassNGButtonShow}
            setIsStickerPrinted={setIsStickerPrinted}
            searchResult={searchResult}
            deviceHistory={deviceHistory}
            notFoundError={notFoundError}
            openReportIssueModel={openReportIssueModel}
            isReportIssueModal={isReportIssueModal}
            handleSubmitReport={handleSubmitReport}
            closeReportIssueModal={closeReportIssueModal}
            setIssueType={setIssueType}
            setIssueDescription={setIssueDescription}
            processAssignUserStage={processAssignUserStage}
            isStickerPrinted={isStickerPrinted}
            isVerifiedSticker={isVerifiedSticker}
            setIsVerifiedSticker={setIsVerifiedSticker}
            isPassNGButtonShow={isPassNGButtonShow}
            isStatusSubmitting={isStatusSubmitting}
            handlePrintSticker={handlePrintSticker}
            handleVerifySticker={handleVerifySticker}
            isVerifyStickerModal={isVerifyStickerModal}
            handleVerifyStickerModal={handleVerifyStickerModal}
            closeVerifyStickerModal={closeVerifyStickerModal}
            serialNumber={serialNumber}
            setSerialNumber={setSerialNumber}
            handleUpdateStatus={handleUpdateStatus}
            processData={processData}
            planingAndScheduling={getPlaningAndScheduling}
            setCartons={setCartons}
            cartons={cartons}
            setIsCartonBarCodePrinted={setIsCartonBarCodePrinted}
            isCartonBarcodePrinted={isCartonBarcodePrinted}
            setProcessCartons={setProcessCartons}
            processCartons={processCartons}
            assignedTaskDetails={assignedTaskDetails}
            assignUserStage={assignUserStage}
            setIsDevicePassed={setIsDevicePassed}
            isdevicePassed={isdevicePassed}
            setAsssignDeviceDepartment={setAsssignDeviceDepartment}
            selectAssignDeviceDepartment={selectAssignDeviceDepartment}
            processStagesName={processStagesName}
            isAddedToCart={isAddedToCart}
            setIsAddedToCart={setIsAddedToCart}
            isVerifiedPackaging={isVerifiedPackaging}
            setIsVerifiedPackaging={setIsVerifiedPackaging}
            isVerifyPackagingModal={isVerifyPackagingModal}
            handleVerifyPackaging={handleVerifyPackaging}
            handleVerifyPackagingModal={handleVerifyPackagingModal}
            closeVerifyPackagingModal={closeVerifyPackagingModal}
            handlePrintCartonSticker={handlePrintCartonSticker}
            historyFilterDate={historyFilterDate}
            setHistoryFilterDate={setHistoryFilterDate}
            historySerialQuery={historySerialQuery}
            setHistorySerialQuery={setHistorySerialQuery}
            handlePauseResume={handlePauseResume}
            handleStop={handleStop}
            stageEligibility={stageEligibility}
            isDeviceHistoryLoading={isDeviceHistoryLoading}
            onTaskSummaryRefresh={refreshTaskSummaryNow}
          />
        ) : (
          <BasicInformation
            product={product}
            assignUserStage={assignUserStage}
            getPlaningAndScheduling={getPlaningAndScheduling}
            shift={shift}
            setStartTest={(val: boolean) => {
              setStartTest(val);
              localStorage.setItem("operator_startTest", String(val));
              if (val) handleStart();
            }}
            processAssignUserStage={processAssignUserStage}
            isDownTimeEnable={isDownTimeEnable}
          />
        )}
      </div>
    </div>
  );
};

export default ViewTaskDetailsComponent;








