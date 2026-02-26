import React, { useState, useRef, useEffect, useCallback } from "react";
import { Cable, Square, Terminal, Trash2, Download, Play, Activity } from "lucide-react";
import { updateStageBySerialNo, getEsimMasterByCcid, viewEsimProfiles, viewEsimApns } from "@/lib/api";
import { toast } from "react-toastify";

// --- Types ---

interface JigSectionProps {
  subStep: any;
  onDataReceived?: (data: string) => void;
  onDecision?: (status: "Pass" | "NG", reason?: string, data?: any, isImmediate?: boolean) => void;
  isLastStep?: boolean;
  onDisconnect?: (fn: () => void) => void;
  onConnectionChange?: (connected: boolean) => void;
  searchQuery: any;
  finalResult?: "Pass" | "NG" | null;
  finalReason?: string | null;
  onStatusUpdate?: (reason: string) => void;
  expanded?: boolean;
  generatedCommand?: string;
  setGeneratedCommand?: (cmd: string) => void;
  autoConnect?: boolean; // New prop for auto-connection
}

interface LogEntry {
  timestamp: string;
  message: string;
  type?: "info" | "success" | "error" | "data";
}

const USB_FILTERS = [
  // Common USB-Serial chips
  { usbVendorId: 0x2341 }, // Arduino
  { usbVendorId: 0x10c4 }, // CP210x
  { usbVendorId: 0x0403 }, // FTDI
  { usbVendorId: 0x1a86 }, // CH340
  { usbVendorId: 0x067b }, // Prolific
];

// --- Helper Functions ---

const formatTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

