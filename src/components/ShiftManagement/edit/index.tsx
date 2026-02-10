"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  FileText,
  Plus,
  Trash2,
  Save,
  Coffee,
  GripVertical,
  Info,
  AlertCircle
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "react-beautiful-dnd";
import { ToastContainer, toast } from "react-toastify";
import { updateShift, getShift } from "../../../lib/api";

import "react-toastify/dist/ReactToastify.css";

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
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    if (id) getShiftByID(id);
  }, []);

  const getShiftByID = async (id: string) => {
    try {
      setLoading(true);
      const result = await getShift(id);
      setName(result.name || "");
      // Keep 'descripition' if that's what the API uses
      setDescription(result.descripition || "");
      setIntervals(result.intervals || []);
      setWeekDays(result.weekDays || {
        sun: false, mon: false, tue: false, wed: false, thu: false, fri: false, sat: false
      });
    } catch (error) {
      toast.error("Failed to load shift details.");
    } finally {
      setLoading(false);
    }
  };

  // Dragging handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(intervals);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setIntervals(reordered);
  };

  // Handle week day toggle
  const handleCheckboxChange = (day: string) => {
    setWeekDays((prev: any) => ({
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
          newErrors[`interval-${i}`] = "Start time must be earlier than end time";
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix form errors before submitting");
      return;
    }

    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();

    try {
      // Sort intervals
      const sortedIntervals = [...intervals].sort((a, b) => {
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

      const totalBreakTime = sortedIntervals
        .filter((interval) => interval.breakTime)
        .reduce(
          (total, br) => total + calculateTimeDifference(br.startTime, br.endTime),
          0,
        );

      const formData = {
        name,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        totalBreakTime,
        intervals: sortedIntervals,
        descripition: description, // Match original API field name
        weekDays,
      };

      await updateShift(formData, id);
      toast.success("Shift updated successfully!");

      setTimeout(() => {
        window.location.href = "/shift-management/view";
      }, 1500);
    } catch (err) {
      console.error("Error updating shift:", err);
      toast.error("Failed to update shift. Please try again.");
    }
  };

  // Interval handlers
  const handleIntervalChange = (index: number, field: string, value: string) => {
    const updated = [...intervals];
    (updated[index] as any)[field] = value;
    setIntervals(updated);
  };

  const handleCheckboxBreakTime = (index: number, field: string, value: boolean) => {
    const updated = [...intervals];
    (updated[index] as any)[field] = value;
    setIntervals(updated);
  };

  const removeInterval = (index: number) => {
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const addInterval = () => {
    const lastEnd = intervals.length > 0 ? intervals[intervals.length - 1].endTime : "08:00";
    setIntervals([
      ...intervals,
      { startTime: lastEnd, endTime: lastEnd, breakTime: false },
    ]);
  };

  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Edit Shift Plan</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Modify operational hours, work days, and break intervals.</p>
        </div>
        <button
          onClick={handleSubmit}
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
        >
          <Save className="h-5 w-5" />
          Update Shift
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-12 space-y-8">
          {/* Core Configuration Card */}
          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-boxdark dark:ring-strokedark">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Info size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Shift Configuration</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Core identity and schedule</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Shift Name</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Day Shift A"
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>
                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleCheckboxChange(day)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black transition-all ${(weekDays as any)[day]
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-white/5"
                        }`}
                      title={day.charAt(0).toUpperCase() + day.slice(1)}
                    >
                      {day.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
                {errors.weekDays && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight ml-1">{errors.weekDays}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Shift Objectives / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the primary goals or personnel requirements for this shift..."
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/50 py-3 px-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                />
                {errors.description && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight ml-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Intervals & Timeline Card */}
          <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-gray-100 dark:bg-boxdark dark:ring-strokedark">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Timeline & Breaks</h2>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Chronological workspace logic</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addInterval}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-600 transition-all hover:bg-blue-600 hover:text-white shadow-sm"
              >
                <Plus size={14} />
                Add Segment
              </button>
            </div>

            {errors.intervals && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                <AlertCircle size={14} className="mr-2 inline" /> {errors.intervals}
              </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="intervals">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {intervals.map((interval, index) => (
                      <Draggable
                        key={`interval-${index}`}
                        draggableId={`interval-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative flex flex-col gap-4 rounded-2xl border-2 p-5 transition-all md:flex-row md:items-center ${snapshot.isDragging
                                ? "border-primary bg-white shadow-2xl scale-[1.02] z-50"
                                : interval.breakTime
                                  ? "border-amber-100 bg-amber-50/30 dark:border-amber-900/20 dark:bg-amber-900/5"
                                  : "border-gray-50 bg-gray-50/30 dark:border-strokedark dark:bg-white/5"
                              }`}
                          >
                            <div {...provided.dragHandleProps} className="hidden cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 md:block">
                              <GripVertical size={20} />
                            </div>

                            <div className="flex flex-1 items-center gap-4">
                              <div className="flex flex-1 flex-col gap-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                                <input
                                  type="time"
                                  value={interval.startTime}
                                  onChange={(e) => handleIntervalChange(index, "startTime", e.target.value)}
                                  className="w-full rounded-xl border-2 border-transparent bg-white py-2 px-3 text-sm font-bold shadow-sm outline-none transition-all focus:border-primary dark:bg-boxdark dark:text-white"
                                />
                              </div>
                              <div className="mt-5 text-gray-300">—</div>
                              <div className="flex flex-1 flex-col gap-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">End Time</label>
                                <input
                                  type="time"
                                  value={interval.endTime}
                                  onChange={(e) => handleIntervalChange(index, "endTime", e.target.value)}
                                  className="w-full rounded-xl border-2 border-transparent bg-white py-2 px-3 text-sm font-bold shadow-sm outline-none transition-all focus:border-primary dark:bg-boxdark dark:text-white"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 md:justify-end">
                              <button
                                type="button"
                                onClick={() => handleCheckboxBreakTime(index, "breakTime", !interval.breakTime)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${interval.breakTime
                                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                                    : "bg-white text-gray-400 ring-1 ring-gray-100 dark:bg-boxdark dark:ring-strokedark"
                                  }`}
                              >
                                <Coffee size={14} />
                                {interval.breakTime ? "Break Active" : "Work Period"}
                              </button>

                              <button
                                type="button"
                                onClick={() => removeInterval(index)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white dark:bg-rose-900/20"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {errors[`interval-${index}`] && (
                              <div className="absolute -bottom-2 right-6 rounded bg-rose-500 px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-tighter">
                                {errors[`interval-${index}`]}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EditShiftManagement;
