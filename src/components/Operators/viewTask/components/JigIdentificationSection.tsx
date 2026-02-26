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

    const connectAndCapture = async () => {
        if (!("serial" in navigator)) {
            toast.error("Web Serial API not supported in this browser");
            return;
        }

        try {
            setIsConnecting(true);
            stopRequestedRef.current = false;

            const port = await (navigator as any).serial.requestPort();
            addLog('info', 'Requesting port access...');
            await port.open({ baudRate: 115200 });
            portRef.current = port;
            addLog('info', 'Port opened at 115200 baud.');

            // Sending Factory Reset command to trigger device output
            try {
                const encoder = new TextEncoder();
                const writer = port.writable.getWriter();
                addLog('info', 'Sending command: +#FACTRST;');
                await writer.write(encoder.encode("+#FACTRST;\r\n"));
                writer.releaseLock();
                addLog('info', 'Command sent. Waiting for parameter stream...');
                // Give the device a moment to process the command
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (writeErr: any) {
                addLog('error', `Failed to send command: ${writeErr.message}`);
            }

            toast.info("Connected. Capturing parameters...");
            addLog('info', 'Initial capture started...');

            let accumulatedData = "";
            const textDecoder = new TextDecoder();
            const reader = port.readable.getReader();
            readerRef.current = reader;

            // Timeout if no data received AT ALL within 10s
            const timeoutId = setTimeout(() => {
                if (accumulatedData === "" && !stopRequestedRef.current) {
                    stopRequestedRef.current = true;
                    toast.warn("No data received from device. Check connection.");
                    disconnect();
                }
            }, 10000);

            while (true) {
                const { value, done } = await reader.read();
                if (done || stopRequestedRef.current) {
                    addLog('info', 'Stream reading ended.');
                    break;
                }

                const chunk = textDecoder.decode(value);
                if (chunk.trim()) {
                    addLog('data', chunk.trim());
                }
                accumulatedData += chunk;

                // Check if we have all required fields
                const parsedData = parseJigOutput(accumulatedData);
                const capturedFields: Record<string, string> = {};
                let allFound = true;

                for (const field of jigStageFields) {
                    const fieldName = field.jigName;
                    let foundValue = undefined;

                    // Check top level or nested
                    if (parsedData[fieldName]) {
                        foundValue = parsedData[fieldName];
                    } else {
                        for (const section in parsedData) {
                            if (typeof parsedData[section] === 'object' && parsedData[section][fieldName]) {
                                foundValue = parsedData[section][fieldName];
                                break;
                            }
                        }
                    }

                    if (foundValue !== undefined && String(foundValue).trim() !== "") {
                        capturedFields[fieldName] = String(foundValue).trim();
                    } else {
                        allFound = false;
                    }
                }

                if (allFound && Object.keys(capturedFields).length > 0) {
                    clearTimeout(timeoutId);
                    addLog('info', `Identification successful: ${JSON.stringify(capturedFields)}`);
                    await onIdentify(capturedFields);
                    break;
                }

                // Removed the accumulatedData.length > 5000 break to allow continuous reading
            }

        } catch (err: any) {
            console.error("Serial error:", err);
            addLog('error', err.message);
            if (err.name !== "NotFoundError") {
                toast.error("Connection failed: " + err.message);
            }
        } finally {
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
