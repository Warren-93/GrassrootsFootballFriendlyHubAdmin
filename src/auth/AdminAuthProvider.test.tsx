import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthProvider } from './AdminAuthProvider';
import { tokenStore } from './tokenStore';
import { apiClient } from '../api/client';
import { ProtectedRoute } from '../routes/ProtectedRoute';

function ReportsStub() {
  useEffect(() => {
    apiClient.get('/api/v1/admin/reports');
  }, []);
  return <div>Reports queue content</div>;
}

describe('AdminAuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the admin back to sign-in when the API says the session has expired', async () => {
    tokenStore.set('expired-admin-token', 'admin@example.com');
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);

    render(
      <AdminAuthProvider>
        <MemoryRouter initialEntries={['/reports']}>
          <Routes>
            <Route path="/sign-in" element={<div>Sign in page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/reports" element={<ReportsStub />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AdminAuthProvider>,
    );

    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
    expect(tokenStore.accessToken()).toBeNull();
  });
});
