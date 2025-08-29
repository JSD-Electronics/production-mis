"use client";
import React, { useState, useEffect, use } from "react";
import {
  fetchSeatAvailabilityFromCurrentDate
} from "@/lib/api";
import flatpickr from "flatpickr";
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
    <div>
      <div className="mb-4 flex flex-col gap-6 xl:flex-row">
        <div className="w-full xl:w-1/2">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Planing Name
          </label>
          <input
            value= {processName}
            onChange={(e) => setProcessName(e.target.value)}
            type="text"
            placeholder="Planing Name"
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>
        <div className="w-full xl:w-1/2">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Process Type
          </label>
          <select
            value={selectedProcess?.name || ""}
            onChange={(e) => handleProcessType(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
          >
            <option value="" className="text-body dark:text-bodydark">
              Please Select
            </option>
            {process.map((room: any, index: any) => (
              <option
                key={index}
                value={room?.name}
                className="text-body dark:text-bodydark"
              >
                {room?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full xl:w-1/2">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Floor Name
          </label>
          <select
            value={selectedRoom?.floorName || ""}
            onChange={(e) => handleFloorName(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
          >
            <option value="" className="text-body dark:text-bodydark">
              Please Select
            </option>
            {roomPlan.map((room: any, index: any) => (
              <option
                key={index}
                value={room?.floorName}
                className="text-body dark:text-bodydark"
              >
                {room?.floorName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-6 xl:flex-row">
        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Shift
          </label>
          <select
            value={selectedShift?._id || ""}
            onChange={(e) => handleShift(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-strokedark dark:bg-form-input"
          >
            <option value="" className="text-body dark:text-bodydark">
              Please Select
            </option>
            {shifts.map((shift, index) => (
              <option
                key={index}
                value={shift?._id}
                className="text-body dark:text-bodydark"
              >
                {shift?.name} ({shift?.intervals[0].startTime} - {shift?.intervals[shift?.intervals.length - 1].endTime})
              </option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Start Date
            </label>
            <div>
              <SeatAvailabilityDatePicker
                seatAvailability={seatAvailability}
                floorID={floorID}
                setStartDate={setStartDate}
                formatDate={startDate}
                onDateChange={handleDateChange("start")}
              />
            </div>
          </div>
        </div>
        <div className="w-full">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Repeat Count
            </label>
            <div>
              <input
                type="number"
                value={repeatCount}
                onChange={(e) => handleRepeatCount(e.target.value)}
                placeholder="Enter Process Name"
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {selectedProcess && (
        <>
          <div className="dark:bg-gray-800 mt-2 rounded-lg bg-white pb-5">
            <h3 className="text-gray-900 mb-4 text-2xl font-semibold dark:text-white">
              {selectedProcess?.name}
            </h3>
            <div className="grid sm:grid-cols-2">
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Product Name:</strong>{" "}
                {productName}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Shift :</strong>{" "}
                {selectedShift && (
                  <span>
                    {selectedShift?.name} ({selectedShift?.intervals[0].startTime} -{" "}
                    {selectedShift?.intervals[selectedShift?.intervals.length - 1].endTime})
                  </span>
                )}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Break Time :</strong>{" "}
                {selectedShift && (
                  <span>{selectedShift?.totalBreakTime} Minutes</span>
                )}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Order Confirmation No:</strong>{" "}
                {selectedProcess?.orderConfirmationNo}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Process ID:</strong>{" "}
                {selectedProcess?.processID}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Quantity:</strong>{" "}
                {selectedProcess?.quantity}
              </div>

              <div className="text-gray-700 dark:text-gray-300">
                <strong className="font-medium">Shift Days:</strong>{" "}
                {selectedShift &&
                  Object.keys(selectedShift.weekDays)
                    .filter(
                      (day) => day !== "_id" && selectedShift.weekDays[day],
                    )
                    .map((day) => (
                      <span key={day}>
                        {day}
                        {", "}
                      </span>
                    ))}
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                <strong className="font-medium">Description:</strong>{" "}
                {selectedProcess?.descripition}
              </div>
            </div>
          </div>
          {inventoryData && (
            <>
              <div className="dark:bg-gray-800 mt-3 rounded-lg bg-white pb-5">
                <h3 className="text-gray-900 text-md mb-4 font-semibold dark:text-white">
                  Kit
                </h3>
                <div className="grid sm:grid-cols-2">
                  <div className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-medium">Required kits:</strong>{" "}
                    {selectedProcess?.quantity}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-medium">Available kits :</strong>{" "}
                    {inventoryData?.quantity}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-medium">Kits Shortage :</strong>{" "}
                    {inventoryData?.quantity < selectedProcess?.quantity
                      ? Math.abs(
                          selectedProcess?.quantity - inventoryData?.quantity,
                        )
                      : 0}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-medium">Surplus Kits :</strong>{" "}
                    {inventoryData?.quantity > selectedProcess?.quantity
                      ? Math.abs(
                          inventoryData?.quantity - selectedProcess?.quantity,
                        )
                      : 0}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-medium">Issued Kits :</strong>{" "}
                    {inventoryData?.quantity > selectedProcess?.quantity
                      ? Math.abs(
                          selectedProcess?.quantity - inventoryData?.quantity,
                        )
                      : inventoryData?.quantity}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong className="font-medium">Total Kits :</strong>{" "}
                    {inventoryData?.quantity < selectedProcess?.quantity
                      ? 0
                      : inventoryData?.quantity}
                  </div>
                </div>
                {packagingData.length > 0 &&
                  packagingData[0].packagingData.packagingType == "Carton" && (
                    <div className="dark:bg-gray-800 mt-3 rounded-lg bg-white pb-5">
                      <h3 className="text-gray-900 text-md mb-4 font-semibold dark:text-white">
                        Cartons
                      </h3>
                      <div className="grid sm:grid-cols-2">
                        <div className="text-gray-700 dark:text-gray-300 mb-2">
                          <strong className="font-medium">
                            Cartons Required :
                          </strong>{" "}
                          {selectedProcess?.quantity /
                            packagingData[0].packagingData.maxCapacity}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2">
                          <strong className="font-medium">
                            Cartons Available :
                          </strong>{" "}
                          {inventoryData?.cartonQuantity}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2">
                          <strong className="font-medium">
                            Carton Shortage :
                          </strong>{" "}
                          {inventoryData?.cartonQuantity <
                          selectedProcess?.quantity /
                            packagingData[0].packagingData.maxCapacity
                            ? Math.abs(
                                selectedProcess?.quantity /
                                  packagingData[0].packagingData.maxCapacity -
                                  inventoryData?.cartonQuantity,
                              )
                            : 0}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2">
                          <strong className="font-medium">
                            Carton Surplus :
                          </strong>{" "}
                          {inventoryData?.cartonQuantity >
                          selectedProcess?.quantity /
                            packagingData[0].packagingData.maxCapacity
                            ? Math.abs(
                                inventoryData?.cartonQuantity -
                                  selectedProcess?.quantity /
                                    packagingData[0].packagingData.maxCapacity,
                              )
                            : 0}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2">
                          <strong className="font-medium">
                            Cartons Dimension :
                          </strong>{" "}
                          ({packagingData[0].packagingData.cartonWidth} x{" "}
                          {packagingData[0].packagingData.cartonHeight})
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </>
      )}
      <div className="mb-4 mt-2">
        <h3 className="text-gray-900 mb-4 text-2xl font-semibold dark:text-white">
          Shift Summary
        </h3>
        <div className="flex justify-center gap-2">
          {selectedShift?.intervals?.map((interval, index) => (
            <div
              key={index}
              className={`rounded-lg p-2 text-center ${
                interval.breakTime
                  ? "bg-[#fbc0c0] text-danger dark:bg-[#fbc0c0] dark:text-danger"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              }`}
            >
              {interval.breakTime ? (
                <p className="text-sm font-medium">
                  Breaktime: {interval.startTime} - {interval.endTime}
                </p>
              ) : (
                <p className="text-sm font-medium">
                  Interval: {interval.startTime} - {interval.endTime}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="text-right">
        <button
          type="button"
          className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-400"
          onClick={handleCalculation}
        >
          Calculate
        </button>
      </div>
      {/* end component 1 */}
    </div>
  );
};

export default FormComponent;
