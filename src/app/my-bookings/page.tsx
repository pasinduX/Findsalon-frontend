"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/booking.service";
import { reviewService } from "@/services/review.service";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ReviewForm from "@/components/ReviewForm";
import type { Booking } from "@/interfaces";

// ── Status display helpers ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  booked: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-secondary text-secondary-foreground",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function BookingTypeBadge({ type }: { type: string }) {
  if (type === "walk_in") return <Badge variant="outline" className="text-xs">Walk-in</Badge>;
  if (type === "direct") return <Badge variant="outline" className="text-xs">Direct</Badge>;
  return null;
}

// ── Single booking card ───────────────────────────────────────────────────────

function BookingCard({
  booking,
  isReviewed,
  onCancel,
  onReviewToggle,
  showReview,
  userId,
}: {
  booking: Booking;
  isReviewed: boolean;
  onCancel: (id: string) => void;
  onReviewToggle: (id: string) => void;
  showReview: boolean;
  userId: string;
}) {
  const startDate = booking.start_time ? new Date(booking.start_time) : null;
  const endDate = booking.end_time ? new Date(booking.end_time) : null;
  const isActive = booking.status === "confirmed" || booking.status === "booked";
  const isCompleted = booking.status === "completed";
  const isPast = startDate ? isBefore(startDate, new Date()) : false;
  const canCancel = isActive && !isPast;

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div
        className={`h-1 w-full ${
          isActive ? "bg-emerald-500" :
          isCompleted ? "bg-blue-500" :
          booking.status === "cancelled" ? "bg-red-400" :
          "bg-amber-400"
        }`}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {booking.salon_name || "Salon"}
            </h3>
            {booking.salon_area && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{booking.salon_area}</span>
              </p>
            )}
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <BookingTypeBadge type={booking.booking_type} />
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Time & barber info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
          {startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 flex-shrink-0 text-primary/70" />
              {format(startDate, "EEE, MMM d, yyyy")}
            </span>
          )}
          {startDate && endDate && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 flex-shrink-0 text-primary/70" />
              {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
            </span>
          )}
          {booking.barber_name && (
            <span className="flex items-center gap-1.5">
              <Scissors className="h-4 w-4 flex-shrink-0 text-primary/70" />
              {booking.barber_name}
            </span>
          )}
          {booking.notes && (
            <span className="flex items-center gap-1.5 sm:col-span-2 italic">
              "{booking.notes}"
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t">
          <span className="text-xs text-muted-foreground flex-1">
            Booked {format(new Date(booking.created_at), "MMM d, yyyy")}
          </span>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => onCancel(booking.id)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}

          {isCompleted && !isReviewed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReviewToggle(booking.id)}
              className={showReview ? "bg-accent/10" : ""}
            >
              <Star className="h-3.5 w-3.5 mr-1" />
              {showReview ? "Hide Review" : "Leave Review"}
            </Button>
          )}

          {isReviewed && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Reviewed
            </span>
          )}

          {booking.salon_id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                window.location.href = `/salon/${booking.salon_id}`;
              }}
            >
              View Salon
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Inline review form */}
      {showReview && (
        <div className="border-t px-5 pb-5 pt-4 bg-muted/30">
          <ReviewForm
            salonId={booking.salon_id}
            barberId={booking.barber_id}
            bookingId={booking.id}
            userId={userId}
            barberName={booking.barber_name ?? undefined}
            onSubmitted={() => onReviewToggle(booking.id)}
          />
        </div>
      )}
    </div>
  );
}

// ── Loading skeletons ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="h-1 bg-secondary" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Calendar className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button onClick={() => router.push("/salons")}>Find a Salon</Button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }

    const load = async () => {
      const [bookingsRes, reviewedRes] = await Promise.all([
        bookingService.getMyBookings(user.id),
        bookingService.getReviewedBookingIds(),
      ]);
      setBookings(bookingsRes.data ?? []);
      setReviewedIds(new Set(reviewedRes.data ?? []));
      setLoading(false);
    };
    load();
  }, [user, authLoading, router]);

  const cancelBooking = async (bookingId: string) => {
    const { error } = await bookingService.cancelBooking(bookingId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" as const } : b))
      );
      toast({ title: "Booking cancelled", description: "Your booking has been cancelled." });
    }
  };

  const toggleReview = (bookingId: string) => {
    setShowReviewFor((prev) => (prev === bookingId ? null : bookingId));
  };

  const onReviewSubmitted = (bookingId: string) => {
    setShowReviewFor(null);
    setReviewedIds((prev) => new Set([...prev, bookingId]));
  };

  // ── Tab filtering ──────────────────────────────────────────────────────────
  const today = startOfDay(new Date());

  const upcoming = useMemo(
    () =>
      bookings.filter((b) => {
        const isActive = b.status === "confirmed" || b.status === "booked" || b.status === "pending";
        const inFuture = b.start_time ? isAfter(new Date(b.start_time), today) : true;
        return isActive && inFuture;
      }),
    [bookings, today]
  );

  const past = useMemo(
    () =>
      bookings.filter((b) => {
        const isPastTime = b.start_time ? isBefore(new Date(b.start_time), today) : false;
        return b.status === "completed" || (b.status !== "cancelled" && isPastTime);
      }),
    [bookings, today]
  );

  const cancelled = useMemo(
    () => bookings.filter((b) => b.status === "cancelled"),
    [bookings]
  );

  const renderList = (list: Booking[], emptyMsg: string) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      );
    }
    if (list.length === 0) return <EmptyState message={emptyMsg} />;
    return (
      <div className="space-y-4">
        {list.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            isReviewed={reviewedIds.has(b.id)}
            onCancel={cancelBooking}
            onReviewToggle={toggleReview}
            showReview={showReviewFor === b.id}
            userId={user!.id}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 pb-20 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          {!loading && bookings.length > 0 && (
            <p className="text-muted-foreground mt-1">
              {upcoming.length} upcoming · {past.length} past · {cancelled.length} cancelled
            </p>
          )}
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
              Upcoming
              {!loading && upcoming.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-px">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 sm:flex-none">Past</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 sm:flex-none">Cancelled</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {renderList(upcoming, "No upcoming bookings. Time to book a visit!")}
          </TabsContent>
          <TabsContent value="past">
            {renderList(past, "No past bookings yet.")}
          </TabsContent>
          <TabsContent value="cancelled">
            {renderList(cancelled, "No cancelled bookings.")}
          </TabsContent>
          <TabsContent value="all">
            {renderList(bookings, "No bookings yet.")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
