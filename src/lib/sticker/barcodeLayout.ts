import { PX_PER_MM } from "@/lib/sticker/units";

export type SupportedBarcodeFormat = "CODE128" | "ITF" | "CODE39";

export type BarcodeLayoutResult = {
  value: string;
  format: SupportedBarcodeFormat;
  marginPx: number;
  renderWidth: number;
  renderHeight: number;
  barWidth: number;
  barHeight: number;
  displayValue: boolean;
  fontSize: number;
  textMargin: number;
  fontOptions?: string;
  isValid: boolean;
  message?: string;
  recommendation?: string;
};

type BarcodeLayoutInput = {
  value: string;
  field: any;
  templateWidth?: number;
  templateHeight?: number;
};

const DEFAULT_FORMAT: SupportedBarcodeFormat = "CODE128";
const DEFAULT_MARGIN_PX = 8;
const DEFAULT_MIN_MODULE_WIDTH_PX = 0.95;
const DEFAULT_MIN_BAR_HEIGHT_PX = 24;
const MIN_FONT_SIZE_PX = 6;
const MAX_AUTO_MODULE_WIDTH_PX = 4;

const toPositiveNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toRounded = (value: number) => Number(value.toFixed(3));
const mmValueToPx = (mm: unknown) => Number(mm) * PX_PER_MM;

const normalizeFormat = (value: unknown): SupportedBarcodeFormat | null => {
  const format = String(value || "")
    .trim()
    .toUpperCase();
  if (format === "CODE128" || format === "ITF" || format === "CODE39") {
    return format;
  }
  return null;
};

const isNumericOnly = (value: string) => /^\d+$/.test(value);
const isCode39Value = (value: string) => /^[0-9A-Z\-.$/+% ]+$/.test(value);

export const inferBarcodeFormat = (value: string, field: any): SupportedBarcodeFormat => {
  const explicitFormat = normalizeFormat(
    field?.preferredFormat ?? field?.barcodeFormat ?? field?.format,
  );
  if (explicitFormat) return explicitFormat;

  const numericOnly = isNumericOnly(value);
  if (numericOnly && value.length >= 18 && value.length % 2 === 0 && field?.enableCompactNumeric !== false) {
    return "ITF";
  }

  if (field?.preferCode39 && isCode39Value(value)) {
    return "CODE39";
  }

  return DEFAULT_FORMAT;
};

const supportsFormat = (value: string, format: SupportedBarcodeFormat) => {
  if (!value) return false;
  switch (format) {
    case "ITF":
      return isNumericOnly(value) && value.length % 2 === 0;
    case "CODE39":
      return isCode39Value(value);
    case "CODE128":
    default:
      return true;
  }
};

const estimateCode128Modules = (value: string) => {
  let dataCodewords = 0;
  let switches = 0;
  let index = 0;
  let mode: "B" | "C" | null = null;

  while (index < value.length) {
    const rest = value.slice(index);
    const digitMatch = rest.match(/^\d+/);
    const digitRun = digitMatch?.[0]?.length ?? 0;

    if (digitRun >= 4) {
      if (mode !== "C") {
        if (mode !== null) switches += 1;
        mode = "C";
      }

      const pairCount = Math.floor(digitRun / 2);
      dataCodewords += pairCount;
      index += pairCount * 2;

      if (digitRun % 2 === 1) {
        switches += 1;
        mode = "B";
        dataCodewords += 1;
        index += 1;
      }
      continue;
    }

    if (mode !== "B") {
      if (mode !== null) switches += 1;
      mode = "B";
    }
    dataCodewords += 1;
    index += 1;
  }

  const totalCodewords = 1 + switches + dataCodewords + 1;
  return totalCodewords * 11 + 13;
};

const estimateModules = (value: string, format: SupportedBarcodeFormat) => {
  switch (format) {
    case "ITF":
      return Math.ceil(value.length / 2) * 14 + 20;
    case "CODE39":
      return (value.length + 2) * 13;
    case "CODE128":
    default:
      return estimateCode128Modules(value);
  }
};

const fieldLabel = (field: any) => String(field?.name || field?.slug || "Barcode");

