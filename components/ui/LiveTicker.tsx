export function LiveTicker() {
  return (
    <div className="relative z-40 overflow-hidden border-b border-brand-500/15 bg-ink-950 py-1.5 text-[0.7rem] text-slate-500">
      <div className="flex w-max animate-marquee items-center gap-10 px-4">
        {[...Array(2)].map((_, k) => (
          <div key={k} className="flex items-center gap-10 whitespace-nowrap">
            <span>● $LAE <strong className="text-brand-400">$0.10</strong> launch</span>
            <span>● Supply 500,000 LAE</span>
            <span>● 90% community rewards</span>
            <span>● 15-slot smart matrix</span>
            <span>● BNB Chain</span>
            <span>● 0.001 BTC / registration</span>
          </div>
        ))}
      </div>
    </div>
  );
}
