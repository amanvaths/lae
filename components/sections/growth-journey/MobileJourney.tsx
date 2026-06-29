"use client";

import { START_ICON, START_LABEL, TROPHY_ICON } from "./data";
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

function MobilePath() {
  return (
    <svg
      className="pointer-events-none absolute left-[1.35rem] top-6 h-[calc(100%-3rem)] w-8 overflow-visible"
      viewBox="0 0 40 900"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="mobilePathGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <filter id="mobileGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M20,0 C20,80 36,110 20,180 C4,250 4,320 20,390 C36,460 20,520 20,590 C4,660 20,730 20,820 C20,860 20,900 20,900"
        fill="none"
        stroke="url(#mobilePathGlow)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#mobileGlow)"
      />
    </svg>
  );
}

export function MobileJourney() {
  const [club1, club2, club3] = CLUBS;
  const StartIcon = START_ICON;
  const TrophyIcon = TROPHY_ICON;

  return (
    <div className="lg:hidden">
      <JourneyHeader className="px-1" />

      <div className="relative mt-8 pl-[4.25rem] pr-1">
        <MobilePath />

        {/* Start */}
        <div className="relative mb-8 flex items-center gap-3">
          <GoldCircle size="sm" className="absolute -left-[3.35rem]">
            <StartIcon className="h-5 w-5 text-[#FFD700]" />
          </GoldCircle>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFD700]">
            {START_LABEL}
          </p>
        </div>

        {/* 20 months + LAE Club */}
        <div className="relative mb-8">
          <MilestoneBubble months={20} className="absolute -left-[4.6rem] top-2" />
          <ClubCard club={club1} />
          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
            After <span className="font-bold text-[#FFD700]">20 Months</span> in{" "}
            <span className="font-bold text-white">LAE Club</span>,{" "}
            <span className="font-bold text-[#FFD700]">Royal Club</span> will be unlocked.
          </p>
        </div>

        {/* 10 months + Royal Club */}
        <div className="relative mb-8">
          <MilestoneBubble months={10} className="absolute -left-[4.6rem] top-2" />
          <ClubCard club={club2} />
          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
            After <span className="font-bold text-[#FFD700]">10 Months</span> in{" "}
            <span className="font-bold text-white">Royal Club</span>,{" "}
            <span className="font-bold text-[#FFD700]">High Rich Club</span> will be unlocked.
          </p>
        </div>

        {/* Unlimited growth + High Rich Club */}
        <div className="relative mb-8">
          <div className="absolute -left-[4.6rem] top-2">
            <GoldCircle size="sm">
              <TrophyIcon className="h-5 w-5 text-[#FFD700]" />
            </GoldCircle>
          </div>
          <ClubCard club={club3} />
        </div>

        <EndJourneyBlock />
      </div>

      <FeatureBar className="mt-10" />
      <FooterTagline className="mt-6" />
    </div>
  );
}
