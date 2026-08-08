import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";

export default function AboutPage() {
  return (
    <div className="py-16 px-5 lg:px-8 min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <SectionHeading eyebrow="ABOUT US" title="Built to end the waiting room"
          sub="MedQueue Pro digitizes hospital appointments and queues so patients spend less time waiting and more time being cared for." />
        <div className="grid md:grid-cols-2 gap-8 mt-12 items-center">
          <div className="relative w-full h-80 rounded-2xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80" alt="Hospital team" fill className="object-cover" />
          </div>
          <div className="space-y-5">
            {[
              ["Our Mission", "Deliver accessible, transparent, and dignified healthcare experiences through technology."],
              ["Our Vision", "To become the benchmark for digital hospital management across West Africa."],
              ["Our Goal", "Cut average patient wait time by 70% within the first year of deployment."],
            ].map(([t, b]) => (
              <div key={t}>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">{t}</h3>
                <p className="text-sm mt-1 text-slate-500 dark:text-slate-400 font-body">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
