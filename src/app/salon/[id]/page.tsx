"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin, Phone, Scissors, Clock, Calendar, User,
  Check, Quote, Star, ChevronRight, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { buildImageUrl } from "@/lib/utils";
import ReviewsList from "@/components/ReviewsList";
import { useAuth } from "@/contexts/AuthContext";
import { salonService } from "@/services/salon.service";
import { barberService } from "@/services/barber.service";
import { bookingService } from "@/services/booking.service";
import type {
  Salon, Barber, SalonGallery,
  SalonService, SalonQuote, WorkingHour, AvailableSlot,
} from "@/interfaces";
import {
  DEMO_SALON_ID, demoSalon, demoBarbers, demoGallery,
  demoServices, demoQuote, demoWorkingHours,
} from "@/data/demoSalon";

export default function SalonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [gallery, setGallery] = useState<SalonGallery[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [quote, setQuote] = useState<SalonQuote | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    addDays(startOfToday(), 1).toISOString().split("T")[0]
  );
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (id === DEMO_SALON_ID) {
      setSalon(demoSalon as Salon);
      setBarbers(demoBarbers as Barber[]);
      setGallery(demoGallery as SalonGallery[]);
      setServices(demoServices as unknown as SalonService[]);
      setQuote(demoQuote as SalonQuote);
      setWorkingHours(demoWorkingHours as WorkingHour[]);
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      const [salonRes, barbersRes, galleryRes, svcRes, quoteRes, hoursRes] =
        await Promise.all([
          salonService.getSalonById(id),
          salonService.getBarbers(id),
          salonService.getGallery(id),
          salonService.getServices(id),
          salonService.getQuote(id),
          salonService.getWorkingHours(id),
        ]);
      setSalon(salonRes.data);
      setBarbers(barbersRes.data || []);
      setGallery(galleryRes.data || []);
      setServices(svcRes.data || []);
      setQuote(quoteRes.data || null);
      setWorkingHours(hoursRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  // Fetch available slots whenever barber, service, or date changes
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate || !id) {
      setAvailableSlots([]);
      return;
    }

    // Demo: generate fake slots based on the selected service's duration
    if (id === DEMO_SALON_ID) {
      const svc = demoServices.find((s) => s.id === selectedService);
      const durationMin = svc?.duration ?? 30;
      const slots: AvailableSlot[] = [];
      const workStart = 9 * 60; // 09:00
      const workEnd = 17 * 60;  // 17:00
      // block out 13:00-14:00 for lunch
      for (let m = workStart; m + durationMin <= workEnd; m += durationMin) {
        if (m >= 13 * 60 && m < 14 * 60) continue;
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const eh = String(Math.floor((m + durationMin) / 60)).padStart(2, "0");
        const em = String((m + durationMin) % 60).padStart(2, "0");
        // pseudo-random: skip ~30% of slots so it looks realistic
        if ((m + selectedBarber.charCodeAt(selectedBarber.length - 1) + selectedDate.charCodeAt(8)) % 3 === 0) continue;
        const isoDate = selectedDate;
        slots.push({
          StartTime: `${isoDate}T${hh}:${mm}:00Z`,
          EndTime: `${isoDate}T${eh}:${em}:00Z`,
          DisplayStart: `${hh}:${mm}`,
          DisplayEnd: `${eh}:${em}`,
        });
      }
      setAvailableSlots(slots);
      setSelectedSlotTime(null);
      return;
    }

    setSlotsLoading(true);
    bookingService
      .getAvailability(selectedBarber, selectedService, selectedDate, true)
      .then(({ data }) => {
        setAvailableSlots(data || []);
        setSelectedSlotTime(null);
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedBarber, selectedService, selectedDate, id]);

  const handleBook = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to book.", variant: "destructive" });
      return;
    }
    if (!selectedSlotTime || !selectedBarber || !selectedService || !id) return;
    setBooking(true);

    if (id === DEMO_SALON_ID) {
      await new Promise((r) => setTimeout(r, 800));
      toast({ title: "Demo booking!", description: "This is a demo salon — no real booking was made." });
      setSelectedSlotTime(null);
      setBookingNotes("");
      setBooking(false);
      return;
    }

    const { error } = await bookingService.directBooking({
      BarberId: selectedBarber,
      SalonId: id,
      ServiceId: selectedService,
      CustomerId: user.id,
      CustomerName: user.full_name || user.email,
      CustomerPhone: user.phone || undefined,
      StartTime: selectedSlotTime,
      Notes: bookingNotes.trim() || undefined,
    });
    if (error) {
      toast({ title: "Booking failed", description: error, variant: "destructive" });
    } else {
      toast({ title: "Booked!", description: "Your appointment is confirmed." });
      setSelectedSlotTime(null);
      setBookingNotes("");
      // Refresh available slots
      bookingService
        .getAvailability(selectedBarber, selectedService, selectedDate, true)
        .then(({ data }) => setAvailableSlots(data || []));
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4">
          <div className="h-64 bg-secondary rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const bookableSlots = availableSlots.filter((slot) => slot.IsAvailable !== false && slot.Status !== "booked" && slot.Status !== "blocked");

  if (!salon) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4 text-center py-20">
          <h2 className="font-display text-2xl font-bold">Salon not found</h2>
        </div>
      </div>
    );
  }

  // Build date-picker options: today+1 through today+7
  const dateOptions = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfToday(), i + 1).toISOString().split("T")[0]
  );

  const selectedServiceObj = services.find((s) => s.id === selectedService);
  const salonImage = buildImageUrl(salon.cover_image_url);
  const salonJsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: salon.name,
    description: salon.description || `Book appointments at ${salon.name} on FindSalonLK.`,
    url: absoluteUrl(`/salon/${salon.id}`),
    ...(salonImage ? { image: salonImage } : {}),
    ...(salon.phone ? { telephone: salon.phone } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address,
      addressLocality: salon.city || salon.area,
      addressRegion: salon.area,
      addressCountry: "LK",
    },
    ...(salon.location
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: salon.location.latitude,
            longitude: salon.location.longitude,
          },
        }
      : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${salon.name} services`,
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        name: service.name,
        price: service.price,
        priceCurrency: "LKR",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description || service.name,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={salonJsonLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Salons", path: "/salons" }, { name: salon.name, path: `/salon/${salon.id}` }])} />
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen min-h-[500px] -mt-16">
        {salon.cover_image_url ? (
          <img
            src={salonImage}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-hero" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight">
              {salon.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {salon.address}, {salon.area}
              </span>
              {salon.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-primary" />
                  {salon.phone}
                </span>
              )}
            </div>
            <Button
              size="lg"
              className="mt-5 gradient-primary text-primary-foreground font-semibold rounded-xl px-8"
              onClick={() =>
                document
                  .getElementById("booking-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Book Now <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      {salon.description && (
        <section className="container mx-auto px-4 py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold mb-4">About Us</h2>
            <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
              {salon.description}
            </p>
          </motion.div>
        </section>
      )}

      {/* QUOTE */}
      {quote && (
        <section className="gradient-hero py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <Quote className="h-10 w-10 text-accent mx-auto mb-4 opacity-80" />
              <blockquote className="font-display text-2xl md:text-3xl font-medium text-primary-foreground italic leading-snug">
                "{quote.text}"
              </blockquote>
              <p className="mt-5 text-primary-foreground/70 font-semibold">
                {quote.author}
              </p>
              <p className="text-primary-foreground/50 text-sm">{quote.role}</p>
            </motion.div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      {services.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <h2 className="font-display text-3xl font-bold mb-2">Our Services</h2>
          <p className="text-muted-foreground mb-8">
            Premium grooming services tailored for you
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-salon transition-shadow border border-border"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <Scissors className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-accent font-bold text-lg">
                    Rs. {service.price}
                  </span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {service.duration} min
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="bg-secondary/40 py-14">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl font-bold mb-2">Gallery</h2>
            <p className="text-muted-foreground mb-8">A glimpse into our work</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gallery.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl overflow-hidden aspect-square group"
                >
                  <img
                    src={buildImageUrl(img.image_url)}
                    alt={img.caption || "Salon"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TEAM & BOOKING */}
      <section id="booking-section" className="container mx-auto px-4 py-14">
        <h2 className="font-display text-3xl font-bold mb-2">Book an Appointment</h2>
        <p className="text-muted-foreground mb-8">Choose your barber, service and time</p>

        {/* ── Step 1: Barber ── */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
            Choose a Barber
          </h3>
          {barbers.length === 0 ? (
            <p className="text-muted-foreground">No barbers added yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {barbers.map((barber, i) => (
                <motion.button
                  key={barber.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setSelectedBarber(barber.id);
                    setSelectedSlotTime(null);
                  }}
                  className={`p-5 rounded-2xl text-left transition-all ${
                    selectedBarber === barber.id
                      ? "gradient-primary text-primary-foreground shadow-salon"
                      : "bg-card shadow-sm hover:shadow-salon border border-border"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                    selectedBarber === barber.id ? "bg-primary-foreground/20" : "bg-secondary"
                  }`}>
                    {barber.image_url ? (
                      <img src={buildImageUrl(barber.image_url)} alt={barber.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className={`h-7 w-7 ${
                        selectedBarber === barber.id ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    )}
                  </div>
                  <h3 className="font-semibold">{barber.name}</h3>
                  {barber.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {barber.specialties.map((s) => (
                        <span key={s} className={`text-xs px-1.5 py-0.5 rounded-full border ${
                          selectedBarber === barber.id
                            ? "border-primary-foreground/30 text-primary-foreground/80"
                            : "border-border text-muted-foreground"
                        }`}>{s}</span>
                      ))}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ── Step 2: Service ── */}
        {selectedBarber && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              Choose a Service
            </h3>
            {services.length === 0 ? (
              <p className="text-muted-foreground">No services listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((svc, i) => (
                  <motion.button
                    key={svc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { setSelectedService(svc.id); setSelectedSlotTime(null); }}
                    className={`p-4 rounded-2xl text-left transition-all ${
                      selectedService === svc.id
                        ? "gradient-primary text-primary-foreground shadow-salon ring-2 ring-primary"
                        : "bg-card shadow-sm hover:shadow-salon border border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight">{svc.name}</h4>
                        {svc.description && (
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            selectedService === svc.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {svc.description}
                          </p>
                        )}
                      </div>
                      {selectedService === svc.id && (
                        <Check className="h-4 w-4 shrink-0 text-primary-foreground mt-0.5" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`font-bold text-base ${
                        selectedService === svc.id ? "text-primary-foreground" : "text-accent"
                      }`}>
                        Rs. {svc.price}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${
                        selectedService === svc.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        <Clock className="h-3 w-3" /> {svc.duration} min
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Date + Available Slots ── */}
        {selectedBarber && selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
              Choose a Date &amp; Time
            </h3>

            {/* Date strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {dateOptions.map((d) => {
                const parsed = parseISO(d);
                const isSelected = d === selectedDate;
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelectedSlotTime(null); }}
                    className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      isSelected
                        ? "gradient-primary text-primary-foreground shadow-salon"
                        : "bg-card border border-border hover:border-primary"
                    }`}
                  >
                    <span className={`text-xs uppercase tracking-wide ${
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {format(parsed, "EEE")}
                    </span>
                    <span className="text-lg font-bold leading-tight">{format(parsed, "d")}</span>
                    <span className={`text-xs ${
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {format(parsed, "MMM")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Slot grid */}
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading available times…
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold text-muted-foreground">No slots available</p>
                <p className="text-sm text-muted-foreground mt-1">Try another date or barber.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {bookableSlots.length} of {availableSlots.length} slot{availableSlots.length !== 1 ? "s" : ""} available
                  {selectedServiceObj ? ` · ${selectedServiceObj.duration} min each` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => {
                    const isUnavailable = slot.IsAvailable === false || slot.Status === "booked" || slot.Status === "blocked";
                    const selected = selectedSlotTime === slot.StartTime;
                    return (
                      <button
                        key={slot.StartTime}
                        disabled={isUnavailable}
                        onClick={() => setSelectedSlotTime(selected ? null : slot.StartTime)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selected
                            ? "gradient-accent text-accent-foreground shadow-sm ring-2 ring-accent"
                            : isUnavailable
                              ? "bg-muted border border-border text-muted-foreground opacity-70 cursor-not-allowed"
                              : "bg-card border border-border hover:border-primary"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 inline mr-1.5" />
                        {slot.DisplayStart} – {slot.DisplayEnd}
                        {isUnavailable && (
                          <span className="ml-2 text-xs">
                            {slot.Status === "booked" ? "Booked" : "Unavailable"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 4: Confirm ── */}
            {selectedSlotTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                {/* Summary card */}
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>{barbers.find((b) => b.id === selectedBarber)?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary" />
                    <span>{selectedServiceObj?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{format(parseISO(selectedDate), "EEE, d MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      {availableSlots.find((s) => s.StartTime === selectedSlotTime)?.DisplayStart}
                      {" – "}
                      {availableSlots.find((s) => s.StartTime === selectedSlotTime)?.DisplayEnd}
                    </span>
                  </div>
                  {selectedServiceObj && (
                    <div className="ml-auto font-bold text-accent">
                      Rs. {selectedServiceObj.price}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
                  <Textarea
                    placeholder="e.g. specific style, preferences…"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    maxLength={500}
                    className="max-w-lg"
                  />
                </div>
                <Button
                  onClick={handleBook}
                  disabled={booking}
                  size="lg"
                  className="gradient-primary text-primary-foreground font-semibold px-8 rounded-xl"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {booking ? "Booking…" : "Confirm Booking"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </section>

      {/* WORKING HOURS & CONTACT */}
      {(workingHours.length > 0 || salon.phone) && (
        <section className="gradient-hero py-14">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              {workingHours.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-display text-2xl font-bold text-primary-foreground mb-5 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" /> Working Hours
                  </h3>
                  <div className="space-y-2">
                    {workingHours.map((wh) => (
                      <div
                        key={wh.day}
                        className="flex justify-between text-primary-foreground/80 text-sm py-1.5 border-b border-primary-foreground/10 last:border-0"
                      >
                        <span className="font-medium">{wh.day}</span>
                        <span
                          className={
                            wh.hours === "Closed" ? "text-destructive" : ""
                          }
                        >
                          {wh.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="font-display text-2xl font-bold text-primary-foreground mb-5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" /> Find Us
                </h3>
                <div className="space-y-3 text-primary-foreground/80 text-sm">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    {salon.address}, {salon.area}, {salon.city}
                  </p>
                  {salon.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-accent shrink-0" />
                      <a
                        href={`tel:${salon.phone}`}
                        className="hover:text-accent transition-colors"
                      >
                        {salon.phone}
                      </a>
                    </p>
                  )}
                </div>
                <Button
                  size="lg"
                  className="mt-6 gradient-accent text-accent-foreground font-semibold rounded-xl"
                  onClick={() =>
                    document
                      .getElementById("booking-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Book an Appointment
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <ReviewsList salonId={salon.id} />

      <footer className="bg-card border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {salon.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
