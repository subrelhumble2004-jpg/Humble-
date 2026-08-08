"use client";
import { useState } from "react";
import DashSidebar from "@/components/DashSidebar";
import KpiCard from "@/components/KpiCard";
import QueueTicket from "@/components/QueueTicket";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { PrimaryButton } from "@/components/ui/Button";
import {
  FiGrid, FiCalendar, FiFileText, FiBell, FiMessageSquare, FiUser, FiSettings, FiPlus, FiClock,
} from "react-icons/fi";

const ITEMS: [string, string, any][] = [
  ["Overview", "overview", FiGrid], ["Appointments", "appointments", FiCalendar], ["Medical History", "history", FiFileText],
  ["Notifications", "notif", FiBell], ["Messages", "msg", FiMessageSquare], ["Profile", "profile", FiUser], ["Settings", "settings", FiSettings],
];

const APPTS = [
  { doc: "Dr. Amaka Obi", dept: "Cardiology", date: "Aug 12, 2026", time: "10:00 AM", status: "Upcoming" },
  { doc: "Dr. Tunde Alabi", dept: "General Medicine", date: "Jul 28, 2026", time: "09:00 AM", status: "Completed" },
  { doc: "Dr. Ifeoma Eze", dept: "Dermatology", date: "Jul 10, 2026", time: "02:00 PM", status: "Completed" },
];

export default function PatientDashboard() {
  const [active, setActive] = useState("overview");

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      <DashSidebar active={active} setActive={setActive} items={ITEMS} title="Alex Johnson" subtitle="PATIENT PORTAL" />
      <main className="flex-1 p-6 lg:p-8">
        {active === "overview" && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Welcome back, Alex 👋</h2>
                <p className="text-sm text-slate-400">Here&apos;s your health summary.</p>
              </div>
              <a href="/appointments"><PrimaryButton icon={FiPlus}>New Appointment</PrimaryButton></a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={FiCalendar} label="UPCOMING VISITS" value="1" />
              <KpiCard icon={FiClock} label="QUEUE POSITION" value="#3" tone="accent" />
              <KpiCard icon={FiFileText} label="MEDICAL RECORDS" value="12" tone="success" />
              <KpiCard icon={FiBell} label="NOTIFICATIONS" value="4" tone="warn" />
            </div>
            <div className="grid lg:grid-cols-3 gap-5 mt-6">
              <Card className="lg:col-span-2 p-5" hover={false}>
                <h3 className="font-display font-semibold mb-4 text-slate-900 dark:text-white">Upcoming Appointment</h3>
                <div className="max-w-sm">
                  <QueueTicket num="A-108" name="Alex Johnson" dept="Cardiology" doctor="Dr. Amaka Obi" date="Aug 12, 2026" time="10:00 AM" />
                </div>
              </Card>
              <Card className="p-5" hover={false}>
                <h3 className="font-display font-semibold mb-4 text-slate-900 dark:text-white">Notifications</h3>
                <ul className="space-y-3 text-sm">
                  <li className="text-slate-600 dark:text-slate-300">Appointment reminder: tomorrow at 10:00 AM.</li>
                  <li className="text-slate-600 dark:text-slate-300">Lab results are ready to view.</li>
                  <li className="text-slate-600 dark:text-slate-300">New message from Dr. Amaka Obi.</li>
                </ul>
              </Card>
            </div>
          </>
        )}

        {active === "appointments" && (
          <>
            <h2 className="text-2xl font-display font-bold mb-5 text-slate-900 dark:text-white">My Appointments</h2>
            <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden" hover={false}>
              {APPTS.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{a.doc} — {a.dept}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.date} · {a.time}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={a.status === "Upcoming" ? "primary" : "success"}>{a.status}</Badge>
                    {a.status === "Upcoming" && <button className="text-xs text-red-400 font-medium">Cancel</button>}
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        {["history", "notif", "msg", "profile", "settings"].includes(active) && (
          <Card className="p-10 text-center" hover={false}>
            <FiFileText className="mx-auto text-slate-400 mb-3" size={32} />
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">{ITEMS.find(([, k]) => k === active)?.[0]}</h3>
            <p className="text-sm text-slate-400 mt-1">This section is ready to connect to live data via the API.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
