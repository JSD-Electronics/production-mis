const decodeToken = (token) => {
  if (!token) return null;

  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  try {
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
export const verifyTokenClientSide = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false; // No token, treat as not authenticated
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    return false; // Decoding failed
  }

  const currentTime = Date.now() / 1000;

  if (decoded.exp < currentTime) {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    return false; // Token expired
  }

  return true; // Token is valid
};
