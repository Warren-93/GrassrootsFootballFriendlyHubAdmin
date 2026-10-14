import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInPage } from './SignInPage';
import { authRepository } from '../api/adminRepository';
import { useAdminAuth } from '../auth/AdminAuthContext';

vi.mock('../api/adminRepository', () => ({ authRepository: { login: vi.fn(), verify: vi.fn() } }));
vi.mock('../auth/AdminAuthContext', () => ({ useAdminAuth: vi.fn() }));

const setSignedIn = vi.fn();

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/" element={<div>Overview</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitPassword() {
  await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.dev');
  await userEvent.type(screen.getByLabelText(/password/i), 'right-password');
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
}

describe('SignInPage', () => {
  beforeEach(() => {
    vi.mocked(useAdminAuth).mockReturnValue({
      signedIn: false, email: null, signOut: vi.fn(), setSignedIn,
    } as ReturnType<typeof useAdminAuth>);
  });

  it('signs straight in when the API needs no authenticator code', async () => {
    vi.mocked(authRepository.login).mockResolvedValue({
      ok: true,
      value: { pendingToken: 'p', accessToken: 'session', tokenType: 'Bearer', expiresIn: 1800, email: 'admin@test.dev' },
    } as Awaited<ReturnType<typeof authRepository.login>>);

    renderSignIn();
    await submitPassword();

    expect(setSignedIn).toHaveBeenCalledWith('admin@test.dev');
    expect(await screen.findByText('Overview')).toBeInTheDocument();
  });

  it('asks for the code when the API still requires one', async () => {
    vi.mocked(authRepository.login).mockResolvedValue({
      ok: true,
      value: { pendingToken: 'p' },
    } as Awaited<ReturnType<typeof authRepository.login>>);

    renderSignIn();
    await submitPassword();

    expect(await screen.findByLabelText(/6-digit code/i)).toBeInTheDocument();
  });
});
