import { api } from "./api.service";
import type {
  BookingNotificationPayload,
  BulkNotificationPayload,
  CustomNotificationPayload,
  NotificationDto,
  NotificationSearchParams,
  PaginatedNotificationResponse,
  PaginatedTemplateResponse,
  TemplateDto,
  TemplateSearchParams,
} from "@/interfaces";

const BASE_PATH = "/api/v1/notify";

function buildQuery(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString() ? `?${query.toString()}` : "";
}

export const notificationService = {
  async findNotification(notificationId: string) {
    return api.get<NotificationDto>(
      `${BASE_PATH}/FindNotification?NotificationId=${encodeURIComponent(notificationId)}`
    );
  },

  async findAllNotification(filters: NotificationSearchParams = {}) {
    return api.get<PaginatedNotificationResponse>(
      `${BASE_PATH}/FindallNotification${buildQuery(filters as Record<string, unknown>)}`
    );
  },

  async markRead(notificationId: string) {
    return api.put<any>(
      `${BASE_PATH}/MarkRead?NotificationId=${encodeURIComponent(notificationId)}`,
      {}
    );
  },

  async markAllRead() {
    return api.put<any>(`${BASE_PATH}/MarkAllRead`, {});
  },

  async countUnread(userId?: string) {
    return api.get<{ count: number }>(
      `${BASE_PATH}/CountUnread${buildQuery({ UserId: userId })}`
    );
  },

  async deleteNotification(notificationId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteNotification?NotificationId=${encodeURIComponent(notificationId)}`
    );
  },

  async createTemplate(payload: TemplateDto) {
    return api.post<any>(`${BASE_PATH}/CreateTemplate`, payload);
  },

  async updateTemplate(templateId: string, payload: Partial<TemplateDto>) {
    return api.put<any>(
      `${BASE_PATH}/UpdateTemplate?TemplateId=${encodeURIComponent(templateId)}`,
      payload
    );
  },

  async deleteTemplate(templateId: string) {
    return api.delete<any>(
      `${BASE_PATH}/DeleteTemplate?TemplateId=${encodeURIComponent(templateId)}`
    );
  },

  async findTemplate(templateId: string) {
    return api.get<TemplateDto>(
      `${BASE_PATH}/FindTemplate?TemplateId=${encodeURIComponent(templateId)}`
    );
  },

  async findAllTemplate(filters: TemplateSearchParams = {}) {
    return api.get<PaginatedTemplateResponse>(
      `${BASE_PATH}/FindallTemplate${buildQuery(filters as Record<string, unknown>)}`
    );
  },

  async sendBookingNotification(payload: BookingNotificationPayload) {
    return api.post<any>(`${BASE_PATH}/booking`, payload);
  },

  async sendCustomNotification(payload: CustomNotificationPayload) {
    return api.post<any>(`${BASE_PATH}/SendCustom`, payload);
  },

  async sendBulkNotification(payload: BulkNotificationPayload) {
    return api.post<any>(`${BASE_PATH}/SendBulk`, payload);
  },
};
