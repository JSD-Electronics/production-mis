export const MESSAGE_CATALOG = {
  common: {
    refreshed: "Data has been refreshed.",
    saveSuccess: "Changes have been saved successfully.",
    operationFailed: "We couldn't complete this action. Please try again.",
    networkIssue:
      "We couldn't reach the server. Please check your connection and try again.",
    validationRequired: "Please complete all required fields.",
  },
  planning: {
    resumeSuccess: "Process resumed successfully.",
    resumeFailed: "Unable to resume the process right now.",
    downtimeScheduled: "Downtime has been scheduled and the process is now on hold.",
    downtimeFailed: "Unable to schedule downtime right now.",
    downtimeInvalidRange: "Downtime end time must be later than start time.",
    overtimeAdded: "Overtime has been added successfully.",
    overtimeRemoved: "Overtime has been removed successfully.",
    overtimeFailed: "Unable to update overtime right now.",
    overtimeConflict:
      "This overtime window overlaps with another active plan in the same room/shift.",
    serialDownloadFailed: "Unable to download serials right now.",
    processDataMissing: "Process information is missing. Please refresh and try again.",
    noSerials: "No serials are available for this process yet.",
    stageSkillMismatch:
      "This operator does not have the required skills for the selected stage.",
    stageSequenceInvalid:
      "Only nearby stages can be assigned to this seat based on sequence rules.",
    stageAssignmentBlocked:
      "This stage cannot be assigned right now. Please review seat and stage sequence.",
  },
  operator: {
    deviceNotFound: "Device not found. Please verify the serial and search again.",
    deviceTestSaved: "Device test has been recorded successfully.",
    deviceTestFailed: "Unable to record device test. Please try again.",
    stickerPreviewMissing: "Sticker preview is not available for this device.",
    stickerPrintFailed: "Unable to print sticker. Please try again.",
    popupBlocked: "Please allow pop-ups in your browser to print stickers.",
    stickerVerifyFailed: "Sticker verification failed. Please try again.",
    stickerVerifySuccess: "Sticker verification completed successfully.",
    packagingVerified: "Packaging verified successfully.",
    serialMismatch: "Scanned value does not match the device serial. Please try again.",
  },
};

export const formatMessage = (template, vars = {}) => {
  if (!template || typeof template !== "string") return "";
  return Object.keys(vars).reduce((msg, key) => {
    const value = vars[key] == null ? "" : String(vars[key]);
    return msg.replaceAll(`{${key}}`, value);
  }, template);
};

