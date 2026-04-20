export interface StageEligibilityResult {
  currentStageName: string;
  previousStageName: string;
  isFirstStage: boolean;
  isEligible: boolean;
  isAlreadyPassed: boolean;
  message: string;
  previousStageRecord: any | null;
}

const normalize = (value: any) => String(value || "").trim().toLowerCase();

const getRecordTimestamp = (record: any) => {
  const raw =
    record?.createdAt ??
    record?.updatedAt ??
    record?.time ??
    record?.endTime ??
    null;
  if (!raw) return 0;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const isPassingStatus = (status: any) => {
  const normalized = normalize(status);
  return normalized === "pass" || normalized === "completed";
};

export const resolvePreviousStageEligibility = ({
  processStages,
  currentStageName,
  serialNo,
  deviceHistory,
  deviceCurrentStage,
}: {
  processStages?: any[];
  currentStageName?: string;
  serialNo?: string;
  deviceHistory?: any[];
  deviceCurrentStage?: string;
}): StageEligibilityResult => {
  const normalizedCurrentStage = String(currentStageName || "").trim();
  const normalizedSerial = normalize(serialNo);
  const normalizedDeviceCurrentStage = String(deviceCurrentStage || "").trim();
  const stages = Array.isArray(processStages) ? processStages : [];
  const currentStageIndex = stages.findIndex(
    (stage: any) =>
      normalize(stage?.stageName || stage?.name) === normalize(normalizedCurrentStage),
  );

  if (!normalizedCurrentStage || currentStageIndex < 0) {
    return {
      currentStageName: normalizedCurrentStage,
      previousStageName: "",
      isFirstStage: false,
      isEligible: true,
      isAlreadyPassed: false,
      message: "",
      previousStageRecord: null,
    };
  }

  // Check if ALREADY PASSED at current stage
  const currentStageHistory = (Array.isArray(deviceHistory) ? deviceHistory : [])
    .filter((record: any) => {
      const recordStage = normalize(record?.stageName || record?.stage || record?.name);
      return recordStage === normalize(normalizedCurrentStage);
    });
  
  const hasPreviousPass = currentStageHistory.some(record => isPassingStatus(record?.status));
  
  // A device is considered "Already Passed" ONLY if it has a Pass record AND it is NOT currently
  // assigned to this stage (which would indicate it's been sent back for rework).
  const isReworkActive = 
    normalize(deviceCurrentStage) === normalize(normalizedCurrentStage) ||
    normalize(deviceCurrentStage) === normalize(normalizedCurrentStage).replace(/\s+/g, "");

  const isAlreadyPassed = hasPreviousPass && !isReworkActive;

  if (currentStageIndex === 0) {
    return {
      currentStageName: normalizedCurrentStage,
      previousStageName: "",
      isFirstStage: true,
      isEligible: true,
      isAlreadyPassed,
      message: isAlreadyPassed ? `This device has already passed ${normalizedCurrentStage}.` : "",
      previousStageRecord: null,
    };
  }

  // If the device is already sitting in the current stage WIP queue,
  // allow the operator to continue even when older history is incomplete.
  if (
    normalizedDeviceCurrentStage &&
    normalize(normalizedDeviceCurrentStage) === normalize(normalizedCurrentStage)
  ) {
    return {
      currentStageName: normalizedCurrentStage,
      previousStageName: "",
      isFirstStage: false,
      isEligible: true,
      isAlreadyPassed,
      message: isAlreadyPassed ? `This device has already passed ${normalizedCurrentStage}.` : "",
      previousStageRecord: null,
    };
  }

  const previousStageName = String(
    stages[currentStageIndex - 1]?.stageName || stages[currentStageIndex - 1]?.name || "",
  ).trim();

  const relevantHistory = (Array.isArray(deviceHistory) ? deviceHistory : [])
    .filter((record: any) => {
      const recordStage = normalize(record?.stageName || record?.stage || record?.name);
      const recordSerial = normalize(
        record?.serialNo || record?.serial || record?.device?.serialNo || record?.deviceInfo?.serialNo,
      );

      if (recordStage !== normalize(previousStageName)) return false;
      if (!normalizedSerial) return true;
      return !recordSerial || recordSerial === normalizedSerial;
    })
    .sort((a: any, b: any) => getRecordTimestamp(b) - getRecordTimestamp(a));

  const previousStageRecord = relevantHistory[0] || null;
  if (!previousStageRecord) {
    return {
      currentStageName: normalizedCurrentStage,
      previousStageName,
      isFirstStage: false,
      isEligible: false,
      isAlreadyPassed,
      message: `This device must first pass ${previousStageName} before testing can start at ${normalizedCurrentStage}.`,
      previousStageRecord: null,
    };
  }

  if (!isPassingStatus(previousStageRecord?.status)) {
    const latestStatus = String(previousStageRecord?.status || "Unknown").trim();
    return {
      currentStageName: normalizedCurrentStage,
      previousStageName,
      isFirstStage: false,
      isEligible: false,
      isAlreadyPassed,
      message: `This device cannot start ${normalizedCurrentStage} because ${previousStageName} is not passed. Latest status: ${latestStatus}.`,
      previousStageRecord,
    };
  }

  return {
    currentStageName: normalizedCurrentStage,
    previousStageName,
    isFirstStage: false,
    isEligible: true,
    isAlreadyPassed,
    message: isAlreadyPassed ? `This device has already passed ${normalizedCurrentStage}.` : "",
    previousStageRecord,
  };
};
