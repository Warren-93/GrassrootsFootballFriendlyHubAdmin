import { apiClient } from './client';
import { tokenStore } from '../auth/tokenStore';
import type {
  AdminTeamView,
  AdminUserView,
  AuditLogEntry,
  BootstrapResponse,
  CurrentWeightsView,
  FixtureInspectorView,
  LoginStep1Response,
  MatchingConfigVersionView,
  OverviewResponse,
  ReportView,
  SearchResponse,
  SessionResponse,
  VerificationRequestView,
  WeightsInput,
} from './types';

export const authRepository = {
  bootstrap: (email: string, password: string) =>
    apiClient.post<BootstrapResponse>('/api/v1/admin/auth/bootstrap', { email, password }, false),

  login: (email: string, password: string) =>
    apiClient.post<LoginStep1Response>('/api/v1/admin/auth/login', { email, password }, false),

  verify: async (pendingToken: string, code: string) => {
    const result = await apiClient.post<SessionResponse>(
      '/api/v1/admin/auth/login/verify',
      { pendingToken, code },
      false,
    );
    if (result.ok) tokenStore.set(result.value.accessToken, result.value.email);
    return result;
  },

  signOut: () => tokenStore.clear(),
  isSignedIn: () => tokenStore.accessToken() !== null,
};

export const overviewRepository = {
  get: () => apiClient.get<OverviewResponse>('/api/v1/admin/overview'),
};

export const verificationRepository = {
  queue: () => apiClient.get<VerificationRequestView[]>('/api/v1/admin/verifications'),
  get: (id: string) => apiClient.get<VerificationRequestView>(`/api/v1/admin/verifications/${id}`),
  approve: (id: string) => apiClient.post<VerificationRequestView>(`/api/v1/admin/verifications/${id}/approve`),
  reject: (id: string, reason: string) =>
    apiClient.post<VerificationRequestView>(`/api/v1/admin/verifications/${id}/reject`, { reason }),
};

export const reportRepository = {
  queue: () => apiClient.get<ReportView[]>('/api/v1/admin/reports'),
  get: (id: string) => apiClient.get<ReportView>(`/api/v1/admin/reports/${id}`),
  assign: (id: string) => apiClient.post<ReportView>(`/api/v1/admin/reports/${id}/assign`),
  addNote: (id: string, note: string) => apiClient.post<ReportView>(`/api/v1/admin/reports/${id}/notes`, { note }),
  act: (id: string, action: string, reason: string) =>
    apiClient.post<ReportView>(`/api/v1/admin/reports/${id}/actions/${action}`, { reason }),
};

export const adminTeamRepository = {
  search: (query: string) => apiClient.get<AdminTeamView[]>('/api/v1/admin/teams', { query }),
  get: (teamId: string) => apiClient.get<AdminTeamView>(`/api/v1/admin/teams/${teamId}`),
  suspend: (teamId: string, reason?: string) =>
    apiClient.post<AdminTeamView>(`/api/v1/admin/teams/${teamId}/suspend`, reason ? { reason } : undefined),
  unsuspend: (teamId: string, reason?: string) =>
    apiClient.post<AdminTeamView>(`/api/v1/admin/teams/${teamId}/unsuspend`, reason ? { reason } : undefined),
  merge: (primaryTeamId: string, duplicateTeamId: string) =>
    apiClient.post<void>('/api/v1/admin/teams/merge', { primaryTeamId, duplicateTeamId }),
  verify: (teamId: string) => apiClient.post<AdminTeamView>(`/api/v1/admin/teams/${teamId}/verify`),
};

export const adminUserRepository = {
  search: (query: string) => apiClient.get<AdminUserView[]>('/api/v1/admin/users', { query }),
  get: (userId: string) => apiClient.get<AdminUserView>(`/api/v1/admin/users/${userId}`),
  suspend: (userId: string, reason?: string) =>
    apiClient.post<AdminUserView>(`/api/v1/admin/users/${userId}/suspend`, reason ? { reason } : undefined),
  unsuspend: (userId: string, reason?: string) =>
    apiClient.post<AdminUserView>(`/api/v1/admin/users/${userId}/unsuspend`, reason ? { reason } : undefined),
  forcePasswordReset: (userId: string) => apiClient.post<void>(`/api/v1/admin/users/${userId}/force-password-reset`),
  resendVerification: (userId: string) => apiClient.post<void>(`/api/v1/admin/users/${userId}/resend-verification`),
  verifyEmail: (userId: string) => apiClient.post<AdminUserView>(`/api/v1/admin/users/${userId}/verify-email`),
  delete: (userId: string) => apiClient.delete<void>(`/api/v1/admin/users/${userId}`),
};

export const matchingConfigRepository = {
  current: () => apiClient.get<CurrentWeightsView>('/api/v1/admin/matching-config/current'),
  history: () => apiClient.get<MatchingConfigVersionView[]>('/api/v1/admin/matching-config/versions'),
  preview: (teamId: string, weights: WeightsInput) =>
    apiClient.post<SearchResponse>('/api/v1/admin/matching-config/preview', { teamId, weights }),
  publish: (weights: WeightsInput, versionNote: string) =>
    apiClient.post<MatchingConfigVersionView>('/api/v1/admin/matching-config/publish', { weights, versionNote }),
};

export const auditLogRepository = {
  list: (targetType?: string, targetId?: string, limit = 100) =>
    apiClient.get<AuditLogEntry[]>('/api/v1/admin/audit-log', { targetType, targetId, limit }),
};

export const fixtureInspectorRepository = {
  get: (id: string) => apiClient.get<FixtureInspectorView>(`/api/v1/admin/fixtures/${id}`),
};
