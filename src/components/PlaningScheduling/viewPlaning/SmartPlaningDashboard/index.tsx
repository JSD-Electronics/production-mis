"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { usePlaningData } from "./hooks/usePlaningData";
import KPICards from "./components/KPICards";
import GanttSchedule from "./components/GanttSchedule";
import ProductionTable from "./components/ProductionTable";
import AnalyticsPanel from "./components/AnalyticsPanel";
import FloorView from "./components/FloorView";
import {
    FiRefreshCcw,
    FiDownload,
    FiMenu,
    FiLayout,
    FiList,
    FiActivity,
    FiGrid
} from "react-icons/fi";
import Loader from "@/components/common/Loader";

const SmartPlaningDashboard = () => {
    const { id } = useParams();
    const {
        loading,
        planData,
        kpiStats,
        refresh,
        selectedProcess,
        overallUPHA,
        selectedRoom,
        assignedStages
    } = usePlaningData(id);
    const [activeTab, setActiveTab] = useState<"timeline" | "table" | "floor">("timeline");
    const [showAnalytics, setShowAnalytics] = useState(false);

    if (loading) return <Loader />;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-boxdark-2 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        Planning & Scheduling Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Process: <span className="font-semibold text-primary">{planData?.processName || "N/A"}</span> |
                        Order: <span className="font-semibold text-primary">{selectedProcess?.orderNo || "N/A"}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-opacity-80 transition-all shadow-sm"
                    >
                        <FiRefreshCcw className="text-primary" />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all shadow-md">
                        <FiDownload />
                        Export Data
                    </button>
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${showAnalytics ? "bg-meta-3 text-white" : "bg-white dark:bg-boxdark border border-stroke dark:border-strokedark"
                            }`}
                    >
                        <FiActivity />
                        Insights
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <KPICards stats={kpiStats} />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col gap-6 transition-all duration-300 ${showAnalytics ? "lg:w-3/4" : "w-full"}`}>
                    {/* View Toggle Tabs */}
                    <div className="flex items-center gap-1 bg-white dark:bg-boxdark p-1 rounded-xl border border-stroke dark:border-strokedark w-fit shadow-sm">
                        <button
                            onClick={() => setActiveTab("timeline")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "timeline" ? "bg-primary text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-meta-4"
                                }`}
                        >
                            <FiLayout />
                            Timeline View
                        </button>
                        <button
                            onClick={() => setActiveTab("table")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "table" ? "bg-primary text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-meta-4"
                                }`}
                        >
                            <FiList />
                            Table View
                        </button>
                        <button
                            onClick={() => setActiveTab("floor")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "floor" ? "bg-primary text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-meta-4"
                                }`}
                        >
                            <FiGrid />
                            Floor Layout
                        </button>
                    </div>

                    {/* Dynamic Section Rendering */}
                    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden min-h-[400px]">
                        {activeTab === "timeline" && <GanttSchedule data={overallUPHA} />}
                        {activeTab === "table" && <ProductionTable data={overallUPHA} />}
                        {activeTab === "floor" && <FloorView room={selectedRoom} assignedStages={assignedStages} />}
                    </div>
                </div>

                {/* Floating/Collapsible Analytics Panel */}
                {showAnalytics && (
                    <div className="lg:w-1/4 animate-fade-in">
                        <AnalyticsPanel onClose={() => setShowAnalytics(false)} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartPlaningDashboard;
