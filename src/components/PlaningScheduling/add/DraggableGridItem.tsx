"use client";
import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
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
      console.log("stage ==>", stage);
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

export default DraggableGridItem;
