"use client";

import React, { useState, useEffect } from "react";
import { getFGInventory, getUseTypeByType } from "@/lib/api";
import {
    Package,
    Box,
    ChevronDown,
    ChevronRight,
    Database,
    Search,
    ArrowLeft,
    LayoutGrid,
    ClipboardList
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FGInventoryView = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedProcesses, setExpandedProcesses] = useState<string[]>([]);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        checkPermission();
        fetchData();
    }, []);

    const checkPermission = async () => {
        try {
            const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
            const userType = userDetails.userType;

            if (!userType) {
                router.push("/");
                return;
            }

            if (userType.toLowerCase() === "admin") {
                setHasPermission(true);
                return;
            }

            const result = await getUseTypeByType();
            const permissions = result.userType[0].roles;
            const normalizedUserType = userType.toLowerCase().replace(/\s+/g, "_");

            const permitted = permissions["fg_to_store"]?.[normalizedUserType];

            if (!permitted) {
                toast.error("You do not have permission to access this page.");
                router.push("/dashboard");
            } else {
                setHasPermission(true);
            }
        } catch (error) {
            console.error("Permission check failed:", error);
            router.push("/dashboard");
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await getFGInventory();
            if (result.success) {
                setData(result.data);
                // Initially expand processes that have cartons
                const initiallyExpanded = result.data
                    .filter((p: any) => p.cartons && p.cartons.length > 0)
                    .map((p: any) => p._id);
                setExpandedProcesses(initiallyExpanded);
            }
        } catch (error) {
            console.error("Error fetching FG inventory:", error);
            toast.error("Failed to fetch FG inventory");
        } finally {
            setLoading(false);
        }
    };

    const toggleProcess = (id: string) => {
        setExpandedProcesses(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const filteredData = data.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.processID.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (hasPermission === null) return null;
    if (hasPermission === false) return null;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Database className="text-primary" />
                        FG to Store Inventory
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">View produced devices ready for stock transfer per process.</p>
                </div>
                <button
                    onClick={() => router.push("/inventory/view")}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-white"
                >
                    <ArrowLeft size={16} />
                    Back to Inventory
                </button>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Process Name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all dark:border-strokedark dark:bg-boxdark dark:text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <BallTriangle height={80} width={80} color="#3c50e0" />
                </div>
            ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-white border border-dashed border-gray-300 dark:bg-boxdark dark:border-strokedark">
                    <ClipboardList size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No FG inventory found at this stage.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredData.map((process) => {
                        const isExpanded = expandedProcesses.includes(process._id);
                        const totalDevices = process.cartons?.reduce((sum: number, c: any) => sum + (c.devices?.length || 0), 0) || 0;

                        return (
                            <div key={process._id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-boxdark">
                                <div
                                    className={`flex cursor-pointer items-center justify-between p-5 transition hover:bg-gray-50 dark:hover:bg-meta-4 ${isExpanded ? 'border-b border-gray-100 dark:border-strokedark' : ''}`}
                                    onClick={() => toggleProcess(process._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <LayoutGrid size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{process.name}</h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="font-mono">{process.processID}</span>
                                                <span>•</span>
                                                <span>{process.cartons?.length || 0} Cartons</span>
                                                <span>•</span>
                                                <span className="font-bold text-emerald-600">{totalDevices} Devices</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${process.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {process.status}
                                        </span>
                                        {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-gray-50/50 p-5 space-y-4 dark:bg-meta-4/20">
                                        {(!process.cartons || process.cartons.length === 0) ? (
                                            <p className="text-center py-4 text-sm text-gray-400 italic">No cartons ready for store transfer in this process.</p>
                                        ) : (
                                            process.cartons.map((carton: any) => (
                                                <div key={carton._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
                                                    <div className="mb-4 flex items-center justify-between border-b border-gray-50 pb-3 dark:border-strokedark">
                                                        <div className="flex items-center gap-2">
                                                            <Box size={18} className="text-amber-500" />
                                                            <span className="font-bold text-gray-700 dark:text-gray-200">{carton.cartonSerial}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500">
                                                            {carton.devices?.length} Devices
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                        {carton.devices?.map((device: any) => (
                                                            <div key={device._id} className="flex flex-col rounded-lg bg-gray-50 p-2.5 transition hover:bg-gray-100 dark:bg-meta-4 dark:hover:bg-opacity-50">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Serial Number</span>
                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{device.serialNo}</span>
                                                                {device.imeiNo && (
                                                                    <>
                                                                        <span className="mt-1 text-[10px] font-bold text-gray-400 uppercase">IMEI</span>
                                                                        <span className="text-xs text-gray-600 dark:text-gray-400">{device.imeiNo}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default FGInventoryView;
