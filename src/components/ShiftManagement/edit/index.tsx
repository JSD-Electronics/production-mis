"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { updateShift, getShift } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckboxOne from "@/components/Checkboxes/CheckboxOne";
import { Plus, Trash2 } from "lucide-react";

const EditShiftManagement = () => {
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
  const [errors, setErrors] = useState<{ name?: string; intervals?: string }>({});

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getShiftByID(id);
  }, []);

  const getShiftByID = async (id: string) => {
    try {
      let result = await getShift(id);
      setName(result.name);
      setDescription(result.descripition);
      setIntervals(result.intervals || []);
      setWeekDays(result.weekDays || {});
    } catch (error) {
      toast.error("Failed to load shift details.");
    }
  };

  const calculateTimeDifference = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  };

  const handleCheckboxChange = (day: string) =>
    setWeekDays((prev) => ({ ...prev, [day]: !prev[day] }));

  const handleCheckboxBreakTime = (index: number, value: boolean) => {
    const updated = [...intervals];
    updated[index].breakTime = value;
    setIntervals(updated);
  };

  const handleIntervalChange = (index: number, field: string, value: string) => {
    const updated = [...intervals];
    updated[index][field] = value;

    const start = updated[index].startTime;
    const end = updated[index].endTime;

    if (start && end && start >= end) {
      toast.error("Start time must be before End time");
      return;
    }

    if (index > 0) {
      const prevEnd = updated[index - 1].endTime;
      if (prevEnd && start < prevEnd) {
        toast.error("Intervals must not overlap");
        return;
      }
    }

    setIntervals(updated);
  };

  const addInterval = () =>
    setIntervals([...intervals, { startTime: "00:00", endTime: "00:00", breakTime: false }]);

  const removeInterval = (index: number) =>
    setIntervals(intervals.filter((_, i) => i !== index));

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = [...intervals];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setIntervals(reordered);
  };

  const validateForm = () => {
    let formErrors: typeof errors = {};
    if (!name.trim()) formErrors.name = "Shift name is required";
    if (intervals.length === 0) formErrors.intervals = "At least one interval is required";
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();

    try {
      const sorted = [...intervals].sort((a, b) => {
        const [aH, aM] = a.startTime.split(":").map(Number);
        const [bH, bM] = b.startTime.split(":").map(Number);
        return aH * 60 + aM - (bH * 60 + bM);
      });

      let shiftStart = sorted[0].startTime;
      for (let i = 0; i < sorted.length; i++) {
        if (!sorted[i].breakTime) {
          shiftStart = sorted[i].startTime;
          break;
        } else shiftStart = sorted[i].endTime;
      }

      let shiftEnd = sorted[sorted.length - 1].endTime;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (!sorted[i].breakTime) {
          shiftEnd = sorted[i].endTime;
          break;
        }
      }

      const totalBreakTime = sorted
        .filter((i) => i.breakTime)
        .reduce((t, b) => t + calculateTimeDifference(b.startTime, b.endTime), 0);

      const formData = {
        name,
        startTime: shiftStart,
        endTime: shiftEnd,
        totalBreakTime,
        intervals: sorted,
        descripition: description,
        weekDays,
      };

      await updateShift(formData, id);
      toast.success("Shift updated successfully!");
    } catch (error) {
      toast.error("Failed to update shift.");
    }
  };

  return (
    <>
      <Breadcrumb parentName="Shift Management" pageName="Edit Shift" />
      <div className="grid gap-9">
        <ToastContainer position="top-center" />

        <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">Edit Shift</h3>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Shift Name */}
            <div className="grid gap-2 px-8 pt-4">
              <label className="text-sm font-medium text-black dark:text-white">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Shift Name"
                className="w-full rounded-lg border px-5 py-3 dark:bg-form-input dark:text-white"
              />
              {errors.name && <p className="text-sm text-danger">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="px-8 pt-4">
              <label className="text-sm font-medium text-black dark:text-white">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full rounded-lg border px-5 py-3 dark:bg-form-input dark:text-white"
              />
            </div>

            {/* Weekdays */}
            <div className="px-8 pt-4">
              <label className="text-sm font-medium text-black dark:text-white">Days of Week</label>
            </div>
            <div className="grid gap-2 px-8 pt-2 sm:grid-cols-12">
              {Object.keys(weekDays)
                .filter((d) => d !== "_id")
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

            {/* Intervals */}
            <div className="px-8 pt-4">
              <h3 className="mb-2 font-medium text-black dark:text-white">Shift Intervals</h3>
              {errors.intervals && <p className="text-sm text-danger">{errors.intervals}</p>}

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="intervals">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {intervals.map((interval, index) => (
                        <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-3 rounded-lg border p-3 ${
                                snapshot.isDragging
                                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900"
                                  : "border-gray-200 dark:border-gray-600 dark:bg-gray-800"
                              }`}
                            >
                              <input
                                type="time"
                                value={interval.startTime}
                                onChange={(e) => handleIntervalChange(index, "startTime", e.target.value)}
                                className="rounded border px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <span className="text-gray-500 dark:text-gray-300">to</span>
                              <input
                                type="time"
                                value={interval.endTime}
                                onChange={(e) => handleIntervalChange(index, "endTime", e.target.value)}
                                className="rounded border px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <label className="ml-4 flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                                <input
                                  type="checkbox"
                                  checked={interval.breakTime || false}
                                  onChange={(e) => handleCheckboxBreakTime(index, e.target.checked)}
                                  className="accent-blue-500"
                                />
                                Break
                              </label>

                              <button
                                type="button"
                                onClick={() => removeInterval(index)}
                                className="ml-auto rounded bg-red-600 p-2 text-white hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
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

              {/* Add Interval */}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={addInterval}
                  className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" /> Add Interval
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end px-8 py-6">
              <button
                type="submit"
                className="rounded-md bg-green-700 px-6 py-2 text-white hover:bg-green-800"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditShiftManagement;
