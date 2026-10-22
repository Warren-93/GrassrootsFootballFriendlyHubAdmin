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
  /** The fields below are absent from older APIs. */
  archived?: boolean;
  league?: string | null;
  postcode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  /** Absent from older APIs. */
  createdAt?: string | null;
  /** Last sign-in or app/session refresh; null if never. Absent from older APIs. */
  lastActiveAt?: string | null;
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

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

/** The signed-in admin. `totpRequired` says whether re-confirming needs an authenticator code too. */
export interface AdminMe {
  id: string;
  email: string;
  role: AdminRole;
  totpRequired: boolean;
}

export interface AdminAccountView {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string | null;
  lastLoginAt: string | null;
}

/** The TOTP fields are null when authenticator codes are turned off. */
export interface CreateAdminResponse {
  admin: AdminAccountView;
  totpSecret: string | null;
  provisioningUri: string | null;
}

export type DeletionTargetType = 'USER' | 'TEAM';
export type DeletionRequestStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface NamedItem {
  id: string;
  name: string;
}

export interface CountLine {
  label: string;
  count: number;
}

/** What a permanent delete would remove, worked out from the data as it is now. */
export interface DeletionPreview {
  targetType: DeletionTargetType;
  targetId: string;
  targetLabel: string;
  teamsDeleted: NamedItem[];
  clubsDeleted: NamedItem[];
  /** Teams outside the delete whose open request or confirmed fixture gets cancelled (they're notified). */
  otherTeamsAffected: string[];
  records: CountLine[];
  warnings: string[];
}

export interface DeletionRequestView {
  id: string;
  targetType: DeletionTargetType;
  targetId: string;
  targetLabel: string;
  reason: string;
  status: DeletionRequestStatus;
  requestedByAdminId: string;
  requestedByEmail: string;
  requestedAt: string;
  decidedByAdminId: string | null;
  decidedByEmail: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  /** What the preview said would go, when it was asked for. */
  summary: string | null;
  /** What was actually removed, once approved. */
  result: string | null;
}

export interface ActivityEvent {
  at: string;
  kind: string;
  text: string;
}

export interface MemberView {
  membershipId: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  role: string;
  teamId: string | null;
  teamName: string | null;
  clubId: string | null;
  clubName: string | null;
  joinedAt: string | null;
}

export interface AdminUserDetail {
  user: AdminUserView;
  memberships: MemberView[];
  activeSessions: number;
  pushDevices: number;
  notifications: number;
  chatMessagesSent: number;
  timeline: ActivityEvent[];
}

export interface ClubSummary {
  id: string;
  name: string;
  contactEmail: string | null;
  website: string | null;
  postcode: string | null;
  createdAt: string | null;
  teamNames: string[];
  venues: number;
}

export interface AdminTeamDetail {
  team: AdminTeamView;
  managerName: string | null;
  contactPhone: string | null;
  description: string | null;
  travelRadiusMiles: number;
  homeAwayPreference: string | null;
  searchVisible: boolean;
  shareContactDetails: boolean;
  firstFixtureConfirmedAt: string | null;
  club: ClubSummary | null;
  members: MemberView[];
  counts: Record<string, number>;
  timeline: ActivityEvent[];
}

/** One row of the fixture list; open it with fixtureInspectorRepository.get. */
export interface FixtureListItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  venueName: string | null;
  createdAt: string | null;
}

/** A registered (verified) association, with the leagues it runs. Kept by admins; not yet used on create team. */
export interface LeagueView {
  id: string;
  name: string;
  divisions: string[];
}

export interface AssociationView {
  id: string;
  name: string;
  shortName: string | null;
  /** Which fixed Organisation option it corresponds to, if any. */
  linkedOrganisation: Organisation | null;
  linkedOrganisationLabel: string | null;
  contactName: string | null;
  contactEmail: string | null;
  website: string | null;
  notes: string | null;
  leagues: LeagueView[];
  createdAt: string | null;
  createdByEmail: string | null;
  updatedAt: string | null;
}

export interface AssociationInput {
  name: string;
  shortName?: string | null;
  linkedOrganisation?: Organisation | null;
  contactName?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  notes?: string | null;
}
