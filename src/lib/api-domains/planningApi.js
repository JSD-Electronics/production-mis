import { apiCore, unwrap } from "../api-core";

// Incremental migration adapter.
// Existing code can keep using src/lib/api.js. New code should prefer domain adapters.
export const planningApi = {
  getById: async (id) => unwrap(await apiCore.get(`/planingAndScheduling/get/${id}`)),
  updateStatus: async (id, formData) =>
    unwrap(await apiCore.put(`/process/updateProcessStatus/${id}`, formData)),
  addDowntime: async (id, formData) =>
    unwrap(await apiCore.put(`/process/addDownTime/${id}`, formData)),
  addOvertime: async (id, payload) =>
    unwrap(await apiCore.put(`/process/addOvertime/${id}`, payload)),
  removeOvertime: async (id, windowId) =>
    unwrap(await apiCore.delete(`/process/removeOvertime/${id}/${windowId}`)),
  getOvertime: async (id) => unwrap(await apiCore.get(`/process/overtime/${id}`)),
  getDowntimeReasons: async () => unwrap(await apiCore.get("/planing/downtime-reasons")),
};

