"use client";

import { ArrowRight } from "lucide-react";
import { withBasePath } from "@/lib/paths";
import { enableSitePreview } from "@/lib/site-gate";

export function PreviewSiteButton() {
  const enterSite = () => {
    enableSitePreview();
    window.location.href = withBasePath("/");
  };

  return (
    <button
      type="button"
      onClick={enterSite}
      className="btn-primary group w-full justify-center !px-5 !py-3 !text-xs sm:w-auto sm:!py-2.5"
    >
      Preview site
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}
