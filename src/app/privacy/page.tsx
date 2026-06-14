import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy | FindSalonLK",
  description: "Privacy information for FindSalonLK customers, salon owners, bookings, and public salon profiles.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }])} />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">Privacy Policy</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          FindSalonLK uses account, salon, booking, and contact information to operate salon discovery and appointment booking features. Public salon profile information may be visible to visitors.
        </p>
        {[
          ["Information used", "Account details, salon profile data, services, staff records, booking details, phone numbers, and images uploaded for salon profiles may be processed by the app."],
          ["Why it is used", "The app uses this information to authenticate users, show public salon pages, support bookings, and help salon owners manage their listings."],
          ["Owner responsibility", "Salon owners should publish accurate public information and only upload images or details they have the right to use."],
        ].map(([title, text]) => (
          <section key={title} className="mb-7">
            <h2 className="font-display text-2xl font-semibold mb-2">{title}</h2>
            <p className="text-muted-foreground leading-relaxed">{text}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
