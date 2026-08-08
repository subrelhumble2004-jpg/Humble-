"use client";
import { motion } from "framer-motion";
import { Department } from "@/lib/types";
import Card from "./ui/Card";
import { FiChevronRight } from "react-icons/fi";
import * as Icons from "react-icons/fa";

const ICON_MAP: Record<string, keyof typeof Icons> = {
  Emergency: "FaAmbulance", Cardiology: "FaHeartbeat", Neurology: "FaBrain", Orthopedics: "FaBone",
  Dentistry: "FaTooth", Pediatrics: "FaBaby", Radiology: "FaXRay", Laboratory: "FaMicroscope",
  "General Medicine": "FaStethoscope", Surgery: "FaCut", Dermatology: "FaAllergies", Gynecology: "FaFemale",
};

export default function DepartmentCard({ dept, onClick }: { dept: Department; onClick?: () => void }) {
  const Icon = Icons[ICON_MAP[dept.name] || "FaStethoscope"];
  return (
    <motion.button onClick={onClick} className="text-left w-full" whileHover={{ y: -4 }}>
      <Card className="p-6 h-full group cursor-pointer">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${dept.color}18`, color: dept.color }}>
          <Icon size={20} />
        </div>
        <h3 className="font-display font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
        <p className="text-sm mt-1 text-slate-500 dark:text-slate-400 font-body">{dept.blurb}</p>
        <div className="flex items-center gap-1 text-sm font-medium mt-4 text-[#16A34A] opacity-0 group-hover:opacity-100 transition-opacity">
          Learn more <FiChevronRight size={15} />
        </div>
      </Card>
    </motion.button>
  );
}
