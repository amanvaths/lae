import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "LAE — The Decentralized Network Token",
  description:
    "LAE turns the power of networking into a transparent, on-chain rewards economy. Build your network, earn in $LAE, own your growth.",
  keywords: [
    "LAE",
    "web3 token",
    "networking",
    "DeFi",
    "tokenomics",
    "rewards",
  ],
  openGraph: {
    title: "LAE — The Decentralized Network Token",
    description:
      "Build your network, earn in $LAE, own your growth. A transparent on-chain rewards economy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${poppins.variable} grain`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
