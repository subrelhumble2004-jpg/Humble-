"use client";
import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend } from "react-icons/fi";

const CONTACT_ITEMS = [
  [FiPhone, "Phone", "+234 803 000 0000"],
  [FiMail, "Email", "care@medqueuepro.com"],
  [FiMapPin, "Address", "Ideato L.G.A, Imo State, Nigeria"],
  [FiClock, "Opening Hours", "Mon–Sat: 7am – 9pm · Emergency: 24/7"],
] as const;

export default function ContactPage() {
  return (
    <div className="py-16 px-5 lg:px-8 min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="GET IN TOUCH" title="Contact MedQueue Pro" sub="We're here to help, 24 hours a day." />
        <div className="grid lg:grid-cols-2 gap-8 mt-12">
          <Card className="p-6" hover={false}>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Full name" className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
              <input placeholder="Email" className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
              <textarea placeholder="Message" rows={5} className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
              <PrimaryButton full icon={FiSend} type="submit">Send Message</PrimaryButton>
            </form>
          </Card>
          <div className="space-y-4">
            {CONTACT_ITEMS.map(([Icon, label, val], i) => (
              <Card key={i} className="p-4 flex items-center gap-4" hover={false}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#0F4C81]/8 text-[#0F4C81] dark:bg-sky-400/10 dark:text-sky-300"><Icon size={19} /></div>
                <div><div className="text-sm font-semibold text-slate-900 dark:text-white font-body">{label}</div><div className="text-xs text-slate-400">{val}</div></div>
              </Card>
            ))}
            <Card className="h-44 overflow-hidden relative" hover={false}>
              <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map location" fill className="object-cover" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
