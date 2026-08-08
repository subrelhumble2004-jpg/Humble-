"use client";
import { useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import DashSidebar from "@/components/DashSidebar";
import KpiCard from "@/components/KpiCard";
import Card from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import {
  FiGrid, FiUsers, FiHeart, FiCalendar, FiFileText, FiSettings, FiDownload, FiAlertCircle, FiFilter,
} from "react-icons/fi";
import { FaStethoscope, FaBuilding } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const ITEMS: [string, string, any][] = [
  ["Overview", "overview", FiGrid], ["Patients", "patients", FiUsers], ["Doctors", "doctors", FaStethoscope],
  ["Departments", "depts", FaBuilding], ["Appointments", "appts", FiCalendar], ["Reports", "reports", FiFileText],
  ["Settings", "settings", FiSettings],
];

const WEEK_DATA = { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], appts: [42, 55, 48, 61, 58, 33, 20] };
const DEPT_SPLIT = { labels: ["Cardiology", "Pediatrics", "Orthopedics", "Dermatology", "Other"], values: [28, 22, 18, 14, 18], colors: ["#0F4C81", "#16A34A", "#38BDF8", "#EA580C", "#94A3B8"] };

export default function AdminDashboard() {
  const [active, setActive] = useState("overview");

  const barData = {
    labels: WEEK_DATA.labels,
    datasets: [{ label: "Appointments", data: WEEK_DATA.appts, backgroundColor: "#0F4C81", borderRadius: 6 }],
  };
  const doughnutData = {
    labels: DEPT_SPLIT.labels,
    datasets: [{ data: DEPT_SPLIT.values, backgroundColor: DEPT_SPLIT.colors, borderWidth: 0 }],
  };

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      <DashSidebar active={active} setActive={setActive} items={ITEMS} title="Admin Console" subtitle="HOSPITAL MANAGEMENT" />
      <main className="flex-1 p-6 lg:p-8">
        {active === "overview" && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Hospital Analytics</h2>
              <GhostButton icon={FiDownload}>Export Report</GhostButton>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard icon={FiUsers} label="TOTAL PATIENTS" value="41,230" delta="+8.2%" />
              <KpiCard icon={FaStethoscope} label="ACTIVE DOCTORS" value="86" delta="+2" tone="success" />
              <KpiCard icon={FiCalendar} label="APPTS THIS WEEK" value="317" delta="+12%" tone="accent" />
              <KpiCard icon={FiAlertCircle} label="MISSED VISITS" value="9" tone="warn" />
            </div>
            <div className="grid lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2 p-5" hover={false}>
                <h3 className="font-display font-semibold mb-4 text-slate-900 dark:text-white">Weekly Appointments</h3>
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} height={90} />
              </Card>
              <Card className="p-5" hover={false}>
                <h3 className="font-display font-semibold mb-4 text-slate-900 dark:text-white">Department Split</h3>
                <Doughnut data={doughnutData} options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } }} />
              </Card>
            </div>
          </>
        )}
        {["patients", "doctors", "depts", "appts", "reports", "settings"].includes(active) && (
          <Card className="p-10 text-center" hover={false}>
            <FiFilter className="mx-auto text-slate-400 mb-3" size={32} />
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">{ITEMS.find(([, k]) => k === active)?.[0]} Management</h3>
            <p className="text-sm text-slate-400 mt-1">Wire this table to the Express + MySQL REST API for full CRUD.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
