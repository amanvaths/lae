"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon, LogOut, ChevronRight } from "lucide-react";
import { navGroups, utilityItems } from "./nav";
import { user } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-brand-500/20 to-accent-500/10 text-white"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400 shadow-glow" />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4 text-brand-300/70" />}
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-ink-900/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-600 shadow-glow">
            <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <span className="block font-display text-base font-bold text-white">
              B-TITAN
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-brand-300/80">
              Bitcoin Rush
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((it) => (
                <NavLink
                  key={it.href}
                  href={it.href}
                  label={it.label}
                  icon={it.icon}
                  active={isActive(it.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mb-2 border-t border-white/5 pt-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Account
          </p>
          <div className="flex flex-col gap-0.5">
            {utilityItems.map((it) => (
              <NavLink
                key={it.href}
                href={it.href}
                label={it.label}
                icon={it.icon}
                active={isActive(it.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User card */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-sm font-bold text-white">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">
              @{user.username}
            </p>
            <p className="truncate text-xs text-slate-500">{user.id}</p>
          </div>
          <Link
            href="/login"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-red-300"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
