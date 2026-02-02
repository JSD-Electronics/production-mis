"use client";

import React, { useState, useEffect } from "react";
import { updateRoomPlan, getRoomPlanById } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Trash2, Save, LayoutGrid, Square } from "lucide-react";

const EditRoomMap = () => {
  const [layout, setLayout] = useState<any[]>([]);
  const [floorName, setFloorName] = useState("");
  const [rowName, setRowName] = useState("");
  const [seats, setSeats] = useState<number>(0);
  const [errors, setErrors] = useState({
    floorName: false,
    rowName: false,
    seats: false,
    layout: false,
  });

  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    getRoomPlan(id);
  }, []);

  const getRoomPlan = async (id: string) => {
    try {
      const result = await getRoomPlanById(id);
      if (result) {
        setFloorName(result.floorName || "");
        setLayout(result.lines || []);
      }
    } catch (error) {
      console.error("Failed to fetch room plan:", error);
    }
  };

  const handleAddRow = () => {
    const newErrors = { rowName: !rowName, seats: seats <= 0 };
    setErrors({ ...errors, ...newErrors });

    if (!newErrors.rowName && !newErrors.seats) {
      const newRow = {
        rowName,
        seats: Array.from({ length: seats }, (_, i) => ({
          seatNumber: i + 1,
          selected: false,
        })),
      };
      setLayout((prev) => [...prev, newRow]);
      setRowName("");
      setSeats(0);
    }
  };

  const submitForm = async () => {
    const formErrors = { floorName: !floorName, layout: layout.length === 0 };
    setErrors(formErrors);

    if (formErrors.floorName || formErrors.layout) {
      toast.error("Please fill out all required fields and add at least one line.");
      return;
    }

    const pathname = window.location.pathname;
    const id = pathname.split("/").pop();
    const formData = new FormData();
    formData.append("floorName", floorName);
    formData.append("lines", JSON.stringify(layout));

    try {
      const result = await updateRoomPlan(formData, id);
      if (result?.status === 200) toast.success("Room Plan updated successfully!");
      else throw new Error(result?.message || "Failed to update room plan");
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while updating the room plan.");
    }
  };

  const toggleSeatSelection = (rowIndex: number, seatIndex: number) => {
    setLayout((prev) => {
      const updated = [...prev];
      updated[rowIndex].seats[seatIndex].selected =
        !updated[rowIndex].seats[seatIndex].selected;
      return updated;
    });
  };

  const handleRemoveRow = (rowIndex: number) => {
    setLayout((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  return (
    <div className="grid gap-8">
      <ToastContainer position="top-center" closeOnClick pauseOnFocusLoss draggable pauseOnHover />

      {/* Floor & Row Inputs */}
      <div className="rounded-2xl border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark p-6 space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-primary" /> Edit Room Plan
        </h3>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          {/* Floor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Floor Name
            </label>
            <input
              type="text"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              placeholder="Enter Floor Name"
              className={`w-full rounded-xl border px-4 py-2 text-gray-900 dark:text-white outline-none transition focus:ring-2 focus:ring-primary focus:border-primary
                ${errors.floorName ? "border-danger" : "border-stroke"} dark:border-form-strokedark dark:bg-form-input`}
            />
            {errors.floorName && <p className="text-danger text-sm mt-1">Floor name is required</p>}
          </div>

          {/* Line Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Line Name
            </label>
            <input
              type="text"
              value={rowName}
              onChange={(e) => setRowName(e.target.value)}
              placeholder="Enter Line Name"
              className={`w-full rounded-xl border px-4 py-2 text-gray-900 dark:text-white outline-none transition focus:ring-2 focus:ring-primary focus:border-primary
                ${errors.rowName ? "border-danger" : "border-stroke"} dark:border-form-strokedark dark:bg-form-input`}
            />
            {errors.rowName && <p className="text-danger text-sm mt-1">Line name is required</p>}
          </div>

          {/* Seats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seats Per Line
            </label>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              placeholder="Enter number of seats"
              className={`w-full rounded-xl border px-4 py-2 text-gray-900 dark:text-white outline-none transition focus:ring-2 focus:ring-primary focus:border-primary
                ${errors.seats ? "border-danger" : "border-stroke"} dark:border-form-strokedark dark:bg-form-input`}
            />
            {errors.seats && <p className="text-danger text-sm mt-1">Seats must be greater than 0</p>}
          </div>
        </div>

        {/* Add Line Button */}
        <div className="text-right">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white font-medium shadow hover:bg-primary-dark transition"
          >
            <Plus className="h-5 w-5" /> Add Line
          </button>
        </div>
      </div>

      {/* Layout Grid */}
      {layout.length > 0 && (
        <div className="rounded-2xl border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Room Layout</h3>
          {layout.map((row, rowIndex) => (
            <div key={rowIndex} className="space-y-3">
              <div className="flex items-center justify-between text-lg font-semibold">
                {row.rowName}
                <button
                  onClick={() => handleRemoveRow(rowIndex)}
                  className="flex items-center gap-1 rounded-md bg-danger px-3 py-1 text-white text-sm hover:bg-danger-dark transition"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
              {/* Horizontal scroll */}
              <div className="overflow-x-auto">
                <div className="grid grid-flow-col auto-cols-max gap-3 pb-2">
                  {row.seats.map((seat: any, seatIndex: number) => (
                    <div
                      key={seatIndex}
                      className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg text-white text-sm font-medium transition 
                        ${seat.selected ? "bg-green-600" : "bg-primary hover:bg-primary-dark"}`}
                      onClick={() => toggleSeatSelection(rowIndex, seatIndex)}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      {seat.seatNumber}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="text-right mt-4">
            <button
              onClick={submitForm}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white font-medium shadow hover:bg-primary-dark transition"
            >
              <Save className="h-5 w-5" /> Update Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRoomMap;
