"use client";
import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { getStorePortalCartons, getDeviceTestByDeviceId } from "@/lib/api";
import {
    Package,
    Search,
    Filter,
    Eye,
    Calendar,
    Layers,
    Activity,
    ChevronRight,
    Clock,
    User,
    X,
    MapPin,
    CheckCircle2,
    AlertCircle,
    FileText,
    History,
    LayoutGrid,
    ArrowRight,
    RefreshCcw,
    Smartphone,
    ChevronDown,
    Terminal as TerminalIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FilterX
} from "lucide-react";

// Types
interface Device {
    _id: string;
    serialNo: string;
    modelName?: string;
    currentStage?: string;
    testRecords?: any[];
}

interface Carton {
    _id: string;
    cartonSerial: string;
    processName: string;
    processID: string;
    status: string;
    deviceCount: number;
    devices: Device[];
    createdAt: string;
    updatedAt: string;
}

type SortConfig = {
    key: keyof Carton | 'deviceCount';
    direction: 'asc' | 'desc';
};

export default function StorePortalPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cartons, setCartons] = useState<Carton[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [processFilter, setProcessFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'week', 'month'
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

    // Modal State
    const [selectedCarton, setSelectedCarton] = useState<Carton | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deviceHistory, setDeviceHistory] = useState<Record<string, any[]>>({});
    const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
    const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

    useEffect(() => {
        fetchCartons();
    }, []);

    // Close modal on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const fetchCartons = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getStorePortalCartons();
            if (response.success) {
                setCartons(response.data);
            } else {
                setError(response.message || "Failed to fetch cartons");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const isWithinDateRange = (dateString: string, range: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        switch (range) {
            case 'today':
                return date.toDateString() === now.toDateString();
            case 'week':
                return diff <= oneDay * 7;
            case 'month':
                return diff <= oneDay * 30;
            default:
                return true;
        }
    };

    const filteredAndSortedCartons = useMemo(() => {
        let result = cartons.filter(c => {
            const matchesSearch = c.cartonSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.devices.some(d => d.serialNo.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === "all" || c.status === statusFilter;
            const matchesProcess = processFilter === "all" || c.processName === processFilter;
            const matchesDate = dateFilter === "all" || isWithinDateRange(c.createdAt, dateFilter);
            return matchesSearch && matchesStatus && matchesProcess && matchesDate;
        });

        // Sorting
        result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [cartons, searchQuery, statusFilter, processFilter, dateFilter, sortConfig]);

    const uniqueProcesses = useMemo(() => {
        const pSet = new Set(cartons.map(c => c.processName));
        return Array.from(pSet);
    }, [cartons]);

    const handleSort = (key: keyof Carton | 'deviceCount') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleViewCarton = (carton: Carton) => {
        setSelectedCarton(carton);
        setIsModalOpen(true);
        setExpandedDevice(null);
        setDeviceHistory({});
    };

    const fetchHistory = async (deviceId: string) => {
        if (expandedDevice === deviceId) {
            setExpandedDevice(null);
            return;
        }

        if (deviceHistory[deviceId]) {
            setExpandedDevice(deviceId);
            return;
        }

        setLoadingHistory(deviceId);
        try {
            const response = await getDeviceTestByDeviceId(deviceId);
            if (response.success) {
                setDeviceHistory(prev => ({ ...prev, [deviceId]: response.data }));
                setExpandedDevice(deviceId);
            }
        } catch (err) {
            console.error("Error fetching device history", err);
        } finally {
            setLoadingHistory(null);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "STOCKED":
                return <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 w-fit border border-emerald-200/50 backdrop-blur-sm shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> STOCKED</span>;
            case "FG_TO_STORE":
                return <span className="bg-amber-100/80 text-amber-700 px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 w-fit border border-amber-200/50 backdrop-blur-sm shadow-sm"><Activity className="w-3.5 h-3.5 animate-pulse" /> IN TRANSIT</span>;
            default:
                return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[11px] font-black w-fit border border-slate-200 shadow-sm">{status}</span>;
        }
    };

    const resetFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setProcessFilter("all");
        setDateFilter("all");
    };

    return (
        <DefaultLayout>
            <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 lg:p-10 space-y-10">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <Breadcrumb pageName="Store Portal" parentName="Management" />
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Layers className="w-10 h-10 text-indigo-600" />
                            Warehouse Inventory
                        </h1>
                        <p className="text-slate-500 font-bold text-lg max-w-2xl">Manage and monitor device flow from Finished Goods to central storage systems.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchCartons}
                            className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-black shadow-sm border-b-4 border-slate-200 active:border-b-0 active:translate-y-1"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} text-indigo-500`} />
                            Refresh Dashboard
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Receipts', val: cartons.length, icon: Package, color: 'indigo', sub: 'Cumulative units recorded', subIcon: Activity },
                        { label: 'Awaiting Storage', val: cartons.filter(c => c.status === "FG_TO_STORE").length, icon: Activity, color: 'amber', sub: 'Packages in transit', subIcon: Clock },
                        { label: 'In Inventory', val: cartons.filter(c => c.status === "STOCKED").length, icon: CheckCircle2, color: 'emerald', sub: 'Verified in warehouse', subIcon: MapPin },
                        { label: 'Active Lines', val: uniqueProcesses.length, icon: LayoutGrid, color: 'slate', sub: 'Processes feeding store', subIcon: FileText },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white group hover:scale-[1.02] transition-all relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700`} />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                    <h3 className={`text-5xl font-black text-${stat.color === 'slate' ? 'slate-800' : stat.color + '-600'} mt-3 tracking-tighter`}>{stat.val}</h3>
                                </div>
                                <div className={`p-5 bg-${stat.color}-50 text-${stat.color}-600 rounded-[2rem] shadow-sm transform group-hover:rotate-12 transition-transform`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                            </div>
                            <div className={`mt-6 flex items-center gap-2 text-${stat.color}-600/70 font-black text-[11px] uppercase tracking-widest bg-${stat.color}-50/80 w-fit px-4 py-2 rounded-xl relative z-10`}>
                                <stat.subIcon className="w-4 h-4" /> {stat.sub}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col">

                    {/* Integrated Tool Bar */}
                    <div className="p-10 border-b border-slate-100 bg-white space-y-8 flex flex-col xl:flex-row xl:items-end xl:gap-6">

                        <div className="flex-1 space-y-3">
                            <label className="text-slate-400 font-black text-[11px] uppercase tracking-widest px-1">Deep Search</label>
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Serial tracking (Carton or Device)..."
                                    className="w-full pl-15 pr-8 py-5 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 font-bold text-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-4 shrink-0">
                            <div className="space-y-3">
                                <label className="text-slate-400 font-black text-[11px] uppercase tracking-widest px-1">Lifecycle</label>
                                <div className="relative">
                                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="pl-13 pr-10 py-5 bg-slate-50 rounded-[1.5rem] border-0 appearance-none focus:ring-8 focus:ring-indigo-50 transition-all font-black text-slate-700 cursor-pointer min-w-[180px]"
                                    >
                                        <option value="all">All States</option>
                                        <option value="FG_TO_STORE">In Transit</option>
                                        <option value="STOCKED">Storage</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-slate-400 font-black text-[11px] uppercase tracking-widest px-1">Origin Line</label>
                                <div className="relative">
                                    <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        value={processFilter}
                                        onChange={(e) => setProcessFilter(e.target.value)}
                                        className="pl-13 pr-10 py-5 bg-slate-50 rounded-[1.5rem] border-0 appearance-none focus:ring-8 focus:ring-indigo-50 transition-all font-black text-slate-700 cursor-pointer min-w-[220px]"
                                    >
                                        <option value="all">All Origins</option>
                                        {uniqueProcesses.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-slate-400 font-black text-[11px] uppercase tracking-widest px-1">Timeframe</label>
                                <div className="relative">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="pl-13 pr-10 py-5 bg-slate-50 rounded-[1.5rem] border-0 appearance-none focus:ring-8 focus:ring-indigo-50 transition-all font-black text-slate-700 cursor-pointer min-w-[180px]"
                                    >
                                        <option value="all">Unlimited</option>
                                        <option value="today">Today</option>
                                        <option value="week">Past 7 Days</option>
                                        <option value="month">Past 30 Days</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <button
                                onClick={resetFilters}
                                className="p-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[1.5rem] transition-all group"
                                title="Reset Filters"
                            >
                                <FilterX className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="px-6 relative">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">
                                        <th className="px-8 py-6 text-left cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('cartonSerial')}>
                                            <div className="flex items-center gap-2">Carton Unit {sortConfig.key === 'cartonSerial' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}</div>
                                        </th>
                                        <th className="px-8 py-6 text-left cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('processName')}>
                                            <div className="flex items-center gap-2">Origin Process {sortConfig.key === 'processName' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}</div>
                                        </th>
                                        <th className="px-8 py-6 text-left cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('deviceCount')}>
                                            <div className="flex items-center gap-2">Payload {sortConfig.key === 'deviceCount' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}</div>
                                        </th>
                                        <th className="px-8 py-6 text-left">Internal Status</th>
                                        <th className="px-8 py-6 text-left cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('createdAt')}>
                                            <div className="flex items-center gap-2">Entry Log {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}</div>
                                        </th>
                                        <th className="px-8 py-6 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="relative">
                                    {loading ? (
                                        [...Array(6)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-6 py-4"><div className="h-20 bg-slate-50 rounded-[2rem] w-full"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredAndSortedCartons.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200">
                                                        <Search className="w-16 h-16" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-2xl font-black text-slate-900">Void Reference</h4>
                                                        <p className="text-slate-400 font-bold max-w-sm mx-auto">The inventory system returned zero matches for the specific parameters provided.</p>
                                                    </div>
                                                    <button onClick={resetFilters} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">Clear All Parameters</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAndSortedCartons.map((carton) => (
                                            <tr key={carton._id} className="group cursor-default">
                                                <td className="px-8 py-6 bg-white border-y border-l border-slate-100 rounded-l-[2rem] group-hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                                                            <Package className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-slate-900 text-xl tracking-tight">{carton.cartonSerial}</p>
                                                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span> Ref: {carton._id.slice(-6).toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 bg-white border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                                    <div className="space-y-1.5">
                                                        <p className="font-black text-slate-700 text-base">{carton.processName}</p>
                                                        <p className="text-slate-400 text-[10px] flex items-center gap-1.5 font-black uppercase tracking-widest">
                                                            <Layers className="w-3.5 h-3.5" /> ID# {carton.processID}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 bg-white border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-end gap-1.5">
                                                            <p className="text-3xl font-black text-slate-900">{carton.deviceCount}</p>
                                                            <p className="text-slate-400 text-[10px] font-black uppercase mb-1.5">UNITS</p>
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(carton.deviceCount / 20) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 bg-white border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                                    {getStatusBadge(carton.status)}
                                                </td>
                                                <td className="px-8 py-6 bg-white border-y border-slate-100 group-hover:bg-slate-50 transition-colors">
                                                    <div className="space-y-1.5">
                                                        <p className="text-slate-800 font-black text-sm flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-slate-300" />
                                                            {formatDate(carton.createdAt).split(',')[0]}
                                                        </p>
                                                        <p className="text-slate-400 font-black font-mono text-[10px] uppercase tracking-wider">
                                                            Clocked: {formatDate(carton.createdAt).split(',')[1]}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 bg-white border-y border-r border-slate-100 rounded-r-[2rem] text-right group-hover:bg-slate-50 transition-colors">
                                                    <button
                                                        onClick={() => handleViewCarton(carton)}
                                                        className="inline-flex items-center gap-3 px-7 py-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-slate-800 transition-all font-black text-sm shadow-xl shadow-slate-900/10 group/btn"
                                                    >
                                                        Review History
                                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-10 mt-6 bg-slate-50/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <p className="text-slate-400 font-bold text-sm">Deployment Statistics</p>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                                <span className="text-slate-700 font-black text-xs uppercase tracking-wider">{filteredAndSortedCartons.length} Records Verified</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button disabled className="px-10 py-4 bg-white border-2 border-slate-100 text-slate-300 rounded-[1.5rem] text-sm font-black disabled:opacity-50 cursor-not-allowed">Previous Page</button>
                            <button disabled className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-sm font-black disabled:opacity-50 cursor-not-allowed shadow-lg shadow-indigo-100">Next Page</button>
                        </div>
                    </div>
                </div>

                {/* Tracking Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden p-4 md:p-8 flex items-center justify-center">
                        <div
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500"
                            onClick={() => setIsModalOpen(false)}
                        />

                        <div className="relative bg-[#F8FAFC] w-full max-w-7xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in slide-in-from-bottom-12 duration-500 flex flex-col max-h-[95vh] border border-white/20">

                            {/* Modal Header Overlay */}
                            <div className="px-10 py-10 border-b border-slate-100 bg-white shrink-0 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"></div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 ring-8 ring-indigo-50">
                                            <Package className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tighter">
                                                Package {selectedCarton?.cartonSerial}
                                            </h3>
                                            <div className="flex items-center gap-6">
                                                <p className="text-slate-400 font-bold flex items-center gap-2">
                                                    <Layers className="w-4 h-4" /> {selectedCarton?.processName} Deployment
                                                </p>
                                                <span className="w-2 h-2 bg-slate-200 rounded-full"></span>
                                                <p className="text-indigo-600 font-black flex items-center gap-2 uppercase tracking-widest text-xs">
                                                    <CheckCircle2 className="w-4 h-4" /> {selectedCarton?.deviceCount} Units Verified
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center group"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        <X className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body Scroll Container */}
                            <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC] custom-scrollbar">
                                <div className="grid grid-cols-1 gap-10">
                                    {selectedCarton?.devices.map((device, idx) => (
                                        <div key={device._id} className={`bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 overflow-hidden border-2 transition-all duration-500 ${expandedDevice === device._id ? 'border-indigo-500 ring-8 ring-indigo-50' : 'border-transparent hover:border-slate-200'}`}>

                                            {/* Device Summary Tile */}
                                            <div className="p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 ${expandedDevice === device._id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' : 'bg-slate-50 text-slate-300'}`}>
                                                        <Smartphone className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-4">
                                                            <h4 className="font-black text-slate-900 text-3xl tracking-tighter uppercase">{device.serialNo}</h4>
                                                            <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> {idx + 1} / {selectedCarton.deviceCount}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                                            {device.modelName || 'Standard Production Unit'} <span className="text-slate-200">|</span> <Activity className="w-4 h-4" /> Ready for Deployment
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="hidden xl:block text-right pr-6 border-r border-slate-100">
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Last Checkpoint</p>
                                                        <p className="text-slate-700 font-black text-base uppercase tracking-tighter">{selectedCarton.status.replace(/_/g, ' ')}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => fetchHistory(device._id)}
                                                        disabled={loadingHistory === device._id}
                                                        className={`flex items-center gap-3 px-10 py-5 rounded-3xl font-black text-sm transition-all shadow-2xl ${expandedDevice === device._id
                                                            ? 'bg-slate-900 text-white shadow-slate-900/40'
                                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-indigo-100'
                                                            }`}
                                                    >
                                                        {loadingHistory === device._id ? (
                                                            <RefreshCcw className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <History className={`w-5 h-5 ${expandedDevice === device._id ? 'rotate-180' : ''} transition-transform duration-500`} />
                                                        )}
                                                        {expandedDevice === device._id ? 'Hide Audit Log' : 'Review Audit Log'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Detailed Component Timeline */}
                                            {expandedDevice === device._id && (
                                                <div className="px-10 py-12 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-10 duration-500">
                                                    {deviceHistory[device._id]?.length === 0 ? (
                                                        <div className="text-center py-20 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100">
                                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                                <AlertCircle className="w-10 h-10 text-slate-200" />
                                                            </div>
                                                            <p className="text-slate-400 font-black text-xl tracking-tight">Zero tracking history logged.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="relative pb-10">
                                                            {/* High Precision Vertical Line */}
                                                            <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-indigo-200 to-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)]" />

                                                            <div className="space-y-16 relative">
                                                                {deviceHistory[device._id]?.map((step, sIdx) => (
                                                                    <div key={sIdx} className="flex gap-12 group/step relative">

                                                                        {/* Time Marker Overlay */}
                                                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full text-right pr-6 hidden 2xl:block opacity-0 group-hover/step:opacity-100 transition-opacity">
                                                                            <p className="text-slate-900 font-black text-xs whitespace-nowrap">{formatDate(step.createdAt).split(',')[0]}</p>
                                                                            <p className="text-slate-400 font-bold text-[10px]">{formatDate(step.createdAt).split(',')[1]}</p>
                                                                        </div>

                                                                        {/* High Impact Icon Node */}
                                                                        <div className={`relative z-10 w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 ring-[12px] ring-slate-50 group-hover/step:scale-125 ${step.status === "Pass" ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'
                                                                            }`}>
                                                                            {step.status === "Pass" ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                                                                        </div>

                                                                        {/* Enhanced Step Content Block */}
                                                                        <div className="flex-1 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/30 border border-white hover:border-indigo-100 transition-all space-y-6">
                                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <h5 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{step.stageName}</h5>
                                                                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${step.status === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{step.status}ed</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-6 mt-3">
                                                                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                                                                                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><User className="w-3 h-3" /></div>
                                                                                            By {step.operatorId || 'Autonomous Jig'}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                                                                                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Clock className="w-3.5 h-3.5" /></div>
                                                                                            Duration: {step.timeConsumed || '0'}s
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-left md:text-right bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
                                                                                    <p className="text-slate-900 font-black text-sm">{formatDate(step.createdAt).split(',')[0]}</p>
                                                                                    <p className="text-slate-400 font-black font-mono text-[10px] mt-1 uppercase">{formatDate(step.createdAt).split(',')[1]}</p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Futuristic Terminal Logs */}
                                                                            {step.logs && step.logs.length > 0 && (
                                                                                <div className="bg-slate-950 rounded-[2rem] p-8 font-mono text-[12px] text-emerald-400/80 shadow-inner relative group/logs max-h-60 overflow-y-auto custom-scrollbar border border-slate-800">
                                                                                    <div className="sticky top-0 right-0 left-0 bg-slate-950 pb-4 mb-4 flex items-center justify-between border-b border-white/10 z-20">
                                                                                        <div className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.25em] text-[9px]">
                                                                                            <span className="flex gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500/50"></span><span className="w-2 h-2 rounded-full bg-amber-500/50"></span><span className="w-2 h-2 rounded-full bg-emerald-500/50"></span></span>
                                                                                            Execution Sequence Data
                                                                                        </div>
                                                                                        <TerminalIcon className="w-4 h-4 text-slate-700" />
                                                                                    </div>
                                                                                    <div className="space-y-1.5 pt-2">
                                                                                        {step.logs.map((log: any, lIdx: number) => (
                                                                                            <div key={lIdx} className="flex gap-4 opacity-70 hover:opacity-100 transition-opacity">
                                                                                                <span className="text-slate-700 font-black w-6 text-right select-none">{String(lIdx + 1).padStart(2, '0')}</span>
                                                                                                <span className="leading-relaxed whitespace-pre-wrap">{typeof log === 'string' ? log : JSON.stringify(log, null, 2)}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Sticky Access Bar */}
                            <div className="bg-white px-10 py-10 flex flex-col sm:flex-row gap-8 items-center justify-between border-t border-slate-100 shrink-0 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-30">
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="p-4 bg-emerald-50 rounded-3xl flex items-center gap-3 pr-8">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200"><MapPin className="w-6 h-6" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Global Location</p>
                                            <p className="text-slate-900 font-black text-lg tracking-tight mt-1">{selectedCarton?.status === 'STOCKED' ? 'CENTRAL WAREHOUSE A-1' : 'IN TRANSIT LOGISTICS'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-indigo-50 rounded-3xl flex items-center gap-3 pr-8">
                                        <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"><Calendar className="w-6 h-6" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">Sync Status</p>
                                            <p className="text-slate-900 font-black text-lg tracking-tight mt-1">Real-time Verified</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="w-full sm:w-auto px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/30 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Finish Review
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 10px;
                        height: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(241, 245, 249, 0.5);
                        border-radius: 20px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #CBD5E1;
                        border-radius: 20px;
                        border: 3px solid transparent;
                        background-clip: content-box;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #94A3B8;
                        border: 2px solid transparent;
                        background-clip: content-box;
                    }
                    
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                    }
                    .animate-float {
                        animation: float 4s ease-in-out infinite;
                    }
                `}</style>

            </div>
        </DefaultLayout>
    );
}
