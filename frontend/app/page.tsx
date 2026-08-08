"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Hero from "@/components/Hero";
import StatCounter from "@/components/StatCounter";
import SectionHeading from "@/components/SectionHeading";
import DepartmentCard from "@/components/DepartmentCard";
import DoctorCard from "@/components/DoctorCard";
import Card from "@/components/ui/Card";
import { DEPARTMENTS, DOCTORS } from "@/lib/data";
import { FiUsers, FiCalendar, FiAward } from "react-icons/fi";
import { FaStethoscope, FaCalendarCheck, FaShieldAlt, FaChartLine } from "react-icons/fa";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="py-16 px-5 lg:px-8 bg-[#0F4C81]/[0.03] dark:bg-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter icon={FiUsers} value={41230} label="PATIENTS SERVED" />
          <StatCounter icon={FaCalendarCheck} value={68540} label="APPOINTMENTS DONE" />
          <StatCounter icon={FaStethoscope} value={86} label="EXPERT DOCTORS" />
          <StatCounter icon={FiAward} value={14} label="AWARDS WON" />
        </div>
      </section>

      <section className="py-20 px-5 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="ABOUT MEDQUEUE PRO" title="Healthcare that respects your time"
            sub="Our mission is to eliminate hospital overcrowding through a transparent, real-time queue system — connecting patients, doctors, and administrators on one intelligent platform." />
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
            transition={{ staggerChildren: 0.12 }} className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: FaCalendarCheck, title: "Our Mission", body: "Make quality healthcare accessible with zero unnecessary waiting." },
              { icon: FaChartLine, title: "Our Vision", body: "Be Nigeria's leading model for digital-first hospital management." },
              { icon: FaShieldAlt, title: "Why Choose Us", body: "Verified specialists, live queue transparency, and secure records." },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="p-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-display font-semibold mb-1.5 text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-body">{f.body}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-5 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="DEPARTMENTS" title="Every specialty, one hospital" sub="Twelve departments staffed with verified, experienced specialists." />
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
            transition={{ staggerChildren: 0.06 }} className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-12">
            {DEPARTMENTS.map((d) => (
              <motion.div key={d.name} variants={fadeUp}>
                <DepartmentCard dept={d} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-5 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="OUR SPECIALISTS" title="Meet our doctors" sub="Board-certified specialists, ready to see you today." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {DOCTORS.slice(0, 3).map((d) => <DoctorCard key={d.id} doc={d} />)}
          </div>
          <div className="text-center mt-10">
            <Link href="/doctors" className="text-sm font-semibold text-[#0F4C81] dark:text-sky-300">View All Doctors →</Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-5 lg:px-8" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Skip the waiting room. Book online today.</h2>
          <p className="text-sky-100/90 mt-3 max-w-xl mx-auto font-body">Get an instant queue number, live wait-time updates, and a downloadable appointment slip — all in under two minutes.</p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link href="/appointments" className="rounded-xl px-7 py-3.5 font-semibold font-display bg-white text-[#0F4C81]">Book Appointment</Link>
            <Link href="/contact" className="rounded-xl px-7 py-3.5 font-semibold font-display border border-white/40 text-white">Contact Hospital</Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
