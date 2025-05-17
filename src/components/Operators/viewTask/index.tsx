"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useEffect, useState } from "react";
import { useQRCode } from "next-qrcode";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { ToastContainer } from "react-toastify";
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
} from "@/lib/api";
import { calculateTimeDifference } from "@/lib/common";
import SearchableInput from "@/components/SearchableInput/SearchableInput";
import Modal from "@/components/Modal/page";
import { Result } from "postcss";
import StickerGenerator from "./StickerGenerator";
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
  const [isPassNGButtonShow, setIsPassNGButtonShow] = useState(true);
  const [isStickerPrinted, setIsStickerPrinted] = useState(false);
  const [isVerifyStickerModal, setIsVerifyStickerModal] = useState(false);
  const [isDownTimeEnable, setIsDownTimeAvailable] = useState(false);
  const [getDownTimeVal, setDownTimeVal] = useState({});
  const [processStatus, setProcessStatus] = useState('');
  const [processData, setProcessData] = useState({});
  const [selectedProcess, setSelectedProcess] = useState("");
  const { SVG } = useQRCode();
  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getDeviceTestEntry();
    getPlaningAndSchedulingByID(id);
    getOverallProgress(id);
  }, []);
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
  const getDeviceTestEntryOverall = async () =>{
    try {
      const result = await getOverallDeviceTestEntry();
      return result.DeviceTestEntry;
    } catch (error) {
      console.error("Error Fetching Devices:", error);
    }
  };
  const getDevices = async (id: any, assignStageToUser: any) => {
    try {
      const result = await getDeviceByProductId(id);
      const existingDevices = await getDeviceTestEntryOverall();
      const existingSerials = new Set(
        existingDevices.filter(device => device.processID
           === selectedProcess).map(device => device.serialNo)
      );
      const filteredDeviceList = result?.data.filter(device =>
        !existingSerials.has(device.serialNo) &&
        device.currentStage === assignStageToUser[0]?.name &&
        device.status !== "Pass"
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
      const response = await createReport(formData);
      if (response && response.status == 200) {
        setIsReportIssueModal(false);
        setSearchResult("");
        setSearchQuery("");
        return false;
      }
    } catch (error) {
      console.error(error);
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
      let result = await getProductById(id);
      result?.product?.stages?.map((value: any, index: any) => {
        if (assignStageToUser[0].name == value.stageName) {
          value.totalUPHA = assignStageToUser[0].totalUPHA;
          setAssignUserStage(value);
        }
      });
      setSelectedProduct(result);
      return;
    } catch (error) {
      console.log("Error Fetching Product !", error);
    }
  };
  const fetchProcessByID = async (id: any, assignStageToUser: any) => {
    try {
      let result = await getProcessByID(id);
      setProcessStatus(result?.status)
      getDevices(result?.selectedProduct, assignStageToUser);
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
      let currentUserName = JSON.parse(localStorage.getItem("userDetails"));
      let assignOperator = JSON.parse(result?.assignedOperators);
      let assignStage = JSON.parse(result?.assignedStages);
      const keys = Object.keys(assignOperator);
      const keysAssignStages = Object.keys(assignStage);
      let seatDetails;
      Object.keys(assignOperator).map((value, index) => {
        if (assignOperator[value][0]._id == currentUserName._id) {
          seatDetails = keys[index];
        }
      });
      let seatInfo = seatDetails.split("-");
      setOperatorSeatInfo({
        rowNumber: seatInfo[0],
        seatNumber: seatInfo[1],
      });
      let assignStageToUser;
      keysAssignStages.map((value, index) => {
        if (value == seatDetails) {
          assignStageToUser = assignStage[value];
        }
      });
      if (result?.status == "down_time_hold") {
        setIsDownTimeAvailable(true);
        setDownTimeVal(JSON.parse(result?.downTime));
      }
      setProcessData(result);
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
        const currentIndex = selectedProduct?.product?.stages?.findIndex(
          (stage) => stage.stageName === assignUserStage?.stageName
        );

        if (currentIndex !== -1) {
          const nextStage = currentIndex < selectedProduct?.product?.stages?.length - 1
          ? selectedProduct?.product?.stages[currentIndex + 1]: null;

          if (nextStage) {
            formData1.append("currentStage", nextStage?.stageName);
          } else {
            const commonStages = selectedProduct?.product?.commonStages;
            if (commonStages && commonStages.length > 0) {
              formData1.append("currentStage", commonStages[0]?.stageName);
              selectedProduct.product.commonStages.shift();
            } else {
              formData1.append("currentStage", assignUserStage?.stageName);
            }
          }
        }


        updateStageByDeviceId(deviceInfo[0]._id, formData1);
      }

      // if (status === "Pass") {
      //   let formData1 = new FormData();
      //   const currentIndex = selectedProduct?.product?.stages?.findIndex(
      //     (stage) => stage.stageName === assignUserStage?.stageName,
      //   );

      //   const nextStage = currentIndex !== -1 && currentIndex < selectedProduct?.product?.stages?.length - 1 ? selectedProduct?.product?.stages[currentIndex + 1] : null; 

      //   if (nextStage) {
      //     formData1.append("currentStage", nextStage?.stageName);
      //   } else {
      //     formData1.append("currentStage", assignUserStage?.stageName);
      //   }
      //   updateStageByDeviceId(deviceInfo[0]._id,formData1);
      // }
      let formData = new FormData();
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();

      let userDetails = JSON.parse(localStorage.getItem("userDetails"));
      formData.append("deviceId", deviceInfo[0]._id);
      formData.append("planId", id);
      formData.append("productId", selectedProduct?.product?._id);
      formData.append("operatorId", userDetails._id);
      formData.append("serialNo", deviceInfo[0].serialNo);
      formData.append("seatNumber", operatorSeatInfo?.rowNumber+'-'+operatorSeatInfo?.seatNumber);
      formData.append("stageName", assignUserStage?.stageName);
      formData.append("status", status);
      formData.append("timeConsumed", deviceDisplay);

      let result = await createDeviceTestEntry(formData);
      if (result && result.status == 200) {
        setCheckedDevice((prev) => [
          ...prev,
          {
            deviceInfo: deviceInfo[0],
            stageName: assignUserStage?.stageName,
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
      }
    } catch (error) {
      console.log("error Creating Device Test Entry", error);
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
          pageName={`${product?.name
          } - ${assignUserStage?.stageName}`}
          parentName="Task Management"
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
              <p><strong>WIP Kits :</strong>{assignUserStage[0] ? assignUserStage?.totalUPHA - getPlaningAndScheduling?.assignedIssuedKits : assignUserStage?.totalUPHA}</p>
              <p><strong>Line Issued Kits :</strong>{getPlaningAndScheduling?.assignedIssuedKits}</p>
              <p><strong>Kits Shortage : </strong>{ getPlaningAndScheduling?.assignedIssuedKits < parseInt(getPlaningAndScheduling?.processQuantity) ? parseInt(getPlaningAndScheduling?.processQuantity) -  getPlaningAndScheduling?.assignedIssuedKits : 0 }</p>
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
            <div className="flex justify-between pt-4 pb-2 items-center">
              <h3 className="text-md text-md font-bold text-black">
                Process Details
              </h3>
              {isDownTimeEnable && (
                <div>
                    <button type="button" className="flex items-center justify-center gap-2 rounded-lg bg-danger px-2 py-2 text-sm text-secondary text-white">On Hold</button>
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
                {assignUserStage?.stageName}
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

          <h3 className="text-md text-md mb-1 mt-3 font-bold text-black">
            Standard Operating Procedure (SOP)
          </h3>
          <hr className="pb-4 text-blue-500" />

          { processStatus == "active" ? (
          !isDownTimeEnable  ? (
            <>
              <div className="pb-3">
                <div>
                  {product?.sopFile ? (
                    <div>
                      <button
                        type="button"
                        className="rounded-md bg-blue-700 p-2 px-5 py-2 text-white"
                      >
                        View SOP File{" "}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-center">No SOP Found</div>
                  )}
                </div>
              </div>
              {isDeviceSectionShow && (
                <div>
                  <div className="flex items-end justify-between">
                    <h3 className="text-md text-md mb-1 mt-3 font-bold text-black">
                      Devices
                    </h3>
                    <p className="timer text-black">
                      <b>Elapsed Time : </b>
                      <span id="timer-display">{timerDisplay}</span>
                    </p>
                  </div>
                  <hr className="pb-4 text-blue-500" />
                  <div className="pb-3">
                    <div className="grid grid-cols-2">
                      <div className="flex justify-center">
                        <div className="w-full">
                          <div className="flex items-end justify-end pr-3">
                            <p className="timer text-black">
                              <b>Testing Time: </b>
                              <span id="timer-display">{deviceDisplay}</span>
                            </p>
                          </div>
                          <div className={`${isPaused && "blur"}`}>
                            <div className="px-4 py-1 ">
                              <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                                Device
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
                              />
                            </div>
                            {searchResult !== "" ? (
                              <div className="px-4 py-4 ">
                                <h3 className="text-md pb-2 font-bold">
                                  {searchResult}
                                </h3>
                                {deviceHistory.length > 0 && (
                                  <div className="pt-4">
                                    <h5 className="font-bold">
                                      Previous Stages Summary
                                    </h5>
                                    <hr className="pb-4 text-blue-500" />
                                    <table className="px-2 ">
                                      <tr>
                                        <th className="w-40">Serial No</th>
                                        <th className="w-40">Stage Name</th>
                                        <th className="w-40">Status</th>
                                      </tr>
                                      {deviceHistory.map((value, index) => (
                                        <tr key={index} className="text-center">
                                          <td>{value?.serialNo}</td>
                                          <td>{value?.stageName}</td>
                                          <td
                                            className={`py-1 ${value?.status === "Pass" ? "text-green-500" : value?.status === "NG" ? "text-danger" : ""}`}
                                          >
                                            {value?.status}
                                          </td>
                                        </tr>
                                      ))}
                                    </table>
                                  </div>
                                )}
                                {!isStickerPrinted &&
                                  !isPassNGButtonShow &&
                                  assignUserStage?.subSteps?.some(
                                    (subStep: any) => subStep.isPrinterEnable,
                                  ) && (
                                    <>
                                      {assignUserStage.subSteps.map(
                                        (subStep: any, subIndex: number) =>
                                          subStep.isPrinterEnable
                                            ? subStep.printerFields.map(
                                                (
                                                  printerField: any,
                                                  printerIndex: number,
                                                ) => (
                                                  <div
                                                    id="sticker-preview"
                                                    key={`${subIndex}-${printerIndex}`}
                                                    className="bg-gray-100 flex items-center justify-center"
                                                  >
                                                    <StickerGenerator
                                                      stickerData={printerField}
                                                      deviceData={deviceList.filter(
                                                        (device: any) =>
                                                          device.serialNo ===
                                                          searchResult,
                                                      )}
                                                    />
                                                  </div>
                                                ),
                                              )
                                            : null,
                                      )}
                                      <div className="flex justify-center">
                                        <button
                                          className="mt-4 rounded-lg bg-primary px-4 py-2 text-white"
                                          onClick={handlePrintSticker}
                                        >
                                          Print Sticker
                                        </button>
                                      </div>
                                    </>
                                  )}
                                <div className="flex justify-center">
                                  {isStickerPrinted && (
                                    <>
                                      <button
                                        type="button"
                                        className="rounded-lg bg-green-600 px-4 py-2 text-white"
                                        onClick={handleVerifySticker}
                                      >
                                        Verify Sticker
                                      </button>

                                      <Modal
                                        isOpen={isVerifyStickerModal}
                                        onSubmit={handleVerifyStickerModal}
                                        onClose={closeVerifyStickerModal}
                                        title="Verify Sticker"
                                      >
                                        <div className="">
                                          <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                            Choose Issue Type
                                          </label>
                                        </div>
                                      </Modal>
                                    </>
                                  )}
                                </div>
                                {!isStickerPrinted && isPassNGButtonShow && (
                                  <>
                                    <div className="flex justify-center gap-2 p-6">
                                      <button
                                        className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-white hover:bg-blue-400"
                                        type="button"
                                        onClick={() =>
                                          handleUpdateStatus("Pass")
                                        }
                                      >
                                        <svg
                                          width="20px"
                                          height="20px"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="#ffffff"
                                        >
                                          <path
                                            d="M4 12.6111L8.92308 17.5L20 6.5"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                        Pass
                                      </button>
                                      <button
                                        className="flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-white hover:bg-danger"
                                        type="button"
                                        onClick={() => handleUpdateStatus("NG")}
                                      >
                                        <svg
                                          width="20px"
                                          height="20px"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          stroke="#ffffff"
                                        >
                                          <path
                                            d="M16 8L8 16M8 8L16 16"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        NG
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-center px-10 py-5">
                                  <p>{notFoundError}</p>
                                </div>
                                {notFoundError != "" && (
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      className="btn rounded-md bg-black px-2.5 py-2 text-white"
                                      onClick={openReportIssueModel}
                                    >
                                      Report issue
                                    </button>
                                    <Modal
                                      isOpen={isReportIssueModal}
                                      onSubmit={handleSubmitReport}
                                      onClose={closeReportIssueModal}
                                      title="Report Issue"
                                    >
                                      <div className="">
                                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                          Choose Issue Type
                                        </label>
                                        <select
                                          className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                                          onChange={(e) =>
                                            setIssueType(e.target.value)
                                          }
                                        >
                                          <option value="">
                                            Please Select
                                          </option>
                                          <option value="not_found">
                                            Device Not Found
                                          </option>
                                          <option value="technical_fault">
                                            Technical Fault{" "}
                                          </option>
                                        </select>
                                      </div>
                                      <div className="pt-5">
                                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                          Description
                                        </label>
                                        <textarea
                                          rows={6}
                                          onChange={(e) =>
                                            setIssueDescription(e.target.value)
                                          }
                                          placeholder="Default textarea"
                                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        ></textarea>
                                      </div>
                                    </Modal>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div
                          className="h-35 w-full overflow-y-auto rounded-lg border border-stroke"
                          style={{ height: "247px" }}
                        >
                          <div className="p-4">
                            <h3 className="text-center font-bold">
                              Tested Device history
                            </h3>
                          </div>
                          <div>
                            <table className="px-2">
                              <tr>
                                <th className="w-40">Serial No</th>
                                <th className="w-40">Stage Name</th>
                                <th className="w-40">Status</th>
                                <th className="w-40">Time</th>
                              </tr>
                              {checkedDevice.map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className="rounded-lg p-1 text-center"
                                >
                                  <td className="py-1">
                                    {row?.deviceInfo?.serialNo}
                                  </td>
                                  <td className="py-1">{row?.stageName}</td>
                                  <td
                                    className={`py-1 ${row?.status === "Pass" ? "text-green-500" : row?.status === "NG" ? "text-danger" : ""}`}
                                  >
                                    {row?.status}
                                  </td>
                                  <td className="py-1">{row?.timeTaken}</td>
                                </tr>
                              ))}
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-center space-x-4">
                {!taskStatus ? (
                  <button
                    className="rounded-md bg-green-500 px-4 py-2 text-white"
                    onClick={handleStart}
                    disabled={!isPaused}
                  >
                    Start
                  </button>
                ) : (
                  <>
                    <button
                      className="rounded-md bg-yellow-500 px-4 py-2 text-white"
                      onClick={handlePauseResume}
                    >
                      {isPaused ? "Break Off" : "Break"}
                    </button>
                    <button
                      className="rounded-md bg-danger px-4 py-2 text-white"
                      onClick={handleStop}
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </>
          ):(
            <>
              <div className="flex justify-center items-center py-4">
                  <p className="text-danger">The process has been on hold from {getDownTimeVal?.downTimeFrom} to {getDownTimeVal?.downTimeTo} due to {getDownTimeVal?.downTimeDesc}.</p>
              </div>
            </>
          )): (
            <>
              <div className="flex justify-center items-center py-4">
                  <p className="text-danger">The process is currently {processStatus}</p>
              </div>
            </>
          )
          }
        </div>
      </div>
    </>
  );
};

export default ViewTaskDetailsComponent;
