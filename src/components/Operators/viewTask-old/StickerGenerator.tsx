import React from "react";
import StickerRenderer from "@/components/sticker/StickerRenderer";

// Backward-compatible wrapper: keep existing import paths working,
// but render via the shared canonical renderer to avoid drift between pages.
const StickerGenerator = ({
  stickerData,
  deviceData,
}: {
  stickerData: any;
  deviceData: any;
}) => {
  return <StickerRenderer template={stickerData} deviceData={deviceData} />;
};

export default StickerGenerator;

