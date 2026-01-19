"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import BasicInformation from "./BasicInformation";
import DeviceTestComponent from "./DeviceTestComponent";
import React, { useEffect, useState } from "react";
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
  getDeviceTestByDeviceId,
  updateStageByDeviceId,
  createReport,
  getOverallProgressByOperatorId,
  getOperatorTaskByUserID,
  createCarton,
} from "@/lib/api";
import { calculateTimeDifference } from "@/lib/common";
import SearchableInput from "@/components/SearchableInput/SearchableInput";

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
  const [assignedTaskDetails, setAssignedTaskDetails] = useState("");
  const [isScanModalOpen, setScanModalOpen] = useState(false);
  const [scanslug, setScanSlug] = useState("");
  const [isScanValuePass, setIsScanValuePass] = useState<boolean[]>([]);
  const [isCheckValueButtonHide, setCheckValueButtonHide] = useState<boolean[]>([]);
  const [scanValue, setScanValue] = useState<string[]>([]);
  const [moveToPackaging, setMoveToPackaging] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [startTest, setStartTest] = useState(false);
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
  const isSubmitting = React.useRef(false);
  const { SVG } = useQRCode();

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    // prefetch using helper
    const user = getCurrentUser();
    getDeviceTestEntry();
    getPlaningAndSchedulingByID(id);
    getOverallProgress(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const closeScanModal = () => {
    setScanModalOpen(false);
  };
  const handleCreatingCarton = async () => {
    try {
      // createCarton implementation
    } catch (error: any) {
      console.log(`Error Creating Carton`, error?.message ?? error);
    }
  };
  const getAssignedTask = async (id: any) => {
    try {
      let response = await getOperatorTaskByUserID(id);
      return response.task;
    } catch (error) {
      console.log(`Error Fetching Assigned Task:`, error);
    }
  };
  const closeVerifyStickerModal = () => {
    setIsVerifyStickerModal(!isVerifyStickerModal);
  };
  const getOverallProgress = async (id: any) => {
    try {
      const user = getCurrentUser();
      const data = { id, user_id: user?._id };
      let response = await getOverallProgressByOperatorId(data);
      let devices = response.data || [];
      setOverallTotalAttempts(devices.length);
    } catch (error: any) {
      console.log(`Error Fetching Device History`, error?.message ?? error);
    }
  };
  const getDeviceById = async (id: any) => {
    try {
      let result = await getDeviceTestByDeviceId(id);
      // return;
      if (result && result.status == 200) {
        setDeviceHistory(result.data);
      } else {
        setDeviceHistory([]);
      }
    } catch (error) {
      console.log(`Error Fetching Device History`, error);
    }
  };
  const getDeviceTestEntry = async () => {
    try {
      const userDetails = getCurrentUser();
      const result = await getDeviceTestEntryByOperatorId(userDetails?._id);
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
      console.log(`Error Fetching Devices`, error?.message ?? error);
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
      // console.log("result ===>", result?.data);
      const existingDevices = await getDeviceTestEntryOverall();
      const existingSerials = new Set(
        (existingDevices || [])
          .filter((device: any) => device.processId === pId && device.stageName === (assignStageToUser?.[0]?.name || assignStageToUser?.name))
          .map((device: any) => device.serialNo),
      );
      // console.log("Existing Serials:", existingSerials);
      // console.log("assignStageToUser?.[0]?.name  ==>", assignStageToUser?.[0]?.name);
      const filteredDeviceList = result?.data.filter(
        (device: any) =>
          !existingDevices.includes(device.serialNo) &&
          device.currentStage === (assignStageToUser?.[0]?.name || assignStageToUser?.name) &&
          // device.status !== "Pass" &&
          device.assignDeviceTo !== "TRC" &&
          device.assignDeviceTo !== "QC"
      );
      console.log("Filtered Device List:", filteredDeviceList);
      // set filtered list
      setDeviceList(filteredDeviceList);
    } catch (error) {
      console.error("Error Fetching Devices:", error);
    }
  };
  useEffect(() => {
    const savedTime = localStorage.getItem("elapsedTime");
    const savedDisplayItem = localStorage.getItem("deviceDisplayTime");
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
    setIsPaused(false);
    setTaskStaus(true);
    setIsDeviceSectionShow(true);
    setDevicePause(false);
  };
  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
    setDevicePause((prev) => !prev);
  };
  const handleStop = () => {
    setIsPaused(true);
    setTaskStaus(false);
  };
  const getProduct = async (id: any, assignStageToUser: any) => {
    try {
      let result = await getProductById(id);

      setSelectedProduct(result);
      return;
    } catch (error) {
      console.log("Error Fetching Product !", error);
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
      console.log("Error Fetching Processs !", error?.message ?? error);
    }
  };
  const getShiftByID = async (id: any) => {
    try {
      let result = await getShift(id);
      let diff = calculateTimeDifference(result?.startTime, result?.endTime);
      setTimeDifference(diff);
      setShift(result);
    } catch (error) {
      console.log("Error Fetching Shift", error);
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
      // console.log("assignStage from function ==>", assignStage);
      const currentUserName = user;
      const keys = Object.keys(assignOperator || {});
      const keysAssignStages = Object.keys(assignStage || {});
      let seatDetails: string | undefined;
      keys.forEach((value: string, index: number) => {
        if (assignOperator[value]?.[0]?._id === currentUserName?._id) {
          seatDetails = keys[index];
        }
      });
      const seatInfo = seatDetails?.split("-");
      if (seatInfo) {
        setOperatorSeatInfo({
          rowNumber: seatInfo[0],
          seatNumber: seatInfo[1],
        });
      }
      let assignStageToUser: any = null;
      keysAssignStages.forEach((value: string) => {
        if (value === seatDetails) {
          assignStageToUser = assignStage[value];
          setAssignUserStage(assignStage[value]);
        }
      });
      if (result?.status === "down_time_hold") {
        setIsDownTimeAvailable(true);
        setDownTimeVal(JSON.parse(result?.downTime || "{}"));
      }

      setSelectedProcess(result?.selectedProcess);
      fetchProcessByID(result?.selectedProcess, assignStageToUser);
      getShiftByID(result?.selectedShift);
      setPlaningAndScheduling(result);
    } catch (error: any) {
      console.log("error fetching planing and scheduling", error?.message ?? error);
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
      console.log("[handleUpdateStatus] Submission already in progress, ignoring duplicate call.");
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

        // console.log("testSteps ==>", testSteps);

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


        console.log("[ViewTask index] Submitting logs (converted from subStepResults) to DB:");
        console.log("  - Number of steps:", logs.length);
        let totalOriginalLogs = 0;
        let totalOptimizedLogs = 0;
        logs.forEach((log, idx) => {
          const originalCount = subStepResults[idx]?.data?.terminalLogs?.length || 0;
          const optimizedCount = log.logData?.terminalLogs?.length || 0;
          totalOriginalLogs += originalCount;
          totalOptimizedLogs += optimizedCount;
          console.log(`  - Step ${idx + 1} (${log.stepName}):`, {
            stepType: log.stepType,
            status: log.status,
            terminalLogs: `${optimizedCount} / ${originalCount} (${originalCount > 0 ? Math.round((1 - optimizedCount / originalCount) * 100) : 0}% reduced)`,
            hasParsedData: !!log.logData?.parsedData
          });
        });
        console.log(`  - Total logs: ${totalOptimizedLogs} / ${totalOriginalLogs} (${totalOriginalLogs > 0 ? Math.round((1 - totalOptimizedLogs / totalOriginalLogs) * 100) : 0}% reduction)`);
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
        logs: logs,
      };

      if (status === "NG") {
        // Use the passed argument 'deviceDepartment' which contains the selected NG assignment (QC, TRC, Previous Stage)
        payload.assignedDeviceTo = deviceDepartment || selectAssignDeviceDepartment || "";
      }

      let result = await createDeviceTestEntry(payload);

      if (result && result.status === 200) {
        setCheckedDevice((prev) => [
          ...prev,
          {
            deviceInfo: deviceInfo?.[0] || { serialNo: searchResult }, // Fallback if deviceInfo is missing
            stageName: stageData?.name,
            status,
            timeTaken: deviceDisplay,
          },
        ]);
        setTotalAttempts((prev) => prev + 1);
        if (status === "NG") {
          setTotalNg((prev) => prev + 1);
        } else {
          setTotalCompleted((prev) => prev + 1);
        }

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
      } else {
        toast.error(result?.message || "Error creating device test entry");
      }
    } catch (error: any) {
      console.log("error Creating Device Test Entry", error?.message ?? error);
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
    html2canvas(stickerElement as HTMLElement, {
      scale: window.devicePixelRatio,
      useCORS: true,
    }).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");

      const stickerWidthMM = 100; // Larger for carton
      const stickerHeightMM = 60;

      const printWindow = window.open("", "_blank");
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print Carton Sticker</title>
            <style>
              @media print {
                @page {
                  size: ${stickerWidthMM}mm ${stickerHeightMM}mm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  background-color: white;
                }
                img {
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  object-fit: contain;
                }
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
      printWindow?.document.close();
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
    const stickerElement = document.getElementById("sticker-preview");
    setIsVerifiedSticker(false);
    if (!stickerElement) return;
    html2canvas(stickerElement as HTMLElement, {
      scale: window.devicePixelRatio,
      useCORS: true,
    }).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");

      const stickerWidthMM = 50;
      const stickerHeightMM = 30;

      const printWindow = window.open("", "_blank");
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print Sticker</title>
            <style>
              @media print {
                @page {
                  size: ${stickerWidthMM}mm ${stickerHeightMM}mm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  background-color: white;
                }
                img {
                  width: ${stickerWidthMM}mm;
                  height: ${stickerHeightMM}mm;
                  object-fit: contain;
                }
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
                }, 500); // Small delay for proper rendering
              };
            </script>
          </body>
        </html>
      `);
      printWindow?.document.close();
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
      console.log(`Error Creating Carton`, error?.message);
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

      {/* Seat Info */}
      <div className="mt-4 flex items-center gap-2">
        <h5 className="text-md text-gray-700 font-semibold">Seat Details:</h5>
        <p className="text-gray-800 text-sm">
          Line Number: {operatorSeatInfo?.rowNumber}, Seat Number:{" "}
          {operatorSeatInfo?.seatNumber}
        </p>
      </div>
      {/* Stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-5 shadow">
          <h3 className="text-lg font-bold text-blue-700">Issued Kits</h3>
          <div className="mt-2 space-y-1 text-sm text-blue-900">
            <p>
              <b>WIP Kits:</b>{" "}
              {Math.max(
                0,
                parseInt(
                  String(
                    (Array.isArray(assignUserStage)
                      ? assignUserStage[0]?.totalUPHA
                      : assignUserStage?.totalUPHA) || 0,
                  ),
                ) - totalAttempts,
              )}
            </p>
            <p>
              <b>Line Issued Kits:</b>{" "}
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
            <span>Attempts: {totalAttempts}</span>
            <span className="text-green-700">Pass: {totalCompleted}</span>
            <span className="text-red-600">NG: {totalNg}</span>
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
      {startTest ? (
        <DeviceTestComponent
          product={product}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          setStartTest={setStartTest}
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
        />
      ) : (
        <BasicInformation
          product={product}
          assignUserStage={assignUserStage}
          getPlaningAndScheduling={getPlaningAndScheduling}
          shift={shift}
          setStartTest={setStartTest}
          processAssignUserStage={processAssignUserStage}
        />
      )}
    </div>
  );
};

export default ViewTaskDetailsComponent;
