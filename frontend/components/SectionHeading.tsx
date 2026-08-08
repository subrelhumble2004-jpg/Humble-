import Badge from "./ui/Badge";

export default function SectionHeading({ eyebrow, title, sub, center = true }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center max-w-2xl mx-auto" : ""}>
      <Badge tone="primary">{eyebrow}</Badge>
      <h2 className="mt-4 text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white">{title}</h2>
      {sub && <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400 font-body">{sub}</p>}
    </div>
  );
}
