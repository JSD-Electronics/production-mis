"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import {
  getDeviceTestByDeviceId,
  getOverallDeviceTestEntry,
  getProcessByID,
  getUserDetail,
  markDeviceAsResolved,
  updateStageByDeviceId,
} from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  FileText,
  Layers,
  LayoutGrid,
  Terminal,
  User,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

export default function NGDeviceDetails({
  params,
}: {
  params: { id: string };
}) {
  const [deviceData, setDeviceData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedDisplay, setAssignedDisplay] = useState<string>("-");
  const [processDisplay, setProcessDisplay] = useState<string>("Unknown");
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [firstStageName, setFirstStageName] = useState<string>("");
  const [userType, setUserType] = useState<string>("");
  const [isTRCFormOpen, setIsTRCFormOpen] = useState(false);
  const [trcFormData, setTrcFormData] = useState({
    modelName: "",
    troubleshootedBy: "",
    pcbSerial: "",
    imei: "",
    processId: "",
    ocNumber: "",
    findingsAfterDiagnosis: "",
    problemType: "",
    problemCategory: "",
    trcStatus: "",
    resolutionSteps: "",
    componentCategory: "",
    faultCategory: "",
    photo: null as File | null,
  });

  // Prefill TRC form when modal opens
  useEffect(() => {
    const prefillTRCForm = async () => {
      if (isTRCFormOpen && deviceData) {
        const userDetails = JSON.parse(
          localStorage.getItem("userDetails") || "{}",
        );

        // Fetch process data to get PID and OC Number
        let processIdValue = "";
        let ocNumberValue = "";

        const pid = deviceData.processId;
        if (isObjectId(pid)) {
          try {
            const processRes = await getProcessByID(pid);
            processIdValue = processRes?.pid || processRes?._id || pid;
            ocNumberValue =
              processRes?.ocNumber || processRes?.orderConfirmationNumber || "";
          } catch (error) {
            console.error("Error fetching process data:", error);
            processIdValue = pid;
          }
        } else {
          processIdValue = pid || "";
        }

        setTrcFormData({
          modelName:
            deviceData.deviceInfo?.modelName || deviceData.device?.model || "",
          troubleshootedBy: userDetails.name || "",
          pcbSerial:
            deviceData.serialNo || deviceData.deviceInfo?.serialNo || "",
          imei: deviceData.deviceInfo?.imei || "",
          processId: processIdValue,
          ocNumber: ocNumberValue,
          findingsAfterDiagnosis: "",
          problemType: "",
          problemCategory: "",
          trcStatus: "",
          resolutionSteps: "",
          componentCategory: "",
          faultCategory: "",
          photo: null,
        });
      }
    };

    prefillTRCForm();
  }, [isTRCFormOpen, deviceData]);

  useEffect(() => {
    if (params.id) {
      fetchDeviceDetails();
    }
  }, [params.id]);

  useEffect(() => {
    try {
      const userDetails = JSON.parse(
        localStorage.getItem("userDetails") || "{}",
      );
      setUserType(userDetails.userType || "");
    } catch (error) {
      console.error("Error parsing user details:", error);
    }
  }, []);

  const fetchDeviceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try to get the specific NG entry details from the overall list (for consistent NG status info)
      // This is a bit inefficient but ensures we match the view from the previous page
      const overallResult = await getOverallDeviceTestEntry();
      const allEntries = overallResult?.DeviceTestEntry || [];
      // Finding logic might need adjustment based on what ID is passed (Device ID vs Entry ID)
      // We'll search by Device._id match first, assuming param is Device ID
      let mainEntry = allEntries.find(
        (e: any) =>
          e.deviceId?._id === params.id ||
          e.deviceId === params.id ||
          e._id === params.id,
      );

      setDeviceData(mainEntry);

      // 2. Fetch History / Stage Summary
      // Assuming getDeviceTestByDeviceId takes the Device ID (which mainEntry.deviceId should have)
      const targetDeviceId =
        mainEntry?.deviceId?._id || mainEntry?.deviceId || params.id;

      try {
        const historyResult = await getDeviceTestByDeviceId(targetDeviceId);
        // Adjust based on actual API response structure
        const historyData = historyResult?.data || historyResult || [];
        setHistory(Array.isArray(historyData) ? historyData : [historyData]);
      } catch (histError) {
        console.warn("Could not fetch detailed history:", histError);
        // If history API fails, we might still have logs in mainEntry
        if (mainEntry?.logs) {
          setHistory(mainEntry.logs.map((l: any) => ({ ...l, isLog: true }))); // Treat logs as history items if needed
        }
      }
    } catch (err: any) {
      console.error("Error loading device details:", err);
      setError(err?.message || "Failed to load device details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isObjectId = (val: any) =>
    typeof val === "string" && /^[a-fA-F0-9]{24}$/.test(val);

  const resolveDevice = async (mode: "QC" | "TRC") => {
    try {
      setIsResolving(true);
      const targetDeviceId =
        deviceData?.deviceId?._id || deviceData?.deviceId || params.id;
      const serialNumber =
        deviceData?.serialNo || deviceData?.deviceInfo?.serialNo || "";

      if (mode === "TRC") {
        const trcRemarkData = {
          modelName: trcFormData.modelName,
          troubleshootedBy: trcFormData.troubleshootedBy,
          pcbSerial: trcFormData.pcbSerial,
          imei: trcFormData.imei,
          processId: trcFormData.processId,
          ocNumber: trcFormData.ocNumber,
          findingsAfterDiagnosis: trcFormData.findingsAfterDiagnosis,
          problemType: trcFormData.problemType,
          problemCategory: trcFormData.problemCategory,
          trcStatus: trcFormData.trcStatus,
          resolutionSteps: trcFormData.resolutionSteps,
          componentCategory: trcFormData.componentCategory,
          faultCategory: trcFormData.faultCategory,
          submittedAt: new Date().toISOString(),
        };
        const formData = new FormData();
        formData.append("deviceId", String(targetDeviceId));
        formData.append("serialNumber", serialNumber);
        formData.append("status", "TRC Resolved");
        formData.append("trcRemarks", JSON.stringify(trcRemarkData));
        if (trcFormData.photo) {
          formData.append("photo", trcFormData.photo);
        }
        await markDeviceAsResolved(formData);

        if (firstStageName) {
          const fd = new FormData();
          fd.append("currentStage", firstStageName);
          fd.append("status", "TRC Resolved");
          await updateStageByDeviceId(String(targetDeviceId), fd);
        }

        setDeviceData((prev: any) => ({
          ...prev,
          status: "TRC Resolved",
          stageName: firstStageName || prev?.stageName,
          currentStage: firstStageName || prev?.currentStage,
        }));
        setIsTRCFormOpen(false);
      } else {
        await markDeviceAsResolved({
          deviceId: String(targetDeviceId),
          serialNumber,
        });

        if (firstStageName) {
          const fd = new FormData();
          fd.append("currentStage", firstStageName);
          fd.append("status", "Resolved");
          await updateStageByDeviceId(String(targetDeviceId), fd);
        }

        setDeviceData((prev: any) => ({
          ...prev,
          status: "Resolved",
          stageName: firstStageName || prev?.stageName,
          currentStage: firstStageName || prev?.currentStage,
        }));
        setIsResolveModalOpen(false);
      }
    } catch (e) {
      console.error("Error resolving device:", e);
      alert("Failed to mark as resolved. Please try again.");
      setIsResolveModalOpen(false);
      setIsTRCFormOpen(false);
    } finally {
      setIsResolving(false);
    }
  };
  useEffect(() => {
    if (!deviceData) return;

    const assignedCandidate =
      deviceData.assignedDeviceTo || deviceData.operatorId;
    if (isObjectId(assignedCandidate)) {
      getUserDetail(assignedCandidate)
        .then((res: any) => {
          setAssignedDisplay(res?.user?.name || assignedCandidate);
        })
        .catch(() => setAssignedDisplay(assignedCandidate || "-"));
    } else {
      setAssignedDisplay(assignedCandidate || "-");
    }

    const procNameCandidate =
      deviceData.processName || (deviceData.process && deviceData.process.name);
    if (procNameCandidate) {
      setProcessDisplay(procNameCandidate);
    } else {
      const pid = deviceData.processId;
      if (isObjectId(pid)) {
        getProcessByID(pid)
          .then((res: any) =>
            setProcessDisplay(
              res?.processName || res?.name || pid || "Unknown",
            ),
          )
          .catch(() => setProcessDisplay(pid || "Unknown"));
      } else {
        setProcessDisplay(pid || "Unknown");
      }
    }
  }, [deviceData]);

  useEffect(() => {
    const idsToFetch = Array.from(
      new Set(
        (events || [])
          .map((e: any) => e.assignedTo)
          .filter((v: any) => isObjectId(v) && !userNames[v]),
      ),
    );
    idsToFetch.forEach((id: string) => {
      getUserDetail(id)
        .then((res: any) => {
          const name = res?.user?.name || id;
          setUserNames((prev) => ({ ...prev, [id]: name }));
        })
        .catch(() => {});
    });
  }, [history, deviceData]);

  useEffect(() => {
    const pid = deviceData?.processId;
    if (isObjectId(pid)) {
      getProcessByID(pid)
        .then((res: any) => {
          const s0 =
            res?.stages?.[0]?.stageName || res?.stages?.[0]?.name || "";
          setFirstStageName(s0 || "");
        })
        .catch(() => {});
    } else if (deviceData?.process?.stages?.length > 0) {
      const s0 =
        deviceData.process.stages[0]?.stageName ||
        deviceData.process.stages[0]?.name ||
        "";
      setFirstStageName(s0 || "");
    }
  }, [deviceData]);

  const displayUser = (val: any) => {
    if (!val) return null;
    if (typeof val !== "string") return String(val);
    return userNames[val] || val;
  };

  const events = React.useMemo(() => {
    const source =
      history && history.length > 0 ? history : deviceData?.logs || [];
    const out: any[] = [];
    if (!source || !Array.isArray(source)) return out;
    for (const item of source) {
      if (Array.isArray(item?.logs)) {
        for (const sub of item.logs) {
          out.push({
            stepName: sub?.stepName || sub?.stageName,
            stageName: sub?.stageName,
            status: sub?.status || item?.status,
            assignedTo:
              sub?.assignedTo || item?.assignedDeviceTo || item?.operatorId,
            createdAt: sub?.createdAt || item?.createdAt || item?.updatedAt,
            updatedAt: sub?.updatedAt,
            reason:
              sub?.logData?.reason ||
              sub?.reason ||
              item?.logData?.reason ||
              item?.reason,
            logLines: sub?.logData?.terminalLogs || sub?.terminalLogs || [],
          });
        }
      } else {
        out.push({
          stepName: item?.stepName || item?.stageName,
          stageName: item?.stageName,
          status: item?.status,
          assignedTo:
            item?.assignedTo || item?.assignedDeviceTo || item?.operatorId,
          createdAt: item?.createdAt || item?.updatedAt,
          updatedAt: item?.updatedAt,
          reason: item?.logData?.reason || item?.reason,
          logLines:
            item?.logData?.terminalLogs ||
            (Array.isArray(item?.logs) ? [] : item?.logs || []),
        });
      }
    }
    return out;
  }, [history, deviceData]);

  const hasQCResolvedHistory = React.useMemo(() => {
    return (
      Array.isArray(history) &&
      history.some((h: any) => {
        const s = String(h?.status || "").toLowerCase();
        return s.includes("qc resolved");
      })
    );
  }, [history]);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DefaultLayout>
    );
  }

  if (error || !deviceData) {
    return (
      <DefaultLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-600 rounded-2xl p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="text-lg font-bold">Failed to load device</h3>
            <p className="text-sm opacity-80">{error || "Device not found"}</p>
            <Link
              href="/ng-devices"
              className="bg-red-100 text-red-700 hover:bg-red-200 mt-4 inline-block rounded px-4 py-2 text-sm font-bold"
            >
              Back to List
            </Link>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="font-sans text-gray-800 min-h-screen bg-white p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-gray-500 mb-1 flex items-center gap-2 text-sm">
              <Link
                href="/ng-devices"
                className="flex items-center gap-1 transition-colors hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" /> Returns
              </Link>
              <span>/</span>
              <span>Details</span>
            </div>
            <h1 className="text-gray-900 flex items-center gap-3 text-2xl font-bold">
              {deviceData.deviceInfo?.modelName ||
                deviceData.device?.model ||
                "Device Details"}
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide
                    ${
                      deviceData.status === "Pass"
                        ? "border-green-200 bg-green-100 text-green-700"
                        : deviceData.status === "NG"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
              >
                {deviceData.status || "Unknown"}
              </span>
            </h1>
          </div>

          <div className="hidden text-right sm:block">
            <div className="text-gray-500 text-sm">Last Updated</div>
            <div className="font-mono text-gray-900 font-medium">
              {formatDate(deviceData.createdAt || deviceData.updatedAt)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Device Info & Context */}
          <div className="space-y-6 lg:col-span-1">
            {/* Core Info Card */}
            <div className="ring-gray-100 rounded-2xl bg-white p-6 shadow-sm ring-1">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2 text-sm font-bold">
                <Cpu className="h-4 w-4 text-blue-500" />
                Device Information
              </h3>
              <div className="space-y-4">
                <div className="border-gray-50 flex justify-between border-b pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    Serial Number
                  </span>
                  <span className="font-mono text-gray-900 text-sm font-medium">
                    {deviceData.serialNo ||
                      deviceData.deviceInfo?.serialNo ||
                      "-"}
                  </span>
                </div>
                <div className="border-gray-50 flex justify-between border-b pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    Model
                  </span>
                  <span className="text-gray-900 text-sm font-medium">
                    {deviceData.deviceInfo?.modelName ||
                      deviceData.device?.model ||
                      "-"}
                  </span>
                </div>
                <div className="border-gray-50 flex justify-between border-b pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    Assigned To
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="text-gray-400 h-3 w-3" />
                    <span className="text-gray-900 text-sm font-medium">
                      {assignedDisplay}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="ring-gray-100 rounded-2xl bg-white p-6 shadow-sm ring-1">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2 text-sm font-bold">
                <Activity className="h-4 w-4 text-orange-500" />
                Current Status
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 mb-1 text-xs font-semibold uppercase">
                    Process
                  </div>
                  <div className="text-gray-900 bg-gray-50 flex items-center gap-2 rounded-lg p-2 font-medium">
                    <Layers className="text-gray-400 h-4 w-4" />
                    {(() => {
                      return processDisplay;
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 mb-1 text-xs font-semibold uppercase">
                      Stage
                    </div>
                    <div className="text-gray-900 font-medium">
                      {deviceData.stageName || deviceData.currentStage || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 text-xs font-semibold uppercase">
                      Time Taken
                    </div>
                    <div className="text-gray-900 font-medium">
                      {deviceData.timeConsumed || deviceData.timeTaken || "-"}
                    </div>
                  </div>
                </div>

                {/* Notes Area */}
                <div className="pt-2">
                  <div className="text-gray-500 mb-2 text-xs font-semibold uppercase">
                    Notes / Reason
                  </div>
                  <div className="text-gray-700 bg-red-50 border-red-100 rounded-lg border p-3 text-sm">
                    {deviceData.notes ||
                      deviceData.reason ||
                      deviceData.logData?.reason ||
                      "No specific notes."}
                  </div>
                </div>
                <div className="mt-4 flex w-100 items-end justify-center pr-10">
                  {(() => {
                    const statusText = String(
                      deviceData?.status || "",
                    ).toLowerCase();
                    const isQCResolved = statusText === "qc resolved";
                    const isAlreadyResolved = statusText === "resolved";
                    const isTRCResolved = statusText === "trc resolved";
                    const canMarkResolved =
                      !(
                        isQCResolved ||
                        isAlreadyResolved ||
                        isTRCResolved ||
                        hasQCResolvedHistory
                      ) && !isResolving;
                    return (
                      <button
                        onClick={() => {
                          const isQC =
                            userType?.toLowerCase() === "qc" ||
                            userType?.toLowerCase() === "quality control";
                          if (isQC) {
                            setIsResolveModalOpen(true);
                          } else {
                            setIsTRCFormOpen(true);
                          }
                        }}
                        className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 ${
                          canMarkResolved
                            ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                        disabled={!canMarkResolved}
                      >
                        Mark as Resolved
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stage Summary & Logs */}
          <div className="space-y-6 lg:col-span-2">
            {/* Stage Summary / History */}
            <div className="ring-gray-100 rounded-2xl bg-white p-6 shadow-sm ring-1">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-gray-900 flex items-center gap-2 text-lg font-bold">
                  <LayoutGrid className="text-gray-600 h-5 w-5" />
                  Stage Summary
                </h3>
                <span className="text-gray-500 bg-gray-100 rounded px-2 py-1 text-xs font-semibold">
                  {events.length} Events
                </span>
              </div>

              <div className="border-gray-200 relative ml-3 space-y-8 border-l-2 py-2 pl-8">
                {events.map((item: any, idx: number) => {
                  const isPass = item.status === "Pass";
                  const isNG = item.status === "NG";

                  return (
                    <div key={idx} className="relative">
                      {/* Connector Node */}
                      <div
                        className={`ring-gray-200 absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white ring-1
                                ${isPass ? "bg-green-500" : isNG ? "bg-danger" : "bg-gray-400"}`}
                      >
                        {isPass ? (
                          <CheckCircle className="h-3 w-3 text-white" />
                        ) : isNG ? (
                          <AlertTriangle className="h-3 w-3 text-white" />
                        ) : (
                          <Clock className="h-3 w-3 text-white" />
                        )}
                      </div>

                      <div className="bg-gray-50/50 border-gray-100 rounded-xl border p-4 transition-all hover:bg-white hover:shadow-md">
                        <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <h4 className="text-gray-900 text-base font-bold">
                            {item.stepName || `Step ${idx + 1}`}
                            {item.stageName &&
                              item.stageName !==
                                (item.stepName || `Step ${idx + 1}`) && (
                                <span className="text-gray-500 ml-2 text-xs">
                                  Stage: {item.stageName}
                                </span>
                              )}
                          </h4>
                          <span className="font-mono text-gray-400 text-xs">
                            {formatDate(item.createdAt || item.updatedAt)}
                          </span>
                        </div>

                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
                                      ${
                                        isPass
                                          ? "border-green-200 bg-green-50 text-green-700"
                                          : isNG
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-gray-100 text-gray-600 border-gray-200"
                                      }`}
                          >
                            {item.status || "INFO"}
                          </span>
                          {item.assignedTo && (
                            <span className="text-gray-500 flex items-center gap-1 text-xs">
                              <User className="h-3 w-3" />{" "}
                              {displayUser(item.assignedTo)}
                            </span>
                          )}
                        </div>

                        {item.logLines && item.logLines.length > 0 && (
                          <div className="mt-3">
                            <div className="text-gray-700 mb-2 flex items-center gap-1.5 text-xs font-bold">
                              <Terminal className="h-3.5 w-3.5" /> Terminal
                              Output
                            </div>
                            <div className="bg-gray-900 font-mono custom-scrollbar max-h-48 overflow-x-auto rounded-lg p-3 text-[10px] text-green-400">
                              {item.logLines.map((log: any, i: number) => (
                                <div
                                  key={i}
                                  className="mb-0.5 whitespace-nowrap last:mb-0"
                                >
                                  <span className="text-gray-500 mr-2 select-none">
                                    [{log.timestamp || "00:00:00"}]
                                  </span>
                                  {log.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.reason && (
                          <div className="text-red-600 bg-red-50 border-red-100 mt-3 flex items-start gap-2 rounded border p-2.5 text-sm">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <span className="mb-0.5 block text-xs font-bold uppercase">
                                Failure Reason
                              </span>
                              {item.reason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {events.length === 0 && (
                  <div className="text-gray-400 py-8 text-center text-sm italic">
                    No stage history recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="text-gray-900 mb-2 text-lg font-bold">
              Confirm Resolution
            </h4>
            <p className="text-gray-600 mb-4 text-sm">
              This will mark the device as Resolved and send it back to the
              first stage{firstStageName ? ` (${firstStageName})` : ""}.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg border px-4 py-2 text-sm font-semibold"
                disabled={isResolving}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resolveDevice("QC");
                }}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                disabled={isResolving}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRC Form Modal */}
      {isTRCFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-gray-900 text-lg font-bold">
                TRC Resolution Form
              </h4>
              <button
                onClick={() => setIsTRCFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isResolving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await resolveDevice("TRC");
              }}
            >
              <div className="custom-scrollbar max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Model Name */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={trcFormData.modelName}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter model name"
                    />
                  </div>

                  {/* Troubleshooted By */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Troubleshooted By
                    </label>
                    <input
                      type="text"
                      value={trcFormData.troubleshootedBy}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter name"
                    />
                  </div>

                  {/* PCB Serial */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      PCB Serial
                    </label>
                    <input
                      type="text"
                      value={trcFormData.pcbSerial}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Scan QR or fill complete PCB serial number"
                    />
                  </div>

                  {/* IMEI */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      IMEI
                    </label>
                    <input
                      type="text"
                      value={trcFormData.imei}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter IMEI"
                    />
                  </div>

                  {/* Process ID (PID) */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Process ID (PID)
                    </label>
                    <input
                      type="text"
                      value={trcFormData.processId}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter process ID"
                    />
                  </div>

                  {/* OC Number */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      OC Number
                    </label>
                    <input
                      type="text"
                      value={trcFormData.ocNumber}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter OC number"
                    />
                  </div>

                  {/* Problem Type */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Problem Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={trcFormData.problemType}
                      onChange={(e) =>
                        setTrcFormData({
                          ...trcFormData,
                          problemType: e.target.value,
                        })
                      }
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select problem type</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Firmware">Firmware</option>
                      <option value="Assembly">Assembly</option>
                      <option value="Component">Component</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Problem Category */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Problem Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={trcFormData.problemCategory}
                      onChange={(e) =>
                        setTrcFormData({
                          ...trcFormData,
                          problemCategory: e.target.value,
                        })
                      }
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select problem category</option>
                      <option value="Display Issue">Display Issue</option>
                      <option value="Battery Issue">Battery Issue</option>
                      <option value="Connectivity Issue">
                        Connectivity Issue
                      </option>
                      <option value="Audio Issue">Audio Issue</option>
                      <option value="Camera Issue">Camera Issue</option>
                      <option value="Power Issue">Power Issue</option>
                      <option value="Sensor Issue">Sensor Issue</option>
                      <option value="Physical Damage">Physical Damage</option>
                      <option value="Performance Issue">
                        Performance Issue
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* TRC Status */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      TRC Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={trcFormData.trcStatus}
                      onChange={(e) =>
                        setTrcFormData({
                          ...trcFormData,
                          trcStatus: e.target.value,
                        })
                      }
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select status</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>

                  {/* Component Category */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Component Category, if any changed / Re-soldered?
                    </label>
                    <input
                      type="text"
                      value={trcFormData.componentCategory}
                      onChange={(e) =>
                        setTrcFormData({
                          ...trcFormData,
                          componentCategory: e.target.value,
                        })
                      }
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter component details"
                    />
                  </div>

                  {/* Fault Category */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Fault Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={trcFormData.faultCategory}
                      onChange={(e) =>
                        setTrcFormData({
                          ...trcFormData,
                          faultCategory: e.target.value,
                        })
                      }
                      className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter fault category"
                    />
                  </div>
                </div>

                {/* Findings after diagnosis - Full width */}
                <div className="mt-4">
                  <label className="text-gray-700 mb-1 block text-sm font-semibold">
                    Findings after diagnosis{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={trcFormData.findingsAfterDiagnosis}
                    onChange={(e) =>
                      setTrcFormData({
                        ...trcFormData,
                        findingsAfterDiagnosis: e.target.value,
                      })
                    }
                    className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe findings after diagnosis"
                  />
                </div>

                {/* Resolution Steps - Full width */}
                <div className="mt-4">
                  <label className="text-gray-700 mb-1 block text-sm font-semibold">
                    How it is resolved? (Mention all the steps followed){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={trcFormData.resolutionSteps}
                    onChange={(e) =>
                      setTrcFormData({
                        ...trcFormData,
                        resolutionSteps: e.target.value,
                      })
                    }
                    className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe all steps followed to resolve the issue"
                  />
                </div>

                {/* Photo Upload */}
                <div className="mt-4">
                  <label className="text-gray-700 mb-1 block text-sm font-semibold">
                    Photo or screenshot for reference (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTrcFormData({ ...trcFormData, photo: file });
                    }}
                    className="border-gray-300 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-gray-200 mt-6 flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsTRCFormOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg border px-4 py-2 text-sm font-semibold"
                  disabled={isResolving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="disabled:bg-gray-400 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed"
                  disabled={isResolving}
                >
                  {isResolving ? "Submitting..." : "Submit & Resolve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
