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
  assignedStages: any;
  getProduct: (id: any) => void;
  productName: string;
  processName: string;
  setProcessName: (name: string) => void;
  packagingData: any[];
  inventoryData: any;
  holidays: any[];
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
  assignedStages,
  getProduct,
  productName,
  processName,
  setProcessName,
  packagingData,
  inventoryData,
  holidays,
}) => {
  const [floorID, setFloorID] = useState("");
  const [seatAvailability, setSeatAvailability] = useState<any[]>([]);

  const getSeatAvailabilityFromCurrentDate = async (shiftID: any) => {
    try {
      const response = await fetchSeatAvailabilityFromCurrentDate(
        floorID || selectedRoom?._id,
        shiftID,
      );
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
    setProcessName(selected?.name || "");
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
    const totalSeats = selectedRoom?.lines.reduce(
      (total: number, row: any) => total + row.seats.length,
      0,
    ) || 0;
    if (assignedStages && Object.keys(assignedStages).length >= totalSeats) {
      // alert(
      //   "Insufficient seats available to assign all stages. Please adjust the allocation.",
      // );
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
                  readOnly={true}
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pl-9 pr-4 text-xs font-medium outline-none cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Process Type
                </label>
                <div className="relative">
                  <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <select
                    value={selectedProcess?.name || ""}
                    onChange={(e) => handleProcessType(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-10 text-xs font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    disabled={true}
                  >
                    <option value="">Please Select</option>
                    {process.map((room, index) => (
                      <option key={index} value={room?.name}>{room?.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Floor Name
                </label>
                <div className="relative">
                  <FaClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <select
                    value={selectedRoom?.floorName || ""}
                    onChange={(e) => handleFloorName(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-10 text-xs font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800/20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <FaCalendarAlt className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-md font-bold text-gray-900 dark:text-white font-outfit">Scheduling Info</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Time settings</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
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
                      selectedShift={selectedShift}
                      holidays={holidays}
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
            <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Product</span>
              <span className="text-xs font-black text-gray-900 dark:text-white truncate font-outfit">{productName}</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ref No</span>
              <span className="text-xs font-black text-gray-900 dark:text-white font-outfit">{selectedProcess?.orderConfirmationNo}</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shift Schedule</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-outfit">
                  {selectedShift ? selectedShift.name : 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Break</span>
              <span className="text-xs font-black text-gray-900 dark:text-white font-outfit">{selectedShift?.totalBreakTime || 0} Min</span>
            </div>
          </div>

          <div className="px-4 pb-4 pt-1">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30">
              <span className="text-[9px] font-bold text-blue-400 uppercase mb-1 block tracking-wider">Description</span>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed italic">
                {selectedProcess?.descripition || 'No internal notes provided.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Section: Inventory Health Check */}
      {inventoryData && selectedProcess && (
        (() => {
          const totalAvailableKits = (inventoryData.quantity || 0) + (selectedProcess.issuedKits || 0);
          const totalAvailableCartons = (inventoryData.cartonQuantity || 0) + (selectedProcess.issuedCartons || 0);
          const kitsShortage = selectedProcess.quantity - totalAvailableKits;

          return (
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
                  <div className="flex items-center gap-1.5" title={`Store: ${inventoryData.quantity} | Issued: ${selectedProcess.issuedKits}`}>
                    <span className="text-[9px] font-black text-gray-400 uppercase">Avail.</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded-md text-xs font-black text-gray-900 dark:text-white">
                      {totalAvailableKits}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50 text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Required</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white font-outfit">{selectedProcess?.quantity}</p>
                  </div>

                  <div className={`p-3 rounded-xl border text-center ${kitsShortage > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50 text-red-600' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50 text-green-600'}`}>
                    <p className="text-[9px] font-bold uppercase tracking-tighter mb-1 opacity-70">{kitsShortage > 0 ? 'Shortage' : 'Surplus'}</p>
                    <p className="text-lg font-black font-outfit">{Math.abs(kitsShortage)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50 text-center">
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mb-1">Cap</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-outfit">
                      {Math.max(0, Math.min(selectedProcess?.quantity, totalAvailableKits))}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Coverage</span>
                    <span className={`text-[9px] font-black uppercase ${totalAvailableKits >= selectedProcess?.quantity ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.max(0, Math.min(Math.round((totalAvailableKits / selectedProcess?.quantity) * 100), 100))}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full dark:bg-gray-900 overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${totalAvailableKits >= selectedProcess?.quantity ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.max(0, Math.min((totalAvailableKits / selectedProcess?.quantity) * 100, 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Carton Health */}
              {packagingData?.length > 0 && packagingData[0]?.packagingType === "Carton" && (
                (() => {
                  const cartonsNeeded = Math.ceil(selectedProcess?.quantity / packagingData[0]?.maxCapacity);
                  const cartonsShortage = cartonsNeeded - totalAvailableCartons;
                  return (
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/20">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                            <FaBox className="h-4 w-4" />
                          </div>
                          <h3 className="text-md font-bold text-gray-900 dark:text-white font-outfit">Carton Availability</h3>
                        </div>
                        <div className="flex items-center gap-1.5" title={`Store: ${inventoryData.cartonQuantity} | Issued: ${selectedProcess.issuedCartons}`}>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Avail.</span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded-md text-xs font-black text-gray-900 dark:text-white">
                            {totalAvailableCartons}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50 text-center">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Needed</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white font-outfit">
                            {cartonsNeeded}
                          </p>
                        </div>

                        <div className={`p-3 rounded-xl border text-center ${cartonsShortage > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50 text-red-600' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50 text-green-600'}`}>
                          <p className="text-[9px] font-bold uppercase tracking-tighter mb-1 opacity-70">
                            {cartonsShortage > 0 ? 'Short' : 'Surp'}
                          </p>
                          <p className="text-lg font-black font-outfit">
                            {Math.abs(cartonsShortage)}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/50 text-center">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Store</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white font-outfit">{inventoryData?.cartonQuantity}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/80">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase ${cartonsShortage > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {cartonsShortage > 0 ? 'Packaging Block' : 'Stock Coverage'}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Max {packagingData[0]?.maxCapacity}/Ctn</span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          );
        })()
      )}

      {/* 🚀 Action: Calculation */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleCalculation}
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-3.5 font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-blue-500/25 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-10" />
          <FaCogs className="h-4 w-4 animate-spin-slow group-hover:scale-110 transition-transform" />
          <span className="relative font-bold spacing tracking-widest uppercase text-xs">Initiate Scheduling Engine</span>
        </button>
      </div>
    </div>
  );
};

export default FormComponent;
