import { api } from "./api.service";
import type {
  AdminDashboardResponse,
  BarberDashboardResponse,
  CreateUserRolePayload,
  ProfileDto,
  SalonMemberDto,
  SalonOwnerDashboardResponse,
  UpdateProfilePayload,
  UpdateUserRolePayload,
  UserDashboardResponse,
  UserRoleDto,
  PaginatedData,
} from "@/interfaces";

const BASE_PATH = "/api/v1/user";

function buildQuery(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString() ? `?${query.toString()}` : "";
}

export const userService = {
  async findProfile(userId: string) {
    return api.get<ProfileDto>(`${BASE_PATH}/FindProfile?UserId=${encodeURIComponent(userId)}`);
  },

  async updateProfile(userId: string, payload: UpdateProfilePayload) {
    return api.put<any>(`${BASE_PATH}/UpdateProfile?UserId=${encodeURIComponent(userId)}`, payload);
  },

  async deleteProfile(userId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteProfile?UserId=${encodeURIComponent(userId)}`);
  },

  async findAllProfile(page?: number, pageSize?: number, role?: string) {
    return api.get<PaginatedData<ProfileDto>>(
      `${BASE_PATH}/FindallProfile${buildQuery({ Page: page, PageSize: pageSize, Role: role })}`
    );
  },

  async uploadAvatar(userId: string, avatarFile: File) {
    const formData = new FormData();
    formData.append("UserId", userId);
    formData.append("avatar", avatarFile);

    return api.upload<any>(`${BASE_PATH}/UploadAvatar?UserId=${encodeURIComponent(userId)}`, formData);
  },

  async downloadProfile(userId: string) {
    return api.get<string>(`${BASE_PATH}/DownloadProfile?UserId=${encodeURIComponent(userId)}`);
  },

  async createUserRole(payload: CreateUserRolePayload) {
    return api.post<any>(`${BASE_PATH}/CreateUserRole`, payload);
  },

  async updateUserRole(userId: string, payload: UpdateUserRolePayload) {
    return api.put<any>(`${BASE_PATH}/UpdateUserRole?UserId=${encodeURIComponent(userId)}`, payload);
  },

  async deleteUserRole(roleId: string) {
    return api.delete<any>(`${BASE_PATH}/DeleteUserRole?RoleId=${encodeURIComponent(roleId)}`);
  },

  async findUserRole(userId: string) {
    return api.get<UserRoleDto>(`${BASE_PATH}/FindUserRole?UserId=${encodeURIComponent(userId)}`);
  },

  async findAllUserRole(page?: number, pageSize?: number, role?: string) {
    return api.get<PaginatedData<UserRoleDto>>(
      `${BASE_PATH}/FindallUserRole${buildQuery({ Page: page, PageSize: pageSize, Role: role })}`
    );
  },

  async getDashboard() {
    return api.get<UserDashboardResponse>(`${BASE_PATH}/Dashboard`);
  },

  async getSalonOwnerDashboard() {
    return api.get<SalonOwnerDashboardResponse>(`${BASE_PATH}/SalonOwnerDashboard`);
  },

  async getBarberDashboard(salonId: string) {
    return api.get<BarberDashboardResponse>(
      `${BASE_PATH}/BarberDashboard${buildQuery({ SalonId: salonId })}`
    );
  },

  async getAdminDashboard() {
    return api.get<AdminDashboardResponse>(`${BASE_PATH}/AdminDashboard`);
  },
};
