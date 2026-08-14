// Wire types, field-for-field matches to gffh-api's Admin*Dtos.java files.

export interface BootstrapResponse {
  adminId: string;
  totpSecret: string;
  provisioningUri: string;
}

export interface LoginStep1Response {
  pendingToken: string;
}

export interface SessionResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
}

export interface OverviewResponse {
  verificationBacklog: number;
  reportQueueDepthBySeverity: Record<string, number>;
  teamsCreatedThisWeek: number;
  fixturesCreatedThisWeek: number;
  errorRatePercent: number;
}

export interface VerificationRequestView {
  id: string;
  teamId: string;
  affiliationNumber: string | null;
  contactDetails: string;
  evidenceUrls: string[];
  status: 'PENDING' | 'AWAITING_SECOND_REJECTION' | 'APPROVED' | 'REJECTED';
  firstRejectionReason: string | null;
  finalRejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface InternalNoteView {
  adminId: string;
  note: string;
  createdAt: string;
}

export interface ReportView {
  id: string;
  reporterTeamId: string;
  reportedTeamId: string;
  relatedFixtureId: string | null;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFEGUARDING';
  status: 'OPEN' | 'DISMISSED' | 'WARNED' | 'SUSPENDED' | 'ESCALATED';
  assignedAdminId: string | null;
  internalNotes: InternalNoteView[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminTeamView {
  id: string;
  clubId: string;
  name: string;
  clubName: string;
  ageGroup: string;
  gender: string;
  format: string;
  abilityLevel: string;
  verification: string;
  suspended: boolean;
}

export interface MembershipView {
  teamId: string | null;
  clubId: string | null;
  role: string;
}

export interface AdminUserView {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  suspended: boolean;
  memberships: MembershipView[];
}

export interface WeightsInput {
  age: number;
  availability: number;
  format: number;
  distance: number;
  homeAway: number;
  ability: number;
  ageBandTolerance?: number;
  distanceFreeMiles?: number;
  distanceFloor?: number;
}

export interface WeightsView {
  age: number;
  availability: number;
  format: number;
  distance: number;
  homeAway: number;
  ability: number;
}

export interface CurrentWeightsView extends WeightsView {
  ageBandTolerance: number;
  distanceFreeMiles: number;
  distanceFloor: number;
}

export interface MatchingConfigVersionView {
  id: string;
  age: number;
  availability: number;
  format: number;
  distance: number;
  homeAway: number;
  ability: number;
  ageBandTolerance: number;
  distanceFreeMiles: number;
  distanceFloor: number;
  versionNote: string;
  publishedByAdminId: string;
  publishedAt: string;
  active: boolean;
}

export interface MatchSummary {
  team: { id: string; name: string; clubName: string };
  score: number;
  band: string;
  milesApart: number;
  reasons: string[];
}

export interface SearchResponse {
  searchId: string;
  totalResults: number;
  results: MatchSummary[];
  weights: WeightsView;
}

export interface ConversationMessageView {
  id: string;
  conversationId: string;
  senderTeamId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorAdminId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  timestamp: string;
}

export interface FixtureTeamView {
  id: string;
  name: string;
  clubName: string;
  managerName: string | null;
  contactPhone: string | null;
  venueId: string | null;
}

export interface FixtureView {
  id: string;
  friendlyRequestId: string;
  homeTeam: FixtureTeamView;
  awayTeam: FixtureTeamView;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string | null;
  status: string;
  costShare: string;
  refereeArrangement: string;
}

export interface FixtureInspectorView {
  fixture: FixtureView;
  auditTrail: AuditLogEntry[];
}
