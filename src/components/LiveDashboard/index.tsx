"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { getMesProductionDashboard } from "@/lib/api";
import { RefreshCcw, Search } from "lucide-react";
import { useManagedInterval } from "@/hooks/useManagedInterval";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type DashboardResponse = {
  kpis?: {
    ordersDueToday?: number;
    backlogDueToday?: number;
    completedToday?: number;
    totalDowntimeSeconds?: number;
  };
  cells?: { cellId: string; name: string; complete: number; target: number; defects: number }[];
  seats?: {
    seatKey: string;
    seatNo: string;
    rowNo?: string;
    stageName?: string;
    pass: number;
    target: number;
    ng: number;
    wipKits?: number;
    totalUPHA?: number;
    upha?: number;
    wip?: number;
  }[];
  charts?: {
    cellLoading?: { cellId: string; name: string; qtyRequired: number }[];
    downtimeByCell?: { cellId: string; name: string; downtimeSeconds: number }[];
    ordersByStatus?: { status: string; count: number }[];
    workInProgress?: { itemId: string; name: string; qty: number }[];
  };
  processes?: { _id: string; name: string; processID?: string }[];
  lastUpdated?: string;
};

const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const LiveDashboard = ({
  isFullScreen,
  onToggleFullScreen,
}: {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}) => {
  const searchParams = useSearchParams();
  const ledMode = useMemo(() => {
    const val = (searchParams?.get("led") || "").toLowerCase();
    return val === "1" || val === "true" || val === "yes";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [dashboard, setDashboard] = useState<DashboardResponse>({});

  const [processId, setProcessId] = useState<string>("");
  const [processOptions, setProcessOptions] = useState<any[]>([]);

  const fetchDashboard = async (manual = false) => {
    try {
      manual ? setRefreshing(true) : setLoading(true);
      const params: any = {
        processId: processId || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const res = await getMesProductionDashboard(params);
      setDashboard(res || {});
      const nextProcesses = res?.processes || [];
      setProcessOptions(nextProcesses);
      if (processId && !nextProcesses.some((p: any) => String(p?._id) === String(processId))) {
        setProcessId("");
      }
      const updatedAt = res?.lastUpdated ? new Date(res.lastUpdated) : new Date();
      setLastRefreshed(updatedAt.toLocaleTimeString());
    } catch (e) {
      setDashboard({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId]);

  useManagedInterval(
    () => {
      void fetchDashboard(false);
    },
    60000,
    true,
    { pauseWhenHidden: true },
  );

  const kpis = dashboard?.kpis || {};
  const cells = dashboard?.cells || [];
  const seats = dashboard?.seats || [];
  const charts = dashboard?.charts || {};

  const getStageOrder = (label?: string, fallback?: string) => {
    const text = `${label || ""} ${fallback || ""}`.trim();
    if (!text) return null;

    const stageMatch = text.match(/\bstage\s*#?\s*0*([0-9]+)\b/i);
    if (stageMatch) return Number(stageMatch[1]);

    const leadingMatch = text.match(/^\s*0*([0-9]+)\b/);
    if (leadingMatch) return Number(leadingMatch[1]);

    const anyNumberMatch = text.match(/\b0*([0-9]+)\b/);
    if (anyNumberMatch) return Number(anyNumberMatch[1]);

    return null;
  };

  const sortByStage = <T,>(items: T[], getLabel: (item: T) => string, getFallback?: (item: T) => string) => {
    return items
      .map((item, index) => {
        const label = getLabel(item);
        const fallback = getFallback ? getFallback(item) : "";
        const order = getStageOrder(label, fallback);
        return { item, index, order };
      })
      .sort((a, b) => {
        const aOrder = a.order;
        const bOrder = b.order;
        if (aOrder != null && bOrder != null) return aOrder - bOrder;
        if (aOrder != null) return -1;
        if (bOrder != null) return 1;
        return a.index - b.index;
      })
      .map((entry) => entry.item);
  };

  const cellLoadingSorted = sortByStage(charts.cellLoading || [], (c) => c.name, (c) => c.cellId);
  const downtimeSorted = sortByStage(charts.downtimeByCell || [], (d) => d.name, (d) => d.cellId);
  const wipSorted = sortByStage(charts.workInProgress || [], (w) => w.name, (w) => w.itemId);

  const cellLoadingOptions: ApexOptions = {
    chart: { type: "bar", height: 260, toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cellLoadingSorted.map((c) => c.name),
      labels: { style: { fontSize: "11px" } },
    },
    colors: ["#2563eb"],
  };
  const cellLoadingSeries = [
    { name: "Qty Required", data: cellLoadingSorted.map((c) => c.qtyRequired) },
  ];

  const downtimeOptions: ApexOptions = {
    chart: { type: "bar", height: 260, toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: downtimeSorted.map((d) => d.name),
      labels: { style: { fontSize: "11px" } },
    },
    colors: ["#ef4444"],
  };
  const downtimeSeries = [
    {
      name: "Downtime (min)",
      data: downtimeSorted.map((d) => Math.round((d.downtimeSeconds || 0) / 60)),
    },
  ];

  const ordersByStatusOptions: ApexOptions = {
    chart: { type: "bar", height: 240, toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: (charts.ordersByStatus || []).map((o) => o.status),
      labels: { style: { fontSize: "11px" } },
    },
    colors: ["#16a34a", "#0ea5e9", "#6b7280"],
  };
  const ordersByStatusSeries = [
    { name: "Orders", data: (charts.ordersByStatus || []).map((o) => o.count) },
  ];

  const wipOptions: ApexOptions = {
    chart: { type: "bar", height: 240, toolbar: { show: false }, fontFamily: "Satoshi, sans-serif" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: wipSorted.map((w) => w.name),
      labels: { style: { fontSize: "11px" } },
    },
    colors: ["#f59e0b"],
  };
  const wipSeries = [
    { name: "WIP Qty", data: wipSorted.map((w) => w.qty) },
  ];

  return (
    <div className={`mx-auto w-full ${ledMode ? "max-w-none px-6 py-6" : "max-w-screen-2xl"}`}>
      {!ledMode && <Breadcrumb pageName="Live Dashboard" parentName="Processes" />}

      {!ledMode && (
        <div className="mb-6 rounded-2xl border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-strokedark dark:bg-meta-4 dark:text-gray-200">
                <Search className="h-4 w-4" />
                Filters
              </div>
              <select
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                className="h-9 rounded-md border border-stroke bg-white px-3 text-xs font-semibold outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
              >
                <option value="">All Active Processes</option>
                {processOptions.map((p: any) => (
                  <option key={p?._id} value={p?._id}>
                    {p?.name} ({p?.processID || p?._id})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFullScreen}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-gray-200"
              >
                {isFullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
              <button
                onClick={() => fetchDashboard(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-strokedark dark:bg-meta-4 dark:text-gray-200"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {lastRefreshed && (
                <span className="text-xs text-gray-400">Last updated {lastRefreshed}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Production Floor Dashboard</h3>
            </div>
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700 dark:border-strokedark dark:bg-meta-4 dark:text-gray-200">
              Production Seats
            </div>
            <div className="space-y-3">
              {loading && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
                  Loading seats...
                </div>
              )}
              {!loading && seats.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
                  No seats found.
                </div>
              )}
              {seats.map((seat) => {
                const wipKits = seat.wipKits ?? seat.wip ?? 0;
                const totalUPHA = seat.totalUPHA ?? seat.upha ?? 0;

                return (
                  <div key={seat.seatKey} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-strokedark dark:bg-boxdark">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        Seat S{seat.seatNo}
                      </div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">
                        Seats
                      </div>
                    </div>
                    {seat.stageName && (
                      <div className="mt-1 text-[10px] font-medium text-gray-400 uppercase">
                        {seat.stageName}
                      </div>
                    )}
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      <div>
                        <div className="text-[10px] uppercase text-gray-400">Pass</div>
                        <div className="text-sm font-bold text-green-600">{seat.pass}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-gray-400">WIP Kits</div>
                        <div className="text-sm font-bold text-amber-600">{wipKits}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-gray-400">Total UPHA</div>
                        <div className="text-sm font-bold text-blue-600">{totalUPHA}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-gray-400">NG</div>
                        <div className="text-sm font-bold text-rose-600">{seat.ng}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Orders Due Today</div>
              <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                {kpis.ordersDueToday ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Backlog Due Today</div>
              <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                {kpis.backlogDueToday ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Completed Today</div>
              <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                {kpis.completedToday ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Downtime</div>
              <div className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                {formatDuration(kpis.totalDowntimeSeconds || 0)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cell Loading</h4>
              </div>
              <div className="h-[260px]">
                <ReactApexChart options={cellLoadingOptions} series={cellLoadingSeries} type="bar" height="100%" />
              </div>
            </div>
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Downtime by Cell</h4>
              </div>
              <div className="h-[260px]">
                <ReactApexChart options={downtimeOptions} series={downtimeSeries} type="bar" height="100%" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Today's Orders by Status</h4>
              </div>
              <div className="h-[240px]">
                <ReactApexChart options={ordersByStatusOptions} series={ordersByStatusSeries} type="bar" height="100%" />
              </div>
            </div>
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Work In Progress</h4>
              </div>
              <div className="h-[240px]">
                <ReactApexChart options={wipOptions} series={wipSeries} type="bar" height="100%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;





