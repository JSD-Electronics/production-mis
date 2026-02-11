"use client";

import React, { useState, useEffect } from "react";
import { updateRoomPlan, getRoomPlanById } from "../../../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Plus,
  Trash2,
  Save,
  LayoutGrid,
  Monitor,
  Smartphone,
  MapPin,
  Users,
  Box,
  Trash
} from "lucide-react";

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
    if (id) getRoomPlan(id);
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
        })),
      };
      setLayout((prev) => [...prev, newRow]);
      setRowName("");
      setSeats(0);
    }
  };

  const submitForm = async () => {
    const formErrors = {
      floorName: !floorName,
      layout: layout.length === 0,
      rowName: false,
      seats: false
    };
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
      if (result?.status === 200) {
        toast.success("Room layout updated successfully!");
        window.location.href = "/roomMapping/view";
      } else throw new Error(result?.message || "Failed to update room plan");
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while updating the room plan.");
    }
  };

  const handleRemoveRow = (rowIndex: number) => {
    setLayout((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header & Inputs */}
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-boxdark dark:ring-strokedark transition-all">
        <div className="mb-8 border-b border-gray-100 pb-6 dark:border-strokedark">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutGrid size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Edit Room Plan</h1>
              <p className="mt-0.5 text-[13px] text-gray-500 font-normal italic">Adjust floor levels, production lines, and workstation capacity.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Floor Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Floor Identification
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g. Ground Floor, Line-A"
                className={`w-full rounded-2xl border-2 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all dark:bg-form-input dark:text-white
                  ${errors.floorName ? "border-rose-500 bg-rose-50/50" : "border-gray-100 bg-gray-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"}`}
              />
            </div>
            {errors.floorName && <p className="text-[10px] font-bold text-rose-500 uppercase">Floor name is required</p>}
          </div>

          {/* Line Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Line Designation
            </label>
            <div className="relative">
              <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                value={rowName}
                onChange={(e) => setRowName(e.target.value)}
                placeholder="e.g. Line 01"
                className={`w-full rounded-2xl border-2 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all dark:bg-form-input dark:text-white
                  ${errors.rowName ? "border-rose-500 bg-rose-50/50" : "border-gray-100 bg-gray-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"}`}
              />
            </div>
            {errors.rowName && <p className="text-[10px] font-bold text-rose-500 uppercase">Line name is required</p>}
          </div>

          {/* Seats */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Station Capacity
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="number"
                value={seats || ""}
                onChange={(e) => setSeats(Number(e.target.value))}
                placeholder="Number of seats"
                className={`w-full rounded-2xl border-2 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 outline-none transition-all dark:bg-form-input dark:text-white
                  ${errors.seats ? "border-rose-500 bg-rose-50/50" : "border-gray-100 bg-gray-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"}`}
              />
            </div>
            {errors.seats && <p className="text-[10px] font-bold text-rose-500 uppercase">Input valid capacity</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleAddRow}
            className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Provision Line
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {layout.length > 0 && (
        <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-gray-100 dark:bg-boxdark dark:ring-strokedark">
          <div className="mb-10 flex items-center justify-between border-b border-gray-100 pb-6 dark:border-strokedark">
            <div>
              <h2 className="text-md font-black text-gray-700 dark:text-white uppercase tracking-tight">Spatial Architecture</h2>
              <p className="text-xs font-medium text-gray-500 italic">Live visualization of the room hierarchy and seat distribution.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 dark:bg-meta-4">
              <Monitor size={20} />
            </div>
          </div>

          <div className="space-y-10">
            {layout.map((row, rowIndex) => (
              <div key={rowIndex} className="relative rounded-2xl bg-gray-50 p-6 ring-1 ring-gray-200/50 transition hover:bg-gray-100/50 dark:bg-meta-4 dark:ring-white/5">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20">
                      <span className="text-xs font-black">{rowIndex + 1}</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{row.rowName}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveRow(rowIndex)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    title="Remove Line"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div className="overflow-x-auto p-1 custom-scrollbar">
                  <div className="flex flex-wrap gap-4">
                    {row.seats.map((seat: any, seatIndex: number) => (
                      <div
                        key={seatIndex}
                        className="group relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white bg-white shadow-md ring-1 ring-gray-200 transition-all hover:border-primary/20 hover:ring-primary dark:bg-boxdark dark:border-strokedark dark:ring-white/10"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors dark:bg-white/5">
                            <Smartphone size={14} />
                          </div>
                          <span className="text-[11px] font-black text-gray-700 dark:text-gray-200">{seat.seatNumber}</span>
                        </div>
                        {/* Desk Indicator */}
                        <div className="absolute -bottom-1 h-1 w-10 rounded-full bg-gray-200 group-hover:bg-primary transition-colors dark:bg-strokedark" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-end border-t border-gray-100 pt-8 dark:border-strokedark">
            <button
              onClick={submitForm}
              className="group inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-10 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95"
            >
              <Save className="h-5 w-5" />
              Update Room Mapping
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default EditRoomMap;
