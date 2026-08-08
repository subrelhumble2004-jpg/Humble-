"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { FiPlayCircle, FiPauseCircle } from "react-icons/fi";

interface QueueEntry { num: string; name: string; dept: string; status: "In Session" | "Waiting" | "Completed"; }

const INITIAL: QueueEntry[] = [
  { num: "A-101", name: "Chidi O.", dept: "Cardiology", status: "In Session" },
  { num: "A-102", name: "Ngozi F.", dept: "Cardiology", status: "Waiting" },
  { num: "A-103", name: "Blessing U.", dept: "Cardiology", status: "Waiting" },
  { num: "A-104", name: "Samuel K.", dept: "Cardiology", status: "Waiting" },
  { num: "A-105", name: "Ruth A.", dept: "Cardiology", status: "Waiting" },
];

export default function QueueTrackerPage() {
  const [queue, setQueue] = useState(INITIAL);
  const [playing, setPlaying] = useState(true);

  // In production, replace this interval with a poll against
  // GET /api/queue/:departmentId (see lib/api.ts -> fetchDepartmentQueue),
  // or upgrade to WebSockets for true real-time push updates.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setQueue((q) => {
        const idx = q.findIndex((p) => p.status === "In Session");
        if (idx === -1) return q;
        const next = [...q];
        next[idx] = { ...next[idx], status: "Completed" };
        if (idx + 1 < next.length) next[idx + 1] = { ...next[idx + 1], status: "In Session" };
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [playing]);

  const current = queue.find((p) => p.status === "In Session");
  const waiting = queue.filter((p) => p.status === "Waiting").length;
  const completed = queue.filter((p) => p.status === "Completed").length;
  const progress = (completed / queue.length) * 100;

  return (
    <div className="py-14 px-5 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <SectionHeading eyebrow="LIVE QUEUE" title="Cardiology Department" sub="Real-time queue status — auto-refreshes every few seconds." />

        <div className="flex justify-center mt-6">
          <button onClick={() => setPlaying(!playing)} className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {playing ? <FiPauseCircle size={16} /> : <FiPlayCircle size={16} />} {playing ? "Live updates on" : "Paused"}
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-8">
          <Card className="p-6 text-center" hover={false}>
            <div className="text-xs text-slate-400 mb-2 font-utility">NOW SERVING</div>
            <div className="text-4xl font-display font-extrabold text-[#16A34A]">{current ? current.num : "—"}</div>
            <div className="text-sm mt-1 text-slate-500 dark:text-slate-400">{current ? current.name : "Queue complete"}</div>
          </Card>
          <Card className="p-6 text-center" hover={false}>
            <div className="text-xs text-slate-400 mb-2 font-utility">PATIENTS WAITING</div>
            <div className="text-4xl font-display font-extrabold text-slate-900 dark:text-white">{waiting}</div>
            <div className="text-sm mt-1 text-slate-500 dark:text-slate-400">Est. {waiting * 12} min wait</div>
          </Card>
          <Card className="p-6 text-center" hover={false}>
            <div className="text-xs text-slate-400 mb-2 font-utility">COMPLETED TODAY</div>
            <div className="text-4xl font-display font-extrabold text-slate-900 dark:text-white">{completed}</div>
            <div className="text-sm mt-1 text-slate-500 dark:text-slate-400">of {queue.length} scheduled</div>
          </Card>
        </div>

        <div className="mt-6 h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
          <motion.div className="h-full rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.7 }}
            style={{ background: "linear-gradient(90deg,#0F4C81,#16A34A)" }} />
        </div>

        <Card className="mt-8 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden" hover={false}>
          {queue.map((p) => (
            <div key={p.num} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm ${p.status === "In Session" ? "text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}
                  style={p.status === "In Session" ? { background: "linear-gradient(135deg,#0F4C81,#16A34A)" } : {}}>{p.num}</div>
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.dept}</div>
                </div>
              </div>
              <Badge tone={p.status === "Completed" ? "success" : p.status === "In Session" ? "warning" : "primary"}>{p.status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
