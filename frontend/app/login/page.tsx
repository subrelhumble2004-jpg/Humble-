"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import { login as loginApi } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginApi({ email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("mqp_token", accessToken);
      localStorage.setItem("mqp_role", user.role);
      router.push(user.role === "admin" ? "/dashboard/admin" : user.role === "doctor" ? "/dashboard/doctor" : "/dashboard/patient");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Check the backend is running and your credentials are correct.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-16 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8" hover={false}>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Log in to manage your appointments.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <PrimaryButton full type="submit">{loading ? "Signing in…" : "Log In"}</PrimaryButton>
        </form>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-5 text-center">
          No account? <a href="/register" className="text-[#16A34A] font-semibold">Register</a>
        </p>
        <p className="text-xs text-slate-400 mt-4 text-center">Demo admin: admin@medqueuepro.com / Admin@12345</p>
      </Card>
    </div>
  );
}
