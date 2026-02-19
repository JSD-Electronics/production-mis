"use client";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./custom-datepicker.css";

const SeatAvailabilityDatePicker = ({
  seatAvailability,
  floorID,
  setStartDate,
  formatDate,
  onDateChange,
  selectedShift,
  holidays,
}) => {
  const [seatData, setSeatData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [seatAvailability1, setSeatAvailability] = useState(seatAvailability);
  const today = new Date();

  const totalSeats = 10;

  React.useEffect(() => {
    setSeatAvailability(seatAvailability);
    updateSeatData();
  }, [seatAvailability]);

  const fetchSeatAvailability = async (dateString) => {
    for (const availability of seatAvailability) {
      if (availability[dateString] !== undefined) {
        return availability[dateString];
      }
    }
    return totalSeats;
  };

  const updateSeatData = async () => {
    const updatedSeatData = [];
    const currentDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dateString = currentDate.toISOString().split("T")[0];
      const availableSeats = await fetchSeatAvailability(dateString);
      updatedSeatData.push({
        date: dateString,
        availableSeats,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSeatData(updatedSeatData);
  };

  const dayClassName = (date) => {
    const dateString = date.toISOString().split("T")[0];
    const seatInfo = seatData.find((seat) => seat.date === dateString);

    // Check if it's a day-off
    if (selectedShift && selectedShift.weekDays) {
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayName = dayNames[date.getDay()];
      if (!selectedShift.weekDays[dayName]) {
        return "offday-date";
      }
    }


    // Check if it's a holiday
    if (holidays && holidays.length > 0) {
      const isHoliday = holidays.some((h) => {
        const hDate = new Date(h.holidayDate);
        return (
          hDate.getFullYear() === date.getFullYear() &&
          hDate.getMonth() === date.getMonth() &&
          hDate.getDate() === date.getDate()
        );
      });
      if (isHoliday) {
        return "holiday-date";
      }
    }

    if (seatInfo) {
      return seatInfo?.availableSeats === 0
        ? "reserved-date"
        : "available-date";
    }
    return "";
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setStartDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  const renderDayContents = (day, date) => {
    const dateString = date.toISOString().split("T")[0];
    const seatInfo = seatData.find((seat) => seat.date === dateString);

    let tooltip = "No data available";
    if (selectedShift && selectedShift.weekDays) {
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayName = dayNames[date.getDay()];
      if (!selectedShift.weekDays[dayName]) {
        tooltip = "Day Off";
      }
    }

    if (holidays && holidays.length > 0) {
      const holiday = holidays.find((h) => {
        const hDate = new Date(h.holidayDate);
        return (
          hDate.getFullYear() === date.getFullYear() &&
          hDate.getMonth() === date.getMonth() &&
          hDate.getDate() === date.getDate()
        );
      });
      if (holiday) {
        tooltip = `Holiday: ${holiday.holidayName}`;
      }
    }

    if (seatInfo && tooltip === "No data available") {
      tooltip =
        seatInfo?.availableSeats === 0
          ? "Fully Reserved"
          : `${seatInfo.availableSeats} seats available`;
    }

    return (
      <div title={tooltip}>
        <span>{day}</span>
      </div>
    );
  };

  const filterDate = (date) => {
    const dateString = date.toISOString().split("T")[0];
    const seatInfo = seatData.find((seat) => seat.date === dateString);

    // 1. Seat availability check
    if (seatInfo && seatInfo.availableSeats === 0) return false;

    // 2. Shift Day-off check
    if (selectedShift && selectedShift.weekDays) {
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayName = dayNames[date.getDay()];
      if (!selectedShift.weekDays[dayName]) return false;
    }

    // 3. Holiday check
    if (holidays && holidays.length > 0) {
      const isHoliday = holidays.some((h) => {
        const hDate = new Date(h.holidayDate);
        return (
          hDate.getFullYear() === date.getFullYear() &&
          hDate.getMonth() === date.getMonth() &&
          hDate.getDate() === date.getDate()
        );
      });
      if (isHoliday) return false;
    }

    return true;
  };

  return (
    <div className="datepicker-container">
      <DatePicker
        className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-lg border bg-white py-1 text-[11px] pl-10 pr-4 
             shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 
             dark:text-white"
        selected={selectedDate}
        onChange={handleDateChange}
        minDate={today}
        dayClassName={dayClassName}
        renderDayContents={renderDayContents}
        filterDate={filterDate}
        value={formatDate}
      />
    </div>
  );
};


export default SeatAvailabilityDatePicker;
