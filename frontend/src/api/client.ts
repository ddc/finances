import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't redirect on auth check — App.tsx handles that
      if (!url.includes("/auth/me")) {
        localStorage.removeItem("user");
        globalThis.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
