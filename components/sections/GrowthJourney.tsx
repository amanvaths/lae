"use client";

import { withBasePath } from "@/lib/paths";

const MOBILE_SRC = withBasePath("/images/growth-journey-mobile.png");
const DESKTOP_SRC = withBasePath("/images/growth-journey-desktop.png");

export function GrowthJourney() {
  return (
    <section
      id="growth"
      className="relative scroll-mt-28 overflow-hidden bg-[#050505] py-6 sm:py-8 lg:py-12"
    >
      {/* Phone — vertical S-curve journey (reference design) */}
      <div className="lg:hidden">
        <img
          src={MOBILE_SRC}
          alt="LAE Club Growth: LAE Club, Royal Club, and High Rich Club journey with entry fees, matrix slots, earning potential, and unlimited growth."
          className="block h-auto w-full"
          width={900}
          height={2400}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Laptop / desktop — horizontal wave journey (reference design) */}
      <div className="hidden lg:block">
        <div className="container-edge overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <img
            src={DESKTOP_SRC}
            alt="LAE Club Growth roadmap: LAE Club Phase 1, Royal Club Phase 2, and High Rich Club Phase 3 with BTC entry fees and ecosystem features."
            className="mx-auto block h-auto w-full min-w-[1024px] max-w-[1400px]"
            width={1920}
            height={900}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
