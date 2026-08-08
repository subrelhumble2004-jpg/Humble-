import SectionHeading from "@/components/SectionHeading";
import DepartmentCard from "@/components/DepartmentCard";
import { DEPARTMENTS } from "@/lib/data";

export default function DepartmentsPage() {
  return (
    <div className="py-16 px-5 lg:px-8 min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow="OUR SERVICES" title="Departments" sub="Comprehensive care across twelve specialties." />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-12">
          {DEPARTMENTS.map((d) => <DepartmentCard key={d.name} dept={d} />)}
        </div>
      </div>
    </div>
  );
}
