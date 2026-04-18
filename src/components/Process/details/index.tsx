"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  getProcessByID, 
  getProcessInsights,
  createProcessLogs
} from "@/lib/api";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { RefreshCw, Activity, Package, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./process-details.css";

interface ProcessDetailsProps {
  readOnly?: boolean;
}

const ProcessDetails = ({ readOnly = false }: ProcessDetailsProps) => {
  const params = useParams();
  const router = useRouter();
  const processId = params?.id as string;
  const isDashboard = readOnly || (typeof window !== "undefined" && window.location.pathname.includes("/dashboard/"));

  // --- State ---
  const [process, setProcess] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  useEffect(() => {
    if (processId) {
      loadData();
    }
  }, [processId]);

  // Polling for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      if (processId && !isRefreshing) {
        fetchInsights(processId);
      }
    }, 10000); // 10 seconds
    return () => clearInterval(timer);
  }, [processId, isRefreshing]);

  const loadData = async () => {
    try {
      setLoading(true);
      const proc = await getProcessByID(processId);
      setProcess(proc.Process || proc);
      await fetchInsights(processId);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error loading process data:", error);
      if (!isDashboard) toast.error("Failed to load process details");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async (id: string) => {
    try {
      const result = await getProcessInsights(id);
      if (result.status) {
        setInsights(result.data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const handleManualRefresh = async () => {
    if (isDashboard) return;
    setIsRefreshing(true);
    await loadData();
    setLastRefreshed(new Date().toLocaleTimeString());
    toast.success("Monitoring Data Refreshed");
    setIsRefreshing(false);
  };

  // --- Calculations ---
  const totals = insights?.totals || { tested: 0, pass: 0, ng: 0, wip: 0 };
  const yield_rate = totals.tested > 0 ? ((totals.pass / totals.tested) * 100).toFixed(1) : "0.0";
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-gray-600">Loading Process Monitor...</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-danger">Process Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#f1f5f9] ${isDashboard ? "p-0" : "p-4 md:p-6 lg:p-8"}`}>
      {!isDashboard && <ToastContainer position="top-right" autoClose={3000} />}
      
      <div className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isDashboard ? "bg-white p-6 shadow-sm mb-0 rounded-b-2xl border-b border-slate-200" : ""}`}>
        <div>
          {!isDashboard && <Breadcrumb pageName="Process Monitor" parentName="Process" />}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{process.name}</h1>
            {isDashboard && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">
                Dashboard Mode (Read-Only)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">Monitoring LIVE activity across all production lines</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last Synchronized</p>
            <p className="text-sm font-semibold text-slate-600">{lastRefreshed}</p>
          </div>
          {!isDashboard && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="group flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw size={16} className={`${isRefreshing ? "animate-spin text-primary" : "text-slate-400 group-hover:text-primary"}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className={isDashboard ? "p-6 lg:p-8" : ""}>
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-8">
          <SummaryCard title="Required Qty" value={process.quantity} icon={<Package className="text-indigo-600" />} color="indigo" />
          <SummaryCard title="Issued Kits" value={process.issuedKits} icon={<Activity className="text-blue-600" />} color="blue" />
          <SummaryCard title="Consumed" value={process.consumedKits} icon={<CheckCircle className="text-emerald-600" />} color="emerald" />
          <SummaryCard title="Total Passed" value={totals.pass} icon={<CheckCircle className="text-green-600" />} color="green" />
          <SummaryCard title="Total NG" value={totals.ng} icon={<XCircle className="text-rose-600" />} color="rose" />
          <SummaryCard title="Yield Rate" value={`${yield_rate}%`} icon={<AlertCircle className="text-amber-600" />} color="amber" />
        </div>

        {/* STAGES GRID */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Process Workflow Status
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 tracking-widest uppercase">
               <span>WIP</span>
               <span>•</span>
               <span>Pass</span>
               <span>•</span>
               <span>NG</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(insights?.byStage || []).map((stage: any, index: number) => (
              <div key={index} className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-primary/20 hover:bg-white hover:shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-600 group-hover:bg-primary group-hover:text-white">
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stage Status</span>
                </div>
                
                <h3 className="mb-4 text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-primary">
                  {stage.stageName}
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <MetricBox label="WIP" value={stage.wip} color="amber" />
                  <MetricBox label="PASS" value={stage.pass} color="emerald" />
                  <MetricBox label="NG" value={stage.ng} color="rose" />
                </div>

                {/* Progress Bar (Subtle) */}
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200/50">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${stage.tested > 0 ? (stage.pass / stage.tested) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {(!insights?.byStage || insights.byStage.length === 0) && (
            <div className="py-20 text-center">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                 <Activity size={32} />
               </div>
               <p className="mt-4 font-medium text-slate-500">No active data for this process yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    indigo: "from-indigo-50 to-white border-indigo-100",
    blue: "from-blue-50 to-white border-blue-100",
    emerald: "from-emerald-50 to-white border-emerald-100",
    green: "from-green-50 to-white border-green-100",
    rose: "from-rose-50 to-white border-rose-100",
    amber: "from-amber-50 to-white border-amber-100",
  };

  return (
    <div className={`flex flex-col rounded-2xl border p-4 shadow-sm bg-gradient-to-br ${colors[color]}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color }: any) => {
  const colors: any = {
    amber: "text-amber-600 bg-amber-50 group-hover:bg-amber-100",
    emerald: "text-emerald-00 bg-emerald-50 group-hover:bg-emerald-100",
    rose: "text-rose-600 bg-rose-50 group-hover:bg-rose-100",
  };

  return (
    <div className="flex flex-col items-center rounded-lg py-2 transition-colors">
      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-1">{label}</span>
      <span className={`text-lg font-black ${colors[color] == undefined ? "text-emerald-600 bg-emerald-50" : colors[color]} rounded-md px-2 min-w-[32px] text-center`}>
        {value}
      </span>
    </div>
  );
};

export default ProcessDetails;
