"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    getPlaningAndSchedulingById,
    viewShift,
    viewRoom,
    viewProcess,
    getProductById,
    getDeviceTestRecordsByProcessId,
    getLatestDeviceTestsByPlanId,
    getDeviceByProductId,
    checkPlanningAndScheduling
} from "@/lib/api";
import {
    transformIntervals,
    calculateWorkingHours,
} from "../utils/dataTransformers";
import { formatDate } from "@/lib/common";

const checkSeatAvailability = async (
    currentPlanId: string,
    selectedRoom: any,
    selectedShift: any,
    startDate: any,
    expectedEndDate: any,
) => {
    try {
        const shiftDataChange = JSON.stringify({}); // Mock if we don't need real shift data changes for check
        const result = await checkPlanningAndScheduling(
            selectedRoom._id,
            selectedShift._id,
            startDate,
            expectedEndDate,
            shiftDataChange,
        );
        let assignedStagesObject = result.plans?.reduce((acc: any, plan: any) => {
            try {
                if (plan._id !== currentPlanId) {
                    const parsedStages = JSON.parse(plan.assignedStages || "{}");
                    Object.keys(parsedStages).forEach((seatKey) => {
                        if (!acc[seatKey]) {
                            acc[seatKey] = [];
                        }
                        acc[seatKey] = [
                            ...(acc[seatKey] || []),
                            ...parsedStages[seatKey].map((stage: any) => ({
                                ...stage,
                                processName: plan.processName,
                            })),
                        ];
                    });
                }
            } catch (error) {
                console.error("Error parsing assignedStages:", error);
            }
            return acc;
        }, {}) || {};

        return assignedStagesObject;
    } catch (error) {
        return {};
    }
};

const allocateStagesToSeats = (
    selectedProcess: any,
    selectedRoom: any,
    repeatCount = 1,
    reservedSeats: any = {},
    assignedStages: any = {},
    assignedIssuedKits = 0,
    deviceTests: any[] = [],
) => {
    const testResultsBySeatAndStage: any = {};
    deviceTests.forEach((record) => {
        const key = `${record.seatNumber}:${record.stageName?.trim()}`;
        if (!testResultsBySeatAndStage[key]) {
            testResultsBySeatAndStage[key] = { passed: 0, ng: 0 };
        }
        if (record.status === "Pass") testResultsBySeatAndStage[key].passed++;
        else if (record.status === "NG" || record.status === "Fail")
            testResultsBySeatAndStage[key].ng++;
    });

    const assignedSeatsKeys = Object.keys(assignedStages || {});
    const stages = selectedProcess?.stages || [];
    const newAssignedStages: any = {};
    let seatIndex = 0;

    selectedRoom?.lines?.forEach((row: any, rowIndex: number) => {
        row.seats?.forEach((_: any, seatPosition: number) => {
            const seatKey = `${rowIndex}-${seatPosition}`;
            if (reservedSeats[seatKey]) {
                newAssignedStages[seatKey] = [
                    {
                        name: "Reserved",
                        processName: selectedProcess.name,
                        pId: selectedProcess.processID,
                        reserved: true,
                    },
                ];
                return;
            }

            // Drive rendering by the actual saved assignments; don't truncate when
            // a single stage is intentionally mapped to multiple seats.
            if (assignedSeatsKeys.includes(seatKey)) {
                const currentStageIndex = seatIndex % stages.length;
                const currentStage = stages[currentStageIndex];
                const trimmedStageName = currentStage.stageName?.trim();
                const hasJigStepType = currentStage.subSteps?.some(
                    (step: any) => step.stepType === "jig",
                );

                let totalUPHA = 0;
                if (currentStageIndex === 0) {
                    totalUPHA = assignedIssuedKits / repeatCount;
                } else {
                    const prevSeatIndex = seatIndex - 1;
                    const seatsPerRow = row.seats.length;
                    const prevRow = Math.floor(prevSeatIndex / seatsPerRow);
                    const prevCol = prevSeatIndex % seatsPerRow;
                    const prevSeatKey = `${prevRow}-${prevCol}`;
                    const prevStageName = stages[currentStageIndex - 1]?.stageName?.trim();
                    const prevTestKey = `${prevSeatKey}:${prevStageName}`;
                    totalUPHA = testResultsBySeatAndStage[prevTestKey]?.passed || 0;
                }

                const testKey = `${seatKey}:${trimmedStageName}`;
                const passedDevice = testResultsBySeatAndStage[testKey]?.passed || 0;
                const ngDevice = testResultsBySeatAndStage[testKey]?.ng || 0;
                const remainingDevices = Math.max(
                    totalUPHA - (passedDevice + ngDevice),
                    0,
                );

                const stageTitle =
                    currentStage?.stageName ||
                    currentStage?.name ||
                    currentStage?.stage ||
                    currentStage?.requiredSkill ||
                    "";

                newAssignedStages[seatKey] = [
                    {
                        name: stageTitle,
                        requiredSkill: currentStage?.requiredSkill || stageTitle,
                        upha: currentStage?.upha,
                        totalUPHA: remainingDevices,
                        passedDevice,
                        ngDevice,
                        hasJigStepType,
                    },
                ];
                seatIndex++;
            }
        });
    });
    return newAssignedStages;
};

