import { apiCore, unwrap } from "../api-core";

// Incremental migration adapter for operator task flows.
export const operatorApi = {
  getTaskByUserId: async (id) => unwrap(await apiCore.get(`/assignPlanToOperator/get/${id}`)),
  getPlanningById: async (id) => unwrap(await apiCore.get(`/planingAndScheduling/get/${id}`)),
  createDeviceTestEntry: async (payload) =>
    unwrap(await apiCore.post("/deviceRecord/create", payload)),
  registerAttempt: async (payload) =>
    unwrap(await apiCore.post("/device/attempts/register", payload)),
  startWorkSession: async (payload) =>
    unwrap(await apiCore.post("/operator-work/sessions/start", payload)),
  getActiveSession: async (processId) =>
    unwrap(await apiCore.get("/operator-work/sessions/active", { params: processId ? { processId } : {} })),
};

