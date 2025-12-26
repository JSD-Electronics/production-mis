"use client";
import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import Modal from "@/components/Modal/page";
import { getUpdateStatus,fetchJigsById} from "@/lib/api";
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
  const closeModal = () => setIsModalOpen(false);
  const [isAssignJigModalOpen, setAssignJigModelOpen] = useState(false);
  const [jigs, setJigs] = useState([]);
  const openModal = (stages: any) => {
    const requiredSkills = stages.map((stage) =>
      stage.requiredSkill.toLowerCase().trim(),
    );
    console.log("requiredSkills ==>", requiredSkills);
    const assignedOperatorIds = Object.values(assignedOperators || {})
      .flat()
      .filter((operator) => operator && operator._id) // only valid ones
      .map((operator) => operator._id);
    console.log("assignedOperatorIds ==>", assignedOperatorIds);
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
  const handlesubmitJigs = () => {
    setAssignJigModelOpen(false);
  };
  const closeAssignJigModal = () => {
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
  const handlesubmitOperator = () => {
    setIsModalOpen(false);
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
      console.log("Error Handle Remove Operator :", error);
    }
  };
  const openAssignJigModal = (stages: any) => {
    setAssignJigModelOpen(true);
  };
  const isOperatorAssignedToAnySeat = (operatorName: any) => {
    return Object.values(assignedOperators).some((operatorsForSeat) =>
      operatorsForSeat?.some(
        (assignedOperator) => assignedOperator.name === operatorName,
      ),
    );
  };
  const isJigAssignedToAnySeat = (jigName: any) => {
    return Object.values(assignedJigs).some((jigForSeat) =>
      jigForSeat?.some((assignedJig) => assignedJig?.name === jigName),
    );
  };
  const handleRemoveJig = async (rowIndex, seatIndex, index, jigId) => {
    try {
      let form = new FormData();
      form.append("status", "Free");
      let result = await updateJigStatus(jigId, form);
      if (result && result.status == 200) {
        // toast.success("Jig Removed successfully!");
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

        // handlePlaningSubmit();
      }
    } catch (error) {
      console.log("Error Handle Remove Jig :", error);
    }
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
                {assignedOperators[`${rowIndex}-${seatIndex}`]?.map(
                  (operator: any, index1: number) => (
                    <p
                      key={`${rowIndex}-${seatIndex}-${operator._id || index1}`}
                      className="flex items-center justify-end pr-1 text-xs"
                    >
                      <span>
                        <strong>Operator : </strong>
                        {operator.name}{" "}
                      </span>
                      {!stage?.reserved && (
                        <button
                          type="button"
                          className="h-5 rounded-full transition-all duration-200"
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
                  assignedJigs[coordinates] != "null" &&
                  assignedJigs[`${rowIndex}-${seatIndex}`]?.map(
                    (jig: any, index: number) =>
                      jig?.name ? (
                        <p
                          key={index}
                          className="flex items-center justify-end text-xs"
                        >
                          <span>
                            <strong>Jig: </strong>
                            {jig?.name}{" "}
                          </span>
                          {!stage?.reserved && (
                            <button
                              type="button"
                              className="h-5 rounded-full p-1 transition-all duration-200"
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
                      ) : null,
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
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="text-dark ml-3 h-6 rounded-full bg-gray p-1.5 transition-all duration-200"
              onClick={() => openModal(assignedStages[coordinates])}
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
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
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
      {assignedStages[coordinates] &&
        // !assignedJigs[`${rowIndex}-${seatIndex}`] &&
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
              >
                {category.name}
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
