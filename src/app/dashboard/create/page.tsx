"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { salonService } from "@/services/salon.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { DistrictDto, SalonLocation } from "@/interfaces";
import {
  Scissors, MapPin, Phone, FileText, Building2,
  CheckCircle2, ArrowRight, Users, Calendar, Star, ChevronDown,
  Navigation2, Search, X,
} from "lucide-react";
import Link from "next/link";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const SRI_LANKA_AREAS = [
  "Colombo", "Kandy", "Galle", "Negombo", "Jaffna", "Matara",
  "Kurunegala", "Batticaloa", "Anuradhapura", "Ratnapura",
  "Nuwara Eliya", "Trincomalee", "Badulla", "Kalutara", "Gampaha",
];

const NEXT_STEPS = [
  { icon: Users, title: "Add Your Barbers", desc: "Invite staff and let them manage their own schedules" },
  { icon: Calendar, title: "Set Time Slots", desc: "Define your availability so customers can book instantly" },
  { icon: Star, title: "Start Getting Reviews", desc: "Build credibility as happy customers leave ratings" },
];

// Sri Lanka center
const SL_CENTER = { lat: 7.8731, lng: 80.7718 };

// Approximate center coordinates for each Sri Lanka district.
// Used to bias the Places Autocomplete search toward the selected district.
const DISTRICT_CENTERS: Record<string, { lat: number; lng: number; radius: number }> = {
  Colombo:        { lat: 6.9271,  lng: 79.8612, radius: 15000 },
  Gampaha:        { lat: 7.0873,  lng: 80.0144, radius: 25000 },
  Kalutara:       { lat: 6.5854,  lng: 80.0028, radius: 30000 },
  Kandy:          { lat: 7.2906,  lng: 80.6337, radius: 20000 },
  Matale:         { lat: 7.4675,  lng: 80.6234, radius: 20000 },
  "Nuwara Eliya": { lat: 6.9497,  lng: 80.7891, radius: 20000 },
  Galle:          { lat: 6.0535,  lng: 80.2210, radius: 25000 },
  Matara:         { lat: 5.9549,  lng: 80.5550, radius: 25000 },
  Hambantota:     { lat: 6.1429,  lng: 81.1212, radius: 30000 },
  Jaffna:         { lat: 9.6615,  lng: 80.0255, radius: 25000 },
  Kilinochchi:    { lat: 9.3803,  lng: 80.3770, radius: 25000 },
  Mannar:         { lat: 8.9810,  lng: 79.9044, radius: 25000 },
  Vavuniya:       { lat: 8.7514,  lng: 80.4971, radius: 25000 },
  Mullaitivu:     { lat: 9.2671,  lng: 80.8128, radius: 25000 },
  Batticaloa:     { lat: 7.7102,  lng: 81.6924, radius: 25000 },
  Ampara:         { lat: 7.2992,  lng: 81.6747, radius: 30000 },
  Trincomalee:    { lat: 8.5874,  lng: 81.2152, radius: 25000 },
  Kurunegala:     { lat: 7.4818,  lng: 80.3609, radius: 30000 },
  Puttalam:       { lat: 8.0362,  lng: 79.8283, radius: 30000 },
  Anuradhapura:   { lat: 8.3114,  lng: 80.4037, radius: 30000 },
  Polonnaruwa:    { lat: 7.9403,  lng: 81.0188, radius: 25000 },
  Badulla:        { lat: 6.9934,  lng: 81.0550, radius: 25000 },
  Monaragala:     { lat: 6.8728,  lng: 81.3507, radius: 30000 },
  Ratnapura:      { lat: 6.7056,  lng: 80.3847, radius: 25000 },
  Kegalle:        { lat: 7.2513,  lng: 80.3464, radius: 20000 },
  Negombo:        { lat: 7.2095,  lng: 79.8380, radius: 15000 },
};

// ─── Reverse geocode helper ───────────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const json = await res.json();
    return (json.results?.[0]?.formatted_address as string) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ─── Autocomplete search box (lives inside APIProvider) ───────────────────────
