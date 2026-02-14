"use client";
import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import Modal from "@/components/Modal/page";
import { UserPlus, Settings, Wrench } from "lucide-react";
import { fetchJigsById } from "@/lib/api";
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
    hover: () => { },
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
      if (newAssignedJigs[key]) {
        newAssignedJigs[key] = newAssignedJigs[key].filter((_, i) => i !== index);
        if (newAssignedJigs[key].length === 0) {
          delete newAssignedJigs[key];
        }
      }
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

    }
  };
  return (
    <div
      ref={(node) => drag(drop(node))}
      key={seatIndex}
      className={`flex flex-col h-full rounded-xl border-2 p-2 transition-all duration-300 ${assignedStages[coordinates] && assignedStages[coordinates].length > 0
        ? !assignedStages[coordinates][0]?.reserved
          ? "border-green-500/50 bg-green-50 shadow-sm transform hover:scale-[1.01] dark:bg-green-900/20"
          : "border-red-500/50 bg-red-50 shadow-sm dark:bg-red-900/20"
        : "border-dashed border-gray-300 bg-white hover:border-primary/50 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
        }`}
      onDrop={handleDrop(rowIndex, seatIndex)}
      onDragOver={handleDragOver}
      title={
        assignedStages[coordinates] && assignedStages[coordinates].length > 0
          ? assignedStages[coordinates].join(",")
          : "Drop Stage Here"
      }
    >
      <span className="text-gray-800 flex items-center justify-between text-[10px] font-bold">
        <p className="text-xs"> S{item.seatNumber} </p>
      </span>
      {assignedStages[coordinates] && assignedStages[coordinates].length > 0 ? (
        <div className="mt-1">
          <div>
            {assignedStages[coordinates].map((stage: any, stageIndex: any) => (
              <div key={stageIndex}>
                <div className="flex items-center justify-between">
                  <strong className="text-gray-900 text-[10px] leading-tight">
                    {stage.name}
                    <p className="text-[9px] text-gray-500">{stage.upha}</p>
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
                      className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 transition-all duration-200 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400"
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
                            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
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
                            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
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
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all duration-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
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
                onChange={(e) =>
                  handleOperator(rowIndex, seatIndex, e.target.value)
                }
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:border-blue-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Select an operator...</option>
                {filteredOperators?.map((operator, index) => (
                  <option
                    key={index}
                    value={operator._id}
                    disabled={isOperatorAssignedToAnySeat(operator.name)}
                  >
                    {operator.name}
                    {isOperatorAssignedToAnySeat(operator.name) ? " — (Assigné)" : ""}
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
            <p>Only operators whose skills match the <strong>{assignedStages[coordinates]?.[0]?.name || "current stage"}</strong> requirements are listed here.</p>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isAssignJigModalOpen}
        onSubmit={handlesubmitJigs}
        onClose={closeAssignJigModal}
        title="Assign Jigs"
        maxWidth="max-w-sm"
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]">
              <Settings className="h-3.5 w-3.5 text-purple-500" />
              Jig Category
            </label>
            <div className="group relative">
              <select
                onChange={(e) => changeJigCategories(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:border-purple-400 hover:bg-white focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Select Category...</option>
                {jigCategories?.map((category, index) => (
                  <option
                    key={index}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors group-hover:text-purple-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]">
              <Wrench className="h-3.5 w-3.5 text-purple-500" />
              Machine/Tool Name
            </label>
            <div className="group relative">
              <select
                onChange={(e) => handleJig(rowIndex, seatIndex, e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:border-purple-400 hover:bg-white focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Select a Jig...</option>
                {jigs?.map((jig, index) => (
                  <option
                    key={index}
                    value={jig?._id}
                    disabled={isJigAssignedToAnySeat(jig?.name)}
                  >
                    {jig?.name}
                    {isJigAssignedToAnySeat(jig?.name) ? " — (Occupé)" : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors group-hover:text-purple-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-purple-50/50 p-4 text-[11px] leading-relaxed text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
            <div className="mt-0.5 rounded-full bg-purple-100 p-1 dark:bg-purple-800">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p>Assign relevant equipment to this station to ensure the operator has everything needed for the <strong>{assignedStages[coordinates]?.[0]?.name || "process"}</strong>.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DraggableGridItem;
