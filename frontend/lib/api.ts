import axios from "axios";

// =========================================================
// CENTRAL API CLIENT
// =========================================================

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://medqueue-pro-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// =========================================================
// JWT AUTHENTICATION
// =========================================================

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mqp_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// AUTH
// =========================================================

export const registerPatient = (data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) => api.post("/auth/register", data);

export const login = (data: {
  email: string;
  password: string;
}) => api.post("/auth/login", data);

export const getMe = () => api.get("/auth/me");

// =========================================================
// DEPARTMENTS & DOCTORS
// =========================================================

export const fetchDepartments = () =>
  api.get("/departments");

export const fetchDoctors = (params?: {
  department?: string;
  status?: string;
}) =>
  api.get("/doctors", {
    params,
  });

// =========================================================
// APPOINTMENTS
// =========================================================

export const bookAppointment = (data: {
  doctorId: number;
  departmentId: number;
  date: string;
  time: string;
  reason?: string;
}) =>
  api.post("/appointments", data);

export const fetchMyAppointments = () =>
  api.get("/appointments/me");

export const fetchDoctorAppointments = (
  doctorId: number,
  date?: string
) =>
  api.get(`/appointments/doctor/${doctorId}`, {
    params: date ? { date } : undefined,
  });

export const updateAppointmentStatus = (
  id: number,
  status:
    | "pending"
    | "confirmed"
    | "in_session"
    | "completed"
    | "cancelled"
    | "missed"
) =>
  api.patch(`/appointments/${id}/status`, {
    status,
  });

export const cancelAppointment = (id: number) =>
  api.patch(`/appointments/${id}/cancel`);

export const rescheduleAppointment = (
  id: number,
  data: {
    date: string;
    time: string;
  }
) =>
  api.patch(`/appointments/${id}/reschedule`, data);

// =========================================================
// QUEUE
// =========================================================

export const fetchDepartmentQueue = (
  departmentId: number
) =>
  api.get(`/queue/${departmentId}`);

export const fetchQueuePosition = (
  appointmentId: number
) =>
  api.get(
    `/queue/appointment/${appointmentId}/position`
  );

// =========================================================
// ADMIN
// =========================================================

export const fetchAdminStats = () =>
  api.get("/admin/stats");

export const fetchAllPatients = () =>
  api.get("/admin/patients");
