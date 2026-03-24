const decodeToken = (token) => {
  if (!token) return null;
  if (typeof window === "undefined") return null;

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
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return false;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    return false;
  }

  const currentTime = Date.now() / 1000;

  if (decoded.exp < currentTime) {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    return false;
  }

  return true;
};
