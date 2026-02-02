"use client";
import React, { useState, useEffect, use } from "react";
import { viewRoom, getProductById, viewProcess, viewShift } from "@/lib/api";

import { Calendar, Clock, Coffee } from "lucide-react";
import {
  FaBox,
  FaCalendarAlt,
  FaClock,
  FaCogs,
  FaLayerGroup,
  FaClipboardList,
} from "react-icons/fa";
import flatpickr from "flatpickr";
import { MdInventory } from "react-icons/md";
import DateTimePicker from "@/components/DateTimePicker/dateTimePicker";
import SeatAvailabilityDatePicker from "@/components/DateTimePicker/SeatAvailabilityDatePicker";
import { fetchSeatAvailabilityFromCurrentDate } from "@/lib/api";
import Modal from "@/components/Modal/page";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import ConfirmationPopup from "@/components/Confirmation/page";
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
  productName,
  setProductName,
  formatDate,
  setChangeShiftTime,
  changeShiftTime,
  startTime,
  endTime,
  shiftChangedFromDate,
  setStartTime,
  setEndTime,
  setShiftChangedFromDate,
  handleConfirmationShiftTimeSubmit,
  processName,
  setProcessName,
  isConfirmShiftTime,
  setIsConfirmShiftTime,
  packagingData,
  inventoryData,
}) => {
  const [floorID, setFloorID] = useState("");
  const [seatAvailability, setSeatAvailability] = useState([]);
  const [isEditShiftTime, setIsEditShiftTime] = useState(false);
  const closeEditShiftTime = () => setIsEditShiftTime(false);
  const [isConfirmShiftTimePopup, setConfirmShiftTimePopup] = useState(false);

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
  const getSeatAvailabilityFromCurrentDate = async (shiftID: any) => {
    try {
      let ID = floorID == "" ? selectedRoom?._id : floorID;
      const response = await fetchSeatAvailabilityFromCurrentDate(ID, shiftID);
      const availabilityArray = [response.seatAvailability];
      setSeatAvailability(availabilityArray);
    } catch (error) {
      console.error("Error Fetching Seat Availabilty :", error);
    }
  };
  const handleDateChange = (dateType) => (selectedDate) => {
    if (dateType === "start") {
      setStartDate(formatDate(selectedDate));
    } else {
      setEndDate(formatDate(selectedDate));
    }
  };
  const handleProcessType = (e: any) => {
    const selected = process.find((value) => value.name === e);
    setSelectedProcess(selected);
    getProduct(selected?.selectedProduct);
  };

  const handleFloorName = (e: any) => {
    const selected = roomPlan.find((value) => value.floorName === e);
    setFloorID(selected?._id);
    setSelectedRoom(selected);
  };

  const getProduct = async (id: any) => {
    try {
      let result = await getProductById(id);
      setProductName(result.name);
      setSelectedProduct(result);
    } catch (error) {
      
    }
  };
  const handleShift = (e: any) => {
    const selected = shifts.find((value) => value._id === e);
    setSelectedShift(selected);
    calculateTimeDifference(selected);
    getSeatAvailabilityFromCurrentDate(selected._id);
  };
  const handlesubmitDowntime = () => {
    setChangeShiftTime({
      startTime,
      endTime,
      shiftChangedFromDate,
    });
    setConfirmShiftTimePopup(true);
    setIsEditShiftTime(false);
    setIsConfirmShiftTime(true);
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

  return (
    // replace with actual import paths
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
        <div className="dark:bg-gray-800 mt-2 border rounded-lg bg-white p-6 shadow-md">
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
          <div className="dark:bg-gray-800 border rounded-lg bg-white p-6 shadow-md">
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
      <div className="dark:bg-gray-800 mt-4 border rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2 text-xl font-semibold           dark:text-white">
          <Clock className="h-5 w-5" /> Shift Summary
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {selectedShift?.intervals?.map((interval: any, index: any) => (
            <div
              key={index}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow transition ${interval.breakTime ? "text-red-700 dark:text-red-300 bg-[#fbc0c0] dark:bg-[#fbc0c0]" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"}`}
            >
              {interval.breakTime ? (
                <Coffee className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>
                {interval.breakTime
                  ? `Break: ${interval.startTime} - ${interval.endTime}`
                  : `${interval.startTime} - ${interval.endTime}`}
              </span>
            </div>
          ))}
        </div>
      </div>
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
    // <div className="flex flex-col gap-6">
    //   {/* Confirmation Popup */}
    //   {isConfirmShiftTimePopup && (
    //     <ConfirmationPopup
    //       message="Are you sure you want to change the Shift Time?"
    //       onConfirm={() => {
    //         handleConfirmationShiftTimeSubmit();
    //         setConfirmShiftTimePopup(false);
    //       }}
    //       onCancel={() => setConfirmShiftTimePopup(false)}
    //     />

    //   )}

    //   <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
    //     {/* Process Details Card */}
    //     <div className="dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 rounded-2xl border bg-white shadow-lg">
    //       {/* Header */}
    //       <div className="border-gray-200 dark:border-gray-700 flex items-center gap-2 border-b px-6 py-4">
    //         <ClipboardList className="h-5 w-5 text-primary" />
    //         <h2 className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
    //           Process Details
    //         </h2>
    //       </div>

    //       {/* Form Fields */}
    //       <div className="space-y-8 p-6">
    //         {/* First Row */}
    //         <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    //           {/* Planning Name */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Planning Name
    //             </label>
    //             <div className="relative">
    //               <ClipboardList className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <input
    //                 value={processName}
    //                 onChange={(e) => setProcessName(e.target.value)}
    //                 type="text"
    //                 placeholder="Enter Planning Name"
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               />
    //             </div>
    //           </div>

    //           {/* Process Type */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Process Type
    //             </label>
    //             <div className="relative">
    //               <Layers className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <select
    //                 value={selectedProcess?.name || ""}
    //                 onChange={(e) => handleProcessType(e.target.value)}
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               >
    //                 <option value="">Please Select</option>
    //                 {process.map((room, index) => (
    //                   <option key={index} value={room?.name}>
    //                     {room?.name}
    //                   </option>
    //                 ))}
    //               </select>
    //             </div>
    //           </div>

    //           {/* Floor Name */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Floor Name
    //             </label>
    //             <div className="relative">
    //               <Building2 className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <select
    //                 value={selectedRoom?.floorName || ""}
    //                 onChange={(e) => handleFloorName(e.target.value)}
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               >
    //                 <option value="">Please Select</option>
    //                 {roomPlan.map((room, index) => (
    //                   <option key={index} value={room.floorName}>
    //                     {room.floorName}
    //                   </option>
    //                 ))}
    //               </select>
    //             </div>
    //           </div>
    //         </div>

    //         {/* Second Row */}
    //         <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    //           {/* Shift */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Shift
    //             </label>
    //             <div className="relative">
    //               <Clock className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <select
    //                 value={selectedShift?._id || ""}
    //                 onChange={(e) => handleShift(e.target.value)}
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               >
    //                 <option value="">Please Select</option>
    //                 {shifts.map((shift: any, index: any) => (
    //                   <option key={index} value={shift?._id}>
    //                     {shift?.name} ({shift?.startTime} - {shift?.endTime})
    //                   </option>
    //                 ))}
    //               </select>
    //             </div>
    //           </div>

    //           {/* Start Date */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Start Date
    //             </label>
    //             <div className="relative">
    //               <Calendar className="text-gray-400 absolute z-1 left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
    //               <SeatAvailabilityDatePicker
    //                 seatAvailability={seatAvailability}
    //                 floorID={floorID}
    //                 setStartDate={setStartDate}
    //                 formatDate={startDate}
    //                 onDateChange={handleDateChange("start")}
    //               />
    //             </div>
    //           </div>

    //           {/* Repeat Count */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Repeat Count
    //             </label>
    //             <div className="relative">
    //               <Repeat className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <input
    //                 type="number"
    //                 value={repeatCount}
    //                 onChange={(e) => setRepeatCount(e.target.value)}
    //                 placeholder="Enter Repeat Count"
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               />
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Process Info & Edit Shift */}
    //     {selectedProcess && (
    //       <div className="dark:bg-gray-800 mt-2 space-y-4 rounded-lg bg-white p-4 shadow">
    //         <div className="flex items-center justify-between">
    //           <h3 className="text-gray-900 text-xl font-semibold dark:text-white">
    //             {selectedProcess?.name}
    //           </h3>
    //           <button
    //             type="button"
    //             onClick={() => setIsEditShiftTime(true)}
    //             className="border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
    //           >
    //             <Edit className="text-gray-500 dark:text-gray-300 h-3.5 w-3.5" />{" "}
    //             Edit Shift
    //           </button>
    //         </div>
    //         {/* Edit Shift Modal */}
    //         <Modal
    //           isOpen={isEditShiftTime}
    //           onSubmit={handlesubmitDowntime}
    //           onClose={closeEditShiftTime}
    //           title="Edit Shift"
    //         >
    //           <div className="grid grid-cols-1">
    //             <DatePickerOne
    //               label="From Date"
    //               value={shiftChangedFromDate}
    //               setValue={setShiftChangedFromDate}
    //             />
    //           </div>
    //           <div className="grid grid-cols-2 gap-4 pt-5">
    //             {/* Start Time */}
    //             <div>
    //               <label className="mb-1 block text-xs font-medium text-black dark:text-white">
    //                 Start Time:
    //               </label>
    //               <input
    //                 type="time"
    //                 value={startTime}
    //                 onChange={(e) => setStartTime(e.target.value)}
    //                 className="border-gray-300 bg-gray-50 text-gray-900 dark:border-gray-600 dark:bg-gray-700 block w-full rounded-lg
    //                         border p-2 text-xs focus:border-primary
    //                         focus:ring-primary dark:text-white"
    //                 required
    //               />
    //             </div>
    //             {/* End Time */}
    //             <div>
    //               <label className="mb-1 block text-xs font-medium text-black dark:text-white">
    //                 End Time:
    //               </label>
    //               <input
    //                 type="time"
    //                 value={endTime}
    //                 onChange={(e) => setEndTime(e.target.value)}
    //                 className="border-gray-300 bg-gray-50 text-gray-900 dark:border-gray-600 dark:bg-gray-700 block w-full rounded-lg
    //                         border p-2 text-xs focus:border-primary
    //                         focus:ring-primary dark:text-white"
    //                 required
    //               />
    //             </div>
    //           </div>
    //         </Modal>
    //         {/* Grid Details */}
    // <div className="grid gap-2 text-sm sm:grid-cols-3">
    //   <div>
    //     <strong>Product:</strong> {productName}
    //   </div>
    //   <div>
    //     <strong>Shift:</strong>{" "}
    //     {selectedShift &&
    //       `${selectedShift?.name} (${selectedShift?.intervals[0]?.startTime} - ${selectedShift?.intervals[selectedShift?.intervals.length - 1]?.endTime})`}
    //   </div>
    //   <div>
    //     <strong>Break:</strong> {selectedShift?.totalBreakTime} min
    //   </div>
    //   <div>
    //     <strong>Order No:</strong>{" "}
    //     {selectedProcess?.orderConfirmationNo}
    //   </div>
    //   <div>
    //     <strong>Process ID:</strong> {selectedProcess?.processID}
    //   </div>
    //   <div>
    //     <strong>Qty:</strong> {selectedProcess?.quantity}
    //   </div>
    //   <div className="col-span-2">
    //     <strong>Days:</strong>{" "}
    //     {selectedShift &&
    //       Object.keys(selectedShift.weekDays)
    //         .filter(
    //           (day) => day !== "_id" && selectedShift.weekDays[day],
    //         )
    //         .map((day) => <span key={day}>{day}, </span>)}
    //   </div>
    //   <div className="col-span-3">
    //     <strong>Description:</strong> {selectedProcess?.descripition}
    //   </div>
    // </div>
    // </div>
    //     )}

    //     {/* Inventory & Cartons */}
    //     {inventoryData && (
    //       <div className="mt-2 grid grid-cols-1 gap-4 xl:grid-cols-2">
    //         {/* Kit */}
    //         <div className="dark:bg-gray-800 rounded-lg bg-white p-4 text-sm shadow">
    //           <h3 className="text-gray-900 mb-2 flex items-center gap-2 font-semibold dark:text-white">
    //             <Package className="h-4 w-4 text-primary" /> Kit
    //           </h3>
    //           <div className="grid gap-2 sm:grid-cols-4">
    //             <div>
    //               <strong>Required:</strong> {selectedProcess?.quantity}
    //             </div>
    //             <div>
    //               <strong>Available:</strong> {inventoryData?.quantity}
    //             </div>
    //             <div>
    //               <strong>Shortage:</strong>{" "}
    //               {Math.max(
    //                 selectedProcess?.quantity - inventoryData?.quantity,
    //                 0,
    //               )}
    //             </div>
    //             <div>
    //               <strong>Surplus:</strong>{" "}
    //               {Math.max(
    //                 inventoryData?.quantity - selectedProcess?.quantity,
    //                 0,
    //               )}
    //             </div>
    //           </div>
    //         </div>

    //         {/* Cartons */}
    //         {packagingData.length > 0 &&
    //           packagingData[0].packagingData.packagingType === "Carton" && (
    //             <div className="dark:bg-gray-800 rounded-lg bg-white p-4 text-sm shadow">
    //               <h3 className="text-gray-900 mb-2 flex items-center gap-2 font-semibold dark:text-white">
    //                 <Box className="h-4 w-4 text-primary" /> Cartons
    //               </h3>
    //               <div className="grid gap-2 sm:grid-cols-3">
    //                 <div>
    //                   <strong>Required:</strong>{" "}
    //                   {Math.ceil(
    //                     selectedProcess?.quantity /
    //                       packagingData[0].packagingData.maxCapacity,
    //                   )}
    //                 </div>
    //                 <div>
    //                   <strong>Available:</strong>{" "}
    //                   {inventoryData?.cartonQuantity}
    //                 </div>
    //                 <div>
    //                   <strong>Shortage:</strong>{" "}
    //                   {Math.max(
    //                     selectedProcess?.quantity /
    //                       packagingData[0].packagingData.maxCapacity -
    //                       inventoryData?.cartonQuantity,
    //                     0,
    //                   )}
    //                 </div>
    //                 <div>
    //                   <strong>Surplus:</strong>{" "}
    //                   {Math.max(
    //                     inventoryData?.cartonQuantity -
    //                       selectedProcess?.quantity /
    //                         packagingData[0].packagingData.maxCapacity,
    //                     0,
    //                   )}
    //                 </div>
    //                 <div className="col-span-3">
    //                   <strong>Dimension:</strong>{" "}
    //                   {packagingData[0].packagingData.cartonWidth} Ã—{" "}
    //                   {packagingData[0].packagingData.cartonHeight}
    //                 </div>
    //               </div>
    //             </div>
    //           )}
    //       </div>
    //     )}

    //     {/* Shift Summary */}

    //     {/* Calculate Button */}
    //     <div className="text-right">
    //       <button
    //         type="button"
    //         onClick={handleCalculation}
    //         className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white transition hover:bg-blue-400"
    //       >
    //         Calculate
    //       </button>
    //     </div>
    //   </div>
    // </div>

    // <div>
    //   {isConfirmShiftTimePopup && (
    //     <ConfirmationPopup
    //       message="Are you sure you want to Change the Shift Time?"
    //       onConfirm={() => {
    //         handleConfirmationShiftTimeSubmit();
    //         setConfirmShiftTimePopup(false);
    //       }}
    //       onCancel={() => setConfirmShiftTimePopup(false)}
    //     />
    //   )}
    //   <div className="space-y-8">
    //     {/* Process Details Card */}
    //     <div className="border-gray-200 dark:border-gray-700 dark:bg-gray-800/90 rounded-2xl border bg-white shadow-lg">
    //       {/* Header */}
    //       <div className="border-gray-200 dark:border-gray-700 flex items-center gap-2 border-b px-6 py-4">
    //         <ClipboardList className="h-5 w-5 text-primary" />
    //         <h2 className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
    //           Process Details
    //         </h2>
    //       </div>

    //       {/* Form Fields */}
    //       <div className="space-y-8 p-6">
    //         {/* First Row */}
    //         <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    //           {/* Planning Name */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Planning Name
    //             </label>
    //             <div className="relative">
    //               <ClipboardList className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <input
    //                 value={processName}
    //                 onChange={(e) => setProcessName(e.target.value)}
    //                 type="text"
    //                 placeholder="Enter Planning Name"
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               />
    //             </div>
    //           </div>

    //           {/* Process Type */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Process Type
    //             </label>
    //             <div className="relative">
    //               <Layers className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <select
    //                 value={selectedProcess?.name || ""}
    //                 onChange={(e) => handleProcessType(e.target.value)}
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               >
    //                 <option value="">Please Select</option>
    //                 {process.map((room, index) => (
    //                   <option key={index} value={room?.name}>
    //                     {room?.name}
    //                   </option>
    //                 ))}
    //               </select>
    //             </div>
    //           </div>

    //           {/* Floor Name */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Floor Name
    //             </label>
    //             <div className="relative">
    //               <Building2 className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <select
    //                 value={selectedRoom?.floorName || ""}
    //                 onChange={(e) => handleFloorName(e.target.value)}
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               >
    //                 <option value="">Please Select</option>
    //                 {roomPlan.map((room, index) => (
    //                   <option key={index} value={room.floorName}>
    //                     {room.floorName}
    //                   </option>
    //                 ))}
    //               </select>
    //             </div>
    //           </div>
    //         </div>

    //         {/* Second Row */}
    //         <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    //           {/* Shift */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Shift
    //             </label>
    //             <div className="relative">
    //               <Clock className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <select
    //                 value={selectedShift?._id || ""}
    //                 onChange={(e) => handleShift(e.target.value)}
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               >
    //                 <option value="">Please Select</option>
    //                 {shifts.map((shift: any, index: any) => (
    //                   <option key={index} value={shift?._id}>
    //                     {shift?.name} ({shift?.startTime} - {shift?.endTime})
    //                   </option>
    //                 ))}
    //               </select>
    //             </div>
    //           </div>

    //           {/* Start Date */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Start Date
    //             </label>
    //             <div className="relative">
    //               <Calendar className="text-gray-400 absolute left-3 top-1/2 z-1 h-5 w-5 -translate-y-1/2" />
    //               <SeatAvailabilityDatePicker
    //                 seatAvailability={seatAvailability}
    //                 floorID={floorID}
    //                 setStartDate={setStartDate}
    //                 formatDate={startDate}
    //                 onDateChange={handleDateChange("start")}
    //               />
    //             </div>
    //           </div>

    //           {/* Repeat Count */}
    //           <div>
    //             <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
    //               Repeat Count
    //             </label>
    //             <div className="relative">
    //               <Repeat className="text-gray-400 absolute left-3 top-3 h-5 w-5" />
    //               <input
    //                 type="number"
    //                 value={repeatCount}
    //                 onChange={(e) => setRepeatCount(e.target.value)}
    //                 placeholder="Enter Repeat Count"
    //                 className="border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 w-full rounded-xl border bg-white px-10 py-3 shadow-sm transition focus:border-primary focus:ring focus:ring-primary/30 dark:text-white"
    //               />
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    //   {selectedProcess && (
    //     <>
    //       <div className="dark:bg-gray-800 mt-2 rounded-lg bg-white p-4">
    //         {/* Header */}
    //         <div className="flex w-full items-center justify-between">
    //           <h3 className="text-gray-900 mb-2 text-xl font-semibold dark:text-white">
    //             {selectedProcess?.name}
    //           </h3>

    //           {/* Edit Shift Button */}
    //           <button
    //             type="button"
    //             onClick={() => setIsEditShiftTime(true)}
    //             className="border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 flex
    //                   items-center gap-2 rounded-lg border px-3 py-1.5
    //                   text-xs shadow-sm transition"
    //           >
    //             <Edit className="text-gray-500 dark:text-gray-300 h-3.5 w-3.5" />
    //             <span>Edit Shift</span>
    //           </button>

    //           {/* Modal for Edit Shift */}

    //         </div>

    //         {/* Process Details Grid */}
    //         <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
    //           <div>
    //             <strong>Product:</strong> {productName}
    //           </div>
    //           <div>
    //             <strong>Shift:</strong>{" "}
    //             {selectedShift && (
    //               <span>
    //                 {selectedShift?.name} (
    //                 {selectedShift?.intervals[0]?.startTime} -{" "}
    //                 {
    //                   selectedShift?.intervals[
    //                     selectedShift?.intervals.length - 1
    //                   ]?.endTime
    //                 }
    //                 )
    //               </span>
    //             )}
    //           </div>
    //           <div>
    //             <strong>Break:</strong> {selectedShift?.totalBreakTime} min
    //           </div>
    //           <div>
    //             <strong>Order No:</strong>{" "}
    //             {selectedProcess?.orderConfirmationNo}
    //           </div>
    //           <div>
    //             <strong>Process ID:</strong> {selectedProcess?.processID}
    //           </div>
    //           <div>
    //             <strong>Qty:</strong> {selectedProcess?.quantity}
    //           </div>
    //           <div className="col-span-2">
    //             <strong>Days:</strong>{" "}
    //             {selectedShift &&
    //               Object.keys(selectedShift.weekDays)
    //                 .filter(
    //                   (day) => day !== "_id" && selectedShift.weekDays[day],
    //                 )
    //                 .map((day) => <span key={day}>{day}, </span>)}
    //           </div>
    //           <div className="col-span-3">
    //             <strong>Description:</strong> {selectedProcess?.descripition}
    //           </div>
    //         </div>
    //       </div>

    //       {/* Inventory Section */}
    //       {inventoryData && (
    //         <div className="dark:bg-gray-800 mt-2 rounded-lg bg-white p-4 text-sm">
    //           <h3 className="text-gray-900 mb-2 flex items-center gap-2 font-semibold dark:text-white">
    //             <Package className="h-4 w-4 text-primary" /> Kit
    //           </h3>
    //           <div className="grid gap-2 sm:grid-cols-4">
    //             <div>
    //               <strong>Required:</strong> {selectedProcess?.quantity}
    //             </div>
    //             <div>
    //               <strong>Available:</strong> {inventoryData?.quantity}
    //             </div>
    //             <div>
    //               <strong>Shortage:</strong>{" "}
    //               {Math.max(
    //                 selectedProcess?.quantity - inventoryData?.quantity,
    //                 0,
    //               )}
    //             </div>
    //             <div>
    //               <strong>Surplus:</strong>{" "}
    //               {Math.max(
    //                 inventoryData?.quantity - selectedProcess?.quantity,
    //                 0,
    //               )}
    //             </div>
    //           </div>
    //         </div>
    //       )}

    //       {/* Cartons Section */}
    //       {packagingData.length > 0 &&
    //         packagingData[0].packagingData.packagingType == "Carton" && (
    //           <div className="dark:bg-gray-800 mt-2 rounded-lg bg-white p-4 text-sm">
    //             <h3 className="text-gray-900 mb-2 flex items-center gap-2 font-semibold dark:text-white">
    //               <Box className="h-4 w-4 text-primary" /> Cartons
    //             </h3>
    //             <div className="grid gap-2 sm:grid-cols-3">
    //               <div>
    //                 <strong>Required:</strong>{" "}
    //                 {Math.ceil(
    //                   selectedProcess?.quantity /
    //                     packagingData[0].packagingData.maxCapacity,
    //                 )}
    //               </div>
    //               <div>
    //                 <strong>Available:</strong> {inventoryData?.cartonQuantity}
    //               </div>
    //               <div>
    //                 <strong>Shortage:</strong>{" "}
    //                 {Math.max(
    //                   selectedProcess?.quantity /
    //                     packagingData[0].packagingData.maxCapacity -
    //                     inventoryData?.cartonQuantity,
    //                   0,
    //                 )}
    //               </div>
    //               <div>
    //                 <strong>Surplus:</strong>{" "}
    //                 {Math.max(
    //                   inventoryData?.cartonQuantity -
    //                     selectedProcess?.quantity /
    //                       packagingData[0].packagingData.maxCapacity,
    //                   0,
    //                 )}
    //               </div>
    //               <div className="col-span-3">
    //                 <strong>Dimension:</strong>{" "}
    //                 {packagingData[0].packagingData.cartonWidth} Ã—{" "}
    //                 {packagingData[0].packagingData.cartonHeight}
    //               </div>
    //             </div>
    //           </div>
    //         )}
    //     </>
    //   )}

    //   <div className="dark:bg-gray-800 mb-6 mt-4 rounded-xl bg-white p-5 shadow">
    //     <h3 className="text-gray-900 mb-4 text-xl font-semibold dark:text-white">
    //       Shift Summary
    //     </h3>

    //     <div className="flex flex-wrap justify-center gap-3">
    //       {selectedShift?.intervals?.map((interval, index) => {
    //         const isBreak = interval.breakTime;
    //         return (
    //           <div
    //             key={index}
    //             className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow transition ${
    //               isBreak
    //                 ? "bg-[#fbc0c0] text-danger dark:bg-[#fbc0c0] dark:text-danger"
    //                 : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    //             }`}
    //           >
    //             {isBreak ? (
    //               <>
    //                 <Coffee className="h-4 w-4" />
    //                 <span>
    //                   Break: {interval.startTime} - {interval.endTime}
    //                 </span>
    //               </>
    //             ) : (
    //               <>
    //                 <Clock className="h-4 w-4" />
    //                 <span>
    //                   {interval.startTime} - {interval.endTime}
    //                 </span>
    //               </>
    //             )}
    //           </div>
    //         );
    //       })}
    //     </div>
    //   </div>
    //   <div className="text-right">
    //     <button
    //       type="button"
    //       className="w-40 rounded-lg bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-400"
    //       onClick={handleCalculation}
    //     >
    //       Calculate
    //     </button>
    //   </div>
    //   {/* end component 1 */}
    // </div>
  );
};

export default FormComponent;
