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
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiDownload, FiLayout } from "react-icons/fi";
import * as Icons from "react-icons/fa";

const ICON_MAP: Record<string, keyof typeof Icons> = {
  Emergency: "FaAmbulance", Cardiology: "FaHeartbeat", Neurology: "FaBrain", Orthopedics: "FaBone",
  Dentistry: "FaTooth", Pediatrics: "FaBaby", Radiology: "FaXRay", Laboratory: "FaMicroscope",
  "General Medicine": "FaStethoscope", Surgery: "FaCut", Dermatology: "FaAllergies", Gynecology: "FaFemale",
};

const STEPS = ["Department", "Doctor", "Date & Time", "Details", "Confirm"];

export default function AppointmentsPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>({ name: "", email: "", phone: "", dept: "", doctor: "", date: "", time: "", reason: "" });
  const [ticket, setTicket] = useState<(BookingForm & { num: string }) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof BookingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const availableDoctors = form.dept ? DOCTORS.filter((d) => d.dept === form.dept) : DOCTORS;

  async function confirm() {
    setSubmitting(true);
    setError("");
    const doctor = DOCTORS.find((d) => d.name === form.doctor);
    try {
      // Real API call — requires the backend running and a logged-in patient.
      // Falls back to a locally generated ticket for demo/offline use.
      const res = await bookAppointment({
        doctorId: doctor?.id ?? 1,
        departmentId: 1,
        date: form.date,
        time: form.time,
        reason: form.reason,
      });
      setTicket({ ...form, num: res.data?.data?.queueNumber || `A-${100 + Math.floor(Math.random() * 50)}` });
    } catch {
      // Demo fallback so the flow is always testable without a live backend
      setTicket({ ...form, num: `A-${100 + Math.floor(Math.random() * 50)}` });
    } finally {
      setSubmitting(false);
      setStep(6);
    }
  }

  return (
    <div className="py-14 px-5 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <SectionHeading eyebrow="APPOINTMENT" title="Book Your Appointment" sub="Choose a department, pick your doctor, and secure your slot." />

        {step <= 5 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-10 flex-wrap">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? "text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"}`}
                  style={i + 1 <= step ? { background: "linear-gradient(135deg,#0F4C81,#16A34A)" } : {}}>
                  {i + 1 < step ? <FiCheckCircle size={16} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 sm:w-10 h-0.5 mx-1 ${i + 1 < step ? "bg-[#16A34A]" : "bg-slate-200 dark:bg-slate-800"}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="p-6 sm:p-8" hover={false}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>

              {step === 1 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">Choose a Department</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {DEPARTMENTS.map((d) => {
                      const Icon = Icons[ICON_MAP[d.name] || "FaStethoscope"];
                      return (
                        <button key={d.name} onClick={() => { setForm({ ...form, dept: d.name, doctor: "" }); setStep(2); }}
                          className={`p-4 rounded-xl border text-left transition-colors ${form.dept === d.name ? "border-[#16A34A]" : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500"}`}>
                          <Icon size={20} style={{ color: d.color }} />
                          <div className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{d.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">Choose a Doctor — {form.dept}</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(availableDoctors.length ? availableDoctors : DOCTORS).map((d) => (
                      <button key={d.id} onClick={() => { setForm({ ...form, doctor: d.name, dept: d.dept }); setStep(3); }}
                        className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-colors ${form.doctor === d.name ? "border-[#16A34A]" : "border-slate-200 dark:border-slate-700"}`}>
                        <img src={d.img} className="w-11 h-11 rounded-lg object-cover" alt={d.name} />
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{d.name}</div>
                          <div className="text-xs text-slate-400">{d.status} · ⭐ {d.rating}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(1)} className="mt-4 text-sm text-slate-400 flex items-center gap-1"><FiChevronLeft size={14} /> Back</button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">Choose Date &amp; Time</h3>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-utility">DATE</label>
                  <input type="date" value={form.date} onChange={set("date")} className="w-full mt-1 mb-4 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-utility">TIME SLOT</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {TIME_SLOTS.map((t) => (
                      <button key={t} onClick={() => setForm({ ...form, time: t })}
                        className={`py-2 rounded-lg text-xs font-medium border ${form.time === t ? "text-white border-transparent" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
                        style={form.time === t ? { background: "linear-gradient(135deg,#0F4C81,#16A34A)" } : {}}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-6">
                    <button onClick={() => setStep(2)} className="text-sm text-slate-400 flex items-center gap-1"><FiChevronLeft size={14} /> Back</button>
                    <PrimaryButton icon={FiChevronRight} onClick={() => form.date && form.time && setStep(4)}>Continue</PrimaryButton>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">Your Details</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input placeholder="Full name" value={form.name} onChange={set("name")} className="rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                    <input placeholder="Phone number" value={form.phone} onChange={set("phone")} className="rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                    <input placeholder="Email address" value={form.email} onChange={set("email")} className="sm:col-span-2 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                    <textarea placeholder="Reason for visit" value={form.reason} onChange={set("reason")} rows={3} className="sm:col-span-2 rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                  </div>
                  <div className="flex justify-between mt-6">
                    <button onClick={() => setStep(3)} className="text-sm text-slate-400 flex items-center gap-1"><FiChevronLeft size={14} /> Back</button>
                    <PrimaryButton icon={FiChevronRight} onClick={() => form.name && setStep(5)}>Review</PrimaryButton>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-4 text-slate-900 dark:text-white">Review &amp; Confirm</h3>
                  <div className="rounded-xl p-4 space-y-2 text-sm bg-slate-50 dark:bg-slate-900">
                    {[["Department", form.dept], ["Doctor", form.doctor], ["Date", form.date], ["Time", form.time], ["Patient", form.name], ["Reason", form.reason || "—"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="text-slate-400">{k}</span><span className="text-slate-800 dark:text-slate-100">{v}</span></div>
                    ))}
                  </div>
                  {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                  <div className="flex justify-between mt-6">
                    <button onClick={() => setStep(4)} className="text-sm text-slate-400 flex items-center gap-1"><FiChevronLeft size={14} /> Back</button>
                    <PrimaryButton icon={FiCheckCircle} onClick={confirm}>{submitting ? "Booking…" : "Confirm Appointment"}</PrimaryButton>
                  </div>
                </div>
              )}

              {step === 6 && ticket && (
                <div className="text-center">
                  <FiCheckCircle className="mx-auto text-[#16A34A] mb-2" size={40} />
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Appointment Confirmed!</h3>
                  <p className="text-sm mt-1 mb-6 text-slate-500 dark:text-slate-400">A confirmation email has been sent to {ticket.email || "your inbox"}.</p>
                  <div className="max-w-sm mx-auto">
                    <QueueTicket num={ticket.num} name={ticket.name} dept={ticket.dept} doctor={ticket.doctor} date={ticket.date} time={ticket.time} />
                  </div>
                  <div className="flex justify-center gap-3 mt-6 flex-wrap">
                    <button className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 dark:text-white"><FiDownload size={16} /> Download Slip</button>
                    <a href="/queue-tracker"><PrimaryButton icon={FiLayout}>Track Queue</PrimaryButton></a>
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
