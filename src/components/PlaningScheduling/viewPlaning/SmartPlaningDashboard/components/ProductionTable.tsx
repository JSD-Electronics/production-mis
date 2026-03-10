"use client";
import React, { useState } from "react";
import {
    FiSearch,
    FiChevronDown,
    FiChevronUp,
    FiExternalLink
} from "react-icons/fi";

interface ProductionTableProps {
    data: any[];
}

const ProductionTable: React.FC<ProductionTableProps> = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const toggleRow = (idx: number) => {
        setExpandedRows(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const mainData = data.filter(row => row.hour !== "Total Count" && row.hour !== "Avg UPH");

    // Extract stage headers from the first row of data
    const stageHeaders = mainData.length > 0 ? mainData[0].values.map((v: any) => v.stage) : [];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-boxdark">
            {/* Table Toolbar */}
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stroke dark:border-strokedark bg-gray-50/50">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search hours..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-meta-4 outline-none focus:border-primary transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto relative max-h-[600px]">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-meta-4 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Time Interval</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                            {stageHeaders.map((header: string, i: number) => (
                                <th key={i} className="px-6 py-3 text-xs font-bold uppercase text-gray-500 tracking-wider text-center">{header}</th>
                            ))}
                            <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke dark:divide-strokedark">
                        {mainData.filter(r => r.hour.includes(searchTerm)).map((row, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleRow(idx)} className="p-1 hover:bg-white rounded border border-stroke dark:border-strokedark">
                                                {expandedRows.includes(idx) ? <FiChevronUp /> : <FiChevronDown />}
                                            </button>
                                            <div>
                                                <span className="text-sm font-semibold text-black dark:text-white">{row.hour}</span>
                                                {row.isBreak && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">Break</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${row.status === "current" ? "bg-green-100 text-green-700 font-bold" :
                                            row.status === "past" ? "bg-blue-100 text-blue-700" :
                                                "bg-gray-100 text-gray-600"
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    {row.values.map((v: any, vIdx: number) => (
                                        <td key={vIdx} className="px-6 py-4 text-center">
                                            {!row.isBreak ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-black dark:text-white">{v.Pass}</span>
                                                    <span className="text-[10px] text-gray-500">Target: {v.targetUPH}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">--</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary" title="Details">
                                            <FiExternalLink size={16} />
                                        </button>
                                    </td>
                                </tr>
                                {/* Expanded Content: Show all stages */}
                                {expandedRows.includes(idx) && (
                                    <tr className="bg-gray-50 dark:bg-meta-4/20 animate-fade-in">
                                        <td colSpan={6} className="px-10 py-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                {row.values.map((v: any, vIdx: number) => (
                                                    <div key={vIdx} className="bg-white dark:bg-boxdark p-4 rounded-xl border border-stroke dark:border-strokedark shadow-sm flex flex-col gap-1">
                                                        <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-tighter truncate">{v.stage}</p>
                                                        <div className="flex items-end justify-between">
                                                            <span className="text-xl font-black text-black dark:text-white">{v.Pass}</span>
                                                            <div className="flex flex-col text-right">
                                                                <span className="text-[10px] text-meta-3 font-bold">NG: {v.NG}</span>
                                                                <span className="text-[10px] text-gray-400">T: {v.targetUPH}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 h-1 w-full bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${v.Pass >= v.targetUPH ? "bg-meta-3" : "bg-primary"}`}
                                                                style={{ width: `${Math.min(100, (v.Pass / (v.targetUPH || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductionTable;
