"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Matrix", href: "/admin/matrix" },
  { label: "Income", href: "/admin/income" },
  { label: "Rewards", href: "/admin/rewards" },
  { label: "Royal Pool", href: "/admin/royal-pool" },
  { label: "NFTs", href: "/admin/nfts" },
  { label: "Staking", href: "/admin/staking" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("lae_admin_token");
    if (!token) {
      router.replace(withBasePath("/admin"));
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink-950 text-slate-400">
        Verifying admin session…
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-ink-950 text-white">
      <header className="border-b border-white/5 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="club" size={40} />
            <div>
              <p className="font-display font-bold">LAE Admin</p>
              <p className="text-xs text-slate-500">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={withBasePath("/")} className="text-brand-300 hover:text-brand-200">
              View site
            </Link>
            <button
              type="button"
              className="text-slate-400 hover:text-red-300"
              onClick={() => {
                localStorage.removeItem("lae_admin_token");
                router.replace(withBasePath("/admin"));
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row">
        <nav className="flex shrink-0 flex-wrap gap-2 lg:w-48 lg:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={withBasePath(item.href)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith(withBasePath(item.href))
                  ? "bg-brand-500/20 text-brand-200"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
