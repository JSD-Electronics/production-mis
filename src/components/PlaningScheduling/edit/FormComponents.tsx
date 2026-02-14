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
  FaExclamationTriangle,
} from "react-icons/fa";
import flatpickr from "flatpickr";
import { MdInventory } from "react-icons/md";
import DateTimePicker from "@/components/DateTimePicker/dateTimePicker";
import SeatAvailabilityDatePicker from "@/components/DateTimePicker/SeatAvailabilityDatePicker";
import { fetchSeatAvailabilityFromCurrentDate } from "@/lib/api";
import Modal from "@/components/Modal/page";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import ConfirmationPopup from "@/components/Confirmation/page";

interface ShiftInterval {
  breakTime: boolean;
  startTime: string;
  endTime: string;
}

interface FormComponentProps {
  shifts: any[];
  process: any[];
  roomPlan: any[];
  calculateTimeDifference: (shift: any) => void;
  handleCalculation: () => void;
  setSelectedProduct: (product: any) => void;
  selectedProcess: any;
  setSelectedProcess: (process: any) => void;
  repeatCount: string | number;
  setRepeatCount: (count: any) => void;
  selectedShift: any;
  setSelectedShift: (shift: any) => void;
  setSelectedRoom: (room: any) => void;
  selectedRoom: any;
  startDate: string;
  setStartDate: (date: any) => void;
  productName: string;
  setProductName: (name: string) => void;
  formatDate: (date: any) => string;
  setChangeShiftTime: (time: any) => void;
  changeShiftTime: any;
  startTime: string;
  endTime: string;
  shiftChangedFromDate: string;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  setShiftChangedFromDate: (date: string) => void;
  handleConfirmationShiftTimeSubmit: () => void;
  processName: string;
  setProcessName: (name: string) => void;
  isConfirmShiftTime: boolean;
  setIsConfirmShiftTime: (val: boolean) => void;
  packagingData: any[];
  inventoryData: any;
  assignedStages: any;
}

