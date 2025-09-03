"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import { createShift } from "../../../lib/api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckboxOne from "@/components/Checkboxes/CheckboxOne";
const AddShiftManagement = () => {
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
  const [intervals, setIntervals] = useState([
    { startTime: "00:00", endTime: "00:00", breakTime: false },
  ]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(intervals);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setIntervals(reordered);
  };

  const handleCheckboxChange = (day: string) => {
    setWeekDays((prevDays) => ({
      ...prevDays,
      [day]: !prevDays[day],
    }));
  };

  const calculateTimeDifference = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      // sort intervals
      const sortedIntervals = intervals.sort((a, b) => {
        const [aHours, aMinutes] = a.startTime.split(":").map(Number);
        const [bHours, bMinutes] = b.startTime.split(":").map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
      });

      // find shift start (skip leading breaks)
      let shiftStartTime = sortedIntervals[0].startTime;
      for (let i = 0; i < sortedIntervals.length; i++) {
        if (!sortedIntervals[i].breakTime) {
          shiftStartTime = sortedIntervals[i].startTime;
          break;
        } else {
          shiftStartTime = sortedIntervals[i].endTime;
        }
      }

      // find shift end (skip trailing breaks)
      let shiftEndTime = sortedIntervals[sortedIntervals.length - 1].endTime;
      for (let i = sortedIntervals.length - 1; i >= 0; i--) {
        if (!sortedIntervals[i].breakTime) {
          shiftEndTime = sortedIntervals[i].endTime;
          break;
        }
      }

      // total break time
      const totalBreakTime = sortedIntervals
        .filter((interval) => interval.breakTime)
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
        intervals: sortedIntervals,
        descripition,
        weekDays,
      };

      await createShift(formData);
      toast.success("Shift created successfully!");

      // reset form
      setName("");
      setDescripition("");
      setIntervals([
        { startTime: "00:00", endTime: "00:00", breakTime: false },
      ]);
      setWeekDays({
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
      });
    } catch (error) {
      console.error("Error creating shift:", error);
      toast.error("Failed to create shift. Please try again.");
    }
  };

  const handleCheckboxBreakTime = (
    index: number,
    field: string,
    value: boolean,
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

    const start = updatedIntervals[index].startTime;
    const end = updatedIntervals[index].endTime;
    // if (start && end && start >= end) {
    //   toast.error("Start time must be before End time");
    //   return;
    // }

    if (index > 0) {
      const prevEnd = updatedIntervals[index - 1].endTime;
      if (prevEnd && start < prevEnd) {
        toast.error("Intervals must not overlap");
        return;
      }
    }

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
      <Breadcrumb parentName="Shift Management" pageName="Create Shift" />
      <div className="grid gap-9">
        <ToastContainer position="top-center" />
        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Create Shift
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-1">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Shift Name"
                    className="w-full rounded-lg border px-5 py-3 text-black dark:bg-form-input dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="px-8 pr-8 pt-4">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Description
                </label>
                <textarea
                  rows={6}
                  value={descripition}
                  onChange={(e) => setDescripition(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border px-5 py-3 text-black dark:bg-form-input dark:text-white"
                />
              </div>

              {/* Week Days */}
              <div className="px-8 pr-8 pt-4">
                <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
                  Days Of Week
                </label>
              </div>
              <div className="grid gap-2 px-8 pr-8 pt-4 sm:grid-cols-12">
                {Object.keys(weekDays).map((day) => (
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

              {/* Intervals */}
              <div className="px-8 pt-4">
                <h3 className="mb-2 font-medium text-black dark:text-white">
                  Shift Intervals
                </h3>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="intervals">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2"
                      >
                        {intervals.map((interval, index) => (
                          <Draggable
                            key={index.toString()}
                            draggableId={index.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-3 rounded-lg border p-3 ${
                                  snapshot.isDragging
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900"
                                    : "border-gray-200 dark:bg-gray-800"
                                }`}
                              >
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
                                  className="dark:bg-gray-700 rounded border px-2 py-1 text-sm dark:text-white"
                                  required
                                />
                                <span className="text-sm">to</span>
                                <input
                                  type="time"
                                  value={interval.endTime}
                                  onChange={(e) =>
                                    handleIntervalChange(
                                      index,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                  className="dark:bg-gray-700 rounded border px-2 py-1 text-sm dark:text-white"
                                  required
                                />
                                <label className="ml-4 flex items-center gap-1 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={interval.breakTime}
                                    onChange={(e) =>
                                      handleCheckboxBreakTime(
                                        index,
                                        "breakTime",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                  Break
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeInterval(index)}
                                  className="ml-auto rounded bg-danger px-3 py-1 text-sm text-white"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addInterval}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                  >
                    + Add Interval
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="col-span-2 flex justify-end p-8 pr-8">
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddShiftManagement;
