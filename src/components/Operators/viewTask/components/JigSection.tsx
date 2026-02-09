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
}

interface LogEntry {
  timestamp: string;
  message: string;
  type?: "info" | "success" | "error" | "data";
}

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

const useSerialPort = ({ subStep, onDataReceived, onDecision, isLastStep, onDisconnect, onConnectionChange, searchQuery, finalResult, finalReason, onStatusUpdate, generatedCommand, setGeneratedCommand }: JigSectionProps) => {
  const [isConnected, setIsConnected] = useState(false);

  // Notify parent of connection status changes
  useEffect(() => {
    if (onConnectionChange) onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
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
    if (subStep) {
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

  const disconnectJig = useCallback(async () => {
    stopRequestedRef.current = true;
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
    setIsConnected(false);
    addLog("System Disconnected", "info");
  }, [addLog]);


  // Supply disconnect function to parent (moved to fix TDZ)
  useEffect(() => {
    if (onDisconnect) {
      onDisconnect(() => disconnectJig());
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
      accumulatedDataRef.current += text + "\n";
      const newData = accumulatedDataRef.current;

      const parsedArray = parseJigOutput(newData);
      const parsedData = parsedArray[0];

      const currentSubStep = subStepRef.current;
      if (!currentSubStep?.jigFields) return;

      let matchCount = 0;
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
                addLog(`ESIM Master match found! Generated command: ${cmd}`, "success");
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
          addLog(`Validating CCID: ${ccid}. Checking ESIM Master...`, "info");
          (async () => {
            try {
              const res = await getEsimMasterByCcid(ccid);
              if (res && res.data) {
                const d = res.data;
                const masterFieldsMapping: any = {
                  "Esim Make": d.esimMakeId,
                  "PFID1": d.profile1Id,
                  "PFID2": d.profile2Id,
                  "APN1": d.apnProfile1,
                  "APN2": d.apnProfile2
                };

                let validationPassed = true;
                const validationErrors: string[] = [];

                currentSubStep.jigFields.forEach((field: any) => {
                  const expected = masterFieldsMapping[field.jigName];
                  if (expected !== undefined) {
                    const received = String(parsedData['SETTINGS']?.[field.jigName] || "").trim();
                    console.log("field.jigName ==>", field.jigName);
                    console.log("parsedData ==>", parsedData);
                    console.log(`${field.jigName}`, "===", "received values from jig  ==>", received);

                    if (String(expected).trim() !== received) {
                      validationPassed = false;
                      validationErrors.push(`${field.jigName} mismatch (Expected: ${expected}, Got: ${received})`);
                    }
                  }
                });

                if (validationPassed) {
                  addLog("ESIM Settings Validation Passed!", "success");
                  onDecisionRef.current?.("Pass", undefined, { ccid, parsedData, masterData: d });
                } else {
                  const errorMsg = validationErrors.join(", ");
                  addLog(`Validation Failed: ${errorMsg}`, "error");
                  onDecisionRef.current?.("NG", `Validation Failed: ${errorMsg}`, { ccid, parsedData, masterData: d }, false);
                }
              } else {
                addLog(`ESIM Master NOT found for CCID: ${ccid}`, "error");
                onDecisionRef.current?.("NG", `ESIM Master for CCID ${ccid} not found`, { ccid, parsedData });
              }
            } catch (err: any) {
              addLog(`Error during validation: ${err.message || err}`, "error");
              onDecisionRef.current?.("NG", `Validation error: ${err.message || "Unknown error"}`, { ccid, parsedData });
            }
          })();
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
        const findVal = (key: string) => (parsedData[key] || parsedData["SETTINGS"]?.[key] || parsedData["PARAMETERS"]?.[key] || "").trim();
        const nwValue = findVal("N/W");
        const apnValue = findVal("APN");
        const pfValue = findVal("PF");

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

              let validationPassed = true;
              let errors: string[] = [];

              // 1. Check N/W in profiles.name array
              if (nwValue) {
                const found = profiles.some((p: any) =>
                  Array.isArray(p.name) ? p.name.includes(nwValue) : p.name === nwValue
                );
                if (!found) {
                  validationPassed = false;
                  errors.push(`N/W mismatch: ${nwValue} not found in master records`);
                }
              }

              // 2. Check APN in apns.apnName
              if (apnValue) {
                const found = apns.some((a: any) => a.apnName === apnValue);
                if (!found) {
                  validationPassed = false;
                  errors.push(`APN mismatch: ${apnValue} not found in master records`);
                }
              }

              // 3. Check PF in profiles.profileId
              if (pfValue) {
                const found = profiles.some((p: any) => p.profileId === pfValue);
                if (!found) {
                  validationPassed = false;
                  errors.push(`PF mismatch: ${pfValue} not found in master records`);
                }
              }

              if (validationPassed) {
                addLog(`${actionType} Validation Passed!`, "success");
                onDecisionRef.current?.("Pass", undefined, { parsedData }, true);
              } else {
                const errorMsg = errors.join(", ");
                addLog(`Validation Failed: ${errorMsg}`, "error");
                onDecisionRef.current?.("NG", `Validation Failed: ${errorMsg}`, { parsedData }, false);
              }
            } catch (err: any) {
              addLog(`Error during validation: ${err.message || err}`, "error");
              onDecisionRef.current?.("NG", `Validation error: ${err.message || "Unknown error"}`, { parsedData });
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
      } if (matchCount < requiredFieldsCount) {
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
          if (isCommandBusyRef.current) {

            // Optionally add a small status message to notify the user
            if (onStatusUpdateRef.current) onStatusUpdateRef.current("Waiting for command completion...");
            return;
          }

          const status = allPassed ? "Pass" : "NG";
          const reasonStr = !allPassed ? failedFields.join(", ") : undefined;

          if (!allPassed) {
            addLog(`NG Reason: ${reasonStr}`, "error");
          }

          // Handle Store to DB
          const collectedData: any = {};
          if (currentSubStep.stepFields?.actionType === "Store to DB" && currentSubStep.jigFields) {
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

    // Use generated command if placeholder is used or if it's Esim Settings validation with no command
    if ((command === "@GENERATED_COMMAND" || (actionType === "Esim Settings validation" && !command)) && generatedCommand) {
      command = generatedCommand;
    }

    if (isConnected && (actionType === "Command" || actionType === "Custom Fields" || actionType?.toLowerCase() === "switch profile 2" || actionType?.toLowerCase() === "switch profile 1" || actionType === "Esim Settings validation") && command && lastSentCommandStepRef.current !== currentStepId) {
      addLog(`Auto-sending command: ${command}`, 'info');
      isCommandBusyRef.current = true;
      sendCommand(command).then(() => {
        // Wait for 1.5s after command is sent to allow jig to process/respond fully
        setTimeout(() => {
          isCommandBusyRef.current = false;
        }, 1500);
      });
      lastSentCommandStepRef.current = currentStepId;
    }
  }, [isConnected, subStep, sendCommand]);


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
        return;
      }

      if (portRef.current || isConnected) await disconnectJig();

      let port = (existingPort && typeof existingPort.open === "function") ? existingPort : null;
      if (!port) {
        port = await (navigator as any).serial.requestPort();
      }

      await port.open({ baudRate: 115200 });

      portRef.current = port;
      stopRequestedRef.current = false;
      setIsConnected(true);
      addLog(`Port Connected ${existingPort ? '(Auto)' : ''} (115200 baud)`, "success");

      readingPromiseRef.current = startReading(port);

    } catch (error: any) {
      console.error("Connection failed:", error);
      let msg = "Connection Failed: ";
      if (error.name === "NetworkError") msg += "Port busy or locked.";
      else if (error.name === "NotFoundError") msg += "No device selected.";
      else msg += error.message;
      addLog(msg, "error");
      if (!existingPort) alert(msg);
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

  return { isConnected, connectToJig, disconnectJig, simulateJigConnection, logs, clearLogs, downloadLogs, sendCommand };
};

// --- Sub-Components ---

const Header = ({ isConnected, onConnect, onDisconnect, onSimulate }: any) => (
  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all ${isConnected ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
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
            {isConnected ? 'Device Connected' : 'Ready to Connect'}
          </p>
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      {!isConnected ? (
        <>
          {/* Simulation Mode Disabled
          <button onClick={onSimulate} className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <Play className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" />
            Simulation
          </button>
          */}
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
  const { isConnected, connectToJig, disconnectJig, simulateJigConnection, logs, clearLogs, downloadLogs, sendCommand } = useSerialPort(props);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl transition-all dark:bg-gray-900 dark:border-gray-800">
      <Header
        isConnected={isConnected}
        onConnect={connectToJig}
        onDisconnect={disconnectJig}
        onSimulate={simulateJigConnection}
      />
      <TerminalOutput logs={logs} onClear={clearLogs} onDownload={downloadLogs} onSend={sendCommand} connected={isConnected} expanded={props.expanded} />
    </div>
  );
}
