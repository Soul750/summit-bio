import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { profile } from "@/data/profile";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.tagline}`,
  description: profile.seoDescription,
  openGraph: {
    title: `${profile.name} — Summit Biography`,
    description: profile.seoDescription,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1018",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${jetbrains.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#0c1018] text-[#f2ece1] font-sans selection:bg-[#e39c57]/30 selection:text-[#fff8ed] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
