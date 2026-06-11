export function LiveTicker() {
  return (
    <div className="relative z-40 overflow-hidden border-b border-brand-500/15 bg-ink-950 py-1.5 text-[0.7rem] text-slate-500">
      <div className="flex w-max animate-marquee items-center gap-10 px-4">
        {[...Array(2)].map((_, k) => (
          <div key={k} className="flex items-center gap-10 whitespace-nowrap">
            <span>● $LAE <strong className="text-brand-400">$0.842</strong> +18.4%</span>
            <span>● ETH Gas 12 gwei</span>
            <span>● Holders 124,800+</span>
            <span>● Rewards $4.2M paid</span>
            <span>● CertiK Audited</span>
            <span>● APY 21.6%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
