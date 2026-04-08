"use client";
import React, { useState, useEffect, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  viewProcess,
  getStorePortalCartons,
  getDeviceTestByDeviceId,
  getDeviceById,
  getDispatchInvoices,
  generateDispatchGatePass,
} from "@/lib/api";
import DispatchModal from "./DispatchModal";
import { ToastContainer, toast } from "react-toastify";
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
  Truck,
  RotateCcw,
  Eye,
  Printer,
} from "lucide-react";
import { CardGridSkeleton, TableSkeleton } from "@/components/common/Skeletons";

/* ─── status meta ─── */
const PROCESS_STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  completed:               { label: "Completed",         cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  complete:                { label: "Completed",         cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  active:                  { label: "Active",            cls: "bg-yellow-100 text-yellow-700 border-yellow-200",    dot: "bg-yellow-400" },
  waiting_schedule:        { label: "Waiting Schedule",  cls: "bg-orange-100 text-orange-700 border-orange-200",    dot: "bg-orange-400" },
  Waiting_Kits_allocation: { label: "Kits Allocation",   cls: "bg-indigo-100 text-indigo-700 border-indigo-200",    dot: "bg-indigo-400" },
  Waiting_Kits_approval:   { label: "Kits Approval",     cls: "bg-cyan-100 text-cyan-700 border-cyan-200",          dot: "bg-cyan-400" },
  down_time_hold:          { label: "On Hold",           cls: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-400" },
};
const getProcessMeta = (s: string) =>
  PROCESS_STATUS_META[s] ?? { label: "Created", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

// Carton "in store" lifecycle statuses. Backend uses FG_TO_STORE and STOCKED.
const STORE_STATUSES = [
  "FG_TO_STORE",
  "STOCKED",
  "KEPT_IN_STORE",
  "fg_to_store",
  "kept_in_store",
  "stocked",
  "shipped",
  "store",
];
const isStoreCarton = (c: any) => {
  const st = (c?.cartonStatus || c?.status || "").toString();
  return STORE_STATUSES.some((s) => s.toLowerCase() === st.toLowerCase());
};

const CARTON_STATUS_META: Record<string, { label: string; cls: string }> = {
  FG_TO_STORE:   { label: "FG to Store",   cls: "bg-blue-100 text-blue-700 border-blue-200" },
  KEPT_IN_STORE: { label: "Kept in Store", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  STOCKED:       { label: "Kept in Store", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  shipped:       { label: "Shipped",       cls: "bg-purple-100 text-purple-700 border-purple-200" },
  store:         { label: "Store",         cls: "bg-teal-100 text-teal-700 border-teal-200" },
};
const getCartonMeta = (s: string) =>
  CARTON_STATUS_META[s] ??
  { label: s?.replace(/_/g, " ") || "—", cls: "bg-gray-100 text-gray-500 border-gray-200" };

const DISPATCH_STATUS_META: Record<string, { label: string; cls: string }> = {
  READY: { label: "Ready", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  RESERVED: { label: "Reserved", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  DISPATCHED: { label: "Dispatched", cls: "bg-violet-100 text-violet-700 border-violet-200" },
};
const getDispatchMeta = (s: string) =>
  DISPATCH_STATUS_META[s] ??
  { label: s?.replace(/_/g, " ") || "Pending", cls: "bg-gray-100 text-gray-500 border-gray-200" };

const normalizeKey = (s: any) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findDeepValue = (obj: any, keyLike: string): string => {
  if (!obj || typeof obj !== "object") return "";
  const target = normalizeKey(keyLike);
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    if (normalizeKey(k) === target && (typeof v === "string" || typeof v === "number")) {
      return String(v);
    }
    if (v && typeof v === "object") {
      const found = findDeepValue(v, keyLike);
      if (found) return found;
    }
  }
  return "";
};

const getDeviceField = (device: any, keyLike: "imei" | "ccid") => {
  if (!device) return "—";
  const top =
    keyLike === "imei"
      ? (device.imeiNo || device.imei || device.imei_no)
      : (device.ccid || device.CCID || device.ccidNo);
  if (top) return String(top);
  const cf = device.customFields || device.custom_fields || device.customfields;
  let cfObj: any = cf;
  if (typeof cfObj === "string") {
    try { cfObj = JSON.parse(cfObj); } catch { cfObj = null; }
  }
  const fromCf = findDeepValue(cfObj, keyLike.toUpperCase());
  return fromCf || "—";
};

const deriveImeiCcidFromHistory = (rows: any[]) => {
  const all = Array.isArray(rows) ? rows : [];
  const sorted = [...all].sort((a: any, b: any) => {
    const ta = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
    const tb = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
    return tb - ta;
  });
  const imei = findDeepValue(sorted, "IMEI");
  const ccid = findDeepValue(sorted, "CCID");
  return { imei, ccid };
};

const toIdString = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;
  if (typeof v === "object" && typeof v._id === "string") return v._id;
  if (typeof v === "object" && typeof v.id === "string") return v.id;
  try {
    const s = v.toString?.();
    return typeof s === "string" && s !== "[object Object]" ? s : "";
  } catch {
    return "";
  }
};

const getDeviceId = (device: any): string => {
  if (!device) return "";
  return (
    toIdString(device._id) ||
    toIdString(device.deviceId) ||
    toIdString(device.device?._id) ||
    ""
  );
};

const openHtmlForPrint = (html: string, title = "Gate Pass") => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Please allow popups to print the gate pass");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  setTimeout(() => printWindow.print(), 400);
};

/* ─── CartonCard ─── */
const CartonCard = ({ carton }: { carton: any }) => {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyDevice, setHistoryDevice] = useState<any>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [overallHistoryOpen, setOverallHistoryOpen] = useState(false);
  const [overallHistoryLoading, setOverallHistoryLoading] = useState(false);
  const [overallHistoryError, setOverallHistoryError] = useState<string | null>(null);
  const [overallHistoryRows, setOverallHistoryRows] = useState<any[]>([]);
  const [deviceDetailsById, setDeviceDetailsById] = useState<Record<string, any>>({});
  const rawStatus = carton?.cartonStatus || carton?.status || "";
  const meta = getCartonMeta(rawStatus);
  const dispatchMeta = getDispatchMeta(String(carton?.dispatchStatus || "").trim() || "READY");
  const devices: any[] = carton.devices ?? [];

  useEffect(() => {
    if (!open) return;
    const targets = (devices || []).filter((d: any) => {
      const id = getDeviceId(d);
      return !!id && !deviceDetailsById[id];
    });
    if (targets.length === 0) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        targets.map((d: any) => getDeviceById(getDeviceId(d)))
      );

      if (cancelled) return;
      const next: Record<string, any> = {};
      results.forEach((r, idx) => {
        if (r.status !== "fulfilled") return;
        const id = getDeviceId(targets[idx]);
        if (!id) return;
        const res: any = r.value;
        const dev = res?.data ?? res?.device ?? res;
        next[id] = dev;
      });

      if (Object.keys(next).length > 0) {
        setDeviceDetailsById((prev) => ({ ...prev, ...next }));
      }

      // Fallback: if device doc doesn't contain IMEI/CCID yet, derive from latest device test history.
      const needDerive = Object.entries(next).filter(([_, dev]) => {
        return getDeviceField(dev as any, "imei") === "—" || getDeviceField(dev as any, "ccid") === "—";
      });
      if (needDerive.length > 0) {
        const derivedResults = await Promise.allSettled(
          needDerive.map(([id]) => getDeviceTestByDeviceId(id))
        );
        const patch: Record<string, any> = {};
        derivedResults.forEach((r, idx) => {
          if (r.status !== "fulfilled") return;
          const [id, dev] = needDerive[idx];
          const res: any = r.value;
          const rows =
            res?.data ||
            res?.deviceTestHistory ||
            res?.deviceTestRecords ||
            (Array.isArray(res) ? res : []);
          const { imei, ccid } = deriveImeiCcidFromHistory(rows);
          if (!imei && !ccid) return;
          patch[id] = {
            ...dev,
            ...(imei ? { imeiNo: imei } : null),
            ...(ccid ? { ccidNo: ccid } : null),
          };
        });
        if (Object.keys(patch).length > 0) {
          setDeviceDetailsById((prev) => ({ ...prev, ...patch }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, devices.length]);

  const openDeviceHistory = async (device: any) => {
    const deviceId = getDeviceId(device);
    if (!deviceId) return;
    const resolvedDevice = deviceDetailsById[deviceId] || device;
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryDevice(resolvedDevice);
    setHistoryRows([]);
    try {
      const res = await getDeviceTestByDeviceId(deviceId);
      const rows =
        res?.data ||
        res?.deviceTestHistory ||
        res?.deviceTestRecords ||
        (Array.isArray(res) ? res : []);
      const sorted = Array.isArray(rows)
        ? [...rows].sort((a: any, b: any) => {
            const ta = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
            const tb = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
            return tb - ta;
          })
        : [];
      setHistoryRows(sorted);

      // Ensure header shows IMEI/CCID even if device doc doesn't have customFields populated yet.
      const derived = deriveImeiCcidFromHistory(sorted);
      if (derived.imei || derived.ccid) {
        const patched = {
          ...resolvedDevice,
          ...(derived.imei ? { imeiNo: resolvedDevice?.imeiNo || derived.imei } : null),
          ...(derived.ccid ? { ccidNo: (resolvedDevice as any)?.ccidNo || derived.ccid } : null),
        };
        setHistoryDevice(patched);
        setDeviceDetailsById((prev) => ({ ...prev, [deviceId]: { ...(prev[deviceId] || {}), ...patched } }));
      }
    } catch (e: any) {
      setHistoryError(e?.message || "Failed to load device history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openOverallHistory = async () => {
    const targets = (devices || []).filter((d: any) => !!getDeviceId(d));
    if (targets.length === 0) return;

    setOverallHistoryOpen(true);
    setOverallHistoryLoading(true);
    setOverallHistoryError(null);
    setOverallHistoryRows([]);

    try {
      const results = await Promise.allSettled(
        targets.map((d: any) => getDeviceTestByDeviceId(getDeviceId(d)))
      );

      const merged: any[] = [];
      results.forEach((r, idx) => {
        if (r.status !== "fulfilled") return;
        const d = targets[idx];
        const res: any = r.value;
        const rows =
          res?.data ||
          res?.deviceTestHistory ||
          res?.deviceTestRecords ||
          (Array.isArray(res) ? res : []);
        if (!Array.isArray(rows)) return;
        rows.forEach((row: any) =>
            merged.push({
              ...row,
              __serialNo: d?.serialNo,
              __deviceId: getDeviceId(d),
              __device: d,
            })
          );
      });

      merged.sort((a: any, b: any) => {
        const ta = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
        const tb = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
        return tb - ta;
      });

      setOverallHistoryRows(merged);
    } catch (e: any) {
      setOverallHistoryError(e?.message || "Failed to load overall history");
    } finally {
      setOverallHistoryLoading(false);
    }
  };

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
        <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dispatchMeta.cls}`}>
          {dispatchMeta.label}
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
              <div className="flex items-center justify-between gap-3 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-slate-500">Devices</p>
                <button
                  type="button"
                  onClick={openOverallHistory}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  title="View combined stage testing history for all devices in this carton"
                >
                  Overall History
                </button>
              </div>
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {["#", "Serial No", "IMEI", "CCID", "Model", "Stage", "Status", "Action"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {devices.map((d: any, i: number) => (
                    <tr key={d._id ?? i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">
                        {getDeviceId(d) ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openDeviceHistory(d); }}
                            className="text-left text-blue-700 hover:text-blue-800 hover:underline"
                            title="View stage testing history"
                          >
                            {d.serialNo || "—"}
                          </button>
                        ) : (
                          (d.serialNo || "—")
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{getDeviceField(deviceDetailsById[getDeviceId(d)] || d, "imei")}</td>
                      <td className="px-3 py-2 text-slate-500">{getDeviceField(deviceDetailsById[getDeviceId(d)] || d, "ccid")}</td>
                      <td className="px-3 py-2 text-slate-500">{d.modelName || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{d.currentStage || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          d.status === "Pass" ? "bg-green-100 text-green-700"
                          : (d.status === "Fail" || d.status === "NG") ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                        }`}>{d.status || "Pending"}</span>
                      </td>
                      <td className="px-3 py-2">
                        {getDeviceId(d) ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openDeviceHistory(d); }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            History
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Device History</p>
                <h3 className="truncate text-lg font-bold text-slate-900">
                  {historyDevice?.serialNo || "—"}
                </h3>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>IMEI: <span className="font-semibold text-slate-700">{getDeviceField(historyDevice, "imei")}</span></span>
                  <span>CCID: <span className="font-semibold text-slate-700">{getDeviceField(historyDevice, "ccid")}</span></span>
                  <span>Stage: <span className="font-semibold text-slate-700">{historyDevice?.currentStage || "—"}</span></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close history"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                </div>
              ) : historyError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {historyError}
                </div>
              ) : historyRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No stage testing history found.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {["#", "Stage", "Status", "Operator", "Created At"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historyRows.map((r: any, idx: number) => (
                        <tr key={r?._id ?? idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{r?.stageName || "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r?.status === "Pass" ? "bg-green-100 text-green-700"
                              : (r?.status === "Fail" || r?.status === "NG") ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                            }`}>{r?.status || "—"}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{r?.operatorId?.name || r?.operatorId || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {r?.createdAt ? new Date(r.createdAt).toLocaleString() : (r?.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {overallHistoryOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overall History</p>
                <h3 className="truncate text-lg font-bold text-slate-900">
                  {carton?.cartonSerial || "Carton"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Combined stage testing history for {devices.length} device{devices.length !== 1 ? "s" : ""}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverallHistoryOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close overall history"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-5">
              {overallHistoryLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                </div>
              ) : overallHistoryError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {overallHistoryError}
                </div>
              ) : overallHistoryRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No stage testing history found.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {["#", "Serial No", "Stage", "Status", "Operator", "Created At", "Action"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {overallHistoryRows.map((r: any, idx: number) => (
                        <tr key={r?._id ?? idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{r?.__serialNo || "—"}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{r?.stageName || "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r?.status === "Pass" ? "bg-green-100 text-green-700"
                              : (r?.status === "Fail" || r?.status === "NG") ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                            }`}>{r?.status || "—"}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{r?.operatorId?.name || r?.operatorId || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {r?.createdAt ? new Date(r.createdAt).toLocaleString() : (r?.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—")}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => openDeviceHistory(r?.__device || { _id: r?.__deviceId, serialNo: r?.__serialNo })}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Device History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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
  onOpenDispatch,
  onResumeDispatch,
  onViewDispatch,
  onReprintGatePass,
}: {
  process: any;
  index: number;
  storeCartons: any[];
  loadingCartons: boolean;
  onOpenDispatch: (process: any) => void;
  onResumeDispatch: (process: any) => void;
  onViewDispatch: (process: any) => void;
  onReprintGatePass: (process: any) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const meta = getProcessMeta(process.status);
  const totalDevices = storeCartons.reduce((s, c) => s + (c.devices?.length ?? 0), 0);
  const isCompleted = ["completed", "complete"].includes(String(process.status || "").toLowerCase());
  const readyCount = process.dispatchStats?.readyCartons || 0;
  const reservedCount = process.dispatchStats?.reservedCartons || 0;
  const dispatchedCount = process.dispatchStats?.dispatchedCartons || 0;
  const hasDraft = !!process.draftInvoice?._id;
  const hasConfirmed = !!process.confirmedInvoice?._id;

  return (
    <div className={`rounded-2xl border shadow-sm transition-all ${
      isCompleted ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
    }`}>
      <div className="flex w-full items-start gap-4 px-5 py-4 text-left">
        <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-slate-800">
                {process.name || "Unnamed Process"}
              </h3>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}>
                {meta.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {readyCount > 0 ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenDispatch(process); }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Dispatch
                </button>
              ) : null}
              {hasDraft ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onResumeDispatch(process); }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resume Dispatch
                </button>
              ) : null}
              {hasConfirmed ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onViewDispatch(process); }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void onReprintGatePass(process); }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-100"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Reprint Gate Pass
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
            <span><span className="font-semibold text-slate-700">{storeCartons.length}</span> cartons in store</span>
            <span><span className="font-semibold text-slate-700">{totalDevices}</span> devices</span>
            <span><span className="font-semibold text-sky-700">{readyCount}</span> ready</span>
            <span><span className="font-semibold text-amber-700">{reservedCount}</span> reserved</span>
            <span><span className="font-semibold text-violet-700">{dispatchedCount}</span> dispatched</span>
            {process.quantity && <span>Target: <span className="font-semibold text-slate-700">{process.quantity}</span></span>}
            {process.createdAt && <span>Created {new Date(process.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 flex-shrink-0 text-slate-400 hover:text-slate-600"
        >
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

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
  draftInvoice: any | null;
  confirmedInvoice: any | null;
  dispatchStats: {
    readyCartons: number;
    reservedCartons: number;
    dispatchedCartons: number;
  };
};

const ViewFGToStore = () => {
  const [processesWithCartons, setProcessesWithCartons] = useState<ProcessWithCartons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [dispatchModalProcessId, setDispatchModalProcessId] = useState<string | null>(null);
  const [dispatchModalInvoice, setDispatchModalInvoice] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch processes + store cartons in parallel (store-portal is the source of truth for FG_TO_STORE/STOCKED).
      const [procs, storePortal, draftInvoicesResult, confirmedInvoicesResult] = await Promise.allSettled([
        viewProcess(),
        getStorePortalCartons(),
        getDispatchInvoices({ status: "DRAFT" }),
        getDispatchInvoices({ status: "CONFIRMED" }),
      ]);

      const procVal: any = procs.status === "fulfilled" ? procs.value : null;
      const allProcesses: any[] =
        Array.isArray(procVal)
          ? procVal
          : (procVal?.Processes ?? procVal?.data ?? procVal?.processes ?? []);

      // Only show Active + Completed processes on this page.
      const scopedProcesses = allProcesses.filter((p: any) => {
        const st = String(p?.status || "").toLowerCase();
        return st === "active" || st === "completed" || st === "complete";
      });

      const storeVal: any = storePortal.status === "fulfilled" ? storePortal.value : null;
      const portalCartonsRaw: any[] =
        Array.isArray(storeVal)
          ? storeVal
          : (storeVal?.data ?? storeVal?.cartons ?? []);

      const draftInvoicesRaw: any[] =
        draftInvoicesResult.status === "fulfilled"
          ? (Array.isArray(draftInvoicesResult.value)
              ? draftInvoicesResult.value
              : (draftInvoicesResult.value?.data ?? []))
          : [];
      const confirmedInvoicesRaw: any[] =
        confirmedInvoicesResult.status === "fulfilled"
          ? (Array.isArray(confirmedInvoicesResult.value)
              ? confirmedInvoicesResult.value
              : (confirmedInvoicesResult.value?.data ?? []))
          : [];

      const latestInvoiceByProcess = (invoices: any[]) => {
        const map = new Map<string, any>();
        invoices.forEach((invoice) => {
          const selectedCartons = Array.isArray(invoice?.selectedCartons) ? invoice.selectedCartons : [];
          const processIds: string[] = Array.from(
            new Set(
              selectedCartons
                .map((carton: any) => String(carton?.processId || ""))
                .filter(Boolean),
            ),
          );
          processIds.forEach((pid) => {
            const existing = map.get(pid);
            const nextTime = new Date(invoice?.updatedAt || invoice?.createdAt || 0).getTime();
            const currentTime = new Date(existing?.updatedAt || existing?.createdAt || 0).getTime();
            if (!existing || nextTime >= currentTime) {
              map.set(pid, invoice);
            }
          });
        });
        return map;
      };

      const draftInvoiceByProcess = latestInvoiceByProcess(draftInvoicesRaw);
      const confirmedInvoiceByProcess = latestInvoiceByProcess(confirmedInvoicesRaw);

      // Group cartons by processId for fast joins.
      const byProcess = new Map<string, any[]>();
      portalCartonsRaw.forEach((c: any) => {
        const pid = String(c?.processId?._id || c?.processId || "");
        if (!pid) return;
        const arr = byProcess.get(pid) || [];
        arr.push(c);
        byProcess.set(pid, arr);
      });

      const data: ProcessWithCartons[] = scopedProcesses.map((proc: any) => {
        const pid = String(proc?._id || "");
        const storeCartons = (byProcess.get(pid) || []).filter(isStoreCarton);
        return {
          process: proc,
          storeCartons,
          loaded: true,
          draftInvoice: draftInvoiceByProcess.get(pid) || null,
          confirmedInvoice: confirmedInvoiceByProcess.get(pid) || null,
          dispatchStats: {
            readyCartons: storeCartons.filter((carton) => {
              const cartonStatus = String(carton?.cartonStatus || carton?.status || "").trim().toUpperCase();
              const dispatchStatus = String(carton?.dispatchStatus || "").trim().toUpperCase();
              return cartonStatus === "STOCKED" && (!dispatchStatus || dispatchStatus === "READY");
            }).length,
            reservedCartons: storeCartons.filter(
              (carton) => String(carton?.dispatchStatus || "").trim().toUpperCase() === "RESERVED",
            ).length,
            dispatchedCartons: storeCartons.filter(
              (carton) => String(carton?.dispatchStatus || "").trim().toUpperCase() === "DISPATCHED",
            ).length,
          },
        };
      });

      // Also include any cartons that belong to processes not in the active/completed list (data repair / legacy).
      byProcess.forEach((cartons, pid) => {
        const exists = data.some((d) => String(d.process?._id || "") === pid);
        if (exists) return;
        const first = cartons[0] || {};
        data.push({
          process: {
            _id: pid,
            name: first.processName || "Unknown Process",
            processID: first.processID,
            status: "active",
          },
          storeCartons: cartons.filter(isStoreCarton),
          loaded: true,
          draftInvoice: draftInvoiceByProcess.get(pid) || null,
          confirmedInvoice: confirmedInvoiceByProcess.get(pid) || null,
          dispatchStats: {
            readyCartons: cartons.filter((carton) => {
              const cartonStatus = String(carton?.cartonStatus || carton?.status || "").trim().toUpperCase();
              const dispatchStatus = String(carton?.dispatchStatus || "").trim().toUpperCase();
              return cartonStatus === "STOCKED" && (!dispatchStatus || dispatchStatus === "READY");
            }).length,
            reservedCartons: cartons.filter(
              (carton) => String(carton?.dispatchStatus || "").trim().toUpperCase() === "RESERVED",
            ).length,
            dispatchedCartons: cartons.filter(
              (carton) => String(carton?.dispatchStatus || "").trim().toUpperCase() === "DISPATCHED",
            ).length,
          },
        });
      });

      setProcessesWithCartons(data);
      setLastFetch(new Date());
    } catch (err: any) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeDispatchProcess = useMemo(
    () =>
      processesWithCartons.find(
        (entry) => String(entry.process?._id || "") === String(dispatchModalProcessId || ""),
      ) || null,
    [dispatchModalProcessId, processesWithCartons],
  );

  const handleOpenDispatch = (process: any) => {
    setDispatchModalProcessId(String(process?._id || ""));
    setDispatchModalInvoice(null);
  };

  const handleResumeDispatch = (process: any) => {
    const target = processesWithCartons.find(
      (entry) => String(entry.process?._id || "") === String(process?._id || ""),
    );
    setDispatchModalProcessId(String(process?._id || ""));
    setDispatchModalInvoice(target?.draftInvoice || null);
  };

  const handleViewDispatch = (process: any) => {
    const target = processesWithCartons.find(
      (entry) => String(entry.process?._id || "") === String(process?._id || ""),
    );
    setDispatchModalProcessId(String(process?._id || ""));
    setDispatchModalInvoice(target?.confirmedInvoice || null);
  };

  const handleReprintGatePass = async (process: any) => {
    const target = processesWithCartons.find(
      (entry) => String(entry.process?._id || "") === String(process?._id || ""),
    );
    if (!target?.confirmedInvoice?._id) {
      toast.error("No confirmed dispatch was found for this process");
      return;
    }

    try {
      const result = await generateDispatchGatePass(target.confirmedInvoice._id, { includeImeiList: true });
      const payload = result?.data || result;
      if (!payload?.html) {
        toast.error("Gate pass content is not available");
        return;
      }
      openHtmlForPrint(payload.html, `Gate Pass ${target.confirmedInvoice?.gatePassNumber || ""}`.trim());
    } catch (error: any) {
      toast.error(error?.message || "Failed to reprint gate pass");
    }
  };

  /* Stats */
  const totalCartons = processesWithCartons.reduce((s, p) => s + p.storeCartons.length, 0);
  const completedProcesses = processesWithCartons.filter((p) => {
    const st = String(p.process.status || "").toLowerCase();
    return st === "completed" || st === "complete";
  }).length;
  const keptCount = processesWithCartons.reduce(
    (s, p) =>
      s +
      p.storeCartons.filter((c) => {
        const st = String(c.cartonStatus || c.status || "");
        return st === "KEPT_IN_STORE" || st === "STOCKED";
      }).length,
    0
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
      const procStatus = String(p.process.status || "").toLowerCase();
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" ? procStatus === "completed" || procStatus === "complete" : procStatus === statusFilter);
      return matchSearch && matchStatus;
    });
  }, [processesWithCartons, search, statusFilter]);

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    // Matches both backend spellings: "completed" and "complete"
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <ToastContainer position="top-center" closeOnClick pauseOnHover />
      <Breadcrumb pageName="FG Store Inventory" parentName="FG Store Management" />

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active + Completed",   value: processesWithCartons.length, icon: <Layers className="h-5 w-5" />,      color: "text-blue-600 bg-blue-50" },
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

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Current managed flow: <span className="font-semibold text-slate-900">Packaging → FG_TO_STORE → STOCKED.</span> Dispatch now runs on top of stock with <span className="font-semibold text-sky-600">READY</span>, <span className="font-semibold text-amber-600">RESERVED</span>, and <span className="font-semibold text-violet-600">DISPATCHED</span>.
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-4">
            <CardGridSkeleton rows={3} />
            <TableSkeleton rows={6} />
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
            {filtered.map(({ process, storeCartons, loaded, draftInvoice, confirmedInvoice, dispatchStats }, idx) => (
              <ProcessCard
                key={process._id ?? idx}
                process={{ ...process, draftInvoice, confirmedInvoice, dispatchStats }}
                index={idx}
                storeCartons={storeCartons}
                loadingCartons={!loaded}
                onOpenDispatch={handleOpenDispatch}
                onResumeDispatch={handleResumeDispatch}
                onViewDispatch={handleViewDispatch}
                onReprintGatePass={handleReprintGatePass}
              />
            ))}
          </div>
        )}
      </div>

      <DispatchModal
        isOpen={!!activeDispatchProcess}
        process={activeDispatchProcess?.process || null}
        cartons={activeDispatchProcess?.storeCartons || []}
        initialInvoice={dispatchModalInvoice}
        onClose={() => {
          setDispatchModalProcessId(null);
          setDispatchModalInvoice(null);
        }}
        onRefresh={fetchData}
      />
    </div>
  );
};

export default ViewFGToStore;

