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
  title: "LAE Club — 12-Level Matrix Business",
  description:
    "LAE Club MatrixCore on BNB Chain: 14-position matrix, on-chain income, and LAE reward layer. Build your team at laeclub.com.",
  keywords: [
    "LAE Club",
    "matrix",
    "BNB Chain",
    "referral",
    "web3",
    "laeclub.com",
  ],
  icons: {
    icon: "/lae-club-logo.png",
    apple: "/lae-club-logo.png",
  },
  openGraph: {
    title: "LAE Club — 12-Level Matrix Business",
    description:
      "Join the LAE Club Matrix — transparent 14-spot, 15-level business on BNB Chain.",
    type: "website",
    images: [
      {
        url: "/lae-club-logo.png",
        width: 512,
        height: 512,
        alt: "LAE Club logo",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
