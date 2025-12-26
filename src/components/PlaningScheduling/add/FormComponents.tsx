"use client";
import React, { useState, useEffect, use } from "react";
import { fetchSeatAvailabilityFromCurrentDate } from "@/lib/api";
import flatpickr from "flatpickr";
import { Calendar } from "lucide-react";
import {
  FaBox,
  FaCalendarAlt,
  FaClock,
  FaCogs,
  FaLayerGroup,
  FaClipboardList,
} from "react-icons/fa";
import { MdInventory } from "react-icons/md";
import SeatAvailabilityDatePicker from "@/components/DateTimePicker/SeatAvailabilityDatePicker";

const FormComponent = ({
  shifts,
  process,
  roomPlan,
  calculateTimeDifference,
  handleCalculation,
  setSelectedProduct,
  selectedProcess,
  setSelectedProcess,
  repeatCount,
  setRepeatCount,
  selectedShift,
  setSelectedShift,
  setSelectedRoom,
  selectedRoom,
  startDate,
  setStartDate,
  assignedStages,
  getProduct,
  productName,
  processName,
  setProcessName,
  packagingData,
  inventoryData,
}) => {
  const [floorID, setFloorID] = useState("");
  const [seatAvailability, setSeatAvailability] = useState([]);

  // const [shiftID,setShiftID] = useState("");
  const getSeatAvailabilityFromCurrentDate = async (shiftID: any) => {
    try {
      const response = await fetchSeatAvailabilityFromCurrentDate(
        floorID,
        shiftID,
      );
      const availabilityArray = [response.seatAvailability];
      setSeatAvailability(availabilityArray);
    } catch (error) {
      console.error("Error Fetching Seat Availabilty :", error);
    }
  };
  useEffect(() => {
    flatpickr(".form-datepicker", {
      mode: "single",
      static: true,
      dateFormat: "M j, Y",
      prevArrow:
        '<svg className="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg className="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });
  }, []);
  const handleDateChange = (dateType: any) => (selectedDate: any) => {
    if (dateType === "start") {
      setStartDate(formatDate(selectedDate));
    } else {
      setEndDate(formatDate(selectedDate));
    }
  };
  const formatDate = (date: any) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };
  const handleProcessType = (e: any) => {
    const selected = process.find((value: any) => value.name === e);
    setSelectedProcess(selected);
    getProduct(selected?.selectedProduct);
  };

  const handleFloorName = (e: any) => {
    const selected = roomPlan.find((value: any) => value.floorName === e);
    setFloorID(selected?._id);
    setSelectedRoom(selected);
  };

  const handleShift = (e: any) => {
    const selected = shifts.find((value: any) => value._id === e);
    setSelectedShift(selected);
    calculateTimeDifference(selected);
    getSeatAvailabilityFromCurrentDate(selected._id);
  };
  const handleRepeatCount = (e: any) => {
    const totalSeats = selectedRoom.lines.reduce(
      (total, row) => total + row.seats.length,
      0,
    );
    if (Object.keys(assignedStages).length >= totalSeats) {
      alert(
        "Insufficient seats available to assign all stages. Please adjust the allocation.",
      );
      return;
    }
    setRepeatCount(e);
  };
  const handleProcessName = (e: any) => {
    try {
    } catch (error) {}
  };
  return (
    <div className="flex flex-col gap-6">
      {/* Planning Form */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FaCogs /> Planning Name
          </label>
          <input
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            type="text"
            placeholder="Planning Name"
            className="dark:bg-gray-700 w-full rounded-lg border border-stroke bg-white px-4 py-2 text-black outline-none transition focus:border-primary focus:ring focus:ring-primary/20 dark:text-white"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FaLayerGroup /> Process Type
          </label>
          <select
            value={selectedProcess?.name || ""}
            onChange={(e) => handleProcessType(e.target.value)}
            className="dark:bg-gray-700 w-full rounded-lg border border-stroke bg-white px-4 py-2 text-black outline-none transition focus:border-primary focus:ring focus:ring-primary/20 dark:text-white"
          >
            <option value="">Please Select</option>
            {process.map((room, index) => (
              <option key={index} value={room?.name}>
                {room?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FaClipboardList /> Floor Name
          </label>
          <select
            value={selectedRoom?.floorName || ""}
            onChange={(e) => handleFloorName(e.target.value)}
            className="dark:bg-gray-700 w-full rounded-lg border border-stroke bg-white px-4 py-2 text-black outline-none transition focus:border-primary focus:ring focus:ring-primary/20 dark:text-white"
          >
            <option value="">Please Select</option>
            {roomPlan.map((room, index) => (
              <option key={index} value={room?.floorName}>
                {room?.floorName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shift, Start Date, Repeat Count */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FaClock /> Shift
          </label>
          <select
            value={selectedShift?._id || ""}
            onChange={(e) => handleShift(e.target.value)}
            className="dark:bg-gray-700 w-full rounded-lg border border-stroke bg-white px-4 py-2 text-black outline-none transition focus:border-primary focus:ring focus:ring-primary/20 dark:text-white"
          >
            <option value="">Please Select</option>
            {shifts.map((shift, index) => (
              <option key={index} value={shift?._id}>
                {shift?.name} ({shift?.intervals[0].startTime} -{" "}
                {shift?.intervals[shift?.intervals.length - 1].endTime})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FaCalendarAlt /> Start Date
          </label>
          <div className="relative">
            <Calendar className="text-gray-400 absolute left-3 top-1/2 z-1 h-5 w-5 -translate-y-1/2" />
            <SeatAvailabilityDatePicker
              seatAvailability={seatAvailability}
              floorID={floorID}
              setStartDate={setStartDate}
              formatDate={startDate}
              onDateChange={handleDateChange("start")}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-black dark:text-white">
            <FaBox /> Repeat Count
          </label>
          <input
            type="number"
            value={repeatCount}
            onChange={(e) => handleRepeatCount(e.target.value)}
            placeholder="Enter Repeat Count"
            className="dark:bg-gray-700 w-full rounded-lg border border-stroke bg-white px-4 py-2 text-black outline-none transition focus:border-primary focus:ring focus:ring-primary/20 dark:text-white"
          />
        </div>
      </div>

      {/* Selected Process Details */}
      {selectedProcess && (
        <div className="dark:bg-gray-800 mt-2 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-black dark:text-white">
            <FaCogs /> {selectedProcess?.name}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaBox /> <strong>Product Name:</strong> {productName}
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaClock /> <strong>Shift:</strong>{" "}
              {selectedShift &&
                `${selectedShift?.name} (${selectedShift?.intervals[0].startTime} - ${selectedShift?.intervals[selectedShift?.intervals.length - 1].endTime})`}
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaClock /> <strong>Break Time:</strong>{" "}
              {selectedShift?.totalBreakTime} Minutes
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaClipboardList /> <strong>Order Confirmation No:</strong>{" "}
              {selectedProcess?.orderConfirmationNo}
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaCogs /> <strong>Process ID:</strong>{" "}
              {selectedProcess?.processID}
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaBox /> <strong>Quantity:</strong> {selectedProcess?.quantity}
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaCalendarAlt /> <strong>Shift Days:</strong>{" "}
              {selectedShift &&
                Object.keys(selectedShift.weekDays)
                  .filter((day) => day !== "_id" && selectedShift.weekDays[day])
                  .join(", ")}
            </div>
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FaClipboardList /> <strong>Description:</strong>{" "}
              {selectedProcess?.descripition}
            </div>
          </div>
        </div>
      )}

      {/* Inventory & Kits */}
      {inventoryData && (
        <div className="mt-2 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Kit Section */}
          <div className="dark:bg-gray-800 rounded-lg bg-white p-6 shadow-md">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <MdInventory /> Kit
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <strong>Required Kits:</strong> {selectedProcess?.quantity}
              </div>
              <div>
                <strong>Available Kits:</strong> {inventoryData?.quantity}
              </div>
              <div>
                <strong>Shortage:</strong>{" "}
                {Math.max(
                  selectedProcess?.quantity - inventoryData?.quantity,
                  0,
                )}
              </div>
              <div>
                <strong>Surplus:</strong>{" "}
                {Math.max(
                  inventoryData?.quantity - selectedProcess?.quantity,
                  0,
                )}
              </div>
              <div>
                <strong>Issued Kits:</strong>{" "}
                {Math.min(selectedProcess?.quantity, inventoryData?.quantity)}
              </div>
            </div>
          </div>

          {/* Carton Section */}
          {packagingData.length > 0 &&
            packagingData[0].packagingData.packagingType === "Carton" && (
              <div className="dark:bg-gray-800 rounded-lg bg-white p-6 shadow-md">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                  <FaBox /> Cartons
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <strong>Required Cartons:</strong>{" "}
                    {Math.ceil(
                      selectedProcess?.quantity /
                        packagingData[0].packagingData.maxCapacity,
                    )}
                  </div>
                  <div>
                    <strong>Available Cartons:</strong>{" "}
                    {inventoryData?.cartonQuantity}
                  </div>
                  <div>
                    <strong>Shortage:</strong>{" "}
                    {inventoryData?.cartonQuantity <
                    selectedProcess?.quantity /
                      packagingData[0].packagingData.maxCapacity
                      ? Math.abs(
                          Math.ceil(
                            selectedProcess?.quantity /
                              packagingData[0].packagingData.maxCapacity,
                          ) - inventoryData?.cartonQuantity,
                        )
                      : 0}
                  </div>
                  <div>
                    <strong>Surplus:</strong>{" "}
                    {inventoryData?.cartonQuantity >
                    selectedProcess?.quantity /
                      packagingData[0].packagingData.maxCapacity
                      ? Math.abs(
                          inventoryData?.cartonQuantity -
                            Math.ceil(
                              selectedProcess?.quantity /
                                packagingData[0].packagingData.maxCapacity,
                            ),
                        )
                      : 0}
                  </div>
                  <div>
                    <strong>Carton Dimensions:</strong> (
                    {packagingData[0].packagingData.cartonWidth} x{" "}
                    {packagingData[0].packagingData.cartonHeight})
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
      {/* Calculate Button */}
      <div className="mt-4 flex justify-end text-right">
        <button
          type="button"
          onClick={handleCalculation}
          className="flex w-44 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-blue-500"
        >
          <FaCogs /> Calculate
        </button>
      </div>
    </div>
  );
};

export default FormComponent;
