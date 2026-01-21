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

  return (
    <div
      className="border-gray-300 relative border bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        backgroundColor: "#ffffff",
      }}
    >
      {stickerData?.fields?.map((field: any) => {
        const formattedKey = toCamelCase(field.slug);
        const fieldValue = deviceData[0]?.[formattedKey];

        return (
          <div
            key={field._id}
            className="absolute flex items-center justify-center whitespace-nowrap text-center"
            style={{
              top: `${field.y}px`,
              left: `${field.x}px`,
              width: `${field.width || 100}px`,
              height: `${field.height || 30}px`,
              fontSize: `${field.styles?.fontSize || 14}px`,
              fontWeight: field.styles?.fontWeight || "normal",
              fontStyle: field.styles?.fontStyle || "normal",
              color: field.styles?.color || "black",
              border: field.type === "text" ? "none" : "1px dashed #ddd", // ✅ No border for text
              background: "transparent",
              padding: "2px",
              borderRadius: "4px",
            }}
          >
            {field.type === "barcode" ? (
              <div
                style={{
                  width:
                    typeof field.width === "number"
                      ? `${field.width}px`
                      : `${parseInt(String(field.width || 100), 10)}px`,
                  height:
                    typeof field.height === "number"
                      ? `${field.height}px`
                      : `${parseInt(String(field.height || 40), 10)}px`,
                  overflow: "hidden", // Prevent barcode from overlapping other fields
                }}
              >
                <Barcode
                  value={fieldValue || "000000000000"}
                  renderer="svg"
                  width={
                    typeof field.barWidth === "number"
                      ? field.barWidth
                      : Math.max(
                        1, // Changed from 3 to 1 to allow smaller barcodes
                        Math.floor(
                          (typeof field.width === "number"
                            ? field.width
                            : parseInt(String(field.width || 100), 10)) / 100, // Adjusted divisor from 180 to 100
                        ),
                      )
                  }
                  height={
                    typeof field.barHeight === "number"
                      ? field.barHeight
                      : (typeof field.height === "number"
                        ? field.height
                        : parseInt(String(field.height || 40), 10)) - 10 // Increased spacing for text
                  }
                  displayValue={true}
                  fontSize={10} // Slightly smaller font
                  background="#ffffff"
                  lineColor="#000000"
                  margin={0} // Removed margin (was 12) to prevent horizontal overflow
                  svgRef={(node: SVGSVGElement | null) => {
                    if (node) {
                      try {
                        node.setAttribute("preserveAspectRatio", "xMidYMid meet"); // Standard value to maintain aspect ratio and fit
                        const w =
                          typeof field.width === "number"
                            ? field.width
                            : parseInt(String(field.width || 100), 10);
                        const h =
                          typeof field.height === "number"
                            ? field.height
                            : parseInt(String(field.height || 40), 10);
                        node.setAttribute("width", String(w));
                        node.setAttribute("height", String(h));
                      } catch { }
                    }
                  }}
                />
              </div>
            ) : field.type === "qrcode" ? (
              <QRCodeCanvas
                value={fieldValue || "N/A"}
                size={Math.min(
                  typeof field.width === "number" ? field.width : parseInt(String(field.width || 80), 10),
                  typeof field.height === "number" ? field.height : parseInt(String(field.height || 80), 10),
                )}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={false}
              />
            ) : (
              field.type === "text" && <span>{field.value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerGenerator;
