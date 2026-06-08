import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { terms } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — LAE Protocol",
  description: "The terms that govern your use of LAE Protocol.",
};

export default function TermsPage() {
  return <LegalPage doc={terms} />;
}
