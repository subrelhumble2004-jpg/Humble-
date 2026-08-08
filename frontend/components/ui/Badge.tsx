import clsx from "clsx";
import { ReactNode } from "react";

const TONES = {
  primary: "bg-[#0F4C81]/8 text-[#0F4C81] border-[#0F4C81]/20 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/30",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/30",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30",
  error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/30",
};

export default function Badge({ children, tone = "primary" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border font-utility tracking-wide", TONES[tone])}>
      {children}
    </span>
  );
}
