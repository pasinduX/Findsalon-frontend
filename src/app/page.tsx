"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Scissors, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd, organizationJsonLd, softwareApplicationJsonLd, websiteJsonLd } from "@/lib/seo";
import { salonService } from "@/services/salon.service";
import type { DistrictDto } from "@/interfaces";

const homepageFaqs = [
  {
    question: "How do I book a salon appointment in Sri Lanka?",
    answer:
      "Search your city or area on FindSalonLK, open a salon profile, choose an available service, barber, date, and time, then confirm the appointment from the booking section.",
  },
  {
    question: "Can salon owners manage more than one salon?",
    answer:
      "Yes. A salon owner account can create and manage multiple salon profiles from the owner dashboard.",
  },
  {
    question: "What can customers compare before booking?",
    answer:
      "Customers can review salon location, services, prices, staff, gallery images, contact details, reviews, and available appointment slots when those details are published.",
  },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const router = useRouter();

  useEffect(() => {
    salonService
      .findAllDistricts()
      .then((response) => {
        if (Array.isArray(response.data)) {
          setDistricts(response.data);
        }
      })
      .finally(() => setLoadingDistricts(false));
  }, []);

  const searchTerm = search.toLowerCase().trim();

  const filteredCities = searchTerm.length > 0
    ? districts
        .flatMap((district) =>
          district.cities.map((city) => ({
            ...city,
            districtName: district.name,
          }))
        )
        .filter((city) => city.name.toLowerCase().includes(searchTerm))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(homepageFaqs)} />
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full gradient-hero" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-4">
              Book Your Perfect
              <span className="text-gradient block">Salon Experience</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Find the best salons across Sri Lanka. Browse barbers, pick your time, and book instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-lg mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your area... (e.g. Colombo)"
                className="pl-12 h-14 text-lg bg-card/95 backdrop-blur border-0 shadow-salon rounded-xl"
              />
            </div>

            {search && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-card rounded-xl shadow-salon overflow-x-hidden overflow-y-auto max-h-72"
              >
                {filteredCities.map((city) => (
                  <button
                    key={`${city.districtName}-${city.id}`}
                    onClick={() => router.push(`/salons?area=${encodeURIComponent(city.name)}`)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{city.name}</span>
                  </button>
                ))}
                {filteredCities.length === 0 && (
                  <p className="px-4 py-3 text-muted-foreground text-sm">No areas found</p>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find and book your ideal salon in just 3 simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: MapPin, title: "Choose Your Area", desc: "Browse salons across all major cities in Sri Lanka" },
            { icon: Scissors, title: "Pick Your Barber", desc: "View available barbers, their specialties and reviews" },
            { icon: Clock, title: "Book Instantly", desc: "Select your preferred time slot and confirm your booking" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-salon text-center hover:shadow-card-hover transition-shadow"
            >
              <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
                <feature.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Browse by Area */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-10">Browse by Area</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {loadingDistricts ? (
              <div className="col-span-full rounded-xl p-6 bg-card/80 text-center text-sm text-muted-foreground">
                Loading districts...
              </div>
            ) : districts.length > 0 ? (
              districts.map((district) => (
                <Link key={district.id} href={`/salons?area=${encodeURIComponent(district.name)}`}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-card rounded-xl p-4 text-center shadow-sm hover:shadow-salon transition-all cursor-pointer"
                  >
                    <MapPin className="h-5 w-5 text-accent mx-auto mb-2" />
                    <span className="text-sm font-medium block mb-1">{district.name}</span>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-xl p-6 bg-card/80 text-center text-sm text-muted-foreground">
                No districts available.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Answer Engine Content */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Salon booking answers
          </h2>
          <p className="text-muted-foreground">
            Quick answers for people searching for salon appointments, barber shops, and beauty salons in Sri Lanka.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {homepageFaqs.map((item) => (
            <div key={item.question} className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for salon owners */}
      <section className="py-20 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-primary rounded-3xl p-12 md:p-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Own a Salon?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Create your salon page, manage barbers and schedules, showcase your gallery — all in one place.
          </p>
          <Link href="/auth?role=owner">
            <Button size="lg" className="gradient-accent text-accent-foreground font-semibold px-8 rounded-xl">
              <Star className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-3">
          <p>© {new Date().getFullYear()} FindSalonLK. Find your perfect salon in Sri Lanka.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/city/colombo">Salons in Colombo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
