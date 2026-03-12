
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CardDataStats from "@/components/CardDataStats";
import ViewPlanSchedule from "@/components/PlaningScheduling/viewPlaning";
import { viewProcess, getDeviceTestRecordsByProcessId } from "@/lib/api";
import { Activity, CheckCircle2, XCircle, Gauge, RefreshCcw } from "lucide-react";

const LiveDashboard = () => {
  const [processes, setProcesses] = useState<any[]>([]);
  const [activeProcesses, setActiveProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [deviceRecords, setDeviceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const refreshProcesses = async () => {
    try {
      setLoading(true);
      const result = await viewProcess();
      const list = result?.Processes || [];
      setProcesses(list);
      const filtered = list.filter((p: any) => {
        const status = p?.processStatus || p?.status;
        return status === "active" || status === "down_time_hold";
      });
      setActiveProcesses(filtered);
    } catch (error) {
      console.error("Failed to load processes", error);
      setProcesses([]);
      setActiveProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshProcessDetails = async (processId: string) => {
    if (!processId) {
      setDeviceRecords([]);
      return;
    }
    try {
      setIsRefreshing(true);
      const res = await getDeviceTestRecordsByProcessId(processId);
      setDeviceRecords(res?.deviceTestRecords || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to load device records", error);
      setDeviceRecords([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshProcesses();
  }, []);

  useEffect(() => {
    const sp = processes.find((p) => String(p?._id) === String(selectedProcessId));
    setSelectedProcess(sp || null);
    refreshProcessDetails(selectedProcessId);
    const interval = setInterval(() => {
      refreshProcessDetails(selectedProcessId);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedProcessId, processes]);

  const kitPassed = deviceRecords.filter((r) => String(r?.status) === "Pass").length;
  const kitNG = deviceRecords.filter((r) => String(r?.status) === "NG").length;
  const kitTotal = Number(selectedProcess?.quantity || 0);
  const kitWIP = Math.max(kitTotal - kitPassed - kitNG, 0);

  const recentRecords = useMemo(() => {
    return [...deviceRecords]
      .sort((a: any, b: any) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime())
      .slice(0, 20);
  }, [deviceRecords]);

  const stageNames = useMemo(() => {
    const stages = selectedProcess?.stages || selectedProcess?.productDetails?.stages || [];
    return (stages || [])
      .map((s: any) => s?.stageName || s?.name)
      .filter((name: any) => Boolean(name)) as string[];
  }, [selectedProcess]);

  const currentStageName = useMemo(() => {
    if (!deviceRecords || deviceRecords.length === 0) return "";
    const latest = [...deviceRecords].sort(
      (a: any, b: any) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime(),
    )[0];
    return String(latest?.stageName || "").trim();
  }, [deviceRecords]);

  const stageStatusList = useMemo(() => {
    const status = String(selectedProcess?.processStatus || selectedProcess?.status || "");
    const names = stageNames;
    if (names.length === 0) return [] as { name: string; status: string }[];

    if (status === "completed") {
      return names.map((name) => ({ name, status: "completed" }));
    }

    const currentIndex = names.findIndex(
      (n) => n.toLowerCase().trim() === currentStageName.toLowerCase().trim(),
    );

    return names.map((name, idx) => {
      if (currentIndex === -1) return { name, status: "pending" };
      if (idx < currentIndex) return { name, status: "completed" };
      if (idx === currentIndex) {
        return { name, status: status === "down_time_hold" ? "on_hold" : "in_progress" };
      }
      return { name, status: "pending" };
    });
  }, [currentStageName, selectedProcess, stageNames]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <Breadcrumb pageName="Live Dashboard" parentName="Processes" />

      <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Live Dashboard of Running Processes
            </h2>
            <p className="text-sm text-gray-500">
              Select an active process to view live insights and details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshProcessDetails(selectedProcessId)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-strokedark dark:bg-meta-4 dark:text-gray-200"
            >
              <RefreshCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            {lastRefreshed && (
              <span className="text-xs text-gray-400">Last update: {lastRefreshed}</span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Processes
            </label>
            <select
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="">Select a running process</option>
              {activeProcesses.map((p) => (
                <option key={p?._id} value={p?._id}>
                  {p?.processID || p?.name || "Process"} - {p?.productName || ""}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
            {selectedProcess ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Status</span>
                  <span className="text-xs font-bold uppercase text-primary">
                    {selectedProcess?.processStatus || selectedProcess?.status || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Process</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {selectedProcess?.name || selectedProcess?.processID}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Product</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {selectedProcess?.productName || "-"}
                  </span>
                </div>
                {selectedProcess?.planing?._id && (
                  <a
                    href={`/planing-scheduling/viewPlaning/${selectedProcess.planing._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
                  >
                    Open full planning view
                  </a>
                )}
              </div>
            ) : (
              <p>Select a process to see details.</p>
            )}
          </div>
        </div>
      </div>

      {selectedProcess && (
        <>

<div className="mt-6 rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
      Stage Progress
    </h3>
    <span className="text-xs text-gray-400">
      {stageStatusList.length} stages
    </span>
  </div>

  {stageStatusList.length === 0 ? (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
      No stage data available for this process.
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      {stageStatusList.map((stage, idx) => {
        const isLast = idx === stageStatusList.length - 1;
        const statusClass =
          stage.status === "completed"
            ? "bg-green-500 text-white"
            : stage.status === "in_progress"
            ? "bg-blue-500 text-white"
            : stage.status === "on_hold"
            ? "bg-red-500 text-white"
            : "bg-gray-200 text-gray-600";

        const chipClass =
          stage.status === "completed"
            ? "text-green-700 bg-green-100"
            : stage.status === "in_progress"
            ? "text-blue-700 bg-blue-100"
            : stage.status === "on_hold"
            ? "text-red-700 bg-red-100"
            : "text-gray-600 bg-gray-100";

        const label =
          stage.status === "completed"
            ? "Completed"
            : stage.status === "in_progress"
            ? "In Progress"
            : stage.status === "on_hold"
            ? "On Hold"
            : "Pending";

        return (
          <div key={`${stage.name}-${idx}`} className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${statusClass}`}
              >
                {idx + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {stage.name}
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${chipClass}`}
                >
                  {label}
                </span>
              </div>
            </div>
            {!isLast && (
              <div className="hidden h-px w-10 bg-gray-300 md:block" />
            )}
          </div>
        );
      })}
    </div>
  )}
</div>

{selectedProcess?.planing?._id && (
  <div className="mt-8">
    <ViewPlanSchedule planingId={selectedProcess.planing._id} readOnly />
  </div>
)}

<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <CardDataStats title="Target Qty" total={String(kitTotal)} rate="">
              <Gauge className="text-primary" size={22} />
            </CardDataStats>
            <CardDataStats title="Passed" total={String(kitPassed)} rate="">
              <CheckCircle2 className="text-green-600" size={22} />
            </CardDataStats>
            <CardDataStats title="NG" total={String(kitNG)} rate="">
              <XCircle className="text-red-500" size={22} />
            </CardDataStats>
            <CardDataStats title="WIP" total={String(kitWIP)} rate="">
              <Activity className="text-orange-500" size={22} />
            </CardDataStats>
          </div>

          <div className="mt-6 rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Real-time Device Records
              </h3>
              <span className="text-xs text-gray-400">
                Showing {recentRecords.length} of {deviceRecords.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-meta-4 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Serial/IMEI</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {recentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                        No device records found for this process.
                      </td>
                    </tr>
                  ) : (
                    recentRecords.map((record: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-meta-4">
                        <td className="px-4 py-2 text-xs">
                          {record?.createdAt
                            ? new Date(record.createdAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {record?.stageName || "-"}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">
                          {record?.serialNo || record?.imei || "-"}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                              String(record?.status) === "Pass"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {record?.status || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {record?.operatorName ||
                            record?.operatorId?.name ||
                            record?.operatorId?.employeeCode ||
                            "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-strokedark dark:bg-meta-4">
          Loading active processes...
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;
