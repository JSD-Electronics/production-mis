"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import BasicInformation from "./BasicInformation";
import DeviceTestComponent from "./DeviceTestComponent";
import React, { useEffect, useRef, useState } from "react";
import { useQRCode } from "next-qrcode";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
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
  getDeviceTestByDeviceId,
  updateStageByDeviceId,
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
import { RefreshCw, Video, ExternalLink } from "lucide-react";

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
    const user = getCurrentUser();
    getDeviceTestEntry();
    getPlaningAndSchedulingByID(id);
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

      // 1. Fetch all records for this process instance globally
      const recordResult = await getDeviceTestRecordsByProcessId(processId);
      const allRecords = recordResult.deviceTestRecords || [];

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
        if (targetStageNames.has(rStage)) {
          globalTested++;
          if (r.status === "Pass" || r.status === "Completed") globalPass++;
          else if (r.status === "NG" || r.status === "Fail") globalNg++;
        }
      });

      setOverallTotalCompleted(globalPass);
      setOverallTotalNg(globalNg);
      setOverallTotalAttempts(globalTested);

      // 4. Calculate WIP globally for these stages
      const stages = (processData?.stages || []).map((s: any) => s.stageName);
      const currentStageName = Array.from(targetStageNames)[0] as string;
      const currentStageIdx = stages.indexOf(currentStageName);

      let incomingCount = 0;
      if (currentStageIdx === 0) {
        // First stage: incoming is total kits targeted for this stage globally in the plan
        let totalTargetForStage = 0;
        Object.values(assignedStages).forEach((seatS: any) => {
          const arr = Array.isArray(seatS) ? seatS : [seatS];
          arr.forEach((s: any) => {
            if (targetStageNames.has((s.name || s.stageName)?.trim())) {
              totalTargetForStage += (s.totalUPHA || 0);
            }
          });
        });
        incomingCount = totalTargetForStage;
      } else if (currentStageIdx > 0) {
        // Subsequent stage: incoming is what passed in the PREVIOUS stage globally
        const prevStageName = stages[currentStageIdx - 1];
        allRecords.forEach((r: any) => {
          if ((r.name || r.stageName)?.trim() === prevStageName && (r.status === "Pass" || r.status === "Completed")) {
            incomingCount++;
          }
        });
      }

      const wip = incomingCount - globalTested;
      setWipKits(wip > 0 ? wip : 0);
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
        const hasQCResolved =
          Array.isArray(result.data) &&
          result.data.some((h: any) =>
            String(h?.status || "").toLowerCase().includes("qc resolved"),
          );

        const alreadyReset = resetDeviceIds.includes(String(id));
        const firstStageName =
          processData?.stages?.[0]?.stageName || processData?.stages?.[0]?.name || "";
        if (hasQCResolved && !alreadyReset && firstStageName) {
          try {
            const formData = new FormData();
            formData.append("currentStage", firstStageName);
            formData.append("status", "Resolved");
            await updateStageByDeviceId(String(id), formData);
            setResetDeviceIds((prev) => [...prev, String(id)]);
          } catch (e) {

          }
        }
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
      // result?.data contains product devices
      const targetStageName = (assignStageToUser?.[0]?.name || assignStageToUser?.name || "").trim();
      const filteredDeviceList = (result?.data || []).filter((device: any) => {
        const deviceStage = String(device?.currentStage || "").trim();
        const deviceProcessId = String(device?.processID || device?.processId || "");
        return (
          deviceStage === targetStageName &&
          deviceProcessId === String(pId)
        );
      });

      // set filtered list
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

      if (result?.status === "down_time_hold") {
        setIsDownTimeAvailable(true);
        setDownTimeVal(JSON.parse(result?.downTime || "{}"));
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
  const handleUpdateStatus = async (status: string, deviceDepartment: string, subStepResults?: any) => {
    if (isSubmitting.current) {

      return;
    }
    isSubmitting.current = true;
    try {
      // const stageData = Array.isArray(processAssignUserStage)
      //   ? processAssignUserStage[0]
      //   : processAssignUserStage;
      let deviceInfo = deviceList.filter((device: any) => device.serialNo === searchResult);
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
        await updateStageByDeviceId(deviceInfo[0]._id, formData1);
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

        const testSteps = processStageData?.subSteps?.filter(
          (s: any) => s.stepType === "jig" || s.stepType === "manual"
        ) || [];

        // 

        // Construct logs array based on new schema
        logs = Object.keys(subStepResults).map((key) => {
          const index = Number(key);
          const result = subStepResults[key]; // { status, reason, data, timeTaken }
          const stepDef = testSteps[index];

          // Optimize terminal logs to reduce payload size
          let terminalLogs = result.data?.terminalLogs || [];
          if (terminalLogs.length > 0) {
            // Keep only important logs: errors, success, info (config/decisions), and sample data
            const importantLogs = terminalLogs.filter((log: any) =>
              log.type === 'error' ||
              log.type === 'success' ||
              log.type === 'info' ||
              log.message.includes('Decision:') ||
              log.message.includes('Config:') ||
              log.message.includes('STARTING STEP')
            );

            // If we filtered too much, keep some data logs as samples
            if (importantLogs.length < 10 && terminalLogs.length > importantLogs.length) {
              const dataLogs = terminalLogs.filter((log: any) => log.type === 'data');
              // Add first and last few data logs
              const sampleDataLogs = [
                ...dataLogs.slice(0, 3),
                ...dataLogs.slice(-3)
              ];
              terminalLogs = [...importantLogs, ...sampleDataLogs]
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            } else {
              terminalLogs = importantLogs;
            }

            // Limit to max 50 logs per step
            if (terminalLogs.length > 50) {
              terminalLogs = [
                ...terminalLogs.slice(0, 25),
                { timestamp: '...', message: `[${terminalLogs.length - 50} logs omitted]`, type: 'info' },
                ...terminalLogs.slice(-25)
              ];
            }
          }

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
              timeTaken: result.timeTaken,
            },
            status: result.status,
            createdAt: new Date().toISOString(),
          };
        });


      }

      // Sync WIP counts in Planning and Scheduling record
      try {
        const planData = { ...getPlaningAndScheduling };
        if (planData) {
          const isCommon = assignedTaskDetails?.stageType === "common";
          const stageField = isCommon ? "assignedCustomStages" : "assignedStages";
          let assignedStages = JSON.parse(planData[stageField] || "{}");
          const currentSeatKey = operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber;

          // 1. Decrement current stage count and increment Pass/NG metrics
          if (assignedStages[currentSeatKey]) {
            const currentStageName = Array.isArray(assignUserStage) ? assignUserStage[0]?.name || assignUserStage[0]?.stageName : assignUserStage?.name || assignUserStage?.stageName;
            const stageIdx = assignedStages[currentSeatKey].findIndex((s: any) => (s.name || s.stageName) === currentStageName);
            if (stageIdx !== -1) {
              assignedStages[currentSeatKey][stageIdx].totalUPHA = Math.max(0, (assignedStages[currentSeatKey][stageIdx].totalUPHA || 0) - 1);

              if (status === "Pass") {
                assignedStages[currentSeatKey][stageIdx].passedDevice = (assignedStages[currentSeatKey][stageIdx].passedDevice || 0) + 1;
              } else {
                assignedStages[currentSeatKey][stageIdx].ngDevice = (assignedStages[currentSeatKey][stageIdx].ngDevice || 0) + 1;
              }

              // Update local state to reflect planning totals
              const updatedStage = assignedStages[currentSeatKey][stageIdx];
              setWipKits(updatedStage.totalUPHA || 0);
              setOverallTotalCompleted(updatedStage.passedDevice || 0);
              setOverallTotalNg(updatedStage.ngDevice || 0);
              setOverallTotalAttempts((updatedStage.passedDevice || 0) + (updatedStage.ngDevice || 0));
            }
          }

          // 2. If Passed, increment next stage count
          if (status === "Pass") {
            const currentIndex = processData?.stages?.findIndex((stage: any) => stage.stageName === stageData?.name);
            if (currentIndex !== -1 && currentIndex < processData?.stages?.length - 1) {
              const nextStageName = processData.stages[currentIndex + 1].stageName;
              // Find which seat handles the next stage
              for (const seatKey in assignedStages) {
                const nextStageIdx = assignedStages[seatKey].findIndex((s: any) => (s.name || s.stageName) === nextStageName);
                if (nextStageIdx !== -1) {
                  assignedStages[seatKey][nextStageIdx].totalUPHA = (assignedStages[seatKey][nextStageIdx].totalUPHA || 0) + 1;
                  break;
                }
              }
            }
          }

          const updatedPlanData = {
            ...planData,
            [stageField]: JSON.stringify(assignedStages)
          };

          await updatePlaningAndScheduling(updatedPlanData, id);
          setPlaningAndScheduling(updatedPlanData);

          // Also update the local assignUserStage state so the UI reflects it immediately
          if (assignedStages[currentSeatKey]) {
            setAssignUserStage(assignedStages[currentSeatKey]);
          }
        }
      } catch (e) {
        console.error("WIP count sync failed:", e);
      }

      // Build JSON payload
      const payload: any = {
        deviceId: deviceInfo?.[0]?._id || "",
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
        // Use the passed argument 'deviceDepartment' which contains the selected NG assignment (QC, TRC, Previous Stage)
        payload.assignedDeviceTo = deviceDepartment || selectAssignDeviceDepartment || "";
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

        // Refresh seat-wise stats from Planning and overall counts
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
  const handlePrintCartonSticker = () => {
    const stickerElement = document.getElementById("carton-sticker-preview");
    if (!stickerElement) {
      toast.error("Carton sticker preview not found");
      return;
    }

    const actualSticker = stickerElement.querySelector('[data-sticker-width]');
    const widthPx = actualSticker ? parseInt(actualSticker.getAttribute('data-sticker-width') || '400') : 400;
    const heightPx = actualSticker ? parseInt(actualSticker.getAttribute('data-sticker-height') || '250') : 250;

    const stickerWidthMM = Math.round(widthPx * 0.264583) || 100;
    const stickerHeightMM = Math.round(heightPx * 0.264583) || 60;

    html2canvas(stickerElement as HTMLElement, {
      scale: 3,
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
              @page {
                size: ${stickerWidthMM}mm ${stickerHeightMM}mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                width: ${stickerWidthMM}mm;
                height: ${stickerHeightMM}mm;
                background-color: white;
                -webkit-print-color-adjust: exact;
              }
              img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
              }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="Sticker">
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
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
    const stickerRoot = document.getElementById("sticker-preview");
    setIsVerifiedSticker(false);
    if (!stickerRoot) return;

    const stickerElement = (stickerRoot.querySelector('.actual-sticker-container') || stickerRoot) as HTMLElement;
    const widthPx = parseInt(stickerElement.getAttribute('data-sticker-width') || '300');
    const heightPx = parseInt(stickerElement.getAttribute('data-sticker-height') || '150');
    const stickerWidthMM = Math.round(widthPx * 0.264583);
    const stickerHeightMM = Math.round(heightPx * 0.264583);

    html2canvas(stickerElement, {
      scale: 3,
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
            <style>
              @page { size: ${stickerWidthMM}mm ${stickerHeightMM}mm; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
              img { width: ${stickerWidthMM}mm; height: ${stickerHeightMM}mm; display: block; }
            </style>
          </head>
          <body>
            <img src="${imageData}">
            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); window.close(); }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
    setIsPassNGButtonShow(false);
    setIsStickerPrinted(!isStickerPrinted);
  };
  const handleVerifySticker = () => {
    setSerialNumber("");
    setIsVerifyStickerModal(true);
  };
  const handleVerifyPackaging = () => {
    setSerialNumber("");
    setIsVerifyPackagingModal(true);
  };
  const closeVerifyPackagingModal = () => {
    setIsVerifyPackagingModal(false);
  };
  const handleVerifyStickerModal = () => {
    const matchedDevice = deviceList.find(
      (d: any) => d.serialNo?.toLowerCase() === serialNumber.toLowerCase(),
    );

    if (matchedDevice && matchedDevice.serialNo === searchResult) {
      toast.success("Sticker verified successfully!");
      setIsVerifiedSticker(true);
      setIsVerifyStickerModal(false);
    } else {
      toast.error("Serial number does not match. Try again.");
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
          />
        )}
      </div>
    </div>
  );
};

export default ViewTaskDetailsComponent;
