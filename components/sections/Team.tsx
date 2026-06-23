"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { withBasePath } from "@/lib/paths";

type Member = {
  name: string;
  role: string;
  country: string;
  flag: string;
  image: string;
  featured?: boolean;
};

const team: Member[] = [
  {
    name: "Nicolas Thomas",
    role: "Chief Executive Officer",
    country: "Germany",
    flag: "🇩🇪",
    image: "/team/nicolas-thomas.png",
    featured: true,
  },
  {
    name: "Mr. Bernard Martin",
    role: "Business Development Manager",
    country: "France",
    flag: "🇫🇷",
    image: "/team/bernard-martin.png",
  },
  {
    name: "Lucie Petit",
    role: "Marketing Head",
    country: "Germany",
    flag: "🇩🇪",
    image: "/team/lucie-petit.png",
  },
];

export function Team() {
  return (
    <section id="team" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Leadership"
          title={
            <>
              The team behind{" "}
              <span className="text-gradient-gold">LAE Club</span>
            </>
          }
          description="Experienced leaders driving strategy, growth, and global connections — building meaningful opportunities for the entire community."
        />

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={i}>
              <TiltCard className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-500/20 bg-ink-950 shadow-[0_0_40px_rgba(255,195,26,0.06)] transition-colors duration-500 hover:border-brand-500/40">
                  {/* gold corner accents */}
                  <span className="pointer-events-none absolute left-0 top-0 z-20 h-10 w-10 border-l-2 border-t-2 border-brand-500/50" />
                  <span className="pointer-events-none absolute bottom-0 right-0 z-20 h-10 w-10 border-b-2 border-r-2 border-brand-500/50" />

                  {m.featured && (
                    <span className="absolute right-3 top-3 z-20 rounded-full border border-brand-500/40 bg-ink-950/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-brand-400 backdrop-blur">
                      CEO
                    </span>
                  )}

                  {/* poster */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-ink-900 to-ink-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={withBasePath(m.image)}
                      alt={`${m.name} — ${m.role}`}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35))]" />
                  </div>

                  {/* caption bar */}
                  <div className="relative flex items-center justify-between gap-3 border-t border-white/5 bg-white/[0.02] px-5 py-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold text-white">
                        {m.name}
                      </h3>
                      <p className="truncate text-xs text-brand-400">{m.role}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-slate-300">
                      <span className="text-sm leading-none">{m.flag}</span>
                      {m.country}
                    </span>
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
