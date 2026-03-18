import React from "react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
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
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
            className="absolute flex items-center"
            style={{
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
                className="flex h-full w-full items-center justify-center"
                style={{
                  background: "transparent",
                  padding: "0",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {(() => {
                  const barcodeValue = String(fieldValue || "").trim() ? String(fieldValue) : "N/A";
                  const estimatedModules = barcodeValue.length * 11 + 35;
                  const targetWidth = field?.width;

                  const explicitBarWidth =
                    field?.barWidthMm != null
                      ? mmToPx(Number(field.barWidthMm))
                      : field?.barWidth;

                  const computedBarWidth = explicitBarWidth
                    ? Math.max(0.5, Number(explicitBarWidth))
                    : targetWidth
                      ? Math.max(0.5, targetWidth / estimatedModules)
                      : 1;

                  const showValue = field?.displayValue !== false;
                  const valueFontSize = field?.fontSize ?? 12;
                  const valueTextMargin = field?.textMargin ?? 2;
                  const valueFontOptions = field?.valueFontBold ? "bold" : undefined;
                  const valueSpace = showValue ? valueFontSize + valueTextMargin : 0;

                  const baseHeight = field?.height;
                  const computedBarHeight = Math.max(1, (baseHeight || 0) - valueSpace);

                  return (
                    <Barcode
                      value={barcodeValue}
                      renderer="svg"
                      width={computedBarWidth}
                      height={computedBarHeight}
                      displayValue={showValue}
                      format={field?.format || "CODE128"}
                      lineColor={field?.lineColor || "#000000"}
                      background={field?.background || "transparent"}
                      margin={0}
                      fontSize={valueFontSize}
                      textMargin={valueTextMargin}
                      fontOptions={valueFontOptions}
                    />
                  );
                })()}
              </div>
            ) : field?.type === "qrcode" ? (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: "transparent", padding: "0", boxSizing: "border-box" }}
              >
                <QRCodeCanvas
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
                className="flex h-full min-h-0 w-full items-center whitespace-pre-wrap break-words p-0 leading-normal"
                style={{
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

