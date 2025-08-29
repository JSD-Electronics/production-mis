"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DeviceTestComponent from "@/components/Operators/viewTask/DeviceTestComponent-old";
import React, { useEffect, useState } from "react";
import { useQRCode } from "next-qrcode";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
// import BarcodeScanner from "./codeScanner/index";
import dynamic from "next/dynamic";

const Html5QrcodeComponent = dynamic(() => import("./codeScanner/index"), {
  ssr: false,
});
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
const ViewTaskDetailsComponent = ({
  isFullScreenMode,
  setIsFullScreenMode,
}) => {
  const [getPlaningAndScheduling, setPlaningAndScheduling] = useState([]);
  const [product, setProduct] = useState({});
  const [shift, setShift] = useState({});
  const [selectedProduct, setSelectedProduct] = useState({});
  const [operatorDetails, setOperatorDetail] = useState([]);
  const [assignUserStage, setAssignUserStage] = useState({});
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
  const [deviceList, setDeviceList] = useState([]);
  const [choosenDevice, setChoosenDevice] = useState("");
  const [checkedDevice, setCheckedDevice] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [showOnScan, setShowOnScan] = useState(false);
  const [notFoundError, setNotFoundError] = useState("");
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [isDeviceSectionShow, setIsDeviceSectionShow] = useState(false);
  const [isReportIssueModal, setIsReportIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [searchedSerialNo, setSearchedSerialNo] = useState("");
  const [operatorSeatInfo, setOperatorSeatInfo] = useState("");
  const [isPassNGButtonShow, setIsPassNGButtonShow] = useState(false);
  const [isStickerPrinted, setIsStickerPrinted] = useState(false);
  const [isVerifyStickerModal, setIsVerifyStickerModal] = useState(false);
  const [isDownTimeEnable, setIsDownTimeAvailable] = useState(false);
  const [getDownTimeVal, setDownTimeVal] = useState({});
  const [processStatus, setProcessStatus] = useState("");
  const [processData, setProcessData] = useState({});
  const [processAssignUserStage, setProcessAssignUserStage] = useState({});
  const [selectedProcess, setSelectedProcess] = useState("");
  const [assignedTaskDetails, setAssignedTaskDetails] = useState("");
  const [isScanModalOpen, setScanModalOpen] = useState(false);
  const [scanslug, setScanSlug] = useState("");
  const [isScanValuePass, setIsScanValuePass] = useState([]);
  const [isCheckValueButtonHide, setCheckValueButtonHide] = useState([]);
  const [scanValue, setScanValue] = useState([]);
  const [moveToPackaging, setMoveToPackaging] = useState(false);
  const [cartons, setCartons] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const { SVG } = useQRCode();
  useEffect(() => {
    const pathname = window.location.pathname;
    let user = JSON.parse(localStorage.getItem("userDetails"));

    const id = pathname.split("/").pop();
    getDeviceTestEntry();
    getPlaningAndSchedulingByID(id);
    getOverallProgress(id);
  }, []);
  const closeScanModal = () => {
    setScanModalOpen(false);
  };
  const handleCreatingCarton = async () => {
    try {
      // createCatron
    } catch (error) {
      console.log(`Error Creating Carton`, error?.message);
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
      let user = JSON.parse(localStorage.getItem("userDetails"));
      let data = {
        id: id,
        user_id: user._id,
      };
      let response = await getOverallProgressByOperatorId(data);
      let devices = response.data;
      setOverallTotalAttempts(devices.length);
    } catch (error) {
      console.log(`Error Fetching Device History`, error);
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
      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      let result = await getDeviceTestEntryByOperatorId(userDetails._id);
      let devices = result.data;
      let deviceHistory = [];
      let ngCount = 0;
      let completedCount = 0;
      const updatedDeviceHistory = devices.map((value) => {
        if (value.status === "NG") {
          ngCount += 1;
        } else if (value.status === "Pass" || value.status === "Completed") {
          completedCount += 1;
        }
        return {
          deviceInfo: value,
          stageName: value?.stageName,
          status: value?.status,
          timeTaken: value?.timeConsumed,
        };
      });
      setTotalNg(ngCount);
      setTotalCompleted(completedCount);
      setTotalAttempts(devices.length);
      setCheckedDevice(updatedDeviceHistory);
      return updatedDeviceHistory;
    } catch (error) {
      console.log(`Error Fetching Devices`, error);
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
      const existingDevices = await getDeviceTestEntryOverall();
      const existingSerials = new Set(
        existingDevices
          .filter((device) => device.processId === pId)
          .map((device) => device.serialNo),
      );
      const filteredDeviceList = result?.data.filter(
        (device) =>
          //!existingSerials.has(device.serialNo) &&
          device.currentStage === assignStageToUser[0]?.name &&
          device.status !== "Pass",
      );
      setDeviceList(filteredDeviceList);
    } catch (error) {
      console.error("Error Fetching Devices:", error);
    }
  };
  useEffect(() => {
    const savedTime = localStorage.getItem("elapsedTime");
    const savedDisplayItem = localStorage.getItem("deviceDisplayTime");
    if (savedDisplayItem) {
      setElapsedDevicetime(Number(savedDisplayItem));
      setDeviceisplay(Number(savedDisplayItem));
    }
    if (savedTime) {
      setElapsedTime(Number(savedTime));
      setTimerDisplay(formatTime(Number(savedTime)));
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
      let user = JSON.parse(localStorage.getItem("userDetails"));
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      let formData = new FormData();
      formData.append("serialNo", searchedSerialNo);
      formData.append("reportedBy", user._id);
      formData.append("processId", id);
      formData.append("currentStage", assignUserStage?.stageName);
      formData.append("issueType", issueType);
      formData.append("issueDescription", issueDescription);
      console.log("formData ==>", formData);
      return;
      const response = await createReport(formData);
      if (response && response.status == 200) {
        setIsReportIssueModal(false);
        setSearchResult("");
        setSearchQuery("");
        return false;
      }
    } catch (error) {
      console.error(error?.message);
      // toast.error(
      //   error?.message || "An error occurred while creating the stage.",
      // );
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
      //   console.log("assignStageToUser ===>", assignStageToUser);
      //  return false;
      let result = await getProductById(id);

      setSelectedProduct(result);
      return;
    } catch (error) {
      console.log("Error Fetching Product !", error);
    }
  };
  const fetchProcessByID = async (id: any, assignStageToUser: any) => {
    try {
      let result = await getProcessByID(id);
      setProcessStatus(result?.status);
      setProcessData(result);
      let processStage = result?.stages.find((value) => {
        return value.stageName === assignStageToUser[0].name;
      });

      console.log("processStage ==>", processStage);
      setProcessAssignUserStage(processStage);
      getDevices(result?.selectedProduct, assignStageToUser, result?._id);
      getProduct(result.selectedProduct, assignStageToUser);
      setProduct(result);
    } catch (error) {
      console.log("Error Fetching Processs !", error);
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
      let result = await getPlaningAndSchedulingById(id);
      console.log("result ==> ", result);
      let user = JSON.parse(localStorage.getItem("userDetails"));
      let assignedTaskDetails = await getAssignedTask(user._id);
      let assignOperator, assignStage;
      if (assignedTaskDetails.stageType == "common") {
        assignOperator = JSON.parse(result?.assignedCustomStagesOp);
        assignStage = JSON.parse(result?.assignedCustomStages);
      } else {
        assignOperator = JSON.parse(result?.assignedOperators);
        assignStage = JSON.parse(result?.assignedStages);
      }
      let currentUserName = JSON.parse(localStorage.getItem("userDetails"));
      const keys = Object.keys(assignOperator);
      const keysAssignStages = Object.keys(assignStage);
      let seatDetails;
      Object.keys(assignOperator).map((value, index) => {
        if (assignOperator[value][0]._id == currentUserName._id) {
          seatDetails = keys[index];
        }
      });
      let seatInfo = seatDetails?.split("-");
      if (seatInfo) {
        setOperatorSeatInfo({
          rowNumber: seatInfo[0],
          seatNumber: seatInfo[1],
        });
      }
      let assignStageToUser;
      keysAssignStages.map((value, index) => {
        if (value == seatDetails) {
          assignStageToUser = assignStage[value];
          setAssignUserStage(assignStage[value][0]);
        }
      });
      if (result?.status == "down_time_hold") {
        setIsDownTimeAvailable(true);
        setDownTimeVal(JSON.parse(result?.downTime));
      }

      setSelectedProcess(result?.selectedProcess);
      fetchProcessByID(result?.selectedProcess, assignStageToUser);
      getShiftByID(result?.selectedShift);
      setPlaningAndScheduling(result);
    } catch (error) {
      console.log("error fetching planing and scheduling", error);
    }
  };
  const toggleFullScreenMode = () => {
    setIsFullScreenMode(!isFullScreenMode);
  };
  const handleChoosenDevice = (event) => {
    setChoosenDevice(event.target.value);
  };
  const handleUpdateStatus = async (status) => {
    try {
      let deviceInfo = deviceList.filter(
        (device) => device.serialNo === searchResult,
      );
      if (status === "Pass") {
        let formData1 = new FormData();
        const currentIndex = processData?.stages?.findIndex(
          (stage) => stage.stageName === assignUserStage?.name,
        );
        if (currentIndex != -1) {
          const nextStage =
            currentIndex < processData?.stages?.length - 1
              ? processData?.stages[currentIndex + 1]
              : null;
          if (nextStage) {
            formData1.append("currentStage", nextStage?.stageName);
          } else {
            const commonStages = processData?.commonStages;
            if (commonStages && commonStages.length > 0) {
              formData1.append("currentStage", commonStages[0]?.name);
              processData.commonStages.shift();
            } else {
              formData1.append("currentStage", assignUserStage?.name);
            }
          }
        }
        updateStageByDeviceId(deviceInfo[0]._id, formData1);
      }
      let formData = new FormData();
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();

      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      formData.append("deviceId", deviceInfo[0]._id);
      formData.append("processId", selectedProcess);
      formData.append("planId", id);
      formData.append("productId", selectedProduct?.product?._id);
      formData.append("operatorId", userDetails._id);
      formData.append("serialNo", deviceInfo[0].serialNo);
      formData.append(
        "seatNumber",
        operatorSeatInfo?.rowNumber + "-" + operatorSeatInfo?.seatNumber,
      );
      formData.append("stageName", assignUserStage?.name);
      formData.append("status", status);
      formData.append("timeConsumed", deviceDisplay);

      let result = await createDeviceTestEntry(formData);
      if (result && result.status == 200) {
        setCheckedDevice((prev) => [
          ...prev,
          {
            deviceInfo: deviceInfo[0],
            stageName: assignUserStage?.name,
            status,
            timeTaken: deviceDisplay,
          },
        ]);
        setTotalAttempts((prev) => prev + 1);
        if (status == "NG") {
          setTotalNg((prev) => prev + 1);
        } else {
          setTotalCompleted((prev) => prev + 1);
        }
        setIsPassNGButtonShow(false);
        setElapsedDevicetime(0);
        setDeviceisplay("00:00:00");
        getPlaningAndSchedulingByID(id);
        getDevices(result?.selectedProduct, assignUserStage, id);
        setSearchResult("");
        setSearchQuery("");
        toast.success(result.message || `Device ${status} Successfully!!`);
      } else {
        toast.error(result?.message || "error Creating Device Test Entry");
      }
    } catch (error) {
      console.log("error Creating Device Test Entry", error);
      toast.error(error?.message || "error Creating Device Test Entry");
    }
  };
  const handleNoResults = (query) => {
    console.log("No results found for:", query);
    setNotFoundError(`No results found for: ${query}`);
    setSearchedSerialNo(query);
  };
  const calculateEfficiency = (totalAttempts, upha, timeDifference) => {
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

    html2canvas(stickerElement, {
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
    setIsPassNGButtonShow(!isPassNGButtonShow);
    setIsStickerPrinted(!isStickerPrinted);
  };
  const handleVerifySticker = () => {
    setIsVerifyStickerModal(!isVerifyStickerModal);
  };
  const handleVerifyStickerModal = () => {
    setIsVerifyStickerModal(!isVerifyStickerModal);
  };
  const handleSubmitScan = () => {
    alert("hello");
  };
  const handlePrintField = (index: any) => {
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
  const handleScanValue = (index, event) => {
    let newValues = [...scanValue];
    newValues[index] = event.target.value;
    setScanValue(newValues);
  };
  const handleAddToCart = async (device: Device, packageData: any) => {
    try {
      let lastCarton = cartons[cartons.length - 1];

      if (!lastCarton || lastCarton.devices.length >= lastCarton.maxCapacity) {
        const pathname = window.location.pathname;
        const processId = pathname.split("/").pop();

        const formData = new FormData();
        formData.append("processId", processId || "");
        formData.append(
          "cartonSize",
          JSON.stringify({
            width: packageData.width,
            height: packageData.height,
          }),
        );
        formData.append("maxCapacity", packageData.maxCapacity.toString());
        formData.append("status", "empty");
        formData.append("weightCarton", packageData.cartonWeight.toString());
        const newCartonData = await createCarton(formData);
        const newCarton: Carton = {
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

        cartons.push(newCarton);
        console.log("New carton created and device added:", newCarton);
      } else {
        lastCarton.devices.push(device);
        if (lastCarton.devices.length === lastCarton.maxCapacity) {
          lastCarton.status = "full";
        } else {
          lastCarton.status = "partial";
        }
        console.log("Device added to existing carton:", lastCarton);
      }
    } catch (error: any) {
      console.error("Error Creating/Updating Carton", error?.message);
    }
  };
  // const handleAddToCart = async (packageData: any) => {
  //   console.log("packageData ==>", packageData);
  //   return false;
  //   try {
  //     const pathname = window.location.pathname;
  //     const id = pathname.split("/").pop();
  //     let cartonSize  = {
  //       width:packageData.width,
  //       height:packageData.height,
  //     }
  //     let formData = new FormData();
  //     formData.append("processId", id);
  //     formData.append("cartonSize", cartonSize);
  //     formData.append("maxCapacity", packageData.maxCapacity);
  //     formData.append("status", "empty");
  //     formData.append("weightCarton", packageData.cartonWeight);
  //     let result = await createCarton();
  //   } catch (error) {
  //      console.log(`Error Creating Carton`, error?.message);
  //   }
  // };
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
    } catch (error) {
      console.log(`Error Creating Carton`, error?.message);
    }
  };
  return (
    <>
      <div
        className="sticky z-10 bg-gray"
        style={
          isFullScreenMode
            ? { top: "80px" }
            : { top: "0px", padding: "0px 15px" }
        }
      >
        <Breadcrumb
          pageName={`${product?.name} - ${assignUserStage?.name}`}
          parentName="Task Management"
        />
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex items-center gap-2 py-1">
          <h5 className="text-lg">
            <strong>Seat Details :</strong>
          </h5>
          <p className="pt-1 text-sm text-black">
            Line Number : {operatorSeatInfo?.rowNumber} , Seat Number :{" "}
            {operatorSeatInfo?.seatNumber}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-l-6 border-secondary bg-blue-50 px-4 py-6 shadow-md">
            <h3 className="text-lg font-bold text-secondary">Issued Kits</h3>
            <p className="text-sm text-secondary">
              <p>
                <strong>WIP Kits :</strong>
                {parseInt(assignUserStage?.totalUPHA)}
              </p>
              <p>
                <strong>Line Issued Kits :</strong>
                {getPlaningAndScheduling?.assignedIssuedKits}
              </p>
              <p>
                <strong>Kits Shortage : </strong>
                {getPlaningAndScheduling?.assignedIssuedKits <
                parseInt(getPlaningAndScheduling?.processQuantity)
                  ? parseInt(getPlaningAndScheduling?.processQuantity) -
                    getPlaningAndScheduling?.assignedIssuedKits
                  : 0}
              </p>
            </p>
          </div>
          <div className="rounded-lg border border-l-6 border-green-500 bg-green-50 px-4 py-6 shadow-md">
            <h3 className="text-lg font-bold text-green-600">Devices</h3>
            <p className="text-xs text-green-800">
              <strong>Attempts : </strong>
              {totalAttempts}
            </p>
            <p className="text-xs text-green-800">
              <strong>Pass : </strong>
              {totalCompleted}
            </p>
            <p className="text-xs text-green-800">
              <strong>NG : </strong>
              {totalNg}
            </p>
          </div>
          <div className="rounded-lg border border-l-6 border-yellow-500 bg-yellow-50 px-4 py-6 shadow-md">
            <h3 className="text-lg font-bold text-yellow-600">Efficiency</h3>
            <p className="text-xs text-yellow-800">
              <strong>Process Efficiency : </strong>
              {calculateEfficiency(
                overallTotalAttempts,
                assignUserStage?.upha,
                timeDifference,
              )}
              %
            </p>
            <p className="text-xs text-yellow-800">
              <strong>Today Efficiency : </strong>{" "}
              {calculateEfficiency(
                totalAttempts,
                assignUserStage?.upha,
                timeDifference,
              )}
              %
            </p>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 min-h-screen px-6">
        <div className="mt-6 rounded-lg bg-white p-6 shadow-lg">
          <ToastContainer
            position="top-center"
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray px-2 py-2 text-center text-xs text-white"
                onClick={toggleFullScreenMode}
              >
                {isFullScreenMode ? (
                  <svg
                    height="15px"
                    width="15px"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M23 4C23 2.34315 21.6569 1 20 1H16C15.4477 1 15 1.44772 15 2C15 2.55228 15.4477 3 16 3H20C20.5523 3 21 3.44772 21 4V8C21 8.55228 21.4477 9 22 9C22.5523 9 23 8.55228 23 8V4Z"
                        fill="#0F0F0F"
                      ></path>{" "}
                      <path
                        d="M23 16C23 15.4477 22.5523 15 22 15C21.4477 15 21 15.4477 21 16V20C21 20.5523 20.5523 21 20 21H16C15.4477 21 15 21.4477 15 22C15 22.5523 15.4477 23 16 23H20C21.6569 23 23 21.6569 23 20V16Z"
                        fill="#0F0F0F"
                      ></path>{" "}
                      <path
                        d="M4 21H8C8.55228 21 9 21.4477 9 22C9 22.5523 8.55228 23 8 23H4C2.34315 23 1 21.6569 1 20V16C1 15.4477 1.44772 15 2 15C2.55228 15 3 15.4477 3 16V20C3 20.5523 3.44772 21 4 21Z"
                        fill="#0F0F0F"
                      ></path>{" "}
                      <path
                        d="M1 8C1 8.55228 1.44772 9 2 9C2.55228 9 3 8.55228 3 8L3 4C3 3.44772 3.44772 3 4 3H8C8.55228 3 9 2.55228 9 2C9 1.44772 8.55228 1 8 1H4C2.34315 1 1 2.34315 1 4V8Z"
                        fill="#0F0F0F"
                      ></path>{" "}
                    </g>
                  </svg>
                ) : (
                  <svg
                    fill="#000000"
                    height="15px"
                    width="15px"
                    version="1.1"
                    id="Capa_1"
                    viewBox="0 0 385.331 385.331"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <g>
                        <g id="Fullscreen_Exit">
                          <path d="M264.943,156.665h108.273c6.833,0,11.934-5.39,11.934-12.211c0-6.833-5.101-11.85-11.934-11.838h-96.242V36.181 c0-6.833-5.197-12.03-12.03-12.03s-12.03,5.197-12.03,12.03v108.273c0,0.036,0.012,0.06,0.012,0.084 c0,0.036-0.012,0.06-0.012,0.096C252.913,151.347,258.23,156.677,264.943,156.665z"></path>{" "}
                          <path d="M120.291,24.247c-6.821,0-11.838,5.113-11.838,11.934v96.242H12.03c-6.833,0-12.03,5.197-12.03,12.03 c0,6.833,5.197,12.03,12.03,12.03h108.273c0.036,0,0.06-0.012,0.084-0.012c0.036,0,0.06,0.012,0.096,0.012 c6.713,0,12.03-5.317,12.03-12.03V36.181C132.514,29.36,127.124,24.259,120.291,24.247z"></path>{" "}
                          <path d="M120.387,228.666H12.115c-6.833,0.012-11.934,5.39-11.934,12.223c0,6.833,5.101,11.85,11.934,11.838h96.242v96.423 c0,6.833,5.197,12.03,12.03,12.03c6.833,0,12.03-5.197,12.03-12.03V240.877c0-0.036-0.012-0.06-0.012-0.084 c0-0.036,0.012-0.06,0.012-0.096C132.418,233.983,127.1,228.666,120.387,228.666z"></path>{" "}
                          <path d="M373.3,228.666H265.028c-0.036,0-0.06,0.012-0.084,0.012c-0.036,0-0.06-0.012-0.096-0.012 c-6.713,0-12.03,5.317-12.03,12.03v108.273c0,6.833,5.39,11.922,12.223,11.934c6.821,0.012,11.838-5.101,11.838-11.922v-96.242 H373.3c6.833,0,12.03-5.197,12.03-12.03S380.134,228.678,373.3,228.666z"></path>{" "}
                        </g>
                        <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{" "}
                      </g>
                    </g>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between pb-2 pt-4">
              <h3 className="text-md text-md font-bold text-black">
                Process Details
              </h3>
              {isDownTimeEnable && (
                <div>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg bg-danger px-2 py-2 text-sm text-secondary text-white"
                  >
                    On Hold
                  </button>
                </div>
              )}
            </div>
            <hr className="pb-5 text-blue-500" />
            <div className="mb-4 grid sm:grid-cols-2">
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Process Name :</strong>{" "}
                {product?.name}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Stage Name :</strong>{" "}
                {assignUserStage?.name}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Shift :</strong>{" "}
                {getPlaningAndScheduling?.ProcessShiftMappings && (
                  <span>
                    ({getPlaningAndScheduling?.ProcessShiftMappings?.startTime}{" "}
                    - {getPlaningAndScheduling?.ProcessShiftMappings?.endTime})
                  </span>
                )}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Order Confirmation No:</strong>{" "}
                {product?.orderConfirmationNo}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Process ID:</strong>{" "}
                {product?.processID}
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                <strong className="font-medium">Shift Days:</strong>
                {"-"}
                {shift?.weekDays &&
                  Object.keys(shift?.weekDays)
                    .filter((day) => day !== "_id" && shift?.weekDays[day])
                    .map((day) => (
                      <span key={day}>
                        {day}
                        {", "}
                      </span>
                    ))}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Stage Description :</strong>{" "}
                {product?.descripition}
              </div>
            </div>
          </div>
          <h3 className="text-md text-md mb-1 mt-3 font-bold text-black">
            Steps to Perform
          </h3>
          <hr className="pb-4 text-blue-500" />
          <div className="grid grid-cols-2 pb-2">
            <div>
              <ul className="ml-3">
                {assignUserStage?.subSteps?.map((stage: any, index: any) => (
                  <li key={index} className="mt-2">
                    <p>
                      Step {index + 1} : {stage.stepName}
                    </p>
                    <div className="mt-2 flex grid grid-cols-2">
                      {stage?.stepType === "manual" ? (
                        stage?.stepFields?.validationType === "value" ? (
                          <div className="ml-3 text-sm">
                            <b>Value :</b> {stage?.stepFields?.value}
                          </div>
                        ) : (
                          <div className="ml-3 text-sm">
                            <b>Range From :</b> {stage?.stepFields?.rangeFrom} -{" "}
                            <b>Range To :</b> {stage?.stepFields?.rangeTo}
                          </div>
                        )
                      ) : (
                        <>
                          {stage?.jigFields?.map(
                            (jigStage: any, index: any) =>
                              jigStage?.validationType === "value" && (
                                <div className="ml-3 text-sm" key={index}>
                                  <b>{jigStage?.jigName} : </b>
                                  {jigStage?.value}
                                </div>
                              ),
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className=""></div>
            </div>
          </div>
          {shift?.intervals && (
            <>
              <h3 className="text-md mb-1 mt-3 font-bold text-black">
                Shift Summary
              </h3>
              <hr className="pb-4 text-blue-500" />
              <div className="mb-4 mt-2">
                <div className="flex flex-wrap justify-center gap-4">
                  {shift?.intervals?.map((interval, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 text-center shadow-md ${
                        interval.breakTime
                          ? "bg-[#fbc0c0] text-danger dark:bg-[#fbc0c0] dark:text-danger"
                          : "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900"
                      }`}
                    >
                      {interval.breakTime ? (
                        <p className="text-sm font-semibold">
                          Breaktime: {interval.startTime} - {interval.endTime}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold">
                          Interval: {interval.startTime} - {interval.endTime}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <DeviceTestComponent
            processStatus={processStatus}
            isDownTimeEnable={isDownTimeEnable}
            product={product}
            isDeviceSectionShow={isDeviceSectionShow}
            taskStatus={taskStatus}
            handleStart={handleStart}
            isPaused={isPaused}
            timerDisplay={timerDisplay}
            deviceDisplay={deviceDisplay}
            SearchableInput={SearchableInput}
            deviceList={deviceList}
            checkedDevice={checkedDevice}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleNoResults={handleNoResults}
            setSearchResult={setSearchResult}
            getDeviceById={getDeviceById}
            setIsPassNGButtonShow={setIsPassNGButtonShow}
            setIsStickerPrinted={setIsStickerPrinted}
            searchResult={searchResult}
            notFoundError={notFoundError}
            handlePauseResume={handlePauseResume}
            handleStop={handleStop}
            openReportIssueModel={openReportIssueModel}
            deviceHistory={deviceHistory}
            isReportIssueModal={isReportIssueModal}
            isStickerPrinted={isStickerPrinted}
            isPassNGButtonShow={isPassNGButtonShow}
            processAssignUserStage={processAssignUserStage}
            moveToPackaging={moveToPackaging}
            handleSubmitReport={handleSubmitReport}
            closeReportIssueModal={closeReportIssueModal}
            isVerifyStickerModal={isVerifyStickerModal}
            handleVerifyStickerModal={handleVerifyStickerModal}
            closeVerifyStickerModal={closeVerifyStickerModal}
            handleVerifySticker={handleVerifySticker}
            handlePrintSticker={handlePrintSticker}
            scanValue={scanValue}
            handleScanValue={handleScanValue}
            isCheckValueButtonHide={isCheckValueButtonHide}
            handlePrintField={handlePrintField}
            isScanValuePass={isScanValuePass}
            handleUpdateStatus={handleUpdateStatus}
            handleMoveToPackaging={handleMoveToPackaging}
            processData={processData}
            handleAddToCart={handleAddToCart}
            setIssueType={setIssueType}
            setIssueDescription={setIssueDescription}
            getDownTimeVal={getDownTimeVal}
            serialNumber={serialNumber}
            setSerialNumber={setSerialNumber}
          />
        </div>
      </div>
    </>
  );
};

export default ViewTaskDetailsComponent;
