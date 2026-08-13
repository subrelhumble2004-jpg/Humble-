import { Department, Doctor } from "./types";

// ============================================================
// MEDQUEUE PRO
// Static fallback/demo data
// ============================================================

// ============================================================
// DEPARTMENTS
// ============================================================

export const DEPARTMENTS: Department[] = [
  {
    name: "Emergency",
    code: "EMR",
    blurb: "24/7 critical & trauma care",
    color: "#DC2626",
  },

  {
    name: "Cardiology",
    code: "CARD",
    blurb: "Heart health & diagnostics",
    color: "#0F4C81",
  },

  {
    name: "Neurology",
    code: "NEURO",
    blurb: "Brain & nervous system",
    color: "#7C3AED",
  },

  {
    name: "Orthopedics",
    code: "ORTHO",
    blurb: "Bones, joints & mobility",
    color: "#B45309",
  },

  {
    name: "Dentistry",
    code: "DENT",
    blurb: "Oral & dental care",
    color: "#0EA5A0",
  },

  {
    name: "Pediatrics",
    code: "PEDS",
    blurb: "Child & infant health",
    color: "#DB2777",
  },

  {
    name: "Radiology",
    code: "RAD",
    blurb: "Imaging & scans",
    color: "#38BDF8",
  },

  {
    name: "Laboratory",
    code: "LAB",
    blurb: "Diagnostics & pathology",
    color: "#16A34A",
  },

  {
    name: "General Medicine",
    code: "GEN",
    blurb: "Primary & family care",
    color: "#0F4C81",
  },

  {
    name: "Surgery",
    code: "SURG",
    blurb: "Operative procedures",
    color: "#475569",
  },

  {
    name: "Dermatology",
    code: "DERM",
    blurb: "Skin, hair & nails",
    color: "#EA580C",
  },

  {
    name: "Gynecology",
    code: "GYNO",
    blurb: "Women's health",
    color: "#16A34A",
  },
];

// ============================================================
// DOCTORS
// ============================================================

export const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "FABIAN PRECIOUS AMARACHIM",
    dept: "Cardiology",
    rating: 4.9,
    years: 12,
    patients: 3400,
    status: "Available",
    img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
  },

  {
    id: 2,
    name: "Onu Miracle CHIDINMA",
    dept: "Neurology",
    rating: 4.8,
    years: 9,
    patients: 2100,
    status: "In Session",
    img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80",
  },

  {
    id: 3,
    name: "AKUBUEZE PASCHALINE CHIEMELIE",
    dept: "Pediatrics",
    rating: 5.0,
    years: 14,
    patients: 5200,
    status: "Available",
    img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
  },

  {
    id: 4,
    name: "NZENWATA DEBORAH AMARACHI",
    dept: "Orthopedics",
    rating: 4.7,
    years: 8,
    patients: 1800,
    status: "Available",
    img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80",
  },

  {
    id: 5,
    name: "Dr. Ifeoma Eze",
    dept: "Dermatology",
    rating: 4.9,
    years: 11,
    patients: 2900,
    status: "Off Duty",
    img: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80",
  },

  {
    id: 6,
    name: "Dr. Tunde Alabi",
    dept: "General Medicine",
    rating: 4.8,
    years: 15,
    patients: 6100,
    status: "Available",
    img: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80",
  },
];

// ============================================================
// TIME SLOTS
// ============================================================

export const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:30 PM",
  "02:00 PM",
  "03:00 PM",
  "04:30 PM",
];
