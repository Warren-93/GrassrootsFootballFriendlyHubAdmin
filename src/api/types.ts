// Wire types, field-for-field matches to gffh-api's Admin*Dtos.java files.

/** The TOTP fields are null when the API has authenticator codes turned off. */
export interface BootstrapResponse {
  adminId: string;
  totpSecret: string | null;
  provisioningUri: string | null;
}

/**
 * With authenticator codes off (the API's default), the session fields are
 * filled in and the admin is signed in straight away; otherwise only
 * pendingToken is set and sign-in continues with a code.
 */
export interface LoginStep1Response {
  pendingToken: string;
  accessToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
  email?: string | null;
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
  /** Absent from APIs older than the admin-names change; show teamId instead. */
  teamName?: string | null;
  clubName?: string | null;
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
  /** Absent from APIs older than the admin-names change; show the team IDs instead. */
  reporterTeamName?: string | null;
  reportedTeamName?: string | null;
  relatedFixtureId: string | null;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFEGUARDING';
  /** What the reporting team wrote, up to 1000 characters. */
  details: string | null;
  status: 'OPEN' | 'DISMISSED' | 'WARNED' | 'SUSPENDED' | 'ESCALATED';
  assignedAdminId: string | null;
  internalNotes: InternalNoteView[];
  createdAt: string;
  updatedAt: string;
}

export type AbilityLevel = 'PREMIER' | 'DIVISION_1' | 'DIVISION_2' | 'DIVISION_3_PLUS' | 'NOT_IN_LEAGUE' | 'FESTIVAL';

export type Organisation = 'SYFA' | 'SAFA' | 'SWF' | 'SWFA' | 'SSFA' | 'SJFA' | 'OTHER';

export interface AdminTeamView {
  id: string;
  clubId: string;
  name: string;
  clubName: string;
  ageGroup: string;
  gender: string;
  format: string;
  /** Division the team plays in. See ABILITY_LEVEL_LABELS. */
  abilityLevel: AbilityLevel;
  /** Governing body the team is affiliated to; null when not set. Absent from older APIs. */
  organisation?: Organisation | null;
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
  /** Empty for a GIF-only message. Blocked words were masked (****) when it was sent. */
  body: string;
  createdAt: string;
  gif?: { id: string; title: string; url: string } | null;
}

/** The chat language filter's word list. `usingDefaults` until an admin first saves one. */
export interface ChatFilterView {
  words: string[];
  usingDefaults: boolean;
  updatedByAdminId: string | null;
  updatedAt: string | null;
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
  badgeUrl?: string | null;
}

export interface VenueSummary {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  pitchSurface: string | null;
  accessNotes: string | null;
  parkingNotes: string | null;
  latitude: number | null;
  longitude: number | null;
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
  /** The fixture's venue, else the home team's default. Absent from older APIs. */
  venue?: VenueSummary | null;
}

export interface FixtureInspectorView {
  fixture: FixtureView;
  auditTrail: AuditLogEntry[];
}
