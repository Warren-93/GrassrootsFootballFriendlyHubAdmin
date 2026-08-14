import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAdminAuth } from '../auth/AdminAuthContext';

vi.mock('../auth/AdminAuthContext', () => ({
  useAdminAuth: vi.fn(),
}));

const mockedUseAdminAuth = vi.mocked(useAdminAuth);

function renderProtectedRoute(initialPath = '/reports') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sign-in" element={<div>Sign in page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/reports" element={<div>Reports queue content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute (admin)', () => {
  it('redirects a signed-out admin to /sign-in instead of rendering the protected content', () => {
    mockedUseAdminAuth.mockReturnValue({
      signedIn: false,
      email: null,
      signOut: vi.fn(),
      setSignedIn: vi.fn(),
    } as ReturnType<typeof useAdminAuth>);

    renderProtectedRoute();

    expect(screen.getByText('Sign in page')).toBeInTheDocument();
    expect(screen.queryByText('Reports queue content')).not.toBeInTheDocument();
  });

  it('renders the protected content once signed in', () => {
    mockedUseAdminAuth.mockReturnValue({
      signedIn: true,
      email: 'admin@example.com',
      signOut: vi.fn(),
      setSignedIn: vi.fn(),
    } as ReturnType<typeof useAdminAuth>);

    renderProtectedRoute();

    expect(screen.getByText('Reports queue content')).toBeInTheDocument();
  });
});
