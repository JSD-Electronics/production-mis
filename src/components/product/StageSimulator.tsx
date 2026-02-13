import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Play,
    Plus,
    Search,
    CheckCircle,
    XCircle,
    Terminal,
    RotateCw,
    Trash2,
    Box,
    MoreVertical,
    FlaskConical,
    Smartphone,
    X,
    Clock,
    Download
} from "lucide-react";
import JigSection from "../Operators/viewTask/components/JigSection";
import Loader from "@/components/common/Loader";
import * as XLSX from 'xlsx';

interface StageSimulatorProps {
    stages: any[];
    isOpen: boolean;
    onClose: () => void;
    initialStageIndex?: number;
    isPageMode?: boolean; // New prop for page mode
}

interface DummyDevice {
    id: string;
    serialNo: string;
    status: "Pending" | "Pass" | "NG";
    currentStageIndex: number;
    results: Record<string, any>; // Store results per stage/step
}

export default function StageSimulator({ stages, isOpen, onClose, initialStageIndex = 0, isPageMode = false }: StageSimulatorProps) {
    const [dummyDevices, setDummyDevices] = useState<DummyDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Results for the CURRENT running test session
    const [stepResults, setStepResults] = useState<Record<number, { status: "Pass" | "NG"; data?: any; executionTime?: number; reason?: string }>>({});
    const [logs, setLogs] = useState<string[]>([]);
    const [waitingStatus, setWaitingStatus] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [stepStartTime, setStepStartTime] = useState<number>(0);
    const [stageStartTime, setStageStartTime] = useState<number>(0);
    const [totalStageTime, setTotalStageTime] = useState<number>(0);
    const ngTimeoutRef = useRef<any>(null); // Use any to match browser/node timeout types safely

    const activeDevice = dummyDevices.find((d) => d.id === selectedDevice);
    const activeStage = stages[selectedStageIndex];

    // Clear timeout if test stops or step changes
    useEffect(() => {
        return () => {
            if (ngTimeoutRef.current) {
                clearInterval(ngTimeoutRef.current);
                ngTimeoutRef.current = null;
            }
        };
    }, []); // Only on unmount really, loop logic handles per-step

    // Step Timeout Logic - Runs when step changes or test starts
    useEffect(() => {
        if (!isTestRunning || !activeStage) return;

        const stepKv = activeStage.subSteps[currentStepIndex];
        const timeoutSeconds = Number(stepKv?.ngTimeout || 0);

        // Reset step start time for this step
        setStepStartTime(Date.now());

        // Clear any previous timer
        if (ngTimeoutRef.current) {
            clearInterval(ngTimeoutRef.current);
            ngTimeoutRef.current = null;
        }
        setWaitingStatus(null);
        setTimeLeft(0);

        if (timeoutSeconds > 0) {
            addLog(`Step Started with ${timeoutSeconds}s Timeout Window.`);
            setWaitingStatus("Active");
            setTimeLeft(timeoutSeconds);

            ngTimeoutRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Time's up
                        if (ngTimeoutRef.current) clearInterval(ngTimeoutRef.current);
                        ngTimeoutRef.current = null;
                        handleStepDecision("NG", "Timeout Exceeded");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

    }, [currentStepIndex, isTestRunning, activeStage]); // Re-run when step changes

    // Simulation State
    const [deviceSerialInput, setDeviceSerialInput] = useState("");

    // Initialize with the requested stage when opened
    useEffect(() => {
        if (isOpen || isPageMode) {
            setSelectedStageIndex(initialStageIndex);
        }
    }, [isOpen, initialStageIndex, isPageMode]);

    // Helper to add log
    const addLog = (msg: string) => {
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleAddDevice = () => {
        if (!deviceSerialInput.trim()) return;
        const newDevice: DummyDevice = {
            id: Date.now().toString(),
            serialNo: deviceSerialInput,
            status: "Pending",
            currentStageIndex: 0,
            results: {},
        };
        setDummyDevices((prev) => [...prev, newDevice]);
        setDeviceSerialInput("");
        if (!selectedDevice) setSelectedDevice(newDevice.id);
        addLog(`Added dummy device: ${newDevice.serialNo}`);
    };

    const handleRemoveDevice = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDummyDevices((prev) => prev.filter((d) => d.id !== id));
        if (selectedDevice === id) {
            setSelectedDevice(null);
            setIsTestRunning(false);
        }
    };

    const startTest = () => {
        if (!selectedDevice || !activeStage) return;
        setIsTestRunning(true);
        setCurrentStepIndex(0);
        setStepResults({});
        setLogs([]);
        setTotalStageTime(0);
        const now = Date.now();
        setStageStartTime(now);
        setStepStartTime(now);
        addLog(`Starting test for ${activeDevice?.serialNo} on stage: ${activeStage.stageName}`);
    };

    const stopTest = () => {
        if (ngTimeoutRef.current) {
            clearInterval(ngTimeoutRef.current);
            ngTimeoutRef.current = null;
        }
        setIsTestRunning(false);
        addLog("Test stopped.");
    };

    const handleStepDecision = useCallback((status: "Pass" | "NG", reason?: string, data?: any) => {
        const stepKv = activeStage.subSteps[currentStepIndex];
        const timeoutSeconds = Number(stepKv.ngTimeout || 0);

        // Calculate execution time for this step
        const executionTime = (Date.now() - stepStartTime) / 1000; // in seconds

        // Shared Failure Helper
        const confirmFailure = () => {
            if (ngTimeoutRef.current) {
                clearInterval(ngTimeoutRef.current);
                ngTimeoutRef.current = null;
            }
            setStepResults((prev) => ({
                ...prev,
                [currentStepIndex]: { status: "NG", data, executionTime, reason },
            }));
            addLog(`Step '${stepKv.stepName}': NG ${reason ? `(${reason})` : ""} - Time: ${executionTime.toFixed(2)}s`);
            addLog("Test Failed (NG). Stopping.");
            setWaitingStatus(null);
            // DON'T stop test running to keep jig interface visible
            // setIsTestRunning(false);
            if (activeDevice) {
                updateDeviceStatus(activeDevice.id, "NG");
            }
        };

        if (status === "Pass") {
            // If we were waiting for a failure, cancel it because we passed!
            if (ngTimeoutRef.current) {
                clearInterval(ngTimeoutRef.current);
                ngTimeoutRef.current = null;
                setWaitingStatus(null);
                addLog(`Recovered to PASS within ${timeoutSeconds}s timeout period.`);
            }

            setStepResults((prev) => ({
                ...prev,
                [currentStepIndex]: { status, data, executionTime, reason: undefined },
            }));

            setWaitingStatus(null);
            addLog(`Step '${stepKv.stepName}': ${status} - Time: ${executionTime.toFixed(2)}s`);

            if (currentStepIndex < activeStage.subSteps.length - 1) {
                setCurrentStepIndex((prev) => prev + 1);
            } else {
                // Calculate total stage time
                const totalTime = (Date.now() - stageStartTime) / 1000;
                setTotalStageTime(totalTime);
                addLog(`All steps passed! Stage Verified. Total Time: ${totalTime.toFixed(2)}s`);
                setIsTestRunning(false);
                if (activeDevice) {
                    updateDeviceStatus(activeDevice.id, "Pass");
                }
            }
        } else if (status === "NG") {

            // 1. If it's a Manual Rejection, always fail immediately
            if (reason === "Manual Rejection") {
                confirmFailure();
                return;
            }

            // 2. If it's the Timer firing ("Timeout Exceeded"), fail
            if (reason === "Timeout Exceeded") {
                confirmFailure();
                return;
            }

            // 3. If it's a Jig/Auto failure AND we have an active timer window, IGNORE it (Keep trying)
            if (timeoutSeconds > 0 && ngTimeoutRef.current) {
                console.log("Ignored NG signal during active step timeout window.");
                return;
            }

            // 4. Default: Fail immediately (No timeout config, or timeout window somehow passed without collecting)
            confirmFailure();
        }
    }, [activeStage, currentStepIndex, activeDevice, isTestRunning, stepStartTime, stageStartTime]);

    const updateDeviceStatus = (id: string, status: "Pass" | "NG") => {
        setDummyDevices(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    };

    const currentSubStep = activeStage?.subSteps?.[currentStepIndex];

    // Render the current step's action area
    const renderStepContent = () => {
        if (!currentSubStep) return <div className="p-4 text-gray-500">No steps defined.</div>;

        const isJig = currentSubStep.stepType === "jig";
        const isManual = currentSubStep.stepType === "manual";

        return (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Step {currentStepIndex + 1}: {currentSubStep.stepName}
                    <span className="ml-2 text-xs font-normal text-gray-500 uppercase tracking-wider border border-gray-200 rounded px-2 py-0.5">
                        {currentSubStep.stepType}
                    </span>
                    {isJig && (Number(currentSubStep.ngTimeout) > 0) && (
                        <span className="ml-2 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded px-2 py-0.5 inline-flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            timeout: {currentSubStep.ngTimeout}s
                        </span>
                    )}
                </h3>

                {waitingStatus && (
                    <div className="mb-6 rounded-lg border-l-4 border-orange-500 bg-orange-100 p-4 shadow-sm dark:bg-orange-900/20">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200 text-orange-600 dark:bg-orange-800 dark:text-orange-300">
                                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-orange-400 opacity-75"></span>
                                <Clock className="relative h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-orange-800 dark:text-orange-200">Timeout Active: {timeLeft}s Remaining</h4>
                                <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5 font-medium">Auto-fail if no pass received.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* JIG SECTION REUSE */}
                {isJig && (
                    <div className="mb-6">
                        <JigSection
                            subStep={currentSubStep}
                            searchQuery={activeDevice?.serialNo || "DUMMY-SN"}
                            onDecision={(status, reason, data) => handleStepDecision(status, reason, data)}
                            // Basic props mocking
                            isLastStep={currentStepIndex === activeStage.subSteps.length - 1}
                            // Auto-connect if we're not on the first step (i.e., returning to jig after manual step)
                            autoConnect={currentStepIndex > 0}
                        />
                    </div>
                )}

                {/* MANUAL SECTION */}
                {isManual && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Perform the manual checks defined for this step.
                            </p>

                            {/* Render Custom Fields/Validators if any */}
                            {/* This is a simplified view of manual fields */}
                            {currentSubStep.jigFields && currentSubStep.jigFields.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {currentSubStep.jigFields.map((field: any, idx: number) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-500">{field.jigName || "Field"}</label>
                                            <input
                                                type="text"
                                                placeholder={`Expect: ${field.validationType === 'range' ? `${field.rangeFrom}-${field.rangeTo}` : field.value || 'Any'}`}
                                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => handleStepDecision("Pass")}
                                    className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-green-700 hover:shadow-green-500/30 active:scale-95"
                                >
                                    <div className="flex flex-col items-center gap-1 relative z-10">
                                        <CheckCircle className="h-1 w-1 mb-1" />
                                        <span className="text-sm">PASS</span>
                                        <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Condition Met</span>
                                    </div>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0" />
                                </button>

                                <button
                                    onClick={() => handleStepDecision("NG", "Manual Rejection")}
                                    className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-br from-danger to-danger px-6 py-4 font-bold text-white shadow-lg transition-all hover:from-red-600 hover:to-danger hover:shadow-red-500/30 active:scale-95"
                                >
                                    <div className="flex flex-col items-center gap-1 relative z-10">
                                        <XCircle className="h-1 w-1 mb-1" />
                                        <span className="text-sm">FAIL (NG)</span>
                                        <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Condition Failed</span>
                                    </div>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRINTER SECTION (Mock) */}
                {currentSubStep.isPrinterEnable && (
                    <div className="mt-6 border-t pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Box className="h-5 w-5 text-purple-500" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Printer Configuration</span>
                        </div>
                        <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                            [Printer Preview Mockup]<br />
                            Configured Fields: {currentSubStep.printerFields?.length || 0}
                        </div>
                        <button className="mt-2 text-xs text-blue-600 hover:underline" onClick={() => addLog("Simulated Label Print")}>
                            Test Print
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen && !isPageMode) return null;

    // Content wrapper styles depending on mode
    const content = (
        <div className={`relative w-full ${isPageMode ? 'min-h-screen border-none shadow-none rounded-none' : 'max-w-7xl max-h-full rounded-xl border border-gray-200 shadow-2xl overflow-hidden'} flex flex-col bg-white dark:bg-[#18181b] dark:border-gray-800`}>
            {/* HEAD */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <FlaskConical className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Device Testing Simulator</h2>
                        <p className="text-xs text-gray-500">Verify your stage configuration with dummy devices</p>
                    </div>
                </div>
                {!isPageMode && ( // Hide close button in page mode as user would likely use browser back or explicit navigation
                    <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                        <X className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* CONTENT */}
            <div className={`grid grid-cols-12 divide-x divide-gray-200 dark:divide-gray-800 flex-1 ${isPageMode ? '' : 'min-h-0 overflow-hidden'}`}>
                {/* LEFT SIDEBAR: CONFIG & DEVICES */}
                <div className={`col-span-3 p-4 flex flex-col gap-6 bg-gray-50/50 dark:bg-gray-900/20 ${isPageMode ? 'sticky top-0 h-screen overflow-y-auto' : 'overflow-y-auto'}`}>
                    <div className="shrink-0">
                        <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">Select Stage to Test</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm outline-none dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed opacity-70"
                            value={selectedStageIndex}
                            onChange={(e) => {
                                setSelectedStageIndex(Number(e.target.value));
                                stopTest();
                            }}
                            disabled={true}
                        >
                            {stages.map((s, idx) => (
                                <option key={s.dragId || idx} value={idx}>
                                    {idx + 1}. {s.stageName || "Unnamed Stage"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dummy Device Manager */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">Dummy Devices</label>

                        <div className="flex gap-2 mb-3 shrink-0">
                            <input
                                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
                                placeholder="Enter Serial"
                                value={deviceSerialInput}
                                onChange={(e) => setDeviceSerialInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                            />
                            <button
                                onClick={handleAddDevice}
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {dummyDevices.length === 0 && (
                                <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg">
                                    No dummy devices.
                                </div>
                            )}
                            {dummyDevices.map((d) => (
                                <div
                                    key={d.id}
                                    onClick={() => !isTestRunning && setSelectedDevice(d.id)}
                                    className={`group relative flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all
                                          ${selectedDevice === d.id
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700'}
                                          ${isTestRunning && selectedDevice !== d.id ? 'opacity-50 pointer-events-none' : ''}
                                       `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-4 w-4 text-gray-400" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{d.serialNo}</p>
                                            <p className={`text-[10px] uppercase font-bold ${d.status === 'Pass' ? 'text-green-600' : d.status === 'NG' ? 'text-red-500' : 'text-gray-400'
                                                }`}>{d.status}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleRemoveDevice(d.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MAIN DISPLAY: TEST RUNNER */}
                <div className={`col-span-6 p-6 flex flex-col bg-white dark:bg-[#18181b] ${isPageMode ? '' : 'overflow-y-auto'}`}>
                    {!activeStage ? (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            Please add a stage configuration first.
                        </div>
                    ) : !selectedDevice ? (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400">
                            <Search className="mb-2 h-10 w-10 opacity-20" />
                            <p>Select a dummy device from the left to start testing.</p>
                        </div>
                    ) : !isTestRunning ? (
                        <div className="flex h-full flex-col items-center justify-center">
                            <div className="mb-6 rounded-full bg-indigo-50 p-6 dark:bg-indigo-900/20">
                                <Play className="h-10 w-10 text-indigo-600 ml-1" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Ready to Test</h3>
                            <p className="text-gray-500 mb-8 text-center max-w-sm">
                                You are about to test <strong>{activeStage.stageName}</strong> with device <strong>{activeDevice?.serialNo}</strong>.
                            </p>
                            <button
                                onClick={startTest}
                                className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                            >
                                Start Simulation
                            </button>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col">
                            {/* Progress Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeStage.stageName}</h2>
                                    <p className="text-xs text-gray-500">Step {currentStepIndex + 1} of {activeStage.subSteps.length}</p>
                                </div>
                                <button onClick={stopTest} className="text-xs text-red-500 hover:underline">
                                    Abort Test
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{ width: `${((currentStepIndex) / activeStage.subSteps.length) * 100}%` }}
                                />
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 overflow-y-auto">
                                {renderStepContent()}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR: LOGS */}
                <div className={`col-span-3 bg-[#1e1e1e] text-gray-300 font-mono text-xs flex flex-col border-l border-gray-700 ${isPageMode ? 'sticky top-0 h-screen overflow-y-auto' : ''}`}>
                    <div className="p-3 bg-[#252526] border-b border-gray-700 font-semibold flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            Input/Output Logs
                        </div>
                        {Object.keys(stepResults).length > 0 && (
                            <button
                                onClick={() => {
                                    // Download Excel file
                                    const excelData: any[] = activeStage.subSteps.map((step: any, idx: number) => {
                                        const result = stepResults[idx];
                                        const isJigStep = step.stepType === 'jig';
                                        const ngTimeout = Number(step.ngTimeout || 0);

                                        // Build Action column with NG timeout for jig steps
                                        let actionText: string = result?.status || 'Pending';
                                        if (isJigStep && ngTimeout > 0 && (result?.status === 'Pass' || result?.status === 'NG')) {
                                            actionText = result.status;
                                        }

                                        return {
                                            'Stage': activeStage.stageName,
                                            'Step Name': step.stepName,
                                            'Time Execution (s)': result?.executionTime?.toFixed(2) || 'N/A',
                                            'NG Timeout (s)': ngTimeout,
                                            'Action': actionText,
                                            'Reason': result?.status === 'NG' ? (result?.reason || 'Unknown') : '',
                                            'Buffer Time': ngTimeout - result?.executionTime?.toFixed(2),
                                        };
                                    });

                                    // Calculate total execution time
                                    const totalExecutionTime = activeStage.subSteps.reduce((sum: number, step: any, idx: number) => {
                                        const result = stepResults[idx];
                                        return sum + (result?.executionTime || 0);
                                    }, 0);
                                    const totalNGTimeout = activeStage.subSteps.reduce((sum: number, step: any, idx: number) => {
                                        return sum + (step.ngTimeout || 0);
                                    }, 0);
                                    // Add total row
                                    excelData.push({
                                        'Stage': '',
                                        'Step Name': 'TOTAL',
                                        'Time Execution (s)': totalExecutionTime.toFixed(2),
                                        'NG Timeout (s)': totalNGTimeout.toFixed(2),
                                        'Action': '',
                                        'Reason': '',
                                        'Buffer Time': totalNGTimeout.toFixed(2) - totalExecutionTime.toFixed(2)
                                    });

                                    const ws = XLSX.utils.json_to_sheet(excelData);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, 'Test Results');
                                    XLSX.writeFile(wb, `${activeStage.stageName}_${activeDevice?.serialNo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                title="Download Test Results"
                            >
                                <Download className="h-3 w-3" />
                                Download
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {logs.length === 0 && <span className="text-gray-600 italic">No logs...</span>}
                        {logs.map((log, i) => {
                            let colorClass = "text-gray-300";
                            if (log.includes("NG") || log.includes("Error") || log.includes("Failed")) colorClass = "text-red-400 font-bold";
                            else if (log.includes("Pass") || log.includes("Verified")) colorClass = "text-green-400 font-bold";
                            else if (log.includes("Waiting") || log.includes("Timeout")) colorClass = "text-orange-400";
                            else if (log.includes("Starting")) colorClass = "text-blue-400 font-semibold";
                            else if (log.includes("Time:")) colorClass = "text-cyan-400 font-semibold";

                            return (
                                <div key={i} className={`break-words border-l-2 pl-2 py-0.5 ${log.includes("NG") ? "border-red-500/50 bg-red-900/10" : log.includes("Pass") ? "border-green-500/50 bg-green-900/10" : log.includes("Time:") ? "border-cyan-500/50 bg-cyan-900/10" : "border-transparent"}`}>
                                    <span className={colorClass}>{log}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isPageMode) {
        return <div className="h-full bg-gray-100 dark:bg-black">{content}</div>;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-hidden">
            {content}
        </div>
    );
}
