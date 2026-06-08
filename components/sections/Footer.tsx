import Link from "next/link";
import { Hexagon, Twitter, Github, Send, MessageCircle } from "lucide-react";

const cols = [
  {
    title: "Protocol",
    links: [
      { label: "About", href: "/#about" },
      { label: "Tokenomics", href: "/#tokenomics" },
      { label: "Network plan", href: "/#network" },
      { label: "Roadmap", href: "/#roadmap" },
      { label: "Whitepaper", href: "/whitepaper" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Whitepaper PDF", href: "/lae-whitepaper.pdf" },
      { label: "Audit report", href: "/whitepaper#security" },
      { label: "Login", href: "/login" },
      { label: "Support", href: "mailto:support@lae.finance" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Twitter / X", href: "#" },
      { label: "Telegram", href: "#" },
      { label: "Discord", href: "#" },
      { label: "Medium", href: "#" },
      { label: "Ambassadors", href: "#" },
    ],
  },
];

const socials = [Twitter, Send, MessageCircle, Github];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
      <div className="container-edge">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <a href="#top" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-600 shadow-glow">
                <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-bold text-white">
                LAE
              </span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              The decentralized network token. Build your network, earn in $LAE,
              own your growth — fully on-chain.
            </p>
            <div className="flex items-center gap-2">
              {socials.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:border-white/25 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-white">{c.title}</p>
              {c.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-slate-400 transition-colors hover:text-brand-300"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>© 2026 LAE Protocol. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
            <Link href="/disclaimer" className="hover:text-slate-300">Disclaimer</Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
          $LAE is a utility token. Nothing on this site is financial advice.
          Crypto assets are volatile and may lose value. Always do your own
          research.
        </p>
      </div>
    </footer>
  );
}
