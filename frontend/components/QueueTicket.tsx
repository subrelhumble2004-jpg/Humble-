import { QueueTicketData } from "@/lib/types";
import { FiActivity } from "react-icons/fi";
import Badge from "./ui/Badge";

export default function QueueTicket({ num, name, dept, doctor, date, time }: QueueTicketData) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
      <div className="p-6 text-white" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><FiActivity size={16} /></div>
            <span className="text-xs font-utility tracking-wide">MEDQUEUE PRO</span>
          </div>
          <Badge tone="success">CONFIRMED</Badge>
        </div>
        <div className="text-xs font-utility opacity-80 mb-1">QUEUE NUMBER</div>
        <div className="text-5xl font-display font-extrabold tracking-tight">{num}</div>
      </div>
      <div className="relative p-6 bg-white dark:bg-slate-800">
        <div className="border-t border-dashed my-1 border-slate-300 dark:border-slate-600" />
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div><div className="text-slate-400 text-xs mb-0.5 font-utility">PATIENT</div><div className="text-slate-800 dark:text-slate-100">{name}</div></div>
          <div><div className="text-slate-400 text-xs mb-0.5 font-utility">DEPARTMENT</div><div className="text-slate-800 dark:text-slate-100">{dept}</div></div>
          <div><div className="text-slate-400 text-xs mb-0.5 font-utility">DOCTOR</div><div className="text-slate-800 dark:text-slate-100">{doctor}</div></div>
          <div><div className="text-slate-400 text-xs mb-0.5 font-utility">DATE / TIME</div><div className="text-slate-800 dark:text-slate-100">{date} · {time}</div></div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg grid grid-cols-4 grid-rows-4 gap-[2px] p-1.5 bg-slate-900 dark:bg-slate-100">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={(i * 7 + num.length) % 3 === 0 ? "bg-white dark:bg-slate-900" : "bg-transparent"} />
            ))}
          </div>
          <div className="text-xs text-slate-400">Scan at reception kiosk<br />for instant check-in</div>
        </div>
      </div>
    </div>
  );
}
