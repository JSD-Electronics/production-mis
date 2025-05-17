import React from "react";
import Barcode from "react-barcode";

const StickerGenerator = ({ stickerData, deviceData }) => {
  const { width, height } = stickerData.dimensions;

  // Convert snake_case to CamelCase
  const toCamelCase = (str) => {
    return str
      .split("_") // Split by underscore
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1),
      ) // Lowercase first word, capitalize rest
      .join(""); // Join words
  };

  return (
    <div
      className="border-gray-300 relative border bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        transformOrigin: "top left",
        transform: "scale(1)",
      }}
    >
      {stickerData.fields.map((field) => {
        const formattedKey = toCamelCase(field.slug);
        const fieldValue = deviceData[0]?.hasOwnProperty(formattedKey)
          ? deviceData[0][formattedKey]
          : "N/A";

        return (
          <div
            key={field._id}
            className="absolute flex justify-center whitespace-nowrap text-center"
            style={{
              top: `${field.y}px`,
              left: `${field.x}px`,
              width: `${field.width}px`,
              height: `${field.height}px`,
              fontSize: `${field.styles.fontSize || 14}px`,
              fontWeight: field.styles.fontWeight || "normal",
              fontStyle: field.styles.fontStyle || "normal",
              color: field.styles.color || "black",
            }}
          >
            {field.type === "barcode" ? (
              <div className="flex h-full w-full items-center justify-center bg-white p-4.5">
                <Barcode
                  value={fieldValue || "000000000000"}
                  width={field.width / 120}
                  height={field.height - 5}
                  displayValue={true}
                  background={"#04040400"}
                />
              </div>
            ) : (
              <div className="bg-gray-100 p-2 text-center">
                <span>{fieldValue}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerGenerator;
