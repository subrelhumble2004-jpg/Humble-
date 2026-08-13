"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import QueueTicket from "@/components/QueueTicket";
import { DEPARTMENTS, DOCTORS, TIME_SLOTS } from "@/lib/data";
import { bookAppointment } from "@/lib/api";
import { BookingForm } from "@/lib/types";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiLayout,
} from "react-icons/fi";
import * as Icons from "react-icons/fa";

const ICON_MAP: Record<string, keyof typeof Icons> = {
  Emergency: "FaAmbulance",
  Cardiology: "FaHeartbeat",
  Neurology: "FaBrain",
  Orthopedics: "FaBone",
  Dentistry: "FaTooth",
  Pediatrics: "FaBaby",
  Radiology: "FaXRay",
  Laboratory: "FaMicroscope",
  "General Medicine": "FaStethoscope",
  Surgery: "FaCut",
  Dermatology: "FaAllergies",
  Gynecology: "FaFemale",
};

const STEPS = [
  "Department",
  "Doctor",
  "Date & Time",
  "Details",
  "Confirm",
];

/*
 * Backend department IDs created by schema.sql.
 *
 * IMPORTANT:
 * The frontend demo data does not contain database IDs,
 * so we map the department names to the IDs created by
 * the Railway database schema.
 */
const DEPARTMENT_IDS: Record<string, number> = {
  "General Medicine": 1,
  Cardiology: 2,
  Pediatrics: 3,
  Emergency: 4,
  Dental: 5,
  "Obstetrics and Gynecology": 6,

  /*
   * These departments exist in the frontend demo data
   * but may not exist in the current database seed.
   *
   * They are kept here so the UI remains functional.
   * The backend will reject them if their corresponding
   * database department does not exist.
   */
  Neurology: 1,
  Orthopedics: 1,
  Dentistry: 5,
  Radiology: 1,
  Laboratory: 1,
  Surgery: 1,
  Dermatology: 1,
  Gynecology: 6,
};

