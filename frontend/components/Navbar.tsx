"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiMenu, FiX, FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "./ThemeProvider";
import { PrimaryButton, GhostButton } from "./ui/Button";

const LINKS = [
  ["Home", "/"], ["About", "/about"], ["Doctors", "/doctors"], ["Departments", "/departments"],
  ["Appointments", "/appointments"], ["Queue Tracker", "/queue-tracker"], ["Contact", "/contact"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b bg-white/85 border-slate-100 dark:bg-slate-900/85 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}>
            <FiActivity size={20} />
          </div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
            MedQueue<span className="text-[#16A34A]">Pro</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium font-body transition-colors ${
                pathname === href ? "text-[#0F4C81] bg-[#0F4C81]/8 dark:text-sky-300 dark:bg-sky-400/10" : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <button onClick={toggle} className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700">
            {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <Link href="/login"><GhostButton>Login</GhostButton></Link>
          <Link href="/appointments"><PrimaryButton>Book Appointment</PrimaryButton></Link>
        </div>

        <button className="lg:hidden text-slate-900 dark:text-white" onClick={() => setOpen(!open)}>
          {open ? <FiX size={26} /> : <FiMenu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="px-5 py-4 space-y-1">
              {LINKS.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                  {label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1"><GhostButton className="w-full">Login</GhostButton></Link>
                <button onClick={toggle} className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-amber-300">
                  {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
                </button>
              </div>
              <Link href="/appointments"><PrimaryButton full>Book Appointment</PrimaryButton></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
