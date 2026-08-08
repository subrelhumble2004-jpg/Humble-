import clsx from "clsx";
import { ReactNode } from "react";

export default function Card({ children, className = "", hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border transition-all duration-300 bg-white border-slate-100 shadow-sm",
        "dark:bg-slate-800/60 dark:border-slate-700 dark:backdrop-blur-xl dark:shadow-black/20",
        hover && "hover:-translate-y-1 hover:shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
