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

    return (
      <div
        title={
          seatInfo
            ? seatInfo?.availableSeats === 0
              ? "Fully Reserved"
              : `${seatInfo.availableSeats} seats available`
            : "No data available"
        }
      >
        <span>{day}</span>
      </div>
    );
  };
  const filterDate = (date) => {
    const dateString = date.toISOString().split("T")[0];
    const seatInfo = seatData.find((seat) => seat.date === dateString);

    return !seatInfo || seatInfo?.availableSeats > 0;
  };

  return (
    <div className="datepicker-container">
      <DatePicker
        className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white py-3 pl-10 pr-4 
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
