import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FixtureInspectorPage } from './FixtureInspectorPage';
import { fixtureInspectorRepository } from '../api/adminRepository';

vi.mock('../api/adminRepository', () => ({
  fixtureInspectorRepository: { list: vi.fn(), get: vi.fn() },
}));

describe('FixtureInspectorPage', () => {
  it('lists fixtures, searches by team, and opens one on click', async () => {
    vi.mocked(fixtureInspectorRepository.list).mockResolvedValue({
      ok: true,
      value: [
        {
          id: 'f1',
          date: '2026-11-01',
          startTime: '10:00:00',
          endTime: '11:30:00',
          status: 'CONFIRMED',
          homeTeamId: 'h1',
          homeTeamName: 'Riverside Rovers',
          awayTeamId: 'a1',
          awayTeamName: 'Hilltop Hawks',
          venueName: 'Riverside Park',
          createdAt: '2026-10-20T10:00:00Z',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/fixtures']}>
        <Routes>
          <Route path="/fixtures" element={<FixtureInspectorPage />} />
          <Route path="/fixtures/:fixtureId" element={<div>Opened fixture</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Riverside Rovers')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Team'), 'hawks');
    await vi.waitFor(() =>
      expect(fixtureInspectorRepository.list).toHaveBeenLastCalledWith(expect.objectContaining({ teamQuery: 'hawks' })),
    );

    await userEvent.click(screen.getByText('Hilltop Hawks'));
    expect(await screen.findByText('Opened fixture')).toBeInTheDocument();
  });
});
