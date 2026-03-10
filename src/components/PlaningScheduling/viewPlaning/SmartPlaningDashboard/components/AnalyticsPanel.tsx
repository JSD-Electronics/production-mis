"use client";
import React from "react";
import {
    FiX,
    FiAlertTriangle,
    FiTrendingUp,
    FiBarChart2,
    FiTarget,
    FiZap
} from "react-icons/fi";

interface AnalyticsPanelProps {
    onClose: () => void;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ onClose }) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-lg overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex items-center justify-between bg-primary/5">
                <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                    <FiZap className="text-meta-6" />
                    Production Insights
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition-all"
                >
                    <FiX />
                </button>
            </div>

            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                {/* Section: Critical Alerts */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FiAlertTriangle className="text-meta-1" />
                        Active Bottlenecks
                    </h4>
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-meta-1 rounded-r-lg">
                        <p className="text-sm font-bold text-meta-1">Stage 4: Quality Check</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Current UPH is 25% below target. Large queue forming at input.
                        </p>
                    </div>
                </div>

                {/* Section: Distribution */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FiBarChart2 className="text-primary" />
                        Workload Distribution
                    </h4>
                    <div className="flex flex-col gap-4">
                        {[
                            { label: "Assembly", value: 85, color: "bg-primary" },
                            { label: "Testing", value: 62, color: "bg-meta-3" },
                            { label: "Packaging", value: 45, color: "bg-meta-6" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span>{item.label}</span>
                                    <span>{item.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Performance Trends */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FiTrendingUp className="text-meta-3" />
                        Efficiency Trends
                    </h4>
                    <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-xl text-center border border-dashed border-stroke dark:border-strokedark">
                        <p className="text-xs text-gray-500 italic">
                            Average efficiency has improved by 12% compared to the last shift.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-meta-3">+12.4%</span>
                            <FiTrendingUp className="text-meta-3" />
                        </div>
                    </div>
                </div>

                {/* Section: Targets */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FiTarget className="text-meta-5" />
                        Shift Target Progress
                    </h4>
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                    Target: 5000 Units
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-blue-600">
                                    75%
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
