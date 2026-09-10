"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/Button";
import { registerPatient } from "@/lib/api";
export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      console.log("Sending registration request...");
      console.log(
        "API URL:",
        process.env.NEXT_PUBLIC_API_URL ||
          "https://medqueue-pro-backend.onrender.com/api"
      );
      const res = await registerPatient({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      console.log("Registration response:", res.data);
      const accessToken = res.data?.data?.accessToken;
      if (!accessToken) {
        throw new Error(
          "Registration succeeded, but no login token was returned."
        );
      }
      localStorage.setItem("mqp_token", accessToken);
      localStorage.setItem("mqp_role", "patient");
      router.push("/dashboard/patient");
    } catch (err: any) {
      console.error("REGISTRATION ERROR:", err);
      if (err?.response) {
        console.error("Status:", err.response.status);
        console.error("Response:", err.response.data);
        setError(
          err.response.data?.message ||
            `Server error (${err.response.status}).`
        );
      } else if (err?.request) {
        console.error(
          "Request was sent but no response was received:",
          err.request
        );
        setError(
          "The request was sent, but the backend did not respond. Please check the Render backend connection."
        );
      } else {
        console.error("Request setup error:", err?.message);
        setError(
          err?.message ||
            "Unable to send registration request. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-16 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8" hover={false}>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Book and track appointments in minutes.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm({
                ...form,
                fullName: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Password (minimum 8 characters)"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2.5 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <PrimaryButton full type="submit">
            {loading ? "Creating account…" : "Register"}
          </PrimaryButton>
        </form>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-5 text-center">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#16A34A] font-semibold"
          >
            Log in
          </a>
        </p>
      </Card>
    </div>
  );
}
