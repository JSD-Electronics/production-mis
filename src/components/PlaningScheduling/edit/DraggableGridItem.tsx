"use client";
import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import Modal from "@/components/Modal/page";
import { UserPlus, Settings, Wrench } from "lucide-react";
import { getUpdateStatus, fetchJigsById, updateJigStatus } from "@/lib/api";

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
  handlePlaningSubmit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignJigModalOpen, setAssignJigModelOpen] = useState(false);
  const [jigs, setJigs] = useState([]);

  const closeModal = () => setIsModalOpen(false);

  const openModal = (stages: any) => {
    const requiredSkills = stages.map((stage) =>
      stage.requiredSkill.toLowerCase().trim(),
    );

    const assignedOperatorIds = Object.values(assignedOperators || {})
      .flat()
      .filter((operator) => operator && operator._id)
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
    drop: (draggedItem: any) => {
      if (draggedItem.coordinates !== coordinates) {
        moveItem(draggedItem.coordinates, coordinates);
      }
    },
  });

  const handlesubmitOperator = () => {
    setIsModalOpen(false);
  };

  const handlesubmitJigs = () => {
    setAssignJigModelOpen(false);
  };

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

  const handleRemoveOperator = async (rowIndex, seatIndex, operatorid) => {
    try {
      let form = new FormData();
      const key = `${rowIndex}-${seatIndex}`;
      setAssignedOperators((prevAssignedOperators) => {
        const newAssignedOperators = { ...prevAssignedOperators };
        delete newAssignedOperators[key];
        return newAssignedOperators;
      });
      form.append("status", "Free");
      let data = await getUpdateStatus(operatorid, form);
      if (data && data.status == 200) {
      }
    } catch (error) {

    }
  };

  const handleRemoveJig = async (rowIndex, seatIndex, index, jigId) => {
    try {
      let form = new FormData();
      form.append("status", "Free");
      let result = await updateJigStatus(jigId, form);
      if (result && result.status == 200) {
        const key = `${rowIndex}-${seatIndex}`;
        setAssignedJigs((prevAssignedJigs) => {
          const newAssignedJigs = { ...prevAssignedJigs };
          if (newAssignedJigs[key]) {
            newAssignedJigs[key] = newAssignedJigs[key].filter(
              (_, i) => i !== index,
            );
            if (newAssignedJigs[key].length === 0) {
              delete newAssignedJigs[key];
            }
          }
          return newAssignedJigs;
        });
      }
    } catch (error) {
    }
  };

  const isOperatorAssignedToAnySeat = (operatorName: any) => {
    return Object.values(assignedOperators).some((operatorsForSeat: any) =>
      operatorsForSeat?.some(
        (assignedOperator: any) => assignedOperator.name === operatorName,
      ),
    );
  };

  const isJigAssignedToAnySeat = (jigName: any) => {
    return Object.values(assignedJigs).some((jigForSeat: any) =>
      jigForSeat?.some((assignedJig: any) => assignedJig?.name === jigName),
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
                {assignedOperators[`${rowIndex}-${seatIndex}`]?.map(
                  (operator: any, index1: number) => (
                    <p
                      key={`${rowIndex}-${seatIndex}-${operator._id || index1}`}
                      className="flex items-center justify-end pr-1 text-[10px] leading-tight mt-1"
                    >
                      <span className="truncate max-w-[80px]">
                        <strong>{operator.name}</strong>
                      </span>
                      {!stage?.reserved && (
                        <button
                          type="button"
                          className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                          onClick={() =>
                            handleRemoveOperator(
                              rowIndex,
                              seatIndex,
                              operator._id,
                            )
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="h-2.5 w-2.5"
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
                  assignedJigs[coordinates] != "null" &&
                  assignedJigs[`${rowIndex}-${seatIndex}`]?.map(
                    (jig: any, index: number) =>
                      jig?.name ? (
                        <p
                          key={index}
                          className="flex items-center justify-end text-[10px] leading-tight mt-0.5"
                        >
                          <span className="truncate max-w-[80px]">
                            <strong>{jig?.name}</strong>
                          </span>
                          {!stage?.reserved && (
                            <button
                              type="button"
                              className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                              onClick={() =>
                                handleRemoveJig(
                                  rowIndex,
                                  seatIndex,
                                  index,
                                  jig?._id,
                                )
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="h-2.5 w-2.5"
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
                      ) : null,
                  )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <span className="text-gray-400 text-[10px] italic mt-2">Empty Seat</span>
      )}

      <div className="mt-auto flex justify-end gap-1 pt-2">
        {assignedStages[coordinates] &&
          assignedStages[coordinates].length > 0 &&
          !assignedStages[`${rowIndex}-${seatIndex}`][0]?.reserved &&
          !assignedOperators[`${rowIndex}-${seatIndex}`] && (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all duration-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              onClick={() => openModal(assignedStages[coordinates])}
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          )}

        {assignedStages[coordinates] &&
          assignedStages[coordinates][0].hasJigStepType && (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-all duration-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
              onClick={() => openAssignJigModal(assignedStages[coordinates])}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
      </div>

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
                    {isOperatorAssignedToAnySeat(operator.name) ? " — (Assigned)" : ""}
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
            <p>Only operators whose skills match requirements are listed here.</p>
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
                    {isJigAssignedToAnySeat(jig?.name) ? " — (Occupied)" : ""}
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
        </div>
      </Modal>
    </div>
  );
};

export default DraggableGridItem;
