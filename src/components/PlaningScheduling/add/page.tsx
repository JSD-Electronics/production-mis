"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import FormComponent from "@/components/PlaningScheduling/add/FormComponents";
import DraggableGridItem from "@/components/PlaningScheduling/add/DraggableGridItem";
import {
  viewRoom,
  getProductById,
  viewProcess,
  viewShift,
  getOperatorsForPlan,
  createPlaningAndScheduling,
  checkPlanningAndScheduling,
  fetchHolidays,
  getPlaningAndSchedulingModel,
  createProcessLogs,
  createAssignedOperatorsToPlan,
  viewJigCategory,
  fetchJigsById,
  createAssignedJigs,
} from "@/lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Modal from "@/components/Modal/page";
import { Clock, Calendar, Coffee, UserPlus } from "lucide-react";
import { FaClock, FaCogs, FaLayerGroup, FaClipboardList, FaBox } from "react-icons/fa";

const ADDPlanSchedule = () => {
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
  const [assignedJigs, setAssignedJigs] = useState<any[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<any[]>([]);
  const [holidayList, setHolidayList] = useState<any[]>([]);
  const [isClonePlaningModel, setIsClonePlaningModel] = useState(false);
  const [selectedClonePlaning, setSelectedClonePlaning] = useState<any>({});
  const [getSavedPlaning, setSavedPlaning] = useState<any[]>([]);
  const [jigCategories, setJigCategories] = useState<any[]>([]);
  const [productName, setProductName] = useState("");
  const [processName, setProcessName] = useState("");
  const [packagingData, setPackagingData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>({});
  const [totalConsumedKits, setTotalConsumedkits] = useState(0);
  const [assignedCustomOperators, setAssignedCustomOperators] = useState<any[]>([]);
  const [isPlaningAndSchedulingShow, setIsPlaningAndSchedulingShow] =
    useState(false);
  const [customStagesCompatibleOperator, setCustomStagesCompatibleOperator] =
    useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [commonStages, setCommonStages] = useState<any[]>([]);
  const [customStagesIndexVal, setCustomStagesIndexVal] = useState(0);
  const [isCustomStagesModalOpen, setCustomStagesModalOpen] = useState(false);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState(false);
  const [isFullLayoutModalOpen, setIsFullLayoutModalOpen] = useState(false);
  const closeClonePlaningModal = () => {
    setIsClonePlaningModel(false);
  };
  useEffect(() => {
    getAllProcess();
    getAllRoomPlan();
    getAllShifts();
    getOperators();
    getAllPlaning();
    fetchJigCategories();
    loadHolidays();
  }, []);

  const isWorkingDay = (date: Date) => {
    // 1. Check Shift Day-off
    if (selectedShift && selectedShift.weekDays) {
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayName = dayNames[date.getDay()];
      if (!selectedShift.weekDays[dayName]) return false;
    }

    // 2. Check Holidays
    if (holidayList && holidayList.length > 0) {
      const isHoliday = holidayList.some((h) => {
        const hDate = new Date(h.holidayDate);
        return (
          hDate.getFullYear() === date.getFullYear() &&
          hDate.getMonth() === date.getMonth() &&
          hDate.getDate() === date.getDate()
        );
      });
      if (isHoliday) return false;
    }

    return true;
  };

  const getNextWorkingDay = (date: Date) => {
    let current = new Date(date);
    let count = 0;
    while (!isWorkingDay(current) && count < 365) {
      current.setDate(current.getDate() + 1);
      count++;
    }
    return current;
  };

  useEffect(() => {
    if (startDate && (selectedShift || holidayList.length > 0)) {
      const parts = startDate.split(" ");
      const dateParts = parts[0].split("/");
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts.map(Number);
        const fullYear = year < 100 ? 2000 + year : year;
        const current = new Date(fullYear, month - 1, day);
        const nextWorking = getNextWorkingDay(current);

        if (current.toDateString() !== nextWorking.toDateString()) {
          const hoursPart = parts[1] || "00:00:00";
          const adjustedDate = formatDate(nextWorking).split(" ")[0] + " " + hoursPart;
          setStartDate(adjustedDate);
        }
      }
    }
  }, [selectedShift, holidayList]);

  useEffect(() => {
    if (isPlaningAndSchedulingShow && assignedStages && Object.keys(assignedStages).length > 0) {
      calculateSingleStage(assignedStages, 0, 0);
    }
  }, [startDate, selectedShift, holidayList, repeatCount, (assignedStages ? Object.keys(assignedStages).length : 0)]);

  const fetchJigCategories = async () => {
    try {
      let result = await viewJigCategory();
      setJigCategories(result?.JigCategories);
    } catch (error) {

    }
  };
  const getAllPlaning = async () => {
    try {
      let result = await getPlaningAndSchedulingModel();
      setSavedPlaning(result?.PlaningAndScheduling);
    } catch (error) {

    }
  };
  const getHolidayList = async () => {
    try {
      let result = await fetchHolidays();
      return result.holidays;
    } catch (error) {

    }
  };
  const loadHolidays = async () => {
    const holidays = await getHolidayList();
    if (holidays) setHolidayList(holidays);
  };
  const formatDate = (dateString: any) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };
  const handleSubmitClonePlaning = async () => {
    const singleProcess = process.find(
      (value) => value?._id === selectedClonePlaning?.selectedProcess,
    );
    if (singleProcess?.selectedProduct) {
      getProduct(singleProcess?.selectedProduct);
    }
    setSelectedProcess(singleProcess);
    setProcessName(singleProcess?.name || "");
    const room = roomPlan.find(
      (value) => value?._id === selectedClonePlaning?.selectedRoom,
    );
    setSelectedRoom(room);
    const Shift = shifts.find(
      (value) => value?._id === selectedClonePlaning?.selectedShift,
    );
    setSelectedShift(Shift);
    calculateTimeDifference(Shift);
    setRepeatCount(selectedClonePlaning?.repeatCount);
    setStartDate(formatDate(selectedClonePlaning?.startDate));
    setAssignedStages(JSON.parse(selectedClonePlaning?.assignedStages));
    setAssignedOperators(JSON.parse(selectedClonePlaning?.assignedOperators));
    setEstimatedEndDate(formatDate(selectedClonePlaning?.estimatedEndDate));
    setTotalTimeEstimation(selectedClonePlaning?.totalTimeEstimation);
    setTotalUPHA(selectedClonePlaning?.totalUPHA);
    const reservedSeats = await checkSeatAvailability(
      room,
      Shift,
      formatDate(selectedClonePlaning?.startDate),
      formatDate(selectedClonePlaning?.estimatedEndDate),
    );
    let result = await getProductById(singleProcess?.selectedProduct);
    const assignedStages = allocateStagesToSeats(
      result,
      room,
      selectedClonePlaning?.repeatCount,
      reservedSeats,
    );
    if (!assignedStages) {
      return;
    }
    const uniqueAssignedStages = new Set();
    const seatCountPerStage = {};
    for (let key in assignedStages) {
      assignedStages[key].forEach((stage) => {
        uniqueAssignedStages.add(stage.name);
        seatCountPerStage[stage.name] =
          (seatCountPerStage[stage.name] || 0) + 1;
      });
    }
    setIsClonePlaningModel(false);
  };
  const checkSeatAvailability = async (
    selectedRoom: any,
    selectedShift: any,
    startDate: any,
    expectedEndDate: any,
  ) => {
    try {
      const shiftDataChange = JSON.stringify({
        startTime: selectedShift.startTime,
        endTime: selectedShift.endTime,
        shiftChangedFromDate: startDate,
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
      setSelectedProduct(result.product);
    } catch (error) {

    }
  };
  const getAllProcess = async () => {
    try {
      const pathname = window.location.pathname;
      const id = pathname.split("/").pop();
      const result = await viewProcess();
      let filterProcess = result.Processes.filter(
        (value) => value?.status == "waiting_schedule",
      );
      let selectedProces = result.Processes.filter((value) => value?._id == id);
      if (selectedProces.length > 0) {
        setStages(selectedProces[0].stages);
        setCommonStages(selectedProces[0].commonStages);
        getProduct(selectedProces[0].selectedProduct);
        setSelectedProcess(selectedProces[0]);
        setProcessName(selectedProces[0].name);
      }
      setProcess(filterProcess);
    } catch (error) {

    }
  };
  const handleRemoveStage = (
    rowIndex,
    seatIndex,
    stageIndex,
    rowSeatLength,
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
    const startDate = new Date(`1970-01-01T${selected.intervals[0].startTime}`);
    const endDate = new Date(
      `1970-01-01T${selected.intervals[selected.intervals.length - 1].endTime}`,
    );
    // 

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
      (sum: number, stageName: any) => {
        const stage = stages.find(
          (s: any) => s.stageName == stageName,
        );
        let seatCount = (seatCountPerStage as any)[stageName] || 1;

        if (stage && parseInt(stage.upha, 10) > 0) {
          const adjustedUPHA = parseInt(stage.upha, 10) * seatCount;
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
    // const unitsPer8HourDay = leastUpha * shiftTime;
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
  ) => {
    const stages = Stages;
    let stageIndex = 0;
    const newAssignedStages = {};
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
    selectedRoom.lines?.forEach((row: any, rowIndex: any) => {
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
        if (!newAssignedStages[key]) {
          newAssignedStages[key] = [];
        }
        if (stageIndex < stages.length * repeatCount) {
          const currentStage = stages[stageIndex % stages.length];

          const hasJigStepType = currentStage.subSteps.some(
            (step) => step.stepType === "jig",
          );
          newAssignedStages[key].push({
            name: currentStage.stageName,
            requiredSkill: currentStage.requiredSkill,
            upha: currentStage.upha,
            totalUPHA: 0,
            passedDevice: 0,
            ngDevice: 0,
            hasJigStepType,
          });
          stageIndex++;
        }
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
  const calculateTotalBreakHours = (slots) => {
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    const totalMinutes = slots.reduce((total, slot) => {
      return total + (toMinutes(slot.endTime) - toMinutes(slot.startTime));
    }, 0);
    return (totalMinutes / 60).toFixed(0);
  };
  const handleCalculation = async () => {
    try {
      if (!selectedProcess || !selectedProduct) {
        toast.error("Please ensure Process and Product are loaded.");
        console.warn("Missing selected process or product");
        return;
      }

      if (!selectedShift) {
        toast.error("Please select a Work Shift.");
        return;
      }

      if (!selectedRoom) {
        toast.error("Please select a Floor.");
        return;
      }

      if (!startDate) {
        toast.error("Please select a Plan Start Date.");
        return;
      }

      let totalQuantity = parseInt(selectedProcess?.quantity, 10);
      if (isNaN(totalQuantity) || totalQuantity <= 0) {
        console.warn("Invalid or missing process quantity");
        return;
      }
      const uphaValues = selectedProduct?.stages
        ?.map((stage: any) => parseInt(stage.upha, 10))
        .filter((val: number) => !isNaN(val) && val > 0);

      if (!uphaValues?.length) {
        toast.error("No valid positive UPHA values found in product stages");
        console.warn("No valid UPHA values found", selectedProduct?.stages);
        return;
      }

      const leastUpha = Math.min(...uphaValues);
      const breakSlots =
        selectedShift?.intervals?.filter((slot: any) => slot.breakTime) || [];

      const formattedBreaks = breakSlots.map((slot: any) => ({
        start: slot.startTime,
        end: slot.endTime,
      }));
      let totalBreakTime = 0;
      try {
        totalBreakTime = calculateTotalBreakHours(breakSlots) || 0;
      } catch (err) {
        console.error("Error calculating total break hours:", err);
      }
      if (!stages || stages.length === 0) {
        toast.error("No stages found for this process.");
        return;
      }

      const breakTime = totalBreakTime || 0;
      const adjustedShiftTime = shiftTime - breakTime / 60;

      if (adjustedShiftTime <= 0) {
        toast.error("Adjusted shift time is invalid (break time exceeds or equals shift time)");
        console.error("Adjusted shift time is invalid:", adjustedShiftTime);
        return;
      }

      const safeRepeatCount = parseInt(repeatCount, 10) || 1;
      const unitsPer8HourDay = leastUpha * adjustedShiftTime * safeRepeatCount;

      if (unitsPer8HourDay <= 0) {
        toast.error("Units per day calculation failed. Check UPHA and Shift settings.");
        console.error("Units per 8-hour day calculation failed", {
          leastUpha,
          adjustedShiftTime,
          safeRepeatCount,
          repeatCount
        });
        return;
      }

      const totalTimeEstimationInDays = totalQuantity / unitsPer8HourDay;

      let expectedEndDate: string | null = null;
      try {
        expectedEndDate = await calculateEstimatedEndDate(
          totalTimeEstimationInDays,
        );
      } catch (err) {
        console.error("Error calculating estimated end date:", err);
        return;
      }


      let reservedSeats = [];
      try {
        reservedSeats = await checkSeatAvailability(
          selectedRoom,
          selectedShift,
          startDate,
          expectedEndDate,
        );
      } catch (err) {
        console.error("Error checking seat availability:", err);
      }

      let assignedStages = {};
      try {
        assignedStages = allocateStagesToSeats(
          stages,
          selectedRoom,
          safeRepeatCount,
          reservedSeats,
        );
      } catch (err) {
        console.error("Error allocating stages to seats:", err);
        return;
      }

      if (!assignedStages || Object.keys(assignedStages).length === 0) {
        toast.error("Failed to allocate stages to seats. Check seat availability and repeat count.");
        console.warn("No assigned stages found");
        return;
      }
      const uniqueAssignedStages = new Set<string>();
      const seatCountPerStage: Record<string, number> = {};

      for (let key in assignedStages) {
        assignedStages[key].forEach((stage: any) => {
          uniqueAssignedStages.add(stage.name);
          seatCountPerStage[stage.name] =
            (seatCountPerStage[stage.name] || 0) + 1;
        });
      }
      setAssignedStages(assignedStages); // Fix: Set the assigned stages state
      setEstimatedEndDate(expectedEndDate);
      setTotalTimeEstimation(totalTimeEstimationInDays.toFixed(2));
      setTotalUPHA(unitsPer8HourDay.toFixed(2));
      setIsPlaningAndSchedulingShow(true);
    } catch (error: any) {
      console.error(
        "Unexpected error in handleCalculation:",
        error.message || error,
      );
    }
  };

  let holidayCache: Set<string> | null = null;

  const calculateEstimatedEndDate = async (totalDays: number) => {
    if (!startDate || !totalDays || totalDays <= 0) {
      console.warn("Invalid input: startDate or totalDays missing");
      return null;
    }

    const [datePart] = startDate.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const fullYear = year < 100 ? 2000 + year : year;

    let start = new Date(fullYear, month - 1, day);

    let remainingDays = totalDays;
    while (remainingDays > 0) {
      start.setDate(start.getDate() + 1);
      if (isWorkingDay(start)) {
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



  const handleDragStart = (stage: any, substep = null) => (event: any) => {
    const data = {
      name: stage.stageName,
      upha: stage.upha,
      substepName: substep ? [substep.stepName] : null,
      requiredSkill: stage.requiredSkill,
      managedBy: stage.managedBy,
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  };
  const moveItem = (fromCoordinates: any, toCoordinates: any) => {
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
  const handlePlaningDraft = async () => {
    try {
      const formData = new FormData();
      const filteredData = Object.fromEntries(
        Object.entries(assignedStages)
          .map(([key, value]) => [
            key,
            value.filter(
              (item) => !(item.name === "Reserved" && item.reserved === true),
            ),
          ])
          .filter(([_, value]) => value.length > 0), // Remove keys with empty arrays
      );
      formData.append("processName", processName);
      formData.append("selectedProcess", selectedProcess?._id || "");
      formData.append("selectedRoom", selectedRoom?._id || "");
      formData.append("selectedShift", selectedShift?._id || "");
      formData.append("repeatCount", repeatCount);
      formData.append("startDate", startDate);
      formData.append("assignedJigs", JSON.stringify(assignedJigs));
      formData.append("estimatedEndDate", estimatedEndDate);
      formData.append("totalTimeEstimation", totalTimeEstimation);
      formData.append(
        "ProcessShiftMappings",
        JSON.stringify({
          startTime: selectedShift?.startTime,
          endTime: selectedShift?.endTime,
          formattedShiftDate: startDate,
        }),
      );
      formData.append("totalUPHA", totalUPHA);
      formData.append("assignedJigs", JSON.stringify(assignedJigs));
      formData.append("assignedOperators", JSON.stringify(assignedOperators));
      formData.append("assignedStages", JSON.stringify(filteredData));
      formData.append("assignedCustomStages", JSON.stringify(commonStages));
      formData.append("assignedCustomStagesOp", JSON.stringify(assignedCustomOperators));
      formData.append("isDrafted", 1);
      formData.append("status", "Draft");
      const result = await createPlaningAndScheduling(formData);
      if (result && result.status === 200) {
        toast.success(result.message || "Plan Created Successfully");
        router.push("/process/view");
      } else {
        throw new Error(result.message || "Failed to create stage");
      }
    } catch (e) {

    }
    return false;
  };
  const handlePlaningSubmit = async () => {
    try {
      const formData = new FormData();
      let requiredKits = parseInt(selectedProcess?.quantity || "0");
      let isFirstElement = true;
      const filteredData = Object.fromEntries(
        Object.entries(assignedStages)
          .map(([key, value]) => [
            key,
            value
              .filter(
                (item) => !(item.name === "Reserved" && item.reserved === true),
              )
              .map((item) => {
                if (isFirstElement) {
                  isFirstElement = false;
                  return { ...item, totalUPHA: parseInt(totalUPHA || "0") };
                }
                return { ...item, totalUPHA: 0 };
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

      formData.append("processName", processName);
      formData.append("selectedProcess", selectedProcess?._id || "");
      formData.append("selectedRoom", selectedRoom?._id || "");
      formData.append("selectedShift", selectedShift?._id || "");
      formData.append("repeatCount", repeatCount);
      formData.append("startDate", startDate);
      formData.append("estimatedEndDate", estimatedEndDate);
      formData.append("totalTimeEstimation", totalTimeEstimation);
      formData.append("consumedKit", totalConsumedKits);
      formData.append("inventoryId", inventoryData?._id || "");
      formData.append("issuedKits", requiredKits);
      if (packagingData.length > 0) {
        formData.append(
          "issuedCarton",
          requiredKits / packagingData[0].packagingData.maxCapacity,
        );
      }
      formData.append(
        "ProcessShiftMappings",
        JSON.stringify({
          startTime: selectedShift?.startTime,
          endTime: selectedShift?.endTime,
          formattedShiftDate: startDate,
        }),
      );
      formData.append("totalUPHA", totalUPHA);
      formData.append("assignedJigs", JSON.stringify(filteredJigs));
      formData.append("assignedOperators", JSON.stringify(filteredOperators));
      formData.append("assignedStages", JSON.stringify(filteredData));
      formData.append("assignedCustomStages", JSON.stringify(commonStages));
      formData.append("assignedCustomStagesOp", JSON.stringify(assignedCustomOperators));
      formData.append("isDrafted", 0);
      formData.append("status", "Waiting_Kits_allocation");

      const result = await createPlaningAndScheduling(formData);
      if (result && result?.status === 200) {
        let newPlaningData = result?.newPlanAndScheduling;
        let userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (Object.keys(filteredOperators).length > 0) {
          Object.keys(filteredOperators).forEach(async (operatorKey) => {
            const jigForSeat = operatorKey.split("-");
            const formData3 = new FormData();
            formData3.append("action", "PLANING_CREATED");
            formData3.append("processId", selectedProcess?._id || "");
            formData3.append("userId", userDetails?._id || "");
            formData3.append(
              "description",
              `${filteredOperators[operatorKey]?.[0]?.name} Operator successfully assigned to ${newPlaningData?.processName} at Stage ${assignedStages[operatorKey]?.[0]?.name}, Seat ${jigForSeat[0]}-${jigForSeat[1]} by ${userDetails?.name}.`,
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
              formAssignOperator.append("startDate", startDate);
              formAssignOperator.append("status", "Occupied");
              const setAssignedOperators =
                await createAssignedOperatorsToPlan(formAssignOperator);
              const result = await createProcessLogs(formData3);
            } catch (error) {
              console.error("Error creating plan logs: ", error);
            }
          });
        }
        if (Object.keys(assignedCustomOperators).length > 0) {
          Object.keys(assignedCustomOperators).forEach(async (customOpKey) => {
            const operatorsForStage = assignedCustomOperators[parseInt(customOpKey)];
            if (operatorsForStage && operatorsForStage.length > 0) {
              operatorsForStage.forEach(async (operator: any) => {
                const formData4 = new FormData();
                formData4.append("action", "PLANING_CREATED");
                formData4.append("processId", selectedProcess?._id || "");
                formData4.append("userId", userDetails?._id || "");
                formData4.append(
                  "description",
                  `${operator?.name} Operator successfully assigned to ${newPlaningData?.processName} at Common Stage ${commonStages[parseInt(customOpKey)]?.stageName} by ${userDetails?.name}.`,
                );

                try {
                  const formAssignOperator = new FormData();
                  formAssignOperator.append("processId", selectedProcess?._id);
                  formAssignOperator.append("userId", operator?._id);
                  formAssignOperator.append("roomName", selectedRoom?._id);
                  formAssignOperator.append("seatDetails", JSON.stringify({}));
                  formAssignOperator.append("startDate", startDate);
                  formAssignOperator.append("status", "Occupied");
                  formAssignOperator.append("stageType", "common");
                  await createAssignedOperatorsToPlan(formAssignOperator);
                  await createProcessLogs(formData4);
                } catch (error) {
                  console.error("Error creating custom plan logs: ", error);
                }
              });
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
            formData2.append("processId", selectedProcess?._id || "");
            formData2.append("userId", userDetails?._id || "");
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
        const formData1 = new FormData();

        formData1.append("action", "CREATE");
        formData1.append("processId", selectedProcess?._id || "");
        formData1.append("userId", userDetails?._id);
        formData1.append(
          "description",
          `${newPlaningData?.processName} Created Successfully by ${userDetails?.name}`,
        );
        const result1 = await createProcessLogs(formData1);
        if (result1 && result1?.status === 200) {
          toast.success(result?.message || "Plan Created Successfully");
          router.push("/process/view");
        } else {
          toast.error(
            result?.message || "An error occurred while creating the stage.",
          );
          throw new Error(result?.message || "Failed to create Logs");
        }
      } else {
        toast.error(
          result?.message || "An error occurred while creating the stage.",
        );
        throw new Error(result?.message || "Failed to create Logs");
      }
    } catch (e) {
      console.error("Error Creating Plan ==>", e);
      toast.error(e?.error || "An error occurred while creating the stage.");
    }
    return false;
  };
  const handlePlaningModel = (event: any) => {
    const selected = getSavedPlaning.find((value) => value._id === event);
    setSelectedClonePlaning(selected);
  };
  const openCustomStagesModal = (stage, index) => {
    const requiredSkill = stage.requiredSkill?.toLowerCase().trim();
    const requiredUserType = stage.managedBy;
    const assignedOperatorIds = Object.values(assignedOperators)
      .flat()
      .map((operator) => operator._id);
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
  const isOperatorAssignedToAnySeat = (operatorName: any) => {
    return Object.values(assignedOperators).some((operatorsForSeat) =>
      operatorsForSeat?.some(
        (assignedOperator) => assignedOperator.name === operatorName,
      ),
    );
  };
  const closeCustomStagesModal = () => {
    setCustomStagesModalOpen(false);
  };
  const handleCustomStagesubmitOperator = () => {
    setCustomStagesModalOpen(false);
  };
  const handleRemoveAssignCustomOperator = (index, opId) => {
    try {
      const key = `${index}`;
      setAssignedCustomOperators((prevAssignedOperators) => {
        const newAssignedOperators = { ...prevAssignedOperators };
        delete newAssignedOperators[key];
        return newAssignedOperators;
      });
    } catch (error) {

    }
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <Breadcrumb
        parentName="Planning & Scheduling Management"
        pageName="Add Scheduling Management"
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
            <div className="flex flex-col items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark sm:flex-row">
              <h3 className="mb-2 text-xl font-semibold text-black dark:text-white sm:mb-0">
                Add Planning & Scheduling
              </h3>

              {/* <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-sm transition-all duration-200 hover:bg-blue-500"
                onClick={() => setIsClonePlaningModel(true)}
              >
                Clone Planning
              </button> */}

              <Modal
                isOpen={isClonePlaningModel}
                onSubmit={handleSubmitClonePlaning}
                onClose={closeClonePlaningModal}
                title="Clone Planning"
              >
                <div className="flex flex-col gap-4">
                  <label className="text-gray-800 dark:text-gray-200 mb-1 block text-sm font-medium">
                    Choose Planning Model
                  </label>
                  <select
                    value={selectedClonePlaning?._id || ""}
                    onChange={(e) => handlePlaningModel(e.target.value)}
                    className="dark:bg-gray-700 text-gray-900 w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none transition focus:border-primary focus:ring focus:ring-primary/20 dark:text-white"
                  >
                    <option value="">Please Select</option>
                    {getSavedPlaning?.map((planing) => (
                      <option
                        key={planing._id}
                        value={planing._id}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        {planing?.processName}
                      </option>
                    ))}
                  </select>
                </div>
              </Modal>
            </div>

            <form action="#">
              <div className="p-6">
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
                  assignedStages={assignedStages}
                  getProduct={getProduct}
                  productName={productName}
                  processName={processName}
                  setProcessName={setProcessName}
                  packagingData={packagingData}
                  inventoryData={inventoryData}
                  holidays={holidayList}
                />

                {totalTimeEstimation && (
                  <div className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-md font-bold text-gray-900 dark:text-white font-outfit">Production Analytics</h3>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Real-time scheduling insights</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800 transition-all hover:shadow-md">
                        <div className="relative z-10">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Estimated Completion</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900 dark:text-white font-outfit">
                              {estimatedEndDate && estimatedEndDate.split(" ")[0]}
                            </span>
                          </div>
                          <span className="mt-0.5 block text-xs font-bold text-blue-600 dark:text-blue-400">
                            {estimatedEndDate.split(" ")[1] || ""}
                          </span>
                        </div>
                        <Calendar className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-500/5 dark:text-blue-400/5" />
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800 transition-all hover:shadow-md">
                        <div className="relative z-10">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Total Duration</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900 dark:text-white font-outfit">
                              {totalTimeEstimation}
                            </span>
                            <span className="text-xs font-bold text-gray-500 uppercase">Days</span>
                          </div>
                        </div>
                        <FaClock className="absolute -bottom-2 -right-2 h-16 w-16 text-purple-500/5 dark:text-purple-400/5" />
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800 transition-all hover:shadow-md">
                        <div className="relative z-10">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">UPHA Analysis</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900 dark:text-white font-outfit">
                              {totalUPHA}
                            </span>
                            <span className="text-xs font-bold text-gray-500 uppercase">U/Day</span>
                          </div>
                          <p className="mt-0.5 text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">
                            Active:{" "}
                            {(
                              shiftTime -
                              parseInt(selectedShift?.totalBreakTime || "0") / 60
                            ).toFixed(2)}{" "}
                            Hrs
                          </p>
                        </div>
                        <FaCogs className="absolute -bottom-2 -right-2 h-16 w-16 text-green-500/5 dark:text-green-400/5" />
                      </div>
                    </div>
                  </div>
                )}

                {isPlaningAndSchedulingShow && (
                  <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
                    <div className="flex flex-col xl:flex-row gap-6">
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
                                          jigCategories={jigCategories}
                                          assignedJigs={assignedJigs}
                                          setAssignedJigs={setAssignedJigs}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

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
                                  {isOperatorAssignedToAnySeat(operator?.name) ? " — (Assigné)" : ""}
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

                    <div className="flex justify-end gap-2 p-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                      <button
                        className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        type="button"
                        onClick={handlePlaningDraft}
                      >
                        Save Draft
                      </button>
                      <button
                        className="rounded-lg bg-blue-600 px-8 py-2 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        type="button"
                        onClick={handlePlaningSubmit}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isFullLayoutModalOpen}
        onClose={() => setIsFullLayoutModalOpen(false)}
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
                        jigCategories={jigCategories}
                        assignedJigs={assignedJigs}
                        setAssignedJigs={setAssignedJigs}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </DndProvider>
  );
};

export default ADDPlanSchedule;
