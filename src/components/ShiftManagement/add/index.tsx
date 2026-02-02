"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import { createShift } from "../../../lib/api";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckboxOne from "@/components/Checkboxes/CheckboxOne";
import {
  Clock,
  FileText,
  CalendarDays,
  PlusCircle,
  Trash2,
} from "lucide-react";

const AddShiftManagement = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
  const [errors, setErrors] = useState<any>({});

  // Dragging handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(intervals);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setIntervals(reordered);
  };

  // Handle week day checkbox
  const handleCheckboxChange = (day: string) => {
    setWeekDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Time difference (in minutes)
  const calculateTimeDifference = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  };

  // Validation logic
  const validateForm = () => {
    const newErrors: any = {};

    if (!name.trim()) newErrors.name = "Shift name is required";
    if (!description.trim()) newErrors.description = "Description is required";

    if (!Object.values(weekDays).includes(true)) {
      newErrors.weekDays = "Select at least one working day";
    }

    if (intervals.length === 0) {
      newErrors.intervals = "At least one interval is required";
    } else {
      intervals.forEach((interval, i) => {
        if (!interval.startTime || !interval.endTime) {
          newErrors[`interval-${i}`] = "Start & End time are required";
        } else if (interval.startTime >= interval.endTime) {
          newErrors[`interval-${i}`] =
            "Start time must be earlier than end time";
        }

        if (i > 0) {
          const prevEnd = intervals[i - 1].endTime;
          if (interval.startTime < prevEnd) {
            newErrors[`interval-${i}`] = "Intervals must not overlap";
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix form errors before submitting");
      return;
    }

    try {
      // Sort intervals
      const sortedIntervals = intervals.sort((a, b) => {
        const [ah, am] = a.startTime.split(":").map(Number);
        const [bh, bm] = b.startTime.split(":").map(Number);
        return ah * 60 + am - (bh * 60 + bm);
      });

      // Find shift start
      let shiftStartTime = sortedIntervals[0].startTime;
      for (let i = 0; i < sortedIntervals.length; i++) {
        if (!sortedIntervals[i].breakTime) {
          shiftStartTime = sortedIntervals[i].startTime;
          break;
        } else {
          shiftStartTime = sortedIntervals[i].endTime;
        }
      }

      // Find shift end
      let shiftEndTime = sortedIntervals[sortedIntervals.length - 1].endTime;
      for (let i = sortedIntervals.length - 1; i >= 0; i--) {
        if (!sortedIntervals[i].breakTime) {
          shiftEndTime = sortedIntervals[i].endTime;
          break;
        }
      }

      // Calculate break time
      const totalBreakTime = sortedIntervals
        .filter((interval) => interval.breakTime)
        .reduce(
          (total, br) =>
            total + calculateTimeDifference(br.startTime, br.endTime),
          0,
        );

      const formData = {
        name,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        totalBreakTime,
        intervals: sortedIntervals,
        description,
        weekDays,
      };

      await createShift(formData);
      toast.success("Shift created successfully!");

      // Reset form
      setName("");
      setDescription("");
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
      setErrors({});
      window.location.href ="/shift-management/view";
    } catch (err) {
      console.error("Error creating shift:", err);
      toast.error("Failed to create shift. Please try again.");
    }
  };

  // Interval handlers
  const handleIntervalChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...intervals];
    updated[index][field] = value;
    setIntervals(updated);
  };

  const handleCheckboxBreakTime = (
    index: number,
    field: string,
    value: boolean,
  ) => {
    const updated = [...intervals];
    updated[index][field] = value;
    setIntervals(updated);
  };

  const removeInterval = (index: number) => {
    setIntervals(intervals.filter((_, i) => i !== index));
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
          <div className="rounded-lg border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="flex items-center gap-2 font-medium text-black dark:text-white">
                <Clock size={18} /> Create Shift
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="px-8 pt-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  <FileText size={16} className="mr-1 inline-block" /> Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Shift Name"
                  className="w-full rounded-lg border px-5 py-3 text-black dark:bg-form-input dark:text-white"
                />
                {errors.name && (
                  <p className="text-danger mt-1 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="px-8">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  <FileText size={16} className="mr-1 inline-block" />{" "}
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border px-5 py-3 text-black dark:bg-form-input dark:text-white"
                />
                {errors.description && (
                  <p className="text-danger mt-1 text-sm">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Week Days */}
              <div className="px-8">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  <CalendarDays size={16} className="mr-1 inline-block" /> Days
                  of Week
                </label>
                <div className="grid grid-cols-7 gap-2">
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
                {errors.weekDays && (
                  <p className="text-danger mt-1 text-sm">{errors.weekDays}</p>
                )}
              </div>

              {/* Intervals */}
              <div className="px-8">
                <h3 className="mb-2 font-medium text-black dark:text-white">
                  Shift Intervals
                </h3>
                {errors.intervals && (
                  <p className="text-danger mb-2 text-sm">
                    {errors.intervals}
                  </p>
                )}
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
                                  className="bg-red-600 hover:bg-red-700 ml-auto flex items-center gap-1 rounded px-3 py-1 text-sm text-white"
                                >
                                  <Trash2 size={14} /> Remove
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
                {intervals.map((_, i) =>
                  errors[`interval-${i}`] ? (
                    <p key={i} className="text-danger mt-1 text-sm">
                      {errors[`interval-${i}`]}
                    </p>
                  ) : null,
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addInterval}
                    className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    <PlusCircle size={14} /> Add Interval
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end px-8 pb-6">
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
