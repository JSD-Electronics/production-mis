"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DataTable, { TableColumn } from "react-data-table-component";
import {
    ArrowLeft,
    Clock,
    Coffee,
    Calendar,
    Timer,
    User,
    FileText,
    Search,
    AlertCircle,
    ExternalLink,
    Briefcase
} from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { toast } from "react-toastify";
import moment from "moment-timezone";

import { getOperatorWorkSessions, getSessionWorkDetails } from "@/lib/api";
import Modal from "@/components/Modal/page";

const OperatorLogs = () => {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<any[]>([]);
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSessionDetails, setSelectedSessionDetails] = useState<any[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeSessionInfo, setActiveSessionInfo] = useState<any>(null);

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getOperatorWorkSessions(id, startDate, endDate);
            setSessions(result?.sessions || []);
        } catch (error: any) {
            console.error("Error fetching sessions:", error);
            toast.error(error?.message || "Failed to fetch logs.");
        } finally {
            setLoading(false);
        }
    }, [id, startDate, endDate]);

    const handleFetchDetails = async (session: any) => {
        try {
            setDetailLoading(true);
            setActiveSessionInfo(session);
            setIsDetailModalOpen(true);
            const result = await getSessionWorkDetails(session._id);
            setSelectedSessionDetails(result?.details || []);
        } catch (error: any) {
            toast.error("Failed to load session details.");
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSessions();
        }
    }, [fetchSessions]);

    const formatDuration = (ms: number | null) => {
        if (ms === null || ms === undefined) return "N/A";
        const duration = moment.duration(ms);
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const stats = useMemo(() => {
        let totalWorkMs = 0;
        let totalBreakMs = 0;
        let totalSessions = sessions.length;

        sessions.forEach(s => {
            totalWorkMs += (s.workTotalMs || 0);
            totalBreakMs += (s.breakTotalMs || 0);
        });

        return {
            totalWork: formatDuration(totalWorkMs),
            totalBreak: formatDuration(totalBreakMs),
            totalSessions,
            avgWork: totalSessions > 0 ? formatDuration(totalWorkMs / totalSessions) : "0s"
        };
    }, [sessions]);

    const columns: TableColumn<any>[] = [
        {
            name: "Shift Information",
            grow: 2,
            cell: (row) => (
                <div className="flex flex-col py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">
                                {row.processId?.name || "Standard Operation"}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                                <Calendar size={12} />
                                {moment(row.startedAt).format("DD MMM YYYY")}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            name: "Timeline",
            cell: (row) => (
                <div className="flex flex-col text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                    <div className="flex items-center gap-1 text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Started: {moment(row.startedAt).format("hh:mm A")}
                    </div>
                    <div className="flex items-center gap-1 text-rose-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Ended: {row.endedAt ? moment(row.endedAt).format("hh:mm A") : "Ongoing"}
                    </div>
                </div>
            ),
        },
        {
            name: "Productivity Metrics",
            grow: 1.5,
            cell: (row) => (
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Work</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <Timer size={14} />
                            {formatDuration(row.workTotalMs)}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Break</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500">
                            <Coffee size={14} />
                            {formatDuration(row.breakTotalMs)}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            name: "Status",
            width: "120px",
            cell: (row) => (
                <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${row.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {row.status}
                </div>
            )
        },
        {
            name: "Audit",
            width: "100px",
            cell: (row) => (
                <button
                    onClick={() => handleFetchDetails(row)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                    title="View Granular Logs"
                >
                    <ExternalLink size={16} />
                </button>
            )
        }
    ];

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: "transparent",
                borderBottom: "2px solid #f1f5f9",
            },
        },
        headCells: {
            style: {
                fontWeight: "900",
                fontSize: "0.65rem",
                color: "#94a3b8",
                textTransform: "uppercase" as const,
                letterSpacing: "0.1em",
                paddingLeft: "1.5rem",
            },
        },
        rows: {
            style: {
                minHeight: "100px",
                borderBottom: "1px solid #f8fafc",
                "&:hover": {
                    backgroundColor: "#f8fafc !important",
                    cursor: "pointer",
                }
            },
        },
        cells: {
            style: {
                paddingLeft: "1.5rem",
            }
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumbs & Header */}
            <div className="mb-8 overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 dark:bg-boxdark dark:ring-strokedark">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:translate-x-[-4px]"
                        >
                            <ArrowLeft size={16} />
                            Back to Catalog
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Productivity Intelligence</h1>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personnel Work & Break Audit Logs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Begin Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:border-strokedark"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-form-input dark:border-strokedark"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Active Work Time", value: stats.totalWork, icon: Timer, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Total Break Time", value: stats.totalBreak, icon: Coffee, color: "text-orange-500", bg: "bg-orange-50" },
                    { label: "Avg Work/Session", value: stats.avgWork, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Logged Sessions", value: stats.totalSessions, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
                ].map((card, i) => (
                    <div key={i} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-boxdark dark:ring-strokedark">
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.bg} ${card.color}`}>
                            <card.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Sessions Table */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-boxdark">
                <div className="border-b border-gray-100 p-6 dark:border-strokedark">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Granular Audit Records</h3>
                </div>

                <div className="relative">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <BallTriangle height={80} width={80} color="#3c50e0" />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={sessions}
                            pagination
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                    <AlertCircle size={48} strokeWidth={1} className="mb-2 opacity-20" />
                                    <p className="text-sm font-black uppercase tracking-widest">No Activity Records Detected</p>
                                    <p className="text-xs font-medium italic opacity-60">Adjust your date range or verification parameters.</p>
                                </div>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Granular Work Details Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Work Breakdown: ${activeSessionInfo?.processId?.name || 'Standard Operation'}`}
                submitOption={false}
                maxWidth="max-w-4xl"
            >
                <div className="space-y-6 py-2">
                    {detailLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <BallTriangle height={60} width={60} color="#3c50e0" />
                        </div>
                    ) : selectedSessionDetails.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <div className="col-span-1">Assigned Stage</div>
                                <div className="col-span-1">Operator Seat</div>
                                <div className="col-span-1 text-center">Pass Units</div>
                                <div className="col-span-1 text-center">NG Units</div>
                            </div>
                            {selectedSessionDetails.map((detail, idx) => (
                                <div key={idx} className="grid grid-cols-4 gap-4 items-center rounded-2xl bg-gray-50/50 p-4 transition hover:bg-white hover:shadow-md ring-1 ring-transparent hover:ring-gray-100">
                                    <div className="col-span-1 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{detail.stage}</span>
                                    </div>
                                    <div className="col-span-1">
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 underline-offset-4 decoration-indigo-200 decoration-2">
                                            <User size={12} />
                                            Seat {detail.seat || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className="text-sm font-black text-emerald-600">{detail.passCount}</span>
                                        <span className="ml-1 text-[9px] font-bold text-gray-400">PCS</span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className="text-sm font-black text-rose-500">{detail.ngCount}</span>
                                        <span className="ml-1 text-[9px] font-bold text-gray-400">PCS</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 italic">
                            <p className="text-sm">No device testing records found for this specific session.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default OperatorLogs;
