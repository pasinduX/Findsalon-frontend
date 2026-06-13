"use client";

import { useEffect, useState } from "react";
import { reviewService } from "@/services/review.service";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Review } from "@/interfaces";

interface ReviewsListProps {
  salonId: string;
  refreshKey?: number;
}

const ReviewsList = ({ salonId, refreshKey = 0 }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await reviewService.getSalonReviews(salonId);
      setReviews(data || []);
      setLoading(false);
    };
    fetch();
  }, [salonId, refreshKey]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="container mx-auto px-4 py-14">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-display text-3xl font-bold">Reviews</h2>
          <div className="flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-full">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold text-sm">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">What our customers say</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-sm border border-border"
          >
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            {review.comment && (
              <p className="text-sm text-foreground mb-3 leading-relaxed">"{review.comment}"</p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">{review.profiles?.full_name || "Customer"}</span>
              {review.barbers?.name && <span>Barber: {review.barbers.name}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsList;
