import React from "react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";

const StickerGenerator = ({ stickerData, deviceData }: { stickerData: any; deviceData: any }) => {
  const width = stickerData?.dimensions?.width || stickerData?.cartonWidth || 300;
  const height = stickerData?.dimensions?.height || stickerData?.cartonHeight || 150;

  const toCamelCase = (str: string) => {
    return str
      .split("_")
      .map((word: string, index: number) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join("");
  };

  const resolveValue = (field: any, device: any) => {
    let baseValue = field.value || "";

    const isDynamic =
      field.type === "barcode" ||
      field.type === "qrcode" ||
      field.type === "dynamic_url" ||
      !!field.slug ||
      (typeof baseValue === "string" && baseValue.includes("{"));
    if (!isDynamic) return baseValue;

    if (!device) return baseValue;

    // Custom Fields Lookup Preparation
    const customFields = device?.customFields || device?.custom_fields || device?.customfields;
    let customFieldsObj: any = null;
    if (customFields) {
      customFieldsObj = customFields;
      if (typeof customFieldsObj === "string") {
        try { customFieldsObj = JSON.parse(customFieldsObj); } catch (e) { customFieldsObj = null; }
      }
    }

    const normalize = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Helper to find a value in a potentially nested object
    const findDeep = (obj: any, targetSlug: string, targetCamel: string): any => {
      if (!obj || typeof obj !== "object") return undefined;

      const keys = Object.keys(obj);
      const normTarget = normalize(targetSlug);

      // Try shallow first
      const foundKey = keys.find(k =>
        k === targetSlug ||
        k === targetCamel ||
        normalize(k) === normTarget
      );

      if (foundKey && typeof obj[foundKey] !== "object") {
        return obj[foundKey];
      }

      // Try nested
      for (const k of keys) {
        if (typeof obj[k] === "object" && obj[k] !== null) {
          const deepVal = findDeep(obj[k], targetSlug, targetCamel);
          if (deepVal !== undefined) return deepVal;
        }
      }
      return undefined;
    }

    const findLoose = (obj: any, targetSlug: string, targetCamel: string): any => {
      if (!obj || typeof obj !== "object") return undefined;
      const keys = Object.keys(obj);
      const normTarget = normalize(targetSlug);
      const foundKey = keys.find((k) => {
        const normKey = normalize(k);
        return (
          k === targetSlug ||
          k === targetCamel ||
          normKey === normTarget ||
          normKey.startsWith(normTarget) ||
          normTarget.startsWith(normKey) ||
          normKey.includes(normTarget) ||
          normTarget.includes(normKey)
        );
      });
      if (foundKey && typeof obj[foundKey] !== "object") {
        return obj[foundKey];
      }
      for (const k of keys) {
        if (typeof obj[k] === "object" && obj[k] !== null) {
          const deepVal = findLoose(obj[k], targetSlug, targetCamel);
          if (deepVal !== undefined) return deepVal;
        }
      }
      return undefined;
    };

    // Slug replacement logic for any field type (allows dynamic barcodes/qr/text)
    if (typeof baseValue === "string" && baseValue.includes("{")) {
      const slugs = baseValue.match(/{[^{}]+}/g) || [];
      slugs.forEach((slugBox: string) => {
        const slug = slugBox.slice(1, -1);
        const camelSlug = toCamelCase(slug);

        // Priority lookup: direct device property -> camelCase device property
        let val = device[camelSlug] !== undefined ? device[camelSlug] :
          device[slug] !== undefined ? device[slug] : undefined;

        if ((val === undefined || val === "") && customFieldsObj) {
          const deepV = findDeep(customFieldsObj, slug, camelSlug);
          if (deepV !== undefined && deepV !== "") val = deepV;
        }
        if ((val === undefined || val === "") && device) {
          const deepV = findDeep(device, slug, camelSlug);
          if (deepV !== undefined && deepV !== "") val = deepV;
        }
        if ((val === undefined || val === "") && customFieldsObj) {
          const looseV = findLoose(customFieldsObj, slug, camelSlug);
          if (looseV !== undefined && looseV !== "") val = looseV;
        }
        if ((val === undefined || val === "") && device) {
          const looseV = findLoose(device, slug, camelSlug);
          if (looseV !== undefined && looseV !== "") val = looseV;
        }

        baseValue = baseValue.replace(slugBox, (val !== undefined && val !== "") ? String(val) : "");
      });
      if (field.type === "dynamic_url") return baseValue;
    }

    const lookupSlug = field.slug || (typeof field.value === "string" ? field.value.trim() : "");
    const formattedKey = lookupSlug ? toCamelCase(lookupSlug) : "";
    let fieldValue = (formattedKey && device) ? device[formattedKey] : undefined;

    // Prioritize deep exact matches first
    if ((fieldValue === undefined || fieldValue === "") && lookupSlug !== "serial_no" && customFieldsObj) {
      const v = findDeep(customFieldsObj, lookupSlug || "", formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }
    if ((fieldValue === undefined || fieldValue === "") && device && lookupSlug) {
      const v = findDeep(device, lookupSlug, formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }

    // Fallbacks to loose matching
    if (lookupSlug !== "serial_no" && (fieldValue === undefined || fieldValue === "") && customFieldsObj) {
      const v = findLoose(customFieldsObj, lookupSlug || "", formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }
    if ((fieldValue === undefined || fieldValue === "") && device && lookupSlug) {
      const v = findLoose(device, lookupSlug, formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }

    // Also try normalize(field.name) if slug fails
    if ((fieldValue === undefined || fieldValue === "") && field.name && customFieldsObj) {
      let v = findDeep(customFieldsObj, field.name, toCamelCase(field.name));
      if (v === undefined || v === "") {
        v = findLoose(customFieldsObj, field.name, toCamelCase(field.name));
      }
      if (v !== undefined && v !== "") fieldValue = v;
    }

    if (fieldValue === undefined && lookupSlug && baseValue === lookupSlug) {
      return "";
    }
    return fieldValue !== undefined ? String(fieldValue) : baseValue || "";
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
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "black",
      }}
    >
      {stickerData?.fields?.map((field: any) => {
        const device = (deviceData && deviceData.length > 0) ? deviceData[0] : null;
        const fieldValue = resolveValue(field, device);
        const barcodeValue = String(fieldValue || "");
        const safeBarcodeValue = barcodeValue.trim() ? barcodeValue : "N/A";

        const align = field.styles?.textAlign || "center";
        const fontSize = parseInt(String(field.styles?.fontSize || 14), 10);

        return (
          <div
            key={field._id || field.id}
            className="absolute flex items-center"
            style={{
              top: `${field.y}px`,
              left: `${field.x}px`,
              width: `${field.width || 100}px`,
              height: `${field.height || 30}px`,
              justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
              padding: "0 2px",
              boxSizing: "border-box",
              zIndex: 10,
            }}
          >
            {field.type === "barcode" ? (
              <div
                className="flex w-full h-full items-center justify-center"
                style={{ background: "transparent", padding: "0", boxSizing: "border-box" }}
              >
                {(() => {
                  const estimatedModules = safeBarcodeValue.length * 11 + 35;
                  const targetWidth = field.width;
                  const computedBarWidth = targetWidth
                    ? Math.max(0.5, targetWidth / estimatedModules)
                    : field.barWidth || 1;

                  const showValue = field.displayValue !== false;
                  const valueFontSize = field.fontSize ?? 12;
                  const valueTextMargin = field.textMargin ?? 2;
                  const valueFontOptions = field.valueFontBold ? "bold" : undefined;
                  const valueSpace = showValue ? valueFontSize + valueTextMargin : 0;
                  const baseHeight = field.height;
                  const computedBarHeight = Math.max(
                    1,
                    (baseHeight || 0) - valueSpace,
                  );

                  return (
                    <Barcode
                      value={safeBarcodeValue}
                      renderer="svg"
                      width={computedBarWidth}
                      height={computedBarHeight}
                      displayValue={showValue}
                      format={field.format || "CODE128"}
                      lineColor={field.lineColor || "#000000"}
                      background={field.background || "transparent"}
                      margin={0}
                      fontSize={valueFontSize}
                      textMargin={valueTextMargin}
                      fontOptions={valueFontOptions}
                    />
                  );
                })()}
              </div>
            ) : field.type === "qrcode" ? (
              <div
                className="flex w-full h-full items-center justify-center"
                style={{ background: "transparent", padding: "0", boxSizing: "border-box" }}
              >
                <QRCodeCanvas
                  value={String(fieldValue || "N/A")}
                  size={512}
                  style={{ width: "100%", height: "100%" }}
                  bgColor="transparent"
                  fgColor={field.lineColor || "#000000"}
                  level="M"
                  marginSize={2}
                />
              </div>
            ) : field.type === "image" ? (
              <img
                src={field.value}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : field.type === "table" ? (
              <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", border: "1px solid black", fontSize: `${fontSize}px` }}>
                <tbody>
                  {(field.tableData || [["Row 1", "Col 2"], ["Row 2", "Col 2"]]).map((row: any[], ri: number) => (
                    <tr key={ri}>
                      {row.map((cell: string, ci: number) => (
                        <td key={ci} style={{ border: "1px solid black", padding: "2px", textAlign: align as any }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span
                style={{
                  width: "100%",
                  fontSize: `${fontSize}px`,
                  fontWeight: field.styles?.fontWeight || "normal",
                  color: field.styles?.color || "black",
                  textAlign: align as any,
                  lineHeight: field.styles?.lineHeight || "1.4",
                  letterSpacing: field.styles?.letterSpacing || undefined,
                  display: "block",
                  background: "transparent"
                }}
              >
                {String(fieldValue || "")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerGenerator;
