const normalizeValue = (value: any) => String(value || "").trim();

const normalizeKey = (value: any) =>
  normalizeValue(value).toLowerCase().replace(/\s+/g, " ");

const toSeatParts = (seatKey: string) => {
  const [lineIndex, seatIndex] = String(seatKey || "")
    .split("-")
    .map((part) => Number(part));

  return {
    lineIndex: Number.isFinite(lineIndex) ? lineIndex : -1,
    seatIndex: Number.isFinite(seatIndex) ? seatIndex : -1,
  };
};

const getTimestamp = (record: any) => {
  const raw =
    record?.createdAt ??
    record?.updatedAt ??
    record?.endTime ??
    record?.time ??
    record?.timestamp ??
    null;

  if (!raw) return 0;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const sortSeatKeys = (seatKeys: string[] = []) =>
  [...seatKeys].sort((left, right) => {
    const leftSeat = toSeatParts(left);
    const rightSeat = toSeatParts(right);

    if (leftSeat.lineIndex !== rightSeat.lineIndex) {
      return leftSeat.lineIndex - rightSeat.lineIndex;
    }

    return leftSeat.seatIndex - rightSeat.seatIndex;
  });

export const normalizeAssignedStagesPayload = (
  assignedStages: Record<string, any> = {},
  processStages: any[] = [],
) => {
  const stageOrderMap = new Map<string, number>();
  (Array.isArray(processStages) ? processStages : []).forEach((stage: any, index: number) => {
    const stageName = normalizeKey(stage?.stageName || stage?.name);
    if (stageName && !stageOrderMap.has(stageName)) {
      stageOrderMap.set(stageName, index);
    }
  });

  return sortSeatKeys(Object.keys(assignedStages || {})).reduce(
    (acc: Record<string, any[]>, seatKey: string) => {
      const seatItems = Array.isArray(assignedStages?.[seatKey])
        ? assignedStages[seatKey]
        : assignedStages?.[seatKey]
          ? [assignedStages[seatKey]]
          : [];

      if (seatItems.length === 0) {
        return acc;
      }

      const { lineIndex } = toSeatParts(seatKey);
      acc[seatKey] = seatItems.map((item: any, itemIndex: number) => {
        if (item?.reserved) {
          return {
            ...item,
            seatKey,
            lineIndex,
          };
        }

        const stageName = normalizeValue(item?.stageName || item?.name || item?.stage);
        const normalizedStageName = normalizeKey(stageName);
        const sequenceIndex = stageOrderMap.has(normalizedStageName)
          ? Number(stageOrderMap.get(normalizedStageName))
          : itemIndex;
        const parallelGroupKey =
          item?.parallelGroupKey ||
          `line-${lineIndex}-seq-${sequenceIndex}-stage-${normalizedStageName.replace(/[^a-z0-9]+/g, "-")}`;
        const stageInstanceId =
          item?.stageInstanceId ||
          `${parallelGroupKey}-seat-${seatKey.replace(/[^0-9-]+/g, "")}`;

        return {
          ...item,
          name: stageName || item?.name || item?.stage || "",
          stageName: stageName || item?.stageName || item?.name || "",
          seatKey,
          lineIndex,
          sequenceIndex,
          parallelGroupKey,
          stageInstanceId,
        };
      });

      return acc;
    },
    {},
  );
};

export const sanitizeCurrentPlanAssignedStages = ({
  assignedStages = {},
  processStages = [],
  currentProcess = null,
}: {
  assignedStages?: Record<string, any>;
  processStages?: any[];
  currentProcess?: any;
}) => {
  const stageMap = new Map<string, any>();
  (Array.isArray(processStages) ? processStages : []).forEach((stage: any) => {
    const key = normalizeKey(stage?.stageName || stage?.name);
    if (key && !stageMap.has(key)) {
      stageMap.set(key, stage);
    }
  });

  return Object.entries(assignedStages || {}).reduce(
    (acc: Record<string, any[]>, [seatKey, seatValue]) => {
      const seatItems = Array.isArray(seatValue)
        ? seatValue
        : seatValue
          ? [seatValue]
          : [];

      const normalizedSeatItems = seatItems
        .map((item: any) => {
          const itemStageName = normalizeValue(item?.stageName || item?.name || item?.stage);
          const matchingStage = stageMap.get(normalizeKey(itemStageName));
          const belongsToCurrentProcess =
            normalizeValue(item?.pId) === normalizeValue(currentProcess?.processID) ||
            normalizeValue(item?.processName) === normalizeValue(currentProcess?.name);

          if (!item?.reserved || !belongsToCurrentProcess || !matchingStage) {
            return item;
          }

          return {
            ...item,
            reserved: false,
            name: matchingStage?.stageName || itemStageName,
            stageName: matchingStage?.stageName || itemStageName,
            requiredSkill:
              item?.requiredSkill ||
              matchingStage?.requiredSkill ||
              matchingStage?.stageName ||
              itemStageName,
            managedBy: item?.managedBy || matchingStage?.managedBy,
            upha: item?.upha || matchingStage?.upha,
            hasJigStepType:
              item?.hasJigStepType ||
              matchingStage?.hasJigStepType ||
              (Array.isArray(matchingStage?.subSteps)
                ? matchingStage.subSteps.some((step: any) => step?.stepType === "jig")
                : false),
          };
        })
        .filter(Boolean);

      if (normalizedSeatItems.length > 0) {
        acc[seatKey] = normalizedSeatItems;
      }

      return acc;
    },
    {},
  );
};

export const stripReservedSeatEntries = (
  assignedStages: Record<string, any> = {},
) =>
  Object.fromEntries(
    Object.entries(assignedStages || {})
      .map(([seatKey, seatValue]) => {
        const seatItems = Array.isArray(seatValue)
          ? seatValue
          : seatValue
            ? [seatValue]
            : [];
        const filtered = seatItems.filter(
          (item: any) => !(item?.reserved === true || item?.name === "Reserved"),
        );
        return [seatKey, filtered];
      })
      .filter(([, seatItems]) => Array.isArray(seatItems) && seatItems.length > 0),
  );

export const getSeatStageEntry = (
  assignedStages: Record<string, any> = {},
  seatKey: string,
) => {
  const seatStages = Array.isArray(assignedStages?.[seatKey])
    ? assignedStages[seatKey]
    : assignedStages?.[seatKey]
      ? [assignedStages[seatKey]]
      : [];

  return seatStages.find((stage: any) => !stage?.reserved) || seatStages[0] || null;
};

export const getParallelSeatEntries = ({
  assignedStages = {},
  stageName = "",
  lineIndex = -1,
  parallelGroupKey = "",
}: {
  assignedStages?: Record<string, any>;
  stageName?: string;
  lineIndex?: number;
  parallelGroupKey?: string;
}) => {
  const targetStageName = normalizeKey(stageName);
  const targetGroupKey = normalizeValue(parallelGroupKey);

  const normalizedEntries = sortSeatKeys(Object.keys(assignedStages || {}))
    .map((seatKey) => ({ seatKey, stage: getSeatStageEntry(assignedStages, seatKey) }))
    .filter(({ stage }) => !!stage && !stage?.reserved);

  const sameLane = normalizedEntries.filter(({ stage }) => {
    if (targetGroupKey) {
      return normalizeValue(stage?.parallelGroupKey) === targetGroupKey;
    }

    return (
      stage?.lineIndex === lineIndex &&
      normalizeKey(stage?.stageName || stage?.name || stage?.stage) === targetStageName
    );
  });

  if (sameLane.length > 0) {
    return sameLane;
  }

  return normalizedEntries.filter(({ stage }) => {
    return normalizeKey(stage?.stageName || stage?.name || stage?.stage) === targetStageName;
  });
};

export const getNextLogicalStageName = (
  processStages: any[] = [],
  currentStageName: string,
  commonStages: any[] = [],
) => {
  const normalizedCurrent = normalizeKey(currentStageName);
  const stages = Array.isArray(processStages) ? processStages : [];
  const currentIndex = stages.findIndex(
    (stage: any) => normalizeKey(stage?.stageName || stage?.name) === normalizedCurrent,
  );

  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    return normalizeValue(stages[currentIndex + 1]?.stageName || stages[currentIndex + 1]?.name);
  }

  const commonStage = (Array.isArray(commonStages) ? commonStages : [])[0];
  return normalizeValue(commonStage?.stageName || commonStage?.name || commonStage?.stage);
};

