"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiUsers, FiHeart, FiCalendar, FiActivity } from "react-icons/fi";
import { FiClipboard } from "react-icons/fi";
import Badge from "./ui/Badge";
import { PrimaryButton, GhostButton } from "./ui/Button";
import QueueTicket from "./QueueTicket";
import { DOCTORS } from "@/lib/data";

export default function Hero() {
  const iconsRef = useRef<HTMLDivElement>(null);

  // GSAP-driven ambient float for the hero's medical icons
  useEffect(() => {
    if (!iconsRef.current) return;
    const icons = iconsRef.current.querySelectorAll(".float-icon");
    icons.forEach((el, i) => {
      gsap.to(el, {
        y: -16,
        duration: 2.4 + i * 0.3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.25,
      });
    });
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0B1B2B,#0F2540)" }}>
      <Image src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80" alt="" fill className="object-cover opacity-20 mix-blend-overlay" priority />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 20%, rgba(56,189,248,0.25), transparent 50%)" }} />

      <div ref={iconsRef} className="absolute inset-0 pointer-events-none">
        {[
          { Icon: FiHeart, style: { top: "18%", left: "6%" } },
          { Icon: FiCalendar, style: { top: "68%", left: "10%" } },
          { Icon: FiActivity, style: { top: "30%", right: "8%" } },
          { Icon: FiClipboard, style: { top: "72%", right: "13%" } },
        ].map(({ Icon, style }, i) => (
          <div key={i} className="float-icon absolute rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 text-white" style={style}>
            <Icon size={22} />
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Badge tone="primary">Smart Hospital Technology</Badge>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-display font-extrabold leading-[1.08] text-white">
            Welcome to <span style={{ background: "linear-gradient(135deg,#38BDF8,#16A34A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MedQueue Pro</span>
          </h1>
          <p className="mt-3 text-lg text-sky-100/90 font-medium font-body">Smart Hospital Appointment &amp; Queue Management System</p>
          <p className="mt-5 text-slate-200/80 leading-relaxed max-w-lg font-body">
            Book appointments online. Meet doctors without long waiting. Track your queue in real time. Access healthcare from anywhere.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/appointments"><PrimaryButton icon={FiArrowRight}>Book Appointment</PrimaryButton></Link>
            <Link href="/departments"><GhostButton className="!border-white/30 !text-white">Explore Services</GhostButton></Link>
            <Link href="/doctors"><GhostButton icon={FiUsers} className="!border-white/30 !text-white">Meet Doctors</GhostButton></Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-slate-300 text-sm font-body">
            <div className="flex -space-x-3">
              {DOCTORS.slice(0, 4).map((d) => (
                <img key={d.id} src={d.img} className="w-9 h-9 rounded-full border-2 border-[#0F4C81] object-cover" alt={d.name} />
              ))}
            </div>
            <span>Trusted by <b className="text-white">40,000+</b> patients</span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[1.75rem] overflow-hidden shadow-2xl border border-white/10 relative h-[420px]">
            <Image src="https://images.unsplash.com/photo-1666214280165-3e29b8a1e5a9?w=900&q=80" alt="Modern smart hospital" fill className="object-cover" />
          </div>
          <div className="absolute -bottom-8 -left-8 w-64 hidden sm:block">
            <QueueTicket num="A-108" name="Live Preview" dept="Cardiology" doctor="Dr. Amaka Obi" date="Today" time="10:00 AM" />
          </div>
        </div>
      </div>
    </section>
  );
}
