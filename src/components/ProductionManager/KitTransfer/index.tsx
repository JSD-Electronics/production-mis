"use client";

import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Modal from "@/components/Modal/page";
import {
  createKitTransferRequest,
  getDevicesByProcessId,
  viewProcess,
} from "@/lib/api";
import {
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  Package,
  ScanLine,
  Trash2,
  Workflow,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function KitTransferPageContent() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fromProcessId, setFromProcessId] = useState("");
  const [toProcessId, setToProcessId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [targetStage, setTargetStage] = useState("");
  const [remarks, setRemarks] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [sourceDevices, setSourceDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await viewProcess();
        setProcesses(response?.Processes || []);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load processes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      if (!fromProcessId) {
        setSourceDevices([]);
        setScannedSerials([]);
        setScanValue("");
        return;
      }
      setLoadingDevices(true);
      try {
        const response = await getDevicesByProcessId(fromProcessId);
        setSourceDevices(response?.data || []);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load source process devices");
        setSourceDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    };
    loadDevices();
  }, [fromProcessId]);

  useEffect(() => {
    setToProcessId("");
    setTargetStage("");
    setScannedSerials([]);
    setScanValue("");
  }, [fromProcessId]);

  useEffect(() => {
    setTargetStage("");
  }, [toProcessId]);

  const activeProcesses = useMemo(() => {
    return processes.filter((p) => String(p?.status || "").toLowerCase() !== "completed");
  }, [processes]);

  const fromProcess = useMemo(
    () => activeProcesses.find((item: any) => String(item?._id) === String(fromProcessId)),
    [activeProcesses, fromProcessId],
  );
  const toProcess = useMemo(
    () => activeProcesses.find((item: any) => String(item?._id) === String(toProcessId)),
    [activeProcesses, toProcessId],
  );
  const destinationStages = useMemo(() => {
    const processStages = Array.isArray(toProcess?.stages) ? toProcess.stages : [];
    const commonStages = Array.isArray(toProcess?.commonStages) ? toProcess.commonStages : [];
    return [...processStages, ...commonStages];
  }, [toProcess]);
  const destinationStageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    destinationStages.forEach((stage: any, index: number) => {
      const name = String(stage?.stageName || stage?.name || "").trim().toLowerCase();
      if (name) map.set(name, index);
    });
    return map;
  }, [destinationStages]);

  const destinationProcesses = useMemo(() => {
    if (!fromProcess) return [];
    return activeProcesses.filter(
      (item: any) =>
        String(item?._id) !== String(fromProcess?._id) &&
        String(item?.selectedProduct) === String(fromProcess?.selectedProduct),
    );
  }, [activeProcesses, fromProcess]);

  const sourceDeviceMap = useMemo(() => {
    const map = new Map<string, any>();
    sourceDevices.forEach((device: any) => {
      map.set(String(device?.serialNo || "").trim().toLowerCase(), device);
    });
    return map;
  }, [sourceDevices]);

  const selectedQuantity = Number(quantity || 0);
  const canSelectTargetStage = !!toProcess;
  const requiresTargetStage = scannedSerials.length > 0;
  const getDeviceCurrentStage = (serial: string) => {
    const device = sourceDeviceMap.get(String(serial || "").trim().toLowerCase());
    return String(device?.currentStage || "").trim();
  };
  const getDeviceStageHistory = (serial: string) => {
    const device = sourceDeviceMap.get(String(serial || "").trim().toLowerCase());
    return Array.isArray(device?.stageHistory) ? device.stageHistory : [];
  };
  const getStageIndex = (stageName: string) =>
    destinationStageIndexMap.get(String(stageName || "").trim().toLowerCase()) ?? -1;
  const validateSerialForTargetStage = (serial: string) => {
    if (!targetStage || !toProcess) return "";
    const currentStage = getDeviceCurrentStage(serial);
    const targetIndex = getStageIndex(targetStage);
    const currentIndex = currentStage ? getStageIndex(currentStage) : -1;

    if (targetIndex < 0) {
      return "Selected destination stage is invalid";
    }
    if (targetIndex === currentIndex) {
      return "";
    }
    if (targetIndex > currentIndex) {
      if (currentIndex < 0) {
        return `${serial} has not started the destination flow yet`;
      }
      if (targetIndex !== currentIndex + 1) {
        const expectedNext = destinationStages[currentIndex + 1]?.stageName || destinationStages[currentIndex + 1]?.name || "";
        return `${serial} must first complete ${expectedNext || "the previous stage"} before moving to ${targetStage}`;
      }
    }
    return "";
  };
  const quantityError =
    !quantity
      ? "Enter quantity"
      : !Number.isInteger(selectedQuantity) || selectedQuantity <= 0
        ? "Quantity must be a positive integer"
        : selectedQuantity > Number(fromProcess?.issuedKits || 0)
          ? "Quantity cannot exceed allocated kits"
          : scannedSerials.length > 0 && selectedQuantity !== scannedSerials.length
            ? "Quantity must exactly match scanned serial count"
            : "";
  const stageEligibilityError = scannedSerials.find((serial) => validateSerialForTargetStage(serial)) || "";

  const canSubmit =
    !!fromProcessId &&
    !!toProcessId &&
    !quantityError &&
    !stageEligibilityError &&
    (!requiresTargetStage || !!targetStage);

  const resetForm = () => {
    setFromProcessId("");
    setToProcessId("");
    setQuantity("");
    setTargetStage("");
    setRemarks("");
    setScanValue("");
    setScannedSerials([]);
    setSourceDevices([]);
    setIsConfirmOpen(false);
  };

  const handleAddSerial = () => {
    const serial = String(scanValue || "").trim();
    if (!serial) return;
    if (!fromProcessId) {
      toast.error("Select the source process first");
      return;
    }
    if (scannedSerials.some((item) => item.toLowerCase() === serial.toLowerCase())) {
      toast.error("This serial is already scanned");
      return;
    }
    if (!sourceDeviceMap.has(serial.toLowerCase())) {
      toast.error("Serial does not belong to the selected source process");
      return;
    }
    const stageError = validateSerialForTargetStage(serial);
    if (stageError) {
      toast.error(stageError);
      return;
    }
    setScannedSerials((prev) => [...prev, serial]);
    setScanValue("");
  };

  const handleSubmitRequest = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const response = await createKitTransferRequest({
        fromProcessId,
        toProcessId,
        quantity: selectedQuantity,
        serials: scannedSerials,
        targetStage: requiresTargetStage ? targetStage : undefined,
        remarks,
      });
      toast.success(response?.message || "Kit transfer request raised to Store Portal");
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create transfer request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumb pageName="Kit Transfer" parentName="Production Manager" />

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Kit Transfer Request
                </h1>
                <p className="mt-1 max-w-2xl text-[13px] font-semibold text-slate-500">
                  Move allocated kits and devices between processes with audit-traceability.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  From Process
                </label>
                <select
                  value={fromProcessId}
                  onChange={(e) => setFromProcessId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                >
                  <option value="">Select source</option>
                  {activeProcesses.map((item: any) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.issuedKits || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  To Process
                </label>
                <select
                  value={toProcessId}
                  onChange={(e) => setToProcessId(e.target.value)}
                  disabled={!fromProcess}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select destination</option>
                  {destinationProcesses.map((item: any) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.issuedKits || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Kit quantity"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                />
                {quantityError && (
                  <p className="text-[10px] font-bold text-rose-500 italic uppercase tracking-tight">{quantityError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Destination Stage
                </label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  disabled={!canSelectTargetStage}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {canSelectTargetStage ? "Select stage" : "Select process first"}
                  </option>
                  {destinationStages.map((stage: any) => (
                    <option key={stage.stageName} value={stage.stageName}>
                      {stage.stageName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
                    <ScanLine className="h-3.5 w-3.5 text-indigo-500" />
                    Scan Device Serials
                  </h3>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-[10px] font-black text-slate-600 shadow-sm">
                  {loadingDevices ? "Loading..." : `${scannedSerials.length} Scanned`}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSerial();
                    }
                  }}
                  placeholder="Scan or enter serial number"
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                />
                <button
                  type="button"
                  onClick={handleAddSerial}
                  className="h-10 rounded-xl bg-slate-900 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 shadow-sm"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {scannedSerials.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center text-xs font-bold text-slate-400">
                    No serials scanned yet.
                  </div>
                ) : (
                  scannedSerials.map((serial) => (
                    <div
                      key={serial}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-hover hover:border-indigo-300"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-[13px] font-black tracking-tight text-slate-900">{serial}</p>
                        {getDeviceStageHistory(serial).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {getDeviceStageHistory(serial)
                              .slice(-3)
                              .map((history: any, index: number) => {
                                const label = `${history.stageName}${history.status ? ` • ${history.status}` : ""}`;
                                return (
                                  <span
                                    key={`${serial}-${history.stageName}-${index}`}
                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-tight ${
                                      history.flowBoundary
                                        ? "border-indigo-200 bg-indigo-50/50 text-indigo-700"
                                        : history.status?.toLowerCase() === "pass"
                                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
                                          : "border-slate-200 bg-slate-50/50 text-slate-500"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                );
                              })}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setScannedSerials((prev) => prev.filter((item) => item !== serial))
                        }
                        className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks..."
                className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 shadow-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!canSubmit) {
                    toast.error(stageEligibilityError || quantityError || "Please complete the required fields");
                    return;
                  }
                  setIsConfirmOpen(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-indigo-700 active:scale-95 shadow-md disabled:bg-slate-200 disabled:shadow-none"
              >
                <Workflow className="h-3.5 w-3.5" />
                Raise Request
              </button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-inner">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
              <ClipboardList className="h-3.5 w-3.5 text-indigo-500" />
              Summary
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white bg-white/70 p-3 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                  From Process
                </div>
                <div className="mt-1 text-sm font-black text-slate-900 leading-tight">
                  {fromProcess?.name || "None"}
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-500">
                  Kits: {fromProcess?.issuedKits || 0}
                </div>
              </div>

              <div className="rounded-xl border border-white bg-white/70 p-3 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                  To Process
                </div>
                <div className="mt-1 text-sm font-black text-slate-900 leading-tight">
                  {toProcess?.name || "None"}
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-500">
                  Kits: {toProcess?.issuedKits || 0}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Request Qty", value: selectedQuantity || 0, icon: Package },
                  { label: "Scan Count", value: scannedSerials.length, icon: ScanLine },
                  { label: "Target", value: targetStage ? (targetStage.length > 12 ? targetStage.substring(0,10)+'...' : targetStage) : "N/A", icon: Workflow },
                  { label: "Mode", value: scannedSerials.length > 0 ? "Hybrid" : "Kit Only", icon: CheckCircle2 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white bg-white/70 p-3 shadow-sm overflow-hidden text-ellipsis">
                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                      <item.icon className="h-2.5 w-2.5 text-indigo-500" />
                      {item.label}
                    </div>
                    <div className="mt-1.5 text-[12px] font-black text-slate-900">
                      {item.value || "-"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                 <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-[10.5px] font-bold leading-relaxed text-amber-800">
                  Note: Kits must match product types. Device count must match total quantity.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-[10px] font-bold italic leading-relaxed text-slate-500">
                  Historical audit records remain intact after transfer.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onSubmit={handleSubmitRequest}
        submitText={submitting ? "Submitting..." : "Confirm Request"}
        submitDisabled={submitting}
        title="Confirm Kit Transfer Request"
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p className="font-medium text-slate-700">
            Please confirm this transfer request before it is sent to the Store Portal.
          </p>
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">From</div>
              <div className="mt-1 font-bold text-slate-900">{fromProcess?.name || "-"}</div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">To</div>
              <div className="mt-1 font-bold text-slate-900">{toProcess?.name || "-"}</div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Quantity</div>
              <div className="mt-1 font-bold text-slate-900">{selectedQuantity || 0}</div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Serial Count</div>
              <div className="mt-1 font-bold text-slate-900">{scannedSerials.length}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Destination Stage</div>
              <div className="mt-1 font-bold text-slate-900">{targetStage || "Not required"}</div>
            </div>
          </div>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
