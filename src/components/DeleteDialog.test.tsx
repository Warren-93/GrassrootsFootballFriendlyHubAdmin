import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteDialog } from './DeleteDialog';
import { deletionRepository } from '../api/adminRepository';
import { AdminMeContext } from '../auth/AdminMeContext';
import type { AdminMe, DeletionRequestView } from '../api/types';

vi.mock('../api/adminRepository', () => ({
  deletionRepository: { preview: vi.fn(), request: vi.fn(), approve: vi.fn() },
}));

const pending: DeletionRequestView = {
  id: 'r1',
  targetType: 'USER',
  targetId: 'u1',
  targetLabel: 'Sam (sam@example.com)',
  reason: 'Asked to leave',
  status: 'PENDING',
  requestedByAdminId: 'a1',
  requestedByEmail: 'admin@example.com',
  requestedAt: '2026-10-22T15:00:00Z',
  decidedByAdminId: null,
  decidedByEmail: null,
  decidedAt: null,
  decisionNote: null,
  summary: null,
  result: null,
};

function renderAs(me: AdminMe, onDone = vi.fn()) {
  render(
    <AdminMeContext.Provider value={me}>
      <DeleteDialog open targetType="USER" targetId="u1" onClose={vi.fn()} onDone={onDone} />
    </AdminMeContext.Provider>,
  );
  return onDone;
}

describe('DeleteDialog', () => {
  beforeEach(() => {
    vi.mocked(deletionRepository.preview).mockResolvedValue({
      ok: true,
      value: {
        targetType: 'USER',
        targetId: 'u1',
        targetLabel: 'Sam (sam@example.com)',
        teamsDeleted: [{ id: 't1', name: 'Riverside Rovers' }],
        clubsDeleted: [{ id: 'c1', name: 'Riverside FC' }],
        otherTeamsAffected: ['Hilltop Hawks - confirmed fixture on 2026-11-01 will be cancelled'],
        records: [{ label: 'Fixtures', count: 2 }],
        warnings: [],
      },
    });
    vi.mocked(deletionRepository.request).mockResolvedValue({ ok: true, value: pending });
    vi.mocked(deletionRepository.approve).mockReset();
  });

  it('lets an admin only send it for approval', async () => {
    const onDone = renderAs({ id: 'a1', email: 'admin@example.com', role: 'ADMIN', totpRequired: false });

    expect(await screen.findByText('Riverside FC')).toBeInTheDocument();
    expect(screen.getByText(/Hilltop Hawks - confirmed fixture/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Your password')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Reason/), 'Asked to leave');
    await userEvent.click(screen.getByRole('button', { name: 'Send for approval' }));

    expect(deletionRepository.request).toHaveBeenCalledWith('USER', 'u1', 'Asked to leave');
    expect(deletionRepository.approve).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledWith('requested', pending);
  });

  it('has the super admin re-enter their password, and keeps the dialog open when it is wrong', async () => {
    vi.mocked(deletionRepository.approve)
      .mockResolvedValueOnce({ ok: false, message: 'That password is incorrect.', status: 403 })
      .mockResolvedValueOnce({ ok: true, value: { ...pending, status: 'COMPLETED' } });
    const onDone = renderAs({ id: 's1', email: 'mark@example.com', role: 'SUPER_ADMIN', totpRequired: false });

    await screen.findByText('Riverside FC');
    await userEvent.type(screen.getByLabelText(/Reason/), 'Asked to leave');
    const button = screen.getByRole('button', { name: 'Delete permanently' });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Your password'), 'wrong');
    await userEvent.click(button);
    expect(await screen.findByText('That password is incorrect.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText('Your password'));
    await userEvent.type(screen.getByLabelText('Your password'), 'right');
    await userEvent.click(button);
    expect(deletionRepository.approve).toHaveBeenLastCalledWith('r1', 'right', undefined, undefined);
    expect(onDone).toHaveBeenCalledWith('deleted', expect.objectContaining({ status: 'COMPLETED' }));
  });
});
