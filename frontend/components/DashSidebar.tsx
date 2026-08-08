"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconType } from "react-icons";
import { FiLogOut } from "react-icons/fi";

export default function DashSidebar({ active, setActive, items, title, subtitle }: {
  active: string; setActive: (k: string) => void;
  items: [string, string, IconType][]; title: string; subtitle: string;
}) {
  const router = useRouter();
  function signOut() {
    localStorage.removeItem("mqp_token");
    localStorage.removeItem("mqp_role");
    router.push("/");
  }
  return (
    <aside className="w-full lg:w-64 shrink-0 lg:min-h-[calc(100vh-72px)] border-b lg:border-b-0 lg:border-r p-5 bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800">
      <div className="mb-6 px-1">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-utility">{subtitle}</div>
        <div className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</div>
      </div>
      <nav className="flex lg:flex-col gap-1 overflow-x-auto">
        {items.map(([label, key, Icon]) => (
          <button key={key} onClick={() => setActive(key)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              active === key ? "text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            style={active === key ? { background: "linear-gradient(135deg,#0F4C81,#16A34A)" } : {}}>
            <Icon size={17} /> {label}
          </button>
        ))}
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-2 lg:mt-4 text-red-500 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10">
          <FiLogOut size={17} /> Sign out
        </button>
      </nav>
    </aside>
  );
}
