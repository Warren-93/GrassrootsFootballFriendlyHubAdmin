import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssociationsPage } from './AssociationsPage';
import { associationRepository } from '../api/adminRepository';
import type { AssociationView } from '../api/types';

vi.mock('../api/adminRepository', () => ({
  associationRepository: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    addLeague: vi.fn(),
    updateLeague: vi.fn(),
    removeLeague: vi.fn(),
  },
}));

const warriors: AssociationView = {
  id: 'o1',
  name: 'Warriors FA',
  shortName: 'WFA',
  linkedOrganisation: 'SWFA',
  linkedOrganisationLabel: 'Scottish Welfare FA (SWFA)',
  contactName: null,
  contactEmail: null,
  website: null,
  notes: null,
  leagues: [],
  createdAt: '2026-10-22T16:00:00Z',
  createdByEmail: 'mark@example.com',
  updatedAt: '2026-10-22T16:00:00Z',
};

describe('AssociationsPage', () => {
  it('adds a league with divisions typed one per line', async () => {
    vi.mocked(associationRepository.list).mockResolvedValue({ ok: true, value: [warriors] });
    vi.mocked(associationRepository.addLeague).mockResolvedValue({
      ok: true,
      value: { ...warriors, leagues: [{ id: 'l1', name: 'Sunday League', divisions: ['Premier', 'Div 1'] }] },
    });

    render(<AssociationsPage />);
    expect(await screen.findByText('Warriors FA')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add league' }));
    await userEvent.type(screen.getByLabelText('League name'), 'Sunday League');
    await userEvent.type(screen.getByLabelText('Divisions'), 'Premier{enter}Div 1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(associationRepository.addLeague).toHaveBeenCalledWith('o1', 'Sunday League', ['Premier', 'Div 1']);
    expect(await screen.findByText('Sunday League')).toBeInTheDocument();
    expect(screen.getByText('Div 1')).toBeInTheDocument();
  });
});
