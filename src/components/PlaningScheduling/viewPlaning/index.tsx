"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import FormComponent from "@/components/PlaningScheduling/edit/FormComponents";
import {
  viewRoom,
  getProductById,
  viewProcess,
  viewShift,
  getUsers,
  checkPlanningAndScheduling,
  getPlaningAndSchedulingById,
  fetchHolidays,
  viewJigCategory,
  getDeviceTestRecordsByProcessId,
} from "@/lib/api";
import {
  FiClipboard,
  FiTag,
  FiClock,
  FiHash,
  FiLayers,
  FiBox,
  FiCalendar,
  FiInfo,
  FiPackage,
  FiArchive,
  FiTrendingUp,
} from "react-icons/fi";
import { FiUsers, FiActivity, FiCheckCircle, FiXCircle, FiSearch, FiFilter } from "react-icons/fi";
import { formatDate } from "@/lib/common";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Modal from "@/components/Modal/page";
import ConfirmationPopup from "@/components/Confirmation/page";
import { FiCodepen, FiEdit } from "react-icons/fi";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import CardDataStats from "@/components/CardDataStats";
const DraggableGridItem = ({
  item,
  rowIndex,
  seatIndex,
  handleDrop,
  handleDragOver,
  handleRemoveStage,
  assignedStages,
  coordinates,
  moveItem,
  operators,
  assignedOperators,
  setAssignedOperators,
  filteredOperators,
  setFilteredOperators,
  rowSeatLength,
  setAssignedJigs,
  assignedJigs,
  jigCategories,
  selectedProcess,
  seatStatusFilter,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => setIsModalOpen(false);
  const [isAssignJigModalOpen, setAssignJigModelOpen] = useState(false);
  const [jigs, setJigs] = useState([]);
  const [noOfKits, setNoOfKits] = useState(0);
  const openModal = (stages: any) => {
    const requiredSkills = stages.map((stage) =>
      stage.name.toLowerCase().trim(),
    );
    const compatibleOperators = operators.filter((operator) => {
      const normalizedSkills = operator.skills.map((skill) =>
        skill.toLowerCase().trim(),
      );
      const hasAllSkills = requiredSkills.every((skill) =>
        normalizedSkills.includes(skill),
      );
      return hasAllSkills;
    });
    setFilteredOperators(compatibleOperators);
    setIsModalOpen(true);
  };
  const [{ isDragging }, drag] = useDrag({
    type: "Test",
    item: { coordinates },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const [, drop] = useDrop({
    accept: "Test",
    hover: () => {},
    drop: (draggedItem) => {
      if (draggedItem.coordinates !== coordinates) {
        moveItem(draggedItem.coordinates, coordinates);
      }
    },
  });

  return (
    <div
      key={seatIndex}
      className={`flex flex-col rounded-lg border-2 p-2 transition-all duration-300 ${
        assignedStages[coordinates] && assignedStages[coordinates].length > 0
          ? !assignedStages[coordinates][0]?.reserved
            ? "border-green-500 bg-green-200 shadow-xl"
            : "border-danger bg-[#fbc0c0] shadow-xl"
          : "hidden"
      }`}
      title={
        assignedStages[coordinates] &&
        assignedStages[coordinates].length > 0 &&
        assignedStages[coordinates].map((stage: any) => stage.name).join(", ")
      }
    >
      {/* Seat Number */}
      <span className="text-gray-800 flex items-center justify-between text-xs font-bold">
        <p className="text-sm">S{item.seatNumber}</p>
      </span>

      {/* Assigned Stages */}
      <div className="mt-1">
        {assignedStages[coordinates] &&
          assignedStages[coordinates].length > 0 &&
          assignedStages[coordinates]
            .filter((stage: any) => {
              const status =
                stage?.reserved
                  ? "Reserved"
                  : selectedProcess?.quantity > stage?.totalUPHA
                  ? stage?.totalUPHA > 0
                    ? "Active"
                    : "Downtime"
                  : "Completed";
              return seatStatusFilter === "all" ? true : seatStatusFilter === status;
            })
            .map((stage: any, stageIndex: number) => (
            <div key={stageIndex}>
              <div className="flex items-center justify-between">
                <strong className="text-gray-900 text-xs">
                  {stage.name}
                  {stage.name === "Reserved" ? (
                    <>
                      <p>Process Name : {stage?.processName}</p>
                      <p>Process Id : {stage?.pId}</p>
                    </>
                  ) : (
                    <>
                      <p>UPH Target: {stage.upha}</p>
                      <p>Achieved UPH:</p>
                      <div className="my-2">
                        {stage?.totalUPHA != null && (
                          <p>WIP : {String(stage?.totalUPHA)}</p>
                        )}
                        <p>Pass : {stage.passedDevice || 0}</p>
                        <p>NG : {stage.ngDevice || 0}</p>
                        <p>
                          Status :{" "}
                          <span
                            className={
                              selectedProcess?.quantity > stage?.totalUPHA
                                ? stage?.totalUPHA > 0
                                  ? "font-semibold text-orange-500"
                                  : "font-semibold text-danger"
                                : "font-semibold text-green-600"
                            }
                          >
                            {selectedProcess?.quantity > stage?.totalUPHA
                              ? stage?.totalUPHA > 0
                                ? "Active"
                                : "Downtime"
                              : "Completed"}
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                </strong>
              </div>

              {/* Assigned Operators */}
              {assignedOperators[coordinates]?.map(
                (operator: any, index1: number) => (
                  <p
                    key={`${coordinates}-${operator._id || index1}`}
                    className="flex items-center justify-end pr-1 text-xs"
                  >
                    <span>
                      <strong>Operator : </strong>
                      {operator.name}
                    </span>
                  </p>
                ),
              )}

              {/* Assigned Jigs */}
              {assignedJigs[coordinates]?.map((jig: any, index: number) => (
                <p
                  key={index}
                  className="flex items-center justify-end text-xs"
                >
                  <span>
                    <strong>Jig : </strong>
                    {jig?.name}
                  </span>
                </p>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

const ViewPlanSchedule = () => {
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
  const [filteredOperators, setFilteredOperators] = useState([]);
  const [productName, setProductName] = useState("");
  const [downTimeFrom, setDownTimeFrom] = useState("");
  const [downTimeTo, setDownTimeTo] = useState("");
  const [downTimeDesc, setDownTimeDescription] = useState("");
  const [downTimeval, setDownTimeVal] = useState({});
  const [id, setID] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDownTimeModalOpen, setIsDownTimeModalOpen] = useState(false);
  const closeDownTimeModal = () => setIsDownTimeModalOpen(false);
  const [showPopup, setShowPopup] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shiftChangedFromDate, setShiftChangedFromDate] = useState("");
  const [processName, setProcessName] = useState("");
  const [assignedJigs, setAssignedJigs] = useState([]);
  const [jigCategories, setJigCategories] = useState([]);
  const [packagingData, setPackagingData] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [totalConsumedKits, setTotalConsumedkits] = useState(0);
  const [overAllUPHA, setOverallUPHA] = useState([]);
  const [completedKitsUPH, setCompletedKitsUPH] = useState([]);
  const [planData, setPlanData] = useState([]);
  const [lastStageOverallSummary, setStageOverallSummary] = useState(0);
  const [assignedCustomStages, setAssignedCustomStages] = useState([]);
  const [assignedCustomOperators, setAssignedCustomOperators] = useState([]);
  const [seatStatusFilter, setSeatStatusFilter] = useState("all");
  const [showOccupiedOnly, setShowOccupiedOnly] = useState(true);
  const [seatSearch, setSeatSearch] = useState("");
  const occupancyStats = React.useMemo(() => {
    let active = 0;
    let downtime = 0;
    let completed = 0;
    let reserved = 0;
    Object.keys(assignedStages || {}).forEach((coord) => {
      const arr = assignedStages[coord];
      if (!arr || arr.length === 0) return;
      const s = arr[0];
      if (s?.reserved) {
        reserved += 1;
        return;
      }
      const status =
        selectedProcess?.quantity > s?.totalUPHA
          ? s?.totalUPHA > 0
            ? "Active"
            : "Downtime"
          : "Completed";
      if (status === "Active") active += 1;
      else if (status === "Downtime") downtime += 1;
      else completed += 1;
    });
    return { active, downtime, completed, reserved };
  }, [assignedStages, selectedProcess]);
  const getCurrentDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const [filterDate, setFilterDate] = useState(getCurrentDate());
  const data = [
    { hour: "1st Hour", values: [12, 11, 20, "", ""] },
    { hour: "2nd Hour", values: [40, "", "", "", ""] },
    { hour: "3rd Hour", values: [20, "", "", "", ""] },
    { hour: "4th Hour", values: ["", "", "", "", ""] },
    { hour: "5th Hour", values: ["", "", "", "", ""] },
    { hour: "6th Hour", values: ["", "", "", "", ""] },
    { hour: "7th Hour", values: ["", "", "", "", ""] },
    { hour: "8th Hour", values: ["", "", "", "", ""] },
    { hour: "Avg UPH", values: ["", "", "", "", ""] },
  ];

  const overallUPHData = [
    { hour: "1st Hour", value: 13 },
    { hour: "2nd Hour", value: 20 },
    { hour: "3rd Hour", value: 50 },
    { hour: "4th Hour", value: 40 },
    { hour: "5th Hour", value: 60 },
    { hour: "6th Hour", value: 0 },
    { hour: "7th Hour", value: 0 },
    { hour: "8th Hour", value: 0 },
  ];
  const total = overallUPHData.reduce(
    (acc, curr) => acc + (parseInt(curr.value) || 0),
    0,
  );
  const count = overallUPHData.filter((d) => d.value !== "").length;
  const avgUPH = count > 0 ? (total / count).toFixed(2) : 0;

  const summaryData = React.useMemo(() => {
    const required = parseInt(selectedProcess?.quantity) || 0;
    const issued = parseInt(selectedProcess?.issuedKits) || 0;
    const pending = Math.max(required - issued, 0);
    const avg = parseInt(lastStageOverallSummary) || 0;
    return { required, issued, pending, avg };
  }, [selectedProcess, lastStageOverallSummary]);
  const uphStats = React.useMemo(() => {
    const pass = (completedKitsUPH || []).reduce(
      (acc, row) => acc + (parseInt(row?.Pass) || 0),
      0,
    );
    const ng = (completedKitsUPH || []).reduce(
      (acc, row) => acc + (parseInt(row?.NG) || 0),
      0,
    );
    const hoursWithData = (completedKitsUPH || []).filter(
      (r) => r?.status !== "future",
    ).length;
    const avg = hoursWithData > 0 ? Math.round(pass / hoursWithData) : 0;
    return { pass, ng, avg, hoursWithData };
  }, [completedKitsUPH]);

  useEffect(() => {
    getOperators();
    fetchJigCategories();
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    setID(id);
    getPlaningById(id);
  }, [loading]);
  const assignedStageKeys = Object.keys(assignedStages || {}).filter(
    (key) => assignedStages[key][0].name !== "Reserved",
  );
  const stages = selectedProcess?.stages || [];
  const stageLength = stages.length;
  const rows = [];
  for (let i = 0; i < repeatCount; i++) {
    const start = i * stageLength;
    const end = start + stageLength;
    const rowKeys = assignedStageKeys.slice(start, end);
    rows.push(rowKeys);
  }
  const fetchJigCategories = async () => {
    try {
      let result = await viewJigCategory();
      setJigCategories(result?.JigCategories);
    } catch (error) {
      console.log("Fetch Jig Categories :", error);
    }
  };
  const getHolidayList = async () => {
    try {
      let result = await fetchHolidays();
      return result?.holidays;
    } catch (error) {
      console.log("Error Fetching Availability", error);
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
      console.log("Error Fetching Products:", error);
    }
  };
  const getHourlyIntervals = (start, end) => {
    const intervals = [];
    let current = new Date(start);
    while (current < end) {
      const next = new Date(current);
      next.setHours(current.getHours() + 1);
      if (next > end) next.setTime(end.getTime());
      intervals.push({
        start: toTimeString(current),
        end: toTimeString(next),
      });
      current = next;
    }
    return intervals;
  };
  const toDate = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };
  const toTimeString = (date) => date.toTimeString().slice(0, 5);
  function calculateWorkingHours(startTime, endTime, breakMinutes) {
    if (!startTime || !endTime || breakMinutes == null) return 0;

    const parseTime = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const totalMinutes = end - start - Number(breakMinutes);

    if (isNaN(totalMinutes) || totalMinutes <= 0) return 0;

    return Math.floor(totalMinutes / 60);
  }
  const getPlaningById = async (id: any) => {
    try {
      let result = await getPlaningAndSchedulingById(id);
      setPlanData(result);
      let shifts = await getAllShifts();
      let roomPlan = await getAllRoomPlan();
      let processes = await getAllProcess();
      let processData;
      const singleProcess = processes.find(
        (value) => value?._id === result.selectedProcess,
      );
      if (singleProcess?.selectedProduct) {
        getProduct(singleProcess?.selectedProduct);
      }
      setSelectedProcess(singleProcess);
      const room = roomPlan.find(
        (value) => value?._id === result?.selectedRoom,
      );
      setSelectedRoom(room);
      const Shift = shifts.find(
        (value) => value?._id === result?.selectedShift,
      );
      let deviceTestEntry = await getDeviceTestRecordsByProcessId(
        result.selectedProcess,
      );
      let deviceTests = deviceTestEntry?.deviceTestRecords;

      if (singleProcess?.selectedProduct) {
        processData = await getProductById(singleProcess?.selectedProduct);
      }
      const stageHeaders =
        processData?.product?.stages?.map((stage) =>
          stage?.stageName?.trim(),
        ) || [];
      const totalHours = calculateWorkingHours(
        result.startTime,
        result.endTime,
        result.totalBreakTime,
      );
      const stageUPHMap =
        processData?.product?.stages?.reduce((acc, stage) => {
          acc[stage.stageName] = stage.upha || 0;
          return acc;
        }, {}) || {};
      const tableData = Array.from({ length: totalHours }, (_, i) => ({
        hour: `${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Hour`,
        values: stageHeaders.map((stage) => ({
          stage,
          Pass: 0,
          NG: 0,
          targetUPH: stageUPHMap[stage] || 0,
        })),
        status: "future",
      }));
      const now = new Date();
      const [startHour, startMin] = result?.ProcessShiftMappings?.startTime
        .split(":")
        .map(Number);
      const [endHour, endMin] = result?.ProcessShiftMappings?.endTime
        .split(":")
        .map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(startHour, startMin, 0, 0);

      const shiftEnd = new Date(now);
      shiftEnd.setHours(endHour, endMin, 0, 0);

      let hoursSinceShiftStart = -1;

      if (now >= shiftStart && now <= shiftEnd) {
        hoursSinceShiftStart = Math.floor(
          (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
        );
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deviceTests.length > 0) {
        deviceTests?.forEach((record) => {
          const recordTime = new Date(record.createdAt);
          const recordDateOnly = new Date(recordTime);
          recordDateOnly.setHours(0, 0, 0, 0);
          if (recordDateOnly.getTime() !== today.getTime()) return;
          const hourIndex = Math.floor(
            (recordTime.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
          );
          if (hourIndex < 0 || hourIndex >= totalHours) return;

          const cleanedStageName = record.stageName?.trim();
          const stageIndex = stageHeaders.indexOf(cleanedStageName);
          if (stageIndex === -1) {
            console.warn(
              `Stage not found in stageHeaders: "${record.stageName}"`,
            );
            return;
          }

          const status = record.status;
          if (status === "Pass" || status === "NG") {
            tableData[hourIndex].values[stageIndex][status] += 1;
          }
        });
        for (let i = 0; i < totalHours; i++) {
          if (hoursSinceShiftStart === -1) {
            tableData[i].status = "future";
          } else if (i < hoursSinceShiftStart) {
            tableData[i].status = "past";
          } else if (i === hoursSinceShiftStart) {
            tableData[i].status = "current";
          } else {
            tableData[i].status = "future";
          }
        }
        const lastStageIndex = stageHeaders.length - 1;
        const lastStageSummaryList = tableData
          .slice(0, totalHours)
          .map((row) => {
            const lastStageData = row.values[lastStageIndex];
            return {
              hour: row.hour,
              stage: stageHeaders[lastStageIndex],
              Pass: lastStageData?.Pass || 0,
              NG: lastStageData?.NG || 0,
              status: row.status,
            };
          });
        setCompletedKitsUPH(lastStageSummaryList);

        if (lastStageSummaryList) {
          const overallLastStageSummary = lastStageSummaryList.reduce(
            (acc, row) => {
              acc.Pass += row?.Pass;
              acc.NG += row?.NG;
              return acc;
            },
            { Pass: 0, NG: 0 },
          );
        }

        const totalRow = {
          hour: "Total Count",
          values: stageHeaders.map((stage, i) => {
            const totalPass = tableData.reduce(
              (sum, row) => sum + row.values[i].Pass,
              0,
            );
            const totalNG = tableData.reduce(
              (sum, row) => sum + row.values[i].NG,
              0,
            );
            return { stage, Pass: totalPass, NG: totalNG };
          }),
        };

        const avgRow = {
          hour: "Avg UPH",
          values: totalRow.values.map((val) => ({
            stage: val.stage,
            Pass: val.Pass ? (val.Pass / totalHours).toFixed(2) : "0",
            NG: val.NG ? (val.NG / totalHours).toFixed(2) : "0",
          })),
        };
        tableData.push(totalRow);
        tableData.push(avgRow);
      }
      setOverallUPHA(tableData);
      setProcessName(result?.processName);
      setSelectedShift(Shift);
      calculateTimeDifference(Shift);
      setRepeatCount(result?.repeatCount);
      setStartDate(formatDate(result?.startDate));

      setAssignedOperators(JSON.parse(result?.assignedOperators));
      if (result?.assignedCustomStages) {
        setAssignedCustomStages(JSON.parse(result?.assignedCustomStages));
      }
      if (result?.assignedCustomStagesOp) {
        setAssignedCustomOperators(JSON.parse(result?.assignedCustomStagesOp));
      }
      setAssignedJigs(JSON.parse(result?.assignedJigs));
      setEstimatedEndDate(formatDate(result?.estimatedEndDate));
      setTotalTimeEstimation(result?.totalTimeEstimation);
      const downTimeArr = result.downTime;
      setDownTimeFrom(downTimeArr?.downTimeFrom);
      setDownTimeTo(downTimeArr?.downTimeTo);
      setDownTimeDescription(downTimeArr.downTimeDesc);
      setDownTimeVal(downTimeArr);
      setTotalUPHA(result?.totalUPHA);
      setShiftChangedFromDate(result?.ProcessShiftMappings?.formattedShiftDate);
      setEndTime(result?.ProcessShiftMappings?.endTime);
      setStartTime(result?.ProcessShiftMappings?.startTime);
      setTotalConsumedkits(result?.consumedKit);
      let reservedSeats = await checkSeatAvailability(
        room,
        Shift,
        formatDate(result?.startDate),
        formatDate(result?.estimatedEndDate),
      );
      let result1 = await getProductById(singleProcess?.selectedProduct);
      const assignedStages = allocateStagesToSeats(
        result1,
        room,
        result?.repeatCount,
        reservedSeats,
        JSON.parse(result?.assignedStages),
        singleProcess,
        result?.assignedIssuedKits,
        deviceTests,
      );
      setAssignedStages(assignedStages);
      const uniqueAssignedStages = new Set();
      const seatCountPerStage = {};

      for (let key in assignedStages) {
        assignedStages[key].forEach((stage) => {
          uniqueAssignedStages.add(stage?.name);
          seatCountPerStage[stage?.name] =
            (seatCountPerStage[stage?.name] || 0) + 1;
        });
      }

      setLoading(false);
    } catch (error) {
      console.log("Error Fetching Planing & Scheduling", error.message);
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
    try {
      const shiftDataChange = JSON.stringify({
        startTime,
        endTime,
        shiftChangedFromDate,
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
              acc[seatKey] = [
                ...(acc[seatKey] || []),
                ...parsedStages[seatKey].map((stage) => ({
                  ...stage,
                  processName: plan.processName,
                })),
              ];
            });
          }
        } catch (error) {
          console.error("Error parsing assignedStages:", error);
        }
        return acc;
      }, {});

      return assignedStagesObject;
    } catch (error) {
      console.log("Error Fetching Availability", error);
      return {};
    }
  };
  const getOperators = async () => {
    try {
      const result = await getUsers();
      const operators = result.users.filter(
        (user) => user.userType === "Operator",
      );
      setOperators(operators);
      return false;
    } catch (error) {
      console.log("Error Fetching Operators", error);
    }
  };
  const getAllShifts = async () => {
    try {
      const result = await viewShift();
      return result?.Shifts;
      setShifts(result?.Shifts);
    } catch (error) {
      console.log("Error Fetching Shifts", error);
    }
  };
  const getAllProcess = async () => {
    try {
      const result = await viewProcess();
      setProcess(result.Processes);
      return result.Processes;
    } catch (error) {
      console.log("Error Fetching Process", error);
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
      return result.RoomPlan;
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
    Products: any,
    selectedRoom: any,
    repeatCount = 1,
    reservedSeats = {},
    assignedStages = {},
    selectedProcess = {},
    assignedIssuedKits = 0,
    deviceTests = [],
  ) => {
    console.log("deviceTests ===>", deviceTests);

    const stagePassCount = deviceTests.reduce((acc, record) => {
      const stage = record.stageName?.trim();
      if (record.status === "Pass") {
        acc[stage] = (acc[stage] || 0) + 1;
      }
      return acc;
    }, {});

    const stageNGCount = deviceTests.reduce((acc, record) => {
      const stage = record.stageName?.trim();
      if (
        (record.status === "NG" || record.status === "Fail") &&
        assignedStages[record.seatNumber]
      ) {
        acc[stage] = (acc[stage] || 0) + 1;
      }
      return acc;
    }, {});
    const testResultsBySeatAndStage = {};
    deviceTests.forEach((record) => {
      console.log("record ==>", record);
      const key = `${record.seatNumber}:${record.stageName?.trim()}`;
      if (!testResultsBySeatAndStage[key]) {
        testResultsBySeatAndStage[key] = { passed: 0, ng: 0 };
      }
      if (record.status === "Pass") testResultsBySeatAndStage[key].passed++;
      else if (record.status === "NG" || record.status === "Fail")
        testResultsBySeatAndStage[key].ng++;
    });
    const assignedSeatsKeys = Object.keys(assignedStages);
    const stages = selectedProcess?.stages || [];
    const newAssignedStages: any = {};
    const totalSeatsAvailable = selectedRoom?.lines?.reduce(
      (total: number, row: any) => total + row?.seats?.length,
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
    let seatIndex = 0;
    console.log("testResultsBySeatAndStage ===>", testResultsBySeatAndStage);
    selectedRoom.lines?.forEach((row: any, rowIndex: number) => {
      row.seats.forEach((_: any, seatPosition: number) => {
        const seatKey = `${rowIndex}-${seatPosition}`;
        if (reservedSeats[seatKey]) {
          newAssignedStages[seatKey] = [
            {
              name: "Reserved",
              processName: selectedProcess.name,
              pId: selectedProcess.processID,
              reserved: true,
            },
          ];
          return;
        }
        if (
          assignedSeatsKeys.includes(seatKey) &&
          seatIndex < stages.length * repeatCount
        ) {
          const currentStageIndex = seatIndex % stages.length;
          const currentStage = stages[currentStageIndex];
          const trimmedStageName = currentStage.stageName?.trim();
          const hasJigStepType = currentStage.subSteps?.some(
            (step: any) => step.stepType === "jig",
          );
          let totalUPHA = 0;
          if (currentStageIndex === 0) {
            totalUPHA = assignedIssuedKits / repeatCount;
          } else {
            const prevSeatIndex = seatIndex - 1;
            const seatsPerRow = row.seats.length;
            const prevRow = Math.floor(prevSeatIndex / seatsPerRow);
            const prevCol = prevSeatIndex % seatsPerRow;
            const prevSeatKey = `${prevRow}-${prevCol}`;
            const prevStageName =
              stages[currentStageIndex - 1]?.stageName?.trim();
            const prevTestKey = `${prevSeatKey}:${prevStageName}`;
            totalUPHA = testResultsBySeatAndStage[prevTestKey]?.passed || 0;
          }

          const testKey = `${seatKey}:${trimmedStageName}`;
          const passedDevice = testResultsBySeatAndStage[testKey]?.passed || 0;
          const ngDevice = testResultsBySeatAndStage[testKey]?.ng || 0;
          const remainingDevices = Math.max(
            totalUPHA - (passedDevice + ngDevice),
            0,
          );

          newAssignedStages[seatKey] = [
            {
              name: currentStage.stageName,
              requiredSkill: currentStage.stageName,
              upha: currentStage.upha,
              totalUPHA: remainingDevices,
              passedDevice,
              ngDevice,
              hasJigStepType,
            },
          ];
          seatIndex++;
        }
      });
    });
    return newAssignedStages;
  };
  const handleEditPlaning = () => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    window.open(`/planing-scheduling/edit/${id}`, "_blank");
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
  const seatMatches = (rowIndex, seatIndex, seat) => {
    const coordinates = `${rowIndex}-${seatIndex}`;
    const arr = assignedStages[coordinates];
    const occupied = arr && arr.length > 0;
    if (showOccupiedOnly && !occupied) return false;
    if (!occupied) return false;
    const s = arr[0];
    let status = "Empty";
    if (s?.reserved) status = "Reserved";
    else {
      status =
        selectedProcess?.quantity > s?.totalUPHA
          ? s?.totalUPHA > 0
            ? "Active"
            : "Downtime"
          : "Completed";
    }
    if (seatStatusFilter !== "all") {
      const anyMatch = arr.some((stage: any) => {
        const st =
          stage?.reserved
            ? "Reserved"
            : selectedProcess?.quantity > stage?.totalUPHA
            ? stage?.totalUPHA > 0
              ? "Active"
              : "Downtime"
            : "Completed";
        return st === seatStatusFilter;
      });
      if (!anyMatch) return false;
    }
    if (seatSearch) {
      const q = seatSearch.toLowerCase();
      const stageNames = arr.map((st) => String(st?.name || st?.stage || "")).join(" ").toLowerCase();
      const ops = (assignedOperators[coordinates] || [])
        .map((op) => String(op?.name || ""))
        .join(" ")
        .toLowerCase();
      const seatLabel = `s${String(seat?.seatNumber || "").toLowerCase()}`;
      if (
        !stageNames.includes(q) &&
        !ops.includes(q) &&
        !seatLabel.includes(q)
      ) {
        return false;
      }
    }
    return true;
  };
  const keyMatches = (key) => {
    const [rowIndexStr, seatIndexStr] = String(key).split("-");
    const rowIndex = parseInt(rowIndexStr, 10);
    const seatIndex = parseInt(seatIndexStr, 10);
    const seat = selectedRoom?.lines?.[rowIndex]?.seats?.[seatIndex];
    return seatMatches(rowIndex, seatIndex, seat);
  };
  const handleFilter = async () => {
    let processData;
    const singleProcess = process.find(
      (value) => value?._id === planData?.selectedProcess,
    );

    const deviceTestEntry = await getDeviceTestRecordsByProcessId(
      planData.selectedProcess,
    );
    const deviceTests = deviceTestEntry?.deviceTestRecords || [];

    if (singleProcess?.selectedProduct) {
      processData = await getProductById(singleProcess?.selectedProduct);
    }

    const stageHeaders =
      processData?.product?.stages?.map((stage) => stage?.stageName?.trim()) ||
      [];

    const totalHours = calculateWorkingHours(
      planData.startTime,
      planData.endTime,
      planData.totalBreakTime,
    );

    const stageUPHMap =
      processData?.product?.stages?.reduce((acc, stage) => {
        acc[stage.stageName] = stage.upha || 0;
        return acc;
      }, {}) || {};

    const tableData = Array.from({ length: totalHours }, (_, i) => ({
      hour: `${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Hour`,
      values: stageHeaders.map((stage) => ({
        stage,
        Pass: 0,
        NG: 0,
        targetUPH: stageUPHMap[stage] || 0,
      })),
      status: "future",
    }));
    const selectedDate = new Date(filterDate);
    const [startHour, startMin] = planData.startTime.split(":").map(Number);
    const [endHour, endMin] = planData.endTime.split(":").map(Number);

    const shiftStart = new Date(selectedDate);
    shiftStart.setHours(startHour, startMin, 0, 0);

    const shiftEnd = new Date(selectedDate);
    shiftEnd.setHours(endHour, endMin, 0, 0);
    const now = new Date();
    let isToday = now.toDateString() === selectedDate.toDateString();
    let hoursSinceShiftStart = -1;

    if (isToday && now >= shiftStart && now <= shiftEnd) {
      hoursSinceShiftStart = Math.floor(
        (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
      );
    }

    const selectedFilterDate = new Date(filterDate);
    selectedFilterDate.setHours(0, 0, 0, 0);
    deviceTests.forEach((record) => {
      const recordTime = new Date(record.createdAt);
      const recordDateOnly = new Date(recordTime);
      recordDateOnly.setHours(0, 0, 0, 0);

      if (recordDateOnly.getTime() !== selectedFilterDate.getTime()) return;

      const hourIndex = Math.floor(
        (recordTime.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
      );
      if (hourIndex < 0 || hourIndex >= totalHours) return;

      const cleanedStageName = record.stageName?.trim();
      const stageIndex = stageHeaders.indexOf(cleanedStageName);
      if (stageIndex === -1) {
        return;
      }

      const status = record.status;
      if (status === "Pass" || status === "NG") {
        tableData[hourIndex].values[stageIndex][status] += 1;
      }
    });
    for (let i = 0; i < totalHours; i++) {
      if (hoursSinceShiftStart === -1) {
        tableData[i].status = "past";
      } else if (i < hoursSinceShiftStart) {
        tableData[i].status = "past";
      } else if (i === hoursSinceShiftStart) {
        tableData[i].status = "current";
      } else {
        tableData[i].status = "future";
      }
    }
    const lastStageIndex = stageHeaders.length - 1;
    const lastStageSummaryList = tableData.map((row) => {
      const lastStageData = row.values[lastStageIndex];
      return {
        hour: row.hour,
        stage: stageHeaders[lastStageIndex],
        Pass: lastStageData?.Pass || 0,
        NG: lastStageData?.NG || 0,
        status: row.status,
      };
    });
    setCompletedKitsUPH(lastStageSummaryList);
    if (lastStageSummaryList) {
      const overallLastStageSummary = lastStageSummaryList.reduce(
        (acc, row) => {
          acc.Pass += row?.Pass;
          acc.NG += row?.NG;
          return acc;
        },
        { Pass: 0, NG: 0 },
      );
    }
    const totalRow = {
      hour: "Total Count",
      values: stageHeaders.map((stage, i) => {
        const totalPass = tableData.reduce(
          (sum, row) => sum + row.values[i].Pass,
          0,
        );
        const totalNG = tableData.reduce(
          (sum, row) => sum + row.values[i].NG,
          0,
        );
        return { stage, Pass: totalPass, NG: totalNG };
      }),
    };
    const avgRow = {
      hour: "Avg UPH",
      values: totalRow.values.map((val) => ({
        stage: val.stage,
        Pass: val.Pass ? (val.Pass / totalHours).toFixed(2) : "0",
        NG: val.NG ? (val.NG / totalHours).toFixed(2) : "0",
      })),
    };
    tableData.push(totalRow);
    tableData.push(avgRow);
    setOverallUPHA(tableData);
  };
  const handleDeviceSerialNo = async () => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    window.open(
      `/device/generate-serials/${selectedProduct?.product?._id}/${selectedProcess?._id}`,
      "_blank",
    );
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <Breadcrumb
        parentName="Planning & Scheduling Management"
        pageName="View Planing "
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
            <div className="flex flex-wrap items-center justify-between border-b border-stroke px-2 py-4 dark:border-strokedark">
              {/* Title */}
              <h3 className="text-xl font-semibold text-black dark:text-white">
                View Planning
              </h3>

              {/* Status Message */}
              {downTimeval &&
                (() => {
                  const currentDate = new Date();
                  const downTimeFrom = new Date(downTimeval?.downTimeFrom);
                  const downTimeTo = new Date(downTimeval?.downTimeTo);
                  currentDate.setHours(0, 0, 0, 0);
                  downTimeFrom.setHours(0, 0, 0, 0);
                  downTimeTo.setHours(0, 0, 0, 0);

                  return (
                    downTimeFrom <= currentDate &&
                    currentDate <= downTimeTo &&
                    selectedProcess.status !== "completed"
                  );
                })() && (
                  <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md px-3 py-1 text-sm font-medium">
                    ⏸ On Hold (
                    {new Date(downTimeval?.downTimeFrom).toLocaleDateString()} –{" "}
                    {new Date(downTimeval?.downTimeTo).toLocaleDateString()}) ·
                    Reason: {downTimeval?.downTimeDesc}
                  </div>
                )}

              {/* Actions */}
              {selectedProcess?.status !== "completed" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDeviceSerialNo}
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-md transition hover:bg-primary/90"
                  >
                    <FiCodepen size={16} />
                    Generate Serials
                  </button>
                  <button
                    onClick={handleEditPlaning}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-md transition hover:bg-blue-700"
                  >
                    <FiEdit size={16} />
                    Edit Planning
                  </button>
                </div>
              ) : (
                <span className="rounded-lg bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✅ Completed
                </span>
              )}
            </div>
            <form action="#">
              <div className="p-6">
                <div className="space-y-6">
                  {/* Top Summary */}
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <CardDataStats title="Required Qty" total={`${summaryData.required}`} rate="" levelUp>
                      <FiBox size={20} />
                    </CardDataStats>
                    <CardDataStats title="Issued Kits" total={`${summaryData.issued}`} rate="" levelUp>
                      <FiPackage size={20} />
                    </CardDataStats>
                    <CardDataStats title="Pending Kits" total={`${summaryData.pending}`} rate="" levelDown>
                      <FiClipboard size={20} />
                    </CardDataStats>
                    <CardDataStats title="Avg UPH (Last Stage)" total={`${summaryData.avg}`} rate="" levelUp>
                      <FiTrendingUp size={20} />
                    </CardDataStats>
                  </div>
                  {/* Process Info */}
                  <div className="dark:bg-gray-800 rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow-md">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                      <FiClipboard /> Process Details
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <FiTag className="inline text-primary" />{" "}
                        <strong>Product:</strong> {productName}
                      </div>
                      <div>
                        <FiClock className="inline text-primary" />{" "}
                        <strong>Shift:</strong>{" "}
                        {shiftChangedFromDate
                          ? `${selectedShift?.name} (${startTime} - ${endTime})`
                          : `${selectedShift?.name} (${selectedShift?.startTime} - ${selectedShift?.endTime})`}
                      </div>
                      <div>
                        <FiClock className="inline text-yellow-500" />{" "}
                        <strong>Break:</strong> {selectedShift?.totalBreakTime}{" "}
                        min
                      </div>
                      <div>
                        <FiHash className="inline text-green-500" />{" "}
                        <strong>Order No:</strong>{" "}
                        {selectedProcess?.orderConfirmationNo}
                      </div>
                      <div>
                        <FiLayers className="inline text-indigo-500" />{" "}
                        <strong>Process ID:</strong>{" "}
                        {selectedProcess?.processID}
                      </div>
                      <div>
                        <FiBox className="inline text-pink-500" />{" "}
                        <strong>Qty:</strong> {selectedProcess?.quantity}
                      </div>
                      <div className="sm:col-span-2">
                        <FiCalendar className="text-red-500 inline" />{" "}
                        <strong>Shift Days:</strong>{" "}
                        {Object.keys(selectedShift?.weekDays || {})
                          .filter(
                            (d) => d !== "_id" && selectedShift?.weekDays[d],
                          )
                          .join(", ")}
                      </div>
                      <div className="sm:col-span-2">
                        <FiInfo className="inline text-blue-400" />{" "}
                        <strong>Description:</strong>{" "}
                        {selectedProcess?.descripition}
                      </div>
                    </div>
                  </div>

                  {/* Kits */}
                  {inventoryData && (
                    <div className="dark:bg-gray-800 rounded-lg border-l-4 border-green-500 bg-white p-4 shadow-md">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-600 dark:text-green-400">
                        <FiPackage /> Kits
                      </h3>
                      <div className="text-gray-700 dark:text-gray-300 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <strong>Required:</strong> {selectedProcess?.quantity}
                        </div>
                        <div>
                          <strong>Available:</strong> {inventoryData?.quantity}
                        </div>
                        <div>
                          <strong>Issued:</strong> {selectedProcess?.issuedKits}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
                            Short:{" "}
                            {Math.max(
                              0,
                              selectedProcess?.quantity -
                                selectedProcess?.issuedKits,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                            Surplus:{" "}
                            {Math.max(
                              0,
                              selectedProcess?.issuedKits -
                                selectedProcess?.quantity,
                            )}
                          </span>
                        </div>
                        <div>
                          <strong>Total:</strong>{" "}
                          {inventoryData?.quantity +
                            selectedProcess?.issuedKits}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cartons */}
                  {packagingData.length > 0 &&
                    packagingData[0].packagingData.packagingType ===
                      "Carton" && (
                      <div className="dark:bg-gray-800 rounded-lg border-l-4 border-orange-500 bg-white p-4 shadow-md">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-orange-600 dark:text-orange-400">
                          <FiArchive /> Cartons
                        </h3>
                        <div className="text-gray-700 dark:text-gray-300 grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <strong>Required:</strong>{" "}
                            {(
                              selectedProcess?.quantity /
                              packagingData[0].packagingData.maxCapacity
                            ).toFixed(0)}
                          </div>
                          <div>
                            <strong>Available:</strong>{" "}
                            {selectedProcess?.issuedCartons}
                          </div>
                          <div>
                            <span className="bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
                              Short:{" "}
                              {Math.max(
                                0,
                                (
                                  selectedProcess?.quantity /
                                    packagingData[0].packagingData.maxCapacity -
                                  selectedProcess?.issuedCartons
                                ).toFixed(0),
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                              Surplus:{" "}
                              {Math.max(
                                0,
                                (
                                  selectedProcess?.issuedCartons -
                                  selectedProcess?.quantity /
                                    packagingData[0].packagingData.maxCapacity
                                ).toFixed(0),
                              )}
                            </span>
                          </div>
                          <div>
                            <strong>Dimensions:</strong>{" "}
                            {packagingData[0].packagingData.cartonWidth} x{" "}
                            {packagingData[0].packagingData.cartonHeight}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Shift Summary */}
                  <div className="dark:bg-gray-800 rounded-lg border-l-4 border-purple-500 bg-white p-4 shadow-md">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-purple-600 dark:text-purple-400">
                      <FiClock /> Shift Summary
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedShift?.intervals?.map((interval, i) => (
                        <span
                          key={i}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            interval.breakTime
                              ? "bg-[#fbc0c0] text-danger dark:bg-danger dark:text-danger"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }`}
                        >
                          {interval.breakTime
                            ? `Break: ${interval.startTime} - ${interval.endTime}`
                            : `Interval: ${interval.startTime} - ${interval.endTime}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Time Estimation */}
                  {totalTimeEstimation && (
                    <div className="dark:bg-gray-800 mb-4 rounded-lg border-l-4 border-indigo-500 bg-white p-4 shadow-md">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                        <FiTrendingUp /> Time Estimation
                      </h3>
                      <div className="text-gray-700 dark:text-gray-300 grid gap-1 text-sm">
                        <p>
                          <strong>Start:</strong> {startDate || "N/A"}
                        </p>
                        <p>
                          <strong>End:</strong>{" "}
                          {estimatedEndDate || "Not calculated"}
                        </p>
                        <p>
                          <strong>Days:</strong> {totalTimeEstimation || "N/A"}
                        </p>
                        <p>
                          <strong>Units/Day:</strong> {totalUPHA || "N/A"} (per{" "}
                          {(
                            shiftTime -
                            selectedShift?.totalBreakTime / 60
                          ).toFixed(2)}{" "}
                          hrs)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* component 2 */}

                <div className="mt-6 flex gap-10">
                  <div className="w-full">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-gray-900 text-2xl font-bold dark:text-white">
                        Room Overview
                      </h3>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-danger">
                          Consumed: {totalConsumedKits}
                        </button>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Active: {occupancyStats.active}
                        </span>
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          Downtime: {occupancyStats.downtime}
                        </span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Completed: {occupancyStats.completed}
                        </span>
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                          Reserved: {occupancyStats.reserved}
                        </span>
                      </div>
                    </div>

                    {/* Tabs */}
                    <Tabs>
                      <TabList className="flex space-x-3">
                        {["Floor View", "Table View"].map((tab) => (
                          <Tab
                            key={tab}
                            className={({ selected }) =>
                              `inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200
                              focus:outline-none focus:ring-2 focus:ring-offset-1
                              ${
                                selected
                                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-blue-600"
                                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600 border"
                              }`
                            }
                          >
                            {tab}
                          </Tab>
                        ))}
                      </TabList>

                      {/* Floor View */}
                      <TabPanel>
                        <div className="mt-6 rounded-md border border-primary p-2 pt-3">
                          <div className="mb-4 flex items-center gap-2 flex-nowrap overflow-x-auto">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                Active
                              </span>
                              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                                Downtime
                              </span>
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                Completed
                              </span>
                              <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                Reserved
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 rounded-lg border border-stroke bg-white px-2 py-1 text-sm dark:border-strokedark dark:bg-boxdark">
                                <FiFilter size={14} />
                                <select
                                  value={seatStatusFilter}
                                  onChange={(e) => setSeatStatusFilter(e.target.value)}
                                  className="h-8 rounded bg-transparent px-2 outline-none"
                                >
                                  <option value="all">All</option>
                                  <option value="Active">Active</option>
                                  <option value="Downtime">Downtime</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Reserved">Reserved</option>
                                </select>
                              </div>
                              <label className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-2 py-1 text-sm dark:border-strokedark dark:bg-boxdark">
                                <input
                                  type="checkbox"
                                  checked={showOccupiedOnly}
                                  onChange={(e) => setShowOccupiedOnly(e.target.checked)}
                                />
                                <span>Occupied only</span>
                              </label>
                              <div className="flex items-center gap-1 rounded-lg border border-stroke bg-white px-2 py-1 text-sm dark:border-strokedark dark:bg-boxdark">
                                <FiSearch size={14} />
                                <input
                                  type="text"
                                  value={seatSearch}
                                  onChange={(e) => setSeatSearch(e.target.value)}
                                  placeholder="Search seat/stage/operator"
                                  className="h-8 w-44 sm:w-56 bg-transparent px-2 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Assigned Custom Stages */}
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {assignedCustomStages.length > 0 &&
                              assignedCustomStages.map((stage, index) => (
                                <div
                                  key={index}
                                  className="rounded-xl border border-green-400 bg-green-50 p-4 shadow transition hover:shadow-md dark:border-green-600 dark:bg-green-900"
                                >
                                  <div className="mb-3 flex items-center justify-between">
                                    <p className="text-gray-900 text-base font-semibold dark:text-white">
                                      {stage?.stage}
                                    </p>
                                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-700 dark:text-orange-300">
                                      Active
                                    </span>
                                  </div>

                                  {/* Quick Stats */}
                                  <div className="text-gray-700 dark:text-gray-200 grid gap-1 text-xs">
                                    <p className="flex items-center gap-1">
                                      <FiTrendingUp /> UPH Target:{" "}
                                      {stage?.upha || "100"}
                                    </p>
                                    <p className="flex items-center gap-1">
                                      <FiActivity /> Achieved:{" "}
                                      {stage?.achievedUph || "0"}
                                    </p>
                                    <p className="flex items-center gap-1">
                                      <FiUsers /> WIP: {stage?.wip || "0"}
                                    </p>
                                    <p className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                      <FiCheckCircle /> Pass:{" "}
                                      {stage?.pass || "0"}
                                    </p>
                                    <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                      <FiXCircle /> NG: {stage?.ng || "0"}
                                    </p>
                                  </div>

                                  {/* Operators */}
                                  {assignedCustomOperators[index] && (
                                    <div className="text-gray-600 dark:text-gray-300 mt-3 text-xs">
                                      <strong>Operators:</strong>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {assignedCustomOperators[index].map(
                                          (op, i) => (
                                            <span
                                              key={i}
                                              className="bg-gray-200 dark:bg-gray-700 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                                            >
                                              {op.name}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* Room Layout */}
                          {selectedRoom &&
                            selectedRoom.lines
                              .filter((row, rowIndex) =>
                                row.seats?.some((seat, seatIndex) =>
                                  seatMatches(rowIndex, seatIndex, seat),
                                ),
                              )
                              .map((row, rowIndex) => (
                                <div key={rowIndex} className="space-y-2">
                                  <h4 className="text-gray-800 mt-3 text-sm font-bold dark:text-white">
                                    {row.rowName}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {row.seats
                                      ?.filter((seat, seatIndex) =>
                                        seatMatches(rowIndex, seatIndex, seat),
                                      )
                                      .map((seat, seatIndex) => (
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
                                          setAssignedOperators={
                                            setAssignedOperators
                                          }
                                          filteredOperators={filteredOperators}
                                          setFilteredOperators={
                                            setFilteredOperators
                                          }
                                          rowSeatLength={row.seats.length}
                                          setAssignedJigs={setAssignedJigs}
                                          assignedJigs={assignedJigs}
                                          jigCategories={jigCategories}
                                          selectedProcess={selectedProcess}
                                          seatStatusFilter={seatStatusFilter}
                                        />
                                      ))}
                                  </div>
                                </div>
                              ))}
                        </div>
                      </TabPanel>

                      {/* Table View */}
                      <TabPanel>
                        <div className=" bg-gray-50 dark:bg-gray-800 mt-6 h-90 overflow-x-auto rounded-md rounded-xl border border-primary p-2 p-4 pt-3 shadow">
                          {/* Common Stages */}
                          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {selectedProcess?.commonStages.map(
                              (stage, index) => (
                                <div
                                  key={index}
                                  className="rounded-xl border border-green-400 bg-green-50 p-4 shadow hover:shadow-md dark:border-green-600 dark:bg-green-900"
                                >
                                  <p className="text-gray-900 mb-2 text-base font-semibold dark:text-white">
                                    {stage?.stageName}
                                  </p>
                                  <div className="text-gray-700 dark:text-gray-200 space-y-1 text-xs">
                                    <p>UPH Target: {stage?.upha || "100"}</p>
                                    <p>
                                      Achieved UPH: {stage?.achievedUph || "0"}
                                    </p>
                                    <p>WIP: {stage?.wip || "0"}</p>
                                    <p className="text-green-600 dark:text-green-400">
                                      Pass: {stage?.pass || "0"}
                                    </p>
                                    <p className="text-red-600 dark:text-red-400">
                                      NG: {stage?.ng || "0"}
                                    </p>
                                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-700 dark:text-orange-300">
                                      Active
                                    </span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>

                          {/* Table */}
                          <div className="border-gray-200 dark:border-gray-700 overflow-x-auto rounded-xl border shadow-md">
                            <table className="min-w-full text-sm">
                              <thead className="bg-blue-500 text-white">
                                <tr>
                                  {selectedProcess?.stages?.map(
                                    (value, index) => (
                                      <th
                                        key={index}
                                        className="px-4 py-3 text-left uppercase tracking-wide"
                                      >
                                        {value.stageName}
                                      </th>
                                    ),
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-gray-200 dark:divide-gray-700 divide-y">
                                {rows
                                  .map((rowKeys) =>
                                    rowKeys.filter((key) => keyMatches(key)),
                                  )
                                  .filter((filtered) => filtered.length > 0)
                                  .map((rowKeys, rowIndex) => (
                                  <tr
                                    key={rowIndex}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  >
                                    {rowKeys.map((key, colIndex) => (
                                      <td
                                        key={colIndex}
                                        className="px-4 py-3 align-top"
                                      >
                                        {assignedStages[key] &&
                                        assignedStages[key].length > 0 &&
                                        assignedStages[key].filter((stage: any) => {
                                          const status =
                                            stage?.reserved
                                              ? "Reserved"
                                              : selectedProcess?.quantity >
                                                stage?.totalUPHA
                                              ? stage?.totalUPHA > 0
                                                ? "Active"
                                                : "Downtime"
                                              : "Completed";
                                          return seatStatusFilter === "all"
                                            ? true
                                            : seatStatusFilter === status;
                                        }).length > 0 ? (
                                          assignedStages[key]
                                            .filter((stage: any) => {
                                              const status =
                                                stage?.reserved
                                                  ? "Reserved"
                                                  : selectedProcess?.quantity >
                                                    stage?.totalUPHA
                                                  ? stage?.totalUPHA > 0
                                                    ? "Active"
                                                    : "Downtime"
                                                  : "Completed";
                                              return seatStatusFilter === "all"
                                                ? true
                                                : seatStatusFilter === status;
                                            })
                                            .map((stage, stageIndex) => (
                                              <div
                                                key={stageIndex}
                                                className="dark:bg-gray-900 mb-2 rounded-lg bg-white p-3 shadow-sm"
                                              >
                                                <p className="text-xs font-medium">
                                                  <FiTrendingUp className="mr-1 inline-block" />
                                                  UPH Target: {stage.upha || 0}
                                                </p>
                                                <p className="text-xs">
                                                  Achieved:{" "}
                                                  {stage.achievedUph || 0}
                                                </p>
                                                <p className="text-xs">
                                                  WIP: {stage?.totalUPHA ?? "N/A"}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                  Pass: {stage.passedDevice || 0}
                                                </p>
                                                <p className="text-red-600 text-xs">
                                                  NG: {stage.ngDevice || 0}
                                                </p>
                                                <p className="text-xs">
                                                  <strong>Status:</strong>{" "}
                                                  <span
                                                    className={
                                                      selectedProcess?.quantity >
                                                      stage?.totalUPHA
                                                        ? stage?.totalUPHA > 0
                                                          ? "font-semibold text-orange-500"
                                                          : "text-red-500 font-semibold"
                                                        : "font-semibold text-green-600"
                                                    }
                                                  >
                                                    {selectedProcess?.quantity >
                                                    stage?.totalUPHA
                                                      ? stage?.totalUPHA > 0
                                                        ? "Active"
                                                        : "Downtime"
                                                      : "Completed"}
                                                  </span>
                                                </p>
                                              </div>
                                            ))
                                        ) : (
                                          <div className="mb-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-300">
                                            Empty
                                          </div>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TabPanel>
                    </Tabs>
                  </div>
                </div>
                {/* end component 2 */}
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="container mx-auto grid grid-cols-1 gap-9 p-6 sm:grid-cols-1">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
              <div className="flex w-full items-center justify-between text-center">
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    UPH
                  </h3>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      placeholder=""
                      className="h-10 w-44 sm:w-56 rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    <button
                      onClick={handleFilter}
                      disabled={planData?.processStatus === "down_time_hold"}
                      className={`flex h-10 items-center gap-2 rounded px-3 text-xs font-semibold text-white
                        ${planData?.processStatus === "down_time_hold" ? "cursor-not-allowed bg-gray" : "bg-primary"}
                      `}
                    >
                      Apply
                    </button>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Pass: {uphStats.pass}
                    </span>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      NG: {uphStats.ng}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      Avg UPH: {uphStats.avg}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      Hours: {uphStats.hoursWithData}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {planData?.processStatus === "active" && (
              <>
                <div className="p-4">
                  <p className="pb-3">
                    <strong>Stage Wise</strong>
                  </p>
                  <table className="min-w-full table-auto text-center text-sm">
                    <thead className="bg-gray-100 font-semibold">
                      <tr>
                        <th className="border p-2">UPH Stage Wise</th>
                        {stages.map((stage, idx) => (
                          <th key={idx} className="border p-2">
                            {stage.stageName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overAllUPHA?.map((row, rowIndex) => {
                        let bgColorClass = "";
                        if (row.status === "current") {
                          bgColorClass = "bg-yellow-100";
                        } else if (row.status === "past") {
                          bgColorClass = "bg-green-50";
                        } else if (row.status === "future") {
                          bgColorClass = "bg-gray-100";
                        }

                        return (
                          <tr
                            key={rowIndex}
                            className={`${bgColorClass} border-b`}
                          >
                            <td className="border p-2 font-semibold">
                              {row.hour}
                            </td>
                            {row.hour !== "Total Count" &&
                            row.hour !== "Avg UPH"
                              ? row?.values?.map((val, i) => (
                                  <td key={i} className="border p-2">
                                    <div className="text-xs">
                                      <p className="text-left">
                                        <strong>Pass:</strong> {val?.Pass},
                                      </p>
                                      <p className="text-left">
                                        <strong>NG:</strong> {val?.NG},
                                      </p>
                                      <p className="text-left">
                                        <strong>Target UPH:</strong>{" "}
                                        {val?.targetUPH}
                                      </p>
                                      <p
                                        className={`text-left ${val?.Pass + val?.NG <= val?.targetUPH && row?.status !== "future" ? "text-danger" : "text-grey"}`}
                                      >
                                        <strong>UPH:</strong>{" "}
                                        {val?.Pass + val?.NG}
                                      </p>
                                      <div className="mt-1 h-2 w-full rounded bg-gray-200">
                                        <div
                                          className="h-2 rounded bg-blue-500"
                                          style={{
                                            width: `${Math.min(
                                              100,
                                              Math.round(
                                                (((val?.Pass || 0) + (val?.NG || 0)) /
                                                  (val?.targetUPH || 1)) * 100,
                                              ),
                                            )}%`,
                                          }}
                                        ></div>
                                      </div>
                                      <p className="text-[10px] text-gray-500">
                                        {Math.min(
                                          100,
                                          Math.round(
                                            (((val?.Pass || 0) + (val?.NG || 0)) /
                                              (val?.targetUPH || 1)) * 100,
                                          ),
                                        )}
                                        % of target
                                      </p>
                                    </div>
                                  </td>
                                ))
                              : row?.values?.map((val, i) => (
                                  <td key={i} className="border p-2">
                                    <div className="text-xs">
                                      <p className="text-left">
                                        <strong>Pass:</strong> {val?.Pass},
                                      </p>
                                      <p className="text-left">
                                        <strong>NG:</strong> {val?.NG},
                                      </p>
                                      <p className="text-left">
                                        <strong>UPH:</strong>{" "}
                                        {val?.Pass + val?.NG}
                                      </p>
                                    </div>
                                  </td>
                                ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4">
                  <p className="pb-3">
                    <strong>Overall</strong>
                  </p>
                  <table className="mt-4 w-full table-auto border text-center">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-4 py-2">Overall UPH</th>
                        <th className="border px-4 py-2">Complete Device</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedKitsUPH?.map((row, idx) => {
                        let rowColor = "";

                        if (row.status === "past") {
                          rowColor = "bg-green-50";
                        } else if (row.status === "current") {
                          rowColor = "bg-yellow-100";
                        } else if (row.status === "future") {
                          rowColor = "bg-gray-100";
                        }

                        return (
                          <tr key={idx} className={`${rowColor}`}>
                            <td className="border px-4 py-2">{row?.hour}</td>
                            <td className="border px-4 py-2">
                              {row?.Pass + row?.NG}
                            </td>
                          </tr>
                        );
                      })}

                      <tr className="bg-purple-100 font-semibold">
                        <td className="border px-4 py-2">Avg UPH</td>
                        <td className="border px-4 py-2">
                          {lastStageOverallSummary}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {planData?.processStatus === "down_time_hold" && (
              <>
                <div className="flex items-center justify-center py-4">
                  <p className="text-danger">The process has been on hold.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ViewPlanSchedule;
