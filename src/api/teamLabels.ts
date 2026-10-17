import type { AbilityLevel, Organisation } from './types';

/** Display labels for a team's division (the API's `abilityLevel`). */
export const ABILITY_LEVEL_LABELS: Record<AbilityLevel, string> = {
  PREMIER: 'Premier / top division',
  DIVISION_1: 'Division 1 / Championship',
  DIVISION_2: 'Division 2',
  DIVISION_3_PLUS: 'Division 3 or lower',
  NOT_IN_LEAGUE: 'Not in a league',
  FESTIVAL: 'Festival / non-competitive',
};

/** Display labels for the governing body a team is affiliated to. */
export const ORGANISATION_LABELS: Record<Organisation, string> = {
  SYFA: 'Scottish Youth FA (SYFA)',
  SAFA: 'Scottish Amateur FA (SAFA)',
  SWF: "Scottish Women's Football (SWF)",
  SWFA: 'Scottish Welfare FA (SWFA)',
  SSFA: "Scottish Schools' FA (SSFA)",
  SJFA: 'Scottish Junior FA (SJFA)',
  OTHER: 'Other / not affiliated',
};

function label(labels: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—';
  // Fall back to a readable form of the raw value for anything the API adds later.
  return labels[value] ?? value.replace(/_/g, ' ');
}

export function abilityLevelLabel(value: string | null | undefined): string {
  return label(ABILITY_LEVEL_LABELS, value);
}

export function organisationLabel(value: string | null | undefined): string {
  return label(ORGANISATION_LABELS, value);
}
