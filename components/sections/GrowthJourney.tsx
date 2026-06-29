"use client";

import { DesktopJourney } from "./growth-journey/DesktopJourney";
import { MobileJourney } from "./growth-journey/MobileJourney";

export function GrowthJourney() {
  return (
    <section
      id="growth"
      className="relative scroll-mt-28 overflow-hidden bg-[#050505] py-10 sm:py-12 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_1px_at_center,rgba(212,175,55,0.05)_0%,transparent_100%)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,black,transparent)]" />
      <div className="container-edge relative">
        <MobileJourney />
        <DesktopJourney />
      </div>
    </section>
  );
}
