import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";

import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Interactive Storytelling Portfolio",
  description: "A cinematic developer portfolio with interactive storytelling, desktop exploration, and inline editing.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Interactive Storytelling Portfolio",
    description: "A cinematic developer portfolio with 3D storytelling, project desktop exploration, and inline editing.",
    images: [
      {
        url: "/images/og-storytelling-portfolio.svg",
        width: 1200,
        height: 630,
        alt: "Interactive Storytelling Portfolio",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Storytelling Portfolio",
    description: "A cinematic developer portfolio with 3D storytelling and a VSCode-style project viewer.",
    images: ["/images/og-storytelling-portfolio.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
