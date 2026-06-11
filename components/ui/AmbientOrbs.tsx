export function AmbientOrbs() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block"
      aria-hidden
    >
      <div className="absolute -left-32 top-[10%] h-[420px] w-[420px] animate-float rounded-full bg-brand-500/[0.06] blur-[100px]" />
      <div
        className="absolute -right-24 top-[35%] h-[360px] w-[360px] rounded-full bg-brand-400/[0.04] blur-[90px]"
        style={{ animation: "float 8s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
