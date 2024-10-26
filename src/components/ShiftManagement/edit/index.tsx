"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import  React,{useState } from "react";
import { updateShift,getShift } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckboxOne from "@/components/Checkboxes/CheckboxOne";

const EditShiftManagement = () => {
  const [name, setName] = useState("");
  const [descripition,setDescripition] = useState("");
  const [weekDays, setWeekDays] = useState({
    sun: false,
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
  });
  const [startTime,setStartTime] = useState("00:00");
  const [endTime,setEndTime] = useState("00:00");
  React.useEffect(()=>{
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getShiftByID(id);
  },[])
  const getShiftByID = async (id:any) =>{
    try{
      let result = await getShift(id);
      setName(result.name);
      setDescripition(result.descripition);
      setStartTime(result.startTime);
      setEndTime(result.endTime);
      setWeekDays(result.weekDays);
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");  
    }
  };
  const handleCheckboxChange = (day) => {
    setWeekDays((prevDays) => ({
      ...prevDays,
      [day]: !prevDays[day],
    }));
  };
  const handleSubmit = async (e: any) => {
    // return;
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    e.preventDefault();
    try {
      const formData = {
        name,
        startTime,
        endTime,
        descripition,
        weekDays
      };

      const result = await updateShift(formData,id);
      toast.success("User details Updated successfully!");
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");
    }
  };

  return (
    <>
      <Breadcrumb parentName="Shift Management" pageName="Edit Shift" />
      <div className="grid gap-9">
        <ToastContainer
          position="top-center"
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex flex-col gap-9">
          <div className="rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Edit Shift
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-1">
                {/* Operator Name Field */}
                <div className="space-x-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Name
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
              <div className="grid gap-6 px-8 pr-8 pt-4 sm:grid-cols-2">
                <div>
                  <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
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
                  <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
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
              <div className=" px-8 pr-8 pt-4">
                <label className="text-gray-900 mb-2 block text-sm font-medium dark:text-white">
                    Days Of Week
                </label>
              </div>
              <div className="grid gap-2 px-8 pr-8 pt-4 sm:grid-cols-12">

                {Object.keys(weekDays).map((day) => (
                    <CheckboxOne
                    key={day}
                    id={day}
                    value={day}
                    checked={weekDays[day]}
                    setValue={() => handleCheckboxChange(day)}
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                    />
                ))}
              </div>
              <div className="px-8 pr-8 pt-4">
                <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Description
                    </label>
                    <textarea
                    rows={6}
                    value={descripition}
                    onChange={(e) => setDescripition(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-lg border-[1.5px] border-primary bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input dark:text-white"
                    ></textarea>
                </div>
              </div>
              {/* Submit Button */}
              <div className="col-span-2 flex justify-end p-8 pr-8">
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditShiftManagement;
