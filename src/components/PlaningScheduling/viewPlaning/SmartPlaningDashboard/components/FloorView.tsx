"use client";
import React, { useState } from "react";
import {
    FiUsers,
    FiActivity,
    FiSearch,
    FiFilter
} from "react-icons/fi";

interface FloorViewProps {
    room: any;
    assignedStages: any;
}

const ProductionFloorView: React.FC<FloorViewProps> = ({ room, assignedStages }) => {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    if (!room) return <div className="p-8 text-center text-gray-500">No room layout available</div>;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-boxdark">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stroke dark:border-strokedark bg-gray-50/50">
                <div className="relative w-full md:w-80">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search seat or operator..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-meta-4 outline-none focus:border-primary transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-meta-3"></span> Active</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-meta-1"></span> Downtime</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Empty</span>
                    </div>
                </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[600px]">
                {room.lines?.map((line: any, lIdx: number) => (
                    <div key={lIdx} className="mb-8">
                        <h4 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest border-b pb-2">{line.rowName}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                            {line.seats?.map((seat: any, sIdx: number) => {
                                const coord = `${lIdx}-${sIdx}`;
                                const stages = assignedStages[coord] || [];
                                const isActive = stages.length > 0;

                                return (
                                    <div
                                        key={sIdx}
                                        className={`aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all cursor-pointer relative group ${isActive
                                                ? "border-primary bg-primary/5 hover:bg-primary/10 shadow-sm"
                                                : "border-gray-100 bg-gray-50/50 dark:border-strokedark dark:bg-meta-4/20 opacity-40"
                                            }`}
                                    >
                                        <span className={`text-[10px] font-black ${isActive ? "text-primary" : "text-gray-400"}`}>
                                            S{seat.seatNumber}
                                        </span>

                                        {isActive ? (
                                            <div className="flex flex-col items-center">
                                                <FiUsers className="text-primary mt-1" size={14} />
                                                <span className="text-[9px] font-bold text-center mt-1 truncate w-full">{stages[0].name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[18px] text-gray-200 dark:text-gray-700 font-bold">--</span>
                                        )}

                                        {/* Hover tooltip logic or quick view could go here */}
                                        {isActive && (
                                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-meta-3 rounded-full border-2 border-white dark:border-boxdark shadow-sm scale-0 group-hover:scale-100 transition-transform" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductionFloorView;
