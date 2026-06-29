"use client";

import { START_ICON, START_LABEL } from "./data";
import {
  CLUBS,
  ClubCard,
  EndJourneyBlock,
  FeatureBar,
  FooterTagline,
  GoldCircle,
  JourneyHeader,
  MilestoneBubble,
} from "./shared";

function DesktopWave() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-[88px] h-[220px] w-full"
      viewBox="0 0 1200 220"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="deskPathGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <filter id="deskGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M20,170 C120,170 140,40 260,35 C380,30 400,185 520,180 C640,175 660,35 780,30 C900,25 920,175 1040,170 C1100,168 1140,120 1180,95"
        fill="none"
        stroke="url(#deskPathGlow)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#deskGlow)"
      />
    </svg>
  );
}

export function DesktopJourney() {
  const [club1, club2, club3] = CLUBS;
  const StartIcon = START_ICON;

  return (
    <div className="hidden lg:block">
      <JourneyHeader />

      <div className="container-edge mt-8 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative mx-auto min-w-[1120px] max-w-[1320px] px-2">
          <DesktopWave />

          <div className="relative grid min-h-[640px] grid-cols-7 gap-3">
            {/* Start column */}
            <div className="flex flex-col items-center justify-end pb-6 pt-24">
              <GoldCircle size="sm">
                <StartIcon className="h-5 w-5 text-[#FFD700]" />
              </GoldCircle>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFD700]">
                {START_LABEL}
              </p>
              <div className="my-3 h-10 w-px border-l border-dashed border-[#D4AF37]/40" />
              <MilestoneBubble months={20} compact />
            </div>

            {/* LAE Club */}
            <div className="flex flex-col items-center pt-2">
              <ClubCard club={club1} variant="desktop" />
            </div>

            {/* 10 months valley */}
            <div className="flex items-end justify-center pb-8 pt-36">
              <MilestoneBubble months={10} compact />
            </div>

            {/* Royal Club */}
            <div className="flex flex-col items-center pt-0">
              <ClubCard club={club2} variant="desktop" />
            </div>

            {/* 5 months valley */}
            <div className="flex items-end justify-center pb-8 pt-36">
              <MilestoneBubble months={5} compact />
            </div>

            {/* High Rich Club */}
            <div className="flex flex-col items-center pt-0">
              <ClubCard club={club3} variant="desktop" />
            </div>

            {/* End */}
            <div className="flex items-center justify-center pt-28">
              <EndJourneyBlock compact />
            </div>
          </div>
        </div>
      </div>

      <FeatureBar className="container-edge mt-6" />
      <FooterTagline className="container-edge mt-6" />
    </div>
  );
}
