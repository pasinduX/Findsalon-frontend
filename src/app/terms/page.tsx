import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Use | FindSalonLK",
  description: "Terms for using FindSalonLK public salon search, salon owner profiles, and appointment booking features.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }])} />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">Terms of Use</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          By using FindSalonLK, customers and salon owners agree to use the platform responsibly and keep booking and listing information accurate.
        </p>
        {[
          ["Bookings", "Appointment availability and salon services are managed by salon owners. Customers should review the selected salon, service, barber, date, and time before confirming a booking."],
          ["Salon listings", "Salon owners are responsible for the accuracy of names, descriptions, phone numbers, images, services, prices, and staff details they publish."],
          ["Platform use", "Do not misuse account access, submit false information, or upload content that you do not have permission to publish."],
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
