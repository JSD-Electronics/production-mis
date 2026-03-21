import React from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { mmToPx } from "@/lib/sticker/units";
import { resolveStickerValue } from "@/lib/sticker/resolveStickerValue";

type StickerRendererProps = {
  template: any;
  deviceData?: any[] | any;
};

const getDimensionsPx = (template: any) => {
  const w =
    template?.dimensions?.width ??
    template?.cartonWidth ??
    template?.width ??
    300;
  const h =
    template?.dimensions?.height ??
    template?.cartonHeight ??
    template?.height ??
    150;
  return {
    width: typeof w === "string" ? parseInt(w, 10) : Number(w),
    height: typeof h === "string" ? parseInt(h, 10) : Number(h),
  };
};

const normalizeField = (field: any) => {
  // Support older data that stored typography on `styles`.
  const styles = field?.styles && typeof field.styles === "object" ? field.styles : {};
  const fontSize =
    field?.fontSize ??
    (typeof styles?.fontSize === "number"
      ? styles.fontSize
      : typeof styles?.fontSize === "string"
        ? parseInt(styles.fontSize, 10)
        : undefined);

  const textAlign = styles?.textAlign ?? field?.textAlign;
  return {
    ...field,
    styles,
    fontSize,
    textAlign,
  };
};