const parseKeyValue = (key: string, source: string): string | null => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escapedKey}\\s*[:=]\\s*([^\\n,]+)`, "i");
  const match = source.match(regex);
  return match ? match[1].trim() : null;
};

const getFriendlyName = (info: any) => {
  if (!info || !info.usbVendorId) return "USB Serial Port";

  const vids: Record<number, string> = {
    0x2341: "Arduino",
    0x10c4: "CP210x USB to UART",
    0x0403: "FTDI USB Serial",
    0x1a86: "CH340 USB Serial",
    0x067b: "Prolific USB Serial",
    0x2e8a: "Raspberry Pi Pico",
    0x303a: "Espressif (ESP32)"
  };

  const name = vids[info.usbVendorId] || "USB Serial Port";

  // Web Serial API (Chrome/Edge) restricts access to actual COM port names (like COM10) 
  // for browser security/privacy. We use Serial Numbers and Indices to distinguish devices.
  const snPart = info.serialNumber ? ` [SN: ${info.serialNumber}]` : "";
  const idStr = `(VID: ${info.usbVendorId.toString(16).toUpperCase()}, PID: ${info.usbProductId?.toString(16).toUpperCase()})`;

  return `${name}${snPart} ${idStr}`;
};

const parseJigOutput = (text: string) => {

  const lines = text.split('\n');
  const result: any = {};
  let currentSection = "PARAMETERS";

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
      currentSection = trimmed.replace(':', '');
      if (!result[currentSection]) result[currentSection] = {};
      return;
    }

    if (!result[currentSection]) result[currentSection] = {};

    const segments = trimmed.split(/   +|  |, /);
    let lastKey: string | null = null;

    segments.forEach(segment => {
      const colonIndex = segment.indexOf(':');
      if (colonIndex !== -1) {
        const key = segment.substring(0, colonIndex).trim();
        const value = segment.substring(colonIndex + 1).trim();
        result[currentSection][key] = value;
        lastKey = key;
      } else if (lastKey && result[currentSection][lastKey]) {
        result[currentSection][lastKey] += " " + segment.trim();
      }
    });
  });

  return [result];
};

const useSerialPort = ({ subStep, onDataReceived, onDecision, isLastStep, onDisconnect, onConnectionChange, searchQuery, finalResult, finalReason, onStatusUpdate, generatedCommand, setGeneratedCommand, autoConnect }: JigSectionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPortInfo, setConnectedPortInfo] = useState<any>(null);
  const [availablePorts, setAvailablePorts] = useState<any[]>([]);
  const [isSelectingPort, setIsSelectingPort] = useState(false);

  // Notify parent of connection status changes
  useEffect(() => {
    if (onConnectionChange) onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const [isManualStopped, setIsManualStopped] = useState(false);
  const stopRequestedRef = useRef(false);
  const readingPromiseRef = useRef<Promise<void> | null>(null);
  const accumulatedDataRef = useRef<string>("");
  const writerRef = useRef<any>(null);

  const subStepRef = useRef(subStep);
  const onDecisionRef = useRef(onDecision);
  const isLastStepRef = useRef(isLastStep);
  const searchQueryRef = useRef(searchQuery);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const isCommandBusyRef = useRef(false);
  const persistentLogsRef = useRef<LogEntry[]>([]);
  const setGeneratedCommandRef = useRef(setGeneratedCommand);
  useEffect(() => {
    setGeneratedCommandRef.current = setGeneratedCommand;
  }, [setGeneratedCommand]);

  const stepStartTime = useRef<number>(Date.now());

  // Refs for tracking switch profile completion
  const switchProfileCompletedRef = useRef(false);
  const expectedSwitchProfileRef = useRef<number | null>(null);

  const isLocallyGeneratedRef = useRef(false);

  const generatedCommandRef = useRef(generatedCommand);
  let matchCount = 0;
  useEffect(() => {

    // If we just generated a command locally (isLocallyGeneratedRef is true), 
    if (isLocallyGeneratedRef.current) {
      if (generatedCommand === generatedCommandRef.current) {
        isLocallyGeneratedRef.current = false;
      }
    } else {
      if (generatedCommand !== undefined) {
        generatedCommandRef.current = generatedCommand;
      }
    }
  }, [generatedCommand]);

  useEffect(() => {
    // Reset auto-connect attempt and manual stop flag when subStep changes
    // This allows auto-connect to trigger once per new Jig step
    autoConnectAttemptedRef.current = false;
    setIsManualStopped(false);
  }, [subStep?._id, subStep?.stepName]);

  useEffect(() => {
    if (!("serial" in navigator)) return;

    const updatePorts = async () => {
      const ports = await (navigator as any).serial.getPorts();
      // Filter for USB devices that are actually physically ATTACHED
      const usbPorts = ports.filter((p: any) => p.getInfo().usbVendorId && (p.connected === undefined || p.connected));

      // Perform a quick availability check to filter out ports locked by other apps
      const nonBusyPorts = [];
      for (const p of usbPorts) {
        try {
          // If the port is already open in THIS tab, it's considered non-busy for us
          if (p.readable && p.writable) {
            nonBusyPorts.push(p);
            continue;
          }
          // Attempt a brief open to check for OS-level locks
          await p.open({ baudRate: 115200 });
          await p.close();
          nonBusyPorts.push(p);
        } catch (err: any) {
          // If open fails with NetworkError, it's busy/locked by another application
          if (err.name !== "NetworkError" && err.name !== "InvalidStateError") {
            nonBusyPorts.push(p);
          }
        }
      }
      setAvailablePorts(nonBusyPorts);
    };

    (navigator as any).serial.addEventListener("connect", updatePorts);
    (navigator as any).serial.addEventListener("disconnect", updatePorts);

    // Initial fetch
    updatePorts();

    return () => {
      (navigator as any).serial.removeEventListener("connect", updatePorts);
      (navigator as any).serial.removeEventListener("disconnect", updatePorts);
    };
  }, []);



  useEffect(() => {
    subStepRef.current = subStep;
  }, [subStep]);

  useEffect(() => {
    onDecisionRef.current = onDecision;
  }, [onDecision]);

  useEffect(() => {
    isLastStepRef.current = isLastStep;
  }, [isLastStep]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "data") => {
    const newEntry = { timestamp: formatTimestamp(), message, type };
    persistentLogsRef.current.push(newEntry);
    setLogs((prev) => {
      const newLogs = [...prev, newEntry];
      return newLogs.length > 100 ? newLogs.slice(-100) : newLogs;
    });
  }, []);

  // No longer clearing logs on subStep change to preserve history for download
  useEffect(() => {
    accumulatedDataRef.current = "";
    accumulatedDataRef.current = "";
    if (subStep) {
      stepStartTime.current = Date.now();
      const stepName = subStep.stepName || subStep.name || "Unknown Step";
      const actionType = subStep.stepFields?.actionType || "Process";
      addLog(`--- STARTING STEP: ${stepName} (${actionType}) ---`, "info");

      // Also log expected values/ranges if they exist
      if (subStep.jigFields && Array.isArray(subStep.jigFields)) {
        subStep.jigFields.forEach((f: any) => {
          if (f.validationType === 'range') {
            addLog(`Config: ${f.jigName} (Range: ${f.rangeFrom} to ${f.rangeTo})`, "info");
          } else if (f.validationType === 'value') {
            addLog(`Config: ${f.jigName} (Expected: ${f.value})`, "info");
          }
        });
      }
    }
  }, [subStep, addLog]);

  // Log final decisions from parent
  useEffect(() => {
    const actionType = subStepRef.current?.stepFields?.actionType;
    if (finalResult === "Pass") {
      addLog(`Decision: Pass${actionType ? ` (${actionType})` : ""}`, "success");
    } else if (finalResult === "NG") {
      const msg = finalReason ? `Decision: NG (${finalReason}${actionType ? ` - ${actionType}` : ""})` : `Decision: NG${actionType ? ` (${actionType})` : ""}`;
      addLog(msg, "error");
    }
  }, [finalResult, finalReason, addLog]);


  const clearLogs = useCallback(() => setLogs([]), []);

  const disconnectJig = useCallback(async (isManual: boolean = false) => {
    stopRequestedRef.current = true;
    if (isManual) {
      setIsManualStopped(true);
    }
    if (readerRef.current?.cancel) {
      try { await readerRef.current.cancel(); } catch (e) { console.warn(e); }
    }
    try {
      if (writerRef.current) {
        writerRef.current.releaseLock();
      }
    } catch { }
    writerRef.current = null;
    if (readingPromiseRef.current) {
      try { await readingPromiseRef.current; } catch (e) { console.warn(e); }
      readingPromiseRef.current = null;
    }
    if (portRef.current) {
      try { await portRef.current.close(); } catch (e) { console.error(e); }
      portRef.current = null;
    }
    setConnectedPortInfo(null);
    setIsConnected(false);
    addLog(isManual ? "System Stopped Manually" : "System Disconnected", "info");
  }, [addLog]);


  // Supply disconnect function to parent (moved to fix TDZ)
  useEffect(() => {
    if (onDisconnect) {
      onDisconnect(() => disconnectJig(true)); // Pass true for manual disconnect
    }
  }, [onDisconnect, disconnectJig]);

  // Handle automatic disconnection on unmount (moved to fix TDZ)
  useEffect(() => {
    return () => {
      disconnectJig();
    };
  }, [disconnectJig]);

  const processData = useCallback(
    (text: string) => {
      // Ignore specific unwanted responses
      if (text.includes("PANIC BUTTON PRESSED")) {
        return;
      }

      // Check for switch profile completion message
      if (text.includes("MANUALLY SWITCHED TO ESIM PROFILE")) {
        const textLower = text.toLowerCase();
        if (textLower.includes("profile 1") && expectedSwitchProfileRef.current === 1) {
          switchProfileCompletedRef.current = true;
          addLog("Profile switch to Profile 1 completed!", "success");
        } else if (textLower.includes("profile 2") && expectedSwitchProfileRef.current === 2) {
          switchProfileCompletedRef.current = true;
          addLog("Profile switch to Profile 2 completed!", "success");
        }
      }

      accumulatedDataRef.current += text + "\n";
      const newData = accumulatedDataRef.current;

      const parsedArray = parseJigOutput(newData);

      const parsedData = parsedArray[0];
      const currentSubStep = subStepRef.current;
      if (!currentSubStep?.jigFields) return;

      matchCount = 0;
      let allPassed = true;
      const requiredFieldsCount = currentSubStep.jigFields.length;

      const failedFields: string[] = [];

      currentSubStep.jigFields.forEach((field: any) => {
        let receivedValueString: string | null = null;
        if (parsedData[field.jigName]) {
          receivedValueString = parsedData[field.jigName];
        } else {
          for (const sectionKey in parsedData) {
            if (typeof parsedData[sectionKey] === 'object' && parsedData[sectionKey][field.jigName]) {
              receivedValueString = parsedData[sectionKey][field.jigName];
              break;
            }
          }
        }

        if (receivedValueString !== null && receivedValueString !== undefined) {
          matchCount++;

          if (field.validationType === 'range') {
            const val = parseFloat(receivedValueString);
            if (!isNaN(val)) {
              const min = field.rangeFrom !== null ? parseFloat(field.rangeFrom) : -Infinity;
              const max = field.rangeTo !== null ? parseFloat(field.rangeTo) : Infinity;

              if (val < min || val > max) {
                allPassed = false;
                failedFields.push(`${field.jigName} (${receivedValueString} out of range ${min}-${max})`);
              }
            } else {
              allPassed = false;
              failedFields.push(`${field.jigName} (Invalid numeric value: ${receivedValueString})`);
            }
          } else if (field.validationType === 'value') {
            if (field.value && field.value.trim() !== "") {
              const expected = field.value.trim();
              const received = receivedValueString.toString().trim();

              if (expected !== received) {
                const numExp = parseFloat(expected);
                const numRec = parseFloat(received);
                if (!isNaN(numExp) && !isNaN(numRec)) {
                  if (Math.abs(numExp - numRec) > 0.1) {
                    allPassed = false;
                    failedFields.push(`${field.jigName} (Expected: ${expected}, Got: ${received})`);
                  }
                } else {
                  allPassed = false;
                  failedFields.push(`${field.jigName} (Expected: ${expected}, Got: ${received})`);
                }
              }
            }
          }
        }
      });

      // --- NEW: ESIM Settings logic ---
      if (currentSubStep?.stepFields?.actionType === "ESIM Settings" && matchCount > 0) {
        const ccid = parsedData["CCID"] || parsedData["ccid"] || parsedData["PARAMETERS"]?.["CCID"] || parsedData["PARAMETERS"]?.["ccid"];
        if (ccid) {
          addLog(`Found CCID: ${ccid}. Checking ESIM Master...`, "info");
          (async () => {
            try {
              const res = await getEsimMasterByCcid(ccid);
              if (res && res.data) {
                const d = res.data;
                const cmd = `+#SIM#${d.esimMakeId},${d.profile1Id},${d.profile2Id},${d.apnProfile1},${d.apnProfile2};`;
                const duration = ((Date.now() - stepStartTime.current) / 1000).toFixed(2);
                addLog(`ESIM Master match found! Generated command: ${cmd}`, "success");
                addLog(`Step Duration: ${duration}s`, "success");

                // Update local ref immediately to ensure next step has access even if prop update is delayed
                generatedCommandRef.current = cmd;
                isLocallyGeneratedRef.current = true;

                if (setGeneratedCommandRef.current) {
                  setGeneratedCommandRef.current(cmd);
                }
                onDecisionRef.current?.("Pass", undefined, { ccid, generatedCommand: cmd, parsedData });
              } else {
                addLog(`ESIM Master NOT found for CCID: ${ccid}`, "error");
                onDecisionRef.current?.("NG", `ESIM Master for CCID ${ccid} not found`, { ccid, parsedData });
              }
            } catch (err: any) {
              addLog(`Error checking CCID: ${err.message || err}`, "error");
              onDecisionRef.current?.("NG", `Database error: ${err.message || "Unknown error"}`, { ccid, parsedData });
            }
          })();
          accumulatedDataRef.current = "";
          return;
        }
      }

      // --- NEW: Esim Settings validation logic ---
      if (currentSubStep?.stepFields?.actionType === "Esim Settings validation" && matchCount > 0) {
        const ccid = parsedData["CCID"] || parsedData["ccid"] || parsedData["PARAMETERS"]?.["CCID"] || parsedData["PARAMETERS"]?.["ccid"];
        if (ccid) {
          // addLog(`Validating CCID: ${ccid}. Checking generated command...`, "info");
          const cmd = generatedCommandRef.current;
          console.log("cmd ===>", cmd);

          if (cmd) {
            try {
              // Expected format: +#SIM#Make,PF1,PF2,APN1,APN2;
              const cleanCmd = cmd.replace(/^[+#]+SIM#/i, '').replace(/;$/, '').trim();
              const parts = cleanCmd.split(',').map(p => p.trim());

              if (parts.length >= 5) {
                const masterFieldsMapping: any = {
                  "Esim Make": parts[0],
                  "PFID1": parts[1],
                  "PFID2": parts[2],
                  "APN1": parts[3],
                  "APN2": parts[4]
                };

                // Reconstruct master data object for logging/decision payload
                const d = {
                  esimMakeId: parts[0],
                  profile1Id: parts[1],
                  profile2Id: parts[2],
                  apnProfile1: parts[3],
                  apnProfile2: parts[4]
                };

                let validationPassed = true;
                const validationErrors: string[] = [];

                currentSubStep.jigFields.forEach((field: any) => {
                  const expected = masterFieldsMapping[field.jigName];
                  if (expected !== undefined) {
                    const received = String(parsedData['SETTINGS']?.[field.jigName] || "").trim();

                    if (String(expected).trim() !== received) {
                      validationPassed = false;
                      validationErrors.push(`${field.jigName} mismatch (Expected: ${expected}, Got: ${received})`);
                    }
                  }
                });

                if (validationPassed) {
                  const duration = ((Date.now() - stepStartTime.current) / 1000).toFixed(2);
                  addLog("ESIM Settings Validation Passed!", "success");
                  addLog(`Step Duration: ${duration}s`, "success");
                  onDecisionRef.current?.("Pass", undefined, { ccid, parsedData, masterData: d });
                } else {
                  const errorMsg = validationErrors.join(", ");
                  addLog(`Validation Failed: ${errorMsg}`, "error");
                  onDecisionRef.current?.("NG", `Validation Failed: ${errorMsg}`, { ccid, parsedData, masterData: d }, false);
                }
              } else {
                addLog(`Invalid generated command format: ${cmd}`, "error");
                onDecisionRef.current?.("NG", "Invalid generated command format", { ccid, parsedData });
              }
            } catch (err: any) {
              addLog(`Error during validation: ${err.message || err}`, "error");
              onDecisionRef.current?.("NG", `Validation error: ${err.message || "Unknown error"}`, { ccid, parsedData });
            }
          } else {
            addLog(`Generated command not found for validation.`, "error");
            onDecisionRef.current?.("NG", "Generated command missing", { ccid, parsedData });
          }
          accumulatedDataRef.current = "";
          return;
        } else if (matchCount >= requiredFieldsCount) {
          // If we have all fields but no CCID, mark as NG as per requirement
          addLog("Validation Failed: CCID missing in jig output", "error");
          onDecisionRef.current?.("NG", "CCID missing in jig output", { parsedData });
          accumulatedDataRef.current = "";
          return;
        }
      }

      // --- NEW: Switch Profile validation logic ---
      const actionType = currentSubStep?.stepFields?.actionType;
      const normalizedActionType = actionType?.toLowerCase();
      if ((normalizedActionType === "switch profile 1" || normalizedActionType === "switch profile 2") && matchCount > 0) {
        // Check if switch profile completion message has been received before validating
        if (!switchProfileCompletedRef.current) {
          // Wait for "MANUALLY SWITCHED TO ESIM PROFILE" message before validating
          if (onStatusUpdateRef.current) onStatusUpdateRef.current("Waiting for profile switch completion message...");
          return;
        }

        const findVal = (key: string) => (parsedData[key] || parsedData["SETTINGS"]?.[key] || parsedData["PARAMETERS"]?.[key] || "").trim();
        const nwValue = findVal("N/W");
        const apnValue = findVal("APN");
        const pfValue = findVal("PF");

        console.log("search for value for", normalizedActionType, "== nwValue", nwValue, "apnValue", apnValue, "pfValue", pfValue);

        if (nwValue || apnValue || pfValue) {
          addLog(`Validating ${actionType}: N/W=${nwValue}, APN=${apnValue}, PF=${pfValue}`, "info");
          (async () => {
            try {
              const [profilesRes, apnsRes] = await Promise.all([
                viewEsimProfiles(),
                viewEsimApns()
              ]);

              const profiles = profilesRes.data || [];
              const apns = apnsRes.data || [];

              let validationPassedNw = true;
              let validationPassedApn = true;
              let validationPassedPf = true;

              let errors: string[] = [];

              // 1. Check N/W: profile.name array should include nwValue AND profileId should match pfValue
              if (nwValue) {
                const found = profiles.some((p: any) => {
                  const profileIdMatch = String(p.profileId) === String(pfValue);
                  const nameMatch = Array.isArray(p.name) ? p.name.includes(nwValue) : p.name === nwValue;
                  return profileIdMatch && nameMatch;
                });
                validationPassedNw = true;
                if (!found) {
                  validationPassedNw = false;
                  errors.push(`N/W mismatch: ${nwValue} not found for Profile ${pfValue}`);
                }
              }

              // 2. Check APN: apnName should match AND the profile should match nwValue
              if (apnValue) {
                const found = apns.some((a: any) => {
                  const apnMatch = a.apnName === apnValue;
                  // Check if either esimProfile1 or esimProfile2 matches nwValue
                  const profileMatch = a.esimProfile1 === nwValue;
                  return apnMatch && profileMatch;
                });
                validationPassedApn = true;
                if (!found) {
                  validationPassedApn = false;
                  errors.push(`APN mismatch: ${apnValue} not found for N/W ${nwValue}`);
                }
              }

              // 3. Check PF: profileId should match AND name array should include nwValue
              if (pfValue) {
                const found = profiles.some((p: any) => {
                  const profileIdMatch = String(p.profileId) === String(pfValue);
                  const nameMatch = Array.isArray(p.name) ? p.name.includes(nwValue) : p.name === nwValue;
                  return profileIdMatch && nameMatch;
                });
                console.log("found pfValue ==>", found, "(checking pfValue:", pfValue, "nwValue:", nwValue, ")");
                validationPassedPf = true;
                if (!found) {
                  validationPassedPf = false;
                  errors.push(`PF mismatch: Profile ${pfValue} not found for N/W ${nwValue}`);
                }
              }
              // return false;
              if (validationPassedPf && validationPassedApn && validationPassedNw) {
                const duration = ((Date.now() - stepStartTime.current) / 1000).toFixed(2);

                addLog(`${actionType} Validation Passed!`, "success");

                addLog(`Step Duration: ${duration}s`, "success");
                onDecisionRef.current?.("Pass", undefined, { parsedData }, true);
                switchProfileCompletedRef.current = false;
                return;

              } else {
                const errorMsg = errors.join(", ");
                if (switchProfileCompletedRef.current) {
                  addLog(`Validation Failed: ${errorMsg}`, "error");
                  onDecisionRef.current?.("NG", `Validation Failed: ${errorMsg}`, { parsedData }, false);
                }
              }
            } catch (err: any) {
              if (switchProfileCompletedRef.current) {
                addLog(`Error during validation: ${err.message || err}`, "error");
                onDecisionRef.current?.("NG", `Validation error: ${err.message || "Unknown error"}`, { parsedData });
              }
            }
          })();
          accumulatedDataRef.current = "";
          return;
        } else if (matchCount >= requiredFieldsCount) {
          // If we have all fields but no relevant eSIM fields, fail
          addLog("Validation Failed: Relevant fields (N/W, APN, PF) missing in jig output", "error");
          onDecisionRef.current?.("NG", "Relevant fields missing in jig output", { parsedData });
          accumulatedDataRef.current = "";
          return;
        }
      }
      if (matchCount < requiredFieldsCount) {
        const missing = currentSubStep.jigFields.filter((field: any) => {
          let found = false;
          if (parsedData[field.jigName]) found = true;
          else {
            for (const sectionKey in parsedData) {
              if (typeof parsedData[sectionKey] === 'object' && parsedData[sectionKey][field.jigName]) {
                found = true;
                break;
              }
            }
          }
          return !found;
        }).map((f: any) => f.jigName);
        if (missing.length > 0) {

        }

        // --- NEW: Report current status to parent for better timeout reasons ---
        let currentStatusNote = "";
        if (failedFields.length > 0) {
          currentStatusNote = `Failed: ${failedFields.join(", ")}`;
        }
        if (missing.length > 0) {
          const missingNote = `Missing: ${missing.join(", ")}`;
          currentStatusNote = currentStatusNote ? `${currentStatusNote} | ${missingNote}` : missingNote;
        }

        if (currentStatusNote && onStatusUpdateRef.current) {
          onStatusUpdateRef.current(currentStatusNote);
        }
      }

      if (matchCount > 0 && onDecisionRef.current) {
        if (matchCount >= requiredFieldsCount) {
          // REMOVED BLOCKING: if (isCommandBusyRef.current) { ... }
          // We want to process data even if command was just sent, because response might be fast.

          // HOWEVER: If a command is DEFINED for this step, but we haven't sent it yet, we should NOT validate yet.
          // This prevents validating "stale" or "noise" data before the command triggers the real response.
          let stepCommand = currentSubStep?.stepFields?.command;
          const currentStepId = currentSubStep?._id || currentSubStep?.stepName || currentSubStep?.name;
          const actionTypeLow = currentSubStep?.stepFields?.actionType?.toLowerCase();

          // Check for implicit commands (Switch Profile defaults)
          if (!stepCommand) {
            if (actionTypeLow === "switch profile 1") stepCommand = "+#SWITCHPF1;";
            if (actionTypeLow === "switch profile 2") stepCommand = "+#SWITCHPF2;";
          }

          // Check if command is supposedly auto-sent but hasn't been sent yet
          // Note: lastSentCommandStepRef is updated in the useEffect calling sendCommand.
          // If stepCommand exists and is NOT "@GENERATED_COMMAND" (or if it is, checking effective command),stil
          // we want to ensure we sent it.
          // Since useEffect runs after render, there might be a gap.
          // If we receive data, but lastSentCommandStepRef.current !== currentStepId, it means command hasn't been sent.
          // (Unless it's a step without a command).

          // Simplified check: if step has command and we haven't recorded sending it â†’ wait
          // Simplified check: if step has command and we haven't recorded sending it -> wait
          if (stepCommand && lastSentCommandStepRef.current !== currentStepId) {
            if (onStatusUpdateRef.current) onStatusUpdateRef.current("Waiting for auto-command execution...");
            return;
          }

          // BLOCKING LOGIC (Conditionally Applied):
          // For "Switch Profile" steps, we want to IGNORE data for a short time after sending the command
          // to avoid validating against OLD telemetry data before the switch happens.
          // For "Validation" steps, we want to catch the fast response, so we don't block.
          const isSwitchProfile = actionTypeLow?.includes("switch profile");

          if (isSwitchProfile && isCommandBusyRef.current) {
            if (onStatusUpdateRef.current) onStatusUpdateRef.current("Waiting for profile switch (ignoring old data)...");
            return;
          }

          const status = allPassed ? "Pass" : "NG";
          const reasonStr = !allPassed ? failedFields.join(", ") : undefined;

          if (allPassed) {
            const duration = ((Date.now() - stepStartTime.current) / 1000).toFixed(2);
            addLog(`Step Duration: ${duration}s`, "success");
          }

          if (!allPassed) {
            addLog(`NG Reason: ${reasonStr}`, "error");
          }

          // Handle Store to DB (including custom flow "Through Jig Stages")
          const collectedData: any = {};
          const actionType = currentSubStep.stepFields?.actionType;
          const isStoreToDb =
            actionType === "Store to DB" ||
            actionType === "Through Jig Stages";
          if (isStoreToDb && currentSubStep.jigFields) {
            currentSubStep.jigFields.forEach((field: any) => {
              const fieldName = field.jigName;
              let val = parsedData[fieldName];
              if (val === undefined) {
                for (const sectionKey in parsedData) {
                  if (typeof parsedData[sectionKey] === 'object' && parsedData[sectionKey][fieldName]) {
                    val = parsedData[sectionKey][fieldName];
                    break;
                  }
                }
              }
              if (val !== undefined) {
                collectedData[fieldName] = val;
                addLog(`Stored Field [${fieldName}]: ${val}`, "info");
              }
            });
            updateCustomFieldsDataIntoDB(collectedData, searchQueryRef.current);
          }

          // For the new requirement: Pass is immediate, NG waits for timeout (isImmediate: false)
          // Include complete terminal logs in the data
          const dataWithLogs = {
            ...collectedData,
            terminalLogs: persistentLogsRef.current.map(log => ({
              timestamp: log.timestamp,
              message: log.message,
              type: log.type
            })),
            parsedData: parsedData
          };

          onDecisionRef.current(status, reasonStr, dataWithLogs, allPassed);

          if (allPassed && isLastStepRef.current) {
            disconnectJig();
          }
          accumulatedDataRef.current = "";
        }
      }
    },
    [addLog, disconnectJig]
  );

  const updateCustomFieldsDataIntoDB = async (collectedData: any, searchQuery: any) => {
    try {
      const pathname = window.location.pathname;
      const id = searchQuery;
      const formData = new FormData();
      formData.append("customFields", JSON.stringify(collectedData));

      const result = await updateStageBySerialNo(id, formData);
      // toast.success("User details submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:");
      toast.error("Failed to submit user details. Please try again.");
    }
  }

  const sendCommand = useCallback(
    async (command: string, eol: "CRLF" | "LF" | "CR" | "NONE" = "CRLF") => {
      const cmd = (command || "").trim();
      if (!cmd) return false;
      if (!isConnected || !portRef.current || !(navigator as any).serial) {
        addLog("Cannot send: not connected", "error");
        return false;
      }
      try {
        const encoder = new TextEncoder();
        let suffix = "\r\n";
        if (eol === "LF") suffix = "\n";
        else if (eol === "CR") suffix = "\r";
        else if (eol === "NONE") suffix = "";
        const payload = encoder.encode(cmd + suffix);
        const writer = portRef.current.writable?.getWriter();
        writerRef.current = writer;
        await writer.write(payload);
        writer.releaseLock();
        writerRef.current = null;
        addLog(`TX: ${cmd}`, "info");

        return true;
      } catch (e: any) {
        addLog(`Send failed: ${e?.message || e}`, "error");
        try {
          if (writerRef.current) writerRef.current.releaseLock();
        } catch { }
        writerRef.current = null;
        return false;
      }
    },
    [isConnected, addLog]
  );

  // Automatic Command Sending logic
  const lastSentCommandStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      lastSentCommandStepRef.current = null;
      return;
    }

    const currentStepId = subStep?._id || subStep?.stepName || subStep?.name;
    const actionType = subStep?.stepFields?.actionType;
    let command = subStep?.stepFields?.command;


    // Use default commands for Switch Profile if missing
    if (actionType?.toLowerCase() === "switch profile 1" && !command) command = "+#SWITCHPF1;";
    if (actionType?.toLowerCase() === "switch profile 2" && !command) command = "+#SWITCHPF2;";

    // Use generated command if placeholder is used or if it's Esim Settings validation with no command
    // IMPORTANT: Prioritize generatedCommandRef because it captures the immediate update from the previous "ESIM Settings" step logic.
    // The prop 'generatedCommand' might be stale or lagging from the parent.
    const effectiveGeneratedCommand = generatedCommandRef.current || generatedCommand;

    // Ensure we don't accidentally use a "waiting" or non-command value if that ever happens
    // UPDATE: Start using generated command even if there is a stale command in the step config (removing !command check for Esim validation)
    if ((command === "@GENERATED_COMMAND" || actionType === "Esim Settings validation") && effectiveGeneratedCommand) {
      command = effectiveGeneratedCommand;
    }

    console.log("Command execution check:", { actionType, command, isConnected, currentStepId, lastSent: lastSentCommandStepRef.current });

    const normalizedAction = actionType?.toLowerCase();
    const isSerialCommandStep =
      normalizedAction === "command" ||
      normalizedAction === "through serial" ||
      normalizedAction === "custom fields";
    if (
      isConnected &&
      (isSerialCommandStep ||
        normalizedAction === "switch profile 2" ||
        normalizedAction === "switch profile 1" ||
        actionType === "Esim Settings validation") &&
      command &&
      lastSentCommandStepRef.current !== currentStepId
    ) {
      // Reset switch profile tracking flags before sending new command
      if (actionType?.toLowerCase() === "switch profile 1" || actionType?.toLowerCase() === "switch profile 2") {
        switchProfileCompletedRef.current = false;
        if (command.includes("SWITCHPF1")) {
          expectedSwitchProfileRef.current = 1;
        } else if (command.includes("SWITCHPF2")) {
          expectedSwitchProfileRef.current = 2;
        }
        addLog(`Waiting for profile switch to complete...`, "info");
      }

      addLog(`Auto-sending command: ${command}`, 'info');
      isCommandBusyRef.current = true;
      sendCommand(command).then(() => {
        matchCount = 0;
        addLog(`Command Executed: ${command}`, 'success');
        console.log("command sent : ==>", command);
        // Wait for 1.5s after command is sent to allow jig to process/respond fully
        setTimeout(() => {
          isCommandBusyRef.current = false;
        }, 1500);
      });
      lastSentCommandStepRef.current = currentStepId;
    }
  }, [isConnected, subStep, sendCommand, generatedCommand]);


  const startReading = async (port: any) => {
    if (!port?.readable) return;
    const decoder = new TextDecoder();
    let buffer = "";

    while (!stopRequestedRef.current && port.readable) {
      const reader = port.readable.getReader();
      readerRef.current = reader;

      try {
        while (!stopRequestedRef.current) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          let processIndex = -1;
          for (let i = buffer.length - 1; i >= 0; i--) {
            if (buffer[i] === '\n' || buffer[i] === '\r') {
              processIndex = i;
              break;
            }
          }

          if (processIndex !== -1) {
            const completeData = buffer.substring(0, processIndex + 1);
            buffer = buffer.substring(processIndex + 1);
            const lines = completeData.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.length === 0) continue;

              // Filter out unwanted messages globally
              if (trimmedLine.includes("PANIC BUTTON PRESSED")) continue;

              addLog(trimmedLine, "data");
              if (onDataReceived) onDataReceived(trimmedLine);
              processData(trimmedLine);
            }
          }
        }
      } catch (error: any) {
        if (stopRequestedRef.current) break;

        // FramingErrors and other stream errors close the reader.
        if (error.name === 'FramingError' || error.name === 'ParityError' || error.name === 'BufferOverrunError') {
          console.warn(`Serial Stream Error: ${error.name}. Restarting reader...`);
          addLog(`Stream Error (${error.name}), recovering...`, "info");
          await new Promise(r => setTimeout(r, 100));
          continue;
        }

        console.error("Fatal Read error:", error);
        addLog(`Fatal Read error: ${error.message || error}`, "error");
        break;
      } finally {
        try { reader.releaseLock(); } catch { }
        if (readerRef.current === reader) readerRef.current = null;
      }
    }
  };



  const connectToJig = async (existingPort?: any) => {
    try {
      if (!(navigator as any).serial) {
        addLog("Web Serial API is not supported in this browser.", "error");
        return false;
      }

      if (isConnected || portRef.current) return true;

      setIsManualStopped(false); // Clear stop flag on intentional connection
      let port = (existingPort && typeof existingPort.open === "function") ? existingPort : null;
      if (!port) {
        // Filter to show only USB serial ports
        port = await (navigator as any).serial.requestPort({
          filters: USB_FILTERS
        });
      }

      await port.open({ baudRate: 115200 });

      portRef.current = port;
      stopRequestedRef.current = false;
      setConnectedPortInfo(port.getInfo());
      setIsConnected(true);
      addLog(`Port Connected ${existingPort ? '(Auto)' : ''} (115200 baud)`, "success");

      // Save last used port for auto-reconnect on step changes
      localStorage.setItem("last_jig_port", JSON.stringify({
        vid: port.getInfo().usbVendorId,
        pid: port.getInfo().usbProductId
      }));

      readingPromiseRef.current = startReading(port);
      setIsSelectingPort(false);
      return true;

    } catch (error: any) {
      console.error("Connection failed:", error);
      let msg = "Connection Failed: ";
      if (error.name === "NetworkError") msg += "Port busy or locked.";
      else if (error.name === "NotFoundError") msg += "No device selected.";
      else msg += error.message;

      addLog(msg, "error");

      // Only show alert if it was a manual user action (no existingPort passed)
      if (!existingPort && error.name !== "NotFoundError") alert(msg);
      return false;
    }
  };



  /* Simulation Mode Disabled
  const simulateJigConnection = useCallback(() => {
    stopRequestedRef.current = false;
    setIsConnected(true);
    addLog("Simulation Mode Started", "info");
    
    const interval = setInterval(() => {
      if (subStep?.jigFields && Array.isArray(subStep.jigFields)) {
        const simulatedData = subStep.jigFields.map((field: any) => {
          let val;
          if (field.value && !isNaN(parseFloat(field.value))) {
             const base = parseFloat(field.value);
             const isPass = Math.random() > 0.2;
             val = isPass ? base.toFixed(2) : (base * 1.5).toFixed(2);
          } else {
             val = Math.floor(Math.random() * 100).toString();
          }
          return `${field.jigName}:${val}`;
        }).join("\n");
        
        const text = `PARAMETERS:\n${simulatedData}`;
        addLog(text, "data");
        if (onDataReceived) onDataReceived(text);
        processData(text);
      } else {
        const text = `Received: SN${Math.floor(Math.random() * 1000000)}`;
        addLog(text, "data");
        if (onDataReceived) onDataReceived(text);
      }
    }, 3000);
    
    (readerRef as any).current = { cancel: () => clearInterval(interval) };
  }, [subStep, addLog, onDataReceived, processData]);
  */

  // Dummy function to satisfy types
  const simulateJigConnection = useCallback(() => { }, []);

  const downloadLogs = useCallback(() => {
    if (persistentLogsRef.current.length === 0) {
      if (logs.length === 0) return;
      // Fallback if persistent is somehow empty but state isn't
      const content = logs.map(l => `[${l.timestamp}] [${l.type || 'data'}] ${l.message}`).join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      triggerDownload(blob);
      return;
    }
    const content = persistentLogsRef.current.map(l => `[${l.timestamp}] [${l.type || 'data'}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    triggerDownload(blob);
  }, [logs]);

  const triggerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-connect when component mounts if autoConnect prop is true
  const autoConnectAttemptedRef = useRef(false);

  useEffect(() => {
    // Only try once per step or when manual override happens
    if (!autoConnect || isConnected || autoConnectAttemptedRef.current || isManualStopped) return;

    autoConnectAttemptedRef.current = true;

    // const tryAutoConnect = async () => {
    //   // Small delay to let component stabilize
    //   await new Promise(resolve => setTimeout(resolve, 200));

    //   try {
    //     if (!(navigator as any).serial) return;

    //     // Check if already connected to avoid unnecessary disconnect/reconnect
    //     if (isConnected || portRef.current) return;

    //     const ports = await (navigator as any).serial.getPorts();
    //     if (ports.length > 0) {
    //       const port = ports[0];

    //       // Check if port is already open and ready
    //       if (port.readable && port.writable) {
    //         // Port is already open, just reuse it
    //         portRef.current = port;
    //         stopRequestedRef.current = false;
    //         setIsConnected(true);
    //         addLog("Port Connected (Auto-Reuse) (115200 baud)", "success");
    //         readingPromiseRef.current = startReading(port);
    //       } else {
    //         // Port needs to be opened
    //         await connectToJig(port);
    //       }
    //     }
    //   } catch (error) {
    //     console.warn("Auto-connect failed:", error);
    //     // Silently fail - user can manually connect if needed
    //   }
    // };

    //  this should only read the usb serial port not all ports
    // Updated tryAutoConnect to handle multiple ports and busy port fallback
    const tryAutoConnect = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        if (!("serial" in navigator)) return;
        if (isConnected || portRef.current) return;

        // Get ONLY already-granted USB ports
        const ports = await (navigator as any).serial.getPorts();

        // Filter only USB devices that are PHYSICALLY ATTACHED
        const usbPorts = ports.filter(
          (port: any) => port.getInfo().usbVendorId && (port.connected === undefined || port.connected)
        );

        // Pre-filter busy ports so we don't show them in the manual selection list
        const readyPorts = [];
        for (const p of usbPorts) {
          try {
            if (p.readable && p.writable) { readyPorts.push(p); continue; }
            await p.open({ baudRate: 115200 });
            await p.close();
            readyPorts.push(p);
          } catch (e: any) {
            if (e.name !== "NetworkError") readyPorts.push(p);
          }
        }

        setAvailablePorts(readyPorts);
        const activePorts = readyPorts; // Use the verified list for the rest of the logic

        if (usbPorts.length > 0) {
          // Priority 1: Try to match the last used port
          const savedPort = localStorage.getItem("last_jig_port");
          if (savedPort) {
            const { vid, pid, serialNumber } = JSON.parse(savedPort);
            const match = activePorts.find((p: any) => {
              const info = p.getInfo();
              console.log("USB Port Info :", info);
              const basicMatch = info.usbVendorId === vid && info.usbProductId === pid;
              // If we have a serial number saved, use it for exact hardware matching to tell apart identical FTDI chips
              return serialNumber ? (basicMatch && info.serialNumber === serialNumber) : basicMatch;
            });

            if (match) {
              addLog(`Found last used port (VID: ${vid.toString(16)}, PID: ${pid.toString(16)}). Reconnecting...`, "info");
              const success = await openOrReusePort(match);
              if (success) return;
            }
          }

          // Case 1: Only one USB device → auto connect
          if (activePorts.length === 1) {
            await openOrReusePort(activePorts[0]);
            return;
          }

          // Case 2: Multiple USB devices → Attempt auto-connect to non-busy one
          if (activePorts.length > 1) {

            addLog(`${activePorts.length} USB devices attached.Checking for available port...`, "info");

            for (const port of activePorts) {
              const info = port.getInfo();
              // Don't log for every single port unless we are stuck
              const success = await openOrReusePort(port);
              if (success) return;
            }

            addLog("Multiple ports detected but none could be auto-connected. Please select manually.", "info");
            setIsSelectingPort(true);
            return;
          }
        }

        // Case 3: No USB devices → force picker (filtered)
        if (usbPorts.length === 0) {
          addLog("No known USB serial devices found. Ready f or manual connection.", "info");
        }

      } catch (error) {
        console.warn("Auto-connect failed:", error);
      }
    };


    const openOrReusePort = async (port: any) => {
      if (port.readable && port.writable) {
        // Already open
        portRef.current = port;
        setConnectedPortInfo(port.getInfo());
        stopRequestedRef.current = false;
        setIsConnected(true);
        addLog("Port Connected (Auto-Reuse) (115200 baud)", "success");
        if (readingPromiseRef.current) {
          // Promise might be running, but we should make sure
        } else {
          readingPromiseRef.current = startReading(port);
        }
        return true;
      } else {
        // Need to open
        return await connectToJig(port);
      }
    };

    tryAutoConnect();

    // Reset the flag when component unmounts
    return () => {
      autoConnectAttemptedRef.current = false;
    };
  }, [autoConnect, isConnected]); // Depend on autoConnect and isConnected to re-check if needed

  return { isConnected, connectedPortInfo, connectToJig, disconnectJig, simulateJigConnection, logs, clearLogs, downloadLogs, sendCommand, availablePorts, isSelectingPort, setIsSelectingPort };
};

// --- Sub-Components ---

const Header = ({ isConnected, connectedPortInfo, onConnect, onDisconnect, onSimulate, availablePorts, onSelectPort, isSelectingPort }: any) => (
  <div className="flex flex-col border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all ${isConnected ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
          <Cable className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Jig Interface</h3>
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2 w-2`}>
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'hidden'}`}></span>
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </span>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isConnected ? (
                <span>
                  Connected: <span className="text-blue-500 dark:text-blue-400 font-bold">
                    {getFriendlyName(connectedPortInfo)}
                  </span>
                </span>
              ) : 'Ready to Connect'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {!isConnected ? (
          <>
            <button onClick={onConnect} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95">
              <Cable className="h-4 w-4" />
              Connect Device
            </button>
          </>
        ) : (
          <button onClick={onDisconnect} className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2 text-xs font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 hover:shadow dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
            <Square className="h-4 w-4 fill-current" />
            Stop Connection
          </button>
        )}
      </div>
    </div>

    {/* Port Selector Section */}
    {availablePorts && availablePorts.length > 1 && !isConnected && (
      <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-gray-400 border-l-2 border-blue-500 pl-2 uppercase tracking-wider">Select Available Device:</div>
          <div className="text-[9px] text-gray-400 italic font-medium">* System COM names (COM10, etc.) are hidden by browser security</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {availablePorts.map((p: any, idx: number) => {
            const info = p.getInfo();
            return (
              <button
                key={idx}
                onClick={() => onSelectPort(p)}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-600 shadow-sm transition-all hover:border-blue-500 hover:text-blue-600 group dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                title={`Device ID: ${info.usbVendorId?.toString(16).toUpperCase()}:${info.usbProductId?.toString(16).toUpperCase()}`}
              >
                <span className="flex h-5 items-center rounded bg-blue-50 px-1.5 text-[9px] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  PORT {idx + 1}
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 group-hover:animate-pulse" />
                {getFriendlyName(info)}
              </button>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

const TerminalOutput = ({ logs, onClear, onDownload, onSend, connected, expanded }: { logs: LogEntry[]; onClear: () => void; onDownload: () => void; onSend: (cmd: string, eol: "CRLF" | "LF" | "CR" | "NONE") => void; connected: boolean; expanded?: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cmd, setCmd] = useState("");
  const [eol, setEol] = useState<"CRLF" | "LF" | "CR" | "NONE">("CRLF");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col bg-[#1e1e1e] text-gray-100">
      <div className="flex items-center justify-between border-b border-gray-800 bg-[#252526] px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <Terminal className="h-3.5 w-3.5" />
          <span>SERIAL CONSOLE</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClear} className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white" title="Clear Console">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDownload} className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white" title="Download Logs">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-800 bg-[#252526] px-3 py-2">
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Enter command"
          className="flex-1 rounded bg-[#1e1e1e] px-3 py-2 text-xs text-white outline-none ring-1 ring-gray-700 focus:ring-blue-500"
        />
        {/* <select
           value={eol}
           onChange={(e) => setEol(e.target.value as any)}
           className="rounded bg-[#1e1e1e] px-2 py-2 text-xs text-gray-200 ring-1 ring-gray-700 focus:ring-blue-500"
           title="Line ending"
         >
           <option value="CRLF">CRLF</option>
           <option value="LF">LF</option>
           <option value="CR">CR</option>
           <option value="NONE">NONE</option>
         </select> */}
        <button
          onClick={() => onSend(cmd, eol)}
          disabled={!connected || !cmd.trim()}
          className={`rounded px-4 py-2 text-xs font-bold ${connected && cmd.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-gray-400'}`}
        >
          Send
        </button>
      </div>

      <div
        ref={scrollRef}
        className={`${expanded ? 'min-h-[20rem]' : 'h-80 overflow-y-auto scrollbar-thin scrollbar-track-[#1e1e1e] scrollbar-thumb-[#424242] scrollbar-thumb-rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#5a5a5a] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#1e1e1e] [&::-webkit-scrollbar]:w-2'} p-4 font-mono text-xs leading-relaxed`}
      >
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <Activity className="mb-2 h-8 w-8 opacity-20" />
            <p>Waiting for data stream...</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3 hover:bg-white/5">
              <span className="shrink-0 select-none text-gray-400 font-medium">[{log.timestamp}]</span>
              <span className={`break-all tracking-wide ${log.type === 'error' ? 'text-red-400 font-bold' :
                log.type === 'success' ? 'text-green-400 font-bold' :
                  log.type === 'info' ? 'text-cyan-400 font-semibold' :
                    'text-white font-semibold'
                }`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 bg-[#252526] px-3 py-1 text-[10px] text-gray-500">
        <span>Ln {logs.length}, Col 1</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function JigSection(props: JigSectionProps) {
  const { isConnected, connectedPortInfo, connectToJig, disconnectJig, simulateJigConnection, logs, clearLogs, downloadLogs, sendCommand, availablePorts, isSelectingPort } = useSerialPort(props);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl transition-all dark:bg-gray-900 dark:border-gray-800">
      <Header
        isConnected={isConnected}
        connectedPortInfo={connectedPortInfo}
        onConnect={() => connectToJig()}
        onDisconnect={() => disconnectJig(true)}
        onSimulate={simulateJigConnection}
        availablePorts={availablePorts}
        onSelectPort={(port: any) => connectToJig(port)}
        isSelectingPort={isSelectingPort}
      />
      <TerminalOutput logs={logs} onClear={clearLogs} onDownload={downloadLogs} onSend={sendCommand} connected={isConnected} expanded={props.expanded} />
    </div>
  );
}
