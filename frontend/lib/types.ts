export interface Department {
  name: string;
  code: string;
  blurb: string;
  color: string;
}

export interface Doctor {
  id: number;
  name: string;
  dept: string;
  rating: number;
  years: number;
  patients: number;
  status: "Available" | "In Session" | "Off Duty";
  img: string;
}

export interface BookingForm {
  name: string;
  email: string;
  phone: string;
  dept: string;
  doctor: string;
  date: string;
  time: string;
  reason: string;
}

export interface QueueTicketData {
  num: string;
  name: string;
  dept: string;
  doctor: string;
  date: string;
  time: string;
}
