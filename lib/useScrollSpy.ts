"use client";

import { useEffect, useState } from "react";

const DEFAULT_SECTIONS = [
  "top",
  "about",
  "tokenomics",
  "network",
  "roadmap",
  "faq",
  "cta",
];

export function useScrollSpy(
  sectionIds: string[] = DEFAULT_SECTIONS,
  offset = 140
) {
  const [active, setActive] = useState(sectionIds[0]);

  useEffect(() => {
    const onScroll = () => {
      let current = sectionIds[0];
      for (const id of sectionIds) {
        if (id === "top") continue;
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionIds, offset]);

  return active;
}

export function sectionFromHref(href: string): string | null {
  const hash = href.includes("#") ? href.split("#")[1] : "";
  if (hash) return hash;
  if (href.endsWith("/") || href.endsWith("/index.html")) return "top";
  return null;
}
