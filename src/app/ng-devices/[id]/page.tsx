"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import {
  getDeviceById,
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
  ChevronRight,
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
    ccid: "",
    processId: "",
    ocNumber: "",
    findingsAfterDiagnosis: "",
    problemType: "",
    problemCategory: [] as string[],
    trcStatus: "",
    resolutionSteps: "",
    componentCategory: "",
    faultCategory: "",
    photo: null as File | null,
  });

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const toggleStage = (stageName: string) => {
    setExpandedStages((prev: any) => ({
      ...prev,
      [stageName.toLowerCase()]: !prev[stageName.toLowerCase()],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    events.forEach((e: any) => {
      all[e.stageName.toLowerCase()] = true;
    });
    setExpandedStages(all);
  };

  const collapseAll = () => {
    setExpandedStages({});
  };

  // Prefill TRC form when modal opens
  useEffect(() => {
    const prefillTRCForm = async () => {
      if (isTRCFormOpen && deviceData) {
        const userDetails = JSON.parse(
          localStorage.getItem("userDetails") || "{}",
        );

        // Fetch process data to get PID and OC Number
        const pidRaw = deviceData.processId;
        const pid = typeof pidRaw === "object" ? pidRaw?._id : pidRaw;

        let processIdValue = "";
        let ocNumberValue = "";

        if (isObjectId(pid)) {
          try {
            const processRes = await getProcessByID(String(pid));
            // Attribute name is processID per user instruction
            processIdValue = processRes?.processID || processRes?.pid || "";
            // Also fetch OC number
            ocNumberValue = processRes?.orderConfirmationNo || processRes?.ocNumber || "";
          } catch (error) {
            console.error("Error fetching process data:", error);
            processIdValue = String(pid);
          }
        }

        // Step 1: Identify Device Record
        let deviceRecord = deviceData?.deviceId;
        const targetId = deviceRecord?._id || deviceRecord || params.id;

        // Step 2: Ensure we have the full device object (with customFields)
        // If not populated from the initial call, fetch it explicitly now
        if (typeof deviceRecord !== "object" || !deviceRecord?.customFields) {
          try {
            const res = await getDeviceById(String(targetId));
            deviceRecord = res?.data;
          } catch (e) {
            console.warn("Failed to fetch full device object for TRC prefill:", e);
          }
        }

        let customFields = deviceRecord?.customFields || {};

        // Safety for stringified customFields
        if (typeof customFields === 'string') {
          try {
            customFields = JSON.parse(customFields);
          } catch (e) {
            customFields = {};
          }
        }

        // Helper to find nested values (IMEI/CCID can be under "Functional" or other stage keys)
        const findInCustomFields = (searchKey: string) => {
          const keyLower = searchKey.toLowerCase();

          const searchNode = (node: any): string => {
            if (!node || typeof node !== 'object') return "";

            // 1. Check current node keys first
            for (const k in node) {
              if (k.toLowerCase() === keyLower) return String(node[k]);
            }

            // 2. Prioritize standard stage keys like "Functional" or "Jig Test"
            const priorityKeys = ["Functional", "Jig Test", "FQC"];
            for (const pk of priorityKeys) {
              if (node[pk] && typeof node[pk] === "object") {
                const found = searchNode(node[pk]);
                if (found) return found;
              }
            }

            // 3. Recursive deep search for anything else
            for (const k in node) {
              if (typeof node[k] === 'object' && node[k] !== null && !priorityKeys.includes(k)) {
                const found = searchNode(node[k]);
                if (found) return found;
              }
            }
            return "";
          };

          return searchNode(customFields);
        };

        const imeiValue = findInCustomFields("IMEI") || deviceRecord?.imeiNo || "";
        const ccidValue = findInCustomFields("CCID") || "";

        setTrcFormData({
          modelName: deviceData.productId?.name || deviceRecord?.modelName || "N/A",
          troubleshootedBy: userDetails.name || "TRC",
          pcbSerial: deviceData.serialNo || deviceRecord?.serialNo || "",
          imei: imeiValue,
          ccid: ccidValue,
          processId: processIdValue,
          ocNumber: ocNumberValue,
          findingsAfterDiagnosis: "",
          problemType: "",
          problemCategory: [] as string[],
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
      // 1. Fetch Primary Device Entry
      const overallResult = await getOverallDeviceTestEntry();
      const allEntries = overallResult?.DeviceTestEntry || [];

      // Filtering for the best match: Prefer NG status and latest record
      const matchingEntries = allEntries.filter(
        (e: any) => {
          const dId = e.deviceId?._id || e.deviceId;
          return dId === params.id || e._id === params.id;
        }
      );

      // Sort by status (NG first) then by date (latest first)
      const mainEntry = matchingEntries.sort((a: any, b: any) => {
        const aStatusNG = (a.status || "").toUpperCase() === "NG";
        const bStatusNG = (b.status || "").toUpperCase() === "NG";
        if (aStatusNG && !bStatusNG) return -1;
        if (!aStatusNG && bStatusNG) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })[0];

      setDeviceData(mainEntry);

      // 2. Fetch History / Stage Summary
      // Using the internal database ID of the device if available
      const targetDeviceId =
        mainEntry?.deviceId?._id || mainEntry?.deviceId || params.id;

      try {
        const historyResult = await getDeviceTestByDeviceId(targetDeviceId);

        // Exhaustive check for various API response patterns
        const historyData =
          historyResult?.data ||
          historyResult?.deviceTestHistory ||
          historyResult?.deviceTestRecords ||
          (Array.isArray(historyResult) ? historyResult : []);

        setHistory(historyData);
      } catch (histError) {
        console.warn("Could not fetch detailed history:", histError);
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
          ccid: trcFormData.ccid,
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
          fd.append("status", "QC Resolved");
          await updateStageByDeviceId(String(targetDeviceId), fd);
        }

        setDeviceData((prev: any) => ({
          ...prev,
          status: "QC Resolved",
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
    const assignedId = typeof assignedCandidate === "object" ? assignedCandidate?._id : assignedCandidate;

    if (isObjectId(assignedId)) {
      getUserDetail(String(assignedId))
        .then((res: any) => {
          setAssignedDisplay(res?.user?.name || String(assignedId));
        })
        .catch(() => setAssignedDisplay(String(assignedId) || "-"));
    } else {
      setAssignedDisplay(
        typeof assignedCandidate === "object"
          ? assignedCandidate?.name || assignedCandidate?.username || String(assignedId)
          : (assignedCandidate || "-")
      );
    }

    const procNameCandidate =
      deviceData.processName || (deviceData.process && deviceData.process.name);
    if (procNameCandidate) {
      setProcessDisplay(procNameCandidate);
    } else {
      const pid = deviceData.processId;
      const pidId = typeof pid === "object" ? pid?._id : pid;

      if (typeof pid === "object" && (pid.processName || pid.name)) {
        setProcessDisplay(pid.processName || pid.name);
      } else if (isObjectId(pidId)) {
        getProcessByID(String(pidId))
          .then((res: any) =>
            setProcessDisplay(
              res?.processName || res?.name || String(pidId) || "Unknown",
            ),
          )
          .catch(() => setProcessDisplay(String(pidId) || "Unknown"));
      } else {
        setProcessDisplay(String(pid || "Unknown"));
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
        .catch(() => { });
    });
  }, [history, deviceData]);

  useEffect(() => {
    const pid = deviceData?.processId;
    const pidId = typeof pid === "object" ? pid?._id : pid;
    if (isObjectId(pidId)) {
      getProcessByID(String(pidId))
        .then((res: any) => {
          const s0 =
            res?.stages?.[0]?.stageName || res?.stages?.[0]?.name || "";
          setFirstStageName(s0 || "");
        })
        .catch(() => { });
    } else if (pid && typeof pid === "object" && pid.stages?.length > 0) {
      const s0 = pid.stages[0]?.stageName || pid.stages[0]?.name || "";
      setFirstStageName(s0 || "");
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
    if (typeof val === "object") return val.name || val.displayName || JSON.stringify(val);
    if (typeof val !== "string") return String(val);
    return userNames[val] || val;
  };

  const events = React.useMemo(() => {
    // 1. Gather all potential sources
    const histSource = Array.isArray(history) ? history : [];
    const mainSource = deviceData ? [deviceData] : [];
    const combined = [...histSource, ...mainSource].filter(Boolean);

    // 2. Build unique stage map
    const stageMap = new Map();

    combined.forEach(item => {
      const stageName = String(item?.stageName || item?.stepName || item?.currentStage || "").trim();
      if (!stageName) return;

      const key = stageName.toLowerCase();

      // Look for logs in EVERY possible field (Very aggressive)
      let rawLogs = [];
      const potentialLogs = item?.logs || item?.logData?.logs || item?.subSteps || item?.results || item?.history;

      if (Array.isArray(potentialLogs)) {
        rawLogs = potentialLogs;
      } else if (typeof potentialLogs === 'string' && potentialLogs.startsWith('[')) {
        try { rawLogs = JSON.parse(potentialLogs); } catch (e) { }
      }

      const subSteps = rawLogs.map((sub: any) => {
        // Aggressive log extraction
        const rawLogLines = sub?.logData?.terminalLogs ||
          sub?.terminalLogs ||
          sub?.logLines ||
          sub?.logs ||
          sub?.logData?.logs || [];
        const logLines = Array.isArray(rawLogLines) ? rawLogLines : [];

        // Aggressive data extraction
        const parsedData = sub?.logData?.parsedData || sub?.parsedData || sub?.data || sub?.logData?.data;

        // Auto-capture last 2 lines for NG steps as a summary
        let summaryTerminal = "";
        if (sub.status === 'NG' && Array.isArray(logLines) && logLines.length > 0) {
          summaryTerminal = logLines.slice(-2).map((l: any) => typeof l === 'string' ? l : l.message).join("\n");
        }

        return {
          stepName: sub?.stepName || sub?.stageName || "Process Step",
          status: sub?.status,
          reason: sub?.logData?.reason || sub?.reason,
          logLines: logLines,
          parsedData: parsedData,
          summaryTerminal: summaryTerminal,
          createdAt: sub?.createdAt || sub?.updatedAt || item?.createdAt
        };
      });

      const existing = stageMap.get(key);

      // Update if this item has more data or is explicitly an NG result
      const isBetter = !existing ||
        subSteps.length > (existing.subSteps?.length || 0) ||
        (item.status === 'NG' && (existing.status !== 'NG' || (existing.subSteps?.length || 0) === 0));

      if (isBetter) {
        const stageLogLines = item?.logData?.terminalLogs ||
          item?.terminalLogs ||
          (Array.isArray(item?.logs) && typeof item?.logs[0] === 'string' ? item?.logs : []);

        let stageSummary = "";
        if (item.status === 'NG' && Array.isArray(stageLogLines) && stageLogLines.length > 0) {
          stageSummary = stageLogLines.slice(-3).map((l: any) => typeof l === 'string' ? l : (l.message || l.line || JSON.stringify(l))).join("\n");
        }

        stageMap.set(key, {
          stageName: stageName,
          status: item?.status,
          assignedTo: item?.assignedTo || item?.assignedDeviceTo || item?.operatorId,
          createdAt: item?.createdAt || item?.updatedAt,
          updatedAt: item?.updatedAt,
          reason: item?.reason || item?.logData?.reason ||
            subSteps.find((s: any) => s.status === 'NG')?.reason,
          logLines: stageLogLines,
          stageSummary: stageSummary, // Extra summary field
          subSteps: subSteps
        });
      }
    });

    const result = Array.from(stageMap.values()).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Default expand NG stages
    setTimeout(() => {
      const initialExpanded: Record<string, boolean> = {};
      result.forEach((r: any) => {
        if (r.status === 'NG') initialExpanded[r.stageName.toLowerCase()] = true;
      });
      if (typeof setExpandedStages === 'function') {
        setExpandedStages((prev: any) => ({ ...initialExpanded, ...prev }));
      }
    }, 100);

    return result;
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
                    ${deviceData.status === "Pass"
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
                    NG Reason
                  </div>
                  <div className={`rounded-lg border p-3 text-sm font-medium ${deviceData.status === "NG" ? "bg-red-50 border-red-100 text-red-700" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                    {deviceData.reason ||
                      deviceData.notes ||
                      deviceData.logData?.reason ||
                      // If top-level reason is missing, look for the first NG step in logs
                      (Array.isArray(deviceData?.logs) && deviceData.logs.find((l: any) => l.status === "NG")?.logData?.reason) ||
                      (Array.isArray(deviceData?.logs) && deviceData.logs.find((l: any) => l.status === "NG")?.reason) ||
                      "No specific reason provided."}
                  </div>
                </div>

                {/* Device Logs Section (Prominent if NG) */}
                {(deviceData.logData?.terminalLogs || deviceData.terminalLogs) && (
                  <div className="pt-4">
                    <div className="text-gray-500 mb-2 flex items-center justify-between text-xs font-semibold uppercase">
                      <span>Device Logs</span>
                      <Terminal className="h-3 w-3" />
                    </div>
                    <div className="bg-gray-900 custom-scrollbar max-h-60 overflow-y-auto rounded-xl p-4 font-mono text-[11px] leading-relaxed text-emerald-400 shadow-inner">
                      {(deviceData.logData?.terminalLogs || deviceData.terminalLogs || []).map((log: any, i: number) => (
                        <div key={i} className="mb-1 flex gap-2 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                          <span className="text-gray-500 shrink-0 select-none">[{log.timestamp || "--:--:--"}]</span>
                          <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-emerald-400/90'}`}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                      {(!deviceData.logData?.terminalLogs && !deviceData.terminalLogs) && (
                        <div className="text-gray-500 italic">No terminal logs found for this device.</div>
                      )}
                    </div>
                  </div>
                )}
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
                        className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 ${canMarkResolved
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
            <div className="ring-gray-100 rounded-3xl bg-white p-7 shadow-sm ring-1">
              <div className="mb-8 flex flex-col gap-4 border-b border-gray-50 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 whitespace-nowrap text-xl font-black tracking-tight">
                        Stage History
                      </h3>
                      <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">
                          Live
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">
                      {events.length} Historical Events Detected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(() => {
                    const isNG = String(deviceData?.status || "").toUpperCase() === "NG";
                    const stage = String(deviceData?.stageName || deviceData?.currentStage || "").toLowerCase();
                    const isJigNamed = stage.includes("fqc") || stage.includes("functional");
                    if (isNG && isJigNamed) {
                      return (
                        <button
                          onClick={() => window.open(`/ng-devices/${params.id}/simulate`, "_blank")}
                          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95 whitespace-nowrap"
                        >
                          <Terminal className="h-3.5 w-3.5" shrink-0 /> <span>Simulate</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1">
                    <button
                      onClick={expandAll}
                      className="rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 transition-all hover:bg-white whitespace-nowrap"
                    >
                      Expand
                    </button>
                    <button
                      onClick={collapseAll}
                      className="rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-white whitespace-nowrap"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-gray-200 relative ml-3 space-y-8 border-l-2 py-2 pl-10">
                {events.map((item: any, idx: number) => {
                  const isPass = item.status === "Pass";
                  const isNG = item.status === "NG";
                  const isExpanded = !!expandedStages[item.stageName.toLowerCase()];

                  return (
                    <div key={idx} className="relative group/timeline">
                      <div
                        className={`absolute -left-[51px] top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white shadow-sm ring-1 ring-gray-200
                                 ${isPass ? "bg-green-500" : isNG ? "bg-red-500" : "bg-gray-400"}`}
                      >
                        {isPass ? (
                          <CheckCircle className="h-3 w-3 text-white" />
                        ) : isNG ? (
                          <AlertTriangle className="h-3 w-3 text-white" />
                        ) : (
                          <Clock className="h-3 w-3 text-white" />
                        )}
                      </div>

                      <div
                        className={`bg-white border-gray-100 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:border-blue-100
                                  ${isExpanded ? 'shadow-md ring-1 ring-blue-50' : 'shadow-sm opacity-90'}`}
                      >
                        <div
                          className="flex cursor-pointer flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                          onClick={() => toggleStage(item.stageName)}
                        >
                          <div className="flex items-center gap-3">
                            <h4 className="text-gray-900 text-lg font-black tracking-tight">
                              {item.stageName}
                            </h4>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest
                                        ${isPass ? "bg-green-100 text-green-700" : isNG ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                            >
                              {item.status || "INFO"}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <span className="font-mono text-[10px] font-bold text-gray-400">
                                {formatDate(item.createdAt || item.updatedAt)}
                              </span>
                              {item.assignedTo && (
                                <span className="text-gray-500 flex items-center gap-1 text-[10px] font-medium">
                                  <User className="h-2.5 w-2.5" /> {displayUser(item.assignedTo)}
                                </span>
                              )}
                            </div>
                            <div className={`p-1 rounded-full transition-transform duration-300 bg-gray-50 text-gray-400 ${isExpanded ? 'rotate-180 bg-blue-50 text-blue-500' : ''}`}>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>

                        {/* Expandable Content */}
                        <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[5000px] opacity-100 p-5 pt-0 border-t border-gray-50' : 'max-h-0 opacity-0'}`}>
                          <div className="mt-4">
                            {/* Nested Sub-Steps */}
                            {item.subSteps && item.subSteps.length > 0 ? (
                              <div className="space-y-4 pl-4 border-l-2 border-dashed border-gray-200">
                                {item.subSteps.map((step: any, sidx: number) => (
                                  <div key={sidx} className="relative pl-4">
                                    <div className={`absolute -left-[9px] top-1.5 h-2 w-2 rounded-full ${step.status === 'Pass' ? 'bg-green-400' : step.status === 'NG' ? 'bg-red-400' : 'bg-gray-300'}`} />
                                    <div className="flex items-center justify-between gap-4">
                                      <span className={`text-xs font-bold ${step.status === 'NG' ? 'text-red-600' : 'text-gray-700'}`}>
                                        {step.stepName}
                                      </span>
                                      {step.status && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${step.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {step.status}
                                        </span>
                                      )}
                                    </div>
                                    {step.reason && (
                                      <div className="mt-1 space-y-1">
                                        <p className="text-[10px] text-red-500 font-medium italic underline underline-offset-2 decoration-red-200">
                                          Reason: {step.reason}
                                        </p>
                                        {step.summaryTerminal && (
                                          <div className="mt-2 bg-red-50/70 p-2 px-3 rounded-lg border border-red-100 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                                            <Terminal className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                                            <div className="font-mono text-[9px] text-red-800 whitespace-pre-wrap leading-relaxed">
                                              {step.summaryTerminal}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {step.parsedData && Object.keys(step.parsedData).length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        <details className="group/data">
                                          <summary className="text-[10px] text-gray-500 font-bold hover:text-blue-600 transition-colors list-none flex items-center gap-1 cursor-pointer">
                                            <Search className="h-3 w-3" /> View Data Details
                                          </summary>
                                          <div className="mt-2 space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            {Object.entries(step.parsedData).map(([section, data]: [string, any]) => (
                                              <div key={section}>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1 block">{section}</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 ">
                                                  {data && typeof data === 'object' ? Object.entries(data).map(([k, v]: [string, any]) => (
                                                    <div key={k} className="flex justify-between border-b border-gray-200/50 pb-0.5 text-[10px]">
                                                      <span className="text-gray-500 truncate mr-2" title={k}>{k}</span>
                                                      <span className="text-gray-900 font-mono font-bold shrink-0">{String(v)}</span>
                                                    </div>
                                                  )) : (
                                                    <div className="text-[10px] text-gray-600 font-mono">{String(data)}</div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </details>
                                      </div>
                                    )}

                                    {step.logLines && step.logLines.length > 0 && (
                                      <div className="mt-2 group">
                                        <details className="cursor-pointer" open={step.status === 'NG'}>
                                          <summary className={`text-[10px] font-bold hover:underline list-none flex items-center gap-1 transition-colors ${step.status === 'NG' ? 'text-red-500' : 'text-blue-500'}`}>
                                            <Terminal className="h-3 w-3" /> {step.status === 'NG' ? 'View Failure Terminal Output' : 'View Terminal Output'}
                                          </summary>
                                          <div className={`mt-2 font-mono rounded-lg p-2.5 text-[10px] max-h-60 overflow-y-auto custom-scrollbar shadow-inner border ${step.status === 'NG'
                                            ? 'bg-red-950/20 text-red-200 border-red-200/20'
                                            : 'bg-gray-900 text-green-400 border-white/5'
                                            }`}>
                                            {step.logLines.map((log: any, i: number) => {
                                              const isString = typeof log === 'string';
                                              const msg = isString ? log : log.message || JSON.stringify(log);
                                              const time = isString ? "" : log.timestamp;
                                              const type = isString ? (msg.toLowerCase().includes('error') ? 'error' : 'normal') : log.type;

                                              return (
                                                <div key={i} className={`mb-0.5 flex gap-2 border-b last:border-0 pb-0.5 last:pb-0 ${step.status === 'NG' ? 'border-red-500/10' : 'border-white/5'
                                                  }`}>
                                                  {time && <span className="text-gray-500 shrink-0 select-none">[{time}]</span>}
                                                  <span className={`${type === 'error' ? 'text-red-400' :
                                                    type === 'success' ? 'text-green-400' :
                                                      step.status === 'NG' ? 'text-red-200/80' : 'text-emerald-400/80'
                                                    }`}>
                                                    {msg}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </details>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                <FileText className="h-8 w-8 text-gray-300 mb-2" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No detailed logs for this stage</p>
                              </div>
                            )}

                            {/* Fallback for top-level logs if no sub-steps exist */}
                            {(!item.subSteps || item.subSteps.length === 0) && item.logLines && item.logLines.length > 0 && (
                              <div className="mt-6 border-t border-gray-50 pt-4">
                                <div className="text-gray-900 mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                                  <Terminal className="h-3 w-3 text-blue-500" /> Summary terminal log
                                </div>
                                <div className="bg-gray-950 font-mono custom-scrollbar max-h-60 overflow-x-auto rounded-xl p-4 text-[10px] leading-relaxed text-emerald-400 shadow-2xl">
                                  {item.logLines.map((log: any, i: number) => (
                                    <div key={i} className="mb-1.5 flex gap-3 last:mb-0">
                                      <span className="text-white/20 shrink-0 select-none">[{log.timestamp || "--:--:--"}]</span>
                                      <span>{log.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {item.reason && !item.subSteps?.some((s: any) => s.reason === item.reason) && (
                              <div className="border-red-100 bg-red-50 mt-6 flex flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-red-600">
                                      Failure Reason
                                    </p>
                                    <p className="mt-0.5 text-xs font-bold text-red-700">
                                      {item.reason}
                                    </p>
                                  </div>
                                </div>
                                {item.stageSummary && (
                                  <div className="bg-red-950/90 rounded-lg p-3 font-mono text-[9px] text-red-300 border border-red-900 shadow-2xl flex items-start gap-2">
                                    <Terminal className="h-3 w-3 mt-0.5 shrink-0 text-red-500" />
                                    <div className="whitespace-pre-wrap leading-relaxed">{item.stageSummary}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
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
                if (trcFormData.problemCategory.length === 0) {
                  alert("Please select at least one Problem Category");
                  return;
                }
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
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="N/A"
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
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="N/A"
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
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="N/A"
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
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="IMEI not found"
                    />
                  </div>

                  {/* CCID */}
                  <div>
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      CCID
                    </label>
                    <input
                      type="text"
                      value={trcFormData.ccid}
                      readOnly
                      disabled
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="CCID not found"
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
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="N/A"
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
                      className="border-gray-300 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="N/A"
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
                      <option value="Jig">Jig</option>
                      <option value="System">System</option>
                      <option value="Process">Process</option>
                    </select>
                  </div>

                  {/* Problem Category - Multi-Selection Grid */}
                  <div className="md:col-span-2">
                    <label className="text-gray-700 mb-1 block text-sm font-semibold">
                      Problem Category <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {[
                        "External Battery Issue",
                        "3V3 Error",
                        "CCID Error",
                        "GSM Error",
                        "GPS Error",
                        "Accelerometer Error",
                        "RS232 Error",
                        "Flash Error",
                        "Panic Error",
                        "Analog Error",
                        "Digital Input Error",
                        "Digital Output Error",
                        "Reset Button Error",
                        "Other"
                      ].map((category) => (
                        <label
                          key={category}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${trcFormData.problemCategory.includes(category)
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                            }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                            checked={trcFormData.problemCategory.includes(category)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...trcFormData.problemCategory, category]
                                : trcFormData.problemCategory.filter((item) => item !== category);
                              setTrcFormData({ ...trcFormData, problemCategory: updated });
                            }}
                          />
                          <span className="text-xs font-medium">{category}</span>
                        </label>
                      ))}
                    </div>
                    {trcFormData.problemCategory.length === 0 && (
                      <p className="mt-1 text-[10px] text-red-500 italic">Please select at least one problem category</p>
                    )}
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
                  {/* <div>
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
                  </div> */}

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
