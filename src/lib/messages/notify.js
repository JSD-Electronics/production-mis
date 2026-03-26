import { toast } from "react-toastify";
import { MESSAGE_CATALOG, formatMessage } from "./catalog";

const lookup = (key) => {
  if (!key) return null;
  const parts = String(key).split(".");
  let node = MESSAGE_CATALOG;
  for (const p of parts) {
    if (!node || typeof node !== "object" || !(p in node)) return null;
    node = node[p];
  }
  return typeof node === "string" ? node : null;
};

export const getMessage = (key, vars = {}, fallback = "") => {
  const template = lookup(key) || fallback || "";
  return formatMessage(template, vars);
};

export const toUserFriendlyError = (error, fallbackKey = "common.operationFailed") => {
  const fallback = getMessage(fallbackKey);
  const status = error?.response?.status;
  const apiMsg = error?.response?.data?.message || error?.response?.data?.error;
  const raw = String(apiMsg || error?.message || "").trim();

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Requested data was not found.";
  if (status === 409) return raw || "This action conflicts with existing data.";
  if (status === 422 || status === 400) return raw || getMessage("common.validationRequired");
  if (String(raw).toLowerCase().includes("network")) return getMessage("common.networkIssue");
  if (String(raw).toLowerCase().includes("timeout")) {
    return "The request took too long. Please try again.";
  }

  // Keep server-provided readable messages, but avoid leaking long traces.
  if (raw && raw.length <= 180 && !raw.includes("at ")) return raw;
  return fallback || getMessage("common.operationFailed");
};

export const notifySuccess = (key, vars = {}, fallback = "") => {
  toast.success(getMessage(key, vars, fallback));
};

export const notifyInfo = (key, vars = {}, fallback = "") => {
  toast.info(getMessage(key, vars, fallback));
};

export const notifyWarning = (key, vars = {}, fallback = "") => {
  toast.warn(getMessage(key, vars, fallback));
};

export const notifyError = (errorOrKey, vars = {}, fallback = "") => {
  if (typeof errorOrKey === "string") {
    toast.error(getMessage(errorOrKey, vars, fallback));
    return;
  }
  toast.error(toUserFriendlyError(errorOrKey, fallback || "common.operationFailed"));
};

