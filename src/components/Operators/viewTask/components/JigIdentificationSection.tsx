"use client";
import React, { useState, useRef } from "react";
import { Cable, Search, Loader2, AlertCircle, Terminal, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";

interface JigIdentificationSectionProps {
    jigStageFields: any[];
    onIdentify: (capturedFields: any) => Promise<void>;
    isSearching: boolean;
    error: string | null;
}

const normalizeFieldKey = (value: string) =>
    String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const getFieldKeyVariants = (fieldName: string) => {
    const base = normalizeFieldKey(fieldName);
    const variants = new Set<string>([base]);

    if (base.includes("imei")) {
        variants.add("imei");
        variants.add("imeino");
        variants.add("imeinumber");
    }
    if (base.includes("serial") || base === "sn" || base === "sno") {
        variants.add("serial");
        variants.add("serialno");
        variants.add("serialnumber");
        variants.add("sn");
        variants.add("sno");
    }
    if (base.includes("ccid") || base.includes("iccid")) {
        variants.add("ccid");
        variants.add("iccid");
    }

    return Array.from(variants);
};

const parseInlineKeyValuePairs = (line: string) => {
    const result: Record<string, string> = {};
    const regex = /([A-Za-z0-9/_#\-\s.]+?)\s*:\s*([A-Za-z0-9._\-\/]+)(?=\s+[A-Za-z0-9/_#\-\s.]+?\s*:|$)/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(line)) !== null) {
        const key = String(match[1] || "").trim();
        const value = String(match[2] || "").trim();
        if (key && value) {
            result[key] = value;
        }
    }
    return result;
};

const parseJigOutput = (text: string) => {
    const lines = text.split('\n');
    const result: any = {};
    let currentSection = "PARAMETERS";

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const parametersIdx = trimmed.toUpperCase().indexOf("PARAMETERS:");
        const lineForPairs = parametersIdx >= 0
            ? trimmed.slice(parametersIdx + "PARAMETERS:".length).trim()
            : trimmed;

        if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
            currentSection = trimmed.replace(':', '');
            if (!result[currentSection]) result[currentSection] = {};
            return;
        }

        if (!result[currentSection]) result[currentSection] = {};

        const inlinePairs = parseInlineKeyValuePairs(lineForPairs);
        Object.entries(inlinePairs).forEach(([k, v]) => {
            result[currentSection][k] = v;
        });

        const segments = lineForPairs.split(/   +|  |, /);
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

    return result;
};

export default function JigIdentificationSection({
    jigStageFields,
    onIdentify,
    isSearching,
    error
}: JigIdentificationSectionProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [logs, setLogs] = useState<{ type: 'info' | 'error' | 'data'; message: string; timestamp: number }[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const portRef = useRef<any>(null);
    const readerRef = useRef<any>(null);
    const stopRequestedRef = useRef(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = (type: 'info' | 'error' | 'data', message: string) => {
        setLogs(prev => [...prev, { type, message, timestamp: Date.now() }].slice(-100)); // Keep last 100 logs
    };

    React.useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const isRecoverableSerialBreak = (err: any) => {
        const name = String(err?.name || "").toLowerCase();
        const message = String(err?.message || "").toLowerCase();
        return (
            name.includes("break") ||
            message.includes("break received") ||
            message.includes("framing") ||
            message.includes("parity") ||
            message.includes("overrun")
        );
    };

    const isFieldValueValid = (field: any, value: string) => {
        const trimmedVal = String(value || "").trim();
        const vtype = String(field?.validationType || "value").toLowerCase();

        if (!trimmedVal) return false;

        if (vtype === "length") {
            const len = trimmedVal.length;
            const from = Number(field?.lengthFrom);
            const to = Number(field?.lengthTo);
            if (!isNaN(from) && !isNaN(to)) {
                return len >= from && len <= to;
            }
            return true;
        }

        if (vtype === "value") {
            const expected = String(field?.value || "").trim();
            if (!expected) return true;
            return trimmedVal === expected;
        }

        if (vtype === "range") {
            const num = Number(trimmedVal);
            const from = Number(field?.rangeFrom);
            const to = Number(field?.rangeTo);
            if (isNaN(num) || isNaN(from) || isNaN(to)) return false;
            return num >= from && num <= to;
        }

        return true;
    };

    const findValueInParsedData = (parsedData: any, field: any) => {
        const fieldName = String(field?.jigName || "");
        const variants = new Set(getFieldKeyVariants(fieldName));
        variants.add(normalizeFieldKey(fieldName));

        const tryObject = (obj: any) => {
            if (!obj || typeof obj !== "object") return undefined;
            for (const [rawKey, rawValue] of Object.entries(obj)) {
                if (typeof rawValue !== "string") continue;
                const nk = normalizeFieldKey(rawKey);
                if (variants.has(nk)) {
                    return rawValue;
                }
            }
            return undefined;
        };

        let found = tryObject(parsedData);
        if (found !== undefined) return found;

        for (const section of Object.values(parsedData || {})) {
            found = tryObject(section);
            if (found !== undefined) return found;
        }

        return undefined;
    };

    const findRawCandidateForField = (rawText: string, field: any) => {
        const source = String(rawText || "");
        if (!source.trim()) return undefined;

        const fieldName = String(field?.jigName || "");
        const normalizedFieldName = normalizeFieldKey(fieldName);

        // Strong IMEI fallback when a device outputs only a bare 15-digit token.
        if (normalizedFieldName.includes("imei")) {
            const imeiMatch = source.match(/\b\d{15}\b/);
            if (imeiMatch?.[0]) return imeiMatch[0];
        }

        // Generic token scan fallback for single-field capture.
        const rawTokens = source.match(/[A-Za-z0-9._\-\/]{3,}/g) || [];
        const noiseTokens = new Set([
            "wait",
            "done",
            "parameters",
            "factrst",
            "moving",
            "capture",
            "started",
            "stream",
            "break",
            "received",
            "connection",
            "closed",
        ]);

        const tokens = rawTokens
            .map((token) => String(token || "").trim())
            .filter(Boolean)
            .filter((token) => !noiseTokens.has(token.toLowerCase()));

        for (const token of tokens) {
            if (isFieldValueValid(field, token)) {
                return token;
            }
        }

        return undefined;
    };

    const collectValidatedFields = (parsedData: any, fields: any[], rawText: string) => {
        const capturedFields: Record<string, string> = {};
        let allFound = true;

        for (const field of fields) {
            const fieldName = String(field?.jigName || "");
            let foundValue = findValueInParsedData(parsedData, field);

            if (foundValue === undefined && fields.length === 1) {
                foundValue = findRawCandidateForField(rawText, field);
            }

            if (foundValue !== undefined && String(foundValue).trim() !== "" && typeof foundValue === "string") {
                const trimmedVal = foundValue.trim();
                const isFieldValid = isFieldValueValid(field, trimmedVal);

                if (isFieldValid) {
                    capturedFields[fieldName] = trimmedVal;
                } else {
                    allFound = false;
                }
            } else {
                allFound = false;
            }
        }

        return { capturedFields, allFound };
    };

    const connectAndCapture = async () => {
        if (!("serial" in navigator)) {
            toast.error("Web Serial API not supported in this browser");
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        try {
            setIsConnecting(true);
            stopRequestedRef.current = false;

            const port = await (navigator as any).serial.requestPort();
            addLog('info', 'Requesting port access...');
            await port.open({ baudRate: 115200 });
            portRef.current = port;
            addLog('info', 'Port opened at 115200 baud.');

            const configuredFieldNames = (jigStageFields || [])
                .map((f: any) => String(f?.jigName || "").trim())
                .filter(Boolean);
            if (configuredFieldNames.length > 0) {
                addLog('info', `Waiting for configured field(s): ${configuredFieldNames.join(", ")}`);
            } else {
                addLog('error', 'No Jig Stage Fields configured for this stage.');
                toast.error("No Jig Stage Fields configured for this stage.");
                return;
            }
            const expectedFieldCount = configuredFieldNames.length;

            toast.info("Connected. Capturing parameters...");
            addLog('info', 'Initial capture started...');

            let accumulatedData = "";
            let identificationDone = false;
            let endedByBreak = false;
            const textDecoder = new TextDecoder();
            const reader = port.readable.getReader();
            readerRef.current = reader;

            // Timeout if no data received AT ALL within 10s
            timeoutId = setTimeout(() => {
                if (accumulatedData === "" && !stopRequestedRef.current) {
                    stopRequestedRef.current = true;
                    toast.warn("No data received from device. Check connection.");
                    disconnect();
                }
            }, 10000);

            while (true) {
                let readResult: { value: Uint8Array | undefined; done: boolean };
                try {
                    readResult = await reader.read();
                } catch (readErr: any) {
                    if (isRecoverableSerialBreak(readErr)) {
                        endedByBreak = true;
                        addLog("info", "Device stream ended (break received). Finalizing capture...");
                        break;
                    }
                    throw readErr;
                }

                const { value, done } = readResult;
                if (done || stopRequestedRef.current) {
                    addLog('info', 'Stream reading ended.');
                    break;
                }

                const chunk = textDecoder.decode(value);
                if (chunk.trim()) {
                    addLog('data', chunk.trim());
                }
                accumulatedData += chunk;

                const parsedData = parseJigOutput(accumulatedData);
                const { capturedFields, allFound } = collectValidatedFields(parsedData, jigStageFields, accumulatedData);

                if (expectedFieldCount > 0 && allFound && Object.keys(capturedFields).length === expectedFieldCount) {
                    if (timeoutId) clearTimeout(timeoutId);
                    addLog('info', `Identification successful: ${JSON.stringify(capturedFields)}`);
                    await onIdentify(capturedFields);
                    identificationDone = true;
                    break;
                }
            }

            // Final pass after stream end/break to avoid false failure when device closes immediately after sending.
            if (!identificationDone && accumulatedData.trim()) {
                const parsedData = parseJigOutput(accumulatedData);
                const { capturedFields, allFound } = collectValidatedFields(parsedData, jigStageFields, accumulatedData);
                if (expectedFieldCount > 0 && allFound && Object.keys(capturedFields).length === expectedFieldCount) {
                    addLog('info', `Identification successful: ${JSON.stringify(capturedFields)}`);
                    await onIdentify(capturedFields);
                    identificationDone = true;
                }
            }

            if (!identificationDone && endedByBreak) {
                toast.warn("Device stream ended before all required parameters were captured.");
            }

            if (timeoutId) clearTimeout(timeoutId);

        } catch (err: any) {
            console.error("Serial error:", err);
            addLog('error', err.message);
            if (err.name !== "NotFoundError" && !isRecoverableSerialBreak(err)) {
                toast.error("Connection failed: " + err.message);
            }
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            setIsConnecting(false);
            addLog('info', 'Connection closed.');
            disconnect();
        }
    };

    const disconnect = async () => {
        stopRequestedRef.current = true;
        if (readerRef.current) {
            try { await readerRef.current.cancel(); } catch { }
            readerRef.current = null;
        }
        if (portRef.current) {
            try { await portRef.current.close(); } catch { }
            portRef.current = null;
        }
    };

    return (
        <div className="p-6 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/40 flex flex-col items-center justify-center gap-4 transition-all hover:bg-blue-50/60">
            <div className={`p-4 rounded-full ${isSearching || isConnecting ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-blue-200 text-blue-700'}`}>
                {isSearching || isConnecting ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                    <Cable className="w-10 h-10" />
                )}
            </div>

            <div className="text-center max-w-sm">
                <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">Auto JIG Identification</h4>
                <p className="text-sm text-gray-600 mt-1">
                    {isConnecting ? "Reading device data..." : isSearching ? "Searching database..." : "Connect your device via USB Serial to automatically identify and begin testing."}
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button
                onClick={connectAndCapture}
                disabled={isConnecting || isSearching}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none mt-2"
            >
                {isConnecting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                    </>
                ) : isSearching ? (
                    <>
                        <Search className="w-5 h-5" />
                        Identifying...
                    </>
                ) : (
                    <>
                        <Cable className="w-5 h-5" />
                        Identify Device
                    </>
                )}
            </button>

            <div className="mt-2 flex flex-wrap justify-center gap-2">
                {jigStageFields.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-blue-100 text-[10px] font-bold text-blue-500 rounded uppercase">
                        {f.jigName}
                    </span>
                ))}
            </div>

            {/* Log Section */}
            <div className="w-full mt-4 border-t border-blue-100 pt-4">
                <div className="flex items-center justify-between mb-2 px-2">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        {showLogs ? 'HIDE DEVICE LOGS' : 'SHOW DEVICE LOGS'}
                        {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {logs.length > 0 && (
                        <button
                            onClick={() => setLogs([])}
                            className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            CLEAR
                        </button>
                    )}
                </div>

                {showLogs && (
                    <div className="bg-gray-900 rounded-xl p-4 font-mono text-[11px] overflow-hidden border border-gray-800 shadow-inner">
                        <style>{customScrollbarStyles}</style>
                        <div className="h-40 overflow-y-auto space-y-1 custom-scrollbar">
                            {logs.length === 0 && (
                                <div className="text-gray-600 italic">Waiting for connection logs...</div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-gray-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <span className={`
                                        ${log.type === 'error' ? 'text-red-400' :
                                            log.type === 'info' ? 'text-blue-400' :
                                                'text-green-400'}
                                    `}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #2d3748;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4a5568;
}
`;
