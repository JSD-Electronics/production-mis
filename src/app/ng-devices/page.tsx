"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getOverallDeviceTestEntry, viewProcess } from "@/lib/api";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Filter,
  Layers,
  LayoutGrid,
  RefreshCcw,
  Search,
  User,
  Wrench,
  X,
  ChevronRight,
  Terminal,
  FileText,
  Activity,
  ArrowRight
} from "lucide-react";

export default function NGDevicesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [allProcesses, setAllProcesses] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchData();
    getProcessData();
  }, []);

  const getProcessData = async () => {
    try {
      const result = await viewProcess();
      setAllProcesses(result?.Processes || []);
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOverallDeviceTestEntry();
      const data = result?.DeviceTestEntry || [];
      const ngEntries = data.filter(
        (e: any) => (e.status || "").toString().toUpperCase() === "NG",
      );
      setEntries(ngEntries);
    } catch (err: any) {
      console.error("Error fetching NG devices:", err);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return entries.filter((e) => {
      // Filter by selected process
      if (selectedProcess) {
        const pid = e.processId || e.process?._id || "";
        if (pid !== selectedProcess) return false;
      }
      // Filter by search query
      if (q) {
        const serial = (e.serialNo || e.deviceInfo?.serialNo || "").toString().toLowerCase();
        const model = (e.deviceInfo?.modelName || e.device?.model || "").toString().toLowerCase();
        const stage = (e.stageName || e.currentStage || "").toString().toLowerCase();
        const assigned = (e.assignedDeviceTo || e.operatorId || "").toString().toLowerCase();

        return serial.includes(q) || model.includes(q) || stage.includes(q) || assigned.includes(q);
      }
      return true;
    });
  }, [entries, selectedProcess, searchQuery]);

  const processes = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      const pid = e.processId || e.process?._id || "unknown";
      // Try to get process name from various possible fields
      // If process details are populated in e.process, use e.process.name
      // If not, fall back to e.processName, then check the fetched process list
      let pname = e.process?.name || e.processName;

      if (!pname && allProcesses.length > 0) {
        const matchingProcess = allProcesses.find(p => p._id === pid);
        if (matchingProcess) pname = matchingProcess.name;
      }

      if (!pname) pname = pid; // Fallback to ID if still not found

      if (!map.has(pid)) map.set(pid, pname);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries, allProcesses]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    filteredEntries.forEach((e) => {
      const pid = e.processId || e.process?._id || "unknown";
      if (!g[pid]) g[pid] = [];
      g[pid].push(e);
    });
    return g;
  }, [filteredEntries]);

  const totalNg = entries.length;
  const totalProcesses = Object.keys(grouped).length;
  const totalTrc = entries.filter((e) => (e.assignedDeviceTo || "").toString().toUpperCase() === "TRC").length;
  const visibleProcesses = Object.keys(grouped);

  // Helper for cleaner dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };



  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 bg-white lg:p-8 font-sans text-gray-800">

        {/* Header & Stats */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Breadcrumb pageName="NG Devices" parentName="Reports" />
              <p className="mt-1 text-sm text-gray-500">Overview of all devices marked as NG across production lines.</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="group flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Total NG Card */}
            <div className="relative overflow-hidden  rounded-2xl bg-blue-50 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-30%] rounded-full bg-red-50/50 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total NG Devices</p>
                  <h3 className="mt-2 text-3xl font-bold text-gray-900">{loading ? "..." : totalNg}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-4 ring-red-50/50">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded-lg">
                <Activity className="h-3.5 w-3.5" />
                <span>Requires Attention</span>
              </div>
            </div>

            {/* Processes Card */}
            <div className="relative overflow-hidden rounded-2xl bg-blue-50 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-30%] rounded-full bg-blue-50/50 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Processes</p>
                  <h3 className="mt-2 text-3xl font-bold text-gray-900">{loading ? "..." : totalProcesses}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 ring-4 ring-blue-50/50">
                  <Layers className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Lines Impacted</span>
              </div>
            </div>

            {/* TRC Card */}
            <div className="relative overflow-hidden rounded-2xl bg-blue-50 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-30%] rounded-full bg-amber-50/50 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">TRC Assigned</p>
                  <h3 className="mt-2 text-3xl font-bold text-gray-900">{loading ? "..." : totalTrc}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 ring-4 ring-amber-50/50">
                  <Wrench className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-lg">
                <User className="h-3.5 w-3.5" />
                <span>Technician Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative min-w-[200px] flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search by serial, model, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-none bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="relative min-w-[200px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="w-full appearance-none rounded-xl border-none bg-gray-50 py-2.5 pl-10 pr-10 text-sm font-medium text-gray-700 transition-all focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Processes</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <Layers className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm">
                  <div className="h-6 w-1/3 rounded bg-gray-200 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-10 w-full rounded bg-gray-100"></div>
                    <div className="h-10 w-full rounded bg-gray-100"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-red-50 p-12 text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-bold">Failed to load data</h3>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : visibleProcesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No NG Devices Found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            visibleProcesses.map((pid) => (
              <div key={pid} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-blue-600">
                      <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">
                      {processes.find((p) => p.id === pid)?.name || "Unknown Process"}
                    </h3>
                  </div>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                    {grouped[pid]?.length || 0} Issues
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      <tr>
                        <th className="px-6 py-4">Device Info</th>
                        <th className="px-6 py-4">Stage</th>
                        <th className="px-6 py-4">Assigned To</th>
                        <th className="px-6 py-4">Reported At</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {grouped[pid]?.map((row: any, idx: number) => (
                        <tr key={row._id || idx} className="group hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{row.deviceInfo?.modelName || row.device?.model || "Unknown Model"}</span>
                              <span className="font-mono text-xs text-gray-400 mt-0.5">{row.serialNo || row.deviceInfo?.serialNo || row.deviceId?.serialNo || "-"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                              {row.stageName || row.currentStage || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                {(row.assignedDeviceTo || row.operatorId || "?").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-700">{row.assignedDeviceTo || row.operatorId || "-"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                            {formatDate(row.createdAt || row.updatedAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/ng-devices/${row.deviceId?._id || row.deviceId || row._id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 group-hover:shadow-sm"
                            >
                              View Details
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Improved Modal */}


      </div>
    </DefaultLayout>
  );
}
