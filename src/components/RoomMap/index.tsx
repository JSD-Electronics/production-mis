"use client"; // Needed for client-side rendering in Next.js 13+

import { useState } from "react";
import { createRoomPlan } from "../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RoomMap = () => {
  const [layout, setLayout] = useState([]);
  const [floorName, setFloorName] = useState("");
  const [rowName, setRowName] = useState("");
  const [seats, setSeats] = useState(0);
  const [errors, setErrors] = useState({
    floorName: false,
    rowName: false,
    seats: false,
    layout: false,
  });

  const handleAddRow = () => {
    const newErrors = { rowName: false, seats: false };

    if (!rowName) {
      newErrors.rowName = true;
    }

    if (seats <= 0) {
      newErrors.seats = true;
    }

    setErrors({ ...errors, ...newErrors });

    // Add row only if there are no errors
    if (!newErrors.rowName && !newErrors.seats) {
      const newRow = {
        rowName: rowName,
        seats: Array.from({ length: seats }, (_, seatIndex) => ({
          seatNumber: seatIndex + 1,
          selected: false,
          reserved: Math.random() > 0.8,
        })),
      };

      setLayout((prevLayout) => [...prevLayout, newRow]);
      setRowName("");
      setSeats(0);
    }
  };

  const submitForm = async () => {
    const formErrors = {
      floorName: !floorName,
      layout: layout.length === 0,
    };

    setErrors(formErrors);

    if (formErrors.floorName || formErrors.layout) {
      toast.error("Please fill out all required fields and add at least one row.");
      return;
    }

    const formData = new FormData();
    formData.append("floorName", floorName);
    formData.append("lines", JSON.stringify(layout));
    try {
      const result = await createRoomPlan(formData);
      if (result && result.status === 200) {
        toast.success("Stage created successfully!!");
      } else {
        throw new Error(result.message || "Failed to create stage");
      }
    } catch (error) {
      toast.error(
        error?.message || "An error occurred while creating the stage.",
      );
    }
  };

  const toggleSeatSelection = (rowIndex: any, seatIndex: any) => {
    const updatedLayout = [...layout];
    const seat = updatedLayout[rowIndex].seats[seatIndex];

    if (!seat.reserved) {
      seat.selected = !seat.selected;
      updatedLayout[rowIndex].seats[seatIndex] = seat;
      setLayout(updatedLayout);
    }
  };

  const handleRemoveRow = (rowIndex: any) => {
    const updatedLayout = layout.filter((_, index) => index !== rowIndex);
    setLayout(updatedLayout);
  };

  return (
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
              Room Mapping
            </h3>
          </div>
          <div className="p-8 pr-8">
            <div className="mb-4 space-x-4">
              <div className="pl-4">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Floor Name
                </label>
                <input
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  placeholder="Enter Floor Name"
                  className={`w-full rounded-lg border-[1.5px] px-5 py-3 text-black outline-none transition focus:border-primary 
                    ${errors.floorName ? "border-red-500" : "border-stroke"} 
                    dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                />
                {errors.floorName && (
                  <p className="text-red-500 text-sm">Floor name is required</p>
                )}
              </div>
              <div className="pt-4">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Line Name:
                </label>
                <input
                  type="text"
                  value={rowName}
                  onChange={(e) => setRowName(e.target.value)}
                  placeholder="Enter Row Name"
                  className={`w-full rounded-lg border-[1.5px] px-5 py-3 text-black outline-none transition focus:border-primary 
                    ${errors.rowName ? "border-red-500" : "border-stroke"} 
                    dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                />
                {errors.rowName && (
                  <p className="text-red-500 text-sm">Line name is required</p>
                )}
              </div>
              <div className="pt-4">
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Seats Per Line:
                </label>
                <input
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  placeholder="Enter number of seats"
                  className={`w-full rounded-lg border-[1.5px] px-5 py-3 text-black outline-none transition focus:border-primary 
                    ${errors.seats ? "border-red-500" : "border-stroke"} 
                    dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                />
                {errors.seats && (
                  <p className="text-red-500 text-sm">Seats must be greater than 0</p>
                )}
              </div>
              <div className="text-end">
                <button
                  onClick={handleAddRow}
                  className="mt-6 rounded-md bg-blue-700 px-6 py-2 text-white transition hover:bg-blue-700"
                >
                  Add Line
                </button>
              </div>
            </div>

            {/* Render the layout */}
            <div className="mt-8 space-y-6">
              {layout.map((row, rowIndex) => (
                <div key={rowIndex}>
                  {/* Row Label */}
                  <div className="mb-3 flex items-center justify-between text-xl font-bold">
                    {row.rowName}
                    {/* Add the Remove Row button with SVG icon */}
                    <button
                      onClick={() => handleRemoveRow(rowIndex)}
                      className="ml-4 flex items-center rounded-md bg-danger px-2 py-2 text-white transition hover:bg-danger"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    {row.seats.map((seat: any, seatIndex: any) => (
                      <div
                        key={seatIndex}
                        className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-boxdark text-white`}
                        onClick={() => toggleSeatSelection(rowIndex, seatIndex)}
                        title={seat.reserved ? "Reserved" : "Available"}
                      >
                        S{seat.seatNumber}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-end">
                <button
                  onClick={submitForm}
                  className="mt-6 rounded-md bg-blue-700 px-6 py-2 text-white transition hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomMap;
