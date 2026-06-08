import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { disclaimer } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Disclaimer — LAE Protocol",
  description: "Important risk disclosures for LAE Protocol and $LAE.",
};

export default function DisclaimerPage() {
  return <LegalPage doc={disclaimer} />;
}
