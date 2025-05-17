"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import FormComponent from "@/components/PlaningScheduling/add/FormComponents";
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
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Modal from "@/components/Modal/page";

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
  jigCategories,
  assignedJigs,
  setAssignedJigs,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignJigModalOpen, setAssignJigModelOpen] = useState(false);
  const [jigs, setJigs] = useState([]);
  const closeModal = () => setIsModalOpen(false);

  const openModal = (stages: any) => {
    const requiredSkills = stages.map((stage) => {
      return stage.requiredSkill.toLowerCase().trim();
    });
    const assignedOperatorIds = Object.values(assignedOperators)
      .flat()
      .map((operator) => operator._id);
    const compatibleOperators = operators.filter((operator) => {
      const normalizedSkills = operator.skills.map((skill) =>
        skill.toLowerCase().trim(),
      );
      const hasAllSkills = requiredSkills.every((skill) =>
        normalizedSkills.includes(skill),
      );
      const hasUserType = stages.map((stage) => {
        return stage.managedBy == operator.userType;
      });
      const isAlreadyAssigned = assignedOperatorIds.includes(operator._id);
      return hasUserType && hasAllSkills && !isAlreadyAssigned;
    });
    console.log("compatibleOperators ==>", compatibleOperators);
    setFilteredOperators(compatibleOperators);
    setIsModalOpen(true);
  };
  const openAssignJigModal = (stages: any) => {
    setAssignJigModelOpen(true);
  };
  const closeAssignJigModal = () => {
    setAssignJigModelOpen(false);
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
      if (draggedItem?.coordinates !== coordinates) {
        moveItem(draggedItem?.coordinates, coordinates);
      }
    },
  });
  const handleOperator = (rowIndex, seatIndex, event) => {
    let operator = operators.filter((val) => val._id == event);
    let key = `${rowIndex}-${seatIndex}`;
    let newAssignedOperators = { ...assignedOperators };
    if (!newAssignedOperators[key]) {
      newAssignedOperators[key] = [];
    }
    newAssignedOperators[key].push(operator[0]);
    setAssignedOperators(newAssignedOperators);
  };
  const handleJig = (rowIndex, seatIndex, event) => {
    let jig = jigs.filter((val) => val._id == event);
    let key = `${rowIndex}-${seatIndex}`;
    let newAssignedJigs = { ...assignedJigs };
    if (!newAssignedJigs[key]) {
      newAssignedJigs[key] = [];
    }
    newAssignedJigs[key].push(jig[0]);
    setAssignedJigs(newAssignedJigs);
  };
  const handlesubmitOperator = () => {
    setIsModalOpen(false);
  };
  const handlesubmitJigs = () => {
    setAssignJigModelOpen(false);
  };
  const handleRemoveOperator = (rowIndex, seatIndex) => {
    const key = `${rowIndex}-${seatIndex}`;
    setAssignedOperators((prevAssignedOperators) => {
      const newAssignedOperators = { ...prevAssignedOperators };
      delete newAssignedOperators[key];
      return newAssignedOperators;
    });
  };
  const handleRemoveJig = (rowIndex, seatIndex, index) => {
    const key = `${rowIndex}-${seatIndex}`;
    setAssignedJigs((prevAssignedJigs) => {
      const newAssignedJigs = { ...prevAssignedJigs };
      delete newAssignedJigs[key][index];
      return newAssignedJigs;
    });
  };
  const isOperatorAssignedToAnySeat = (operatorName) => {
    return Object.values(assignedOperators).some((operatorsForSeat) =>
      operatorsForSeat?.some(
        (assignedOperator) => assignedOperator.name === operatorName,
      ),
    );
  };
  const isJigAssignedToAnySeat = (jigName) => {
    return Object.values(assignedJigs).some((jigForSeat) =>
      jigForSeat?.some((assignedJig) => assignedJig.name === jigName),
    );
  };

  const changeJigCategories = async (id: any) => {
    try {
      let result = await fetchJigsById(id);
      setJigs(result);
    } catch (error) {
      console.log("Error Fecth Jig Category :", error);
    }
  };
  return (
    <div
      ref={(node) => drag(drop(node))}
      key={seatIndex}
      className={`flex flex-col rounded-lg border-2 p-2 transition-all duration-300 ${
        assignedStages[coordinates] && assignedStages[coordinates].length > 0
          ? !assignedStages[coordinates][0]?.reserved
            ? "border-green-500 bg-green-200 shadow-xl"
            : "border-danger bg-[#fbc0c0] shadow-xl"
          : "border-gray-300 bg-white hover:shadow-lg"
      }`}
      onDrop={handleDrop(rowIndex, seatIndex)}
      onDragOver={handleDragOver}
      title={
        assignedStages[coordinates] && assignedStages[coordinates].length > 0
          ? assignedStages[coordinates].join(",")
          : "Drop Stage Here"
      }
    >
      <span className="text-gray-800 flex items-center justify-between text-xs font-bold">
        <p className="text-sm"> S{item.seatNumber} </p>
      </span>
      {assignedStages[coordinates] && assignedStages[coordinates].length > 0 ? (
        <div className="mt-1">
          <div>
            {assignedStages[coordinates].map((stage: any, stageIndex: any) => (
              <div key={stageIndex}>
                <div className="flex items-center justify-between">
                  <strong className="text-gray-900 text-xs">
                    {stage.name}
                    <p>{stage.upha}</p>
                  </strong>
                  {!stage?.reserved && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveStage(
                          rowIndex,
                          seatIndex,
                          stageIndex,
                          rowSeatLength,
                        )
                      }
                      className="ml-3 h-5 rounded-full bg-danger p-1 text-white transition-all duration-200 hover:bg-danger"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="h-3 w-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {stageIndex === assignedStages[coordinates].length - 1 &&
                  assignedOperators[`${rowIndex}-${seatIndex}`]?.map(
                    (operator: any, index: any) => (
                      <p
                        key={index}
                        className="flex items-center justify-end text-xs"
                      >
                        <span>
                          <strong>Operator : </strong>
                          {operator.name}{" "}
                        </span>
                        {!stage?.reserved && (
                          <button
                            type="button"
                            className="h-5 rounded-full p-1 transition-all duration-200"
                            onClick={() =>
                              handleRemoveOperator(rowIndex, seatIndex)
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
                        )}
                      </p>
                    ),
                  )}
                {assignedJigs[coordinates] &&
                  assignedJigs[`${rowIndex}-${seatIndex}`]?.map(
                    (jig: any, index: any) => (
                      <p
                        key={index}
                        className="flex items-center justify-end text-xs"
                      >
                        <span>
                          <strong>Jig : </strong>
                          {jig?.name}{" "}
                        </span>
                        {!stage?.reserved && (
                          <button
                            type="button"
                            className="h-5 rounded-full p-1 transition-all duration-200"
                            onClick={() =>
                              handleRemoveJig(rowIndex, seatIndex, index)
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
                        )}
                      </p>
                    ),
                  )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <span className="text-gray-500 text-sm italic">No Stage Assigned</span>
      )}
      {assignedStages[coordinates] &&
        assignedStages[coordinates].length > 0 &&
        !assignedStages[`${rowIndex}-${seatIndex}`][0]?.reserved &&
        !assignedOperators[`${rowIndex}-${seatIndex}`] && (
          <div>
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                className="text-dark ml-3 h-6 rounded-full bg-gray p-1.5 transition-all duration-200"
                onClick={() => openModal(assignedStages[coordinates])}
              >
                <svg viewBox="0 0 24 24" fill="none" width="10px" height="10px">
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="M20 18L14 18M17 15V21M4 21C4 17.134 7.13401 14 11 14C11.695 14 12.3663 14.1013 13 14.2899M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
                      stroke="#000000"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>{" "}
                  </g>
                </svg>
              </button>
            </div>
          </div>
        )}
      {assignedStages[coordinates] &&
        assignedStages[coordinates][0].hasJigStepType && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              className="text-dark ml-3 h-6 rounded-full bg-gray p-1.5 transition-all duration-200"
              onClick={() => openAssignJigModal(assignedStages[coordinates])}
            >
              <svg
                fill="#000000"
                width="10px"
                height="10px"
                viewBox="0 0 100 100"
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <g>
                    {" "}
                    <path d="m56.59 37.92h-3.29v-3.3a2.2 2.2 0 0 0 -2.2-2.19h-2.2a2.2 2.2 0 0 0 -2.2 2.19v3.3h-3.29a2.21 2.21 0 0 0 -2.2 2.2v2.19a2.21 2.21 0 0 0 2.2 2.2h3.29v3.3a2.21 2.21 0 0 0 2.2 2.19h2.2a2.21 2.21 0 0 0 2.2-2.2v-3.3h3.29a2.21 2.21 0 0 0 2.2-2.2v-2.18a2.21 2.21 0 0 0 -2.2-2.2z"></path>{" "}
                    <path d="m79.6 25.33a5 5 0 0 0 -4.93-4.93h-49.34a5 5 0 0 0 -4.93 4.93v32.07a5 5 0 0 0 4.93 4.93h49.34a5 5 0 0 0 4.93-4.93zm-7.4 27.75a1.89 1.89 0 0 1 -1.85 1.85h-40.7a1.89 1.89 0 0 1 -1.85-1.85v-23.43a1.89 1.89 0 0 1 1.85-1.85h40.7a1.89 1.89 0 0 1 1.85 1.85zm-13.57 19.12h-3.7a1.16 1.16 0 0 1 -1.23-1.2v-2.5a1.16 1.16 0 0 0 -1.23-1.23h-4.94a1.16 1.16 0 0 0 -1.23 1.23v2.5a1.16 1.16 0 0 1 -1.23 1.23h-3.7a5 5 0 0 0 -4.94 4.93v.62a1.9 1.9 0 0 0 1.85 1.85h23.44a1.9 1.9 0 0 0 1.85-1.85v-.62a5 5 0 0 0 -4.94-4.96z"></path>{" "}
                  </g>{" "}
                </g>
              </svg>
            </button>
          </div>
        )}
      <Modal
        isOpen={isModalOpen}
        onSubmit={handlesubmitOperator}
        onClose={closeModal}
        title="Assign Operators"
      >
        <div>
          <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
            Operators
          </label>
          <select
            onChange={(e) =>
              handleOperator(rowIndex, seatIndex, e.target.value)
            }
            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
          >
            <option value="">Please Select</option>
            {filteredOperators?.map((operator, index) => (
              <option
                key={index}
                value={operator._id}
                className="text-body dark:text-bodydark"
                disabled={isOperatorAssignedToAnySeat(operator.name)}
              >
                {operator.name}
                {isOperatorAssignedToAnySeat(operator.name) && "(Assigned)"}
              </option>
            ))}
          </select>
        </div>
      </Modal>
      <Modal
        isOpen={isAssignJigModalOpen}
        onSubmit={handlesubmitJigs}
        onClose={closeAssignJigModal}
        title="Assign Jigs"
      >
        <div>
          <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
            Jig Category
          </label>
          <select
            onChange={(e) => changeJigCategories(e.target.value)}
            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
          >
            <option value="">Please Select</option>
            {jigCategories?.map((category, index) => (
              <option
                key={index}
                value={category._id}
                className="text-body dark:text-bodydark"
                // disabled={isJigAssignedToAnySeat(category.name)}
              >
                {category.name}
                {/* {isJigAssignedToAnySeat(category.name) && "(Assigned)"} */}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-800 mb-3 mt-2 block text-sm font-medium dark:text-bodydark">
            Jig
          </label>
          <select
            onChange={(e) => handleJig(rowIndex, seatIndex, e.target.value)}
            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
          >
            <option value="">Please Select</option>
            {jigs?.map((jig, index) => (
              <option
                key={index}
                value={jig?._id}
                className="text-body dark:text-bodydark"
                disabled={isJigAssignedToAnySeat(jig?.name)}
              >
                {jig?.name}
                {isJigAssignedToAnySeat(jig?.name) && "(Assigned)"}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
};

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
      console.log("Fetch Jig Categories :", error);
    }
  };
  const getAllPlaning = async () => {
    try {
      let result = await getPlaningAndSchedulingModel();
      setSavedPlaning(result?.PlaningAndScheduling);
    } catch (error) {
      console.log("Error Fetching Availability", error);
    }
  };
  const getHolidayList = async () => {
    try {
      let result = await fetchHolidays();
      return result.holidays;
    } catch (error) {
      console.log("Error Fetching Availability", error);
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
      console.log("Error Fetching Availability", error);
      return {};
    }
  };
  const getOperators = async () => {
    try {
      const result = await getOperatorsForPlan();
      setOperators(result.users);
      return false;
    } catch (error) {
      console.log("Error Fetching Operators", error);
    }
  };
  const getAllShifts = async () => {
    try {
      const result = await viewShift();
      setShifts(result?.Shifts);
    } catch (error) {
      console.log("Error Fetching Shifts", error);
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
      console.log("Error Fetching Products:", error);
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
      getProduct(selectedProces[0].selectedProduct);
      setSelectedProcess(selectedProces[0]);
      setProcess(filterProcess);
    } catch (error) {
      console.log("Error Fetching Process", error);
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
          console.log(
            "Attempted to move to/from a reserved seat; action canceled.",
          );
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
    Products: any,
    selectedRoom: any,
    repeatCount = 1,
    reservedSeats = {},
  ) => {
    const stages = Products?.stages;
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
  const handleCalculation = async () => {
    if (!selectedProcess || !selectedProduct) {
      return;
    }
    let totalQuantity = parseInt(selectedProcess?.quantity);
    if (isNaN(totalQuantity) || totalQuantity <= 0) {
      return;
    }

    const uphaValues = selectedProduct?.stages?.map((stage: any) =>
      parseInt(stage.upha, 10),
    );
    const leastUpha = Math.min(...uphaValues);
    const breakTime = selectedShift?.totalBreakTime || 0;
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
    const assignedStages = allocateStagesToSeats(
      selectedProduct,
      selectedRoom,
      repeatCount,
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

    setEstimatedEndDate(expectedEndDate);
    setTotalTimeEstimation(totalTimeEstimationInDays.toFixed(2));
    setTotalUPHA(unitsPer8HourDay.toFixed(2));
    setIsPlaningAndSchedulingShow(true);
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
  const handleDragStart =(stage: any, substep = null) => (event: any) => {
    const data = {
      name: stage.stageName,
      upha: stage.upha,
      substepName: substep ? [substep.stepName] : null,
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  };
  const moveItem = (fromCoordinates: any, toCoordinates: any) => {
    setAssignedStages((prevStages) => {
      const updatedStages = { ...prevStages };
      const updatedOperators = { ...assignedOperators };
      if (updatedStages[fromCoordinates]?.[0]?.reserved) {
        console.log("Attempted to move from a reserved seat; action canceled.");
        return prevStages;
      }
      if (updatedStages[toCoordinates]?.[0]?.reserved) {
        console.log("Target seat is reserved; move action canceled.");
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
      console.log("Error Submitting Planing and Scheduling !!", e);
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
      console.log("Error Handle Remove Operator :", error);
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
            <div className="flex justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Add Planning & Scheduling
              </h3>
              <button
                type="button"
                className="rounded-lg bg-boxdark px-2 py-2 text-xs text-white"
                onClick={() => setIsClonePlaningModel(true)}
              >
                {" "}
                Clone Planing
              </button>
              <Modal
                isOpen={isClonePlaningModel}
                onSubmit={handleSubmitClonePlaning}
                onClose={closeClonePlaningModal}
                title="Clone Planing"
              >
                <div>
                  <label className="text-gray-800 mb-3 block text-sm font-medium dark:text-bodydark">
                    Choose Planing Model
                  </label>
                  <select
                    value={selectedClonePlaning?._id || ""}
                    onChange={(e) => handlePlaningModel(e.target.value)}
                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                  >
                    <option value="">Please Select</option>
                    {getSavedPlaning?.map((planing, index) => (
                      <>
                        <option
                          key={index}
                          value={planing?._id}
                          className="text-body dark:text-bodydark"
                        >
                          {planing?.processName}
                        </option>
                      </>
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
                {totalTimeEstimation != "" && (
                  <div className="grid w-full justify-center">
                    <p>Estimated Completed Date : {estimatedEndDate}</p>
                    <p>
                      Total Time Estimation (in days): {totalTimeEstimation}
                    </p>
                    <p>
                      Units Processed Per{" "}
                      {shiftTime - parseInt(selectedShift?.totalBreakTime) / 60}
                      -Hour Day: {totalUPHA}
                    </p>
                  </div>
                )}
                {isPlaningAndSchedulingShow && (
                  <div>
                    {/* Component 2 */}
                    <div className="flex gap-10">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                          Stages
                        </h3>
                        <div className="custom-scroll mt-4 h-90 flex-wrap gap-4 overflow-x-auto pt-4">
                          {selectedProduct?.stages?.map((stage, index) => (
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
                          {selectedProduct?.commonStages.map(
                            (value, index) => (
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
                                          assignedCustomOperators[index]
                                            .length > 0 && (
                                            <div className="flex gap-2">
                                              {assignedCustomOperators[
                                                index
                                              ].map((op, i) => (
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
                                              ))}
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
                            ),
                          )}
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
                                {isOperatorAssignedToAnySeat(
                                  operator?.name,
                                ) && "(Assigned)"}
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
