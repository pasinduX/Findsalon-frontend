"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { barberService } from "@/services/barber.service";
import { bookingService } from "@/services/booking.service";
import { salonService } from "@/services/salon.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, Image as ImageIcon, Plus, Trash2, Upload,
  CheckCircle2, Scissors, Calendar, User, ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { buildImageUrl } from "@/lib/utils";
import { format } from "date-fns";
import type { BarberDto, TimeSlot, SalonGallery } from "@/interfaces";
import Link from "next/link";

type Tab = "slots" | "gallery";

export default function BarberDashboardPage() {
  const { user, loading: authLoading, isBarber } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [barber, setBarber] = useState<BarberDto | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [gallery, setGallery] = useState<SalonGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("slots");

  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);

  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    // Allow any authenticated user — if they have no barber profile the page
    // shows a friendly "no barber profile found" state rather than redirecting.
    // This avoids a race between the role check and the membership lookup.

    const fetchData = async () => {
      const profileRes = await barberService.getMyBarberProfile();
      const raw = (profileRes.data as any)?.data ?? profileRes.data;
      if (!raw?.BarberId) {
        toast({ title: "Barber profile not found", description: "Contact your salon owner to register you as a barber.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const barberData = raw as BarberDto;
      setBarber(barberData);
      const [slotsRes, galleryRes] = await Promise.all([
        barberService.getMySlots(barberData.BarberId),
        barberService.getMyGallery(barberData.BarberId),
      ]);
      setSlots(slotsRes.data || []);
      setGallery(galleryRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, router, toast]);

  const addSlot = async () => {
    if (!barber || !slotDate || !slotStart || !slotEnd) return;
    setAddingSlot(true);
    const { error } = await bookingService.createTimeSlot({
      SalonId: barber.SalonId,
      BarberId: barber.BarberId,
      Date: slotDate,
      StartTime: slotStart,
      EndTime: slotEnd,
    });
    setAddingSlot(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setSlotDate(""); setSlotStart(""); setSlotEnd("");
      const { data } = await barberService.getMySlots(barber.BarberId);
      setSlots(data || []);
      toast({ title: "Time slot added!" });
    }
  };

  const deleteSlot = async (slotId: string) => {
    await bookingService.deleteTimeSlot(slotId);
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const handleFileSelect = (file: File | null) => {
    setGalleryFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
  };

  const handleGalleryUpload = async (file: File) => {
    if (!barber) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("Folder", "barber-gallery");
    const uploadRes = await salonService.uploadImage(formData);
    if (uploadRes.error || !uploadRes.data) {
      setUploadingImage(false);
      toast({ title: "Upload failed", description: uploadRes.error ?? "Unable to upload image", variant: "destructive" });
      return;
    }
    const imageUrl = (uploadRes.data as any)?.data?.Url || (uploadRes.data as any)?.Url;
    if (!imageUrl) {
      setUploadingImage(false);
      toast({ title: "Upload failed", description: "Invalid upload response", variant: "destructive" });
      return;
    }
    const { error } = await salonService.createGallery({
      SalonId: barber.SalonId,
      BarberId: barber.BarberId,
      ImageUrl: imageUrl,
      Caption: galleryCaption.trim() || undefined,
    });
    setUploadingImage(false);
    if (error) {
      toast({ title: "Error saving image", description: error, variant: "destructive" });
    } else {
      setGalleryFile(null); setGalleryCaption(""); setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const { data } = await barberService.getMyGallery(barber.BarberId);
      setGallery(data || []);
      toast({ title: "Photo added to your portfolio!" });
    }
  };

  const deleteGalleryImage = async (galleryId: string) => {
    if (!barber) return;
    await salonService.deleteGallery(barber.SalonId, galleryId, barber.BarberId);
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

  if (!barber) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4 text-center py-20">
          <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="font-display text-xl font-bold mb-2">No barber profile found</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Ask your salon owner to add you as a barber using your email address. Once added, refresh this page.
          </p>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => !s.is_booked).length;

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "slots", label: "Time Slots", icon: Clock, count: availableSlots },
    { id: "gallery", label: "My Portfolio", icon: ImageIcon, count: gallery.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">

        {/* ── Header ── */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0 shadow-salon">
                  {barber.Name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl font-bold">{barber.Name}</h1>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Barber</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    {barber.Specialties?.length > 0 && barber.Specialties.map((s: string) => (
                      <span key={s} className="flex items-center gap-1"><Scissors className="h-3.5 w-3.5" />{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Link href={`/salon/${barber.SalonId}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <ExternalLink className="h-3.5 w-3.5" /> View Salon Page
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: "Available Slots", value: availableSlots, icon: Clock, color: "text-emerald-500" },
                { label: "Booked Slots", value: slots.length - availableSlots, icon: Calendar, color: "text-violet-500" },
                { label: "Total Slots", value: slots.length, icon: Clock, color: "text-blue-500" },
                { label: "Portfolio Photos", value: gallery.length, icon: ImageIcon, color: "text-amber-500" },
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
            <div className="flex gap-0">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      tab === t.id ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="container mx-auto px-4 py-8">

          {/* Time Slots */}
          {tab === "slots" && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-32">
                  <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" /> Add Time Slot
                  </h2>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date *</Label>
                      <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Start</Label>
                        <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">End</Label>
                        <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={addSlot} disabled={addingSlot || !slotDate || !slotStart || !slotEnd}
                      className="w-full gradient-primary text-primary-foreground font-semibold">
                      {addingSlot ? "Adding…" : <><Plus className="h-4 w-4 mr-1.5" />Add Slot</>}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Slots are linked to your profile so customers can book directly with you.</p>
                </div>
              </div>

              <div className="lg:col-span-3">
                <h2 className="font-semibold text-base mb-4 text-muted-foreground">
                  {availableSlots} available · {slots.length - availableSlots} booked
                </h2>
                {slots.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <Clock className="h-6 w-6 text-muted-foreground opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">No slots yet</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Add your availability so customers can book.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map((s) => (
                      <div key={s.id} className="bg-card rounded-xl px-4 py-3 border border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                          {barber.Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{format(new Date(s.date), "EEE, MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.is_booked ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        }`}>{s.is_booked ? "Booked" : "Open"}</span>
                        {!s.is_booked && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteSlot(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {tab === "gallery" && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-32">
                  <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" /> Add Photo
                  </h2>
                  <div className="space-y-4">
                    <div
                      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                        dragActive ? "border-primary bg-primary/5 scale-[0.99]"
                          : previewUrl ? "border-border" : "border-border hover:border-primary/50 hover:bg-secondary/30"
                      } ${previewUrl ? "aspect-video" : "p-8"}`}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
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
                            <p className="text-sm font-medium">{dragActive ? "Drop it here" : "Drop photo here"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
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
                      <Input placeholder="e.g. Clean fade with taper" value={galleryCaption}
                        onChange={(e) => setGalleryCaption(e.target.value)} disabled={uploadingImage} />
                    </div>

                    <Button onClick={() => galleryFile && handleGalleryUpload(galleryFile)}
                      disabled={uploadingImage || !galleryFile}
                      className="w-full gradient-primary text-primary-foreground font-semibold h-10">
                      {uploadingImage ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Uploading…
                        </span>
                      ) : <><Upload className="h-4 w-4 mr-1.5" />Add to Portfolio</>}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <h2 className="font-semibold text-base mb-4 text-muted-foreground">
                  {gallery.length} {gallery.length === 1 ? "photo" : "photos"} in your portfolio
                </h2>
                {gallery.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">No photos yet</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Upload your best work to attract customers.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gallery.map((img) => (
                      <div key={img.id} className="group relative rounded-xl overflow-hidden aspect-square border border-border bg-secondary">
                        <img src={buildImageUrl(img.image_url)} alt={img.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 gap-2">
                          {img.caption && <p className="text-white text-xs truncate flex-1 font-medium">{img.caption}</p>}
                          <button onClick={() => deleteGalleryImage(img.id)}
                            className="ml-auto bg-destructive/90 hover:bg-destructive rounded-full w-7 h-7 flex items-center justify-center text-white shrink-0 transition-colors">
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

        </div>
      </div>
    </div>
  );
}
