import React from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { resolveStickerValue } from "@/lib/sticker/resolveStickerValue";
import { getBarcodeLayout } from "@/lib/sticker/barcodeLayout";
import { normalizeFieldSourceFieldsForEncoding } from "@/lib/sticker/sourceFields";

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

const getSourceFields = (field: any) =>
  normalizeFieldSourceFieldsForEncoding(field, { includeFallback: true });

const getSampleValueForSlug = (slugLike: any) => {
  const s = String(slugLike || "").toLowerCase();
  if (!s) return "N/A";
  if (s.includes("imei")) return "868329082416730";
  if (s.includes("ccid")) return "89911024059647563056";
  if (s.includes("serial") || s === "sn" || s.includes("s/no") || s.includes("s/n")) {
    return "GAGN14A261400635";
  }
  return "N/A";
};

const getSampleValueForField = (field: any) => {
  const bindings = getSourceFields(field);
  if (bindings.length > 0) {
    return bindings
      .map((entry: any) => getSampleValueForSlug(entry?.slug || entry?.name))
      .filter(Boolean)
      .join(",");
  }
  return getSampleValueForSlug(field?.slug || field?.name);
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
        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
        color: "black",
      }}
    >
      {fields.map((raw: any) => {
        const field = normalizeField(raw);
        const fieldValue = resolveStickerValue(field, device);
        const align = field?.styles?.textAlign || "center";
        const fontSize = Number(field?.fontSize ?? 14) || 14;
        const rawFieldWidth = Math.max(1, Number(field?.width || 100));
        const rawFieldHeight = Math.max(1, Number(field?.height || 30));
        const key = field?._id || field?.id || `${field?.name || "field"}-${field?.x}-${field?.y}`;

        const rawBarcodeValue = String(fieldValue ?? "").trim();
        const sampleBarcodeValue = getSampleValueForField(field);
        const barcodeValue = rawBarcodeValue || sampleBarcodeValue;
        const barcodeLayout =
          field?.type === "barcode"
            ? getBarcodeLayout({
                value: barcodeValue,
                field,
                templateWidth: width,
                templateHeight: height,
              })
            : null;

        const fieldWidth = barcodeLayout?.renderWidth ?? rawFieldWidth;
        const fieldHeight = barcodeLayout?.renderHeight ?? rawFieldHeight;
        const barcodeMessage =
          barcodeLayout?.message && barcodeLayout?.recommendation
            ? `${barcodeLayout.message} ${barcodeLayout.recommendation}`
            : barcodeLayout?.message;
        // Debug: Log QR code field order and value
        if (field?.type === "qrcode") {
          const debugSourceFields = Array.isArray(field?.sourceFields) ? field.sourceFields.map(f => f.slug || f.name || f).join(", ") : "(none)";
          // eslint-disable-next-line no-console
          console.log("[Sticker QR DEBUG] sourceFields order:", debugSourceFields);
          // eslint-disable-next-line no-console
          console.log("[Sticker QR DEBUG] generated value:", fieldValue);
        }
        const qrValue = String(fieldValue || getSampleValueForField(field) || "N/A");

        return (
          <div
            key={key}
            data-barcode-valid={barcodeLayout ? String(barcodeLayout.isValid) : undefined}
            data-barcode-message={barcodeMessage || undefined}
            data-barcode-field={field?.name || field?.slug || undefined}
            data-barcode-format={barcodeLayout?.format || undefined}
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              top: `${field?.y ?? 0}px`,
              left: `${field?.x ?? 0}px`,
              width: `${fieldWidth}px`,
              height: `${fieldHeight}px`,
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
                  overflow: "visible",
                }}
              >
                {barcodeLayout?.isValid ? (
                  <Barcode
                    value={barcodeValue}
                    renderer="svg"
                    width={barcodeLayout.barWidth}
                    height={barcodeLayout.barHeight}
                    displayValue={barcodeLayout.displayValue}
                    format={barcodeLayout.format}
                    lineColor={field?.lineColor || "#222222"}
                    background={field?.background || "transparent"}
                    margin={barcodeLayout.marginPx}
                    fontSize={barcodeLayout.fontSize}
                    textMargin={barcodeLayout.textMargin}
                    fontOptions={barcodeLayout.fontOptions}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "1px solid #b91c1c",
                      color: "#991b1b",
                      background: "#fef2f2",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      padding: "4px 6px",
                      boxSizing: "border-box",
                      gap: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: 700 }}>
                      {String(field?.name || field?.slug || "Barcode")}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        lineHeight: 1.25,
                        whiteSpace: "normal",
                      }}
                    >
                      {barcodeLayout?.message}
                    </div>
                    {barcodeLayout?.recommendation ? (
                      <div style={{ fontSize: "9px", lineHeight: 1.2 }}>
                        {barcodeLayout.recommendation}
                      </div>
                    ) : null}
                    <div
                      style={{
                        fontSize: "9px",
                        opacity: 0.85,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                      }}
                    >
                      {barcodeValue}
                    </div>
                  </div>
                )}
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
                  value={qrValue}
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
