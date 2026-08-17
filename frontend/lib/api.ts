import axios from "axios";

// Central Axios client wired to the Express + MySQL backend.
export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://humble-production.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the logged-in user's JWT token.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mqp_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// =========================================================
// AUTH
// =========================================================

export const registerPatient = (data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) =>
  api.post("/auth/register", data);

export const login = (data: {
  email: string;
  password: string;
}) =>
  api.post("/auth/login", data);

export const getMe = () =>
  api.get("/auth/me");

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

// Doctor: get appointments belonging to this doctor.
export const fetchDoctorAppointments = (
  doctorId: number,
  date?: string
) =>
  api.get(`/appointments/doctor/${doctorId}`, {
    params: date ? { date } : undefined,
  });

// Doctor/Admin: update appointment status.
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

export const fetchDepartmentQueue = (departmentId: number) =>
  api.get(`/queue/${departmentId}`);

export const fetchQueuePosition = (appointmentId: number) =>
  api.get(`/queue/appointment/${appointmentId}/position`);

// =========================================================
// ADMIN
// =========================================================

export const fetchAdminStats = () =>
  api.get("/admin/stats");

export const fetchAllPatients = () =>
  api.get("/admin/patients");
