import { IconType } from "react-icons";
import Card from "./ui/Card";
import { FiArrowUpRight } from "react-icons/fi";

const TONES: Record<string, string> = { primary: "#0F4C81", success: "#16A34A", accent: "#38BDF8", warn: "#EA580C" };

export default function KpiCard({ icon: Icon, label, value, delta, tone = "primary" }: {
  icon: IconType; label: string; value: string; delta?: string; tone?: keyof typeof TONES;
}) {
  return (
    <Card className="p-5" hover={false}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${TONES[tone]}18`, color: TONES[tone] }}><Icon size={19} /></div>
        {delta && <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-0.5"><FiArrowUpRight size={13} />{delta}</span>}
      </div>
      <div className="text-2xl font-display font-bold mt-3 text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5 font-utility">{label}</div>
    </Card>
  );
}
