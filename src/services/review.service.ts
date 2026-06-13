import { api } from "./api.service";
import type {
  CreateReviewRequest,
  PaginatedReviewResponse,
  RatingSummaryDto,
  Review,
  ReviewDto,
  ReviewSearchParams,
} from "@/interfaces";

const BASE_PATH = "/api/v1/review";

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString() ? `?${query.toString()}` : "";
}

export const reviewService = {
  async createReview(payload: CreateReviewRequest) {
    return api.post<any>(`${BASE_PATH}/CreateReview`, payload);
  },

  async updateReview(reviewId: string, payload: Partial<CreateReviewRequest>) {
    return api.put<any>(`${BASE_PATH}/UpdateReview?ReviewId=${encodeURIComponent(reviewId)}`, payload);
  },

  async deleteReview(reviewId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteReview?ReviewId=${encodeURIComponent(reviewId)}`);
  },

  async findReview(reviewId: string) {
    return api.get<ReviewDto>(`${BASE_PATH}/FindReview?ReviewId=${encodeURIComponent(reviewId)}`);
  },

  async findAllReview(filters: ReviewSearchParams = {}) {
    return api.get<PaginatedReviewResponse>(`${BASE_PATH}/FindallReview${buildQuery(filters as Record<string, string | number | boolean | undefined>)}`);
  },

  async getSalonReviews(salonId: string) {
    const response = await api.get<any>(
      `${BASE_PATH}/FindallReviewBySalon?SalonId=${encodeURIComponent(salonId)}`
    );
    if (!response.data || response.error) return { data: [] as Review[], error: response.error };
    const raw = response.data as any;
    const paginated = Array.isArray(raw) ? { Reviews: raw } : (raw?.data ?? raw);
    const dtos: ReviewDto[] = paginated?.Reviews ?? [];
    return {
      data: dtos.map((dto) => ({
        id: dto.ReviewId,
        salon_id: dto.SalonId,
        barber_id: dto.BarberId,
        booking_id: dto.BookingId,
        user_id: dto.UserId,
        rating: dto.Rating,
        comment: dto.Comment || null,
        created_at: dto.CreatedAt,
        profiles: { full_name: dto.UserName || null },
        barbers: null,
      } as Review)),
      error: null,
    };
  },

  async findAllReviewBySalon(salonId: string, page?: number, pageSize?: number) {
    return api.get<PaginatedReviewResponse>(
      `${BASE_PATH}/FindallReviewBySalon${buildQuery({ SalonId: salonId, Page: page, PageSize: pageSize })}`
    );
  },

  async findAllReviewByBarber(barberId: string, page?: number, pageSize?: number) {
    return api.get<PaginatedReviewResponse>(
      `${BASE_PATH}/FindallReviewByBarber${buildQuery({ BarberId: barberId, Page: page, PageSize: pageSize })}`
    );
  },

  async findAllReviewByUser(userId: string, page?: number, pageSize?: number) {
    return api.get<PaginatedReviewResponse>(
      `${BASE_PATH}/FindallReviewByUser${buildQuery({ UserId: userId, Page: page, PageSize: pageSize })}`
    );
  },

  async getRatingSummarySalon(salonId: string) {
    return api.get<RatingSummaryDto>(`${BASE_PATH}/RatingSummarySalon?SalonId=${encodeURIComponent(salonId)}`);
  },

  async getRatingSummaryBarber(barberId: string) {
    return api.get<RatingSummaryDto>(`${BASE_PATH}/RatingSummaryBarber?BarberId=${encodeURIComponent(barberId)}`);
  },

  async downloadReview(filters: Record<string, string | number | undefined> = {}) {
    return api.get<string>(`${BASE_PATH}/DownloadReview${buildQuery(filters)}`);
  },
};