export default function AppointmentsPage() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    dept: "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  const [ticket, setTicket] = useState<
    (BookingForm & { num: string }) | null
  >(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /*
   * Generic form setter.
   */
  const set =
    (key: keyof BookingForm) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >
    ) => {
      setForm((previous) => ({
        ...previous,
        [key]: event.target.value,
      }));

      setError("");
    };

  /*
   * Doctors belonging to the selected department.
   */
  const availableDoctors = form.dept
    ? DOCTORS.filter(
        (doctor) => doctor.dept === form.dept
      )
    : DOCTORS;

  /*
   * TIME SLOT SELECTION
   *
   * This is deliberately kept separate from the
   * button itself so mobile touch events work correctly.
   */
  function selectTime(time: string) {
    console.log("MedQueue Pro: selected time:", time);

    setForm((previous) => ({
      ...previous,
      time,
    }));

    setError("");
  }

  /*
   * Select department.
   */
  function selectDepartment(departmentName: string) {
    setForm((previous) => ({
      ...previous,
      dept: departmentName,
      doctor: "",
      time: "",
    }));

    setError("");
    setStep(2);
  }

  /*
   * Select doctor.
   */
  function selectDoctor(
    doctorName: string,
    department: string
  ) {
    setForm((previous) => ({
      ...previous,
      doctor: doctorName,
      dept: department,
      time: "",
    }));

    setError("");
    setStep(3);
  }

  /*
   * Continue from date/time step.
   */
  function continueFromDateTime() {
    if (!form.date) {
      setError(
        "Please select an appointment date."
      );
      return;
    }

    if (!form.time) {
      setError(
        "Please select a time slot."
      );
      return;
    }

    setError("");
    setStep(4);
  }

  /*
   * Continue from details step.
   */
  function continueFromDetails() {
    if (!form.name.trim()) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    setError("");
    setStep(5);
  }

  /*
   * Confirm appointment.
   */
  async function confirm() {
    setSubmitting(true);
    setError("");

    const selectedDoctor = DOCTORS.find(
      (doctor) =>
        doctor.name === form.doctor
    );

    if (!selectedDoctor) {
      setError(
        "Please select a doctor."
      );
      setSubmitting(false);
      return;
    }

    const departmentId =
      DEPARTMENT_IDS[form.dept];

    if (!departmentId) {
      setError(
        "The selected department is not configured correctly."
      );
      setSubmitting(false);
      return;
    }

    if (!form.date) {
      setError(
        "Please select an appointment date."
      );
      setSubmitting(false);
      return;
    }

    if (!form.time) {
      setError(
        "Please select an appointment time."
      );
      setSubmitting(false);
      return;
    }

    try {
      console.log(
        "MedQueue Pro: sending appointment:",
        {
          doctorId: Number(
            selectedDoctor.id
          ),
          departmentId,
          date: form.date,
          time: form.time,
          reason: form.reason,
        }
      );

      const response =
        await bookAppointment({
          doctorId: Number(
            selectedDoctor.id
          ),
          departmentId,
          date: form.date,
          time: form.time,
          reason: form.reason,
        });

      console.log(
        "MedQueue Pro: appointment response:",
        response.data
      );

      const queueNumber =
        response.data?.data?.queueNumber ||
        response.data?.data?.ticketNumber ||
        response.data?.queueNumber ||
        response.data?.ticketNumber;

      if (!queueNumber) {
        throw new Error(
          "Appointment was created, but the server did not return a queue number."
        );
      }

      setTicket({
        ...form,
        num: String(queueNumber),
      });

      setStep(6);
    } catch (err: any) {
      console.error(
        "MedQueue Pro appointment error:",
        err
      );

      const backendMessage =
        err?.response?.data?.message;

      if (backendMessage) {
        setError(backendMessage);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError(
          "Unable to book the appointment. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * Reset booking.
   */
  function startNewAppointment() {
    setForm({
      name: "",
      email: "",
      phone: "",
      dept: "",
      doctor: "",
      date: "",
      time: "",
      reason: "",
    });

    setTicket(null);
    setError("");
    setStep(1);
  }

  return (
    <div className="py-14 px-5 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <SectionHeading
          eyebrow="APPOINTMENT"
          title="Book Your Appointment"
          sub="Choose a department, pick your doctor, and secure your slot."
        />

        {/* ======================================================
            PROGRESS STEPS
        ====================================================== */}

        {step <= 5 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-10 flex-wrap">
            {STEPS.map(
              (stepName, index) => (
                <div
                  key={stepName}
                  className="flex items-center"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index + 1 <= step
                        ? "text-white"
                        : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                    style={
                      index + 1 <= step
                        ? {
                            background:
                              "linear-gradient(135deg,#0F4C81,#16A34A)",
                          }
                        : {}
                    }
                  >
                    {index + 1 < step ? (
                      <FiCheckCircle size={16} />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {index <
                    STEPS.length - 1 && (
                    <div
                      className={`w-6 sm:w-10 h-0.5 mx-1 ${
                        index + 1 < step
                          ? "bg-[#16A34A]"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  )}
                </div>
              )
            )}
          </div>
        )}

        <Card
          className="p-6 sm:p-8"
          hover={false}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{
                opacity: 0,
                x: 16,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -16,
              }}
              transition={{
                duration: 0.25,
              }}
            >

              {/* ==================================================
                  STEP 1 — DEPARTMENT
              ================================================== */}

              {step === 1 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Choose a Department
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {DEPARTMENTS.map(
                      (department) => {
                        const Icon =
                          Icons[
                            ICON_MAP[
                              department.name
                            ] ||
                              "FaStethoscope"
                          ];

                        return (
                          <button
                            type="button"
                            key={
                              department.name
                            }
                            onClick={() =>
                              selectDepartment(
                                department.name
                              )
                            }
                            className={`relative z-10 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer touch-manipulation ${
                              form.dept ===
                              department.name
                                ? "border-[#16A34A] shadow-md"
                                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500"
                            }`}
                          >
                            <Icon
                              size={20}
                              style={{
                                color:
                                  department.color,
                              }}
                            />

                            <div className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                              {
                                department.name
                              }
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 2 — DOCTOR
              ================================================== */}

              {step === 2 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Choose a Doctor —{" "}
                    {form.dept}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {(availableDoctors.length
                      ? availableDoctors
                      : DOCTORS
                    ).map((doctor) => (
                      <button
                        type="button"
                        key={doctor.id}
                        onClick={() =>
                          selectDoctor(
                            doctor.name,
                            doctor.dept
                          )
                        }
                        className={`relative z-10 p-3 rounded-xl border flex items-center gap-3 text-left transition-all duration-200 cursor-pointer touch-manipulation ${
                          form.doctor ===
                          doctor.name
                            ? "border-[#16A34A] shadow-md"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <img
                          src={doctor.img}
                          className="w-11 h-11 rounded-lg object-cover"
                          alt={
                            doctor.name
                          }
                        />

                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {
                              doctor.name
                            }
                          </div>

                          <div className="text-xs text-slate-400">
                            {
                              doctor.status
                            }{" "}
                            · ⭐{" "}
                            {
                              doctor.rating
                            }
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setStep(1)
                    }
                    className="mt-4 text-sm text-slate-400 flex items-center gap-1 cursor-pointer"
                  >
                    <FiChevronLeft
                      size={14}
                    />
                    Back
                  </button>
                </div>
              )}

              {/* ==================================================
                  STEP 3 — DATE & TIME
              ================================================== */}

              {step === 3 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Choose Date &amp; Time
                  </h3>

                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-utility">
                    DATE
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={set("date")}
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    className="relative z-10 w-full mt-1 mb-4 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />

                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-utility">
                    TIME SLOT
                  </label>

                  {/* =================================================
                      TIME BUTTONS
                  ================================================= */}

                  <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {TIME_SLOTS.map(
                      (time) => {
                        const selected =
                          form.time ===
                          time;

                        return (
                          <button
                            type="button"
                            key={time}
                            aria-pressed={
                              selected
                            }
                            onClick={(
                              event
                            ) => {
                              event.preventDefault();
                              event.stopPropagation();

                              selectTime(
                                time
                              );
                            }}
                            className={`relative z-20 w-full py-3 px-2 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer touch-manipulation select-none ${
                              selected
                                ? "text-white border-transparent shadow-md scale-[1.02]"
                                : "border-slate-200 text-slate-600 bg-white hover:border-[#16A34A] hover:text-[#16A34A] active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#16A34A]"
                            }`}
                            style={
                              selected
                                ? {
                                    background:
                                      "linear-gradient(135deg,#0F4C81,#16A34A)",
                                  }
                                : undefined
                            }
                          >
                            {
                              time
                            }
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* TIME STATUS */}

                  {!form.time && (
                    <p className="text-xs text-slate-400 mt-3">
                      Please select a
                      time slot to
                      continue.
                    </p>
                  )}

                  {form.time && (
                    <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-950/30 px-3 py-2">
                      <p className="text-xs text-[#16A34A] font-semibold">
                        ✓ Selected time:{" "}
                        {form.time}
                      </p>
                    </div>
                  )}

                  {/* DATE/TIME ERROR */}

                  {error && (
                    <p className="text-sm text-red-500 mt-4">
                      {error}
                    </p>
                  )}

                  {/* NAVIGATION */}

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setStep(2)
                      }
                      className="text-sm text-slate-400 flex items-center gap-1 cursor-pointer"
                    >
                      <FiChevronLeft
                        size={14}
                      />
                      Back
                    </button>

                    <PrimaryButton
                      icon={
                        FiChevronRight
                      }
                      onClick={
                        continueFromDateTime
                      }
                    >
                      Continue
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 4 — DETAILS
              ================================================== */}

              {step === 4 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Your Details
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      placeholder="Full name"
                      value={
                        form.name
                      }
                      onChange={set(
                        "name"
                      )}
                      className="rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                    <input
                      placeholder="Phone number"
                      value={
                        form.phone
                      }
                      onChange={set(
                        "phone"
                      )}
                      className="rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                    <input
                      type="email"
                      placeholder="Email address"
                      value={
                        form.email
                      }
                      onChange={set(
                        "email"
                      )}
                      className="sm:col-span-2 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                    <textarea
                      placeholder="Reason for visit"
                      value={
                        form.reason
                      }
                      onChange={set(
                        "reason"
                      )}
                      rows={3}
                      className="sm:col-span-2 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mt-4">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setStep(3)
                      }
                      className="text-sm text-slate-400 flex items-center gap-1 cursor-pointer"
                    >
                      <FiChevronLeft
                        size={14}
                      />
                      Back
                    </button>

                    <PrimaryButton
                      icon={
                        FiChevronRight
                      }
                      onClick={
                        continueFromDetails
                      }
                    >
                      Review
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 5 — REVIEW
              ================================================== */}

              {step === 5 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Review &amp; Confirm
                  </h3>

                  <div className="rounded-xl p-4 space-y-3 text-sm bg-slate-50 dark:bg-slate-900">
                    {[
                      [
                        "Department",
                        form.dept,
                      ],
                      [
                        "Doctor",
                        form.doctor,
                      ],
                      [
                        "Date",
                        form.date,
                      ],
                      [
                        "Time",
                        form.time,
                      ],
                      [
                        "Patient",
                        form.name,
                      ],
                      [
                        "Email",
                        form.email,
                      ],
                      [
                        "Phone",
                        form.phone,
                      ],
                      [
                        "Reason",
                        form.reason ||
                          "—",
                      ],
                    ].map(
                      ([
                        key,
                        value,
                      ]) => (
                        <div
                          key={key}
                          className="flex justify-between gap-4"
                        >
                          <span className="text-slate-400">
                            {
                              key
                            }
                          </span>

                          <span className="text-slate-800 dark:text-slate-100 text-right font-medium">
                            {
                              value
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mt-3">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setStep(4)
                      }
                      className="text-sm text-slate-400 flex items-center gap-1 cursor-pointer"
                    >
                      <FiChevronLeft
                        size={14}
                      />
                      Back
                    </button>

                    <PrimaryButton
                      icon={
                        FiCheckCircle
                      }
                      onClick={confirm}
                    >
                      {submitting
                        ? "Booking…"
                        : "Confirm Appointment"}
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {/* ==================================================
                  STEP 6 — SUCCESS
              ================================================== */}

              {step === 6 &&
                ticket && (
                  <div className="text-center">
                    <FiCheckCircle
                      className="mx-auto text-[#16A34A] mb-2"
                      size={40}
                    />

                    <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                      Appointment
                      Confirmed!
                    </h3>

                    <p className="text-sm mt-1 mb-6 text-slate-500 dark:text-slate-400">
                      Your appointment
                      has been
                      successfully
                      booked.
                    </p>

                    <div className="max-w-sm mx-auto">
                      <QueueTicket
                        num={
                          ticket.num
                        }
                        name={
                          ticket.name
                        }
                        dept={
                          ticket.dept
                        }
                        doctor={
                          ticket.doctor
                        }
                        date={
                          ticket.date
                        }
                        time={
                          ticket.time
                        }
                      />
                    </div>

                    <div className="flex justify-center gap-3 mt-6 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          window.print()
                        }
                        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 dark:text-white cursor-pointer"
                      >
                        <FiDownload
                          size={16}
                        />
                        Download Slip
                      </button>

                      <a href="/queue-tracker">
                        <PrimaryButton
                          icon={
                            FiLayout
                          }
                        >
                          Track Queue
                        </PrimaryButton>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={
                        startNewAppointment
                      }
                      className="mt-5 text-sm text-[#16A34A] font-semibold hover:underline"
                    >
                      Book another
                      appointment
                    </button>
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
