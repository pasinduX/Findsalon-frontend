"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
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
  const serviceStepRef = useRef<HTMLDivElement | null>(null);
  const barberStepRef = useRef<HTMLDivElement | null>(null);
  const timeStepRef = useRef<HTMLDivElement | null>(null);
  const confirmStepRef = useRef<HTMLDivElement | null>(null);

  const scrollToStep = (ref: RefObject<HTMLDivElement | null>, delay = 120) => {
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, delay);
  };

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
  const selectedBarberObj = barbers.find((b) => b.id === selectedBarber);
  const selectedSlotObj = availableSlots.find((s) => s.StartTime === selectedSlotTime);
  const bookingStep = selectedSlotTime ? 4 : selectedBarber ? 3 : selectedService ? 2 : 1;
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
      <section id="booking-section" className="bg-secondary/30 py-14 md:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Online appointment</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Book an Appointment</h2>
              <p className="text-muted-foreground mt-2">Choose a service, barber, date, and available time.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    bookingStep >= step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] lg:items-start">
            <div className="min-w-0 space-y-5">
              {/* Step 1: Service */}
              <div ref={serviceStepRef} className="scroll-mt-24 rounded-lg border border-border bg-background p-4 md:p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-3 text-base font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">1</span>
                  Select service
                </h3>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services listed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {services.map((svc, i) => (
                      <motion.button
                        key={svc.id}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                          setSelectedService(svc.id);
                          setSelectedSlotTime(null);
                          scrollToStep(barberStepRef);
                        }}
                        className={`min-h-[116px] rounded-lg border p-4 text-left transition-all ${
                          selectedService === svc.id
                            ? "border-primary bg-primary text-primary-foreground shadow-salon"
                            : "border-border bg-card hover:border-primary/50 hover:shadow-salon"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold leading-tight">{svc.name}</h4>
                            {svc.description && (
                              <p className={`mt-1 line-clamp-2 text-xs ${
                                selectedService === svc.id ? "text-primary-foreground/75" : "text-muted-foreground"
                              }`}>
                                {svc.description}
                              </p>
                            )}
                          </div>
                          {selectedService === svc.id && <Check className="mt-0.5 h-5 w-5 shrink-0" />}
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className={`font-bold ${selectedService === svc.id ? "" : "text-accent"}`}>
                            Rs. {svc.price}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${
                            selectedService === svc.id ? "text-primary-foreground/75" : "text-muted-foreground"
                          }`}>
                            <Clock className="h-3.5 w-3.5" />
                            {svc.duration} min
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Barber */}
              <div ref={barberStepRef} className={`scroll-mt-24 rounded-lg border border-border bg-background p-4 md:p-6 shadow-sm ${!selectedService ? "opacity-75" : ""}`}>
                <h3 className="mb-4 flex items-center gap-3 text-base font-semibold">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    selectedService ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>2</span>
                  Select barber
                </h3>
                {!selectedService ? (
                  <p className="text-sm text-muted-foreground">Choose a service first to continue.</p>
                ) : barbers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No barbers added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {barbers.map((barber, i) => (
                      <motion.button
                        key={barber.id}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                          setSelectedBarber(barber.id);
                          setSelectedSlotTime(null);
                          scrollToStep(timeStepRef);
                        }}
                        className={`flex min-h-[92px] items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                          selectedBarber === barber.id
                            ? "border-primary bg-primary text-primary-foreground shadow-salon"
                            : "border-border bg-card hover:border-primary/50 hover:shadow-salon"
                        }`}
                      >
                        <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-full ${
                          selectedBarber === barber.id ? "bg-primary-foreground/20" : "bg-secondary"
                        }`}>
                          {barber.image_url ? (
                            <img src={buildImageUrl(barber.image_url)} alt={barber.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User className={`h-6 w-6 ${
                                selectedBarber === barber.id ? "text-primary-foreground" : "text-muted-foreground"
                              }`} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="truncate font-semibold">{barber.name}</h4>
                            {selectedBarber === barber.id && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                          </div>
                          {barber.specialties?.length > 0 && (
                            <p className={`mt-1 line-clamp-1 text-xs ${
                              selectedBarber === barber.id ? "text-primary-foreground/75" : "text-muted-foreground"
                            }`}>
                              {barber.specialties.join(", ")}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Date and time */}
              <div ref={timeStepRef} className={`scroll-mt-24 min-w-0 rounded-lg border border-border bg-background p-4 md:p-6 shadow-sm ${!selectedBarber ? "opacity-75" : ""}`}>
                <h3 className="mb-4 flex items-center gap-3 text-base font-semibold">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    selectedBarber ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>3</span>
                  Pick date and time
                </h3>
                {!selectedBarber ? (
                  <p className="text-sm text-muted-foreground">Choose a barber to see available appointment times.</p>
                ) : (
                  <>
                    <div className="-mx-1 mb-5 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
                      {dateOptions.map((d) => {
                        const parsed = parseISO(d);
                        const isSelected = d === selectedDate;
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              setSelectedDate(d);
                              setSelectedSlotTime(null);
                              scrollToStep(timeStepRef, 80);
                            }}
                            className={`min-w-[68px] shrink-0 snap-start rounded-lg border px-2 py-3 text-center transition-all sm:min-w-[78px] sm:px-3 ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-salon"
                                : "border-border bg-card hover:border-primary/50"
                            }`}
                          >
                            <span className={`block text-xs uppercase ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(parsed, "EEE")}
                            </span>
                            <span className="block text-xl font-bold leading-tight">{format(parsed, "d")}</span>
                            <span className={`block text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(parsed, "MMM")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {slotsLoading ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Loading available times...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded-lg border border-border bg-card p-6 text-center">
                        <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                        <p className="font-semibold text-muted-foreground">No slots available</p>
                        <p className="mt-1 text-sm text-muted-foreground">Try another date or barber.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {bookableSlots.length} of {availableSlots.length} slot{availableSlots.length !== 1 ? "s" : ""} available
                          {selectedServiceObj ? ` · ${selectedServiceObj.duration} min each` : ""}
                        </p>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fit,minmax(132px,1fr))]">
                          {availableSlots.map((slot) => {
                            const isUnavailable = slot.IsAvailable === false || slot.Status === "booked" || slot.Status === "blocked";
                            const selected = selectedSlotTime === slot.StartTime;
                            return (
                              <button
                                key={slot.StartTime}
                                disabled={isUnavailable}
                                onClick={() => {
                                  setSelectedSlotTime(selected ? null : slot.StartTime);
                                  if (!selected) scrollToStep(confirmStepRef);
                                }}
                                className={`min-h-[58px] min-w-0 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all ${
                                  selected
                                    ? "border-accent bg-accent text-accent-foreground shadow-sm"
                                    : isUnavailable
                                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-70"
                                      : "border-border bg-card hover:border-primary/50"
                                }`}
                              >
                                <span className="block truncate">{slot.DisplayStart}</span>
                                <span className={`block text-xs font-normal ${
                                  selected ? "text-accent-foreground/75" : "text-muted-foreground"
                                }`}>
                                  {isUnavailable ? (slot.Status === "booked" ? "Booked" : "Unavailable") : `to ${slot.DisplayEnd}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Step 4: Confirm */}
              <div ref={confirmStepRef} className={`scroll-mt-24 min-w-0 rounded-lg border border-border bg-background p-4 md:p-6 shadow-sm ${!selectedSlotTime ? "opacity-75" : ""}`}>
                <h3 className="mb-4 flex items-center gap-3 text-base font-semibold">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    selectedSlotTime ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>4</span>
                  Confirm booking
                </h3>
                {!selectedSlotTime ? (
                  <p className="text-sm text-muted-foreground">Pick an available time slot to confirm your appointment.</p>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
                      <Textarea
                        placeholder="Specific style, preferences, or anything the barber should know"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        maxLength={500}
                        className="min-h-[96px]"
                      />
                    </div>
                    {!user && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        Please sign in before confirming this appointment.
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        onClick={handleBook}
                        disabled={booking}
                        size="lg"
                        className="h-12 w-full rounded-xl gradient-primary font-semibold text-primary-foreground sm:w-auto sm:min-w-[190px] sm:px-8"
                      >
                        <Check className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">{booking ? "Booking..." : "Confirm Booking"}</span>
                      </Button>
                      {selectedServiceObj && selectedSlotObj && (
                        <p className="text-center text-xs text-muted-foreground sm:text-left">
                          {selectedSlotObj.DisplayStart} - {selectedSlotObj.DisplayEnd} · Rs. {selectedServiceObj.price}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <aside className="min-w-0 lg:sticky lg:top-24">
              <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-background p-4 shadow-salon sm:p-5">
                <h3 className="font-display text-xl font-semibold">Booking summary</h3>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex min-w-0 items-start gap-3">
                    <Scissors className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Service</p>
                      <p className="break-words font-medium">{selectedServiceObj?.name || "Not selected"}</p>
                      {selectedServiceObj && <p className="break-words text-muted-foreground">Rs. {selectedServiceObj.price} · {selectedServiceObj.duration} min</p>}
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Barber</p>
                      <p className="break-words font-medium">{selectedBarberObj?.name || "Not selected"}</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                      <p className="break-words font-medium">{format(parseISO(selectedDate), "EEE, d MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
                      <p className="break-words font-medium">
                        {selectedSlotObj ? `${selectedSlotObj.DisplayStart} - ${selectedSlotObj.DisplayEnd}` : "Not selected"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                  Your appointment is only created after tapping Confirm Booking.
                </div>
              </div>
            </aside>
          </div>
        </div>
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
