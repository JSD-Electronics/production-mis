"use client";
import React, { useState, useEffect, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { viewProcess, fetchCartons } from "@/lib/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Search,
  Box,
  CheckCircle,
  Activity,
  RefreshCw,
  Archive,
  Layers,
  X,
} from "lucide-react";

/* ─── status meta ─── */
const PROCESS_STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  completed:               { label: "Completed",         cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  active:                  { label: "Active",            cls: "bg-yellow-100 text-yellow-700 border-yellow-200",    dot: "bg-yellow-400" },
  waiting_schedule:        { label: "Waiting Schedule",  cls: "bg-orange-100 text-orange-700 border-orange-200",    dot: "bg-orange-400" },
  Waiting_Kits_allocation: { label: "Kits Allocation",   cls: "bg-indigo-100 text-indigo-700 border-indigo-200",    dot: "bg-indigo-400" },
  Waiting_Kits_approval:   { label: "Kits Approval",     cls: "bg-cyan-100 text-cyan-700 border-cyan-200",          dot: "bg-cyan-400" },
  down_time_hold:          { label: "On Hold",           cls: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-400" },
};
const getProcessMeta = (s: string) =>
  PROCESS_STATUS_META[s] ?? { label: "Created", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

const STORE_STATUSES = ["FG_TO_STORE", "KEPT_IN_STORE", "fg_to_store", "kept_in_store", "shipped", "store"];
const isStoreCarton = (c: any) => {
  const st = (c?.cartonStatus || c?.status || "").toString();
  return STORE_STATUSES.some((s) => s.toLowerCase() === st.toLowerCase());
};

const CARTON_STATUS_META: Record<string, { label: string; cls: string }> = {
  FG_TO_STORE:   { label: "FG to Store",   cls: "bg-blue-100 text-blue-700 border-blue-200" },
  KEPT_IN_STORE: { label: "Kept in Store", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  shipped:       { label: "Shipped",       cls: "bg-purple-100 text-purple-700 border-purple-200" },
  store:         { label: "Store",         cls: "bg-teal-100 text-teal-700 border-teal-200" },
};
const getCartonMeta = (s: string) =>
  CARTON_STATUS_META[s] ??
  { label: s?.replace(/_/g, " ") || "—", cls: "bg-gray-100 text-gray-500 border-gray-200" };

/* ─── CartonCard ─── */
const CartonCard = ({ carton }: { carton: any }) => {
  const [open, setOpen] = useState(false);
  const rawStatus = carton?.cartonStatus || carton?.status || "";
  const meta = getCartonMeta(rawStatus);
  const devices: any[] = carton.devices ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Box className="h-4 w-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{carton.cartonSerial}</p>
          <p className="text-xs text-slate-400">
            {devices.length} device{devices.length !== 1 ? "s" : ""}
            {carton.maxCapacity && <> · Capacity: {carton.maxCapacity}</>}
          </p>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}>
          {meta.label}
        </span>
        <span className="ml-2 flex-shrink-0 text-slate-400">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-2">
          {devices.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No device details available.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {["#", "Serial No", "IMEI", "Model", "Stage", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {devices.map((d: any, i: number) => (
                    <tr key={d._id ?? i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{d.serialNo || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{d.imeiNo || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{d.modelName || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{d.currentStage || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          d.status === "Pass" ? "bg-green-100 text-green-700"
                          : (d.status === "Fail" || d.status === "NG") ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                        }`}>{d.status || "Pending"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── ProcessCard ─── */
const ProcessCard = ({
  process,
  index,
  storeCartons,
  loadingCartons,
}: {
  process: any; index: number; storeCartons: any[]; loadingCartons: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const meta = getProcessMeta(process.status);
  const totalDevices = storeCartons.reduce((s, c) => s + (c.devices?.length ?? 0), 0);

  return (
    <div className={`rounded-2xl border shadow-sm transition-all ${
      process.status === "completed" ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left"
      >
        <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          process.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-800">
              {process.name || "Unnamed Process"}
            </h3>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}>
              {meta.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
            <span><span className="font-semibold text-slate-700">{storeCartons.length}</span> cartons in store</span>
            <span><span className="font-semibold text-slate-700">{totalDevices}</span> devices</span>
            {process.quantity && <span>Target: <span className="font-semibold text-slate-700">{process.quantity}</span></span>}
            {process.createdAt && <span>Created {new Date(process.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <span className="mt-1 flex-shrink-0 text-slate-400">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          {loadingCartons ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            </div>
          ) : storeCartons.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No cartons in store for this process.</p>
          ) : (
            <div className="space-y-3">
              {storeCartons.map((c: any) => <CartonCard key={c._id} carton={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
type ProcessWithCartons = {
  process: any;
  storeCartons: any[];
  loaded: boolean;
};

const ViewFGToStore = () => {
  const [processesWithCartons, setProcessesWithCartons] = useState<ProcessWithCartons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ALL processes
      const procs = await viewProcess();
      const allProcesses: any[] = Array.isArray(procs) ? procs : (procs?.data ?? procs?.processes ?? []);

      // 2. Kick off carton fetches for all in parallel
      const results = await Promise.allSettled(
        allProcesses.map(async (proc: any) => {
          try {
            const res = await fetchCartons(proc._id);
            const cartons: any[] = Array.isArray(res) ? res : (res?.data ?? res?.cartons ?? []);
            const storeCartons = cartons.filter(isStoreCarton);
            return { process: proc, storeCartons, loaded: true };
          } catch {
            return { process: proc, storeCartons: [], loaded: true };
          }
        }),
      );

      const data: ProcessWithCartons[] = results
        .filter((r): r is PromiseFulfilledResult<ProcessWithCartons> => r.status === "fulfilled")
        .map((r) => r.value)
        // only show processes that have at least 1 store carton
        .filter((p) => p.storeCartons.length > 0);

      setProcessesWithCartons(data);
      setLastFetch(new Date());
    } catch (err: any) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* Stats */
  const totalCartons = processesWithCartons.reduce((s, p) => s + p.storeCartons.length, 0);
  const completedProcesses = processesWithCartons.filter((p) => p.process.status === "completed").length;
  const keptCount = processesWithCartons.reduce(
    (s, p) => s + p.storeCartons.filter((c) => (c.cartonStatus || c.status) === "KEPT_IN_STORE").length, 0
  );
  const fgCount = processesWithCartons.reduce(
    (s, p) => s + p.storeCartons.filter((c) => (c.cartonStatus || c.status) === "FG_TO_STORE").length, 0
  );

  /* Filter */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return processesWithCartons.filter((p) => {
      const matchSearch =
        !q ||
        (p.process.name || "").toLowerCase().includes(q) ||
        p.storeCartons.some((c) =>
          (c.cartonSerial || "").toLowerCase().includes(q) ||
          (c.devices || []).some((d: any) => (d.serialNo || "").toLowerCase().includes(q))
        );
      const matchStatus = statusFilter === "all" || p.process.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [processesWithCartons, search, statusFilter]);

  const statusOptions = [
    { value: "all",       label: "All Statuses" },
    { value: "active",    label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "down_time_hold", label: "On Hold" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <ToastContainer position="top-center" closeOnClick pauseOnHover />
      <Breadcrumb pageName="FG Store Inventory" parentName="FG Store Management" />

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Processes w/ Cartons", value: processesWithCartons.length, icon: <Layers className="h-5 w-5" />,      color: "text-blue-600 bg-blue-50" },
          { label: "Total Cartons",         value: totalCartons,               icon: <Package className="h-5 w-5" />,     color: "text-violet-600 bg-violet-50" },
          { label: "Completed Processes",   value: completedProcesses,          icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Kept in Store",         value: keptCount,                   icon: <Activity className="h-5 w-5" />,    color: "text-yellow-600 bg-yellow-50" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`rounded-xl p-2.5 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
              <p className="text-xs font-medium text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search process, carton serial, device…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm outline-none focus:border-blue-400"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {lastFetch && (
        <p className="mt-1.5 text-right text-[10px] text-slate-400">
          Last updated: {lastFetch.toLocaleTimeString()}
        </p>
      )}

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-slate-400">Loading FG store inventory…</p>
            <p className="text-xs text-slate-300">Fetching all processes and their cartons…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-16">
            <p className="font-semibold text-red-600">Error loading data</p>
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={fetchData} className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-24">
            <Archive className="h-12 w-12 text-slate-300" />
            <p className="text-base font-semibold text-slate-400">No store cartons found</p>
            <p className="text-xs text-slate-400">Cartons appear here once shifted to store or kept in store.</p>
            {(search || statusFilter !== "all") && (
              <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-1 text-xs text-blue-500 underline hover:text-blue-700">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(({ process, storeCartons, loaded }, idx) => (
              <ProcessCard
                key={process._id ?? idx}
                process={process}
                index={idx}
                storeCartons={storeCartons}
                loadingCartons={!loaded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewFGToStore;
