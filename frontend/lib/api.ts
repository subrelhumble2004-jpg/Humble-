import axios from "axios";
// =========================================================
// MEDQUEUE PRO — CENTRAL API CLIENT
// =========================================================
// IMPORTANT:
// The production Render backend is used directly.
// This avoids Vercel environment-variable problems.
const API_BASE_URL =
  "https://medqueue-pro-backend.onrender.com/api";
export const api = axios.create({
  baseURL: API_BASE_URL,
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
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// =========================================================
// AUTHENTICATION
// =========================================================
// REGISTER PATIENT
export const registerPatient = (data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) => {
  return api.post("/auth/register", data);
};
// LOGIN
export const login = (data: {
  email: string;
  password: string;
}) => {
  return api.post("/auth/login", data);
};
// GET CURRENT USER
export const getMe = () => {
  return api.get("/auth/me");
};
// REFRESH TOKEN
export const refreshToken = (refreshToken: string) => {
  return api.post("/auth/refresh", {
    refreshToken,
  });
};
// =========================================================
// DEPARTMENTS
// =========================================================
// GET ALL DEPARTMENTS
export const fetchDepartments = () => {
  return api.get("/departments");
};
// =========================================================
// DOCTORS
// =========================================================
// GET DOCTORS
export const fetchDoctors = (params?: {
  department?: string;
  status?: string;
}) => {
  return api.get("/doctors", {
    params,
  });
};
// =========================================================
// APPOINTMENTS
// =========================================================
// BOOK APPOINTMENT
export const bookAppointment = (data: {
  doctorId: number;
  departmentId: number;
  date: string;
  time: string;
  reason?: string;
}) => {
  return api.post("/appointments", data);
};
// GET MY APPOINTMENTS
export const fetchMyAppointments = () => {
  return api.get("/appointments/me");
};
// GET DOCTOR APPOINTMENTS
export const fetchDoctorAppointments = (
  doctorId: number,
  date?: string
) => {
  return api.get(
    `/appointments/doctor/${doctorId}`,
    {
      params: date
        ? {
            date,
          }
        : undefined,
    }
  );
};
// UPDATE APPOINTMENT STATUS
export const updateAppointmentStatus = (
  id: number,
  status:
    | "pending"
    | "confirmed"
    | "in_session"
    | "completed"
    | "cancelled"
    | "missed"
) => {
  return api.patch(
    `/appointments/${id}/status`,
    {
      status,
    }
  );
};
// CANCEL APPOINTMENT
export const cancelAppointment = (
  id: number
) => {
  return api.patch(
    `/appointments/${id}/cancel`
  );
};
// RESCHEDULE APPOINTMENT
export const rescheduleAppointment = (
  id: number,
  data: {
    date: string;
    time: string;
  }
) => {
  return api.patch(
    `/appointments/${id}/reschedule`,
    data
  );
};
// =========================================================
// QUEUE
// =========================================================
// GET DEPARTMENT QUEUE
export const fetchDepartmentQueue = (
  departmentId: number
) => {
  return api.get(
    `/queue/${departmentId}`
  );
};
// GET QUEUE POSITION
export const fetchQueuePosition = (
  appointmentId: number
) => {
  return api.get(
    `/queue/appointment/${appointmentId}/position`
  );
};
// =========================================================
// ADMIN
// =========================================================
// GET ADMIN STATISTICS
export const fetchAdminStats = () => {
  return api.get("/admin/stats");
};
// GET ALL PATIENTS
export const fetchAllPatients = () => {
  return api.get("/admin/patients");
};
// =========================================================
// HEALTH CHECK
// =========================================================
export const checkBackendHealth = () => {
  return api.get("/health");
};
// =========================================================
// AXIOS RESPONSE INTERCEPTOR
// =========================================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response) {
      console.error(
        "MedQueue Pro API Error:",
        error.response.status,
        error.response.data
      );
    } else if (error?.request) {
      console.error(
        "MedQueue Pro API Error: No response received from server."
      );
    } else {
      console.error(
        "MedQueue Pro API Error:",
        error.message
      );
    }
    return Promise.reject(error);
  }
);
