"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";
import { Loader2, Lock } from "lucide-react";

const ADMIN_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Login failed");
      if (!data.token || typeof data.token !== "string") {
        throw new Error("Invalid server response — missing token");
      }
      localStorage.setItem("lae_admin_token", data.token);
      router.push(withBasePath("/admin/dashboard"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-500/20 bg-white/[0.03] p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <BrandLogo variant="club" size={56} />
          <h1 className="font-display text-xl font-bold text-white">LAE Admin</h1>
          <p className="text-xs text-slate-500">Analytics & protocol management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-brand-500/50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-brand-500/50"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
