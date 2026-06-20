"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";

const cols = [
  {
    title: "Protocol",
    links: [
      { label: "About", href: withBasePath("/#about") },
      { label: "Tokenomics", href: withBasePath("/#tokenomics") },
      { label: "Network", href: withBasePath("/#network") },
      { label: "Roadmap", href: withBasePath("/#roadmap") },
      { label: "Whitepaper", href: withBasePath("/whitepaper") },
    ],
  },
  {
    title: "Resource",
    links: [
      { label: "Login", href: withBasePath("/login") },
      { label: "Dashboard", href: withBasePath("/dashboard") },
      // { label: "P2P Market", href: withBasePath("/p2p") }, // hidden for now
      { label: "FAQ", href: withBasePath("/#faq") },
      { label: "Support", href: "mailto:support@lae.finance" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-900 py-16">
      <div className="container-edge">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <a href="#top" className="flex items-center gap-3">
              <BrandLogo />
              <span className="font-display text-lg font-semibold text-white">
                LAE<span className="font-normal text-slate-400"> Club</span>
              </span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Decentralized business networking platform. Matrix income on-chain.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-white">
                {c.title}
              </p>
              {c.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-slate-500 transition-colors hover:text-brand-400"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-white">
              Get Updated
            </p>
            <p className="text-sm text-slate-500">
              Subscribe for network updates and announcements.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                aria-label="Email"
                className="min-w-0 flex-1 border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-brand-500/40"
              />
              <button type="submit" className="btn-primary shrink-0 !px-4 !py-2.5 !text-xs">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-slate-600 sm:flex-row">
          <p>© 2026 LAE Club. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href={withBasePath("/privacy")} className="hover:text-brand-400">Privacy</Link>
            <Link href={withBasePath("/terms")} className="hover:text-brand-400">Terms</Link>
            <Link href={withBasePath("/disclaimer")} className="hover:text-brand-400">Disclaimer</Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
          $LAE is a utility token. Not financial advice. Crypto assets are volatile. DYOR.
        </p>
      </div>
    </footer>
  );
}
