import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FixtureInspectorPage } from './FixtureInspectorPage';
import { fixtureInspectorRepository } from '../api/adminRepository';
import type { FixtureInspectorView, FixtureTeamView } from '../api/types';

vi.mock('../api/adminRepository', () => ({
  fixtureInspectorRepository: { get: vi.fn() },
  adminConversationRepository: { between: vi.fn() },
}));

function team(id: string, name: string): FixtureTeamView {
  return { id, name, clubName: `${name} FC`, managerName: null, contactPhone: null, venueId: null };
}

function inspected(overrides: Partial<FixtureInspectorView['fixture']> = {}): FixtureInspectorView {
  return {
    fixture: {
      id: 'f1',
      friendlyRequestId: 'r1',
      homeTeam: team('h1', 'Riverside Rovers U12'),
      awayTeam: team('a1', 'Hilltop Hawks U12'),
      date: '2026-10-24',
      startTime: '10:00',
      endTime: '11:30',
      venueId: null,
      status: 'CONFIRMED',
      costShare: 'SPLIT',
      refereeArrangement: 'CLUB_SUPPLIED',
      ...overrides,
    },
    auditTrail: [],
  };
}

async function inspect() {
  render(<FixtureInspectorPage />);
  await userEvent.type(screen.getByLabelText('Fixture ID'), 'f1');
  await userEvent.click(screen.getByRole('button', { name: 'Inspect' }));
}

describe('FixtureInspectorPage', () => {
  beforeEach(() => {
    vi.mocked(fixtureInspectorRepository.get).mockReset();
  });

  it('shows the venue name, address and postcode', async () => {
    vi.mocked(fixtureInspectorRepository.get).mockResolvedValue({
      ok: true,
      value: inspected({
        venue: {
          id: 'v1',
          name: 'Riverside Park',
          address: '1 River Lane, Leeds',
          postcode: 'LS1 4AB',
          pitchSurface: null,
          accessNotes: null,
          parkingNotes: null,
          latitude: null,
          longitude: null,
        },
      }),
    });

    await inspect();

    expect(await screen.findByText('Venue: Riverside Park, 1 River Lane, Leeds, LS1 4AB')).toBeInTheDocument();
  });

  it("doesn't repeat a postcode the address already has", async () => {
    vi.mocked(fixtureInspectorRepository.get).mockResolvedValue({
      ok: true,
      value: inspected({
        venue: {
          id: 'v1',
          name: 'Riverside Park',
          address: '1 River Lane, Leeds LS1 4AB',
          postcode: 'LS1 4AB',
          pitchSurface: null,
          accessNotes: null,
          parkingNotes: null,
          latitude: null,
          longitude: null,
        },
      }),
    });

    await inspect();

    expect(await screen.findByText('Venue: Riverside Park, 1 River Lane, Leeds LS1 4AB')).toBeInTheDocument();
  });

  it('says when no venue is set', async () => {
    vi.mocked(fixtureInspectorRepository.get).mockResolvedValue({ ok: true, value: inspected() });

    await inspect();

    expect(await screen.findByText('Venue: not set')).toBeInTheDocument();
  });
});