export default function StickerRenderer({ template, deviceData }: StickerRendererProps) {
  const { width, height } = getDimensionsPx(template);
  const fields = Array.isArray(template?.fields) ? template.fields : [];
  const device = Array.isArray(deviceData) ? (deviceData[0] ?? null) : deviceData ?? null;

  const getSampleValueForSlug = (slugLike: any) => {
    const s = String(slugLike || "").toLowerCase();
    if (!s) return "N/A";
    if (s.includes("imei")) return "868329082416730";
    if (s.includes("ccid")) return "89911024059647563056F";
    if (s.includes("serial") || s === "sn" || s.includes("s/n")) return "SN-2024-0001";
    return "N/A";
  };

  return (
    <div
      className="actual-sticker-container bg-white"
      data-sticker-width={width}
      data-sticker-height={height}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        backgroundColor: "#ffffff",
        margin: "0",
        padding: "0",
        boxSizing: "border-box",
        overflow: "hidden",
        // Match the app + designer default (Inter) and keep a sane fallback stack for print windows.
        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
        color: "black",
      }}
    >
      {fields.map((raw: any) => {
        const field = normalizeField(raw);
        const fieldValue = resolveStickerValue(field, device);
        const align = field?.styles?.textAlign || "center";
        const fontSize = Number(field?.fontSize ?? 14) || 14;

        const key = field?._id || field?.id || `${field?.name || "field"}-${field?.x}-${field?.y}`;

        return (
          <div
            key={key}
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              top: `${field?.y ?? 0}px`,
              left: `${field?.x ?? 0}px`,
              width: `${field?.width || 100}px`,
              height: `${field?.height || 30}px`,
              justifyContent:
                align === "left"
                  ? "flex-start"
                  : align === "right"
                    ? "flex-end"
                    : "center",
              padding: "0 2px",
              boxSizing: "border-box",
              zIndex: 10,
            }}
          >
            {field?.type === "barcode" ? (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  padding: "0",
                  boxSizing: "border-box",
                  // Don't clip the barcode quiet-zone; scanners need margin on both sides.
                  overflow: "hidden",
                }}
              >
                {(() => {
                  const raw = String(fieldValue ?? "").trim();
                  const sample = getSampleValueForSlug(field?.slug || field?.name);
                  // If device data isn't present (product designer / simulator), show meaningful sample values.
                  const barcodeValue = raw
                    ? raw
                    : sample;
                  const estimatedModules = barcodeValue.length * 11 + 35;
                  const targetWidth = field?.width;

                  const explicitBarWidth =
                    field?.barWidthMm != null
                      ? mmToPx(Number(field.barWidthMm))
                      : field?.barWidth;

                  const marginPx = Number(field?.margin ?? 4) || 0;
                  const usableWidth = targetWidth
                    ? Math.max(1, Number(targetWidth) - marginPx * 2)
                    : undefined;

                  // IMPORTANT: If an explicit X dimension is configured (barWidthMm/barWidth),
                  // always respect it so all barcodes render with the same bar thickness.
                  // Auto-fit is only used when no explicit bar width is provided.
                  const computedBarWidth =
                    explicitBarWidth != null
                      ? Math.max(0.5, Number(explicitBarWidth))
                      : usableWidth
                        ? Math.max(0.5, usableWidth / estimatedModules)
                        : 1;

                  const showValue = field?.displayValue !== false;
                  const desiredFontSize = Number(field?.fontSize ?? 12);
                  const desiredTextMargin = Number(field?.textMargin ?? 2);
                  const valueFontOptions = field?.valueFontBold ? "bold" : undefined;

                  // Height behavior:
                  // 1) If Show Value is enabled and there is space, keep the value font size exactly as configured,
                  //    and reduce the bar height to make room (so font respects properties on resize).
                  // 2) Only if there is NOT enough space, auto-shrink the value font or hide it.

                  const explicitBarHeight =
                    field?.barHeightMm != null ? mmToPx(Number(field.barHeightMm)) : undefined;

                  const usableHeight =
                    field?.height != null ? Math.max(1, Number(field.height) - marginPx * 2) : 1;

                  const minFontSize = 6;
                  const minTextMargin = 0;

                  let renderShowValue = Boolean(showValue);
                  let valueFontSize = desiredFontSize;
                  let valueTextMargin = desiredTextMargin;

                  const desiredValueSpace = renderShowValue
                    ? Math.max(0, valueFontSize + valueTextMargin)
                    : 0;

                  const maxBarHeightWithValue = Math.max(1, usableHeight - desiredValueSpace);

                  // Try to honor configured font size by shrinking bar height first.
                  let computedBarHeight = Math.max(
                    1,
                    Math.min(Number(explicitBarHeight ?? maxBarHeightWithValue), maxBarHeightWithValue),
                  );

                  // If even after shrinking bars we still can't fit the value, auto-adjust the typography.
                  if (renderShowValue && usableHeight - computedBarHeight < minFontSize) {
                    const availableForValue = Math.max(0, usableHeight - computedBarHeight);
                    if (availableForValue < minFontSize) {
                      renderShowValue = false;
                    } else {
                      valueTextMargin = Math.min(
                        valueTextMargin,
                        Math.max(minTextMargin, availableForValue - minFontSize),
                      );
                      valueFontSize = Math.min(
                        valueFontSize,
                        Math.max(minFontSize, availableForValue - valueTextMargin),
                      );
                      if (valueFontSize < minFontSize) renderShowValue = false;
                    }

                    // Recompute bar height if value got disabled.
                    if (!renderShowValue) {
                      computedBarHeight = Math.max(
                        1,
                        Math.min(Number(explicitBarHeight ?? usableHeight), usableHeight),
                      );
                    }
                  }

                  return (
                    <Barcode
                      value={barcodeValue}
                      renderer="svg"
                      width={computedBarWidth}
                      height={computedBarHeight}
                      displayValue={renderShowValue}
                      format={field?.format || "CODE128"}
                      lineColor={field?.lineColor || "#222222"}
                      background={field?.background || "transparent"}
                      // Default quiet-zone for scan reliability (can be overridden per field)
                      margin={marginPx}
                      fontSize={valueFontSize}
                      textMargin={valueTextMargin}
                      fontOptions={valueFontOptions}
                    />
                  );
                })()}
              </div>
            ) : field?.type === "qrcode" ? (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  padding: "0",
                  boxSizing: "border-box",
                }}
              >
                <QRCodeSVG
                  value={String(fieldValue || "N/A")}
                  size={512}
                  style={{ width: "100%", height: "100%" }}
                  bgColor="transparent"
                  fgColor={field?.lineColor || "#000000"}
                  level="M"
                  marginSize={2}
                />
              </div>
            ) : field?.type === "image" ? (
              <img
                src={field?.value}
                alt={String(field?.name || "Image")}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : field?.type === "table" ? (
              <table
                style={{
                  width: "100%",
                  height: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid black",
                  fontSize: `${fontSize}px`,
                }}
              >
                <tbody>
                  {(field?.tableData || [["Cell", "Cell"]]).map((row: any[], ri: number) => (
                    <tr key={ri}>
                      {row.map((cell: any, ci: number) => (
                        <td
                          key={ci}
                          style={{
                            border: "1px solid black",
                            padding: "2px",
                            textAlign: align as any,
                          }}
                        >
                          {String(cell ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  minHeight: 0,
                  padding: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  lineHeight: (field?.styles?.lineHeight as any) || "1.4",
                  ...field?.styles,
                  fontSize: `${fontSize}px`,
                  justifyContent:
                    align === "left"
                      ? "flex-start"
                      : align === "right"
                        ? "flex-end"
                        : "center",
                }}
              >
                {String(fieldValue || "")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
