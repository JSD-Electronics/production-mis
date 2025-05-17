import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateTimePicker = ({ formatDate = "", onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (formatDate) {
      const [datePart, timePart] = formatDate.split(" ");
      const [day, month, year] = datePart.split("/");
      const [hours, minutes, seconds] = timePart.split(":");
      const parsedDate = new Date(
        `20${year}`,
        month - 1,
        day,
        hours,
        minutes,
        seconds,
      );
      if (!isNaN(parsedDate)) {
        setSelectedDate(parsedDate);
      }
    }
  }, [formatDate]);

  const handleChange = (date) => {
    setSelectedDate(date);
    onDateChange(date);
  };

  return (
    <div className="grid w-full max-w-md">
      <DatePicker 
        selected={selectedDate}
        onChange={handleChange}
        showTimeSelect
        dateFormat="Pp"
        className="border-gray-300 w-full rounded-md border p-2 transition duration-150 ease-in-out focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        id="datetime-picker"
        placeholderText="Click to select a date"
        isClearable
      />
    </div>
  );
};

export default DateTimePicker;
