import axios from "axios";

// Central Axios client wired to the Express + MySQL backend
// (see the /backend project — every function below maps 1:1 to a route there).

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mqp_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const registerPatient = (data: { fullName: string; email: string; phone?: string; password: string }) =>
  api.post("/auth/register", data);

export const login = (data: { email: string; password: string }) => api.post("/auth/login", data);

export const getMe = () => api.get("/auth/me");

// ---- Departments & Doctors ----
export const fetchDepartments = () => api.get("/departments");
export const fetchDoctors = (params?: { department?: string; status?: string }) => api.get("/doctors", { params });

// ---- Appointments ----
export const bookAppointment = (data: { doctorId: number; departmentId: number; date: string; time: string; reason?: string }) =>
  api.post("/appointments", data);
export const fetchMyAppointments = () => api.get("/appointments/me");
export const cancelAppointment = (id: number) => api.patch(`/appointments/${id}/cancel`);
export const rescheduleAppointment = (id: number, data: { date: string; time: string }) =>
  api.patch(`/appointments/${id}/reschedule`, data);

// ---- Queue ----
export const fetchDepartmentQueue = (departmentId: number) => api.get(`/queue/${departmentId}`);
export const fetchQueuePosition = (appointmentId: number) => api.get(`/queue/appointment/${appointmentId}/position`);

// ---- Admin ----
export const fetchAdminStats = () => api.get("/admin/stats");
export const fetchAllPatients = () => api.get("/admin/patients");
