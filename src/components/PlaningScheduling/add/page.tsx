"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewRoom, getProductById, viewProcess } from "../../../lib/api";
import flatpickr from "flatpickr";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";

const ADDPlanSchedule = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [productName, setProductName] = useState("");
  const [process, setProcess] = useState([]);
  const [roomPlan, setRoomPlan] = useState([]);
  const [assignedStages, setAssignedStages] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    flatpickr(".form-datepicker", {
      mode: "single",
      static: true,
      dateFormat: "M j, Y",
      // defaultDate: value,
      // onChange: (selectedDates, dateStr) => {
      //   setValue(dateStr); // Update the state in the parent component
      // },
      prevArrow:
        '<svg className="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg className="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });
    getAllProcess();
    getAllRoomPlan();
  }, []);
  const getAllProcess = async () => {
    try {
      let result = await viewProcess();
      setProcess(result.Processes);
    } catch (error) {
      console.log("Error Fetching Process", error);
    }
  };
  const getProduct = async (id: any) => {
    try {
      let result = await getProductById(id);
      setProductName(result.name);
      setSelectedProduct(result);
    } catch (error) {
      console.log("Error Fetching Products:", error);
    }
  };

  const handleRemoveStage = (rowIndex, seatIndex) => {
    setAssignedStages((prev) => {
      const updatedStages = { ...prev };
      delete updatedStages[`${rowIndex}-${seatIndex}`];
      return updatedStages;
    });
  };
  const handleRemoveSubStage = (rowIndex, seatIndex, subStageIndex) => {
    setAssignedStages((prev) => {
      const updatedStages = { ...prev };
      const key = `${rowIndex}-${seatIndex}`;

      if (updatedStages[key]) {
        // Filter out the substep at subStageIndex
        updatedStages[key].substeps = updatedStages[key].substeps.filter(
          (_, index) => index !== subStageIndex,
        );

        // If no substeps remain, you can also delete the stage entry
        if (updatedStages[key].substeps.length === 0) {
          delete updatedStages[key];
        }
      }

      return updatedStages;
    });
  };

  // const handleRemoveSubStage = (rowIndex, seatIndex, subStageIndex) =>{
  //   setAssignedStages((prev) => {
  //     const updatedStages = { ...prev };
  //     delete updatedStages[`${rowIndex}-${seatIndex}`.substeps[${subStageIndex}]];
  //     return updatedStages;
  //   });
  // }

  const getAllRoomPlan = async () => {
    try {
      let result = await viewRoom();
      setRoomPlan(result.RoomPlan);
    } catch (error) {
      console.error("Error Fetching Room Plan:", error);
    }
  };

  const handleFloorName = (e) => {
    const selected = roomPlan.find((value) => value.floorName === e);
    setSelectedRoom(selected);
  };
  const handleProcessName = (e) => {
    const selected = process.find((value) => value.name === e);
    setSelectedProcess(selected);
    console.log("selected ==", selected);

    getProduct(selected?.selectedProduct);
  };

  // const handleProductName = (e) => {
  //   const selected = products.find((value) => value.name === e);
  //   setSelectedProduct(selected);
  //   console.log("selected ==", selected);

  //  //getProduct();
  // };

  const handleDrop = (rowIndex, seatIndex) => {
    return (event) => {
      event.preventDefault();
      const droppedData = JSON.parse(event.dataTransfer.getData("text/plain"));
      const { stageName, substepName } = droppedData;

      setAssignedStages((prev) => {
        const updatedStages = { ...prev };
        const existingStage = updatedStages[`${rowIndex}-${seatIndex}`];
        if (existingStage) {
          if (!existingStage.substeps.includes(substepName)) {
            existingStage.substeps.push(substepName);
          }
        } else {
          updatedStages[`${rowIndex}-${seatIndex}`] = {
            stageName,
            substeps: [substepName],
          };
        }

        return updatedStages;
      });
    };
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragStart =
    (stage, substep = null) =>
    (event) => {
      const data = {
        stageName: stage.stageName,
        substepName: substep ? [substep.stepName] : null,
      };
      event.dataTransfer.setData("text/plain", JSON.stringify(data));
    };

  return (
    <>
      <Breadcrumb
        parentName="Planning & Scheduling Management"
        pageName="Add Scheduling Management"
      />

      <div className="container mx-auto grid grid-cols-1 gap-9 p-6 sm:grid-cols-1">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Add Planning & Scheduling
              </h3>
            </div>
            <form action="#">
              <div className="p-6">
                <div className="mb-8 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Process Name
                    </label>
                    <select
                      value={selectedProcess?.name || ""}
                      onChange={(e) => handleProcessName(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                    >
                      <option value="" className="text-body dark:text-bodydark">
                        Please Select
                      </option>
                      {process.map((room, index) => (
                        <option
                          key={index}
                          value={room.name}
                          className="text-body dark:text-bodydark"
                        >
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Floor Name
                    </label>
                    <select
                      value={selectedRoom?.floorName || ""}
                      onChange={(e) => handleFloorName(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                    >
                      <option value="" className="text-body dark:text-bodydark">
                        Please Select
                      </option>
                      {roomPlan.map((room, index) => (
                        <option
                          key={index}
                          value={room.floorName}
                          className="text-body dark:text-bodydark"
                        >
                          {room.floorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedProcess && (
                  <div className="dark:bg-gray-800 mt-2 rounded-lg bg-white pb-5">
                    <h3 className="text-gray-900 mb-4 text-2xl font-semibold dark:text-white">
                      {selectedProcess.name}
                    </h3>
                    <div className="grid sm:grid-cols-2">
                      <div className="text-gray-700 dark:text-gray-300 mb-2">
                        <strong className="font-medium">Product Name:</strong>{" "}
                        {productName}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2">
                        <strong className="font-medium">
                          Order Confirmation No:
                        </strong>{" "}
                        {selectedProcess.orderConfirmationNo}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2">
                        <strong className="font-medium">Process ID:</strong>{" "}
                        {selectedProcess.processID}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mb-2">
                        <strong className="font-medium">Quantity:</strong>{" "}
                        {selectedProcess.quantity}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <strong className="font-medium">Description:</strong>{" "}
                        {selectedProcess.descripition}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-8 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Start Date
                      </label>
                      <div className="relative">
                        <input
                          className="form-datepicker w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          placeholder="mm/dd/yyyy"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)} // This allows manual entry if needed
                          data-class="flatpickr-right"
                        />
                        <div className="pointer-events-none absolute inset-0 left-auto right-5 flex items-center">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15.7504 2.9812H14.2879V2.36245C14.2879 2.02495 14.0066 1.71558 13.641 1.71558C13.2754 1.71558 12.9941 1.99683 12.9941 2.36245V2.9812H4.97852V2.36245C4.97852 2.02495 4.69727 1.71558 4.33164 1.71558C3.96602 1.71558 3.68477 1.99683 3.68477 2.36245V2.9812H2.25039C1.29414 2.9812 0.478516 3.7687 0.478516 4.75308V14.5406C0.478516 15.4968 1.26602 16.3125 2.25039 16.3125H15.7504C16.7066 16.3125 17.5223 15.525 17.5223 14.5406V4.72495C17.5223 3.7687 16.7066 2.9812 15.7504 2.9812ZM1.77227 8.21245H4.16289V10.9968H1.77227V8.21245ZM5.42852 8.21245H8.38164V10.9968H5.42852V8.21245ZM8.38164 12.2625V15.0187H5.42852V12.2625H8.38164V12.2625ZM9.64727 12.2625H12.6004V15.0187H9.64727V12.2625ZM9.64727 10.9968V8.21245H12.6004V10.9968H9.64727ZM13.8379 8.21245H16.2285V10.9968H13.8379V8.21245ZM2.25039 4.24683H3.71289V4.83745C3.71289 5.17495 3.99414 5.48433 4.35977 5.48433C4.72539 5.48433 5.00664 5.20308 5.00664 4.83745V4.24683H13.0504V4.83745C13.0504 5.17495 13.3316 5.48433 13.6973 5.48433C14.0629 5.48433 14.3441 5.20308 14.3441 4.83745V4.24683H15.7504C16.0316 4.24683 16.2566 4.47183 16.2566 4.75308V6.94683H1.77227V4.75308C1.77227 4.47183 1.96914 4.24683 2.25039 4.24683ZM1.77227 14.5125V12.2343H4.16289V14.9906H2.25039C1.96914 15.0187 1.77227 14.7937 1.77227 14.5125ZM15.7504 15.0187H13.8379V12.2625H16.2285V14.5406C16.2566 14.7937 16.0316 15.0187 15.7504 15.0187Z"
                              fill="#64748B"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full xl:w-1/2">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        End Date
                      </label>
                      <div className="relative">
                        <input
                          className="form-datepicker w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          placeholder="mm/dd/yyyy"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)} // This allows manual entry if needed
                          data-class="flatpickr-right"
                        />
                        <div className="pointer-events-none absolute inset-0 left-auto right-5 flex items-center">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15.7504 2.9812H14.2879V2.36245C14.2879 2.02495 14.0066 1.71558 13.641 1.71558C13.2754 1.71558 12.9941 1.99683 12.9941 2.36245V2.9812H4.97852V2.36245C4.97852 2.02495 4.69727 1.71558 4.33164 1.71558C3.96602 1.71558 3.68477 1.99683 3.68477 2.36245V2.9812H2.25039C1.29414 2.9812 0.478516 3.7687 0.478516 4.75308V14.5406C0.478516 15.4968 1.26602 16.3125 2.25039 16.3125H15.7504C16.7066 16.3125 17.5223 15.525 17.5223 14.5406V4.72495C17.5223 3.7687 16.7066 2.9812 15.7504 2.9812ZM1.77227 8.21245H4.16289V10.9968H1.77227V8.21245ZM5.42852 8.21245H8.38164V10.9968H5.42852V8.21245ZM8.38164 12.2625V15.0187H5.42852V12.2625H8.38164V12.2625ZM9.64727 12.2625H12.6004V15.0187H9.64727V12.2625ZM9.64727 10.9968V8.21245H12.6004V10.9968H9.64727ZM13.8379 8.21245H16.2285V10.9968H13.8379V8.21245ZM2.25039 4.24683H3.71289V4.83745C3.71289 5.17495 3.99414 5.48433 4.35977 5.48433C4.72539 5.48433 5.00664 5.20308 5.00664 4.83745V4.24683H13.0504V4.83745C13.0504 5.17495 13.3316 5.48433 13.6973 5.48433C14.0629 5.48433 14.3441 5.20308 14.3441 4.83745V4.24683H15.7504C16.0316 4.24683 16.2566 4.47183 16.2566 4.75308V6.94683H1.77227V4.75308C1.77227 4.47183 1.96914 4.24683 2.25039 4.24683ZM1.77227 14.5125V12.2343H4.16289V14.9906H2.25039C1.96914 15.0187 1.77227 14.7937 1.77227 14.5125ZM15.7504 15.0187H13.8379V12.2625H16.2285V14.5406C16.2566 14.7937 16.0316 15.0187 15.7504 15.0187Z"
                              fill="#64748B"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div></div>

                <div className="flex gap-10">
                  <div className="mb-6 w-75">
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
                      {selectedRoom &&
                        selectedRoom.lines?.map((row, rowIndex) => (
                          <div key={rowIndex} className="mb-4">
                            <div className="text-md mb-2 font-bold">
                              {row.rowName}
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              {row.seats?.map((seat, seatIndex) => {
                                const assignedStage =
                                  assignedStages[`${rowIndex}-${seatIndex}`];

                                return (
                                  <div
                                    key={seatIndex}
                                    className={`flex flex-col rounded-lg border-2 p-2 transition-all duration-300 ${
                                      assignedStage
                                        ? "border-green-500 bg-green-200 shadow-xl"
                                        : "border-gray-300 bg-white hover:shadow-lg"
                                    }`}
                                    onDrop={handleDrop(rowIndex, seatIndex)}
                                    onDragOver={handleDragOver}
                                    title={
                                      assignedStage
                                        ? `${assignedStage.stageName}: ${assignedStage.substeps.join(", ")}`
                                        : "Drop Stage Here"
                                    }
                                  >
                                    <span className="text-gray-800 flex items-center justify-between text-xs font-bold">
                                      <p className="text-sm">
                                        {" "}
                                        S{seat.seatNumber}{" "}
                                      </p>
                                      {assignedStage && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveStage(
                                              rowIndex,
                                              seatIndex,
                                            )
                                          }
                                          className="ml-3 h-5 rounded-full bg-danger p-1 text-white transition-all duration-200 hover:bg-danger"
                                          aria-label="Remove Stage"
                                        >
                                          {/* Trash SVG Icon */}
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
                                    </span>
                                    {assignedStage ? (
                                      <div className="mt-1">
                                        <div className="mb-2 flex items-center justify-between">
                                          <strong className="text-gray-900 text-sm">
                                            {assignedStage.stageName}
                                          </strong>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 text-sm italic">
                                        No Stage Assigned
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-6">
                <button
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-400"
                  type="submit"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ADDPlanSchedule;
