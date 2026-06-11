export function TopBar() {
  return (
    <div className="hidden border-b border-white/5 bg-ink-900 md:block">
      <div className="container-edge flex h-10 items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-6">
          <span>Live on Ethereum · BNB · Polygon</span>
          <a href="mailto:support@lae.finance" className="transition-colors hover:text-brand-400">
            support@lae.finance
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#cta" className="transition-colors hover:text-brand-400" aria-label="Twitter">
            X
          </a>
          <a href="#cta" className="transition-colors hover:text-brand-400" aria-label="Telegram">
            TG
          </a>
          <a href="#faq" className="transition-colors hover:text-brand-400">
            FAQ
          </a>
        </div>
      </div>
    </div>
  );
}
