"use client";
import { useState } from "react";
import DashSidebar from "@/components/DashSidebar";
import KpiCard from "@/components/KpiCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { FiUsers, FiCalendar, FiClipboard, FiTrendingUp, FiUser, FiUserCheck, FiClock } from "react-icons/fi";

const ITEMS: [string, string, any][] = [
  ["Today's Patients", "today", FiUsers], ["Schedule", "sched", FiCalendar], ["Queue", "queue", FiClipboard],
  ["Statistics", "stats", FiTrendingUp], ["Profile", "profile", FiUser],
];

const QUEUE_TODAY = [
  { num: "A-101", name: "Chidi O.", status: "In Session" },
  { num: "A-102", name: "Ngozi F.", status: "Waiting" },
  { num: "A-103", name: "Blessing U.", status: "Waiting" },
  { num: "A-104", name: "Samuel K.", status: "Waiting" },
];

export default function DoctorDashboard() {
  const [active, setActive] = useState("today");

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      <DashSidebar active={active} setActive={setActive} items={ITEMS} title="Dr. Amaka Obi" subtitle="DOCTOR PORTAL" />
      <main className="flex-1 p-6 lg:p-8">
        {active === "today" && (
          <>
            <h2 className="text-2xl font-display font-bold mb-5 text-slate-900 dark:text-white">Today&apos;s Patients</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <KpiCard icon={FiUsers} label="TOTAL TODAY" value="18" />
              <KpiCard icon={FiUserCheck} label="COMPLETED" value="11" tone="success" />
              <KpiCard icon={FiClock} label="AVG. TIME/PATIENT" value="14m" tone="accent" />
            </div>
            <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden" hover={false}>
              {QUEUE_TODAY.map((p) => (
                <div key={p.num} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold font-display" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}>{p.num}</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={p.status === "In Session" ? "warning" : "primary"}>{p.status}</Badge>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">Notes</button>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}
        {["sched", "queue", "stats", "profile"].includes(active) && (
          <Card className="p-10 text-center" hover={false}>
            <FiCalendar className="mx-auto text-slate-400 mb-3" size={32} />
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">{ITEMS.find(([, k]) => k === active)?.[0]}</h3>
            <p className="text-sm text-slate-400 mt-1">Connect this view to the REST API for live scheduling data.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
