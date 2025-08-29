"use client";
import React, { useState, useEffect, use } from "react";
import { viewRoom, getProductById, viewProcess, viewShift } from "@/lib/api";
import flatpickr from "flatpickr";
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
  inventoryData
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
      console.log("Error Fetching Products:", error);
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

  return (
    <div>
      {isConfirmShiftTimePopup && (
        <ConfirmationPopup
          message="Are you sure you want to Change the Shift Time?"
          onConfirm={() => {
            handleConfirmationShiftTimeSubmit();
            setConfirmShiftTimePopup(false);
          }}
          onCancel={() => setConfirmShiftTimePopup(false)}
        />
      )}
      <div className="mb-4 flex flex-col gap-6 xl:flex-row">
        <div className="w-full xl:w-1/2">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Planing Name
          </label>
          <input
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            type="text"
            placeholder="Process Name"
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
            {process.map((room, index) => (
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
            {roomPlan.map((room, index) => (
              <option
                key={index}
                value={room.floorName}
                className="text-body dark:text-bodydark"
              >
                {room.floorName}
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
            {shifts.map((shift: any, index: any) => (
              <option
                key={index}
                value={shift?._id}
                className="text-body dark:text-bodydark"
              >
                {shift?.name} ({shift?.startTime} - {shift?.endTime})
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
              {/* <DateTimePicker formatDate={startDate} onDateChange={handleDateChange("start")} /> */}
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
                onChange={(e) => setRepeatCount(e.target.value)}
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
            <div className="flex w-full items-center justify-between">
              <h3 className="text-gray-900 mb-4 text-2xl font-semibold dark:text-white">
                {selectedProcess?.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditShiftTime(true)}
                className="btn btn-primary flex items-center gap-1 rounded-lg border bg-meta-2 p-2 text-sm"
              >
                <svg
                  fill="#64748b"
                  height="15px"
                  width="25px"
                  version="1.1"
                  id="Capa_1"
                  viewBox="0 0 428.018 428.018"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path d="M143.356,159.274c18.697,0,36.254-7.537,49.437-21.222c11.371-11.804,24.635-33.626,23.253-70.552 c-0.957-25.575-13.385-43.617-30.124-54.636c-0.564-0.459-5.232-3.179-6.975-4.076c-8.749-4.497-18.309-7.308-27.831-8.485 c-2.477-0.306-11.867-0.393-13.754-0.2C105.335,3.384,72.253,25.11,70.664,67.5c-1.381,36.926,11.883,58.748,23.254,70.552 C107.101,151.737,124.659,159.274,143.356,159.274z M90.651,68.248c1.204-32.143,27.278-47.508,52.705-48.533 c8.373,0.337,16.811,2.241,24.413,5.775c-7.441,19.19-26.439,27.88-42.951,29.543c-5.495,0.553-9.501,5.456-8.948,10.951 c0.519,5.155,4.865,8.999,9.938,8.999c0.335,0,0.673-0.017,1.014-0.051c26.512-2.669,47.376-16.547,57.484-37.351 c6.807,7.644,11.274,17.809,11.755,30.666c0.886,23.668-5.225,43.008-17.672,55.929c-9.378,9.736-21.82,15.098-35.033,15.098 c-13.213,0-25.655-5.362-35.033-15.098C95.876,111.255,89.765,91.915,90.651,68.248z M185.613,257.018c0,5.523-4.477,10-10,10 h-19.506c-5.523,0-10-4.477-10-10c0-5.523,4.477-10,10-10h19.506C181.136,247.018,185.613,251.495,185.613,257.018z M386.842,278.018h-35.889v-5.679c0-5.523-4.479-10-10.001-9.999s-9.999,4.478-9.999,10.001v5.677h-54v-5.678 c0-5.523-4.478-10-10-10s-10,4.477-10,10v5.678h-35.901c-5.522,0-10.099,4.922-10.099,10.445v129.553 c0,5.523,4.576,10.002,10.099,10.002h165.79c5.522,0,10.111-4.479,10.111-10.002V288.463 C396.953,282.94,392.365,278.018,386.842,278.018z M376.953,408.018h-146v-110h26v6.568c0,5.523,4.478,10,10,10s10-4.477,10-10 v-6.568h54v6.569c0,5.523,4.479,10,10.001,9.999s9.999-4.478,9.999-10.001v-6.567h26V408.018z M351.402,379.584 c0,5.523-4.477,10-10,10l-74.912,0.002c-5.522,0-10-4.477-10-10c0-5.523,4.477-10,10-10l74.912-0.002 C346.924,369.584,351.402,374.061,351.402,379.584z M351.402,342.018c0,5.523-4.478,10-10,10H266.49c-5.522,0-10-4.477-10-10 s4.478-10,10-10h74.912C346.924,332.018,351.402,336.495,351.402,342.018z M210.113,240.162 c-10.584-30.6-44.619-42.098-73.666-39.917c-26.025,1.954-55.975,15.599-61.982,48.037L53.087,363.693l106.921-0.002 c5.522,0,10,4.477,10,10c0,5.523-4.477,10-10,10l-118.944,0.002c-2.971,0-5.788-1.321-7.688-3.605s-2.686-5.295-2.145-8.216 L54.8,244.639c6.654-35.928,38.116-61.182,80.151-64.338c19.755-1.483,39.66,2.336,56.043,10.756 c18.536,9.525,31.683,24.245,38.02,42.567c1.806,5.219-0.962,10.914-6.182,12.719C217.613,248.15,211.918,245.381,210.113,240.162z"></path>{" "}
                  </g>
                </svg>
                <span>Edit Shift</span>
              </button>
              <Modal
                isOpen={isEditShiftTime}
                onSubmit={handlesubmitDowntime}
                onClose={closeEditShiftTime}
                title="Edit Shift"
              >
                <div className="grid grid-cols-1">
                  <DatePickerOne
                    label="From Date"
                    value={shiftChangedFromDate}
                    setValue={setShiftChangedFromDate}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Start Time:
                    </label>
                    <input
                      type="time"
                      id="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 block w-full rounded-lg border p-2.5 text-sm leading-none focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      End Time:
                    </label>
                    <input
                      type="time"
                      id="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-gray-50 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 block w-full rounded-lg border p-2.5 text-sm leading-none focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </Modal>
            </div>

            <div className="grid sm:grid-cols-2">
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Product Name:</strong>{" "}
                {productName}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                <strong className="font-medium">Shift :</strong>{" "}
                {shiftChangedFromDate ? (
                  <span>
                    {selectedShift?.name} ({selectedShift?.intervals[0]?.startTime} - {selectedShift?.intervals[selectedShift?.intervals.length - 1]?.endTime})
                  </span>
                ) : (
                  selectedShift && (
                    <span>
                      {selectedShift?.name} ({selectedShift?.intervals[0]?.startTime} -{" "}
                      {selectedShift?.intervals[selectedShift?.intervals.length - 1]?.endTime})
                    </span>
                  )
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
                    {inventoryData?.quantity > selectedProcess?.quantity
                      ? Math.abs(
                        inventoryData?.quantity - selectedProcess?.quantity
                        )
                      : 0}
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
                            Carton shortage :
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
                            Carton surplus :
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
