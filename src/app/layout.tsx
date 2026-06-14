import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { brandImageUrl, createMetadata, siteName, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: brandImageUrl,
    shortcut: brandImageUrl,
    apple: brandImageUrl,
  },
  ...createMetadata({
    title: "FindSalonLK | Book Salons and Barbers in Sri Lanka",
  }),
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
