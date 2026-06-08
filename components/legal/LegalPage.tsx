import type { LegalDoc } from "@/lib/legal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Footer } from "@/components/sections/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { ShieldCheck } from "lucide-react";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="relative">
      <PageHeader />

      <section className="relative overflow-hidden pt-36 pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[360px] w-[700px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
        </div>
        <div className="container-edge max-w-3xl">
          <Reveal>
            <span className="chip">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
              Legal · LAE Protocol
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {doc.title}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-3 text-sm text-slate-500">
              Last updated {doc.updated}
            </p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              {doc.intro}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-28">
        <div className="container-edge max-w-3xl">
          <div className="glass p-8 sm:p-10">
            <div className="flex flex-col gap-9">
              {doc.sections.map((s, i) => (
                <Reveal key={s.heading} delay={i}>
                  <div>
                    <h2 className="mb-3 font-display text-xl font-semibold text-white">
                      {s.heading}
                    </h2>
                    <div className="flex flex-col gap-3">
                      {s.body.map((p, j) => (
                        <p
                          key={j}
                          className="text-[15px] leading-relaxed text-slate-400"
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
