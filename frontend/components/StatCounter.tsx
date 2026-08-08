"use client";
import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { IconType } from "react-icons";

export default function StatCounter({ icon: Icon, value, label, suffix = "" }: { icon: IconType; value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number, t0: number;
    const duration = 1600;
    const step = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / duration, 1);
      setCount(Math.floor(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 bg-white text-[#0F4C81] shadow-md dark:bg-sky-400/10 dark:text-sky-300">
        <Icon size={24} />
      </div>
      <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">{count.toLocaleString()}{suffix}</div>
      <div className="text-xs mt-1 font-utility text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