export const usePlaningData = (id: string | string[]) => {
    const [loading, setLoading] = useState(true);
    const [planData, setPlanData] = useState<any>(null);
    const [selectedProcess, setSelectedProcess] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [selectedShift, setSelectedShift] = useState<any>(null);
    const [overallUPHA, setOverallUPHA] = useState<any[]>([]);
    const [totalConsumedKits, setTotalConsumedKits] = useState(0);
    const [allDeviceTests, setAllDeviceTests] = useState<any[]>([]);
    const [latestDeviceTests, setLatestDeviceTests] = useState<any[]>([]);
    const [assignedStages, setAssignedStages] = useState<any>({});

    const kpiStats = useMemo(() => {
        if (!planData || !selectedProcess) return {
            totalPlanned: 0,
            running: 0,
            completed: 0,
            delayed: 0,
            utilization: 0
        };

        const completed = selectedProcess.consumedKits || 0;
        const totalPlanned = selectedProcess.quantity || 0;
        const running = totalPlanned > completed ? planData.repeatCount || 1 : 0;

        let passTotal = 0;
        let ngTotal = 0;
        latestDeviceTests.forEach(test => {
            if (test.status === "Pass") passTotal++;
            else if (test.status === "NG") ngTotal++;
        });

        return {
            totalPlanned,
            running,
            completed,
            delayed: ngTotal,
            utilization: Math.round((completed / (totalPlanned || 1)) * 100)
        };
    }, [planData, selectedProcess, latestDeviceTests]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const planIdString = Array.isArray(id) ? id[0] : id;
            const result = await getPlaningAndSchedulingById(planIdString);
            setPlanData(result);

            const [shiftRes, roomRes, processRes] = await Promise.all([
                viewShift(),
                viewRoom(),
                viewProcess(),
            ]);

            const shifts = shiftRes?.Shifts || [];
            const roomPaths = roomRes?.rooms || [];
            const processes = processRes?.Processes || [];

            const singleProcess = processes.find((p: any) => p._id === result.selectedProcess);
            setSelectedProcess(singleProcess);
            setTotalConsumedKits(singleProcess?.consumedKits || 0);

            const room = roomPaths.find((r: any) => r._id === result.selectedRoom);
            setSelectedRoom(room);

            const shift = shifts.find((s: any) => s._id === result.selectedShift);
            setSelectedShift(shift);

            // Fetch Device Tests
            const deviceTestEntry = await getDeviceTestRecordsByProcessId(result.selectedProcess);
            const deviceTests = deviceTestEntry?.deviceTestRecords || [];
            setAllDeviceTests(deviceTests);

            let latestTests: any[] = [];
            try {
                const latestEntry = await getLatestDeviceTestsByPlanId(planIdString, result.selectedProcess);
                latestTests = latestEntry?.deviceTestRecords || [];
            } catch (e) {
                latestTests = deviceTests.filter(
                    (record: any) => String(record?.planId) === String(planIdString),
                );
            }
            setLatestDeviceTests(latestTests);

            // Assigned Stages & Flooring logic
            if (room && shift) {
                const reservedSeats = await checkSeatAvailability(
                    planIdString,
                    room,
                    shift,
                    formatDate(result?.startDate),
                    formatDate(result?.estimatedEndDate)
                );

                let parsedInitialStages = {};
                try {
                    parsedInitialStages = JSON.parse(result?.assignedStages || "{}");
                } catch (e) { }

                const calculatedAssignedStages = allocateStagesToSeats(
                    singleProcess,
                    room,
                    result?.repeatCount || 1,
                    reservedSeats,
                    parsedInitialStages,
                    result?.assignedIssuedKits || 0,
                    latestTests
                );
                setAssignedStages(calculatedAssignedStages);
            }

            // Calculate UPHA Table
            if (singleProcess?.selectedProduct && shift) {
                const productData = await getProductById(singleProcess.selectedProduct);
                const stageHeaders = productData?.product?.stages?.map((stage: any) => stage.stageName?.trim()) || [];
                const stageUPHMap = productData?.product?.stages?.reduce((acc: any, stage: any) => {
                    acc[stage.stageName] = stage.upha || 0;
                    return acc;
                }, {}) || {};

                const intervals = transformIntervals(shift);
                const now = new Date();

                const tableData = intervals.map((interval: any) => {
                    const [sH, sM] = interval.startTime.split(":").map(Number);
                    const [eH, eM] = interval.endTime.split(":").map(Number);
                    const start = new Date(now);
                    start.setHours(sH, sM, 0, 0);
                    const end = new Date(now);
                    end.setHours(eH, eM, 0, 0);

                    let status = "future";
                    if (now >= start && now < end) status = "current";
                    else if (now >= end) status = "past";

                    return {
                        hour: `${interval.startTime} - ${interval.endTime}`,
                        isBreak: interval.breakTime,
                        status,
                        values: stageHeaders.map((stage: string) => ({
                            stage,
                            Pass: 0, // Real logic would aggregate deviceTests
                            NG: 0,
                            targetUPH: interval.breakTime ? 0 : (stageUPHMap[stage] || 0),
                        })),
                    };
                });

                // Aggregation logic
                deviceTests.forEach((record: any) => {
                    const recordTime = new Date(record.createdAt);
                    const recH = recordTime.getHours();
                    const recM = recordTime.getMinutes();
                    const recTotalMin = recH * 60 + recM;

                    const hourIndex = tableData.findIndex((row: any) => {
                        const [sH, sM] = row.hour.split(" - ")[0].split(":").map(Number);
                        const [eH, eM] = row.hour.split(" - ")[1].split(":").map(Number);
                        const startMinTotal = sH * 60 + sM;
                        const endMinTotal = eH * 60 + eM;
                        return recTotalMin >= startMinTotal && recTotalMin < endMinTotal;
                    });

                    if (hourIndex !== -1) {
                        const cleanedStageName = record.stageName?.trim();
                        const stageIndex = stageHeaders.indexOf(cleanedStageName);
                        if (stageIndex !== -1) {
                            const status = record.status;
                            if (status === "Pass" || status === "NG") {
                                tableData[hourIndex].values[stageIndex][status] += 1;
                            }
                        }
                    }
                });

                setOverallUPHA(tableData);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching planing data:", error);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        loading,
        planData,
        selectedProcess,
        selectedRoom,
        selectedShift,
        overallUPHA,
        totalConsumedKits,
        kpiStats,
        assignedStages,
        refresh: fetchData,
    };
};