function PlacesSearchBox({
  onSelect,
  area,
}: {
  onSelect: (lat: number, lng: number, address: string) => void;
  area?: string;
}) {
  const map = useMap();
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    autocompleteRef.current = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "lk" },
      fields: ["geometry", "formatted_address"],
    });
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address ?? "";
      map?.panTo({ lat, lng });
      map?.setZoom(16);
      onSelect(lat, lng, address);
    });
  }, [places, map, onSelect]);

  // Update location bias whenever the selected district changes
  useEffect(() => {
    if (!autocompleteRef.current || !area) return;
    const center = DISTRICT_CENTERS[area];
    if (!center) return;
    const circle = new google.maps.Circle({
      center: { lat: center.lat, lng: center.lng },
      radius: center.radius,
    });
    autocompleteRef.current.setBounds(circle.getBounds()!);
    autocompleteRef.current.setOptions({ strictBounds: false });
    // Pan the map to the district when it's selected
    map?.panTo({ lat: center.lat, lng: center.lng });
    map?.setZoom(11);
  }, [area, map]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        placeholder={area ? `Search in ${area}…` : "Search for your salon address…"}
        className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

// ─── Map picker component ─────────────────────────────────────────────────────
interface LocationPickerProps {
  value: SalonLocation | null;
  onChange: (loc: SalonLocation | null) => void;
  area?: string;
}

function LocationPicker({ value, onChange, area }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!e.detail.latLng) return;
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setLoading(true);
      const address = await reverseGeocode(lat, lng);
      onChange({ latitude: lat, longitude: lng, address });
      setLoading(false);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (lat: number, lng: number, address: string) => {
      onChange({ latitude: lat, longitude: lng, address });
    },
    [onChange]
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center space-y-2">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Map unavailable</p>
        <p className="text-xs text-muted-foreground">
          Add <code className="bg-muted px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-muted px-1 rounded">.env</code> to enable the map picker.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <PlacesSearchBox onSelect={handleSelect} area={area} />

        <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 300 }}>
          <Map
            defaultCenter={SL_CENTER}
            defaultZoom={7}
            mapId="findsalonlk-picker"
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
          >
            {value && (
              <AdvancedMarker position={{ lat: value.latitude, lng: value.longitude }}>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg ring-2 ring-white">
                    <Scissors className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary mt-0.5 opacity-50" />
                </div>
              </AdvancedMarker>
            )}
          </Map>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Getting address…
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
            <p className="text-xs text-center bg-background/80 backdrop-blur-sm rounded-lg py-1 px-2 text-muted-foreground">
              Click anywhere on the map to drop your salon pin
            </p>
          </div>
        </div>
      </APIProvider>

      {value && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <Navigation2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary mb-0.5">Location pinned</p>
            <p className="text-xs text-muted-foreground truncate">{value.address}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label="Remove pin"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateSalonPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [city, setCity] = useState("");
  const [cityId, setCityId] = useState("");
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<SalonLocation | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      const response = await salonService.findAllDistricts();
      if (Array.isArray(response.data)) setDistricts(response.data);
      setLoadingDistricts(false);
    };
    fetchDistricts();
  }, []);

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.name === area),
    [districts, area]
  );

  useEffect(() => {
    if (!selectedDistrict) {
      setCity("");
      setCityId("");
      setDistrictId("");
    } else {
      setDistrictId(String(selectedDistrict.id));
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setCityOpen(false);
        setDistrictOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-fill the street address field when a map location is selected
  useEffect(() => {
    if (location?.address && !address.trim()) {
      setAddress(location.address);
    }
  }, [location, address]);

  const isValid = name.trim() && area && districtId && city && cityId && address.trim();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) return;
    setLoading(true);

    const { error } = await salonService.createSalon({
      OwnerId: user.id,
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim(),
      area,
      districtId,
      districtName: area,
      city: city.trim(),
      cityId,
      phone: phone.trim() || null,
      location: location ?? undefined,
    });

    if (error) {
      toast({ title: "Could not create salon", description: error, variant: "destructive" });
      setLoading(false);
    } else {
      toast({
        title: "Salon created!",
        description: location ? "Location saved — customers can navigate to you." : "You can add a map location later from settings.",
      });
      const { data: salon } = await salonService.getMySalon(user!.id);
      router.push(salon ? `/salon/${salon.id}` : "/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">FindSalonLK</span>
          </Link>
          <p className="text-xs text-muted-foreground">Salon Registration</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* ── Left: form ── */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <p className="text-primary font-medium text-sm mb-1">Step 1 of 1</p>
              <h1 className="font-display text-3xl font-bold mb-2">Set up your salon</h1>
              <p className="text-muted-foreground">
                Fill in your salon details. You can update everything later from your dashboard.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6" noValidate>
              {/* Basic info */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Basic Information
                </h2>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Salon Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elegant Cuts Salon"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Description
                    <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell customers what makes your salon special…"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </section>

              {/* Location */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h2>

                <div ref={wrapperRef} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="area">Area / District <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setDistrictOpen((p) => !p); setCityOpen(false); }}
                        className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <span className={area ? undefined : "text-muted-foreground"}>
                          {area || (loadingDistricts ? "Loading districts…" : "Select district")}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>

                      {districtOpen && (
                        <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-input bg-card shadow-lg">
                          {loadingDistricts ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">Loading…</div>
                          ) : districts.length > 0 ? (
                            districts.map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => { setArea(d.name); setDistrictId(String(d.id)); setDistrictOpen(false); setCity(""); setCityId(""); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/80 transition-colors"
                              >
                                {d.name}
                              </button>
                            ))
                          ) : (
                            SRI_LANKA_AREAS.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => { setArea(a); setDistrictOpen(false); setCity(""); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/80 transition-colors"
                              >
                                {a}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setCityOpen((p) => !p); setDistrictOpen(false); }}
                        disabled={!selectedDistrict}
                        className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span className={city ? undefined : "text-muted-foreground"}>
                          {city || (selectedDistrict ? "Select city" : "Select district first")}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>

                      {cityOpen && selectedDistrict && (
                        <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-input bg-card shadow-lg">
                          {selectedDistrict.cities.map((co) => (
                            <button
                              key={co.id}
                              type="button"
                              onClick={() => { setCity(co.name); setCityId(String(co.id)); setCityOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/80 transition-colors"
                            >
                              {co.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!selectedDistrict && (
                      <p className="text-xs text-muted-foreground">Choose a district first to select a city.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Street Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 42 Galle Road, Colombo 03"
                    className="h-11"
                    required
                  />
                </div>

                {/* Map picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Navigation2 className="h-3.5 w-3.5" />
                      Pin on Map
                      <span className="text-muted-foreground font-normal text-xs">(optional — lets customers navigate to you)</span>
                    </Label>
                  </div>
                  <LocationPicker value={location} onChange={setLocation} area={area} />
                </div>
              </section>

              {/* Contact */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Contact
                </h2>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone Number
                    <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 011 234 5678"
                    className="h-11"
                  />
                </div>
              </section>

              <Button
                type="submit"
                className="w-full h-12 gradient-primary text-primary-foreground font-semibold gap-2 text-sm"
                disabled={loading || !isValid}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating your salon…
                  </span>
                ) : (
                  <>Create Salon <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating a salon you agree to our{" "}
                <Link href="#" className="underline hover:text-foreground">Terms of Service</Link>.
              </p>
            </form>
          </div>

          {/* ── Right: what's next ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card rounded-2xl p-6 shadow-salon space-y-5">
                <h3 className="font-display text-lg font-semibold">What happens next?</h3>
                <div className="space-y-4">
                  {NEXT_STEPS.map(({ icon: Icon, title, desc }, i) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary-foreground" />
                        </div>
                        {i < NEXT_STEPS.length - 1 && <div className="w-px h-6 bg-border mt-1.5" />}
                      </div>
                      <div className="pb-1">
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-salon space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Navigation2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">Why add a map pin?</p>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> Customers can get directions in one tap</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> Appear in nearby salon searches</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> Build trust with a visible location</li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <p className="text-sm text-primary font-medium mb-1">Free forever</p>
                <p className="text-xs text-muted-foreground">
                  Listing your salon on FindSalonLK is completely free. No hidden fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
