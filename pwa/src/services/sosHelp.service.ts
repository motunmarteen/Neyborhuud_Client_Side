/**
 * Guardian "Help them" screen and local security desks (owner 2026-11-27).
 * Server: NeyborHuud-ServerSide/src/modules/safety/securityDesk.controller.ts
 */
import apiClient from '@/lib/api-client';

export type SosHelpView = {
  sosEventId: string;
  status: 'pending' | 'triggered' | 'active' | 'resolved' | 'cancelled';
  live: boolean;
  isDrill: boolean;
  silent: boolean;
  startedAt: string;
  isOwner: boolean;
  person: { firstName: string | null; name: string; phone: string | null; photo: string | null };
  location: { lat: number; lng: number; address: string | null; lga: string | null; state: string | null } | null;
  responders: { guardianId: string; name: string; isYou: boolean; respondingAt: string | null; called112At: string | null }[];
  youAreResponding: boolean;
  youCalled112: boolean;
  securityDesks: { id: string; name: string; kindLabel: string; phone: string }[];
  securityDesksAlertedAt: string | null;
};

export type DeskKind = 'estate_security' | 'vigilante' | 'community_watch' | 'police_division';
export type DeskStatus = 'pending_consent' | 'pending_approval' | 'active' | 'rejected' | 'stopped' | 'removed';
export type SecurityDesk = {
  id: string;
  name: string;
  kind: DeskKind;
  kindLabel: string;
  phone: string;
  coverRadiusMeters: number;
  lga: string | null;
  state: string | null;
  status: DeskStatus;
  consentedAt: string | null;
  approvedAt: string | null;
};
export type DeskList = {
  area: SecurityDesk[];
  mine: SecurityDesk[];
  waiting: SecurityDesk[];
  canApprove: boolean;
  homeArea: { lga: string; state: string | null } | null;
};

export const DESK_KIND_OPTIONS: { value: DeskKind; label: string }[] = [
  { value: 'estate_security', label: 'Estate security' },
  { value: 'vigilante', label: 'Vigilante' },
  { value: 'community_watch', label: 'Community watch' },
  { value: 'police_division', label: 'Police division' },
];

export const sosHelpService = {
  getHelp: (sosEventId: string) => apiClient.get<SosHelpView>(`/safety/sos/${sosEventId}/help`),
  called112: (sosEventId: string) => apiClient.post<{ called112: true }>(`/safety/sos/${sosEventId}/called-112`),
  responding: (sosEventId: string) => apiClient.post(`/safety/sos/${sosEventId}/acknowledge`),

  listDesks: () => apiClient.get<DeskList>('/safety/security-desks'),
  addDesk: (body: { name: string; kind: DeskKind; phone: string; lat: number; lng: number; coverRadiusMeters: number }) =>
    apiClient.post<{ desk: SecurityDesk; smsSent: boolean }>('/safety/security-desks', body),
  approveDesk: (id: string) => apiClient.post<SecurityDesk>(`/safety/security-desks/${id}/approve`),
  rejectDesk: (id: string) => apiClient.post<SecurityDesk>(`/safety/security-desks/${id}/reject`),
  removeDesk: (id: string) => apiClient.delete(`/safety/security-desks/${id}`),

  deskLink: (token: string) =>
    apiClient.get<{ name: string; kindLabel: string; lga: string | null; state: string | null; coverRadiusMeters: number; status: DeskStatus }>(
      `/safety/desk-links/${encodeURIComponent(token)}`,
    ),
  agreeDesk: (token: string) => apiClient.post<{ status: DeskStatus }>(`/safety/desk-links/${encodeURIComponent(token)}/agree`),
  stopDeskByToken: (token: string) => apiClient.post<{ status: DeskStatus }>(`/safety/desk-links/${encodeURIComponent(token)}/stop`),
  stopDeskByCode: (code: string) => apiClient.post<{ status: DeskStatus; name: string }>(`/safety/desk-stop/${encodeURIComponent(code)}`),
};