export const getBarcodeLayout = ({
  value,
  field,
  templateWidth,
  templateHeight,
}: BarcodeLayoutInput): BarcodeLayoutResult => {
  const trimmedValue = String(value || "").trim();
  const format = inferBarcodeFormat(trimmedValue, field);
  const label = fieldLabel(field);
  const marginPx = toPositiveNumber(
    field?.quietZoneMm != null
      ? mmValueToPx(field.quietZoneMm)
      : field?.quietZone ?? field?.margin,
    DEFAULT_MARGIN_PX,
  );
  const configuredWidth = Math.max(1, toPositiveNumber(field?.width, 100));
  const configuredHeight = Math.max(1, toPositiveNumber(field?.height, 30));
  const maxWidth = Math.max(
    configuredWidth,
    templateWidth != null ? Math.max(1, Number(templateWidth) - Number(field?.x ?? 0)) : configuredWidth,
  );
  const maxHeight = Math.max(
    configuredHeight,
    templateHeight != null
      ? Math.max(1, Number(templateHeight) - Number(field?.y ?? 0))
      : configuredHeight,
  );

  const minModuleWidthPx = toPositiveNumber(
    field?.minModuleWidthMm != null
      ? mmValueToPx(field.minModuleWidthMm)
      : field?.minModuleWidth,
    DEFAULT_MIN_MODULE_WIDTH_PX,
  );
  const minBarHeightPx = toPositiveNumber(
    field?.minBarHeightMm != null ? mmValueToPx(field.minBarHeightMm) : field?.minBarHeight,
    DEFAULT_MIN_BAR_HEIGHT_PX,
  );

  const explicitBarWidth =
    field?.barWidthMm != null
      ? toPositiveNumber(mmValueToPx(field.barWidthMm))
      : toPositiveNumber(field?.barWidth);
  const explicitBarHeight =
    field?.barHeightMm != null
      ? toPositiveNumber(mmValueToPx(field.barHeightMm))
      : undefined;

  const desiredFontSize = Math.max(
    MIN_FONT_SIZE_PX,
    toPositiveNumber(field?.valueFontSize ?? field?.fontSize, 12),
  );
  const desiredTextMargin = toPositiveNumber(field?.textMargin, 2);
  const fontOptions = field?.valueFontBold ? "bold" : undefined;
  let displayValue = field?.displayValue !== false;
  const fontSize = desiredFontSize;
  let textMargin = desiredTextMargin;

  if (!trimmedValue) {
    return {
      value: trimmedValue,
      format,
      marginPx,
      renderWidth: configuredWidth,
      renderHeight: configuredHeight,
      barWidth: explicitBarWidth || minModuleWidthPx,
      barHeight: Math.max(1, configuredHeight - marginPx * 2),
      displayValue: false,
      fontSize,
      textMargin,
      fontOptions,
      isValid: false,
      message: `${label} has no barcode value to print.`,
      recommendation: "Check the mapped field value before printing the sticker.",
    };
  }

  if (!supportsFormat(trimmedValue, format)) {
    return {
      value: trimmedValue,
      format,
      marginPx,
      renderWidth: configuredWidth,
      renderHeight: configuredHeight,
      barWidth: explicitBarWidth || minModuleWidthPx,
      barHeight: Math.max(1, configuredHeight - marginPx * 2),
      displayValue,
      fontSize,
      textMargin,
      fontOptions,
      isValid: false,
      message: `${label} value is not supported by ${format}.`,
      recommendation:
        format === "ITF"
          ? "Use an even-length numeric value or switch the barcode format."
          : "Choose a barcode format that supports this value.",
    };
  }

  const moduleCount = estimateModules(trimmedValue, format);
  const safeBarWidth = explicitBarWidth || minModuleWidthPx;
  const minRequiredWidth = moduleCount * safeBarWidth + marginPx * 2;
  const renderWidth = explicitBarWidth
    ? configuredWidth
    : Math.min(maxWidth, Math.max(configuredWidth, minRequiredWidth));
  const usableWidth = Math.max(1, renderWidth - marginPx * 2);
  const barWidth = explicitBarWidth
    ? explicitBarWidth
    : Math.min(MAX_AUTO_MODULE_WIDTH_PX, Math.max(minModuleWidthPx, usableWidth / moduleCount));

  if (explicitBarWidth && explicitBarWidth < minModuleWidthPx) {
    return {
      value: trimmedValue,
      format,
      marginPx,
      renderWidth: configuredWidth,
      renderHeight: configuredHeight,
      barWidth: explicitBarWidth,
      barHeight: Math.max(1, configuredHeight - marginPx * 2),
      displayValue,
      fontSize,
      textMargin,
      fontOptions,
      isValid: false,
      message: `${label} bar width is below the scan-safe minimum.`,
      recommendation: "Increase the configured bar width or remove the fixed bar width override.",
    };
  }

  if (renderWidth + 0.01 < minRequiredWidth || barWidth + 0.01 < minModuleWidthPx) {
    return {
      value: trimmedValue,
      format,
      marginPx,
      renderWidth,
      renderHeight: configuredHeight,
      barWidth,
      barHeight: Math.max(1, configuredHeight - marginPx * 2),
      displayValue,
      fontSize,
      textMargin,
      fontOptions,
      isValid: false,
      message: `${label} needs more horizontal space to stay scannable.`,
      recommendation:
        "Increase the barcode field width, reduce quiet-zone overrides, or use a denser format override.",
    };
  }

  let requiredHeight = minBarHeightPx + marginPx * 2;
  if (displayValue) {
    requiredHeight += fontSize + textMargin;
  }

  if (requiredHeight > maxHeight && displayValue) {
    displayValue = false;
    textMargin = 0;
    requiredHeight = minBarHeightPx + marginPx * 2;
  }

  const renderHeight = Math.min(maxHeight, Math.max(configuredHeight, requiredHeight));
  const usableHeight = Math.max(1, renderHeight - marginPx * 2);
  const textSpace = displayValue ? fontSize + textMargin : 0;
  const autoBarHeight = Math.max(1, usableHeight - textSpace);
  let barHeight = explicitBarHeight != null ? Math.min(explicitBarHeight, autoBarHeight) : autoBarHeight;

  if (barHeight < minBarHeightPx && displayValue) {
    displayValue = false;
    textMargin = 0;
    barHeight = explicitBarHeight != null ? Math.min(explicitBarHeight, usableHeight) : usableHeight;
  }

  if (barHeight < minBarHeightPx) {
    return {
      value: trimmedValue,
      format,
      marginPx,
      renderWidth,
      renderHeight,
      barWidth,
      barHeight,
      displayValue,
      fontSize,
      textMargin,
      fontOptions,
      isValid: false,
      message: `${label} needs more height to print a scan-safe barcode.`,
      recommendation: "Increase the barcode field height or remove the fixed bar height override.",
    };
  }

  return {
    value: trimmedValue,
    format,
    marginPx: toRounded(marginPx),
    renderWidth: Math.ceil(renderWidth),
    renderHeight: Math.ceil(renderHeight),
    barWidth: toRounded(barWidth),
    barHeight: toRounded(barHeight),
    displayValue,
    fontSize: Math.max(MIN_FONT_SIZE_PX, Math.round(fontSize)),
    textMargin: Math.max(0, Math.round(textMargin)),
    fontOptions,
    isValid: true,
  };
};


