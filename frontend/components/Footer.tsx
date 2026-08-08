import Link from "next/link";
import { FiActivity, FiPhone, FiMail, FiMapPin, FiSend } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="border-t pt-16 pb-8 px-5 lg:px-8 bg-slate-900 border-slate-800 text-slate-400">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}><FiActivity size={18} /></div>
            <span className="font-display font-bold text-white">MedQueue<span className="text-[#16A34A]">Pro</span></span>
          </div>
          <p className="text-sm leading-relaxed">Reducing hospital waiting times through smart, real-time appointment and queue management.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm font-utility">QUICK LINKS</h4>
          <ul className="space-y-2.5 text-sm">
            {[["About", "/about"], ["Doctors", "/doctors"], ["Departments", "/departments"], ["Book Appointment", "/appointments"]].map(([l, href]) => (
              <li key={href}><Link href={href} className="hover:text-white transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm font-utility">CONTACT</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><FiPhone size={14} /> +234 803 000 0000</li>
            <li className="flex items-center gap-2"><FiMail size={14} /> care@medqueuepro.com</li>
            <li className="flex items-center gap-2"><FiMapPin size={14} /> Ideato, Imo State, Nigeria</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm font-utility">NEWSLETTER</h4>
          <div className="flex gap-2">
            <input placeholder="Your email" className="min-w-0 flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
            <button className="rounded-lg px-3 py-2 text-white" style={{ background: "linear-gradient(135deg,#0F4C81,#16A34A)" }}><FiSend size={16} /></button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row gap-3 justify-between text-xs">
        <div>© 2026 MedQueuePro. All rights reserved. · Privacy Policy · Terms</div>
        <div>Designed &amp; Developed by <span className="text-slate-200">Onu Confidence Chiemeria</span> · Sponsored by <span className="text-slate-200">Dr. Anoke Fabian Amaechi</span></div>
      </div>
    </footer>
  );
}
