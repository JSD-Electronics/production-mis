"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import { createShift } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddShiftManagement = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekDays, setWeekDays] = useState({
    sun: false,
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
  });
  const [intervals, setIntervals] = useState([{ startTime: "00:00", endTime: "00:00", breakTime: false }]);

  const handleCheckboxChange = (day: string) => {
    setWeekDays((prevDays) => ({
      ...prevDays,
      [day]: !prevDays[day],
    }));
  };

  const addInterval = () => {
    setIntervals([
      ...intervals,
      { startTime: "00:00", endTime: "00:00", breakTime: false },
    ]);
  };

  const removeInterval = (index: number) => {
    const updatedIntervals = intervals.filter((_, i) => i !== index);
    setIntervals(updatedIntervals);
  };

  const handleIntervalChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedIntervals = [...intervals];
    updatedIntervals[index][field] = value;
    setIntervals(updatedIntervals);
  };
  const handleCheckboxBreakTime = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedIntervals = [...intervals];
    updatedIntervals[index][field] = value;
    setIntervals(updatedIntervals);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const shiftStartTime = intervals[0].startTime;
      const shiftEndTime = intervals[intervals.length - 1].endTime;
      const totalBreakTime = intervals.filter((interval) => interval.breakTime)
      .reduce((total, breakInterval) => {
        return (
          total +
          calculateTimeDifference(
            breakInterval.startTime,
            breakInterval.endTime,
          )
        );
      }, 0);
      const formData = {
        name,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        totalBreakTime,
        description,
        weekDays,
        intervals,
      };
      await createShift(formData);
      toast.success("Shift created successfully!");
      setName("");
      setDescription("");
      setWeekDays({
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
      });
      setIntervals([
        { startTime: "00:00", endTime: "00:00", breakTime: "00:00" },
      ]);
    } catch (error) {
      console.error("Error creating shift:", error);
      toast.error("Failed to create shift. Please try again.");
    }
  };
  const calculateTimeDifference = (start, end) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  };

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb parentName="Shift Management" pageName="Add Shift" />
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="dark:bg-gray-800 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-gray-800 dark:text-gray-200 mb-6 text-xl font-semibold">
            Add Shift
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shift Details */}
            <div>
              <h3 className="text-gray-800 dark:text-gray-200 mb-4 text-lg font-medium">
                Shift Details
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Shift Name"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter Shift Description"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>
            </div>

            {/* Days of the Week */}
            <div>
              <h3 className="text-gray-800 dark:text-gray-200 mb-4 text-lg font-medium">
                Days of the Week
              </h3>
              <div className="flex gap-4 ml-2">
                {Object.keys(weekDays).map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={weekDays[day]}
                      onChange={() => handleCheckboxChange(day)}
                      id={day}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 h-4 w-4 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={day}
                      className="text-gray-700 dark:text-gray-300 text-sm font-medium capitalize"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Intervals */}
            <div>
              <h3 className="text-gray-800 dark:text-gray-200 mb-4 text-lg font-medium">
                Add Shift Time Intervals
              </h3>
              <div className="space-y-6">
                {intervals.map((interval, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3"
                  >
                    <div>
                      <label className="text-gray-700 dark:text-gray-300 block text-sm font-medium">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={interval.startTime}
                        onChange={(e) =>
                          handleIntervalChange(
                            index,
                            "startTime",
                            e.target.value,
                          )
                        }
                        className="border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 mt-1 w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-700 dark:text-gray-300 block text-sm font-medium">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={interval.endTime}
                        onChange={(e) =>
                          handleIntervalChange(index, "endTime", e.target.value)
                        }
                        className="border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 mt-1 w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="mt-8 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={interval.breakTime || false}
                          onChange={(e) =>
                            handleCheckboxBreakTime(
                              index,
                              "breakTime",
                              e.target.checked,
                            )
                          }
                          className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 h-4 w-4 rounded focus:ring-blue-500"
                        />
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                          Break Time
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInterval(index)}
                        className="mt-5 inline-flex items-center rounded-md bg-danger px-3 py-2 text-white hover:bg-danger focus:outline-none"
                      >
                        <svg
                          width="20px"
                          height="20px"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ffffff"
                        >
                          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                          <g
                            id="SVGRepo_tracerCarrier"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          ></g>
                          <g id="SVGRepo_iconCarrier">
                            {" "}
                            <path
                              d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17"
                              stroke="#ffffff"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></path>{" "}
                          </g>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <button
                  type="button"
                  onClick={addInterval}
                  className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none"
                >
                  Add Interval
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-right">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-green-500 px-6 py-2 text-white hover:bg-green-600 focus:outline-none"
              >
                Save Shift
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
    // <>
    //   <Breadcrumb parentName="Shift Management" pageName="Add Shift" />
    //   <div className="grid gap-9">
    //     <ToastContainer
    //       position="top-center"
    //       closeOnClick
    //       pauseOnFocusLoss
    //       draggable
    //       pauseOnHover
    //     />
    //     <div className="flex flex-col gap-9">
    //       <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
    //         <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
    //           <h3 className="font-medium text-black dark:text-white">
    //             Add Shift
    //           </h3>
    //         </div>
    //         <form>
    //           <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-1">
    //             <div>
    //               <label className="mb-3 block text-sm font-medium text-black dark:text-white">
    //                 Shift Name
    //               </label>
    //               <input
    //                 type="text"
    //                 value={name}
    //                 onChange={(e) => setName(e.target.value)}
    //                 placeholder="Enter Shift Name"
    //                 className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    //               />
    //             </div>
    //             <div>
    //               <label className="mb-3 block text-sm font-medium text-black dark:text-white">
    //                 Description
    //               </label>
    //               <textarea
    //                 value={description}
    //                 onChange={(e) => setDescription(e.target.value)}
    //                 placeholder="Enter Shift Description"
    //                 className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    //               ></textarea>
    //             </div>
    //             <div className="px-1">
    //               <div className="">
    //                 <label className="mb-3 block text-sm font-medium text-black dark:text-white">
    //                   Days Of Week
    //                 </label>
    //               </div>
    //               <div className="flex gap-4">
    //                 {Object.keys(weekDays).map((day) => (
    //                   <div key={day} className="flex items-center gap-2">
    //                     <input
    //                       type="checkbox"
    //                       checked={weekDays[day]}
    //                       onChange={() => handleCheckboxChange(day)}
    //                       id={day}
    //                     />
    //                     <label
    //                       htmlFor={day}
    //                       className="capitalize text-black dark:text-white"
    //                     >
    //                       {day}
    //                     </label>
    //                   </div>
    //                 ))}
    //               </div>
    //             </div>
    //           </div>
    //           <div className="px-6 pr-8 pt-4">
    //             <h3 className="font-medium text-black dark:text-white">
    //               Shift Time Interval
    //             </h3>
    //           </div>
    //           <div className="grid gap-6 px-8 pr-8 pt-4">
    //             {intervals.map((interval, index) => (
    //               <div key={index} className="grid gap-6 sm:grid-cols-3">
    //                 <div>
    //                   <label className="mb-3 block text-sm font-medium text-black dark:text-white">
    //                     Start Time
    //                   </label>
    //                   <input
    //                     type="time"
    //                     value={interval.startTime}
    //                     onChange={(e) =>
    //                       handleIntervalChange(
    //                         index,
    //                         "startTime",
    //                         e.target.value,
    //                       )
    //                     }
    //                     className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    //                     required
    //                   />
    //                 </div>
    //                 <div>
    //                   <label className="mb-3 block text-sm font-medium text-black dark:text-white">
    //                     End Time
    //                   </label>
    //                   <input
    //                     type="time"
    //                     value={interval.endTime}
    //                     onChange={(e) =>
    //                       handleIntervalChange(index, "endTime", e.target.value)
    //                     }
    //                     className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    //                     required
    //                   />
    //                 </div>
    //                 <div className="mt-8 flex items-center gap-4">
    //                   <div className="flex items-center gap-2">
    //                     <input
    //                       type="checkbox"
    //                       checked={interval.breakTime}
    //                       onChange={(e) => handleCheckboxBreakTime(index,"breakTime",e.target.value)}
    //                       // id={day}
    //                     />
    //                     <label
    //                       // htmlFor={day}
    //                       className="capitalize text-black dark:text-white"
    //                     >
    //                       Break Time
    //                     </label>
    //                   </div>
    //                   <button
    //                     type="button"
    //                     onClick={() => removeInterval(index)}
    //                     className="hover:bg-red-600 rounded-md bg-danger px-2.5 py-2 text-white transition"
    //                   >
    //                     <svg
    //                       width="20px"
    //                       height="20px"
    //                       viewBox="0 0 24 24"
    //                       fill="none"
    //                       stroke="#ffffff"
    //                     >
    //                       <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    //                       <g
    //                         id="SVGRepo_tracerCarrier"
    //                         stroke-linecap="round"
    //                         stroke-linejoin="round"
    //                       ></g>
    //                       <g id="SVGRepo_iconCarrier">
    //                         {" "}
    //                         <path
    //                           d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17"
    //                           stroke="#ffffff"
    //                           stroke-width="2"
    //                           stroke-linecap="round"
    //                           stroke-linejoin="round"
    //                         ></path>{" "}
    //                       </g>
    //                     </svg>
    //                   </button>
    //                 </div>
    //               </div>
    //             ))}
    //             <div className="text-end">
    //               <button
    //                 type="button"
    //                 onClick={addInterval}
    //                 className="rounded-md bg-blue-600 px-2.5 py-2 text-white transition hover:bg-blue-700"
    //               >
    //                 <svg
    //                   width="24px"
    //                   height="24px"
    //                   viewBox="0 0 24 24"
    //                   fill="none"
    //                 >
    //                   <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    //                   <g
    //                     id="SVGRepo_tracerCarrier"
    //                     stroke-linecap="round"
    //                     stroke-linejoin="round"
    //                   ></g>
    //                   <g id="SVGRepo_iconCarrier">
    //                     {" "}
    //                     <path
    //                       d="M6 12H18M12 6V18"
    //                       stroke="#ffffff"
    //                       stroke-width="2"
    //                       stroke-linecap="round"
    //                       stroke-linejoin="round"
    //                     ></path>{" "}
    //                   </g>
    //                 </svg>
    //               </button>
    //             </div>
    //           </div>
    //           <div className="col-span-2 flex justify-end p-8 pr-8">
    //             <button
    //               onClick={handleSubmit}
    //               type="button"
    //               className="rounded-md bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
    //             >
    //               Submit
    //             </button>
    //           </div>
    //         </form>
    //       </div>
    //     </div>
    //   </div>
    // </>
  );
};

export default AddShiftManagement;
