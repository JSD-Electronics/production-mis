import React, { useState, useRef, useEffect, useCallback } from "react";
import { Cable, Square, Terminal, Trash2, Download, Play, Activity } from "lucide-react";

// --- Types ---

interface JigSectionProps {
  subStep: any;
  onDataReceived?: (data: string) => void;
  onDecision?: (status: "Pass" | "NG") => void;
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

// --- Custom Hook for Serial Logic ---

const useSerialPort = ({ subStep, onDataReceived, onDecision }: JigSectionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const stopRequestedRef = useRef(false);
  const readingPromiseRef = useRef<Promise<void> | null>(null);
  const accumulatedDataRef = useRef<string>("");
  const writerRef = useRef<any>(null);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "data") => {
    setLogs((prev) => {
      const newLogs = [...prev, { timestamp: formatTimestamp(), message, type }];
      return newLogs.length > 100 ? newLogs.slice(-100) : newLogs;
    });
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const processData = useCallback(
    (text: string) => {
      accumulatedDataRef.current += text + "\n";
      const newData = accumulatedDataRef.current;

      if (!subStep?.jigFields) return;

      let matchCount = 0;
      let allPassed = true;
      const requiredFieldsCount = subStep.jigFields.length;

      subStep.jigFields.forEach((field: any) => {
        const receivedValueString = parseKeyValue(field.jigName, newData);

        if (receivedValueString !== null) {
          matchCount++;
          if (field.value && field.value.trim() !== "") {
            const receivedValue = parseFloat(receivedValueString);
            const expectedValue = parseFloat(field.value);

            if (!isNaN(expectedValue) && !isNaN(receivedValue)) {
              if (Math.abs(receivedValue - expectedValue) > 0.1) allPassed = false;
            } else {
              if (receivedValueString.toLowerCase() !== field.value.toLowerCase()) {
                allPassed = false;
              }
            }
          }
        }
      });

      if (matchCount > 0 && onDecision) {
        if (matchCount >= requiredFieldsCount) {
          const status = allPassed ? "Pass" : "NG";
          addLog(`Decision: ${status}`, allPassed ? "success" : "error");
          onDecision(status);
          
          // Reset for next test
          disconnectJig();
          accumulatedDataRef.current = ""; 
        }
      }
    },
    [subStep, onDecision, addLog]
  );

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
        } catch {}
        writerRef.current = null;
        return false;
      }
    },
    [isConnected, addLog]
  );

  const startReading = async (port: any) => {
    if (!port?.readable) return;
    const decoder = new TextDecoder();
    const reader = port.readable.getReader();
    readerRef.current = reader;
    let buffer = "";

    try {
      while (!stopRequestedRef.current) {
        const { value, done } = await reader.read();
        if (done || stopRequestedRef.current) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Find last newline to process complete lines
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
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } catch (error) {
      if (!stopRequestedRef.current) console.error("Read error:", error);
    } finally {
      try { reader.releaseLock(); } catch {}
      if (readerRef.current === reader) readerRef.current = null;
    }
  };

  const disconnectJig = useCallback(async () => {
    stopRequestedRef.current = true;
    if (readerRef.current?.cancel) {
        try { await readerRef.current.cancel(); } catch (e) { console.warn(e); }
    }
    try {
      if (writerRef.current) {
        writerRef.current.releaseLock();
      }
    } catch {}
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

  const connectToJig = async () => {
    try {
      /* Simulation Mode Disabled
      if (!(navigator as any).serial) {
        addLog("Web Serial API not supported. Starting simulation...", "info");
        simulateJigConnection();
        return;
      }
      */
      
      if (!(navigator as any).serial) {
          addLog("Web Serial API is not supported in this browser.", "error");
          alert("Web Serial API is not supported in this browser.");
          return;
      }

      if (portRef.current || isConnected) await disconnectJig();

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });

      portRef.current = port;
      stopRequestedRef.current = false;
      setIsConnected(true);
      addLog("Port Connected (115200 baud)", "success");
      
      readingPromiseRef.current = startReading(port);
    } catch (error: any) {
      console.error("Connection failed:", error);
      let msg = "Connection Failed: ";
      if (error.name === "NetworkError") msg += "Port busy or locked.";
      else if (error.name === "NotFoundError") msg += "No device selected.";
      else msg += error.message;
      addLog(msg, "error");
      alert(msg);
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
  const simulateJigConnection = useCallback(() => {}, []);

  const downloadLogs = useCallback(() => {
    if (logs.length === 0) return;
    const content = logs.map(l => `[${l.timestamp}] [${l.type || 'data'}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);

  return { isConnected, connectToJig, disconnectJig, simulateJigConnection, logs, clearLogs, downloadLogs, sendCommand };
};

// --- Sub-Components ---

const Header = ({ isConnected, onConnect, onDisconnect, onSimulate }: any) => (
  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all ${
        isConnected ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
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

const TerminalOutput = ({ logs, onClear, onDownload, onSend, connected }: { logs: LogEntry[]; onClear: () => void; onDownload: () => void; onSend: (cmd: string, eol: "CRLF" | "LF" | "CR" | "NONE") => void; connected: boolean }) => {
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
         <select
           value={eol}
           onChange={(e) => setEol(e.target.value as any)}
           className="rounded bg-[#1e1e1e] px-2 py-2 text-xs text-gray-200 ring-1 ring-gray-700 focus:ring-blue-500"
           title="Line ending"
         >
           <option value="CRLF">CRLF</option>
           <option value="LF">LF</option>
           <option value="CR">CR</option>
           <option value="NONE">NONE</option>
         </select>
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
        className="h-80 overflow-y-auto p-4 font-mono text-xs leading-relaxed 
          scrollbar-thin scrollbar-track-[#1e1e1e] scrollbar-thumb-[#424242] scrollbar-thumb-rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-[#5a5a5a] 
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-track]:bg-[#1e1e1e]
          [&::-webkit-scrollbar]:w-2"
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
              <span className={`break-all tracking-wide ${
                log.type === 'error' ? 'text-red-400 font-bold' :
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
      <TerminalOutput logs={logs} onClear={clearLogs} onDownload={downloadLogs} onSend={sendCommand} connected={isConnected} />
    </div>
  );
}
