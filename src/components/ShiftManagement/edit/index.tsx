"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState } from "react";
import { updateShift, getShift } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckboxOne from "@/components/Checkboxes/CheckboxOne";

const EditShiftManagement = () => {
  const [name, setName] = useState("");
  const [descripition, setDescripition] = useState("");
  const [weekDays, setWeekDays] = useState({
    sun: false,
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
  });
  const [breakTimeArr, setBreakTimeArr] = useState([15, 30, 45, 60]);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [breakTime, setBreakTime] = useState("00:00");
  const [intervals, setIntervals] = useState([
    { startTime: "00:00", endTime: "00:00", breakTime: false },
  ]);
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getShiftByID(id);
  }, []);
  const getShiftByID = async (id: any) => {
    try {
      let result = await getShift(id);
      setName(result.name);
      setDescripition(result.descripition);
      setIntervals(result.intervals);
      setWeekDays(result.weekDays);
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");
    }
  };
  const handleCheckboxChange = (day) => {
    setWeekDays((prevDays) => ({
      ...prevDays,
      [day]: !prevDays[day],
    }));
  };
  const handleSubmit = async (e: any) => {
    // return;
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    e.preventDefault();
    try {
      // Extract start and end times
      const shiftStartTime = intervals[0].startTime;
      const shiftEndTime = intervals[intervals.length - 1].endTime;
      const totalBreakTime = intervals.filter((interval) => interval.breakTime)
      .reduce((total, breakInterval) => {
        return (
          total +
          calculateTimeDifference(
            breakInterval.startTime,
            breakInterval.endTime,
          )
        );
      }, 0);
      const formData = {
        name,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        totalBreakTime,
        intervals,
        descripition,
        weekDays,
      };
      const result = await updateShift(formData, id);
      toast.success("User details Updated successfully!");
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");
    }
  };
  const calculateTimeDifference = (start, end) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  };

  const handleCheckboxBreakTime = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedIntervals = [...intervals];
    updatedIntervals[index][field] = value;
    setIntervals(updatedIntervals);
  };
  const handleIntervalChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedIntervals = [...intervals];
    updatedIntervals[index][field] = value;
    setIntervals(updatedIntervals);
  };
  const removeInterval = (index: number) => {
    const updatedIntervals = intervals.filter((_, i) => i !== index);
    setIntervals(updatedIntervals);
  };
  const addInterval = () => {
    setIntervals([
      ...intervals,
      { startTime: "00:00", endTime: "00:00", breakTime: false },
    ]);
  };
  return (
    <>
      <Breadcrumb parentName="Shift Management" pageName="Edit Shift" />
      <div className="grid gap-9">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Edit Shift
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-1">
                {/* Operator Name Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Shift Name"
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                {/* <div>
                  <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 block w-full rounded-lg border p-2.5 text-sm leading-none focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    required
                  />
                </div> */}
              </div>
              <div className="px-8 pr-8 pt-4">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Description
                  </label>
                  <textarea
                    rows={6}
                    value={descripition}
                    onChange={(e) => setDescripition(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-lg border-[1.5px] border-primary bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input dark:text-white"
                  ></textarea>
                </div>
              </div>
              <div className=" px-8 pr-8 pt-4">
                <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
                  Days Of Week
                </label>
              </div>
              <div className="grid gap-2 px-8 pr-8 pt-4 sm:grid-cols-12">
                {Object.keys(weekDays)
                  .filter((day) => day !== "_id")
                  .map((day) => (
                    <CheckboxOne
                      key={day}
                      id={day}
                      value={day}
                      checked={weekDays[day]}
                      setValue={() => handleCheckboxChange(day)}
                      label={day.charAt(0).toUpperCase() + day.slice(1)}
                    />
                  ))}
              </div>
              <div className="px-6 pr-8 pt-4">
                <h3 className="font-medium text-black dark:text-white">
                  Shift Time Interval
                </h3>
              </div>
              <div className="grid gap-6 px-8 pr-8 pt-4">
                {intervals.map((interval, index) => (
                  <div key={index} className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={interval.startTime}
                        onChange={(e) =>
                          handleIntervalChange(
                            index,
                            "startTime",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={interval.endTime}
                        onChange={(e) =>
                          handleIntervalChange(index, "endTime", e.target.value)
                        }
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        required
                      />
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={interval.breakTime || false}
                          onChange={(e) =>
                            handleCheckboxBreakTime(
                              index,
                              "breakTime",
                              e.target.checked,
                            )
                          }
                        />
                        <label className="capitalize text-black dark:text-white">
                          Break Time
                        </label>
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={interval.breakTime}
                          onChange={(e) => handleCheckboxBreakTime(index,"breakTime",e.target.value)}
                          // id={day}
                        />
                        <label
                          // htmlFor={day}
                          className="capitalize text-black dark:text-white"
                        >
                          Break Time
                        </label>
                      </div> */}
                      <button
                        type="button"
                        onClick={() => removeInterval(index)}
                        className="hover:bg-red-600 rounded-md bg-danger px-2.5 py-2 text-white transition"
                      >
                        <svg
                          width="20px"
                          height="20px"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ffffff"
                        >
                          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                          <g
                            id="SVGRepo_tracerCarrier"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          ></g>
                          <g id="SVGRepo_iconCarrier">
                            {" "}
                            <path
                              d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17"
                              stroke="#ffffff"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-end">
                  <button
                    type="button"
                    onClick={addInterval}
                    className="rounded-md bg-blue-600 px-2.5 py-2 text-white transition hover:bg-blue-700"
                  >
                    <svg
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M6 12H18M12 6V18"
                          stroke="#ffffff"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></path>{" "}
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
              {/* <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-2">
                <div>
                  <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
                    End Time:
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 block w-full rounded-lg border p-2.5 text-sm leading-none focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
                    Break Time:
                  </label>
                  <select
                    value={breakTime || ""}
                    onChange={(e) => setBreakTime(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
                  >
                    <option value="" className="text-body dark:text-bodydark">
                      Please Select
                    </option>
                    {breakTimeArr.map((room, index) => (
                      <option
                        key={index}
                        value={room}
                        className="text-body dark:text-bodydark"
                      >
                        {room} Minutes
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    id="time"
                    value={breakTime}
                    onChange={(e) => setBreakTime(e.target.value)}
                    className="bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 block w-full rounded-lg border p-2.5 text-sm leading-none focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    required
                  /> 
                </div>
              </div> */}

              {/* Submit Button */}
              <div className="col-span-2 flex justify-end p-8 pr-8">
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditShiftManagement;