const FormComponent: React.FC<FormComponentProps> = ({
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
  assignedStages,
}) => {
  const [floorID, setFloorID] = useState("");
  const [seatAvailability, setSeatAvailability] = useState<any[]>([]);
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
  const handleDateChange = (dateType: string) => (selectedDate: any) => {
    if (dateType === "start") {
      setStartDate(formatDate(selectedDate));
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
    const totalSeats = selectedRoom?.lines.reduce(
      (total: number, row: any) => total + row.seats.length,
      0,
    ) || 0;
    if (assignedStages && Object.keys(assignedStages).length >= totalSeats) {
      alert(
        "Insufficient seats available to assign all stages. Please adjust the allocation.",
      );
      return;
    }
    setRepeatCount(e);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 📋 Step 1: Planning Setup */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800/20">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <FaClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white font-outfit">Planning Setup</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Process and floor</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Planning Name
              </label>
              <div className="relative">
                <FaCogs className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  type="text"
                  placeholder="e.g., Q1 Production"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Process Type
                </label>
                <div className="relative">
                  <FaLayerGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedProcess?.name || ""}
                    onChange={(e) => handleProcessType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
                  >
                    <option value="">Please Select</option>
                    {process.map((room, index) => (
                      <option key={index} value={room?.name}>{room?.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Floor Name
                </label>
                <div className="relative">
                  <FaClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedRoom?.floorName || ""}
                    onChange={(e) => handleFloorName(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
                  >
                    <option value="">Select Floor</option>
                    {roomPlan.map((room, index) => (
                      <option key={index} value={room?.floorName}>{room?.floorName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📅 Step 2: Scheduling */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800/20">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <FaCalendarAlt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Scheduling Info</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Time and repetition settings</p>
              </div>
            </div>
            {selectedProcess && (
              <button
                type="button"
                onClick={() => setIsEditShiftTime(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-400"
              >
                <Clock className="h-3.5 w-3.5" /> Edit Shift
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex flex-col">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Work Shift
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <select
                  value={selectedShift?._id || ""}
                  onChange={(e) => handleShift(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-10 text-xs font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select Shift</option>
                  {shifts.map((shift, index) => (
                    <option key={index} value={shift?._id}>
                      {shift?.name} ({shift?.intervals[0].startTime} - {shift?.intervals[shift?.intervals.length - 1].endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Plan Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                  <div className="w-full">
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

              <div className="flex flex-col">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Repeat (Lines)
                </label>
                <div className="relative">
                  <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="number"
                    value={repeatCount}
                    onChange={(e) => handleRepeatCount(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Section: Process Summary Dashboard */}
      {selectedProcess && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800/20 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 dark:bg-gray-900/50 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                <FaCogs className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight font-outfit">Active: <span className="text-blue-600 dark:text-blue-400">{selectedProcess?.name}</span></h3>
            </div>
            <div className="flex gap-1.5">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">ID: {selectedProcess?.processID}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">QTY: {selectedProcess?.quantity}</span>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Product Name</span>
              <span className="text-sm font-black text-gray-900 dark:text-white truncate font-outfit">{productName}</span>
            </div>

            <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ref No</span>
              <span className="text-sm font-black text-gray-900 dark:text-white font-outfit">{selectedProcess?.orderConfirmationNo}</span>
            </div>

            <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Shift Schedule</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-outfit">
                  {selectedShift ? selectedShift.name : 'Unassigned'}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 font-medium">
                {selectedShift && selectedShift.intervals.length > 0 && `${selectedShift?.intervals[0]?.startTime} - ${selectedShift?.intervals[selectedShift?.intervals.length - 1]?.endTime}`}
              </span>
            </div>

            <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Break</span>
              <span className="text-sm font-black text-gray-900 dark:text-white font-outfit">{selectedShift?.totalBreakTime || 0} Minutes</span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30">
              <span className="text-[10px] font-bold text-blue-400 uppercase mb-1 block tracking-wider">Process Description</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                {selectedProcess?.descripition || 'No internal notes provided for this production run.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Section: Inventory Health Check */}
      {inventoryData && selectedProcess && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Kit Health */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/20">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <MdInventory className="h-4 w-4" />
                </div>
                <h3 className="text-md font-bold text-gray-900 dark:text-white font-outfit">Kit Readiness</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-gray-400 uppercase">Avail.</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded-md text-xs font-black text-gray-900 dark:text-white">{inventoryData?.quantity}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Required</p>
                <p className="text-lg font-black text-gray-900 dark:text-white font-outfit">{selectedProcess?.quantity}</p>
              </div>

              <div className={`p-3 rounded-xl border text-center ${selectedProcess?.quantity > inventoryData?.quantity ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50 text-red-600' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50 text-green-600'}`}>
                <p className="text-[9px] font-bold uppercase tracking-tighter mb-1 opacity-70">{selectedProcess?.quantity > inventoryData?.quantity ? 'Shortage' : 'Surplus'}</p>
                <p className="text-lg font-black font-outfit">{Math.abs(selectedProcess?.quantity - inventoryData?.quantity)}</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50 text-center">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mb-1">Cap</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-outfit">{Math.min(selectedProcess?.quantity, inventoryData?.quantity)}</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase">Current Inventory Coverage</span>
                <span className={`text-[10px] font-black uppercase ${inventoryData?.quantity >= selectedProcess?.quantity ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.min(Math.round((inventoryData?.quantity / selectedProcess?.quantity) * 100), 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full dark:bg-gray-900 overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${inventoryData?.quantity >= selectedProcess?.quantity ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((inventoryData?.quantity / selectedProcess?.quantity) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Carton Health */}
          {packagingData.length > 0 && packagingData[0]?.packagingData?.packagingType === "Carton" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/20">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                    <FaBox className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">Carton Availability</h3>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Dimensions</span>
                  <span className="text-[10px] font-black text-gray-900 dark:text-white">{packagingData[0]?.packagingData?.cartonWidth} x {packagingData[0]?.packagingData?.cartonHeight}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Needed</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white font-outfit">
                    {Math.ceil(selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity)}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border text-center ${inventoryData?.cartonQuantity < (selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity) ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50 text-red-600' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50 text-green-600'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-tighter mb-1 opacity-70">
                    {inventoryData?.cartonQuantity < (selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity) ? 'Shortage' : 'Surplus'}
                  </p>
                  <p className="text-xl font-black font-outfit">
                    {Math.abs(Math.ceil(selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity) - inventoryData?.cartonQuantity)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Available</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white font-outfit">{inventoryData?.cartonQuantity}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/80">
                <div className="flex items-center gap-2">
                  {inventoryData?.cartonQuantity < (selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity) ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600"><FaExclamationTriangle className="h-3 w-3" /></div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600"><FaBox className="h-3 w-3" /></div>
                  )}
                  <span className={`text-[10px] font-black uppercase ${inventoryData?.cartonQuantity < (selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity) ? 'text-red-500' : 'text-green-500'}`}>
                    {inventoryData?.cartonQuantity < (selectedProcess?.quantity / packagingData[0]?.packagingData?.maxCapacity) ? 'Packaging Block Detected' : 'Reliable Stock Coverage'}
                  </span>
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase">Max {packagingData[0]?.packagingData?.maxCapacity} / Carton</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⏰ Section: Shift Summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/20">
        <h3 className="mb-6 flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white font-outfit">
          <Clock className="h-5 w-5 text-gray-400" /> Current Shift Sequence
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedShift?.intervals?.map((interval: ShiftInterval, index: number) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-2xl px-5 py-2.5 text-xs font-black transition-all shadow-sm border ${interval.breakTime
                ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                : "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                }`}
            >
              {interval.breakTime ? <Coffee className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="font-outfit uppercase tracking-tighter">{interval.breakTime ? "Break Interval: " : ""}{interval.startTime} - {interval.endTime}</span>
            </div>
          ))}
          {(!selectedShift?.intervals || selectedShift.intervals.length === 0) && (
            <div className="flex items-center gap-3 rounded-2xl px-5 py-2.5 text-xs font-black bg-gray-50 text-gray-400 border border-gray-100 italic">
              Waiting for shift selection...
            </div>
          )}
        </div>
      </div>

      {/* 🚀 Action: Calculation */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleCalculation}
          className="group relative flex items-center justify-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-5 font-black text-white shadow-2xl transition-all hover:scale-[1.02] hover:shadow-blue-500/25 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-10" />
          <FaCogs className="h-5 w-5 animate-spin-slow group-hover:scale-110 transition-transform" />
          <span className="relative font-bold spacing tracking-widest uppercase text-sm">Recalculate Capacity Matrix</span>
        </button>
      </div>

      {/* Modals & Popups */}
      {isConfirmShiftTimePopup && (
        <ConfirmationPopup
          message="Adjusting the shift pattern will re-evaluate all sequences from the target date. Proceed?"
          onConfirm={() => {
            handleConfirmationShiftTimeSubmit();
            setConfirmShiftTimePopup(false);
          }}
          onCancel={() => setConfirmShiftTimePopup(false)}
        />
      )}

      <Modal
        isOpen={isEditShiftTime}
        onSubmit={handlesubmitDowntime}
        onClose={closeEditShiftTime}
        title="Dynamic Shift Override"
      >
        <div className="space-y-6 pt-2">
          <DatePickerOne
            formLabel="Baseline Effective Date"
            name="shift-change-date"
            id="shift-change-date"
            value={shiftChangedFromDate}
            setValue={setShiftChangedFromDate}
          />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shift Starts At</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 font-black outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shift Ends At</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 font-black outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-3">
            <FaExclamationTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
              CAUTION: Overriding the timeline will force a recalculation of the entire availability matrix for this production room.
            </p>
          </div>
        </div>
      </Modal>
    </div>
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
