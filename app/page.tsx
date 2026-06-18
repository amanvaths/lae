import type { Metadata } from "next";
import HomePage from "./home/home-page";

export const metadata: Metadata = {
  title: "LAE — The Decentralized Network Token",
  description:
    "LAE turns the power of networking into a transparent, on-chain rewards economy. Build your network, earn in $LAE, own your growth.",
};

export default function RootPage() {
  return <HomePage />;
}