export const getLatestRecordBySerial = (records: any[] = [], serialNo: string) => {
  const normalizedSerial = normalizeKey(serialNo);
  if (!normalizedSerial) return null;

  return [...(Array.isArray(records) ? records : [])]
    .filter((record: any) => {
      const recordSerial = normalizeKey(
        record?.serialNo ||
        record?.serial ||
        record?.device?.serialNo ||
        record?.deviceInfo?.serialNo,
      );
      return recordSerial === normalizedSerial;
    })
    .sort((left: any, right: any) => getTimestamp(right) - getTimestamp(left))[0] || null;
};

export const chooseNextStageSeatAssignment = ({
  assignedStages = {},
  currentSeatKey = "",
  currentStageName = "",
  processStages = [],
  commonStages = [],
  latestRecords = [],
}: {
  assignedStages?: Record<string, any>;
  currentSeatKey?: string;
  currentStageName?: string;
  processStages?: any[];
  commonStages?: any[];
  latestRecords?: any[];
}) => {
  const nextLogicalStage = getNextLogicalStageName(processStages, currentStageName, commonStages);
  if (!nextLogicalStage) {
    return {
      nextLogicalStage: "",
      assignedSeatKey: "",
      assignedStageInstanceId: "",
      assignedParallelGroupKey: "",
    };
  }

  const currentSeatStage = getSeatStageEntry(assignedStages, currentSeatKey);
  const currentLineIndex = currentSeatStage?.lineIndex ?? toSeatParts(currentSeatKey).lineIndex;
  const sameLaneCandidates = getParallelSeatEntries({
    assignedStages,
    stageName: nextLogicalStage,
    lineIndex: currentLineIndex,
  });
  const candidates = sameLaneCandidates.length > 0
    ? sameLaneCandidates
    : getParallelSeatEntries({
        assignedStages,
        stageName: nextLogicalStage,
      });

  if (candidates.length === 0) {
    return {
      nextLogicalStage,
      assignedSeatKey: "",
      assignedStageInstanceId: "",
      assignedParallelGroupKey: "",
    };
  }

  const counts = new Map<string, number>();
  candidates.forEach(({ seatKey }) => counts.set(seatKey, 0));

  (Array.isArray(latestRecords) ? latestRecords : []).forEach((record: any) => {
    const routedSeat = normalizeValue(record?.assignedSeatKey);
    const routedStage = normalizeKey(record?.nextLogicalStage || record?.currentStage || record?.stageName);
    if (!counts.has(routedSeat)) return;
    if (routedStage !== normalizeKey(nextLogicalStage)) return;
    counts.set(routedSeat, Number(counts.get(routedSeat) || 0) + 1);
  });

  const selectedCandidate = [...candidates].sort((left, right) => {
    const leftCount = Number(counts.get(left.seatKey) || 0);
    const rightCount = Number(counts.get(right.seatKey) || 0);
    if (leftCount !== rightCount) {
      return leftCount - rightCount;
    }

    return sortSeatKeys([left.seatKey, right.seatKey])[0] === left.seatKey ? -1 : 1;
  })[0];

  return {
    nextLogicalStage,
    assignedSeatKey: selectedCandidate?.seatKey || "",
    assignedStageInstanceId: selectedCandidate?.stage?.stageInstanceId || "",
    assignedParallelGroupKey: selectedCandidate?.stage?.parallelGroupKey || "",
  };
};

export const getSeatAssignmentForDevice = ({
  records = [],
  serialNo = "",
  currentStageName = "",
}: {
  records?: any[];
  serialNo?: string;
  currentStageName?: string;
}) => {
  const latestRecord = getLatestRecordBySerial(records, serialNo);
  if (!latestRecord) {
    return null;
  }

  const routedStage = normalizeKey(
    latestRecord?.nextLogicalStage ||
    latestRecord?.currentLogicalStage ||
    latestRecord?.currentStage ||
    latestRecord?.stageName,
  );

  if (currentStageName && routedStage && routedStage !== normalizeKey(currentStageName)) {
    return null;
  }

  return latestRecord;
};
