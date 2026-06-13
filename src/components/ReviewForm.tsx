"use client";

import { useState } from "react";
import { reviewService } from "@/services/review.service";
import { useToast } from "@/hooks/use-toast";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  salonId: string;
  barberId: string;
  bookingId: string;
  userId: string;
  barberName?: string;
  onSubmitted: () => void;
}

const ReviewForm = ({ salonId, barberId, bookingId, userId, barberName, onSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await reviewService.createReview({
      SalonId: salonId,
      BarberId: barberId,
      BookingId: bookingId,
      UserId: userId,
      Rating: rating,
      Comment: comment.trim() || undefined,
    });
    if (error) {
      if (error.includes("23505") || error.includes("duplicate")) {
        toast({ title: "Already reviewed", description: "You've already left a review for this booking.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error, variant: "destructive" });
      }
    } else {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium">Rate your experience{barberName ? ` with ${barberName}` : ""}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hovered || rating)
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="gradient-primary text-primary-foreground"
      >
        <Send className="h-3.5 w-3.5 mr-1" />
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
};

export default ReviewForm;
