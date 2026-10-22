import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatFilterPage } from './ChatFilterPage';
import { chatFilterRepository } from '../api/adminRepository';

vi.mock('../api/adminRepository', () => ({
  chatFilterRepository: { current: vi.fn(), save: vi.fn(), reset: vi.fn(), preview: vi.fn() },
}));

describe('ChatFilterPage', () => {
  it('adds pasted words, removes one, and saves the whole list', async () => {
    vi.mocked(chatFilterRepository.current).mockResolvedValue({
      ok: true,
      value: { words: ['shit', 'twat'], usingDefaults: true, updatedByAdminId: null, updatedAt: null },
    });
    vi.mocked(chatFilterRepository.save).mockImplementation(async (words) => ({
      ok: true,
      value: { words, usingDefaults: false, updatedByAdminId: 'a1', updatedAt: '2026-10-22T15:00:00Z' },
    }));

    render(<ChatFilterPage />);

    expect(await screen.findByText('shit')).toBeInTheDocument();
    expect(screen.getByText(/built-in starter list/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Add words'), 'Bibs, cones');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    // Chips are sorted, so the first delete icon is "bibs".
    await userEvent.click(screen.getAllByTestId('CancelIcon')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Save list' }));

    expect(chatFilterRepository.save).toHaveBeenCalledWith(['cones', 'shit', 'twat']);
    expect(await screen.findByText('Saved - 3 words are now masked in chat.')).toBeInTheDocument();
  });
});
