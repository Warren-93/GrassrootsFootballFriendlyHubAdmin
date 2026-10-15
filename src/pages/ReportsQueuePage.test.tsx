import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsQueuePage } from './ReportsQueuePage';
import { adminConversationRepository, reportRepository } from '../api/adminRepository';
import type { ReportView } from '../api/types';

vi.mock('../api/adminRepository', () => ({
  reportRepository: { queue: vi.fn(), assign: vi.fn(), act: vi.fn() },
  adminConversationRepository: { between: vi.fn() },
}));

const REPORTED_ID = 'a2cc5680-1b2c-4d5e-8f90-123456789abc';
const REPORTER_ID = '6986f077-9a8b-4c7d-8e6f-abcdef012345';

function report(overrides: Partial<ReportView> = {}): ReportView {
  return {
    id: 'r1',
    reporterTeamId: REPORTER_ID,
    reportedTeamId: REPORTED_ID,
    relatedFixtureId: null,
    type: 'OTHER',
    severity: 'MEDIUM',
    details: null,
    status: 'OPEN',
    assignedAdminId: null,
    internalNotes: [],
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
    ...overrides,
  };
}

const named = { reportedTeamName: 'Riverside Rovers U12', reporterTeamName: 'Hilltop Hawks U12' };

describe('ReportsQueuePage', () => {
  beforeEach(() => {
    vi.mocked(reportRepository.queue).mockReset();
    vi.mocked(adminConversationRepository.between).mockReset();
  });

  it('shows both team names, with the team IDs as small print', async () => {
    vi.mocked(reportRepository.queue).mockResolvedValue({ ok: true, value: [report(named)] });

    render(<ReportsQueuePage />);

    expect(await screen.findByText('OTHER - Riverside Rovers U12')).toBeInTheDocument();
    expect(screen.getByText(/^Reported by Hilltop Hawks U12 · /)).toBeInTheDocument();
    expect(
      screen.getByText(`Reported team ID ${REPORTED_ID} · reporting team ID ${REPORTER_ID}`),
    ).toBeInTheDocument();
  });

  it('names both teams in the dialog, including who sent each message', async () => {
    vi.mocked(reportRepository.queue).mockResolvedValue({ ok: true, value: [report(named)] });
    vi.mocked(adminConversationRepository.between).mockResolvedValue({
      ok: true,
      value: [
        {
          id: 'm1',
          conversationId: 'c1',
          senderTeamId: REPORTED_ID,
          senderUserId: 'u1',
          body: 'See you Saturday',
          createdAt: '2026-10-14T09:00:00Z',
        },
      ],
    });

    render(<ReportsQueuePage />);
    await userEvent.click(await screen.findByText('OTHER - Riverside Rovers U12'));

    expect(screen.getByText('Reported team: Riverside Rovers U12')).toBeInTheDocument();
    expect(screen.getByText('Reporting team: Hilltop Hawks U12')).toBeInTheDocument();
    expect(screen.getByText(`Team ID ${REPORTED_ID}`)).toBeInTheDocument();
    expect(screen.getByText(`Team ID ${REPORTER_ID}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /load messages/i }));

    expect(await screen.findByText(/Riverside Rovers U12: See you Saturday/)).toBeInTheDocument();
  });

  it('shows the details the reporting team wrote in the dialog', async () => {
    vi.mocked(reportRepository.queue).mockResolvedValue({
      ok: true,
      value: [report({ ...named, details: 'They did not turn up and stopped answering messages.' })],
    });

    render(<ReportsQueuePage />);
    await userEvent.click(await screen.findByText('OTHER - Riverside Rovers U12'));

    expect(screen.getByText('Details from the reporting team')).toBeInTheDocument();
    expect(screen.getByText('They did not turn up and stopped answering messages.')).toBeInTheDocument();
  });

  it('does not carry a note over to the next report', async () => {
    vi.mocked(reportRepository.queue).mockResolvedValue({
      ok: true,
      value: [
        report(named),
        report({ id: 'r2', type: 'ABUSIVE_BEHAVIOUR', reportedTeamName: 'Valley United U12', reporterTeamName: 'Hilltop Hawks U12' }),
      ],
    });

    render(<ReportsQueuePage />);
    await userEvent.click(await screen.findByText('OTHER - Riverside Rovers U12'));
    await userEvent.type(screen.getByLabelText(/Note/), 'Spoke to both managers');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(await screen.findByText('ABUSIVE BEHAVIOUR - Valley United U12'));

    expect(await screen.findByText('Reported team: Valley United U12')).toBeInTheDocument();
    expect(screen.getByLabelText(/Note/)).toHaveValue('');
  });

  it('falls back to the team IDs when the API sends no names', async () => {
    vi.mocked(reportRepository.queue).mockResolvedValue({ ok: true, value: [report()] });

    render(<ReportsQueuePage />);

    expect(await screen.findByText(`OTHER - team ${REPORTED_ID}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^Reported by ${REPORTER_ID} · `))).toBeInTheDocument();
    expect(screen.queryByText(/Reported team ID/)).not.toBeInTheDocument();
  });

  it('shows the error rather than an empty queue when the load fails', async () => {
    vi.mocked(reportRepository.queue).mockResolvedValue({
      ok: false,
      message: 'Network error - check your connection and try again.',
    });

    render(<ReportsQueuePage />);

    expect(await screen.findByText('Network error - check your connection and try again.')).toBeInTheDocument();
    expect(screen.queryByText('No open reports.')).not.toBeInTheDocument();
  });
});
