"use client";
import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getOverallDeviceTestEntry } from "@/lib/api";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
export default function NGDevicesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showTrcOnly, setShowTrcOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const openDeviceModal = (d: any) => {
    setSelectedDevice(d);
    setModalOpen(true);
  };
  const closeDeviceModal = () => {
    setSelectedDevice(null);
    setModalOpen(false);
  };
  useEffect(() => {
    fetchData(showTrcOnly);
  }, []);
  const fetchData = async (trcOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOverallDeviceTestEntry();
      const data = result?.DeviceTestEntry || [];
      console.log("data ==>", data);
      const ngEntries = data.filter(
        (e: any) => (e.status || "").toString().toUpperCase() === "NG",
      );
      const final = ngEntries.filter((e: any) => (e.assignedDeviceTo || "").toString().toUpperCase() === "TRC");
      setEntries(final);
    } catch (err: any) {
      console.error("Error fetching NG devices:", err);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  const filteredEntries = React.useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return entries.filter((e) => {
      if (selectedProcess) {
        const pid = e.processId || e.process?._id || "";
        if (pid !== selectedProcess) return false;
      }
      if (!q) return true;
      const serial = (e.serialNo || e.deviceInfo?.serialNo || "").toString().toLowerCase();
      const model = (e.deviceInfo?.modelName || e.device?.model || "").toString().toLowerCase();
      const stage = (e.stageName || e.currentStage || "").toString().toLowerCase();
      const assigned = (e.assignedDeviceTo || e.operatorId || "").toString().toLowerCase();

      return serial.includes(q) || model.includes(q) || stage.includes(q) || assigned.includes(q);
    });
  }, [entries, selectedProcess, searchQuery]);
  const processes = useMemo(() => {
    const map = new Map<string, string>();
    filteredEntries.forEach((e) => {
      const pid = e.processId || e.process?._id || "unknown";
      const pname =
        e.processName || e.process?.name || e.process?.processName || pid;
      if (!map.has(pid)) map.set(pid, pname);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [filteredEntries]);
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
  const visibleProcesses = selectedProcess ? [selectedProcess] : Object.keys(grouped);
  return (
    <DefaultLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="sticky top-0 z-20 mb-4 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Breadcrumb pageName="NG Devices" parentName="Reports" />
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(showTrcOnly)}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto space-y-6 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-white p-4 shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total NG</div>
                <div className="text-2xl font-semibold text-gray-900">{totalNg}</div>
              </div>
              <div className="text-sm text-gray-400" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s8-4.5 8-10.5S13.657 3 12 3 4 6.5 4 10.5 12 21 12 21z" />
                </svg>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Processes</div>
                <div className="text-2xl font-semibold text-gray-900">{totalProcesses}</div>
              </div>
              <div className="text-sm text-gray-400" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">TRC Assigned</div>
                <div className="text-2xl font-semibold text-red-600">{totalTrc}</div>
              </div>
              <div className="text-sm text-gray-400" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Process</label>
                <select
                  value={selectedProcess}
                  onChange={(e) => setSelectedProcess(e.target.value)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  <option value="">All Processes</option>
                  {processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="search"
                  placeholder="Search serial, model, stage or assignee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          {loading && (
            <div className="rounded bg-white p-6 shadow">Loading...</div>
          )}
          {error && (
            <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>
          )}
          {!loading && !error && visibleProcesses.length === 0 && (
            <div className="rounded bg-white p-6 shadow">No NG devices found.</div>
          )}
          {visibleProcesses.map((pid) => (
            <div key={pid} className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {processes.find((p) => p.id === pid)?.name || pid}
                </h3>
                <div className="text-sm text-gray-500">{grouped[pid]?.length || 0} items</div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Serial</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Assigned To</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {grouped[pid]?.map((row: any, idx: number) => (
                      <tr key={row._id || idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium">
                          {row.serialNo || row.deviceInfo?.serialNo || row.deviceId?.serialNo || "-"}
                        </td>
                        <td className="px-4 py-3">{row.deviceInfo?.modelName || row.device?.model || "-"}</td>
                        <td className="px-4 py-3">{row.stageName || row.currentStage || "-"}</td>
                        <td className="px-4 py-3">{row.assignedDeviceTo || row.operatorId || "-"}</td>
                        <td className="px-4 py-3">{row.timeConsumed || row.timeTaken || "-"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDeviceModal(row)}
                            className="rounded px-2 py-1 text-sm bg-blue-600 text-white hover:opacity-95"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        {modalOpen && selectedDevice && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 z-0" onClick={closeDeviceModal} />
            <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-4 border-b">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold leading-tight">
                    {selectedDevice.deviceInfo?.modelName || selectedDevice.device?.model || 'Device'}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedDevice.serialNo || selectedDevice.deviceInfo?.serialNo || '-'}</div>
                    <div className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800">{selectedDevice.stageName || selectedDevice.currentStage || 'Unknown stage'}</div>
                    <div className="px-2 py-1 text-xs rounded bg-sky-100 text-sky-800">{selectedDevice.processName || (selectedDevice.process && selectedDevice.process.name) || selectedDevice.processId || 'Unknown process'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={closeDeviceModal} className="ml-2 rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Close modal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Serial</div>
                        <div className="mt-1 font-mono text-sm">{selectedDevice.serialNo || selectedDevice.deviceInfo?.serialNo || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Model</div>
                        <div className="mt-1 font-medium">{selectedDevice.deviceInfo?.modelName || selectedDevice.device?.model || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Assigned To</div>
                        <div className="mt-1 font-medium">{selectedDevice.assignedDeviceTo || selectedDevice.operatorId || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Time</div>
                        <div className="mt-1 font-medium">{selectedDevice.timeConsumed || selectedDevice.timeTaken || '-'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Notes</div>
                      <div className="mt-2 rounded border p-3 bg-gray-50 text-sm">{selectedDevice.notes || selectedDevice.reason || '-'}</div>
                    </div>
                  </div>
                  <aside className="space-y-4">
                    <div className="rounded border p-3 bg-white">
                      <div className="text-sm text-gray-500">Process</div>
                      <div className="mt-1 font-medium">{selectedDevice.processName || (selectedDevice.process && selectedDevice.process.name) || selectedDevice.processId || '-'}</div>
                    </div>
                    <div className="rounded border p-3 bg-white">
                      <div className="text-sm text-gray-500">Stage</div>
                      <div className="mt-1 font-medium">{selectedDevice.stageName || selectedDevice.currentStage || '-'}</div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        )}
       </div>
     </DefaultLayout>
   );
 }
