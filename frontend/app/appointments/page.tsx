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
    };

  const availableDoctors = form.dept
    ? DOCTORS.filter((doctor) => doctor.dept === form.dept)
    : DOCTORS;

  function selectTime(time: string) {
    setForm((previous) => ({
      ...previous,
      time,
    }));
  }

  async function confirm() {
    setSubmitting(true);
    setError("");

    const selectedDoctor = DOCTORS.find(
      (doctor) => doctor.name === form.doctor
    );

    if (!selectedDoctor) {
      setError("Please select a doctor.");
      setSubmitting(false);
      return;
    }

    try {
      /*
       * IMPORTANT:
       * The backend needs the real doctor ID.
       *
       * We use the selected doctor's ID instead of
       * always sending doctorId = 1.
       */

      const department = DEPARTMENTS.find(
        (department) => department.name === form.dept
      );

      const response = await bookAppointment({
        doctorId: Number(selectedDoctor.id),
        departmentId: Number(department?.id ?? 1),
        date: form.date,
        time: form.time,
        reason: form.reason,
      });

      const queueNumber =
        response.data?.data?.queueNumber ||
        response.data?.data?.ticketNumber;

      if (!queueNumber) {
        throw new Error(
          "Appointment was not confirmed by the server."
        );
      }

      setTicket({
        ...form,
        num: queueNumber,
      });

      setStep(6);
    } catch (err: any) {
      console.error("Appointment booking error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to book the appointment. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-14 px-5 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <SectionHeading
          eyebrow="APPOINTMENT"
          title="Book Your Appointment"
          sub="Choose a department, pick your doctor, and secure your slot."
        />

        {step <= 5 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-10 flex-wrap">
            {STEPS.map((stepName, index) => (
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

                {index < STEPS.length - 1 && (
                  <div
                    className={`w-6 sm:w-10 h-0.5 mx-1 ${
                      index + 1 < step
                        ? "bg-[#16A34A]"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <Card
          className="p-6 sm:p-8"
          hover={false}
        >
          <AnimatePresence mode="wait">

            {/* =====================================================
                STEP 1 — DEPARTMENT
            ===================================================== */}

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

              {step === 1 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Choose a Department
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {DEPARTMENTS.map((department) => {
                      const Icon =
                        Icons[
                          ICON_MAP[department.name] ||
                            "FaStethoscope"
                        ];

                      return (
                        <button
                          type="button"
                          key={department.name}
                          onClick={() => {
                            setForm((previous) => ({
                              ...previous,
                              dept: department.name,
                              doctor: "",
                              time: "",
                            }));

                            setStep(2);
                          }}
                          className={`p-4 rounded-xl border text-left transition-colors ${
                            form.dept === department.name
                              ? "border-[#16A34A]"
                              : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500"
                          }`}
                        >
                          <Icon
                            size={20}
                            style={{
                              color: department.color,
                            }}
                          />

                          <div className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                            {department.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =====================================================
                  STEP 2 — DOCTOR
              ===================================================== */}

              {step === 2 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Choose a Doctor — {form.dept}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {(availableDoctors.length
                      ? availableDoctors
                      : DOCTORS
                    ).map((doctor) => (
                      <button
                        type="button"
                        key={doctor.id}
                        onClick={() => {
                          setForm((previous) => ({
                            ...previous,
                            doctor: doctor.name,
                            dept: doctor.dept,
                            time: "",
                          }));

                          setStep(3);
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-colors ${
                          form.doctor === doctor.name
                            ? "border-[#16A34A]"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <img
                          src={doctor.img}
                          className="w-11 h-11 rounded-lg object-cover"
                          alt={doctor.name}
                        />

                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {doctor.name}
                          </div>

                          <div className="text-xs text-slate-400">
                            {doctor.status} · ⭐{" "}
                            {doctor.rating}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-4 text-sm text-slate-400 flex items-center gap-1"
                  >
                    <FiChevronLeft size={14} />
                    Back
                  </button>
                </div>
              )}

              {/* =====================================================
                  STEP 3 — DATE & TIME
              ===================================================== */}

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
                    className="w-full mt-1 mb-4 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />

                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-utility">
                    TIME SLOT
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">

                    {TIME_SLOTS.map((time) => {
                      const selected =
                        form.time === time;

                      return (
                        <button
                          type="button"
                          key={time}
                          onClick={() => selectTime(time)}
                          aria-pressed={selected}
                          className={`py-3 px-2 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                            selected
                              ? "text-white border-transparent shadow-md scale-[1.02]"
                              : "border-slate-200 text-slate-600 bg-white hover:border-[#16A34A] hover:text-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#16A34A]"
                          }`}
                          style={
                            selected
                              ? {
                                  background:
                                    "linear-gradient(135deg,#0F4C81,#16A34A)",
                                }
                              : {}
                          }
                        >
                          {time}
                        </button>
                      );
                    })}

                  </div>

                  {!form.time && (
                    <p className="text-xs text-slate-400 mt-3">
                      Please select a time slot to continue.
                    </p>
                  )}

                  {form.time && (
                    <p className="text-xs text-[#16A34A] mt-3 font-medium">
                      Selected time: {form.time}
                    </p>
                  )}

                  <div className="flex justify-between mt-6">

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm text-slate-400 flex items-center gap-1"
                    >
                      <FiChevronLeft size={14} />
                      Back
                    </button>

                    <PrimaryButton
                      icon={FiChevronRight}
                      onClick={() => {
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
                      }}
                    >
                      Continue
                    </PrimaryButton>

                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mt-4">
                      {error}
                    </p>
                  )}
                </div>
              )}

              {/* =====================================================
                  STEP 4 — DETAILS
              ===================================================== */}

              {step === 4 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Your Details
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3">

                    <input
                      placeholder="Full name"
                      value={form.name}
                      onChange={set("name")}
                      className="rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                    <input
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={set("phone")}
                      className="rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                    <input
                      placeholder="Email address"
                      value={form.email}
                      onChange={set("email")}
                      className="sm:col-span-2 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                    <textarea
                      placeholder="Reason for visit"
                      value={form.reason}
                      onChange={set("reason")}
                      rows={3}
                      className="sm:col-span-2 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />

                  </div>

                  <div className="flex justify-between mt-6">

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-sm text-slate-400 flex items-center gap-1"
                    >
                      <FiChevronLeft size={14} />
                      Back
                    </button>

                    <PrimaryButton
                      icon={FiChevronRight}
                      onClick={() => {
                        if (!form.name.trim()) {
                          setError(
                            "Please enter your full name."
                          );
                          return;
                        }

                        setError("");
                        setStep(5);
                      }}
                    >
                      Review
                    </PrimaryButton>

                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mt-4">
                      {error}
                    </p>
                  )}
                </div>
              )}

              {/* =====================================================
                  STEP 5 — REVIEW
              ===================================================== */}

              {step === 5 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">
                    Review &amp; Confirm
                  </h3>

                  <div className="rounded-xl p-4 space-y-2 text-sm bg-slate-50 dark:bg-slate-900">

                    {[
                      ["Department", form.dept],
                      ["Doctor", form.doctor],
                      ["Date", form.date],
                      ["Time", form.time],
                      ["Patient", form.name],
                      ["Reason", form.reason || "—"],
                    ].map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-4"
                      >
                        <span className="text-slate-400">
                          {key}
                        </span>

                        <span className="text-slate-800 dark:text-slate-100 text-right">
                          {value}
                        </span>
                      </div>
                    ))}

                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mt-3">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-between mt-6">

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-sm text-slate-400 flex items-center gap-1"
                    >
                      <FiChevronLeft size={14} />
                      Back
                    </button>

                    <PrimaryButton
                      icon={FiCheckCircle}
                      onClick={confirm}
                    >
                      {submitting
                        ? "Booking…"
                        : "Confirm Appointment"}
                    </PrimaryButton>

                  </div>
                </div>
              )}

              {/* =====================================================
                  STEP 6 — SUCCESS
              ===================================================== */}

              {step === 6 && ticket && (
                <div className="text-center">

                  <FiCheckCircle
                    className="mx-auto text-[#16A34A] mb-2"
                    size={40}
                  />

                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                    Appointment Confirmed!
                  </h3>

                  <p className="text-sm mt-1 mb-6 text-slate-500 dark:text-slate-400">
                    Your appointment has been successfully
                    booked.
                  </p>

                  <div className="max-w-sm mx-auto">

                    <QueueTicket
                      num={ticket.num}
                      name={ticket.name}
                      dept={ticket.dept}
                      doctor={ticket.doctor}
                      date={ticket.date}
                      time={ticket.time}
                    />

                  </div>

                  <div className="flex justify-center gap-3 mt-6 flex-wrap">

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 dark:text-white"
                    >
                      <FiDownload size={16} />
                      Download Slip
                    </button>

                    <a href="/queue-tracker">
                      <PrimaryButton icon={FiLayout}>
                        Track Queue
                      </PrimaryButton>
                    </a>

                  </div>

                </div>
              )}

            </motion.div>

          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
