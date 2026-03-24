"use client";

import React, { useState, useEffect } from "react";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import { viewPlaning } from "../../lib/api";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Layers } from "lucide-react";
import { TableSkeleton } from "@/components/common/Skeletons";

interface ScheduleEvent {
  id: string;
  processName: string;
  startDate: string;
  endDate: string;
  shift: string;
  status: string;
  color?: string; // Optional for UI logic
  planingId?: string;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Helper to format Date object into YYYY-MM-DD local string
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await viewPlaning();
      const sourcePlans =
        data?.plans || data?.Planing || data?.planing || [];

      const mappedEvents: ScheduleEvent[] = sourcePlans.map((item: any) => ({
        id: item._id,
        planingId: item._id,
        processName:
          item.processName ||
          item.processID?.name ||
          item.process?.name ||
          "Unknown Process",
        startDate: item.startDate || item.shiftChangedFromDate || item.createdAt,
        endDate:
          item.estimatedEndDate ||
          item.expectedEndDate ||
          item.endDate ||
          item.startDate ||
          item.shiftChangedFromDate ||
          item.createdAt,
        shift: item.shiftID?.name || item.shiftName || "N/A",
        status: item.approvalStatus || "Pending",
        color: getColorForStatus(item.approvalStatus)
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Failed to load schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const getColorForStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    }
  };

  // Calendar Logic
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month placeholders
    for (let i = 0; i < firstDay; i++) {
      const dayNum = prevMonthDays - firstDay + 1 + i;
      days.push({ day: dayNum, currentMonth: false, date: new Date(year, month - 1, dayNum) });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }

    // Next month placeholders to fill 42 slots (6 rows * 7 cols)
    const totalSlots = 42;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }

    return days;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = generateCalendarDays();

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const weeks = Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, i) =>
    calendarDays.slice(i * 7, i * 7 + 7),
  );


  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Production Calendar" parentName="Dashboard" />

      {/* Calendar Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-l-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="w-[1px] h-6 bg-stroke dark:bg-strokedark"></div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-r-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span> Approved
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Pending
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span> In Progress
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="grid grid-cols-7 bg-slate-50 text-slate-600">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
              <div
                key={idx}
                className="flex h-12 items-center justify-center p-1 text-xs font-semibold uppercase tracking-wide sm:text-sm xl:p-3 border-l border-slate-200 first:border-l-0"
              >
                <span className="hidden lg:block">{day}</span>
                <span className="block lg:hidden">{day}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-200">
            {weeks.map((week, weekIdx) => {
              const weekStart = startOfDay(week[0].date);
              const weekEnd = startOfDay(week[6].date);
              const weekEvents = events.filter((event) => {
                const start = startOfDay(new Date(event.startDate));
                const end = startOfDay(new Date(event.endDate));
                return end >= weekStart && start <= weekEnd;
              });

              return (
                <div key={weekIdx} className="relative grid grid-cols-7">
                  {week.map((dayObj, index) => (
                    <div
                      key={index}
                      className={`relative h-28 border-l border-slate-200 p-2 align-top transition hover:bg-slate-50/70 dark:border-strokedark md:h-32 md:p-2 xl:h-40 ${!dayObj.currentMonth ? "bg-slate-50/60 text-slate-400 dark:bg-boxdark-2" : ""}`}
                    >
                      <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-xs font-semibold ${dayObj.currentMonth ? "text-slate-700 dark:text-white" : "text-slate-400 dark:text-gray-600"}`}>
                        {dayObj.day}
                      </span>
                    </div>
                  ))}

                  <div className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-7 gap-1 px-2">
                    {weekEvents.map((event, idx) => {
                      const start = startOfDay(new Date(event.startDate));
                      const end = startOfDay(new Date(event.endDate));
                      const clampedStart = start < weekStart ? weekStart : start;
                      const clampedEnd = end > weekEnd ? weekEnd : end;
                      const startIndex = week.findIndex((d) => isSameDay(d.date, clampedStart));
                      const endIndex = week.findIndex((d) => isSameDay(d.date, clampedEnd));
                      if (startIndex === -1 || endIndex === -1) return null;
                      return (
                        <button
                          key={`${event.id}-${idx}`}
                          type="button"
                          className={`pointer-events-auto truncate rounded-md border px-2 py-1 text-[11px] font-semibold ${event.color} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] transition`}
                          style={{ gridColumn: `${startIndex + 1} / ${endIndex + 2}` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                        >
                          {event.processName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Process Details</h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded p-1 text-slate-600 hover:text-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div><span className="font-semibold">Process:</span> {selectedEvent.processName}</div>
              <div><span className="font-semibold">Status:</span> {selectedEvent.status}</div>
              <div><span className="font-semibold">Shift:</span> {selectedEvent.shift}</div>
              <div><span className="font-semibold">Start:</span> {new Date(selectedEvent.startDate).toLocaleString()}</div>
              <div><span className="font-semibold">End:</span> {new Date(selectedEvent.endDate).toLocaleString()}</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {selectedEvent.planingId && (
                <a
                  href={`/planing-scheduling/viewPlaning/${selectedEvent.planingId}`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Planing
                </a>
              )}
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;




