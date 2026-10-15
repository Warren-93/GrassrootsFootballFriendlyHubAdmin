import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerificationQueuePage } from './VerificationQueuePage';
import { verificationRepository } from '../api/adminRepository';
import type { VerificationRequestView } from '../api/types';

vi.mock('../api/adminRepository', () => ({
  verificationRepository: { queue: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}));

const TEAM_ID = 'a2cc5680-1b2c-4d5e-8f90-123456789abc';

function request(overrides: Partial<VerificationRequestView> = {}): VerificationRequestView {
  return {
    id: 'v1',
    teamId: TEAM_ID,
    affiliationNumber: 'FA-123',
    contactDetails: 'sam@example.com',
    evidenceUrls: [],
    status: 'PENDING',
    firstRejectionReason: null,
    finalRejectionReason: null,
    submittedAt: '2026-10-15T12:00:00Z',
    reviewedAt: null,
    ...overrides,
  };
}

function queueReturns(items: VerificationRequestView[]) {
  vi.mocked(verificationRepository.queue).mockResolvedValue({ ok: true, value: items });
}

describe('VerificationQueuePage', () => {
  beforeEach(() => {
    vi.mocked(verificationRepository.queue).mockReset();
  });

  it('shows the team and club names, with the team ID as small print', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12', clubName: 'Riverside FC' })]);

    render(<VerificationQueuePage />);

    expect(await screen.findByText('Riverside Rovers U12')).toBeInTheDocument();
    expect(screen.getByText(/^Riverside FC · Submitted/)).toBeInTheDocument();
    expect(screen.getByText(`Team ID ${TEAM_ID}`)).toBeInTheDocument();
    expect(screen.queryByText(`Team ${TEAM_ID}`)).not.toBeInTheDocument();
  });

  it('names the team in the review dialog', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12', clubName: 'Riverside FC' })]);

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));

    expect(screen.getByText('Verification request - Riverside Rovers U12')).toBeInTheDocument();
    expect(screen.getByText('Team: Riverside Rovers U12')).toBeInTheDocument();
    expect(screen.getByText('Club: Riverside FC')).toBeInTheDocument();
  });

  it('falls back to the team ID when the API sends no name', async () => {
    queueReturns([request()]);

    render(<VerificationQueuePage />);

    expect(await screen.findByText(`Team ${TEAM_ID}`)).toBeInTheDocument();
    expect(screen.queryByText(`Team ID ${TEAM_ID}`)).not.toBeInTheDocument();
  });
});
