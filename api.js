import axios from "axios";

const api = axios.create({ baseURL: "http://127.0.0.1:5000/api" });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("hr_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("hr_token");
      localStorage.removeItem("hr_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const loginHR    = (email, password)            => api.post("/auth/login",  { email, password });
export const signupHR   = (username, email, password)  => api.post("/auth/signup", { username, email, password });
export const analyzeResume = (data) => {
  if (data.resume_file) {
    const f = new FormData();
    f.append("file", data.resume_file);
    f.append("candidate_name", data.candidate_name || "");
    f.append("email", data.email || "");
    f.append("phone", data.phone || "");
    return api.post("/analyze-resume", f, { headers: { "Content-Type": "multipart/form-data" } });
  }
  return api.post("/analyze-resume", data);
};
export const getAnalyses    = () => api.get("/analyses");
export const getStatistics  = () => api.get("/fraud-statistics");
export default api;