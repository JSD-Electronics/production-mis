import React from "react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
const StickerGenerator = ({ stickerData, deviceData }) => {
  const { width, height } = stickerData.dimensions;

  const toCamelCase = (str) => {
    return str
      .split("_")
      .map((word, index) =>
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
      }}
    >
      {stickerData?.fields?.map((field) => {
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
              background: field.styles?.background || "transparent",
              padding: "2px",
              borderRadius: "4px",
            }}
          >
            {field.type === "barcode" ? (
              <Barcode
                value={fieldValue || "000000000000"}
                width={2} // bar thickness
                height={field.height - 5 || 40}
                displayValue={true} // show text below
                fontSize={12}
                background="transparent"
                lineColor="#000000"
              />
            ) : field.type === "qrcode" ? (
              <QRCodeCanvas
                value={fieldValue || "N/A"}
                size={field.width || 80}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H" // error correction (L, M, Q, H)
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
