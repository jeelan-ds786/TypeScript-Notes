import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClickRipple } from "@/components/click-ripple";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: { default: "FareeWiki", template: "%s | FareeWiki" },
  description: "Practical notes for understanding TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${plexMono.variable}`}>
        {children}
        <ClickRipple />
        <Analytics />
      </body>
    </html>
  );
}
