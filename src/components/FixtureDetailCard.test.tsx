import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FixtureDetailCard } from './FixtureDetailCard';
import { adminConversationRepository, fixtureInspectorRepository } from '../api/adminRepository';
import type { ConversationMessageView, FixtureInspectorView, FixtureTeamView } from '../api/types';

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

function message(id: string, senderTeamId: string, body: string): ConversationMessageView {
  return { id, conversationId: 'c1', senderTeamId, senderUserId: 'u1', body, createdAt: '2026-10-15T12:00:00Z' };
}

async function inspect() {
  render(<FixtureDetailCard fixtureId="f1" />);
}

describe('FixtureDetailCard', () => {
  beforeEach(() => {
    vi.mocked(fixtureInspectorRepository.get).mockReset();
    vi.mocked(adminConversationRepository.between).mockReset();
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

  it('labels each message with the sending team name', async () => {
    vi.mocked(fixtureInspectorRepository.get).mockResolvedValue({ ok: true, value: inspected() });
    vi.mocked(adminConversationRepository.between).mockResolvedValue({
      ok: true,
      value: [
        message('m1', 'h1', 'Saturday at 10 works for us'),
        message('m2', 'a1', 'Great, see you then'),
        message('m3', '0123456789abcdef', 'From a team no longer on the fixture'),
      ],
    });

    await inspect();
    await userEvent.click(await screen.findByRole('button', { name: 'Load messages' }));

    expect(await screen.findByText(/· Riverside Rovers U12: Saturday at 10 works for us$/)).toBeInTheDocument();
    expect(screen.getByText(/· Hilltop Hawks U12: Great, see you then$/)).toBeInTheDocument();
    expect(screen.getByText(/· team 01234567: From a team no longer on the fixture$/)).toBeInTheDocument();
    expect(adminConversationRepository.between).toHaveBeenCalledWith('h1', 'a1');
  });
});
