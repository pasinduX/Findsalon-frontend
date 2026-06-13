"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/booking.service";
import { reviewService } from "@/services/review.service";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ReviewForm from "@/components/ReviewForm";
import type { Booking } from "@/interfaces";

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }

    const fetchBookings = async () => {
      const [bookingsRes, reviewedRes] = await Promise.all([
        bookingService.getMyBookings(),
        bookingService.getReviewedBookingIds(),
      ]);
      setBookings(bookingsRes.data || []);
      setReviewedBookings(new Set(reviewedRes.data || []));
      setLoading(false);
    };
    fetchBookings();
  }, [user, authLoading, router]);

  const cancelBooking = async (bookingId: string) => {
    const { error } = await bookingService.cancelBooking(bookingId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      toast({ title: "Booking cancelled" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 pb-20">
        <h1 className="font-display text-3xl font-bold mb-6">My Bookings</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="space-y-3">
                <div className="bg-card rounded-2xl p-5 shadow-salon flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      {b.salons?.name}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {b.salons?.area}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {b.time_slots?.date &&
                          format(new Date(b.time_slots.date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {b.time_slots?.start_time?.slice(0, 5)} -{" "}
                        {b.time_slots?.end_time?.slice(0, 5)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Barber: {b.barbers?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : b.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.status === "confirmed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelBooking(b.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    {b.status === "confirmed" && !reviewedBookings.has(b.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShowReviewFor(
                            showReviewFor === b.id ? null : b.id
                          )
                        }
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    )}
                    {reviewedBookings.has(b.id) && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" />{" "}
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>
                {showReviewFor === b.id && user && (
                  <ReviewForm
                    salonId={b.salon_id}
                    barberId={b.barber_id}
                    bookingId={b.id}
                    userId={user.id}
                    barberName={b.barbers?.name}
                    onSubmitted={() => {
                      setShowReviewFor(null);
                      setReviewedBookings((prev) => new Set([...prev, b.id]));
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
