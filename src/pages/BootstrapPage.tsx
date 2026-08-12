import { useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../api/adminRepository';
import type { BootstrapResponse } from '../api/types';

/**
 * Not one of the 9 numbered ADM screens - a one-time setup flow for creating
 * the very first admin account, since there's no public admin registration
 * (every account after the first is created by an existing admin).
 */
export function BootstrapPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BootstrapResponse | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const response = await authRepository.bootstrap(email, password);
    setSubmitting(false);
    if (response.ok) setResult(response.value);
    else setErrorMessage(response.message);
  }

  if (result) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h6">Scan into your authenticator app</Typography>
            <QRCodeSVG value={result.provisioningUri} size={200} />
            <Typography variant="caption" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
              {result.totpSecret}
            </Typography>
            <Alert severity="warning" sx={{ width: '100%' }}>
              This is shown once. Scan it now - you'll need a code from it every time you sign in.
            </Alert>
            <Button variant="contained" fullWidth onClick={() => navigate('/sign-in')}>
              Continue to sign in
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Create the first admin account</Typography>
            <Typography variant="body2" color="text.secondary">
              Only available while no admin account exists yet.
            </Typography>
          </Box>
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Button variant="contained" disabled={submitting || !email || password.length < 10} onClick={handleSubmit}>
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
