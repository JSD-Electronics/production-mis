"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import BasicInformation from "./BasicInformation";
import DeviceTestComponent from "./DeviceTestComponent";
import React, { useEffect, useRef, useState } from "react";
import { useQRCode } from "next-qrcode";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { printStickerElements } from "@/lib/sticker/printSticker";
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
  updateStageByDeviceId,
  updateStageBySerialNo,
  createReport,
  getOverallProgressByOperatorId,
  getOperatorTaskByUserID,
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

// Utility: safely read current user from localStorage
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("userDetails");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

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
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [choosenDevice, setChoosenDevice] = useState("");
  const [checkedDevice, setCheckedDevice] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [showOnScan, setShowOnScan] = useState(false);
  const [notFoundError, setNotFoundError] = useState("");
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [isDeviceSectionShow, setIsDeviceSectionShow] = useState(false);
  const [isReportIssueModal, setIsReportIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [searchedSerialNo, setSearchedSerialNo] = useState("");
  const [operatorSeatInfo, setOperatorSeatInfo] = useState<any>(null);
  const [isPassNGButtonShow, setIsPassNGButtonShow] = useState(false);
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
  const { SVG } = useQRCode();
  const [historyFilterDate, setHistoryFilterDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [operatorSessionId, setOperatorSessionId] = useState<string | null>(null);

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
          // Non-fatal – we'll try to create a new one
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

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    // prefetch using helper
    getDeviceTestEntry();

    // Fetch planning data with background polling for status updates
    getPlaningAndSchedulingByID(id);
    const intervalId = setInterval(() => {
      getPlaningAndSchedulingByID(id);
    }, 15000); // Check every 15 seconds

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilterDate]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    if (getPlaningAndScheduling && assignUserStage && processData) {
      getOverallProgress(id);
    }
  }, [getPlaningAndScheduling, assignUserStage, processData]);

  // ── Shared sync function (used by interval + manual button) ─────────────────
  const runSync = async () => {
    setIsSyncing(true);
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();

      // 1. Today's per-operator counts
      await getDeviceTestEntry();

      // 2. Seat-wise overall counts from fresh planning data
      if (id) {
        try {
          const freshPlan = await getPlaningAndSchedulingById(id);
          if (freshPlan) {
            setPlaningAndScheduling(freshPlan);
            const isCommon = assignedTaskDetails?.stageType === "common";
            const stageField = isCommon ? "assignedCustomStages" : "assignedStages";
            const assignedStages = JSON.parse(freshPlan[stageField] || "{}");
            const seatKey = operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber;
            const seatStages = Array.isArray(assignedStages[seatKey])
              ? assignedStages[seatKey]
              : assignedStages[seatKey] ? [assignedStages[seatKey]] : [];

            // Counts are now handled globally in getOverallProgress which is triggered by setPlaningAndScheduling
          }
        } catch (e) { /* ignore */ }
      }

      await getOverallProgress(id);

      // 3. Refresh the searchable device list
      if (selectedProduct?._id && assignUserStage && selectedProcess) {
        try {
          await getDevices(
            selectedProduct._id || selectedProduct?.product?._id,
            assignUserStage,
            selectedProcess,
          );
        } catch (e) { /* ignore */ }
      }

      setLastSyncTime(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Auto-refresh counts every 30 s ─────────────────────────────────────────
  const autoRefreshIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const startPolling = () => {
      if (autoRefreshIdRef.current) clearInterval(autoRefreshIdRef.current);
      autoRefreshIdRef.current = setInterval(runSync, 30_000);
    };
    startPolling();
    return () => {
      if (autoRefreshIdRef.current) clearInterval(autoRefreshIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedTaskDetails, operatorSeatInfo, selectedProduct, selectedProcess]);

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
    setIsVerifyStickerModal(!isVerifyStickerModal);
  };
  const getOverallProgress = async (id: any) => {
    try {
      if (!getPlaningAndScheduling) return;
      const processId = getPlaningAndScheduling.selectedProcess;
      if (!processId) return;

      // 1. Fetch latest records per device/stage for this plan
      let allRecords: any[] = [];
      try {
        const recordResult = await getLatestDeviceTestsByPlanId(id, processId);
        allRecords = recordResult?.deviceTestRecords || [];
      } catch (e) {
        const recordResult = await getDeviceTestRecordsByProcessId(processId);
        const rawRecords = recordResult?.deviceTestRecords || [];
        allRecords = rawRecords.filter(
          (record: any) => String(record?.planId) === String(id),
        );
      }

      // 2. Identify current stages assigned to this seat
      const isCommon = assignedTaskDetails?.stageType === "common";
      const stageField = isCommon ? "assignedCustomStages" : "assignedStages";
      const assignedStages = JSON.parse(getPlaningAndScheduling?.[stageField] || "{}");
      const seatKey = operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber;

      const seatStages = Array.isArray(assignedStages?.[seatKey])
        ? assignedStages[seatKey]
        : (assignedStages?.[seatKey] ? [assignedStages[seatKey]] : []);

      const targetStageNames = new Set(seatStages.map((s: any) => (s.name || s.stageName)?.trim()).filter(Boolean));
      if (targetStageNames.size === 0) return;

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

      // 4. Calculate WIP globally for these stages
      const stages = (processData?.stages || []).map((s: any) => s.stageName);
      const currentStageName = Array.from(targetStageNames)[0] as string;
      const currentStageIdx = stages.indexOf(currentStageName);

      const issuedKits = parseInt(getPlaningAndScheduling?.assignedIssuedKits || "0", 10) || 0;
      if (issuedKits > 0) {
        const totalDone = globalPass + globalNg;
        setWipKits(Math.max(issuedKits - totalDone, 0));
      } else {
        // Fallback: calculate total WIP based on totalUPHA for the assigned stages
        let totalWipFromUPHA = 0;
        Object.values(assignedStages).forEach((seatS: any) => {
          const arr = Array.isArray(seatS) ? seatS : [seatS];
          arr.forEach((s: any) => {
            if (targetStageNames.has((s.name || s.stageName)?.trim())) {
              totalWipFromUPHA += (s.totalUPHA || 0);
            }
          });
        });
        setWipKits(totalWipFromUPHA);
      }
      setOverallTotalCompleted(globalPass);
      setOverallTotalNg(globalNg);
      setOverallTotalAttempts(globalTested);
    } catch (error: any) {
      console.error("Error fetching process-wide progress:", error);
    }
  };

  const getDeviceById = async (id: any) => {
    try {
      let result = await getDeviceTestByDeviceId(id);
      // return;
      if (result && result.status == 200) {
        setDeviceHistory(result.data);
        // QC/TRC resolution should not auto-reset currentStage here.
      } else {
        setDeviceHistory([]);
      }
    } catch (error) {

    }
  };

  const getDeviceTestEntry = async () => {
    try {
      const userDetails = getCurrentUser();
      const result = await getDeviceTestEntryByOperatorId(userDetails?._id, historyFilterDate);
      let devices = result.data;

      let deviceHistory = [];
      let ngCount = 0;
      let completedCount = 0;
      const updatedDeviceHistory = devices.map((value: any) => {
        if (value.status === "NG") {
          ngCount += 1;
        } else if (value.status === "Pass" || value.status === "Completed") {
          completedCount += 1;
        }
        return {
          deviceInfo: value,
          stageName: value?.stageName,
          status: value?.status,
          assignedDeviceTo: value?.assignedDeviceTo,
          timeTaken: value?.timeConsumed,
        };
      });
      setTotalNg(ngCount);
      setTotalCompleted(completedCount);
      setTotalAttempts(devices.length);
      setCheckedDevice(updatedDeviceHistory);
      return updatedDeviceHistory;
    } catch (error: any) {
      if (error?.status === 404) {
        setCheckedDevice([]);
        setTotalNg(0);
        setTotalCompleted(0);
        setTotalAttempts(0);
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
  const getDevices = async (id: any, assignStageToUser: any, pId: any) => {
    try {
      const result = await getDeviceByProductId(id);
      // Keep all non-NG devices for this process in the search source.
      // WIP kits may not sit on the exact current stage, but they should still be searchable.
      const filteredDeviceList = (result?.data || []).filter((device: any) => {
        const deviceProcessId = String(device?.processID || device?.processId || "");
        const deviceStatus = String(device?.status || "").trim().toLowerCase();
        return deviceProcessId === String(pId) && deviceStatus !== "ng";
      });

      setDeviceList(filteredDeviceList);
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
      getDevices(result?.selectedProduct, assignStageToUser, result?._id);
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
      const result = await getPlaningAndSchedulingById(id);
      const user = getCurrentUser();
      const assignedTaskDetails = await getAssignedTask(user?._id);
      setAssignedTaskDetails(assignedTaskDetails);

      let assignOperator: any = {};
      let assignStage: any = {};
      if (assignedTaskDetails?.stageType === "common") {
        assignOperator = JSON.parse(result?.assignedCustomStagesOp || "{}");
        assignStage = JSON.parse(result?.assignedCustomStages || "{}");
      } else {
        assignOperator = JSON.parse(result?.assignedOperators || "{}");
        assignStage = JSON.parse(result?.assignedStages || "{}");
      }

      const currentUserId = user?._id;
      const keys = Object.keys(assignOperator || {});
      let seatDetails: string | undefined;

      // Robust seat identification: search through all operators at each seat
      for (const seatKey of keys) {
        const operators = assignOperator[seatKey];
        if (Array.isArray(operators) && operators.some((op: any) => op._id === currentUserId)) {
          seatDetails = seatKey;
          break;
        }
      }

      if (seatDetails) {
        const seatInfo = seatDetails.split("-");
        setOperatorSeatInfo({
          rowNumber: seatInfo[0],
          seatNumber: seatInfo[1],
        });

        if (assignStage[seatDetails]) {
          const seatStages = assignStage[seatDetails];
          setAssignUserStage(seatStages);

          setSelectedProcess(result?.selectedProcess);
          fetchProcessByID(result?.selectedProcess, seatStages);
        }
      }

      const currentStatus = result?.processStatus || result?.status;
      if (currentStatus === "down_time_hold") {
        setIsDownTimeAvailable(true);
        const dt = typeof result?.downTime === 'string' ? JSON.parse(result.downTime) : result.downTime;
        setDownTimeVal(dt || {});
      } else {
        setIsDownTimeAvailable(false);
      }

      getShiftByID(result?.selectedShift);
      setPlaningAndScheduling(result);
    } catch (error: any) {
      console.error("Error fetching planning data:", error);
    }
  };
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
    try {
      // const stageData = Array.isArray(processAssignUserStage)
      //   ? processAssignUserStage[0]
      //   : processAssignUserStage;
      let deviceInfo = deviceList.filter((device: any) => device.serialNo === searchResult);
      const deviceId = deviceInfo?.[0]?._id || "";
      // Find current stage index
      const stageData = Array.isArray(assignUserStage)
        ? assignUserStage[0]
        : assignUserStage;

      if (status === "Pass") {
        // setIsPassNGButtonShow(false);
        setIsStickerPrinted(false);
        setIsVerifiedSticker(false);
        setIsAddedToCart(false);
        setIsVerifiedPackaging(false);
        setIsDevicePassed(true);
        let formData1 = new FormData();

        // Find current stage index
        const currentIndex = processData?.stages?.findIndex((stage: any) => stage.stageName === stageData?.name);

        if (currentIndex !== -1) {
          const nextStage =
            currentIndex < processData?.stages?.length - 1
              ? processData?.stages[currentIndex + 1]
              : null;
          if (nextStage) {
            formData1.append("currentStage", nextStage?.stageName);
          } else {
            const commonStages = processData?.commonStages || [];
            if (commonStages.length > 0) {
              formData1.append("currentStage", String(commonStages[0].stageName || ""));
              formData1.append(
                "commonStages",
                JSON.stringify((commonStages || []).map((cs: any) => cs.stageName)),
              );
            } else {
              formData1.append("currentStage", assignUserStage?.name);
            }
          }
        }
        // Update device stage
        if (deviceId) {
          await updateStageByDeviceId(deviceId, formData1);
        } else if (searchResult) {
          await updateStageBySerialNo(searchResult, formData1);
        } else {
          toast.error("Device not found. Please re-search the serial.");
          isSubmitting.current = false;
          return;
        }
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
        serialNo: deviceInfo?.[0]?.serialNo || "",
        seatNumber: operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber,
        stageName: stageData?.name ?? "",
        status: status,
        timeConsumed: deviceDisplay,
        totalBreakTime: String(totalBreakTime),
        startTime: operatorStartTime,
        endTime: new Date().toISOString(),
        logs: logs,
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

      let result = await createDeviceTestEntry(payload);

      if (result && (result.status === 200 || result.status === 201)) {
        // Prepend to show at top of "Recent Activity"
        setCheckedDevice((prev) => [
          {
            deviceInfo: deviceInfo?.[0] || { serialNo: searchResult },
            stageName: stageData?.name,
            status,
            timeTaken: deviceDisplay,
            createdAt: new Date().toISOString()
          },
          ...prev,
        ]);

        setTotalAttempts((prev) => prev + 1);
        if (status === "NG") {
          setTotalNg((prev) => prev + 1);
        } else {
          setTotalCompleted((prev) => prev + 1);
        }

        // Refresh the entire planning and progress state from server to ensure accuracy
        getPlaningAndSchedulingByID(id);
        getOverallProgress(id);

        // Robustly remove the device from the searchable list
        // This ensures that for Pass AND NG (assigned to QC, TRC, etc.), the device is removed.
        const serialToRemove = deviceInfo?.[0]?.serialNo || searchResult;
        if (serialToRemove) {
          setDeviceList((prev) => prev.filter((device: any) => device.serialNo !== serialToRemove));
        }

        // Reset UI for next device
        setElapsedDevicetime(0);
        setDeviceisplay("00:00:00");
        setSearchQuery("");
        setNotFoundError("");
        setSearchResult("");
        setIsPassNGButtonShow(false);
        setIsDevicePassed(false);
        setIsStickerPrinted(false);
        setIsVerifiedSticker(false);
        setIsAddedToCart(false);
        setIsVerifiedPackaging(false);

        toast.success(result.message || `Device ${status} Successfully!!`);
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
      if (!res.ok) toast.error("Unable to print sticker");
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
                : "Sticker preview not found",
            );
          }
        })
        .catch(() => {
          toast.error("Failed to print sticker");
        });
      setIsPassNGButtonShow(false);
      setIsStickerPrinted(!isStickerPrinted);
    };
    tryPrint(0);
  };
  const handleVerifySticker = (types?: string[]) => {
    setSerialNumber("");
    try {
      const uniq = (arr: string[]) =>
        Array.from(new Set(arr.filter((v) => !!v))).map((v) => String(v).toLowerCase());
      let derived: string[] = Array.isArray(types) ? [...types] : [];
      // Fallback: derive from current device data if config scan didn't produce multiple
      if (!Array.isArray(types) || types.length <= 1) {
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
        if (hasImei) ordered.push("imei");
        if (hasCcid) ordered.push("ccid");
        if (hasSerial) ordered.push("serial");
        derived = uniq([...derived, ...ordered]);
      } else {
        derived = uniq(derived);
      }
      setExpectedScanTypes(derived);
      setCurrentScanStep(0);
      setPendingOpenVerify(true);
    } catch {
      setExpectedScanTypes(Array.isArray(types) ? types : []);
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
  const handleVerifyStickerModal = () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    const input = String(serialNumber || "").trim();
    if (!input) {
      toast.error("Sticker Verification Failed. Please try again.");
      isSubmitting.current = false;
      return;
    }

    const lc = (v: any) => String(v || "").trim().toLowerCase();
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

    const serialCandidates = [getParsed("serial_no"), getParsed("serialNo"), getParsed("serial")].filter(Boolean);
    const imeiCandidates = [getParsed("imei"), getParsed("imei_no"), getParsed("IMEI")].filter(Boolean);
    const ccidCandidates = [getParsed("ccid"), getParsed("CCID")].filter(Boolean);
    serialCandidates.forEach((v) => candidates.push(lc(v)));
    imeiCandidates.forEach((v) => candidates.push(lc(v)));
    ccidCandidates.forEach((v) => candidates.push(lc(v)));

    // Decide if this scan specifies an exact field (for multi-code stickers)
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

    // Enforce slug-specific verification even for single barcode
    const inMultiMode = expectedScanTypes.length > 1;
    const requiredType: "serial" | "imei" | "ccid" | "any" | null = expectedScanTypes.length > 0
      ? (expectedScanTypes[currentScanStep] as any || "any")
      : null;

    const matchesRequiredOnly = (d: any): boolean => {
      if (!requiredType || requiredType === "any") {
        // fall back to generic logic below
        return false;
      }
      // If scan provided explicit type but it's not the one required, block
      if (explicitType && explicitType !== requiredType) return false;
      // Evaluate by required field only
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

    const found = deviceList.find((d: any) => {
      // Enforce required type if provided by sticker config
      if (requiredType && requiredType !== "any") {
        return matchesRequiredOnly(d);
      }

      // If explicit field was identified from scan, enforce exact-field verification
      if (explicitType) {
        return matchesExplicit(d);
      }

      const sn = [d?.serialNo, d?.serial_no, d?.deviceInfo?.serialNo].map(lc).filter(Boolean);
      const imei = [d?.imeiNo, d?.imei, d?.imei_no, d?.deviceInfo?.imei].map(lc).filter(Boolean);
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
    });

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
      if (inMultiMode && requiredType && requiredType !== "any") {
        toast.error(`Scan ${currentScanStep + 1} failed. Please scan ${String(requiredType).toUpperCase()}.`);
      } else {
        toast.error("Sticker Verification Failed. Please try again.");
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
            width: packageData.width,
            height: packageData.height,
            depth: packageData.depth || packageData.cartonDepth,
          }),
        );
        formData.append("maxCapacity", String(packageData.maxCapacity));
        formData.append("status", "empty");
        formData.append("weightCarton", String(packageData.cartonWeight));
        const newCartonData = await createCarton(formData);
        const newCarton: any = {
          id: newCartonData.id,
          devices: [device],
          maxCapacity: packageData.maxCapacity,
          cartonSize: {
            width: packageData.width,
            height: packageData.height,
            depth: packageData.depth || packageData.cartonDepth,
          },
          weight: packageData.cartonWeight,
          status: "partial",
        };

        setCartons((prev: any[]) => [...prev, newCarton]);
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
            ? "Syncing…"
            : lastSyncTime
              ? `Last sync: ${lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Sync Now"}
        </button>
      </div>
      {/* Stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 px-6 md:grid-cols-3">
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-5 shadow">
          <h3 className="text-lg font-bold text-blue-700">UPH Target</h3>
          <div className="mt-2 space-y-1 text-sm text-blue-900">
            <p>
              <b>WIP Kits:</b> {wipKits}
            </p>
            <p>
              <b>Line issue kit:</b>{" "}
              {getPlaningAndScheduling?.assignedIssuedKits}
            </p>
            <p>
              <b>Kits Shortage:</b>{" "}
              {Math.max(
                0,
                parseInt(getPlaningAndScheduling?.processQuantity) -
                getPlaningAndScheduling?.assignedIssuedKits,
              )}
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
      </div>

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
            handlePrintSticker={handlePrintSticker}
            handleVerifySticker={handleVerifySticker}
            isVerifyStickerModal={isVerifyStickerModal}
            handleVerifyStickerModal={handleVerifyStickerModal}
            closeVerifyStickerModal={closeVerifyStickerModal}
            serialNumber={serialNumber}
            setSerialNumber={setSerialNumber}
            handleUpdateStatus={handleUpdateStatus}
            processData={processData}
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
            handlePauseResume={handlePauseResume}
            handleStop={handleStop}
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

