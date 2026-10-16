import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuditLogPage } from './AuditLogPage';
import { auditLogRepository } from '../api/adminRepository';
import type { AuditLogEntry } from '../api/types';

vi.mock('../api/adminRepository', () => ({
  auditLogRepository: { list: vi.fn() },
}));

function entry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'e1',
    actorAdminId: 'admin1',
    actorEmail: 'sam@example.com',
    action: 'TEAM_SUSPENDED',
    targetType: 'TEAM',
    targetId: 't1',
    reason: null,
    timestamp: '2026-10-15T12:00:00Z',
    ...overrides,
  };
}

describe('AuditLogPage', () => {
  it('says "None" for an entry with no reason, and shows the reason otherwise', async () => {
    vi.mocked(auditLogRepository.list).mockResolvedValue({
      ok: true,
      value: [entry(), entry({ id: 'e2', reason: 'Repeated no-shows' })],
    });

    render(<AuditLogPage />);

    expect(await screen.findByRole('cell', { name: 'None' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Repeated no-shows' })).toBeInTheDocument();
  });
});
