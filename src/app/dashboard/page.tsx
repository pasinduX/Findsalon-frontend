"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { salonService } from "@/services/salon.service";
import { barberService } from "@/services/barber.service";
import { bookingService } from "@/services/booking.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Scissors, Users, Clock, Image as ImageIcon,
  Calendar, MapPin, Phone, ExternalLink, Palette,
  User, CheckCircle2, AlertCircle, Upload, Tag, Pencil, X, Check,
  DollarSign, Timer,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { buildImageUrl } from "@/lib/utils";
import { format } from "date-fns";
import type { Salon, Barber, TimeSlot, SalonGallery, BookingDto, WeeklySchedule, WorkDay, ScheduleBlock, BlockType, SalonService } from "@/interfaces";

type Tab = "barbers" | "services" | "slots" | "gallery" | "bookings" | "settings";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [gallery, setGallery] = useState<SalonGallery[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return (["barbers", "services", "slots", "gallery", "bookings", "settings"].includes(t ?? "") ? t : "barbers") as Tab;
  });

  // ── Services state ────────────────────────────────────────────────────────
  const [services, setServices] = useState<SalonService[]>([]);
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [addingSvc, setAddingSvc] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [editSvcName, setEditSvcName] = useState("");
  const [editSvcDesc, setEditSvcDesc] = useState("");
  const [editSvcPrice, setEditSvcPrice] = useState("");
  const [editSvcDuration, setEditSvcDuration] = useState("");
  const [savingEditSvc, setSavingEditSvc] = useState(false);
  const [assigningBarber, setAssigningBarber] = useState<string | null>(null);

  const [barberName, setBarberName] = useState("");
  const [barberSpecialties, setBarberSpecialties] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [addingBarber, setAddingBarber] = useState(false);

  const [slotBarberId, setSlotBarberId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);

  // ── Schedule management ──────────────────────────────────────────────────
  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const defaultWorkDays = (): WorkDay[] =>
    DAYS_OF_WEEK.map((day) => ({
      Day: day,
      StartTime: "09:00",
      EndTime: "17:00",
      IsWorkDay: !["Saturday", "Sunday"].includes(day),
    }));

  const [schedBarber, setSchedBarber] = useState("");
  const [schedWorkDays, setSchedWorkDays] = useState<WorkDay[]>(defaultWorkDays());
  const [schedDuration, setSchedDuration] = useState(30);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [schedSubTab, setSchedSubTab] = useState<"schedule" | "blocks">("schedule");
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockType, setBlockType] = useState<BlockType>("break");
  const [blockNote, setBlockNote] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);

  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [salonName, setSalonName] = useState("");
  const [salonDesc, setSalonDesc] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonArea, setSalonArea] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }

    const fetchData = async () => {
      const { data: salonData } = await salonService.getMySalon(user!.id);
      if (!salonData) { router.push("/dashboard/create"); return; }

      setSalon(salonData);
      setSalonName(salonData.name);
      setSalonDesc(salonData.description || "");
      setSalonAddress(salonData.address);
      setSalonArea(salonData.area);
      setSalonPhone(salonData.phone || "");

      const [barbersRes, galRes, slotsRes, bookingsRes, servicesRes, specialtiesRes] = await Promise.all([
        salonService.getBarbers(salonData.id),
        salonService.getGallery(salonData.id),
        barberService.getSlotsBySalon(salonData.id),
        bookingService.findAllBooking({ SalonId: salonData.id }),
        salonService.getServices(salonData.id),
        salonService.findAllSpecialties(),
      ]);

      setAvailableSpecialties((specialtiesRes.data ?? []).map((s) => s.name));

      setBarbers(barbersRes.data || []);
      setGallery(galRes.data || []);
      setServices(servicesRes.data || []);
      setTimeSlots(slotsRes.data || []);
      const raw = bookingsRes.data as any;
      setBookings(Array.isArray(raw) ? raw : (raw?.data ?? []));
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, router]);

  const updateSalon = async () => {
    if (!salon) return;
    setSavingSettings(true);
    const { error } = await salonService.updateSalon(salon.id, {
      Name: salonName, Description: salonDesc,
      Address: salonAddress, Area: salonArea, Phone: salonPhone,
    } as any);
    setSavingSettings(false);
    if (error) toast({ title: "Error", description: error, variant: "destructive" });
    else toast({ title: "Settings saved!" });
  };

  const addBarber = async () => {
    if (!salon || !barberName.trim()) return;
    setAddingBarber(true);
    const { error } = await salonService.createBarber({
      SalonId: salon.id, Name: barberName.trim(),
      Specialties: barberSpecialties.length > 0 ? barberSpecialties : undefined,
    });
    setAddingBarber(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setBarberName(""); setBarberSpecialties([]);
      const { data } = await salonService.getBarbers(salon.id);
      setBarbers(data || []);
      toast({ title: "Barber added!" });
    }
  };

  const deleteBarber = async (barberId: string) => {
    if (!salon) return;
    await salonService.deleteBarber(salon.id, barberId);
    setBarbers((prev) => prev.filter((b) => b.id !== barberId));
  };

  // ── Service CRUD ─────────────────────────────────────────────────────────
  const addService = async () => {
    if (!salon || !svcName.trim()) return;
    setAddingSvc(true);
    const { error } = await salonService.createSalonService({
      SalonId: salon.id,
      Name: svcName.trim(),
      Description: svcDesc.trim() || undefined,
      Price: svcPrice ? Number(svcPrice) : undefined,
      DurationMin: svcDuration ? Number(svcDuration) : undefined,
    });
    setAddingSvc(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setSvcName(""); setSvcDesc(""); setSvcPrice(""); setSvcDuration("");
      const { data } = await salonService.getServices(salon.id);
      setServices(data || []);
      toast({ title: "Service created!" });
    }
  };

  const startEditSvc = (svc: SalonService) => {
    setEditingSvcId(svc.id);
    setEditSvcName(svc.name);
    setEditSvcDesc(svc.description || "");
    setEditSvcPrice(svc.price ? String(svc.price) : "");
    setEditSvcDuration(svc.duration ? String(svc.duration) : "");
  };

  const saveEditSvc = async () => {
    if (!salon || !editingSvcId) return;
    setSavingEditSvc(true);
    const { error } = await salonService.updateSalonService(salon.id, editingSvcId, {
      Name: editSvcName.trim(),
      Description: editSvcDesc.trim() || undefined,
      Price: editSvcPrice ? Number(editSvcPrice) : undefined,
      DurationMin: editSvcDuration ? Number(editSvcDuration) : undefined,
    });
    setSavingEditSvc(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setEditingSvcId(null);
      const { data } = await salonService.getServices(salon.id);
      setServices(data || []);
      toast({ title: "Service updated!" });
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!salon) return;
    await salonService.deleteSalonService(salon.id, serviceId);
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    // remove this service from all barbers locally
    setBarbers((prev) =>
      prev.map((b) => ({ ...b, service_ids: b.service_ids.filter((id) => id !== serviceId) }))
    );
  };

  const toggleBarberService = async (barber: Barber, serviceId: string) => {
    if (!salon) return;
    setAssigningBarber(barber.id + serviceId);
    const current = barber.service_ids || [];
    const next = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    const { error } = await salonService.updateBarber(salon.id, barber.id, { ServiceIds: next });
    setAssigningBarber(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setBarbers((prev) =>
        prev.map((b) => b.id === barber.id ? { ...b, service_ids: next } : b)
      );
    }
  };

  const addSlot = async () => {
    if (!salon || !slotBarberId || !slotDate || !slotStart || !slotEnd) return;
    setAddingSlot(true);
    const { error } = await bookingService.createTimeSlot({
      SalonId: salon.id, BarberId: slotBarberId,
      Date: slotDate, StartTime: slotStart, EndTime: slotEnd,
    });
    setAddingSlot(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setSlotStart(""); setSlotEnd("");
      const { data } = await barberService.getSlotsBySalon(salon.id);
      setTimeSlots(data || []);
      toast({ title: "Time slot added!" });
    }
  };

  const deleteSlot = async (slotId: string) => {
    await bookingService.deleteTimeSlot(slotId);
    setTimeSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const loadScheduleForBarber = async (barberId: string) => {
    setSchedBarber(barberId);
    setScheduleLoaded(false);
    setScheduleBlocks([]);
    if (!barberId) return;
    const [schedRes, blocksRes] = await Promise.all([
      bookingService.getWeeklySchedule(barberId),
      bookingService.findAllScheduleBlocks(barberId),
    ]);
    if (schedRes.data) {
      const s = schedRes.data as any;
      const data: WeeklySchedule = s?.data ?? s;
      setSchedWorkDays(data.WorkDays?.length ? data.WorkDays : defaultWorkDays());
      setSchedDuration(data.SlotDuration || 30);
    } else {
      setSchedWorkDays(defaultWorkDays());
      setSchedDuration(30);
    }
    const blocksData = blocksRes.data as any;
    setScheduleBlocks(Array.isArray(blocksData) ? blocksData : (blocksData?.data ?? []));
    setScheduleLoaded(true);
  };

  const saveSchedule = async () => {
    if (!salon || !schedBarber) return;
    setSavingSchedule(true);
    const res = await bookingService.createWeeklySchedule({
      BarberId: schedBarber,
      SalonId: salon.id,
      SlotDuration: schedDuration,
      WorkDays: schedWorkDays,
    });
    setSavingSchedule(false);
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      const generated = (res.data as any)?.data?.SlotsGenerated ?? (res.data as any)?.SlotsGenerated ?? 0;
      toast({ title: "Schedule saved!", description: `${generated} slots generated for the next 30 days.` });
      const { data } = await barberService.getSlotsBySalon(salon.id);
      setTimeSlots(data || []);
    }
  };

  const toggleWorkDay = (day: string, checked: boolean) => {
    setSchedWorkDays((prev) => prev.map((wd) => wd.Day === day ? { ...wd, IsWorkDay: checked } : wd));
  };

  const updateWorkDayTime = (day: string, field: "StartTime" | "EndTime", value: string) => {
    setSchedWorkDays((prev) => prev.map((wd) => wd.Day === day ? { ...wd, [field]: value } : wd));
  };

  const addBlock = async () => {
    if (!salon || !schedBarber || !blockDate || !blockStart || !blockEnd) return;
    setAddingBlock(true);
    const res = await bookingService.createScheduleBlock({
      BarberId: schedBarber,
      SalonId: salon.id,
      Date: blockDate,
      StartTime: blockStart,
      EndTime: blockEnd,
      BlockType: blockType,
      Note: blockNote.trim() || undefined,
    });
    setAddingBlock(false);
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      setBlockDate(""); setBlockStart(""); setBlockEnd(""); setBlockNote("");
      const blocksRes = await bookingService.findAllScheduleBlocks(schedBarber);
      const blocksData = blocksRes.data as any;
      setScheduleBlocks(Array.isArray(blocksData) ? blocksData : (blocksData?.data ?? []));
      const slotsRes = await barberService.getSlotsBySalon(salon.id);
      setTimeSlots(slotsRes.data || []);
      toast({ title: "Block added!", description: "Slots for that date have been regenerated." });
    }
  };

  const removeBlock = async (blockId: string) => {
    if (!salon || !schedBarber) return;
    await bookingService.deleteScheduleBlock(blockId);
    setScheduleBlocks((prev) => prev.filter((b) => b.BlockId !== blockId));
    const slotsRes = await barberService.getSlotsBySalon(salon.id);
    setTimeSlots(slotsRes.data || []);
    toast({ title: "Block removed", description: "Slots regenerated." });
  };

  const handleFileSelect = (file: File | null) => {
    setGalleryFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
  };

  const handleGalleryUpload = async (file: File) => {
    if (!salon) return;
    setUploadingGalleryImage(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("Folder", "gallery");

    const uploadRes = await salonService.uploadImage(formData);
    if (uploadRes.error || !uploadRes.data) {
      setUploadingGalleryImage(false);
      toast({ title: "Upload failed", description: uploadRes.error ?? "Unable to upload image", variant: "destructive" });
      return;
    }

    const imageUrl = (uploadRes.data as any)?.data?.Url || (uploadRes.data as any)?.Url;
    if (!imageUrl) {
      setUploadingGalleryImage(false);
      toast({ title: "Upload failed", description: "Invalid upload response", variant: "destructive" });
      return;
    }

    const { error } = await salonService.createGallery({
      SalonId: salon.id,
      ImageUrl: imageUrl,
      Caption: galleryCaption.trim() || undefined,
    });

    setUploadingGalleryImage(false);
    if (error) {
      toast({ title: "Error saving image", description: error, variant: "destructive" });
    } else {
      setGalleryFile(null);
      setGalleryCaption("");
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const { data } = await salonService.getGallery(salon.id);
      setGallery(data || []);
      toast({ title: "Image added to gallery!" });
    }
  };

  const deleteGalleryImage = async (galleryId: string) => {
    if (!salon) return;
    await salonService.deleteGallery(salon.id, galleryId);
    setGallery((prev) => prev.filter((g) => g.id !== galleryId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4 space-y-4">
          <div className="h-36 bg-secondary rounded-2xl animate-pulse" />
          <div className="h-20 bg-secondary rounded-2xl animate-pulse opacity-60" />
          <div className="h-64 bg-secondary rounded-2xl animate-pulse opacity-40" />
        </div>
      </div>
    );
  }

  const availableSlots = timeSlots.filter((s) => s.status === "available" || (!s.status && !s.is_booked)).length;
  const blockedSlots = timeSlots.filter((s) => s.status === "blocked").length;

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "barbers", label: "Barbers", icon: Users, count: barbers.length },
    { id: "services", label: "Services", icon: Tag, count: services.length },
    { id: "slots", label: "Time Slots", icon: Clock, count: availableSlots },
    { id: "gallery", label: "Gallery", icon: ImageIcon, count: gallery.length },
    { id: "bookings", label: "Bookings", icon: Calendar, count: bookings.length },
    { id: "settings", label: "Settings", icon: Scissors },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        {/* ── Salon Hero Header ── */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shrink-0 shadow-salon">
                  <Scissors className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl font-bold">{salon?.name}</h1>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    {salon?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {salon.address}, {salon.area}
                      </span>
                    )}
                    {salon?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {salon.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex gap-2 flex-wrap">
                {salon && (
                  <Link href={`/salon/${salon.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5 h-9">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Public Page
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/editor">
                  <Button size="sm" className="gap-1.5 h-9 gradient-primary text-primary-foreground font-semibold">
                    <Palette className="h-3.5 w-3.5" />
                    Customize Page
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: "Barbers", value: barbers.length, icon: Users, color: "text-blue-500" },
                { label: "Total Bookings", value: bookings.length, icon: Calendar, color: "text-violet-500" },
                { label: "Available Slots", value: availableSlots, icon: Clock, color: "text-emerald-500" },
                { label: "Gallery Images", value: gallery.length, icon: ImageIcon, color: "text-amber-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-background rounded-xl p-3 flex items-center gap-3 border border-border">
                  <div className={`${color} bg-current/10 rounded-lg p-2`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-tight">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="border-b border-border bg-card/50 sticky top-16 z-10 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex gap-0 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    tab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      tab === t.id ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="container mx-auto px-4 py-8">

          {/* Barbers */}
          {tab === "barbers" && (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Add form */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-32">
                  <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" /> Add Barber
                  </h2>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name *</Label>
                      <Input placeholder="e.g. Kamal Perera" value={barberName} onChange={(e) => setBarberName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Specialties</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableSpecialties.map((s) => {
                          const selected = barberSpecialties.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setBarberSpecialties((prev) =>
                                  selected ? prev.filter((x) => x !== s) : [...prev, s]
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border hover:border-primary hover:text-foreground"
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      onClick={addBarber}
                      disabled={addingBarber || !barberName.trim()}
                      className="w-full gradient-primary text-primary-foreground font-semibold"
                    >
                      {addingBarber ? "Adding…" : <><Plus className="h-4 w-4 mr-1.5" />Add Barber</>}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    After adding the barber, share their profile link so they can sign in and manage their own schedule.
                  </p>
                </div>
              </div>

              {/* Barber list */}
              <div className="lg:col-span-3">
                <h2 className="font-semibold text-base mb-4 text-muted-foreground">
                  {barbers.length} {barbers.length === 1 ? "barber" : "barbers"} on your team
                </h2>
                {barbers.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">No barbers yet. Add your first team member.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {barbers.map((b) => (
                      <div key={b.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                          {b.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{b.name}</p>
                          {b.email && <p className="text-xs text-muted-foreground truncate">{b.email}</p>}
                          {b.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {b.specialties.map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {b.user_id ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Linked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded-full">
                              <AlertCircle className="h-3 w-3" /> Pending
                            </span>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteBarber(b.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          {tab === "services" && (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* ── Add Service form ── */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-32 space-y-5">
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" /> Add Service
                  </h2>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Service Name *</label>
                      <Input placeholder="e.g. Men's Haircut" value={svcName} onChange={(e) => setSvcName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Description</label>
                      <Input placeholder="Short description (optional)" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Price (LKR)
                        </label>
                        <Input type="number" min="0" placeholder="0" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                          <Timer className="h-3 w-3" /> Duration (min)
                        </label>
                        <Input type="number" min="5" placeholder="30" value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} />
                      </div>
                    </div>
                    <Button
                      onClick={addService}
                      disabled={addingSvc || !svcName.trim()}
                      className="w-full gradient-primary text-primary-foreground font-semibold"
                    >
                      {addingSvc ? "Creating…" : <><Plus className="h-4 w-4 mr-1.5" />Create Service</>}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After creating services, assign them to barbers using the panel on the right.
                  </p>
                </div>
              </div>

              {/* ── Services list ── */}
              <div className="lg:col-span-3 space-y-4">
                <h2 className="font-semibold text-base text-muted-foreground">
                  {services.length} {services.length === 1 ? "service" : "services"}
                </h2>

                {services.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
                    <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">No services yet. Create your first one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((svc) => {
                      const isEditing = editingSvcId === svc.id;
                      const assignedBarbers = barbers.filter((b) => b.service_ids?.includes(svc.id));
                      const unassignedBarbers = barbers.filter((b) => !b.service_ids?.includes(svc.id));

                      return (
                        <div key={svc.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                          {isEditing ? (
                            /* ── Inline edit form ── */
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-muted-foreground">Editing service</p>
                                <button onClick={() => setEditingSvcId(null)} className="text-muted-foreground hover:text-foreground">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <Input placeholder="Service name *" value={editSvcName} onChange={(e) => setEditSvcName(e.target.value)} />
                              <Input placeholder="Description (optional)" value={editSvcDesc} onChange={(e) => setEditSvcDesc(e.target.value)} />
                              <div className="grid grid-cols-2 gap-3">
                                <Input type="number" min="0" placeholder="Price (LKR)" value={editSvcPrice} onChange={(e) => setEditSvcPrice(e.target.value)} />
                                <Input type="number" min="5" placeholder="Duration (min)" value={editSvcDuration} onChange={(e) => setEditSvcDuration(e.target.value)} />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={saveEditSvc} disabled={savingEditSvc || !editSvcName.trim()} size="sm" className="gradient-primary text-primary-foreground font-semibold gap-1.5">
                                  <Check className="h-3.5 w-3.5" />{savingEditSvc ? "Saving…" : "Save"}
                                </Button>
                                <Button onClick={() => setEditingSvcId(null)} variant="ghost" size="sm">Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            /* ── Service card ── */
                            <div>
                              <div className="p-4 flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                                  <Scissors className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{svc.name}</p>
                                  {svc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{svc.description}</p>}
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {svc.price > 0 && (
                                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                        <DollarSign className="h-3 w-3" /> LKR {svc.price.toLocaleString()}
                                      </span>
                                    )}
                                    {svc.duration > 0 && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <Timer className="h-3 w-3" /> {svc.duration} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEditSvc(svc)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteService(svc.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* ── Barber assignment row ── */}
                              <div className="px-4 pb-4 pt-1 border-t border-border/60 mt-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2.5">Assigned barbers</p>
                                {barbers.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">
                                    <button className="text-primary underline" onClick={() => setTab("barbers")}>Add barbers first</button>
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {barbers.map((b) => {
                                      const assigned = b.service_ids?.includes(svc.id);
                                      const busy = assigningBarber === b.id + svc.id;
                                      return (
                                        <button
                                          key={b.id}
                                          onClick={() => toggleBarberService(b, svc.id)}
                                          disabled={busy}
                                          title={assigned ? `Remove ${b.name}` : `Assign ${b.name}`}
                                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                                            assigned
                                              ? "bg-primary/10 border-primary/30 text-primary hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                                              : "bg-secondary border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                                          } ${busy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${assigned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                            {b.name.charAt(0).toUpperCase()}
                                          </span>
                                          {b.name.split(" ")[0]}
                                          {assigned && <Check className="h-3 w-3" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {assignedBarbers.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {assignedBarbers.map(b => b.name.split(" ")[0]).join(", ")} offer{assignedBarbers.length === 1 ? "s" : ""} this service
                                    {unassignedBarbers.length > 0 && " · click a barber to toggle assignment"}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Slots */}
          {tab === "slots" && (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left: Schedule management */}
              <div className="lg:col-span-2 space-y-4">
                {/* Barber selector */}
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Manage schedule for</Label>
                  <select
                    value={schedBarber}
                    onChange={(e) => loadScheduleForBarber(e.target.value)}
                    className="w-full h-10 mt-2 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select barber</option>
                    {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {barbers.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <button className="text-primary underline" onClick={() => setTab("barbers")}>Add barbers first</button>
                    </p>
                  )}
                </div>

                {schedBarber && (
                  <>
                    {/* Sub-tabs */}
                    <div className="flex rounded-xl border border-border overflow-hidden bg-card">
                      {(["schedule", "blocks"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSchedSubTab(t)}
                          className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                            schedSubTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t === "schedule" ? "Weekly Schedule" : "Blocks"}
                        </button>
                      ))}
                    </div>

                    {/* Weekly schedule form */}
                    {schedSubTab === "schedule" && (
                      <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Slot Duration (minutes)</Label>
                          <select
                            value={schedDuration}
                            onChange={(e) => setSchedDuration(Number(e.target.value))}
                            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {[15, 20, 30, 45, 60, 90].map((d) => (
                              <option key={d} value={d}>{d} min</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Work Days &amp; Hours</Label>
                          {schedWorkDays.map((wd) => (
                            <div key={wd.Day} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`wd-${wd.Day}`}
                                checked={wd.IsWorkDay}
                                onChange={(e) => toggleWorkDay(wd.Day, e.target.checked)}
                                className="rounded"
                              />
                              <label htmlFor={`wd-${wd.Day}`} className={`text-xs w-20 font-medium ${wd.IsWorkDay ? "" : "text-muted-foreground"}`}>
                                {wd.Day.slice(0, 3)}
                              </label>
                              {wd.IsWorkDay && (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    type="time"
                                    value={wd.StartTime}
                                    onChange={(e) => updateWorkDayTime(wd.Day, "StartTime", e.target.value)}
                                    className="h-7 text-xs px-2"
                                  />
                                  <span className="text-muted-foreground text-xs">–</span>
                                  <Input
                                    type="time"
                                    value={wd.EndTime}
                                    onChange={(e) => updateWorkDayTime(wd.Day, "EndTime", e.target.value)}
                                    className="h-7 text-xs px-2"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={saveSchedule}
                          disabled={savingSchedule}
                          className="w-full gradient-primary text-primary-foreground font-semibold"
                        >
                          {savingSchedule ? "Saving & generating…" : "Save Schedule & Generate Slots"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          This will generate slots for the next 30 days, skipping days already booked.
                        </p>
                      </div>
                    )}

                    {/* Blocks form */}
                    {schedSubTab === "blocks" && (
                      <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
                        <p className="text-xs text-muted-foreground">
                          Add a block to prevent bookings during lunch, breaks, or critical appointments.
                        </p>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date *</Label>
                            <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Start *</Label>
                              <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wide">End *</Label>
                              <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Type</Label>
                            <select
                              value={blockType}
                              onChange={(e) => setBlockType(e.target.value as BlockType)}
                              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="break">Break</option>
                              <option value="lunch">Lunch</option>
                              <option value="critical">Critical appointment</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Note (optional)</Label>
                            <Input placeholder="e.g. Doctor's appointment" value={blockNote} onChange={(e) => setBlockNote(e.target.value)} />
                          </div>
                          <Button
                            onClick={addBlock}
                            disabled={addingBlock || !blockDate || !blockStart || !blockEnd}
                            className="w-full gradient-primary text-primary-foreground font-semibold"
                          >
                            {addingBlock ? "Adding…" : <><Plus className="h-4 w-4 mr-1.5" />Add Block</>}
                          </Button>
                        </div>

                        {scheduleBlocks.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Blocks</p>
                            {scheduleBlocks.map((b) => (
                              <div key={b.BlockId} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2.5">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium">{new Date(b.StartTime).toLocaleDateString()} · {new Date(b.StartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}–{new Date(b.EndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{b.BlockType}{b.Note ? ` — ${b.Note}` : ""}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeBlock(b.BlockId)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right: Slot list */}
              <div className="lg:col-span-3">
                <h2 className="font-semibold text-base mb-4 text-muted-foreground">
                  {availableSlots} available · {timeSlots.filter((s) => s.is_booked).length} booked
                  {blockedSlots > 0 && ` · ${blockedSlots} blocked`}
                </h2>
                {timeSlots.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">No time slots yet. Set up a barber's weekly schedule to auto-generate slots.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeSlots.map((s) => {
                      const barber = barbers.find((b) => b.id === s.barber_id);
                      const statusColor =
                        s.status === "blocked"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          : s.status === "booked" || s.is_booked
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
                      const statusLabel =
                        s.status === "blocked" ? "Blocked" : s.status === "booked" || s.is_booked ? "Booked" : "Open";
                      return (
                        <div key={s.id} className="bg-card rounded-xl px-4 py-3 border border-border flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                            {barber?.name.charAt(0).toUpperCase() ?? <User className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{barber?.name ?? "Unknown barber"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(s.date), "EEE, MMM d")} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
                          {s.status === "available" && !s.is_booked && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteSlot(s.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gallery */}
          {tab === "gallery" && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-32">
                  <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" /> Add to Gallery
                  </h2>
                  <div className="space-y-4">
                    {/* Drop zone */}
                    <div
                      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                        dragActive
                          ? "border-primary bg-primary/5 scale-[0.99]"
                          : previewUrl
                          ? "border-border"
                          : "border-border hover:border-primary/50 hover:bg-secondary/30"
                      } ${previewUrl ? "aspect-video" : "p-8"}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => !uploadingGalleryImage && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                      />
                      {previewUrl ? (
                        <>
                          <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                            <Upload className="h-5 w-5 text-white" />
                            <p className="text-white text-xs font-medium">Click to change</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {dragActive ? "Drop it here" : "Drop image here"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">or click to browse files</p>
                          </div>
                          <p className="text-xs text-muted-foreground/50">JPG, PNG, WebP · max 5 MB</p>
                        </div>
                      )}
                    </div>

                    {galleryFile && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{galleryFile.name}</span>
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Caption <span className="normal-case font-normal">(optional)</span>
                      </Label>
                      <Input
                        placeholder="e.g. Men's haircut showcase"
                        value={galleryCaption}
                        onChange={(e) => setGalleryCaption(e.target.value)}
                        disabled={uploadingGalleryImage}
                      />
                    </div>

                    <Button
                      onClick={() => galleryFile && handleGalleryUpload(galleryFile)}
                      disabled={uploadingGalleryImage || !galleryFile}
                      className="w-full gradient-primary text-primary-foreground font-semibold h-10"
                    >
                      {uploadingGalleryImage ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Uploading…
                        </span>
                      ) : (
                        <><Upload className="h-4 w-4 mr-1.5" />Add to Gallery</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <h2 className="font-semibold text-base mb-4 text-muted-foreground">
                  {gallery.length} {gallery.length === 1 ? "image" : "images"}
                </h2>
                {gallery.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">No images yet</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Upload your first photo to showcase your salon.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gallery.map((img) => (
                      <div key={img.id} className="group relative rounded-xl overflow-hidden aspect-square border border-border bg-secondary">
                        <img
                          src={buildImageUrl(img.image_url)}
                          alt={img.caption || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 gap-2">
                          {img.caption && (
                            <p className="text-white text-xs truncate flex-1 font-medium">{img.caption}</p>
                          )}
                          <button
                            onClick={() => deleteGalleryImage(img.id)}
                            className="ml-auto bg-destructive/90 hover:bg-destructive rounded-full w-7 h-7 flex items-center justify-center text-white shrink-0 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings */}
          {tab === "bookings" && (
            <div>
              <h2 className="font-semibold text-base mb-4 text-muted-foreground">{bookings.length} total bookings</h2>
              {bookings.length === 0 ? (
                <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => {
                    const barber = barbers.find((br) => br.id === b.BarberId);
                    return (
                      <div key={b.BookingId} className="bg-card rounded-xl px-4 py-3.5 border border-border flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{b.CustomerName || "Customer"}</p>
                          <p className="text-xs text-muted-foreground">
                            {barber ? barber.name : "Barber"} · {format(new Date(b.CreatedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                          b.Status === "confirmed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                          b.Status === "cancelled" ? "bg-destructive/10 text-destructive" :
                          b.Status === "completed" ? "bg-primary/10 text-primary" :
                          "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}>
                          {b.Status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {tab === "settings" && salon && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="font-semibold text-base mb-5">Salon Information</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Salon Name</Label>
                      <Input value={salonName} onChange={(e) => setSalonName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                      <Textarea value={salonDesc} onChange={(e) => setSalonDesc(e.target.value)} rows={4} className="resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Area / District</Label>
                        <Input value={salonArea} onChange={(e) => setSalonArea(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
                        <Input value={salonPhone} onChange={(e) => setSalonPhone(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Address</Label>
                      <Input value={salonAddress} onChange={(e) => setSalonAddress(e.target.value)} />
                    </div>
                    <Button
                      onClick={updateSalon}
                      disabled={savingSettings}
                      className="gradient-primary text-primary-foreground font-semibold px-6"
                    >
                      {savingSettings ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-semibold text-sm mb-3">Page Customization</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add services, a quote, working hours, and more to make your public page stand out.
                  </p>
                  <Link href="/dashboard/editor">
                    <Button className="w-full gradient-primary text-primary-foreground font-semibold gap-2">
                      <Palette className="h-4 w-4" /> Open Page Editor
                    </Button>
                  </Link>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-semibold text-sm mb-3">Public Page</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    This is what customers see when they find your salon.
                  </p>
                  <Link href={`/salon/${salon.id}`} target="_blank">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" /> View Public Page
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
