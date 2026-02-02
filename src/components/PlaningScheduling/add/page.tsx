"use client";
import React, { useState, useEffect } from "react";
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
import { Clock } from "lucide-react";

const ADDPlanSchedule = () => {
  const [shiftTime, setShiftTime] = useState(0);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [process, setProcess] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [roomPlan, setRoomPlan] = useState([]);
  const [assignedStages, setAssignedStages] = useState({});
  const [startDate, setStartDate] = useState("");
  const [totalTimeEstimation, setTotalTimeEstimation] = useState("");
  const [totalUPHA, setTotalUPHA] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [repeatCount, setRepeatCount] = useState("");
  const [operators, setOperators] = useState([]);
  const [assignedOperators, setAssignedOperators] = useState([]);
  const [assignedJigs, setAssignedJigs] = useState([]);
  const [filteredOperators, setFilteredOperators] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  const [isClonePlaningModel, setIsClonePlaningModel] = useState(false);
  const [selectedClonePlaning, setSelectedClonePlaning] = useState({});
  const [getSavedPlaning, setSavedPlaning] = useState([]);
  const [jigCategories, setJigCategories] = useState([]);
  const [productName, setProductName] = useState("");
  const [processName, setProcessName] = useState("");
  const [packagingData, setPackagingData] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [totalConsumedKits, setTotalConsumedkits] = useState(0);
  const [assignedCustomOperators, setAssignedCustomOperators] = useState([]);
  const [isPlaningAndSchedulingShow, setIsPlaningAndSchedulingShow] =
    useState(false);
  const [customStagesCompatibleOperator, setCustomStagesCompatibleOperator] =
    useState([]);
  const [stages, setStages] = useState([]);
  const [commonStages, setCommonStages] = useState([]);
  const [customStagesIndexVal, setCustomStagesIndexVal] = useState(0);
  const [isCustomStagesModalOpen, setCustomStagesModalOpen] = useState(false);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState(false);
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
  }, []);
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
      setStages(selectedProces[0].stages);
      setCommonStages(selectedProces[0].commonStages);
      getProduct(selectedProces[0].selectedProduct);
      setSelectedProcess(selectedProces[0]);
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
        console.warn("Missing selected process or product");
        return;
      }

      let totalQuantity = parseInt(selectedProcess?.quantity, 10);
      if (isNaN(totalQuantity) || totalQuantity <= 0) {
        console.warn("Invalid or missing process quantity");
        return;
      }
      const uphaValues = selectedProduct?.stages
        ?.map((stage: any) => parseInt(stage.upha, 10))
        .filter((val: number) => !isNaN(val));

      if (!uphaValues?.length) {
        console.warn("No valid UPHA values found");
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
      const breakTime = totalBreakTime || 0;
      const adjustedShiftTime = shiftTime - breakTime / 60;

      if (adjustedShiftTime <= 0) {
        console.error("Adjusted shift time is invalid:", adjustedShiftTime);
        return;
      }

      const unitsPer8HourDay = leastUpha * adjustedShiftTime * repeatCount;


      if (unitsPer8HourDay <= 0) {
        console.error("Units per 8-hour day calculation failed");
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
          repeatCount,
          reservedSeats,
        );
      } catch (err) {
        console.error("Error allocating stages to seats:", err);
        return;
      }

      if (!assignedStages || Object.keys(assignedStages).length === 0) {
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

  // const handleCalculation = async () => {
  //   if (!selectedProcess || !selectedProduct) {
  //     return;
  //   }
  //   let totalQuantity = parseInt(selectedProcess?.quantity);
  //   if (isNaN(totalQuantity) || totalQuantity <= 0) {
  //     return;
  //   }

  //   const uphaValues = selectedProduct?.stages?.map((stage: any) =>
  //     parseInt(stage.upha, 10),
  //   );
  //   const leastUpha = Math.min(...uphaValues);
  //   const breakSlots = selectedShift?.intervals?.filter(
  //     (slot) => slot.breakTime,
  //   );
  //   const formattedBreaks = breakSlots.map((slot) => ({
  //     start: slot.startTime,
  //     end: slot.endTime,
  //   }));
  //   const totalBreakTime = calculateTotalBreakHours(breakSlots);

  //   const breakTime = totalBreakTime || 0;
  //   const adjustedShiftTime = shiftTime - breakTime / 60;
  //   const unitsPer8HourDay = leastUpha * adjustedShiftTime * repeatCount;
  //   const totalTimeEstimationInDays = totalQuantity / unitsPer8HourDay;

  //   const expectedEndDate = await calculateEstimatedEndDate(
  //     totalTimeEstimationInDays,
  //   );

  //   
  //   // const reservedSeats = await checkSeatAvailability(
  //   //   selectedRoom,
  //   //   selectedShift,
  //   //   startDate,
  //   //   expectedEndDate,
  //   // );
  //   // const assignedStages = allocateStagesToSeats(
  //   //   stages,
  //   //   selectedRoom,
  //   //   repeatCount,
  //   //   reservedSeats,
  //   // );
  //   if (!assignedStages) {
  //     return;
  //   }
  //   const uniqueAssignedStages = new Set();
  //   const seatCountPerStage = {};

  //   for (let key in assignedStages) {
  //     assignedStages[key].forEach((stage) => {
  //       uniqueAssignedStages.add(stage.name);
  //       seatCountPerStage[stage.name] =
  //         (seatCountPerStage[stage.name] || 0) + 1;
  //     });
  //   }

  //   setEstimatedEndDate(expectedEndDate);
  //   setTotalTimeEstimation(totalTimeEstimationInDays.toFixed(2));
  //   setTotalUPHA(unitsPer8HourDay.toFixed(2));
  //   setIsPlaningAndSchedulingShow(true);
  // };
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

    // âœ… Cache holidays so API isnâ€™t called every time
    // if (!holidayCache) {
    //   try {
    //     // const holidayList = await getHolidayList();
    //     // holidayCache = new Set(
    //     //   holidayList.map((h: any) => new Date(h.holidayDate).toDateString()),
    //     // );
    //   } catch (err) {
    //     console.error("Failed to fetch holidays:", err);
    //     holidayCache = new Set();
    //   }
    // }

    let remainingDays = totalDays;
    while (remainingDays > 0) {
      start.setDate(start.getDate() + 1);

      const currentDate = start.toDateString();
      const isWeekend = start.getDay() === 0 || start.getDay() === 6;
      // const isHoliday = holidayCache.has(currentDate);

      if (!isWeekend) {
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

  // const calculateEstimatedEndDate = async (totalDays: any) => {
  //   const [datePart, timePart] = startDate.split(" ");
  //   const [day, month, year] = datePart.split("/").map(Number);
  //   const fullYear = year < 100 ? 2000 + year : year;
  //   let start = new Date(fullYear, month - 1, day);

  //   // let holidayList = await getHolidayList();
  //   // 
  //   // const holidays = holidayList.map((holiday: any) =>
  //   //   new Date(holiday.holidayDate).toDateString(),
  //   // );

  //   let remainingDays = totalDays;
  //   while (remainingDays > 0) {
  //     start.setDate(start.getDate() + 1);

  //     const currentDate = start.toDateString();
  //     const isWeekend = start.getDay() === 0 || start.getDay() === 6;
  //     //const isHoliday = holidays.includes(currentDate);

  //     // if (!isWeekend && !isHoliday) {
  //     if (!isWeekend) {
  //       remainingDays -= 1;
  //     }
  //   }

  //   const formattedEndDate = `${String(start.getDate()).padStart(2, "0")}/${String(
  //     start.getMonth() + 1,
  //   ).padStart(2, "0")}/${String(start.getFullYear()).slice(-2)} ${String(
  //     start.getHours(),
  //   ).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:${String(
  //     start.getSeconds(),
  //   ).padStart(2, "0")}`;
  //   
  //   return false;
  //   return formattedEndDate;
  // };
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
      formData.append("selectedProcess", selectedProcess?._id);
      formData.append("selectedRoom", selectedRoom?._id);
      formData.append("selectedShift", selectedShift?._id);
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
      formData.append("isDrafted", 1);
      formData.append("status", "Draft");
      const result = await createPlaningAndScheduling(formData);
      if (result && result.status === 200) {
        toast.success(result.message || "Jig Created Successfully");
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
      let requiredKits = parseInt(selectedProcess?.quantity);
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
                  return { ...item, totalUPHA: parseInt(totalUPHA) };
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
      formData.append("selectedProcess", selectedProcess?._id);
      formData.append("selectedRoom", selectedRoom?._id);
      formData.append("selectedShift", selectedShift?._id);
      formData.append("repeatCount", repeatCount);
      formData.append("startDate", startDate);
      formData.append("estimatedEndDate", estimatedEndDate);
      formData.append("totalTimeEstimation", totalTimeEstimation);
      formData.append("consumedKit", totalConsumedKits);
      formData.append("inventoryId", inventoryData._id);
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
          toast.success(result?.message || "Jig Created Successfully");
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

              {/* Clone Planning Button */}
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-sm transition-all duration-200 hover:bg-blue-500"
                onClick={() => setIsClonePlaningModel(true)}
              >
                Clone Planning
              </button>

              {/* Clone Planning Modal */}
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
                />
                {/* end FormComponent 1 */}
                {totalTimeEstimation && (
                  <div className="dark:bg-gray-800 border-gray-300 dark:border-gray-700 mt-6 rounded-xl border bg-white p-6 shadow-lg transition-all duration-300">
                    <h3 className="text-gray-800 mb-5 flex items-center gap-2 text-xl font-semibold dark:text-white">
                      <Clock className="h-5 w-5 text-primary" />
                      Time & Production Estimation
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                      {/* Estimated Completion Date */}
                      <div className="bg-gray-50 dark:bg-gray-700 flex flex-col gap-2 rounded-lg p-4 shadow-sm">
                        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                          Estimated Completion Date
                        </span>
                        <span className="text-md text-gray-900 font-semibold dark:text-white">
                          {estimatedEndDate}
                        </span>
                      </div>

                      {/* Total Time Estimation */}
                      <div className="bg-gray-50 dark:bg-gray-700 flex flex-col gap-2 rounded-lg p-4 shadow-sm">
                        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                          Total Time Estimation
                        </span>
                        <span className="text-md text-gray-900 font-semibold dark:text-white">
                          {totalTimeEstimation} Days
                        </span>
                      </div>

                      {/* Units Processed Per Hour */}
                      <div className="bg-gray-50 dark:bg-gray-700 flex flex-col gap-2 rounded-lg p-4 shadow-sm">
                        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                          Units Processed Per Hour
                        </span>
                        <span className="text-md text-gray-900 font-semibold dark:text-white">
                          {(
                            shiftTime -
                            parseInt(selectedShift?.totalBreakTime || "0") / 60
                          ).toFixed(2)}{" "}
                          -Hour Day: {totalUPHA}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isPlaningAndSchedulingShow && (
                  <div>
                    {/* Component 2 */}
                    <div className="mt-4 flex gap-10">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                          Stages
                        </h3>
                        <div className="custom-scroll mt-4 h-90 flex-wrap gap-4 overflow-x-auto pt-4">
                          {stages?.map((stage, index) => (
                            <div className="mb-2" key={index}>
                              <button
                                className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-400"
                                type="button"
                                draggable
                                onDragStart={handleDragStart(stage)}
                              >
                                {stage.stageName}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-[200%]">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                          Room
                        </h3>
                        <div
                          className="bg-gray-50 mt-4 grid h-screen gap-6 overflow-x-auto rounded-lg p-4 shadow-inner"
                          style={{ position: "relative", width: "auto" }}
                        >
                          {selectedRoom?.lines?.map((row, rowIndex) => (
                            <div key={rowIndex} className="mb-4">
                              <div className="text-md mb-2 font-bold">
                                {row.rowName}
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                {row.seats?.map((seat, seatIndex) => (
                                  <DraggableGridItem
                                    key={`${rowIndex}-${seatIndex}`}
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
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <h3 className="text-md font-semibold text-black dark:text-white">
                            Other Stages
                          </h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4 overflow-x-auto pt-4">
                          {commonStages?.map((value, index) => (
                            <>
                              <div
                                key={index}
                                className="border-gray-300 mb-4 mt-4 flex flex-col rounded-lg border-2 border-green-500 bg-green-200 p-2 transition-all duration-300 hover:shadow-lg"
                                title="Drop Stage Here"
                              >
                                <span className="text-gray-800 flex items-center justify-between text-xs font-bold">
                                  <p className="text-sm font-bold">
                                    {" "}
                                    {value?.stageName}
                                  </p>
                                </span>
                                <div className="mt-1">
                                  <div>
                                    <div className="flex items-center justify-end ">
                                      {assignedCustomOperators[index] &&
                                        assignedCustomOperators[index].length >
                                        0 && (
                                          <div className="flex gap-2">
                                            {assignedCustomOperators[index].map(
                                              (op, i) => (
                                                <>
                                                  <div className="flex">
                                                    <p
                                                      key={i}
                                                      className="text-gray-700 text-sm"
                                                    >
                                                      {op.name}
                                                    </p>
                                                    <button
                                                      type="button"
                                                      className="h-5 rounded-full p-1 transition-all duration-200"
                                                      onClick={() =>
                                                        handleRemoveAssignCustomOperator(
                                                          index,
                                                          op?._id,
                                                        )
                                                      }
                                                    >
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="2"
                                                        stroke="currentColor"
                                                        className="h-3 pt-0.5"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          d="M6 18L18 6M6 6l12 12"
                                                        />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </>
                                              ),
                                            )}
                                          </div>
                                        )}
                                      {!assignedCustomOperators[index] && (
                                        <div className="mt-2 flex justify-end">
                                          <button
                                            type="button"
                                            className="text-dark ml-3 h-6 rounded-full bg-gray p-1.5 transition-all duration-200"
                                            onClick={() =>
                                              openCustomStagesModal(
                                                value,
                                                index,
                                              )
                                            }
                                          >
                                            <svg
                                              fill="#000000"
                                              version="1.1"
                                              id="Capa_1"
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="10px"
                                              height="10px"
                                              viewBox="0 0 45.402 45.402"
                                              stroke="#000000"
                                            >
                                              <g
                                                id="SVGRepo_bgCarrier"
                                                strokeWidth="0"
                                              ></g>
                                              <g
                                                id="SVGRepo_tracerCarrier"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              ></g>
                                              <g id="SVGRepo_iconCarrier">
                                                <path d="M41.267,18.557H26.832V4.134C26.832,1.851,24.99,0,22.707,0c-2.283,0-4.124,1.851-4.124,4.135v14.432H4.141 c-2.283,0-4.139,1.851-4.138,4.135c-0.001,1.141,0.46,2.187,1.207,2.934c0.748,0.749,1.78,1.222,2.92,1.222h14.453V41.27 c0,1.142,0.453,2.176,1.201,2.922c0.748,0.748,1.777,1.211,2.919,1.211c2.282,0,4.129-1.851,4.129-4.133V26.857h14.435 c2.283,0,4.134-1.867,4.133-4.15C45.399,20.425,43.548,18.557,41.267,18.557z"></path>
                                              </g>
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Modal
                      isOpen={isCustomStagesModalOpen}
                      onSubmit={handleCustomStagesubmitOperator}
                      onClose={closeCustomStagesModal}
                      title="Assign Operators"
                    >
                      <div>
                        <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                          Operators
                        </label>
                        <select
                          onChange={(e) => handleOperator(e.target.value)}
                          className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                        >
                          <option value="">Please Select</option>
                          {customStagesCompatibleOperator?.map(
                            (operator, index) => (
                              <option
                                key={index}
                                value={operator?._id}
                                className="text-body dark:text-bodydark"
                                disabled={isOperatorAssignedToAnySeat(
                                  operator?.name,
                                )}
                              >
                                {operator.name}
                                {isOperatorAssignedToAnySeat(operator?.name) &&
                                  "(Assigned)"}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </Modal>
                    {/* End Component 2 */}
                    <div className="flex justify-end gap-2 p-6">
                      <button
                        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-400"
                        type="button"
                        onClick={handlePlaningDraft}
                      >
                        Save Draft
                      </button>
                      <button
                        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-400"
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
    </DndProvider>
  );
};

export default ADDPlanSchedule;
