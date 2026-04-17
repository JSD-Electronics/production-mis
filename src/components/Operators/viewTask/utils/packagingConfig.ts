type PackagingDataLike = Record<string, any>;

const toFiniteNumber = (value: any): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickPositiveNumber = (...candidates: any[]): number | null => {
  for (const candidate of candidates) {
    const parsed = toFiniteNumber(candidate);
    if (parsed !== null && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

const pickHybridTolerance = (...candidates: any[]): number | null => {
  let sawZero = false;
  for (const candidate of candidates) {
    const parsed = toFiniteNumber(candidate);
    if (parsed === null || parsed < 0) continue;
    if (parsed > 0) return parsed;
    sawZero = true;
  }
  return sawZero ? 0 : null;
};

const pickFiniteNumber = (...candidates: any[]): number | null => {
  for (const candidate of candidates) {
    const parsed = toFiniteNumber(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const normalizePackagingData = (value: any): PackagingDataLike => {
  return value && typeof value === "object" ? value : {};
};

const findPackagingDataFromStageLike = (stageLike: any): PackagingDataLike | null => {
  if (!stageLike || typeof stageLike !== "object") return null;

  const subSteps = Array.isArray(stageLike?.subSteps) ? stageLike.subSteps : [];
  const activePackagingSubStep = subSteps.find(
    (subStep: any) => subStep?.isPackagingStatus && !subStep?.disabled && subStep?.packagingData,
  );
  if (activePackagingSubStep?.packagingData) {
    return normalizePackagingData(activePackagingSubStep.packagingData);
  }

  const packagingSubStep = subSteps.find(
    (subStep: any) => subStep?.isPackagingStatus && subStep?.packagingData,
  );
  if (packagingSubStep?.packagingData) {
    return normalizePackagingData(packagingSubStep.packagingData);
  }

  if (stageLike?.isPackagingStatus && stageLike?.packagingData) {
    return normalizePackagingData(stageLike.packagingData);
  }

  return null;
};

const findPackagingDataFromStages = (stages: any): PackagingDataLike | null => {
  const list = Array.isArray(stages) ? stages : [];
  for (const stage of list) {
    const packagingData = findPackagingDataFromStageLike(stage);
    if (packagingData) return packagingData;
  }
  return null;
};

const findPackagingDataFromAssignUserStage = (assignUserStage: any): PackagingDataLike | null => {
  if (Array.isArray(assignUserStage)) {
    for (const stage of assignUserStage) {
      const packagingData = findPackagingDataFromStageLike(stage);
      if (packagingData) return packagingData;
    }
    return null;
  }
  return findPackagingDataFromStageLike(assignUserStage);
};

const getProductStages = (product: any): any[] => {
  if (Array.isArray(product?.stages)) return product.stages;
  if (Array.isArray(product?.product?.stages)) return product.product.stages;
  return [];
};

export interface EffectivePackagingConfig {
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  cartonDepth: number;
  cartonWeight: number;
  cartonWeightTolerance: number;
  maxCapacity: number;
  raw: {
    carton: PackagingDataLike;
    processAssign: PackagingDataLike;
    assign: PackagingDataLike;
    process: PackagingDataLike;
    product: PackagingDataLike;
  };
}

interface ResolveEffectivePackagingConfigInput {
  cartonPackagingData?: PackagingDataLike | null;
  processAssignUserStage?: any;
  assignUserStage?: any;
  processData?: any;
  product?: any;
}

export const resolveEffectivePackagingConfig = ({
  cartonPackagingData,
  processAssignUserStage,
  assignUserStage,
  processData,
  product,
}: ResolveEffectivePackagingConfigInput = {}): EffectivePackagingConfig => {
  const rawCarton = normalizePackagingData(cartonPackagingData);
  const rawProcessAssign = normalizePackagingData(
    findPackagingDataFromStageLike(processAssignUserStage),
  );
  const rawAssign = normalizePackagingData(
    findPackagingDataFromAssignUserStage(assignUserStage),
  );
  const rawProcess = normalizePackagingData(findPackagingDataFromStages(processData?.stages));
  const rawProduct = normalizePackagingData(findPackagingDataFromStages(getProductStages(product)));
  const resolvedCartonLength =
    pickFiniteNumber(
      rawCarton?.cartonLength,
      rawCarton?.cartonDepth,
      rawProcessAssign?.cartonLength,
      rawProcessAssign?.cartonDepth,
      rawAssign?.cartonLength,
      rawAssign?.cartonDepth,
      rawProcess?.cartonLength,
      rawProcess?.cartonDepth,
      rawProduct?.cartonLength,
      rawProduct?.cartonDepth,
    ) ?? 0;

  return {
    cartonLength: resolvedCartonLength,
    cartonWidth:
      pickFiniteNumber(
        rawCarton?.cartonWidth,
        rawProcessAssign?.cartonWidth,
        rawAssign?.cartonWidth,
        rawProcess?.cartonWidth,
        rawProduct?.cartonWidth,
      ) ?? 0,
    cartonHeight:
      pickFiniteNumber(
        rawCarton?.cartonHeight,
        rawProcessAssign?.cartonHeight,
        rawAssign?.cartonHeight,
        rawProcess?.cartonHeight,
        rawProduct?.cartonHeight,
      ) ?? 0,
    cartonDepth: resolvedCartonLength,
    cartonWeight:
      pickPositiveNumber(
        rawCarton?.cartonWeight,
        rawProcessAssign?.cartonWeight,
        rawAssign?.cartonWeight,
        rawProcess?.cartonWeight,
        rawProduct?.cartonWeight,
      ) ?? 0,
    cartonWeightTolerance:
      pickHybridTolerance(
        rawCarton?.cartonWeightTolerance,
        rawProcessAssign?.cartonWeightTolerance,
        rawAssign?.cartonWeightTolerance,
        rawProcess?.cartonWeightTolerance,
        rawProduct?.cartonWeightTolerance,
      ) ?? 0,
    maxCapacity:
      pickPositiveNumber(
        rawCarton?.maxCapacity,
        rawProcessAssign?.maxCapacity,
        rawAssign?.maxCapacity,
        rawProcess?.maxCapacity,
        rawProduct?.maxCapacity,
      ) ?? 0,
    raw: {
      carton: rawCarton,
      processAssign: rawProcessAssign,
      assign: rawAssign,
      process: rawProcess,
      product: rawProduct,
    },
  };
};
