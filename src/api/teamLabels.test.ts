import { describe, expect, it } from 'vitest';
import { abilityLevelLabel, organisationLabel } from './teamLabels';

describe('team labels', () => {
  it('labels the new division values', () => {
    expect(abilityLevelLabel('PREMIER')).toBe('Premier / top division');
    expect(abilityLevelLabel('DIVISION_3_PLUS')).toBe('Division 3 or lower');
    expect(abilityLevelLabel('FESTIVAL')).toBe('Festival / non-competitive');
  });

  it('labels organisations and handles a missing one', () => {
    expect(organisationLabel('SWF')).toBe("Scottish Women's Football (SWF)");
    expect(organisationLabel('OTHER')).toBe('Other / not affiliated');
    expect(organisationLabel(null)).toBe('—');
    expect(organisationLabel(undefined)).toBe('—');
  });

  it('falls back to a readable raw value for unknown codes', () => {
    expect(abilityLevelLabel('SOME_NEW_VALUE')).toBe('SOME NEW VALUE');
  });
});
