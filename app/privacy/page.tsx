import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { privacy } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — LAE Protocol",
  description: "How LAE Protocol collects and uses information.",
};

export default function PrivacyPage() {
  return <LegalPage doc={privacy} />;
}
