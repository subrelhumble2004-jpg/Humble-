"use client";
import { useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import DoctorCard from "@/components/DoctorCard";
import { DOCTORS } from "@/lib/data";

export default function DoctorsPage() {
  const [filter, setFilter] = useState("All");
  const depts = ["All", ...Array.from(new Set(DOCTORS.map((d) => d.dept)))];
  const filtered = filter === "All" ? DOCTORS : DOCTORS.filter((d) => d.dept === filter);

  return (
    <div className="py-16 px-5 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow="OUR SPECIALISTS" title="Meet Our Doctors" sub="Filter by department to find the right specialist for you." />
        <div className="flex flex-wrap gap-2 justify-center mt-8">
          {depts.map((d) => (
            <button key={d} onClick={() => setFilter(d)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                filter === d ? "text-white border-transparent" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
              style={filter === d ? { background: "linear-gradient(135deg,#0F4C81,#16A34A)" } : {}}>
              {d}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {filtered.map((d) => <DoctorCard key={d.id} doc={d} />)}
        </div>
      </div>
    </div>
  );
}
