import { useState } from 'react';
import { Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../api/adminRepository';
import { useAdminAuth } from '../auth/AdminAuthContext';

export function SignInPage() {
  const navigate = useNavigate();
  const { setSignedIn } = useAdminAuth();

  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePasswordSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await authRepository.login(email, password);
    setSubmitting(false);
    if (result.ok) {
      setPendingToken(result.value.pendingToken);
      setStep('code');
    } else {
      setErrorMessage(result.message);
    }
  }

  async function handleCodeSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await authRepository.verify(pendingToken, code);
    setSubmitting(false);
    if (result.ok) {
      setSignedIn(result.value.email);
      navigate('/');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Administrator sign-in</Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 'password' ? 'Step 1 of 2 - password' : 'Step 2 of 2 - authenticator code'}
            </Typography>
          </Box>

          {step === 'password' ? (
            <>
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth autoFocus />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <Button variant="contained" disabled={submitting || !email || !password} onClick={handlePasswordSubmit}>
                {submitting ? 'Checking…' : 'Continue'}
              </Button>
            </>
          ) : (
            <>
              <TextField
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                fullWidth
                autoFocus
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              />
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <Button variant="contained" disabled={submitting || code.length !== 6} onClick={handleCodeSubmit}>
                {submitting ? 'Verifying…' : 'Sign in'}
              </Button>
            </>
          )}

          <Link component="button" variant="caption" onClick={() => navigate('/bootstrap')}>
            First time setting up? Create the admin account
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
