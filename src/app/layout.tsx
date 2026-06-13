import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FindSalonLK — Find & Book Salons in Sri Lanka",
  description:
    "Browse the best salons across Sri Lanka. Find barbers, pick your time, and book instantly.",
  openGraph: {
    title: "FindSalonLK",
    description: "Find and book your ideal salon in Sri Lanka.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
