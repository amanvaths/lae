import type { Metadata } from "next";
import { ComingSoonScreen } from "@/components/coming-soon/ComingSoonScreen";

export const metadata: Metadata = {
  title: "Coming Soon — LAE Protocol",
  description: "LAE Protocol launches 22 June 2026. The decentralized network token is almost here.",
};

export default function ComingSoonPage() {
  return <ComingSoonScreen />;
}
