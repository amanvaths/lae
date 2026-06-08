import type { Metadata } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrains.variable} grain`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
