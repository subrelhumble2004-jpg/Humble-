"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { IconType } from "react-icons";

export function PrimaryButton({ children, onClick, icon: Icon, className = "", full, type = "button" }: {
  children: ReactNode; onClick?: () => void; icon?: IconType; className?: string; full?: boolean; type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={clsx(
        "group relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display font-semibold text-white overflow-hidden",
        full && "w-full",
        className
      )}
      style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}
    >
      <span className="relative z-10 flex items-center gap-2 text-sm">
        {children}
        {Icon && <Icon size={18} />}
      </span>
    </motion.button>
  );
}

export function GhostButton({ children, onClick, icon: Icon, className = "" }: {
  children: ReactNode; onClick?: () => void; icon?: IconType; className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display font-semibold text-sm border transition-colors",
        "border-slate-200 text-slate-700 hover:bg-slate-50",
        "dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800",
        className
      )}
    >
      {children}
      {Icon && <Icon size={18} />}
    </motion.button>
  );
}
