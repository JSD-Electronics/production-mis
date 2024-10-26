import axios from "axios";
const api = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
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
export const updateProcess = async (formData,id)=>{
  try {
    const response = await api.put(`/process/update/${id}`, formData);
    return response.data;
  } catch (error) {
    console.log(`Error Fetching Process`, error);
    throw error.response?.data || { message: `Error Fetching Process!!` };
  }
}
export default api;
