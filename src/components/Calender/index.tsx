"use client";

import React, { useState, useEffect } from "react";
import Breadcrumb from "../Breadcrumbs/Breadcrumb";
import { viewPlaning } from "../../lib/api";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Layers } from "lucide-react";

interface ScheduleEvent {
  id: string;
  processName: string;
  startDate: string;
  endDate: string;
  shift: string;
  status: string;
  color?: string; // Optional for UI logic
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Assuming 'data.planing' contains the array of planning items based on API naming conventions.
      // Adjust property access if the structure is different (e.g. data.planningAndScheduling)

      const mappedEvents: ScheduleEvent[] = (data.planing || []).map((item: any) => ({
        id: item._id,
        processName: item.processID?.name || "Unknown Process",
        startDate: item.startDate,
        endDate: item.expectedEndDate,
        shift: item.shiftID?.name || "N/A",
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


  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Production Calendar" parentName="Dashboard" />

      {/* Calendar Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">
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
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
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
        <div className="flex h-96 items-center justify-center rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="w-full max-w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <table className="w-full">
            <thead>
              <tr className="grid grid-cols-7 rounded-t-sm bg-primary text-white">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                  <th key={idx} className="flex h-12 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-4 bg-primary text-white border-l border-primary-dark first:border-l-0">
                    <span className="hidden lg:block">{day}day</span>
                    <span className="block lg:hidden">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="grid grid-cols-7">
                {calendarDays.map((dayObj, index) => {
                  const dateKey = formatDateKey(dayObj.date);
                  const dayEvents = events.filter(event => {
                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);
                    const current = new Date(dateKey);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    current.setHours(0, 0, 0, 0);
                    return current >= start && current <= end;
                  });

                  return (
                    <td
                      key={index}
                      className={`ease relative h-28 cursor-pointer border border-stroke p-2 transition duration-500 hover:bg-gray dark:border-strokedark dark:hover:bg-meta-4 md:h-32 md:p-2 xl:h-40 ${!dayObj.currentMonth ? "bg-gray-50 dark:bg-boxdark-2 text-gray-400" : ""
                        }`}
                    >
                      <span className={`font-medium ${dayObj.currentMonth ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                        {dayObj.day}
                      </span>

                      <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80%] custom-scrollbar">
                        {dayEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className={`group relative rounded border px-2 py-1 text-xs font-semibold ${event.color} transition-all hover:opacity-100`}
                          >
                            <span className="block truncate">{event.processName}</span>
                            <div className="invisible absolute left-0 top-full z-50 mt-1 w-48 flex-col gap-1 rounded-md bg-white p-3 shadow-xl ring-1 ring-black/5 dark:bg-boxdark dark:ring-white/10 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                              <p className="font-bold text-black dark:text-white mb-1">{event.processName}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-300">
                                <Layers size={12} />
                                <span>{event.status}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-300">
                                <Clock size={12} />
                                <span>{event.shift}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-300">
                                <CalendarIcon size={12} />
                                <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Calendar;
