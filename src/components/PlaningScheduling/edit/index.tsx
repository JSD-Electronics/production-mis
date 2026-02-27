"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import FormComponent from "@/components/PlaningScheduling/edit/FormComponents";
import DraggableGridItem from "@/components/PlaningScheduling/edit/DraggableGridItem";
import {
  viewRoom,
  getProductById,
  viewProcess,
  viewShift,
  getUpdateStatus,
  getOperatorsForPlan,
  updatePlaningAndScheduling,
  checkPlanningAndScheduling,
  getPlaningAndSchedulingById,
  fetchHolidays,
  createProcessLogs,
  createAssignedJigs,
  fetchJigsById,
  updateProcess,
  viewJigCategory,
  createAssignedOperatorsToPlan,
  updateJigStatus,
  updateDownTimeProcess,
  updateProcessStatus,
} from "@/lib/api";
import { formatDate } from "@/lib/common";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Modal from "@/components/Modal/page";
import ConfirmationPopup from "@/components/Confirmation/page";
import { Clock, Calendar, Coffee, UserPlus, Settings, Wrench } from "lucide-react";
import { FaClock, FaCogs, FaLayerGroup, FaClipboardList, FaBox } from "react-icons/fa";

const EditPlanSchedule = () => {
  const router = useRouter();
  const [shiftTime, setShiftTime] = useState(0);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [process, setProcess] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [roomPlan, setRoomPlan] = useState<any[]>([]);
  const [assignedStages, setAssignedStages] = useState<any>({});
  const [startDate, setStartDate] = useState("");
  const [totalTimeEstimation, setTotalTimeEstimation] = useState("");
  const [totalUPHA, setTotalUPHA] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [repeatCount, setRepeatCount] = useState<any>("");
  const [operators, setOperators] = useState<any[]>([]);
  const [assignedOperators, setAssignedOperators] = useState<any>({});
  const [assignedCustomOperators, setAssignedCustomOperators] = useState<any[]>(
    [],
  );
  const [filteredOperators, setFilteredOperators] = useState<any[]>([]);
  const [productName, setProductName] = useState("");
  const [downTimeFrom, setDownTimeFrom] = useState("");
  const [downTimeTo, setDownTimeTo] = useState("");
  const [downTimeDesc, setDownTimeDescription] = useState("");
  const [downTimeval, setDownTimeVal] = useState({});
  const [id, setID] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalConsumedKits, setTotalConsumedkits] = useState(0);
  const [isDownTimeModalOpen, setIsDownTimeModalOpen] = useState(false);
  const [downTimeType, setDownTimeType] = useState("");
  const closeDownTimeModal = () => setIsDownTimeModalOpen(false);
  const [showPopup, setShowPopup] = useState(false);
  const [downTimeDiff, setDownTimeDiff] = useState(0);
  const [changeShiftTime, setChangeShiftTime] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shiftChangedFromDate, setShiftChangedFromDate] = useState("");
  const [processName, setProcessName] = useState("");
  const [isConfirmDownTime, setConfirmDownTime] = useState(false);
  const [isConfirmShiftTime, setIsConfirmShiftTime] = useState(false);
  const [assignedJigs, setAssignedJigs] = useState<any>({});
  const [jigCategories, setJigCategories] = useState<any[]>([]);
  const [packagingData, setPackagingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>({});
  const [rawSelectedProcessId, setRawSelectedProcessId] = useState("");
  const [showResumeConfirmPopup, setShowResumeConfirmPopup] = useState(false);
  const [processStatus, setProcessStatus] = useState("");
  const [isCustomStagesModalOpen, setCustomStagesModalOpen] = useState(false);
  const [customStagesCompatibleOperator, setCustomStagesCompatibleOperator] =
    useState<any[]>([]);
  const [assignedCustomStages, setAssignedCustomStages] = useState([]);
  const [customStagesIndexVal, setCustomStagesIndexVal] = useState(0);
  const [stages, setStages] = useState([]);
  const [commonStages, setCommonStages] = useState([]);
  const [isFullLayoutModalOpen, setIsFullLayoutModalOpen] = useState(false);
  useEffect(() => {
    getAllProcess();
    getAllRoomPlan();
    getAllShifts();
    getOperators();
    fetchJigCategories();
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    setID(id);
    getPlaningById(id);
  }, [loading]);
  useEffect(() => {
    if (rawSelectedProcessId && process.length > 0) {
      const singleProcess = process.find(
        (value) => value?._id === rawSelectedProcessId,
      );
      setSelectedProcess(singleProcess);
      if (singleProcess?.selectedProduct) {
        getProduct(singleProcess?.selectedProduct);
      }
    }
  }, [rawSelectedProcessId, process]);
  const closeCustomStagesModal = () => {
    setCustomStagesModalOpen(false);
  };
  const handleCustomStagesubmitOperator = () => {
    setCustomStagesModalOpen(false);
  };
  const fetchJigCategories = async () => {
    try {
      let result = await viewJigCategory();
      setJigCategories(result?.JigCategories);
    } catch (error) {

    }
  };
  const getHolidayList = async () => {
    try {
      let result = await fetchHolidays();
      return result?.holidays;
    } catch (error) {

    }
  };
  const getProduct = async (id: any) => {
    try {
      let result = await getProductById(id);
      result.product.stages.forEach((stage) => {
        stage?.subSteps
          .filter((value) => value.isPackagingStatus)
          .forEach((value) => {
            setPackagingData((prev) => [...prev, value]);
          });
      });
      setInventoryData(result.inventory);
      setProductName(result.product.name);
      setSelectedProduct(result);
    } catch (error) {

    }
  };
  const getPlaningById = async (id: any) => {
    try {
      let result = await getPlaningAndSchedulingById(id);
      const singleProcess = process.find(
        (value) => value?._id === result.selectedProcess,
      );
      setStages(singleProcess.stages);
      setCommonStages(singleProcess.commonStages);
      setProcessStatus(singleProcess?.status);
      setRawSelectedProcessId(result.selectedProcess);
      const room = roomPlan.find(
        (value) => value?._id === result?.selectedRoom,
      );
      setSelectedRoom(room);
      const Shift = shifts.find(
        (value) => value?._id === result?.selectedShift,
      );
      setProcessName(result?.processName);
      setSelectedShift(Shift);
      calculateTimeDifference(Shift);
      setRepeatCount(result?.repeatCount);
      setStartDate(formatDate(result?.startDate));
      setAssignedStages(JSON.parse(result?.assignedStages));
      setAssignedOperators(JSON.parse(result?.assignedOperators));
      setAssignedJigs(JSON.parse(result?.assignedJigs));
      setAssignedCustomOperators(JSON.parse(result?.assignedCustomStagesOp));
      setEstimatedEndDate(formatDate(result?.estimatedEndDate));
      setTotalTimeEstimation(result?.totalTimeEstimation);
      const downTimeArr = result.downTime;
      setDownTimeFrom(downTimeArr?.downTimeFrom);
      setDownTimeTo(downTimeArr?.downTimeTo);
      setDownTimeDescription(downTimeArr.downTimeDesc);
      setDownTimeVal(downTimeArr);
      setTotalUPHA(result?.totalUPHA);
      if (result?.ProcessShiftMappings) {
        setShiftChangedFromDate(
          result?.ProcessShiftMappings?.formattedShiftDate,
        );
        setEndTime(result?.ProcessShiftMappings?.endTime);
        setStartTime(result?.ProcessShiftMappings?.startTime);
      }
      setTotalConsumedkits(result?.consumedKit);
      let reservedSeats = await checkSeatAvailability(
        room,
        Shift,
        formatDate(result?.startDate),
        formatDate(result?.estimatedEndDate),
      );
      let result1 = await getProductById(singleProcess?.selectedProduct);
      const assignedStages = allocateStagesToSeats(
        singleProcess.stages,
        room,
        result?.repeatCount,
        reservedSeats,
        JSON.parse(result?.assignedStages),
        singleProcess,
      );
      const uniqueAssignedStages = new Set();
      const seatCountPerStage = {};

      for (let key in assignedStages) {
        assignedStages[key].forEach((stage) => {
          uniqueAssignedStages.add(stage?.name);
          seatCountPerStage[stage?.name] =
            (seatCountPerStage[stage?.name] || 0) + 1;
        });
      }
      handleCalculation();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      return {};
    }
  };
  const checkSeatAvailability = async (
    selectedRoom: any,
    selectedShift: any,
    startDate: any,
    expectedEndDate: any,
  ) => {
    let startTime = selectedShift?.intervals[0]?.startTime;
    let endTime = selectedShift?.intervals[0]?.endTime;
    try {
      const shiftDataChange = JSON.stringify({
        startTime,
        endTime,
        startDate,
      });
      const result = await checkPlanningAndScheduling(
        selectedRoom._id,
        selectedShift._id,
        startDate,
        expectedEndDate,
        shiftDataChange,
      );
      let assignedStagesObject = result.plans.reduce((acc: any, plan: any) => {
        try {
          if (plan._id != id) {
            let assignedJigs = plan?.assignedJigs
              ? JSON.parse(plan?.assignedJigs)
              : {};
            let assignedOperator = plan?.assignedOperators
              ? JSON.parse(plan?.assignedOperators)
              : {};
            setAssignedOperators((prev) => ({
              ...prev,
              ...assignedOperator,
            }));

            setAssignedJigs((prev) => ({
              ...prev,
              ...assignedJigs,
            }));
            const parsedStages = JSON.parse(plan.assignedStages);
            Object.keys(parsedStages).forEach((seatKey) => {
              if (!acc[seatKey]) {
                acc[seatKey] = [];
              }
              acc[seatKey] = acc[seatKey].concat(parsedStages[seatKey]);
            });
          }
        } catch (error) {
          console.error("Error parsing assignedStages:", error);
        }
        return acc;
      }, {});
      return assignedStagesObject;
    } catch (error) {

      return {};
    }
  };
  const getOperators = async () => {
    try {
      const result = await getOperatorsForPlan();
      setOperators(result.users);
      return false;
    } catch (error) {

    }
  };
  const getAllShifts = async () => {
    try {
      const result = await viewShift();
      setShifts(result?.Shifts);
    } catch (error) {

    }
  };
  const getAllProcess = async () => {
    try {
      const result = await viewProcess();
      setProcess(result.Processes);
    } catch (error) {

    }
  };
  const handleRemoveStage = (
    rowIndex: any,
    seatIndex: any,
    stageIndex: any,
    rowSeatLength: any,
  ) => {
    setAssignedStages((prev) => {
      const updatedStages = { ...prev };
      const currentKey = `${rowIndex}-${seatIndex}`;
      if (updatedStages[currentKey]) {
        updatedStages[currentKey] = updatedStages[currentKey].filter(
          (_, index) => index !== stageIndex,
        );
        if (updatedStages[currentKey].length === 0) {
          delete updatedStages[currentKey];
          delete assignedOperators[currentKey];
        }
      }
      const reservedSeats = new Set(
        Object.keys(updatedStages).filter(
          (key) => updatedStages[key][0]?.reserved,
        ),
      );
      const nonReservedKeys = Object.keys(updatedStages)
        .filter((key) => !reservedSeats.has(key))
        .sort((a, b) => {
          const [rowA, seatA] = a.split("-").map(Number);
          const [rowB, seatB] = b.split("-").map(Number);
          return rowA === rowB ? seatA - seatB : rowA - rowB;
        });

      const newStages = {};
      const newOperators = {};
      let currentRow = 0;
      let currentSeat = 0;
      for (const key of nonReservedKeys) {
        while (reservedSeats.has(`${currentRow}-${currentSeat}`)) {
          const reservedKey = `${currentRow}-${currentSeat}`;
          newStages[reservedKey] = updatedStages[reservedKey];
          newOperators[reservedKey] = assignedOperators[reservedKey];
          currentSeat++;
          if (currentSeat >= rowSeatLength) {
            currentRow++;
            currentSeat = 0;
          }
        }

        const newKey = `${currentRow}-${currentSeat}`;
        newStages[newKey] = updatedStages[key];
        newOperators[newKey] = assignedOperators[key];
        currentSeat++;
        if (currentSeat >= rowSeatLength) {
          currentRow++;
          currentSeat = 0;
        }
      }
      for (const reservedKey of reservedSeats) {
        newStages[reservedKey] = updatedStages[reservedKey];
        newOperators[reservedKey] = assignedOperators[reservedKey];
      }
      calculateSingleStage(newStages, rowIndex, seatIndex);
      setAssignedOperators(newOperators);

      return newStages;
    });
  };
  const getAllRoomPlan = async () => {
    try {
      const result = await viewRoom();
      setRoomPlan(result.RoomPlan);
    } catch (error) {
      console.error("Error Fetching Room Plan:", error);
    }
  };
  const calculateTimeDifference = (selected) => {
    const startDate = new Date(`1970-01-01T${selected.startTime}`);
    const endDate = new Date(`1970-01-01T${selected.endTime}`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid start or end time format");
    }
    const differenceInMilliseconds = endDate - startDate;
    const totalMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const decimalTime = hours + minutes / 60;

    setShiftTime(decimalTime);
  };
  const handleDrop = (rowIndex: any, seatIndex: any) => {
    return (event) => {
      event.preventDefault();
      const droppedData = JSON.parse(event.dataTransfer.getData("text/plain"));
      const data = droppedData;
      if (assignedOperators[`${rowIndex}-${seatIndex}`]) {
        let assign = assignedOperators[`${rowIndex}-${seatIndex}`][0];
        const compatibleOperators = assign.skills.some(
          (assignedOperator: any) =>
            assignedOperator.includes(droppedData?.name),
        );
        if (!compatibleOperators) {
          alert("Operator's skill set is not compatible with this stage.");
          return false;
        }
      }

      setAssignedStages((prev) => {
        const updatedStages = { ...prev };
        const currentKey = `${rowIndex}-${seatIndex}`;
        if (updatedStages[currentKey]?.[0]?.reserved) {
          return prev;
        }
        const isSeatAssigned = updatedStages[currentKey]?.length > 0;
        if (isSeatAssigned) {
          const adjacentKeys = [
            `${rowIndex - 1}-${seatIndex}`,
            `${rowIndex + 1}-${seatIndex}`,
            `${rowIndex}-${seatIndex - 1}`,
            `${rowIndex}-${seatIndex + 1}`,
          ];
          const isNearbyAssigned = adjacentKeys.some((key) =>
            updatedStages[key]?.some(
              (stage) => stage.name === droppedData.name,
            ),
          );
          if (!isNearbyAssigned) {
            alert("Only nearby stages are assigned to specific seats.");
            return prev;
          }
        }
        if (!updatedStages[currentKey]) {
          updatedStages[currentKey] = [];
        }
        const isDuplicate = updatedStages[currentKey].some(
          (stage) => stage.name === droppedData.name,
        );
        if (!isDuplicate) {
          updatedStages[currentKey].push(data);
        }
        calculateSingleStage(updatedStages, rowIndex, seatIndex);
        return updatedStages;
      });
    };
  };
  const calculateSingleStage = async (updatedStages, rowIndex, seatIndex) => {
    let totalQuantity = parseInt(selectedProcess?.quantity);
    const stages = selectedProduct.stages;
    const uniqueAssignedStages = new Set();
    const seatCountPerStage = {};

    for (let key in updatedStages) {
      updatedStages[key].forEach((stageName) => {
        uniqueAssignedStages.add(stageName.name);
        seatCountPerStage[stageName.name] =
          (seatCountPerStage[stageName.name] || 0) + 1;
      });
    }

    const totalUPHA = Array.from(uniqueAssignedStages).reduce(
      (sum, stageName) => {
        const stage = stages.find(
          (s) => s.stageName == updatedStages[`${rowIndex}-${seatIndex}`],
        );
        let seatCount = seatCountPerStage[stageName] || 1;

        if (stage && parseInt(stage.upha, 10) > 0) {
          const adjustedUPHA = parseInt(stage.upha, 10 * seatCount);
          return sum + adjustedUPHA;
        }

        return sum;
      },
      0,
    );
    const leastUpha = Math.min(
      ...stages.map(
        (stage) =>
          parseInt(stage.upha, 10) * seatCountPerStage[stage.stageName],
      ),
    );
    const breakTime = selectedShift?.breakTime || 0;
    const adjustedShiftTime = shiftTime - breakTime / 60;
    const unitsPer8HourDay = leastUpha * adjustedShiftTime;
    const totalTimeEstimationInDays = totalQuantity / unitsPer8HourDay;
    const expectedEndDate = await calculateEstimatedEndDate(
      totalTimeEstimationInDays,
    );
    setEstimatedEndDate(expectedEndDate);
    setTotalTimeEstimation(totalTimeEstimationInDays.toFixed(2));
    setTotalUPHA(unitsPer8HourDay.toFixed(2));
  };
  const handleDragOver = (event) => {
    event.preventDefault();
  };
  const allocateStagesToSeats = (
    Stages: any,
    selectedRoom: any,
    repeatCount = 1,
    reservedSeats = {},
    assignedStages = [],
    selectedProcess = {},
  ) => {
    const stages = Stages;
    const assignedSeatsKeys = Object.keys(assignedStages);
    const totalSeatsAvailable = selectedRoom?.lines?.reduce(
      (total: any, row: any) => total + row?.seats?.length,
      0,
    );
    const totalRequiredSeats =
      Object.keys(reservedSeats).length + stages.length * repeatCount;
    if (totalRequiredSeats > totalSeatsAvailable) {
      alert(
        "Insufficient seats available to assign all stages. Please adjust the allocation.",
      );
      return false;
    }
    const newAssignedStages: Record<string, any[]> = {};
    let stageIndex = 0;
    const totalRequiredStages = stages.length * repeatCount;
    selectedRoom.lines?.forEach((row: any, rowIndex: number) => {
      const totalSeats = row.seats.length;
      for (let seatIndex = 0; seatIndex < totalSeats; seatIndex++) {
        const key = `${rowIndex}-${seatIndex}`;
        if (reservedSeats[key]) {
          newAssignedStages[key] = [
            {
              name: "Reserved",
              reserved: true,
            },
          ];
          continue;
        }
        if (stageIndex >= totalRequiredStages) break;

        const currentStage = stages[stageIndex % stages.length];
        const hasJigStepType = currentStage.subSteps?.some(
          (step) => step.stepType === "jig",
        );
        const currentStageIndex = stageIndex % stages.length;
        const totalUPHA =
          currentStageIndex === 0 && selectedProcess?.issuedKits !== 0
            ? Math.floor(selectedProcess?.issuedKits / repeatCount)
            : 0;
        newAssignedStages[key] = [
          {
            name: currentStage.stageName,
            upha: currentStage.upha,
            requiredSkill: currentStage.requiredSkill,
            totalUPHA,
            passedDevice: 0,
            ngDevice: 0,
            hasJigStepType,
          },
        ];

        stageIndex++;
      }
    });

    Object.keys(newAssignedStages).forEach((key) => {
      if (newAssignedStages[key].length === 0) {
        delete newAssignedStages[key];
      }
    });
    setAssignedStages(newAssignedStages);
    return newAssignedStages;
  };
  const handleCalculation = async () => {
    if (!selectedProcess || !selectedProduct) {
      return;
    }
    let totalQuantity = parseInt(selectedProcess?.quantity);
    if (isNaN(totalQuantity) || totalQuantity <= 0) {
      return;
    }
    const uphaValues = selectedProduct?.product?.stages.map((stage) =>
      parseInt(stage.upha, 10),
    );
    const leastUpha = Math.min(...uphaValues);
    const breakTime = selectedShift?.breakTime || 0;
    const adjustedShiftTime = shiftTime - breakTime / 60;
    const unitsPer8HourDay = leastUpha * adjustedShiftTime * repeatCount;
    const totalTimeEstimationInDays = totalQuantity / unitsPer8HourDay;
    const expectedEndDate = await calculateEstimatedEndDate(
      totalTimeEstimationInDays,
    );
    const reservedSeats = await checkSeatAvailability(
      selectedRoom,
      selectedShift,
      startDate,
      expectedEndDate,
    );
    const singleProcess = process.find((value) => value?._id === id);
    const assignedStages = await allocateStagesToSeats(
      stages,
      selectedRoom,
      repeatCount,
      reservedSeats,
      {},
      singleProcess,
    );
    const uniqueAssignedStages = new Set();
    const seatCountPerStage = {};

    for (let key in assignedStages) {
      assignedStages[key].forEach((stage: any) => {
        uniqueAssignedStages.add(stage?.name);
        seatCountPerStage[stage?.name] =
          (seatCountPerStage[stage?.name] || 0) + 1;
      });
    }

    setEstimatedEndDate(expectedEndDate);
    setTotalTimeEstimation(totalTimeEstimationInDays.toFixed(2));
    setTotalUPHA(unitsPer8HourDay.toFixed(2));
  };
  const calculateEstimatedEndDate = async (totalDays: any) => {
    const [datePart, timePart] = startDate.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const fullYear = year < 100 ? 2000 + year : year;
    let start = new Date(fullYear, month - 1, day);
    let holidayList = await getHolidayList();
    const holidays = holidayList.map((holiday: any) =>
      new Date(holiday.holidayDate).toDateString(),
    );

    let remainingDays = totalDays;
    while (remainingDays > 0) {
      start.setDate(start.getDate() + 1);
      const currentDate = start.toDateString();
      const isWeekend = start.getDay() === 0 || start.getDay() === 6;
      const isHoliday = holidays.includes(currentDate);
      if (!isWeekend && !isHoliday) {
        remainingDays -= 1;
      }
    }

    const formattedEndDate = `${String(start.getDate()).padStart(2, "0")}/${String(
      start.getMonth() + 1,
    ).padStart(2, "0")}/${String(start.getFullYear()).slice(-2)} ${String(
      start.getHours(),
    ).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:${String(
      start.getSeconds(),
    ).padStart(2, "0")}`;

    return formattedEndDate;
  };
  const handleDragStart =
    (stage: any, substep = null) =>
      (event: any) => {
        const data = {
          name: stage.stageName,
          upha: stage.upha,
          substepName: substep ? [substep.stepName] : null,
          requiredSkill: stage.requiredSkill,
          managedBy: stage.managedBy,
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(data));
      };
  const moveItem = (fromCoordinates, toCoordinates) => {
    setAssignedStages((prevStages) => {
      const updatedStages = { ...prevStages };
      const updatedOperators = { ...assignedOperators };
      if (updatedStages[fromCoordinates]?.[0]?.reserved) {

        return prevStages;
      }
      if (updatedStages[toCoordinates]?.[0]?.reserved) {

        return prevStages;
      }
      let fromStage = updatedStages[fromCoordinates];
      let fromOperator = updatedOperators[fromCoordinates];
      if (fromStage || fromOperator) {
        delete updatedStages[fromCoordinates];
        delete updatedOperators[fromCoordinates];
        let currentPosition = toCoordinates;
        let [rowIndex, seatIndex] = currentPosition.split("-").map(Number);
        const seatsPerRow = selectedRoom.lines[rowIndex].seats.length;
        const maxRows = selectedRoom.lines.length;
        const overflow = [];
        while (fromStage || fromOperator) {
          if (updatedStages[currentPosition]?.[0]?.reserved) {
            seatIndex++;
            if (seatIndex >= seatsPerRow) {
              seatIndex = 0;
              rowIndex = (rowIndex + 1) % maxRows;
            }
            currentPosition = `${rowIndex}-${seatIndex}`;
            continue;
          }
          const tempStage = updatedStages[currentPosition];
          const tempOperator = updatedOperators[currentPosition];
          updatedStages[currentPosition] = fromStage;
          updatedOperators[currentPosition] = fromOperator;
          fromStage = tempStage;
          fromOperator = tempOperator;
          seatIndex++;
          if (seatIndex >= seatsPerRow) {
            seatIndex = 0;
            rowIndex = (rowIndex + 1) % maxRows;
            if (rowIndex >= maxRows) {
              overflow.push({ stage: fromStage, operator: fromOperator });
              break;
            }
          }
          currentPosition = `${rowIndex}-${seatIndex}`;
        }
        overflow.forEach(({ stage, operator }) => {
          for (let r = 0; r < maxRows; r++) {
            for (let s = 0; s < seatsPerRow; s++) {
              const pos = `${r}-${s}`;
              if (!updatedStages[pos] && !updatedOperators[pos]) {
                updatedStages[pos] = stage;
                updatedOperators[pos] = operator;
                return;
              }
            }
          }
        });
      }
      setAssignedOperators(updatedOperators);
      return updatedStages;
    });
  };
  const handlePlaningSubmit = async () => {
    try {
      const formData = new FormData();
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      let seatIndexCounter = 0;
      const filteredData = Object.fromEntries(
        Object.entries(assignedStages)
          .map(([key, value]) => [
            key,
            value
              .filter(
                (item) => !(item.name === "Reserved" && item.reserved === true),
              )
              .map((item) => {
                return { ...item };
              }),
          ])
          .filter(([_, value]) => value.length > 0),
      );
      const assignStageKeys = Object.keys(filteredData);
      const filteredJigs = Object.keys(assignedJigs)
        .filter((key) => assignStageKeys.includes(key))
        .reduce((acc, key) => {
          acc[key] = assignedJigs[key];
          return acc;
        }, {});
      const filteredOperators = Object.keys(assignedOperators)
        .filter((key) => assignStageKeys.includes(key))
        .reduce((acc, key) => {
          acc[key] = assignedOperators[key];
          return acc;
        }, {});
      const filteredCustomOperators = assignedCustomOperators;
      const sortedOperatorData = Object.keys(assignedOperators)
        .sort((a, b) => {
          const [rowA, colA] = a.split("-").map(Number);
          const [rowB, colB] = b.split("-").map(Number);
          return rowA - rowB || colA - colB;
        })
        .reduce((acc, key) => {
          acc[key] = assignedOperators[key];
          return acc;
        }, {});
      const sortedJigData = Object.keys(assignedJigs)
        .filter(
          (key) =>
            Array.isArray(assignedJigs[key]) && assignedJigs[key].length > 0,
        )
        .sort((a, b) => {
          const [rowA, colA] = a.split("-").map(Number);
          const [rowB, colB] = b.split("-").map(Number);
          return rowA - rowB || colA - colB;
        })
        .reduce((acc, key) => {
          acc[key] = assignedJigs[key];
          return assignedJigs[key].length > 0 ? acc : [];
        }, {});

      const finalJigData = Object.fromEntries(
        Object.entries(sortedJigData).filter(
          ([_, value]) => value && value.length > 0,
        ),
      );

      const formattedShiftDate = formatDate(shiftChangedFromDate);
      let startTime = selectedShift.intervals[0].startTime;
      let endTime =
        selectedShift.intervals[selectedShift?.intervals.length - 1].endTime;
      formData.append("processName", processName);
      formData.append("selectedProcess", selectedProcess?._id);
      formData.append("selectedRoom", selectedRoom?._id);
      formData.append("selectedShift", selectedShift?._id);
      formData.append("repeatCount", repeatCount);
      formData.append("startDate", startDate);
      formData.append("estimatedEndDate", estimatedEndDate);
      formData.append("totalTimeEstimation", totalTimeEstimation);
      formData.append("consumedKit", totalConsumedKits);
      formData.append(
        "ProcessShiftMappings",
        JSON.stringify({
          startTime,
          endTime,
          startDate,
        }),
      );
      if (assignedCustomStages.length == 0) {
        let commonStages = [];
        selectedProduct?.product?.commonStages.map((val, index) => {
          commonStages.push({
            stage: val.stageName,
            totalUPHA: 0,
            upha: val.upha,
            passedDevice: 0,
            ngDevice: 0,
          });
        });
        formData.append("assignedCustomStages", JSON.stringify(commonStages));
      }
      formData.append("totalUPHA", totalUPHA);
      formData.append("assignedJigs", JSON.stringify(finalJigData));
      formData.append(
        "assignedCustomStagesOp",
        JSON.stringify(assignedCustomOperators),
      );
      formData.append("assignedOperators", JSON.stringify(sortedOperatorData));
      formData.append("assignedStages", JSON.stringify(filteredData));
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      formData.append("isDrafted", 0);
      const result = await updatePlaningAndScheduling(formData, id);
      if (result && result.status === 200) {
        const formDataProcess = new FormData();
        let newPlaningData = result?.newPlanAndScheduling;
        if (Object.keys(filteredCustomOperators).length > 0) {
          Object.keys(filteredCustomOperators).forEach(async (operatorKey) => {
            const operatorsForStage = filteredCustomOperators[operatorKey];
            if (operatorsForStage && operatorsForStage.length > 0) {
              operatorsForStage.forEach(async (operator: any) => {
                const formDataCustomOp = new FormData();
                formDataCustomOp.append("processId", selectedProcess?._id);
                formDataCustomOp.append("userId", operator?._id);
                formDataCustomOp.append("roomName", selectedRoom?._id);
                formDataCustomOp.append("seatDetails", JSON.stringify({}));
                formDataCustomOp.append("stageType", "common");
                formDataCustomOp.append(
                  "ProcessShiftMappings",
                  JSON.stringify({
                    formattedShiftDate: startDate,
                    startTime: selectedShift?.startTime,
                    endTime: selectedShift?.endTime,
                  }),
                );
                formDataCustomOp.append("status", "Occupied");
                formDataCustomOp.append("startDate", startDate);
                await createAssignedOperatorsToPlan(formDataCustomOp);
              });
            }
          });
        }
        if (Object.keys(filteredOperators).length > 0) {
          Object.keys(filteredOperators).forEach(async (operatorKey) => {
            const jigForSeat = operatorKey.split("-");
            const formData3 = new FormData();
            formData3.append("action", "PLANING_UPDATED");
            formData3.append("processId", selectedProcess?._id || "");
            formData3.append("userId", userDetails?._id || "");
            formData3.append(
              "description",
              `${filteredOperators[operatorKey]?.[0]?.name} Operator successfully assigned to ${processName} at Stage ${assignedStages[operatorKey]?.[0]?.name}, Seat ${jigForSeat[0]}-${jigForSeat[1]} by ${userDetails?.name}.`,
            );

            try {
              const formAssignOperator = new FormData();
              formAssignOperator.append("processId", selectedProcess?._id);
              formAssignOperator.append(
                "userId",
                filteredOperators[operatorKey]?.[0]?._id,
              );
              formAssignOperator.append("roomName", selectedRoom?._id);
              formAssignOperator.append(
                "seatDetails",
                JSON.stringify({
                  rowNumber: jigForSeat[0],
                  seatNumber: jigForSeat[1],
                }),
              );
              formAssignOperator.append(
                "ProcessShiftMappings",
                JSON.stringify({
                  formattedShiftDate: startDate,
                  startTime: selectedShift?.startTime,
                  endTime: selectedShift?.endTime,
                }),
              );
              formAssignOperator.append("status", "Occupied");
              formAssignOperator.append("startDate", startDate);
              const setAssignedOperators =
                await createAssignedOperatorsToPlan(formAssignOperator);
              const result = await createProcessLogs(formData3);

            } catch (error) {
              console.error("Error creating plan logs: ", error);
            }
          });
        }
        if (Object.keys(filteredJigs).length > 0) {
          Object.keys(filteredJigs).forEach(async (jigKey) => {
            const jigForSeat = jigKey.split("-");
            const assginedJigForm = new FormData();
            assginedJigForm.append("processId", selectedProcess?._id || "");
            assginedJigForm.append("userId", userDetails?._id || "");
            assginedJigForm.append("jigId", filteredJigs[jigKey]?.[0]?._id);
            assginedJigForm.append("roomName", selectedRoom?._id);
            assginedJigForm.append(
              "seatDetails",
              JSON.stringify({
                rowNumber: jigForSeat[0],
                seatNumber: jigForSeat[1],
              }),
            );
            assginedJigForm.append(
              "ProcessShiftMappings",
              JSON.stringify({
                formattedShiftDate: startDate,
                startTime: selectedShift?.startTime,
                endTime: selectedShift?.endTime,
              }),
            );
            assginedJigForm.append("startDate", startDate);
            assginedJigForm.append("status", "Occupied");
            const formData2 = new FormData();
            formData2.append("action", "ASSIGN_JIG");
            formData2.append("processId", selectedProcess?._id);
            formData2.append("userId", userDetails?._id);
            formData2.append(
              "description",
              `${filteredJigs[jigKey]?.[0]?.name} jig successfully assigned to ${newPlaningData?.processName} at Stage ${assignedStages[jigKey]?.[0]?.name}, Seat ${jigForSeat[0]}-${jigForSeat[1]} by ${userDetails?.name}.`,
            );

            try {
              const newAssignedJig = await createAssignedJigs(assginedJigForm);
              const result = await createProcessLogs(formData2);

            } catch (error) {
              console.error("Error creating plan logs: ", error);
            }
          });
        }
        if (isConfirmShiftTime) {
          const formData2 = new FormData();
          formData2.append("action", "SHIFT_CHANGE");
          formData2.append("processId", selectedProcess?._id);
          formData2.append("userId", userDetails?._id);
          formData2.append(
            "description",
            `${selectedProcess?.name} Shift has been changed From Date ${formattedShiftDate} (form ${startTime} - ${endTime}) by ${userDetails?.name}`,
          );
          const result1 = await createProcessLogs(formData2);
          if (result1 && result1?.status === 200) {
          } else {
            throw new Error(
              result1?.message || "Failed to Update Planing and Scheduling!!",
            );
          }
        }
        if (isConfirmDownTime) {
          let downTime = downTimeval;
          const formData1 = new FormData();
          formData1.append("action", "HOLD");
          formData1.append("processId", selectedProcess?._id);
          formData1.append("userId", userDetails?._id);
          formData1.append(
            "description",
            `${selectedProcess?.name} is on Hold From Date ${downTime.downTimeFrom} - to Date ${downTime.downTimeTo} due to ${downTime?.downTimeDesc} by ${userDetails?.name}`,
          );
          const result2 = await createProcessLogs(formData1);
          if (result2 && result2?.status === 200) {
          } else {
            throw new Error(
              result2?.message || "Failed to Update Planing and Scheduling!!",
            );
          }
        }
      } else {
        throw new Error(
          result.message || "Failed to Update Planing and Scheduling!!",
        );
      }
      toast.success(
        result.message || "Planing and Scheduling Updated Successfully!!",
      );
      router.push("/process/view");
    } catch (e) {

    }
    return false;
  };
  const handlesubmitDowntime = async () => {
    let data = {
      downTimeFrom,
      downTimeTo,
      downTimeDesc,
      downTimeType,
    };
    const dateFrom = new Date(downTimeFrom);
    const dateTo = new Date(downTimeTo);
    const timeDifference = dateTo.getTime() - dateFrom.getTime();
    const dayDifference = timeDifference / (1000 * 60 * 60 * 24);
    const total = parseFloat(totalTimeEstimation) + dayDifference;
    const expectedEndDate = await calculateEstimatedEndDate(total);
    setEstimatedEndDate(expectedEndDate);
    setDownTimeVal(data);

    setIsDownTimeModalOpen(false);
    setShowPopup(true);
    setConfirmDownTime(true);
  };
  const handleConfirmationShiftTimeSubmit = () => {
    handlePlaningSubmit();
  };
  const handleDownTimeProcess = async () => {
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      let formData = new FormData();
      let downTimeArr = {
        from: downTimeval?.downTimeFrom,
        to: downTimeval?.downTimeTo,
        description: downTimeval?.downTimeDesc,
        downTimeType: downTimeval?.downTimeType,
      };
      formData.append("selectedProcess", selectedProcess?._id);
      formData.append("downTime", JSON.stringify(downTimeArr));
      let response = await updateDownTimeProcess(id, formData);
      if (response && response.status == 200) {
        toast.success(result.message || "DownTime Updated Successfully!!");
      }
    } catch (error) {

    }
  };
  const handleDownTimeProcessStatus = async () => {
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      let formData = new FormData();
      formData.append("selectedProcess", selectedProcess?._id);
      formData.append("status", "active");
      let response = await updateProcessStatus(id, formData);
      if (response && response.status == 200) {
        toast.success(response.message || "DownTime Updated Successfully!!");
      }
    } catch (error) {

    }
  };
  const openCustomStagesModal = (stage, index) => {
    const requiredSkill = stage.requiredSkill?.toLowerCase().trim();
    const requiredUserType = stage.managedBy;
    const assignedOperatorIds = Object.values(assignedOperators || {})
      .flat() // flatten values
      .filter(
        (op): op is { _id: string } => op && typeof op._id !== "undefined",
      ) // keep only valid
      .map((op) => op._id);

    const compatibleOperators = operators.filter((operator) => {
      const normalizedSkills = operator.skills.map((skill) =>
        skill.toLowerCase().trim(),
      );
      return (
        normalizedSkills.includes(requiredSkill) &&
        !assignedOperatorIds.includes(operator._id)
      );
    });
    setCustomStagesIndexVal(index);
    setCustomStagesCompatibleOperator(compatibleOperators);
    setCustomStagesModalOpen(true);
  };
  const isOperatorAssignedToAnySeat = (operatorName: any) => {
    return Object.values(assignedOperators).some((operatorsForSeat) =>
      operatorsForSeat?.some(
        (assignedOperator) => assignedOperator.name === operatorName,
      ),
    );
  };
  const handleOperator = (event) => {
    const operator = operators.find((val) => val._id === event);
    const key = `${customStagesIndexVal}`;
    const newAssignedOperators = { ...assignedCustomOperators };

    if (!newAssignedOperators[key]) {
      newAssignedOperators[key] = [];
    }
    const alreadyExists = newAssignedOperators[key].some(
      (op) => op._id === operator._id,
    );
    if (!alreadyExists) {
      newAssignedOperators[key].push(operator);
    }
    setAssignedCustomOperators(newAssignedOperators);
  };
  const handleResume = () => {
    setShowResumeConfirmPopup(true);
  };
  const handleRemoveAssignCustomOperator = (index, opId) => {
    try {
      // let form = new FormData();
      // form.append("status", "Free");
      // let data = await getUpdateStatus(operatorid, form);
      // if (data && data.status == 200) {
      const key = `${index}`;
      setAssignedCustomOperators((prevAssignedOperators) => {
        const newAssignedOperators = { ...prevAssignedOperators };
        delete newAssignedOperators[key];
        return newAssignedOperators;
      });
      //   }
    } catch (error) {

    }
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <Breadcrumb
        parentName="Planning & Scheduling Management"
        pageName="Edit Scheduling Management"
      />
      <ToastContainer
        position="top-center"
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="container mx-auto grid grid-cols-1 gap-9 p-6 sm:grid-cols-1">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between border-b border-stroke py-4 dark:border-strokedark">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Edit Planning & Scheduling
              </h3>
              {downTimeval &&
                (() => {
                  const currentDate = new Date();
                  const downTimeFrom = new Date(downTimeval?.downTimeFrom);
                  const downTimeTo = new Date(downTimeval?.downTimeTo);
                  currentDate.setHours(0, 0, 0, 0);
                  downTimeFrom.setHours(0, 0, 0, 0);
                  downTimeTo.setHours(0, 0, 0, 0);

                  return (
                    downTimeFrom <= currentDate && currentDate <= downTimeTo
                  );
                })() && (
                  <p className="text-danger">
                    On Hold : ( {downTimeval?.downTimeFrom} -{" "}
                    {downTimeval?.downTimeTo} ) Due to{" "}
                    {downTimeval?.downTimeDesc}
                  </p>
                )}

              <div className="flex gap-2">
                {processStatus == "down_time_hold" && (
                  <>
                    <button
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary px-2 py-2 text-sm text-secondary text-white"
                      onClick={() => handleResume()}
                    >
                      Resume
                    </button>
                    {showResumeConfirmPopup && (
                      <ConfirmationPopup
                        message="Are you sure you want to Resume the Process?"
                        onConfirm={() => {
                          handleDownTimeProcessStatus();
                          setShowResumeConfirmPopup(false);
                        }}
                        onCancel={() => setShowResumeConfirmPopup(false)}
                      />
                    )}
                  </>
                )}
                {(processStatus === "down_time_hold" ||
                  processStatus === "active") && (
                    <button
                      className="flex items-center justify-center gap-2 rounded-lg bg-black px-2 py-2 text-sm text-white"
                      onClick={() => setIsDownTimeModalOpen(true)}
                    >
                      <svg
                        width="15px"
                        height="15px"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                      >
                        <g id="SVGRepo_bgCarrier" strokeWidth="0" />
                        <g
                          id="SVGRepo_tracerCarrier"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <g id="SVGRepo_iconCarrier">
                          <path
                            d="M3 5.5L5 3.5M21 5.5L19 3.5M9 9.5L15 15.5M15 9.5L9 15.5M20 12.5C20 16.9183 16.4183 20.5 12 20.5C7.58172 20.5 4 16.9183 4 12.5C4 8.08172 7.58172 4.5 12 4.5C16.4183 4.5 20 8.08172 20 12.5Z"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      </svg>
                      <span>Downtime</span>
                    </button>
                  )}
              </div>

              {showPopup && (
                <ConfirmationPopup
                  message="Are you sure you want to Hold the Process?"
                  onConfirm={() => {
                    handleDownTimeProcess();
                    setShowPopup(false);
                  }}
                  onCancel={() => setShowPopup(false)}
                />
              )}
              <Modal
                isOpen={isDownTimeModalOpen}
                onSubmit={handlesubmitDowntime}
                onClose={closeDownTimeModal}
                title="Add Downtime"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                      From
                    </label>
                    <input
                      type="date"
                      value={downTimeFrom}
                      onChange={(e) => setDownTimeFrom(e.target.value)}
                      placeholder=""
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                      To
                    </label>
                    <input
                      type="date"
                      value={downTimeTo}
                      onChange={(e) => setDownTimeTo(e.target.value)}
                      placeholder=""
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                      DownTime Type
                    </label>
                    <select
                      value={downTimeType}
                      onChange={(e) => setDownTimeType(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                    // disabled={processStatus == "process_created" ? false : true}
                    >
                      <option value="" className="text-body dark:text-bodydark">
                        Please Select
                      </option>
                      <option
                        value="kits_shortage"
                        className="text-body dark:text-bodydark"
                      >
                        Kits Shortage
                      </option>
                      <option
                        value="jig_issue"
                        className="text-body dark:text-bodydark"
                      >
                        Jig Issue
                      </option>
                      <option
                        value="maintainence_issue"
                        className="text-body dark:text-bodydark"
                      >
                        Maintainence issue
                      </option>
                      <option
                        value="manpower_shortage"
                        className="text-body dark:text-bodydark"
                      >
                        Manpower Shortage
                      </option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                      Descripition
                    </label>
                    <textarea
                      rows={6}
                      value={downTimeDesc}
                      onChange={(e) => setDownTimeDescription(e.target.value)}
                      placeholder="Default textarea"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    ></textarea>
                  </div>
                </div>
              </Modal>
            </div>
            <form action="#">
              <div className="mt-4 p-2">
                {/* FormComponent 1 */}
                <FormComponent
                  shifts={shifts}
                  process={process}
                  roomPlan={roomPlan}
                  calculateTimeDifference={calculateTimeDifference}
                  handleCalculation={handleCalculation}
                  setSelectedProduct={setSelectedProduct}
                  selectedProcess={selectedProcess}
                  setSelectedProcess={setSelectedProcess}
                  repeatCount={repeatCount}
                  setRepeatCount={setRepeatCount}
                  selectedShift={selectedShift}
                  setSelectedShift={setSelectedShift}
                  setSelectedRoom={setSelectedRoom}
                  selectedRoom={selectedRoom}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  productName={productName}
                  setProductName={setProductName}
                  formatDate={formatDate}
                  setChangeShiftTime={setChangeShiftTime}
                  changeShiftTime={changeShiftTime}
                  startTime={startTime}
                  endTime={endTime}
                  shiftChangedFromDate={shiftChangedFromDate}
                  setStartTime={setStartTime}
                  setEndTime={setEndTime}
                  setShiftChangedFromDate={setShiftChangedFromDate}
                  handleConfirmationShiftTimeSubmit={
                    handleConfirmationShiftTimeSubmit
                  }
                  processName={processName}
                  setProcessName={setProcessName}
                  isConfirmShiftTime={isConfirmShiftTime}
                  setIsConfirmShiftTime={setIsConfirmShiftTime}
                  packagingData={packagingData}
                  inventoryData={inventoryData}
                  assignedStages={assignedStages}
                />
                {/* end FormComponent 1 */}
                <div className="my-3">
                  {/* {totalTimeEstimation && ( */}
                  <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Production Analytics</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Estimated output and timelines</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      {/* Estimated Completion */}
                      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
                        <div className="relative z-10">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Estimated Completion</span>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
                              {estimatedEndDate.split(' ')[0]}
                            </span>
                          </div>
                          <span className="mt-1 block text-sm font-medium text-gray-500">{estimatedEndDate.split(' ')[1] || ''}</span>
                        </div>
                        <Calendar className="absolute -bottom-2 -right-2 h-20 w-20 text-blue-500/5" />
                      </div>

                      {/* Total Duration */}
                      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
                        <div className="relative z-10">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Duration</span>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{totalTimeEstimation}</span>
                            <span className="text-sm font-bold text-gray-500 uppercase">Days</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 w-full bg-gray-200 rounded-full dark:bg-gray-700">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                          </div>
                        </div>
                        <FaClock className="absolute -bottom-2 -right-2 h-20 w-20 text-purple-500/5" />
                      </div>

                      {/* UPH Analysis */}
                      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
                        <div className="relative z-10">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            UPHA ({(shiftTime - parseInt(selectedShift?.totalBreakTime || "0") / 60).toFixed(2)}h Shift)
                          </span>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalUPHA}</span>
                            <span className="text-sm font-bold text-gray-500 uppercase">Units/Day</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400 font-medium">Capacity calculated at 100% efficiency</p>
                        </div>
                        <FaCogs className="absolute -bottom-2 -right-2 h-20 w-20 text-orange-500/5" />
                      </div>
                    </div>
                  </div>
                  {/* )} */}
                </div>
                {/* {totalTimeEstimation && (
                  <div className="grid w-full justify-center">
                    <p>
                      Estimated Completed Date :{" "}
                      {estimatedEndDate || "Not calculated yet"}
                    </p>
                    <p>
                      Total Time Estimation (in days):{" "}
                      {totalTimeEstimation || "Not calculated yet"}
                    </p>
                    <p>
                      Units Processed Per{" "}
                      {(shiftTime - selectedShift?.totalBreakTime / 60).toFixed(
                        2,
                      )}
                      -Hour Day: {totalUPHA || "Not calculated yet"}
                    </p>
                  </div>
                )} */}
                {/* component 2 */}
                <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
                  <div className="flex flex-col xl:flex-row gap-6">
                    {/* Stages Sidebar */}
                    <div className="w-full xl:w-64 shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1 bg-blue-100 text-blue-600 rounded dark:bg-blue-900/30 dark:text-blue-400">
                          <FaLayerGroup className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white font-outfit uppercase tracking-tight">Available Stages</h3>
                      </div>
                      <div className="custom-scroll max-h-[400px] overflow-y-auto space-y-3 pr-2">
                        {stages?.map((stage, index) => (
                          <div key={index} className="group relative">
                            <button
                              className="w-full flex items-center justify-between truncate rounded-xl bg-white border border-gray-100 px-4 py-3 text-[11px] font-bold text-gray-700 shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500 group-active:scale-[0.98]"
                              type="button"
                              draggable
                              onDragStart={handleDragStart(stage)}
                            >
                              <span>{stage.stageName}</span>
                              <div className="h-2 w-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/50" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Floor Layout Mapping */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-purple-100 text-purple-600 rounded dark:bg-purple-900/30 dark:text-purple-400">
                            <FaClipboardList className="h-4 w-4" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white font-outfit uppercase tracking-tight">Floor Layout Mapping</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFullLayoutModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-blue-500/10 active:scale-95 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          View Full
                        </button>
                      </div>
                      <div className="bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 p-4 overflow-hidden relative">
                        <div className="overflow-x-auto custom-scroll pb-2">
                          <div className="flex flex-col gap-4 pr-4 max-h-[600px] overflow-y-auto">
                            {selectedRoom?.lines?.map((row, rowIndex) => (
                              <div key={rowIndex} className="space-y-2">
                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">
                                  {row.rowName}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {row.seats?.map((seat, seatIndex) => (
                                    <div key={seatIndex} className="w-full h-full">
                                      <DraggableGridItem
                                        rowIndex={rowIndex}
                                        seatIndex={seatIndex}
                                        handleDrop={handleDrop}
                                        handleDragOver={handleDragOver}
                                        handleRemoveStage={handleRemoveStage}
                                        item={seat}
                                        assignedStages={assignedStages}
                                        coordinates={`${rowIndex}-${seatIndex}`}
                                        moveItem={moveItem}
                                        operators={operators}
                                        assignedOperators={assignedOperators}
                                        setAssignedOperators={setAssignedOperators}
                                        filteredOperators={filteredOperators}
                                        setFilteredOperators={setFilteredOperators}
                                        rowSeatLength={row.seats.length}
                                        setAssignedJigs={setAssignedJigs}
                                        assignedJigs={assignedJigs}
                                        jigCategories={jigCategories}
                                        handlePlaningSubmit={handlePlaningSubmit}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Common Services Stages */}
                      <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white font-outfit uppercase tracking-tight mb-4">
                          Common Services Stages
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {commonStages?.map((value, index) => (
                            <div
                              key={index}
                              className="w-full h-full border-gray-100 flex flex-col rounded-xl border border-green-500/40 bg-white p-3 transition-all duration-300 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/5 dark:bg-gray-800 dark:border-green-900/50"
                            >
                              <div className="text-gray-900 dark:text-white flex items-center justify-between mb-3">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 font-outfit">Common Service</span>
                                  <span className="text-xs font-bold tracking-tight">{value?.stageName}</span>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                              </div>

                              <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {assignedCustomOperators[index]?.map((op: any, i: number) => (
                                    <div key={i} className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400">
                                      {op.name}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex gap-1.5">
                                  {assignedCustomOperators[index] && assignedCustomOperators[index].length > 0 && (
                                    <button
                                      type="button"
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
                                      onClick={() => handleRemoveAssignCustomOperator(index, "")}
                                      title="Clear Assignments"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-[9.5px] font-black uppercase tracking-wider dark:bg-blue-900/20 dark:text-blue-400"
                                    onClick={() => openCustomStagesModal(value, index)}
                                  >
                                    <UserPlus className="h-3 w-3" />
                                    {assignedCustomOperators[index]?.length > 0 ? "Edit" : "Assign"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assign Operators Modal */}
                  <Modal
                    isOpen={isCustomStagesModalOpen}
                    onSubmit={handleCustomStagesubmitOperator}
                    onClose={closeCustomStagesModal}
                    title="Assign Operators"
                    maxWidth="max-w-sm"
                  >
                    <div className="space-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]">
                          <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                          Available Operators
                        </label>
                        <div className="group relative">
                          <select
                            onChange={(e) => handleOperator(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:border-blue-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          >
                            <option value="">Select an operator...</option>
                            {customStagesCompatibleOperator?.map((operator, index) => (
                              <option
                                key={index}
                                value={operator?._id}
                                disabled={isOperatorAssignedToAnySeat(operator?.name)}
                              >
                                {operator.name}
                                {isOperatorAssignedToAnySeat(operator?.name) ? " — (Assigned)" : ""}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors group-hover:text-blue-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-blue-50/50 p-4 text-[11px] leading-relaxed text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        <div className="mt-0.5 rounded-full bg-blue-100 p-1 dark:bg-blue-800">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p>Operators listed here correspond to the requirements of the selected common service stage.</p>
                      </div>
                    </div>
                  </Modal>
                </div>

                {/* end component 2 */}
              </div>
              <div className="flex justify-end gap-3 p-8 bg-gray-50/30 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800">
                <button
                  className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-95"
                  type="button"
                  onClick={handlePlaningSubmit}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-10" />
                  <FaClipboardList className="h-4 w-4" />
                  <span className="relative uppercase tracking-widest text-xs">Update Planning Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div >
      <Modal
        isOpen={isFullLayoutModalOpen}
        onClose={() => setIsFullLayoutModalOpen(false)}
        onSubmit={() => { }}
        title="Full Floor Layout Mapping"
        submitOption={false}
        maxWidth="max-w-[95vw]"
      >
        <div className="max-w-[95vw] w-full max-h-[60vh] overflow-auto custom-scroll">
          <div className="flex flex-col gap-4 p-4">
            {selectedRoom?.lines?.map((row, rowIndex) => (
              <div key={rowIndex} className="space-y-2">
                <div className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2 flex items-center gap-2">
                  <div className="h-1 w-8 bg-purple-500/20 rounded-full" />
                  {row.rowName}
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {row.seats?.map((seat, seatIndex) => (
                    <div key={seatIndex} className="w-full h-full">
                      <DraggableGridItem
                        rowIndex={rowIndex}
                        seatIndex={seatIndex}
                        handleDrop={handleDrop}
                        handleDragOver={handleDragOver}
                        handleRemoveStage={handleRemoveStage}
                        item={seat}
                        assignedStages={assignedStages}
                        coordinates={`${rowIndex}-${seatIndex}`}
                        moveItem={moveItem}
                        operators={operators}
                        assignedOperators={assignedOperators}
                        setAssignedOperators={setAssignedOperators}
                        filteredOperators={filteredOperators}
                        setFilteredOperators={setFilteredOperators}
                        rowSeatLength={row.seats.length}
                        setAssignedJigs={setAssignedJigs}
                        assignedJigs={assignedJigs}
                        jigCategories={jigCategories}
                        handlePlaningSubmit={handlePlaningSubmit}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </DndProvider >
  );
};

export default EditPlanSchedule;
