import { render, screen, within } from '@testing-library/react';
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

  it('does not carry a rejection reason over to the next request', async () => {
    queueReturns([
      request({ teamName: 'Riverside Rovers U12' }),
      request({ id: 'v2', teamId: 'other-team', teamName: 'Hilltop Hawks U12' }),
    ]);

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));
    await userEvent.type(screen.getByLabelText('Reason for the second admin'), 'Evidence is unreadable');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(await screen.findByText('Hilltop Hawks U12'));

    expect(await screen.findByText('Verification request - Hilltop Hawks U12')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason for the second admin')).toHaveValue('');
  });

  it('shows a failed approval inside the dialog, where the admin can see it', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12' })]);
    vi.mocked(verificationRepository.approve).mockResolvedValue({
      ok: false,
      message: 'This request has already been reviewed.',
      status: 409,
    });

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await within(screen.getByRole('dialog')).findByText('This request has already been reviewed.')).toBeInTheDocument();
  });

  it('offers only Reject on a request already rejected once, and says why', async () => {
    queueReturns([
      request({
        teamName: 'Riverside Rovers U12',
        status: 'AWAITING_SECOND_REJECTION',
        firstRejectionReason: 'Evidence is unreadable',
      }),
    ]);
    vi.mocked(verificationRepository.reject).mockResolvedValue({
      ok: true,
      value: request({ status: 'REJECTED', finalRejectionReason: 'Evidence is still unreadable' }),
    });

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(/Already rejected once \(reason: "Evidence is unreadable"\), so it can't be approved now/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/A different administrator can confirm the rejection/)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Reason for the second admin')).not.toBeInTheDocument();

    await userEvent.type(
      within(dialog).getByLabelText('Rejection reason (sent to the team as written)'),
      'Evidence is still unreadable',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(verificationRepository.reject).toHaveBeenCalledWith('v1', 'Evidence is still unreadable');
  });

  it('leaves the reason out of the notice when the first rejection has none', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12', status: 'AWAITING_SECOND_REJECTION' })]);

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));

    expect(screen.getByText(/^Already rejected once, so it can't be approved now\./)).toBeInTheDocument();
  });

  it('says a first rejection reason goes to the second admin, not the team', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12' })]);
    vi.mocked(verificationRepository.reject).mockResolvedValue({
      ok: true,
      value: request({ status: 'AWAITING_SECOND_REJECTION', firstRejectionReason: 'Evidence is unreadable' }),
    });

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));

    const dialog = screen.getByRole('dialog');
    const reason = within(dialog).getByLabelText('Reason for the second admin');
    expect(reason).toHaveAccessibleDescription(
      "The team isn't told until a different administrator confirms the rejection.",
    );
    expect(within(dialog).queryByLabelText(/sent to the team/)).not.toBeInTheDocument();

    await userEvent.type(reason, 'Evidence is unreadable');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(verificationRepository.reject).toHaveBeenCalledWith('v1', 'Evidence is unreadable');
  });

  it('offers Approve on a pending request', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12' })]);

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));

    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
    expect(screen.queryByText(/Already rejected once/)).not.toBeInTheDocument();
  });

  it('says when no affiliation number was given', async () => {
    queueReturns([request({ teamName: 'Riverside Rovers U12', affiliationNumber: null })]);

    render(<VerificationQueuePage />);
    await userEvent.click(await screen.findByText('Riverside Rovers U12'));

    expect(screen.getByText('Affiliation number: Not given')).toBeInTheDocument();
  });

  it('shows the error rather than an empty queue when the load fails', async () => {
    vi.mocked(verificationRepository.queue).mockResolvedValue({
      ok: false,
      message: 'Network error - check your connection and try again.',
    });

    render(<VerificationQueuePage />);

    expect(await screen.findByText('Network error - check your connection and try again.')).toBeInTheDocument();
    expect(screen.queryByText('Nothing pending review.')).not.toBeInTheDocument();
  });
});
