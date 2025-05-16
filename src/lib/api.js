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
    const response = await api.post(`/product/delete/multiple`,{deleteIds:ids});
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
export default api;
