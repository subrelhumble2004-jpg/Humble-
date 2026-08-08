"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import { registerPatient } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await registerPatient(form);
      localStorage.setItem("mqp_token", res.data.data.accessToken);
      localStorage.setItem("mqp_role", "patient");
      router.push("/dashboard/patient");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Check the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-16 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8" hover={false}>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Book and track appointments in minutes.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          <input type="email" required placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          <input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          <input type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <PrimaryButton full type="submit">{loading ? "Creating account…" : "Register"}</PrimaryButton>
        </form>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-5 text-center">
          Already have an account? <a href="/login" className="text-[#16A34A] font-semibold">Log in</a>
        </p>
      </Card>
    </div>
  );
}
