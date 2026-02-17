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
    if (!device) return baseValue;

    // Slug replacement logic for any field type (allows dynamic barcodes/qr/text)
    if (typeof baseValue === "string" && baseValue.includes("{")) {
      const slugs = baseValue.match(/{[^{}]+}/g) || [];
      slugs.forEach((slugBox: string) => {
        const slug = slugBox.slice(1, -1);
        const camelSlug = toCamelCase(slug);
        const val = device[camelSlug] || device[slug] || "";
        baseValue = baseValue.replace(slugBox, val);
      });
      if (field.type === "dynamic_url") return baseValue;
    }

    const formattedKey = field.slug ? toCamelCase(field.slug) : "";
    let fieldValue = (formattedKey && device) ? device[formattedKey] : undefined;

    // Custom Fields Lookup
    const customFields = device?.customFields || device?.custom_fields || device?.customfields;
    if (field.slug !== "serial_no" && !fieldValue && customFields) {
      let customFieldsObj = customFields;
      if (typeof customFieldsObj === "string") {
        try { customFieldsObj = JSON.parse(customFieldsObj); } catch (e) { customFieldsObj = null; }
      }

      if (customFieldsObj) {
        const slug = (field.slug || "").toLowerCase();
        const displayName = (field.name || "").toLowerCase();
        const keys = Object.keys(customFieldsObj);
        const normalize = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const foundKey = keys.find(k => {
          const kLower = k.toLowerCase();
          return kLower === slug ||
            kLower === displayName ||
            normalize(k) === normalize(slug) ||
            normalize(k) === normalize(displayName);
        });

        if (foundKey) {
          fieldValue = customFieldsObj[foundKey];
        } else {
          fieldValue = customFieldsObj[formattedKey] ||
            customFieldsObj[formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)];
        }
      }
    }
    return fieldValue || baseValue || "";
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
              <div className="flex w-full h-full items-center justify-center">
                <Barcode
                  value={String(fieldValue || "000000000000")}
                  renderer="svg"
                  width={field.barWidth || 1}
                  height={(field.height || 40) - 15}
                  displayValue={true}
                  fontSize={fontSize - 4 > 8 ? fontSize - 4 : 8}
                  background="transparent"
                  margin={0}
                />
              </div>
            ) : field.type === "qrcode" ? (
              <div className="flex w-full h-full items-center justify-center">
                <QRCodeCanvas
                  value={String(fieldValue || "N/A")}
                  size={Math.min(field.width || 80, field.height || 80)}
                  bgColor="transparent"
                  fgColor={field.styles?.color || "#000000"}
                  level="H"
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
                  lineHeight: "1.4",
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
