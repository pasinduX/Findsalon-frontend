"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Scissors, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { salonService } from "@/services/salon.service";
import type { DistrictDto, Salon, SalonDto } from "@/interfaces";
import { demoSalon } from "@/data/demoSalon";

function SalonsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedArea = searchParams.get("area") || "";
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaSearch, setAreaSearch] = useState(selectedArea);
  const [districts, setDistricts] = useState<DistrictDto[]>([]);

  const selectedAreaLower = selectedArea.toLowerCase();

  const cities = useMemo(
    () =>
      districts.flatMap((district) =>
        district.cities.map((city) => ({ ...city, districtName: district.name }))
      ),
    [districts]
  );

  const selectedDistrict = useMemo(
    () =>
      districts.find(
        (district) => district.name.toLowerCase() === selectedAreaLower
      ),
    [districts, selectedAreaLower]
  );

  const selectedCity = useMemo(
    () =>
      cities.find((city) => city.name.toLowerCase() === selectedAreaLower),
    [cities, selectedAreaLower]
  );

  useEffect(() => {
    const fetchDistricts = async () => {
      const response = await salonService.findAllDistricts();
      if (Array.isArray(response.data)) {
        setDistricts(response.data);
      }
    };

    fetchDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      setAreaSearch("");
    } else {
      setAreaSearch(selectedArea);
    }
  }, [selectedArea, selectedDistrict]);

  const mapSalonDtoToSalon = (dto: SalonDto): Salon => ({
    id: dto.SalonId,
    name: dto.Name,
    description: dto.Description || null,
    address: dto.Address,
    area: dto.Area,
    city: dto.City,
    phone: dto.Phone || null,
    location: dto.Location
      ? {
          latitude: dto.Location.Latitude,
          longitude: dto.Location.Longitude,
          address: dto.Location.Address,
        }
      : null,
    cover_image_url: dto.CoverImageUrl || null,
    logo_url: dto.LogoUrl || null,
    owner_id: dto.OwnerId,
    is_active: dto.IsActive,
    created_at: dto.CreatedAt,
    updated_at: dto.UpdatedAt,
  });

  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true);
      const filters = selectedCity
        ? { CityId: String(selectedCity.id) }
        : selectedArea
        ? { Area: selectedArea }
        : {};
      const response = await salonService.findAllSalon(filters);
      const raw = response.data as any;
      const rawSalons: SalonDto[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const realSalons = rawSalons.map(mapSalonDtoToSalon);
      const hasDemoArea =
        !selectedArea ||
        demoSalon.area.toLowerCase().includes(selectedArea.toLowerCase()) ||
        demoSalon.city.toLowerCase().includes(selectedArea.toLowerCase());
      setSalons(hasDemoArea ? [demoSalon as Salon, ...realSalons] : realSalons);
      setLoading(false);
    };

    fetchSalons();
  }, [selectedArea, selectedCity]);

  const cityOptions = selectedDistrict
    ? selectedDistrict.cities.map((city) => ({
        ...city,
        districtName: selectedDistrict.name,
      }))
    : cities;

  const filteredAreas = cityOptions.filter((city) =>
    city.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const handleAreaSelect = (area: string) => {
    router.push(`/salons?area=${encodeURIComponent(area)}`);
    setAreaSearch(area);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 pb-20">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {selectedArea ? `Salons in ${selectedArea}` : "All Salons"}
          </h1>
          <p className="text-muted-foreground">
            Browse and book from the best salons near you
          </p>
          {selectedDistrict && (
            <p className="text-sm text-muted-foreground mt-2">
              Select a city in {selectedDistrict.name} to view salons.
            </p>
          )}
        </div>

        {/* Area filter */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              placeholder="Search city..."
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => {
                router.push("/salons");
                setAreaSearch("");
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                !selectedArea
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {filteredAreas.slice(0, 10).map((city) => (
              <button
                key={`${city.districtName}-${city.id}`}
                onClick={() => handleAreaSelect(city.name)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedArea.toLowerCase() === city.name.toLowerCase()
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {city.name}
              </button>
            ))}
            {filteredAreas.length === 0 && (
              <span className="px-3 py-1.5 rounded-full text-sm text-muted-foreground bg-secondary">
                No matching cities found.
              </span>
            )}
          </div>
        </div>

        {/* Salon grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-20">
            <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">
              No salons found
            </h3>
            <p className="text-muted-foreground">
              {selectedArea
                ? `No salons in ${selectedArea} yet. Be the first to create one!`
                : "No salons listed yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salons.map((salon, i) => (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/salon/${salon.id}`}>
                  <div className="bg-card rounded-2xl overflow-hidden shadow-salon hover:shadow-card-hover transition-all group">
                    <div className="h-48 bg-secondary overflow-hidden">
                      {salon.cover_image_url ? (
                        <img
                          src={salon.cover_image_url}
                          alt={salon.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                          <Scissors className="h-12 w-12 text-primary-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-semibold mb-1">
                        {salon.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {salon.area}, {salon.city}
                        </span>
                      </div>
                      {salon.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {salon.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalonsPage() {
  return (
    <Suspense fallback={null}>
      <SalonsPageContent />
    </Suspense>
  );
}
