import axios from "axios";
const api = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "If-None-Match": "",
    "If-Modified-Since": "0",
  },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userDetails");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);
export const login = async (email, password) => {
  try {
    const response = await api.post("/login", { email, password });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userDetails", JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};
export const logout = async () => {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
  }
};
export const getUserDetail = async (id) => {
  try {
    const response = await api.get("/get-user-details?id=" + id);
    return response.data;
  } catch (error) {
    console.error("Failed to get user details:", error);
    throw error;
  }
};
export const uploadProfilePicture = async (id, formData) => {
  try {
    const response = await api.post(`/upload-image/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error.response?.data || { message: "Error uploading file" };
  }
};
export const uploadCoverPicture = async (id, formData) => {
  try {
    const response = await api.post(`/upload-cover-image/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error.response?.data || { message: "Error uploading file" };
  }
};
export const createProduct = async (formData) => {
  try {
    const response = await api.post(`/add/product`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const updateProduct = async (formData, id) => {
  try {
    const response = await api.put(`/product/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Updating Stage:`, error);
    throw error.response?.data || { message: "Error Updating Stage" };
  }
};
export const viewProduct = async () => {
  try {
    const response = await api.get("/product/view");
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/product/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const deleteMultipleProduct = async (ids) => {
  try {
    const response = await api.post(`/product/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/product/get/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const createJig = async (formData) => {
  try {
    const response = await api.post(`/jig/create`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Jig:`, error);
    throw error.response?.data || { message: "Error Creating Jig" };
  }
};
export const createJigCategory = async (formData) => {
  try {
    const response = await api.post(`/jig/category/create`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Jig:`, error);
    throw error.response?.data || { message: "Error Creating Jig" };
  }
};
export const viewJig = async () => {
  try {
    const response = await api.get("/jig/view");
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const viewJigCategory = async () => {
  try {
    const response = await api.get("/jig/category/view");
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const deleteJig = async (id) => {
  try {
    const response = await api.delete(`/jig/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const deleteJigCategories = async (id) => {
  try {
    const response = await api.delete(`/jig/category/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const deleteMultipleJig = async (ids) => {
  try {
    const response = await api.post(`/jig/delete/multiple`, { deleteIds: ids });
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const deleteMultipleJigCategories = async (ids) => {
  try {
    const response = await api.post(`/jig/categories/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const createRoomPlan = async (formData) => {
  try {
    const response = await api.post(`/room-plan/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Room Plan :`, error);
    throw error.response?.data || { message: "Error Creating Room Plan!!" };
  }
};
export const viewRoom = async () => {
  try {
    const response = await api.get(`/room-plan/view`);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Room Plan :`, error);
    throw error.response?.data || { message: "Error Creating Room Plan!!" };
  }
};
export const deleteRoomPlan = async (id) => {
  try {
    const response = await api.delete(`/room-plan/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Room Plan`, error);
    throw error.response?.data || { message: "Error Deleting Room Plan!!" };
  }
};
export const deleteMultipleRoomPlan = async (ids) => {
  try {
    const response = await api.post(`/room-plan/deleteRoomPlan`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const getRoomPlanById = async (id) => {
  try {
    let response = await api.get(`/room-plan/getRoomPlanByID/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const updateRoomPlan = async (formData, id) => {
  try {
    const response = await api.put(
      `/room-plan/getRoomPlanByID/update/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.error(`Error Updating Rpom Plan:`, error);
    throw error.response?.data || { message: "Error Updating Room Plan" };
  }
};
export const createUser = async (formData, id) => {
  try {
    const response = await api.post(`/user/create`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Updating Rpom Plan:`, error);
    throw error.response?.data || { message: "Error Updating Room Plan" };
  }
};
export const getUsers = async () => {
  try {
    const response = await api.get(`/user/view`);
    return response.data;
  } catch (error) {
    console.error(`Error Updating Rpom Plan:`, error);
    throw error.response?.data || { message: "Error Updating Room Plan" };
  }
};
export const getOperatorsForPlan = async () => {
  try {
    const response = await api.get(`/operators/getVacantOperator`);
    return response.data;
  } catch (error) {
    console.error(`Error Updating Rpom Plan:`, error);
    throw error.response?.data || { message: "Error Updating Room Plan" };
  }
};
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/user/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting User`, error);
    throw error.response?.data || { message: "Error Deleting User!!" };
  }
};
export const deleteMultipleUser = async (ids) => {
  try {
    const response = await api.post(`/user/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error Creating Stage:`, error);
    throw error.response?.data || { message: "Error Creating Stage" };
  }
};
export const updateUser = async (formData, id) => {
  try {
    const response = await api.put(`/user/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Updating Users:`, error);
    throw error.response?.data || { message: "Error Updating Users" };
  }
};
export const createUserRoles = async (data) => {
  try {
    const response = await api.post(`/user-roles/create`, data);
    return response.data;
  } catch (error) {
    console.error(`Error Create Users Roles:`, error);
    throw error.response?.data || { message: "Error Create Users Roles" };
  }
};
export const getUsersRoles = async () => {
  try {
    const response = await api.get(`/user-roles/view`);
    return response.data;
  } catch (error) {
    console.error(`Error Fetching User Roles:`, error);
    throw error.response?.data || { message: "Error Fetching User Roles" };
  }
};
export const deleteUserRole = async (id) => {
  try {
    const response = await api.delete(`/user-roles/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting User Roles`, error);
    throw error.response?.data || { message: "Error Deleting User Roles!!" };
  }
};
export const deleteMultipleUserRole = async (ids) => {
  try {
    const response = await api.post(`/user-roles/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.error(`Error Deleting User Roles:`, error);
    throw error.response?.data || { message: "Error Deleting User Roles" };
  }
};
export const getUserRolesById = async (id) => {
  try {
    let response = await api.get(`/user-roles/get/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error Fetching User Roles:`, error);
    throw error.response?.data || { message: "Error Fetching User Roles:" };
  }
};
export const updateUserRoles = async (formData, id) => {
  try {
    const response = await api.put(`/roles/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error Updating User Role:`, error);
    throw error.response?.data || { message: "Error Updating User Role" };
  }
};
export const getUserType = async () => {
  try {
    const response = await api.get(`/user-type/get`);
    return response.data;
  } catch (error) {
    console.error(`Error Fetching User Type:`, error);
    throw error.response?.data || { message: "Error Fetching User Type" };
  }
};
export const getUseTypeByType = async (userType) => {
  try {
    const response = await api.get(`/user-type/getPermissionByType`);
    return response.data;
  } catch (error) {
    console.error(`Error Fetching User Type:`, error);
    throw error.response?.data || { message: "Error Fetching User Type" };
  }
};
export const getAllMenus = async () => {
  try {
    const response = await api.get(`/menu/get`);
    return response.data;
  } catch (error) {
    console.error(`Error Fetching User Type:`, error);
    throw error.response?.data || { message: "Error Fetching User Type" };
  }
};
export const createShift = async (data) => {
  try {
    const response = await api.post(`/shift/create`, data);
    return response.data;
  } catch (error) {
    console.error(`Error Creating Shifts`, error);
    throw error.response?.data || { message: "Error Fetching User Type" };
  }
};
export const viewShift = async () => {
  try {
    const response = await api.get(`/shift/view`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Shifts`, error);
    throw error.response?.data || { message: `Error Fetching User Type` };
  }
};
export const deleteShift = async (id) => {
  try {
    const response = await api.delete(`/shift/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Shift`, error);
    throw error.response?.data || { message: `Error Deleting shift` };
  }
};
export const deleteMultipleShifts = async (ids) => {
  try {
    const response = await api.post(`/shift/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Shifts`, error);
    throw error.response?.data || { message: `Error Deleting Shift!!` };
  }
};
export const getShift = async (id) => {
  try {
    let response = await api.get(`/shift/get/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Shifts`, error);
    throw error.response?.data || { message: `Error Fetching Shifts` };
  }
};
export const updateShift = async (formData, id) => {
  try {
    const response = await api.put(`/shift/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Updating Shift`, error);
    throw error.response?.data || { message: `Error Updating Shift` };
  }
};
export const createProcess = async (formData, id) => {
  try {
    const response = await api.post(`/process/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Process`, error);
    throw error.response?.data || { message: `Error Creating Process` };
  }
};
export const viewProcess = async () => {
  try {
    const response = await api.get(`/process/view`);
    return response.data;
  } catch (error) {
    console.log("Error Fetching Process", error);
    throw error.response?.data || { message: `Error Fetching Process` };
  }
};
export const viewProcessByProductId = async (id) => {
  try {
    const response = await api.get(`/getProcessesByProductId/${id}`);
    return response.data;
  } catch (error) {
    console.log("Error Fetching Processes", error);
    throw error.response.data || { message: "Error Fetching Process" };
  }
};
export const deleteProcess = async (id) => {
  try {
    const reponse = api.delete(`/process/delete/${id}`);
    return reponse.data;
  } catch (error) {
    console.log("Error Deleting Process", error);
    throw error.response?.data || { message: `Error Deleting Process` };
  }
};
export const deleteMultipleProcesses = async (ids) => {
  try {
    const response = await api.post(`/process/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Process`, error);
    throw error.response?.data || { message: `Error Deleting Process!!` };
  }
};
export const getProcessByID = async (id) => {
  try {
    let response = await api.get(`/process/get/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Process`, error);
    throw error.response?.data || { message: `Error Fetching Process!!` };
  }
};
export const updateProcess = async (formData, id) => {
  try {
    const response = await api.put(`/process/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Process`, error);
    throw error.response?.data || { message: `Error Fetching Process!!` };
  }
};
export const createPlaningAndScheduling = async (formData) => {
  try {
    const response = await api.post(`/planing/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Planing and Scheduling`, error);
    throw (
      error.response?.data || {
        message: `Error Fetching Planing and Scheduling!!`,
      }
    );
  }
};
export const checkPlanningAndScheduling = async (
  roomId,
  shiftId,
  startDate,
  expectedEndDate,
  shiftDataChange,
) => {
  try {
    const data = {
      roomId,
      shiftId,
      startDate,
      expectedEndDate,
      shiftDataChange,
    };
    const response = await api.post(`/planing/get`, data);
    if (response.status === 200) {
      return response.data;
    } else {
      console.warn("Unexpected response status:", response.status);
      return [];
    }
  } catch (error) {
    console.error("Error fetching planning and scheduling:", error);
    throw (
      error.response?.data || {
        message: "Error fetching planning and scheduling!",
      }
    );
  }
};
export const viewPlaning = async () => {
  try {
    const response = await api.get(`/planing/view`);
    return response.data;
  } catch (error) {
    console.log("Error Fetching the planning and Scheduling", error);
    throw (
      error.response?.data || {
        message: `Error Fetching Planing and Scheduling!!`,
      }
    );
  }
};
export const deletePlan = async (id) => {
  try {
    const response = await api.delete(`/planing/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log("Error Deleting the Planing and Scheduling", error);
    throw (
      error.response?.data || {
        message: "Error Deleting Planing and Scheduling|",
      }
    );
  }
};
export const deleteMultiplePlaning = async (ids) => {
  try {
    const response = await api.post(`/planing/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Process`, error);
    throw error.response?.data || { message: `Error Deleting Process!!` };
  }
};
export const getPlaningAndSchedulingById = async (id) => {
  try {
    let response = await api.get(`/planingAndScheduling/get/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Process`, error);
    throw error.response?.data || { message: `Error Deleting Process!!` };
  }
};
export const getOperatorTaskByUserID = async (id) => {
  try {
    let response = await api.get(`/assignPlanToOperator/get/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Operator`, error);
    throw error.response?.data || { message: `Error Fetching Process !!` };
  }
};
export const getPlaningAndSchedulingByProcessId = async (id) => {
  try {
    let response = await api.get(
      `/planingAndScheduling/getPlaningAnDschedulingByProcessId/${id}`,
    );
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Process`, error);
    throw error.response?.data || { message: `Error Deleting Process!!` };
  }
};
export const updatePlaningAndScheduling = async (formData, id) => {
  try {
    const response = await api.put(
      `/planingAndScheduling/update/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Process`, error);
    throw error.response?.data || { message: `Error Fetching Process!!` };
  }
};
export const fetchHolidays = async () => {
  try {
    const response = await api.get("/holiday/view");
    return response?.data;
  } catch (error) {
    console.log(`Error Fetching Holidays`, error);
    throw error?.response?.data || { message: `Error Fetching Holidays!` };
  }
};
export const createHoliday = async (formData) => {
  try {
    const response = await api.post(`/holiday/create`, formData);
    return response?.data;
  } catch (error) {
    console.log(`Error Creating Holiday`, error);
    throw error?.response?.data || { message: `Error Fetching Holiday!` };
  }
};
export const deleteHolidays = async (id) => {
  try {
    const response = await api.delete(`/holiday/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Delete Holidays`, error);
    throw error?.response?.data || { message: `Error Deleting Holiday!` };
  }
};
export const deleteIMEI = async (id) => {
  try {
    const response = await api.delete(`/devices/deleteIMEI/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Delete IMEI`, error);
    throw error?.response?.data || { message: `Error Deleting IMEI!` };
  }
};
export const deleteMultipleIMEI = async (ids) => {
  try {
    const response = await api.post(`/devices/deleteIMEI/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Holiday`, error);
    throw error.response?.data || { message: `Error Deleting Holiday!!` };
  }
};
export const deleteMultipleHoliday = async (ids) => {
  try {
    const response = await api.post(`/holiday/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Holiday`, error);
    throw error.response?.data || { message: `Error Deleting Holiday!!` };
  }
};
export const fetchSeatAvailabilityFromCurrentDate = async (roomId, shiftId) => {
  try {
    const response = await api.post(`/planing/getFromCurrentDate`, {
      roomId,
      shiftId,
    });
    if (response.status === 200) {
      return response.data;
    } else {
      console.warn("Unexpected response status:", response.status);
      return [];
    }
  } catch (error) {
    console.log(`Error Fetching Seat Availability`, error);
    throw (
      error.response?.data || { message: `Error Fetching Seat Availability` }
    );
  }
};
export const getPlaningAndSchedulingModel = async () => {
  try {
    const response = await api.get(`/planing/getPlaningAndSchedulingModel`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Seat Availability`, error);
    throw (
      error.response?.data || { message: `Error Fetching Seat Availability` }
    );
  }
};
export const createProcessLogs = async (formData) => {
  try {
    const response = await api.post(`/process/log/create`, formData);
    return response?.data;
  } catch (error) {
    console.log(`Error Creating Planing!!`, error);
    throw error.response?.data || { message: `Error Creating Planing!!` };
  }
};
export const getLogsByProcessID = async (id) => {
  try {
    let response = await api.get(`/process/logs/getLogsByProcessID/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Process`, error);
    throw error.response?.data || { message: `Error Deleting Process!!` };
  }
};
export const createAssignedOperatorsToPlan = async (formData) => {
  try {
    let response = await api.post(`/assignPlanToOperator/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error creating assigned operators to Plan`, error);
    throw (
      error.response?.data || {
        message: "Error Creating Assign Operator to Plan !",
      }
    );
  }
};
export const getTaskByUserId = async (id) => {
  try {
    let response = await api.get(`/assignPlanToOperator/view/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Task By ID`, error);
    throw error?.response?.data || { message: `Error Retriving Task By ID` };
  }
};
export const fetchJigsById = async (id) => {
  try {
    let response = await api.get(`/fetchJigsById/${id}`);
    return response?.data;
  } catch (error) {
    console.log(`Error Fetching Jigs By ID`, error);
    throw error?.response?.data || { message: `Error Fetching Jigs By ID` };
  }
};
export const fetchJigByJigId = async (id) => {
  try {
    let response = await api.get(`/fetchJigByJigId/${id}`);
    return response?.data;
  } catch (error) {
    throw error?.response?.data || { message: `Error Fetching Jig By ID` };
  }
}
export const createDevice = async (formData) => {
  try {
    let response = await api.post(`/devices/create`, formData);
    return response.data;
  } catch (error) {
    console.log("error Creating Device", error);
    throw error.response?.data || { message: "Error Creating Device" };
  }
};
export const createIMEI = async (formData) => {
  try {
    let response = await api.post(`/devices/createIMEI`, formData);
    return response.data;
  } catch (error) {
    console.log("error Creating Imei", error);
    throw error.response?.data || { message: "Error Creating Imei" };
  }
};
export const viewIMEI = async () => {
  try {
    let response = await api.get(`/devices/viewIMEI`);
    return response.data;
  } catch (error) {
    console.log("error Fetching Imei", error);
    throw error.response?.data || { message: "Error Fetching Imei" };
  }
};
export const getDeviceByProductId = async (id) => {
  try {
    let response = await api.get(`/devices/devicesByProductID/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Devices`, error);
    throw error?.response?.data || { message: `Error Fetching Devices` };
  }
};
export const createDeviceTestEntry = async (data) => {
  try {
    let response = await api.post(`/deviceRecord/create`, data);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Device Test Entry`, error);
    throw (
      error?.response?.data || { message: `Error Creating Device Test Entry` }
    );
  }
};
export const getOverallDeviceTestEntry = async (id) => {
  try {
    let response = await api.get(`/getOverallDeviceTestEntry`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Get Device Test Entry`, error);
    throw (
      error?.response?.data || {
        message: `Error Fetching Get Device Test Entry`,
      }
    );
  }
};
export const getDeviceTestEntryByOperatorId = async (id, date) => {
  try {
    let url = `/getDeviceTestEntryByOperatorId/${id}`;
    if (date) {
      url += `?date=${date}`;
    }
    let response = await api.get(url);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Get Device Test Entry By Operator ID`, error);
    throw (
      error?.response?.data || {
        message: `Error Fetching Get Device Test Entry By Operator ID`,
      }
    );
  }
};
export const getDeviceTestByDeviceId = async (id) => {
  try {
    let response = await api.get(`/deviceTestHistoryByDeviceId/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Get Device Test By Device ID`, error);
    throw (
      error?.response?.data || {
        message: `Error Fetching Get Device Test By DeviceID`,
      }
    );
  }
};
export const updateStageByDeviceId = async (id, formData) => {
  try {
    let response = await api.patch(`/updateStageByDeviceId/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Updating Device status`, error);
    throw error?.response?.data || { message: `Error Updating Device status` };
  }
};
export const updateStageBySerialNo = async (id, formData) => {
  try {
    let response = await api.patch(`/updateStageBySerialNo/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Updating Device status`, error);
    throw error?.response?.data || { message: `Error Updating Device status` };
  }
}
export const markDeviceAsResolved = async (data) => {
  try {
    const response = await api.post(`/devices/markAsResolved`, data);
    return response.data;
  } catch (error) {
    console.log(`Error Marking Device As Resolved`, error);
    throw error?.response?.data || { message: `Error Marking Device As Resolved` };
  }
}
export const createReport = async (formData) => {
  try {
    let response = await api.post(`/createReport`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Report`, error);
    throw error?.response?.data || { message: `Error Updating Device status` };
  }
};
export const getOverallProgressByOperatorId = async (data) => {
  try {
    let response = await api.get(
      `/getOverallProgressByOperatorId/${data.id}/${data.user_id}`,
    );
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Overall Progress By Operator ID`, error);
    throw (
      error?.response?.data || {
        message: `Error Fetching Overall Progress By Operator ID`,
      }
    );
  }
};
export const createStickerField = async (formData) => {
  try {
    let response = await api.post(`/sticker/fields/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Sticker Field`, error);
    throw error?.response?.data || { message: `Error Creating Sticker Field` };
  }
};
export const getStickerFields = async () => {
  try {
    const response = await api.get("/sticker/fields/get");
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Sticker Field`, error);
    throw error?.response?.data || { message: `Error Fetching Sticker Field` };
  }
};
export const deleteStickerField = async (id) => {
  try {
    const response = await api.delete(`/sticker/fields/delete/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Sticker Field`, error);
    throw error?.response?.data || { message: `Error Fetching Sticker Field` };
  }
};
export const deleteStickerFieldMultiple = async (ids) => {
  try {
    const response = await api.post(`/sticker/fields/delete/multiple`, {
      deleteIds: ids,
    });
    return response.data;
  } catch (error) {
    console.log(`Error Deleting Sticker Fields`, error);
    throw (
      error.response?.data || { message: `Error Deleting Sticker Fields!!` }
    );
  }
};
export const fetchList = async (
  endpoint,
  errorMessage = "Error Fetching Data",
) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(errorMessage, error);
    throw error?.response?.data || { message: errorMessage };
  }
};
export const updateInventoryById = async (id, formData) => {
  try {
    let response = await api.put(`/inventory/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Updating Inventory`, error);
    throw error?.response?.data || { message: `Error Updating Inventory` };
  }
};
export const getProcessByProductID = async (id) => {
  try {
    let response = await api.get(`/inventory/getProcessByProduct/${id}`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Process By Product ID`, error);
    throw (
      error?.response?.data || { message: `Error Fetching Process By Product` }
    );
  }
};
export const updateIssueKit = async (formData) => {
  try {
    let response = await api.put(`/inventory/process/updateIssueKit`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Updating Issueed Kit`, error);
    throw error?.response?.data || { message: `Error Updating Issueed Kit` };
  }
};
export const updateIssueCarton = async (formData) => {
  try {
    let response = await api.put(
      `/inventory/process/updateIssueCarton`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log(`Error Updating Issueed Kit`, error);
    throw error?.response?.data || { message: `Error Updating Issueed Kit` };
  }
};
export const addUserRole = async (formData) => {
  try {
    let response = await api.post(`/user-roles/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Adding User Role`, error);
  }
};
export const updateProductionStatus = async (formData) => {
  try {
    let response = await api.put(
      `/production-manager/process/updateProductionStatus`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log(`Error Updating Production Status`, error);
  }
};
export const updateOperatorSkillSet = async (formData, id) => {
  try {
    let response = await api.put(
      `/operator/updateOperatorSkillSet/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log(`Error Updating Operator Skill Set`, error);
  }
};
export const createOperatorSkill = async (formData) => {
  try {
    let response = await api.post(`/skill-management/create`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Creating Skill`, error);
  }
};
export const getOperatorSkills = async () => {
  try {
    let response = await api.get(`/skill-management/get`);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching skills`, error);
  }
};
export const updateQuantity = async (formData, id) => {
  try {
    let response = await api.put(`/process/updateQuantity/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Updating Quantity`, error);
  }
};
export const updateMarkAsComplete = async (formData, id) => {
  try {
    let response = await api.put(
      `/process/updateMarkAsCompleted/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log("error Updating Process Status", error.message);
  }
};
export const updateKitsEntry = async (formData, id) => {
  try {
    let response = await api.put(`/store/updateKitsStatus/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log("error Updatign Kits Entry", error.message);
  }
};
export const createProcessKits = async (data) => {
  try {
    let response = await api.post(`/production/returnKitsToStore`, data);
    return response.data;
  } catch (error) {
    console.log("Error Creating Process Kits", error.message);
  }
};
export const createAssignedJigs = async (formData) => {
  try {
    let response = await api.post("/planing/createAssignedJigs", formData);
    return response.data;
  } catch (error) {
    console.log("Error Creating Assigned Jigs", error.message);
  }
};
export const getUpdateStatus = async (id, data) => {
  try {
    let response = await api.put(`/operator/updateStatus/${id}`, data);
    return response.data;
  } catch (error) {
    console.log("Error Fetching Update Status", error.message);
  }
};
export const updateJigStatus = async (id, data) => {
  try {
    let response = await api.put(`/jig/updateStatus/${id}`, data);
    return response.data;
  } catch (error) {
    console.log("Error Updating Jig Status", error.message);
  }
};
export const updateIssuedKitsToLine = async (formData) => {
  try {
    let response = await api.put(`/process/updateIssueKitsToLine`, formData);
    return response.data;
  } catch (error) {
    console.log("Error Updating Issued Kits to Line", error.message);
  }
};
export const updateStatusRecivedKitToLine = async (id, formData) => {
  try {
    let response = await api.put(
      `/process/updateStatusRecivedKit/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log("Error Updating Reciving kit to Line :", error.message);
  }
};
export const getDeviceTestRecordsByProcessId = async (id) => {
  try {
    let response = await api.get(
      `/process/getDeviceTestRecordsByProcessId/${id}`,
    );
    return response.data;
  } catch (error) {
    console.log(
      "Error Fetching Device Test Records By Plan Id :",
      error.message,
    );
  }
};
export const getOrderConfirmationNumers = async () => {
  try {
    let reponse = await api.get("/process/orderConfirmation/get");
    return reponse.data;
  } catch (error) {
    console.log(`Error Fetching Order Confirmation Numbers :`, error.message);
  }
};
export const createOrderConfirmationNumbers = async (formData) => {
  try {
    let response = await api.post(
      "/process/orderConfirmation/create",
      formData,
    );
    return response.data;
  } catch (error) {
    console.log("Error Creating Confirmation Number", error.message);
  }
};
export const updateDownTimeProcess = async (id, formData) => {
  try {
    let response = await api.put(`/process/addDownTime/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log("Error Updating Down Time Process", error.message);
  }
};
export const updateProcessStatus = async (id, formData) => {
  try {
    let response = await api.put(
      `/process/updateProcessStatus/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    console.log("Error Updating Process Status", error.message);
  }
};
export const getPlanningAndSchedulingDate = async (
  selectedFilterStartDate,
  selectedFilterEndDate,
) => {
  try {
    let response;
    if (
      selectedFilterStartDate == undefined &&
      selectedFilterEndDate == undefined
    ) {
      response = await api.get("/process/getPlaningAndSchedulingDateWise/get");
    } else {
      response = await api.get(
        `/process/getPlaningAndSchedulingDateWise/get?startDate=${selectedFilterStartDate}&endDate=${selectedFilterEndDate}`,
      );
    }
    return response.data;
  } catch (error) {
    console.log("Error Fetching Scheduling : ", error.message);
  }
};
export const getLastEntryBasedUponPrefixAndSuffix = async (prefix, suffix) => {
  try {
    let response = await api.get(
      `/device/getLastEntryBasedOnPrefixAndSuffix?prefix=${prefix}&suffix=${suffix}`,
    );
    return response.data;
  } catch (error) {
    console.log("Error Fetching Last Entry Based on Prefix : ", error.message);
  }
};
export const createCarton = async (formData) => {
  try {
    let response = await api.post(`/carton/createCarton`, formData);
    return response.data;
  } catch (error) {
    console.log("Error Creating Carton  : ", error.message);
  }
};
export const fetchCartonByProcessID = async (processID) => {
  try {
    let response = await api.get(`/cartons/${processID}/partial`);
    return response.data;
  } catch (error) {
    console.log("Error Fetching Carton By Process ID :", error.message);
  }
};
export const fetchCartons = async (processID) => {
  try {
    let response = await api.get(`/cartons/${processID}`);
    console.log("response ===>", response);
    return response.data;
  } catch (error) {
    console.log("Error Fetxhing Cartons :", error.message);
  }
};
export const shiftToPDI = async (formData) => {
  try {
    let response = await api.post(`cartons/shift-to-pdi`, formData);
    return response.data;
  } catch (error) {
    console.log("Error Carton Shift To PDI :", error.message);
  }
};
export const shiftToNextCommonStage = async (processId, formData) => {
  try {
    let response = await api.post(`/cartons/${processId}/shift`, formData);
    return response.data;
  } catch (error) {
    console.log("Error Carton Shift To Common Stage :", error.message);
  }
};

export const keepCartonInStore = async (processId, formData) => {
  try {
    let response = await api.post(`/cartons/${processId}/keep-in-store`, formData);
    return response.data;
  } catch (error) {
    console.log("Error Keeping Carton In Store :", error.message);
    throw error;
  }
};
export const getFGInventoryToShift = async () => {
  try {
    let result = await api.get(`/process/getFGInventory`);
    return result.data;
  } catch (error) {
    console.error("Error Fetching FG Inventory", error.message);
  }
};
export const getPDICartonByProcessId = async (processId) => {
  try {
    let result = await api.get(`/cartonsProcessId/${processId}`);
    return result.data;
  } catch (error) {
    console.error("Error Fetching Carton Shift: ", error.message);
  }
};
export const getCartonsIntoStore = async (processId) => {
  try {
    let result = await api.get(`/cartonsIntoStore/${processId}`);
    return result.data;
  } catch (error) {
    console.error("Error Fetching Carton Shift: ", error.message);
  }
};

export const authenticateJig = async (jigId) => {
  try {
    const response = await api.post("/jig/authenticate", { jigId });
    return response.data;
  } catch (error) {
    console.error("Jig authentication failed:", error);
    throw error;
  }
};

export const syncJigData = async (data) => {
  try {
    const response = await api.post("/jig/data", data);
    return response.data;
  } catch (error) {
    console.error("Failed to sync jig data:", error);
    throw error;
  }
};

export default api;
