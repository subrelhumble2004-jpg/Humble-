import { Doctor } from "@/lib/types";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { FiStar } from "react-icons/fi";

export default function DoctorCard({ doc, onBook }: { doc: Doctor; onBook?: () => void }) {
  const tone = doc.status === "Available" ? "success" : doc.status === "In Session" ? "warning" : "error";
  return (
    <Card className="overflow-hidden">
      <div className="relative h-52">
        <img src={doc.img} className="w-full h-full object-cover" alt={doc.name} />
        <div className="absolute top-3 right-3"><Badge tone={tone}>{doc.status}</Badge></div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white">{doc.name}</h3>
        <p className="text-sm text-[#16A34A] font-medium font-body">{doc.dept}</p>
        <div className="flex items-center gap-4 mt-3 text-sm font-body">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><FiStar size={14} className="text-amber-400 fill-amber-400" /> {doc.rating}</span>
          <span className="text-slate-500 dark:text-slate-400">{doc.years} yrs exp</span>
        </div>
        <button onClick={onBook} className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold font-display text-white" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}>
          Book Appointment
        </button>
      </div>
    </Card>
  );
}
