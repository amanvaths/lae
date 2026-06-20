import type { Metadata } from "next";
import HomePage from "./home/home-page";

export const metadata: Metadata = {
  title: "LAE Club — 12-Level Matrix Business",
  description:
    "LAE Club Matrix: 14-spot BTitan system on BNB Chain. Build your team, earn matrix income on-chain, and unlock LAE rewards.",
};

export default function RootPage() {
  return <HomePage />;
}
