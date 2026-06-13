"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { salonService } from "@/services/salon.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Image as ImageIcon, Type, Quote as QuoteIcon,
  Clock, Phone, Scissors, Save, Eye, ArrowLeft, Loader2, ChevronDown, ChevronUp, Upload,
} from "lucide-react";
import { buildImageUrl } from "@/lib/utils";
import type { Salon, SalonGallery, SalonService, SalonQuote, WorkingHour } from "@/interfaces";

// ── Local item types (include optional id for diff tracking) ──────────────────

interface ServiceItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface QuoteItem {
  id?: string;
  text: string;
  author: string;
  role: string;
}

interface HourItem {
  id?: string;
  day: string;
  hours: string;
}

const DEFAULT_HOURS: HourItem[] = [
  { day: "Monday", hours: "9:00 AM – 7:00 PM" },
  { day: "Tuesday", hours: "9:00 AM – 7:00 PM" },
  { day: "Wednesday", hours: "9:00 AM – 7:00 PM" },
  { day: "Thursday", hours: "9:00 AM – 8:00 PM" },
  { day: "Friday", hours: "9:00 AM – 8:00 PM" },
  { day: "Saturday", hours: "8:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-background">{children}</div>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SalonEditorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Content
  const [gallery, setGallery] = useState<SalonGallery[]>([]);
  const [galleryInput, setGalleryInput] = useState("");
  const [galleryCaptionInput, setGalleryCaptionInput] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [deletedServiceIds, setDeletedServiceIds] = useState<string[]>([]);
  const [quote, setQuote] = useState<QuoteItem>({ text: "", author: "", role: "" });
  const [hours, setHours] = useState<HourItem[]>(DEFAULT_HOURS);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }

    const load = async () => {
      const { data: salonData } = await salonService.getMySalon(user!.id);
      if (!salonData) { router.push("/dashboard/create"); return; }

      setSalon(salonData);
      setName(salonData.name);
      setDescription(salonData.description || "");
      setAddress(salonData.address);
      setArea(salonData.area);
      setPhone(salonData.phone || "");
      setCoverUrl(salonData.cover_image_url || "");

      const [galRes, svcRes, quoteRes, hoursRes] = await Promise.all([
        salonService.getGallery(salonData.id),
        salonService.getServices(salonData.id),
        salonService.getQuote(salonData.id),
        salonService.getWorkingHours(salonData.id),
      ]);

      setGallery(galRes.data || []);
      setServices(
        (svcRes.data || []).map((s: SalonService) => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          price: s.price,
          duration: s.duration,
        }))
      );
      if (quoteRes.data) {
        const q = quoteRes.data as SalonQuote;
        setQuote({ id: q.id, text: q.text, author: q.author || "", role: q.role || "" });
      }
      const rawHours = (hoursRes.data || []) as WorkingHour[];
      setHours(
        rawHours.length > 0
          ? rawHours.map((h) => ({ id: h.id, day: h.day, hours: h.hours }))
          : DEFAULT_HOURS
      );
      setLoading(false);
    };
    load();
  }, [user, authLoading, router]);

  // ── Gallery (immediate save) ──────────────────────────────────────────────

  const addGalleryImage = async () => {
    if (!salon || !galleryInput.trim()) return;
    const { error } = await salonService.createGallery({
      SalonId: salon.id,
      ImageUrl: galleryInput.trim(),
      Caption: galleryCaptionInput.trim() || undefined,
    });
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setGalleryInput("");
      setGalleryCaptionInput("");
      const { data } = await salonService.getGallery(salon.id);
      setGallery(data || []);
      toast({ title: "Image added!" });
    }
  };

  const removeGalleryImage = async (id: string) => {
    if (!salon) return;
    await salonService.deleteGallery(salon.id, id);
    setGallery((g) => g.filter((i) => i.id !== id));
  };

  // ── Remove service (track deletions) ─────────────────────────────────────

  const removeService = (index: number) => {
    const svc = services[index];
    if (svc.id) setDeletedServiceIds((prev) => [...prev, svc.id!]);
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save All ──────────────────────────────────────────────────────────────

  const saveAll = async () => {
    if (!salon) return;
    setSaving(true);
    const errors: string[] = [];

    // 1. Salon basic info
    const { error: salonErr } = await salonService.updateSalon(salon.id, {
      Name: name,
      Description: description,
      Address: address,
      Area: area,
      Phone: phone,
      CoverImageUrl: coverUrl || "",
    } as any);
    if (salonErr) errors.push(`Salon info: ${salonErr}`);

    // 2. Quote
    if (quote.text.trim()) {
      if (quote.id) {
        const { error } = await salonService.updateQuote(salon.id, quote.id, {
          Text: quote.text,
          Author: quote.author,
          Role: quote.role,
        } as any);
        if (error) errors.push(`Quote: ${error}`);
      } else {
        const { error } = await salonService.createQuote({
          SalonId: salon.id,
          Text: quote.text,
          Author: quote.author,
          Role: quote.role,
        });
        if (error) errors.push(`Quote: ${error}`);
        else {
          const { data } = await salonService.getQuote(salon.id);
          if (data) setQuote({ id: data.id, text: data.text, author: data.author || "", role: data.role || "" });
        }
      }
    }

    // 3. Services — delete removed, update existing, create new
    await Promise.all(
      deletedServiceIds.map((id) => salonService.deleteSalonService(salon.id, id))
    );
    setDeletedServiceIds([]);

    const updatedServices: ServiceItem[] = [];
    for (const svc of services) {
      const payload = {
        Name: svc.name,
        Description: svc.description,
        Price: svc.price,
        DurationMin: svc.duration,
      } as any;
      if (svc.id) {
        const { error } = await salonService.updateSalonService(salon.id, svc.id, payload);
        if (error) errors.push(`Service "${svc.name}": ${error}`);
        updatedServices.push(svc);
      } else {
        const { error } = await salonService.createSalonService({ SalonId: salon.id, ...payload });
        if (error) errors.push(`Service "${svc.name}": ${error}`);
        updatedServices.push(svc);
      }
    }
    // Refresh services to pick up new ids
    const { data: freshSvc } = await salonService.getServices(salon.id);
    if (freshSvc) {
      setServices(freshSvc.map((s: SalonService) => ({
        id: s.id, name: s.name, description: s.description || "", price: s.price, duration: s.duration,
      })));
    }

    // 4. Working hours — update existing, create new
    for (const h of hours) {
      if (h.id) {
        const { error } = await salonService.updateWorkingHours(salon.id, h.id, { Hours: h.hours } as any);
        if (error) errors.push(`Hours (${h.day}): ${error}`);
      } else {
        const { error } = await salonService.createWorkingHours({
          SalonId: salon.id, Day: h.day, Hours: h.hours,
        });
        if (error) errors.push(`Hours (${h.day}): ${error}`);
      }
    }
    // Refresh hours to pick up new ids
    const { data: freshHours } = await salonService.getWorkingHours(salon.id);
    if (freshHours && freshHours.length > 0) {
      setHours(freshHours.map((h: WorkingHour) => ({ id: h.id, day: h.day, hours: h.hours })));
    }

    setSaving(false);

    if (errors.length > 0) {
      toast({
        title: `Saved with ${errors.length} error${errors.length > 1 ? "s" : ""}`,
        description: errors[0],
        variant: "destructive",
      });
    } else {
      toast({ title: "All changes saved!" });
      setPreviewKey((k) => k + 1);
    }
  };

  // ── Cover image upload ────────────────────────────────────────────────────

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("Folder", "salon-covers");
    const { data, error } = await salonService.uploadImage(formData);
    setCoverUploading(false);
    if (error || !data) {
      toast({ title: "Upload failed", description: error ?? "Unable to upload image", variant: "destructive" });
      return;
    }
    const path = (data as any)?.Url as string;
    if (path) setCoverUrl(buildImageUrl(path));
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-semibold truncate">{name || "Page Editor"}</p>
            <p className="text-xs text-muted-foreground">Customise your public salon page</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(`/salon/${salon?.id}`, "_blank")}
          >
            <Eye className="h-4 w-4" /> Live Preview
          </Button>
          <Button
            size="sm"
            className="gradient-primary text-primary-foreground font-semibold gap-1.5"
            onClick={saveAll}
            disabled={saving}
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : <><Save className="h-4 w-4" /> Save All</>
            }
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Editor panel */}
        <div className="w-[400px] shrink-0 border-r border-border overflow-y-auto p-4 space-y-3">

          {/* Cover Image */}
          <Section title="Cover Image" icon={<ImageIcon className="h-4 w-4 text-primary" />}>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleCoverUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              disabled={coverUploading}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              {coverUploading
                ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <Upload className="h-5 w-5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                {coverUploading ? "Uploading…" : "Click to upload cover image"}
              </span>
            </button>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Or paste URL</label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…"
              />
            </div>
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Cover preview"
                className="w-full rounded-lg object-cover aspect-video border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
              />
            )}
          </Section>

          {/* Basic Info */}
          <Section title="Basic Info" icon={<Type className="h-4 w-4 text-primary" />}>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Salon Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact Details" icon={<Phone className="h-4 w-4 text-primary" />} defaultOpen={false}>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="011 234 5678" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Area / District</label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </Section>

          {/* Quote */}
          <Section title="Tagline / Quote" icon={<QuoteIcon className="h-4 w-4 text-primary" />} defaultOpen={false}>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Quote Text</label>
              <Textarea
                value={quote.text}
                onChange={(e) => setQuote({ ...quote, text: e.target.value })}
                rows={2}
                placeholder="e.g. Where style meets precision…"
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Author</label>
                <Input value={quote.author} onChange={(e) => setQuote({ ...quote, author: e.target.value })} placeholder="Owner name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Role / Title</label>
                <Input value={quote.role} onChange={(e) => setQuote({ ...quote, role: e.target.value })} placeholder="Founder" />
              </div>
            </div>
          </Section>

          {/* Services */}
          <Section title={`Services (${services.length})`} icon={<Scissors className="h-4 w-4 text-primary" />} defaultOpen={false}>
            <div className="space-y-3">
              {services.map((svc, i) => (
                <div key={i} className="p-3 bg-secondary/40 rounded-xl space-y-2 relative border border-border">
                  <button
                    onClick={() => removeService(i)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    placeholder="Service name *"
                    value={svc.name}
                    onChange={(e) => { const c = [...services]; c[i] = { ...c[i], name: e.target.value }; setServices(c); }}
                    className="text-sm pr-8"
                  />
                  <Input
                    placeholder="Description"
                    value={svc.description}
                    onChange={(e) => { const c = [...services]; c[i] = { ...c[i], description: e.target.value }; setServices(c); }}
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Price (Rs.)</label>
                      <Input
                        type="number" min={0}
                        value={svc.price}
                        onChange={(e) => { const c = [...services]; c[i] = { ...c[i], price: Number(e.target.value) }; setServices(c); }}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Duration (min)</label>
                      <Input
                        type="number" min={5}
                        value={svc.duration}
                        onChange={(e) => { const c = [...services]; c[i] = { ...c[i], duration: Number(e.target.value) }; setServices(c); }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline" size="sm" className="w-full mt-1"
              onClick={() => setServices([...services, { name: "", description: "", price: 500, duration: 30 }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Service
            </Button>
          </Section>

          {/* Gallery */}
          <Section title={`Gallery (${gallery.length})`} icon={<ImageIcon className="h-4 w-4 text-primary" />} defaultOpen={false}>
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group border border-border">
                    <img src={img.image_url} alt={img.caption || ""} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removeGalleryImage(img.id)} className="text-white">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Input
                placeholder="Image URL"
                value={galleryInput}
                onChange={(e) => setGalleryInput(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Caption (optional)"
                value={galleryCaptionInput}
                onChange={(e) => setGalleryCaptionInput(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm" variant="outline" className="w-full"
                onClick={addGalleryImage}
                disabled={!galleryInput.trim()}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Image
              </Button>
            </div>
          </Section>

          {/* Working Hours */}
          <Section title="Working Hours" icon={<Clock className="h-4 w-4 text-primary" />} defaultOpen={false}>
            <div className="space-y-2">
              {hours.map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm font-medium w-24 shrink-0 text-muted-foreground">{h.day}</span>
                  <Input
                    value={h.hours}
                    onChange={(e) => { const c = [...hours]; c[i] = { ...c[i], hours: e.target.value }; setHours(c); }}
                    className="text-sm"
                    placeholder="9:00 AM – 7:00 PM or Closed"
                  />
                </div>
              ))}
            </div>
          </Section>

          <div className="pb-6">
            <Button
              className="w-full gradient-primary text-primary-foreground font-semibold gap-2 h-11"
              onClick={saveAll}
              disabled={saving}
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving all changes…</>
                : <><Save className="h-4 w-4" /> Save All Changes</>
              }
            </Button>
          </div>
        </div>

        {/* RIGHT: Live preview iframe */}
        <div className="flex-1 bg-muted/20 p-3 overflow-hidden flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground font-medium">Live Preview</p>
            <button
              onClick={() => setPreviewKey((k) => k + 1)}
              className="text-xs text-primary hover:underline"
            >
              Refresh
            </button>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-border shadow-salon bg-background">
            <iframe
              key={previewKey}
              src={`/salon/${salon?.id}`}
              className="w-full h-full"
              title="Salon Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
