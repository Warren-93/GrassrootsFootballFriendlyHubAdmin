import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { adminAccountRepository } from '../api/adminRepository';
import type { AdminAccountView, CreateAdminResponse } from '../api/types';
import { dateTime } from '../api/format';
import { useIsSuperAdmin } from '../auth/AdminMeContext';

/** Super admin only: who can sign in to this site, and adding or removing ordinary admins. */
export function AdminsPage() {
  const isSuper = useIsSuperAdmin();
  const [admins, setAdmins] = useState<AdminAccountView[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [created, setCreated] = useState<CreateAdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminAccountRepository.list().then((result) => {
      if (result.ok) setAdmins(result.value);
      else setError(result.message);
    });
  }

  useEffect(() => {
    if (isSuper) load();
  }, [isSuper]);

  async function add() {
    setError(null);
    const result = await adminAccountRepository.create(email.trim(), password);
    if (result.ok) {
      setCreated(result.value);
      setEmail('');
      setPassword('');
      load();
    } else setError(result.message);
  }

  async function remove(admin: AdminAccountView) {
    if (!window.confirm(`Remove ${admin.email}? They can no longer sign in (an open session lasts at most 30 minutes).`)) return;
    const result = await adminAccountRepository.remove(admin.id);
    if (result.ok) load();
    else setError(result.message);
  }

  if (!isSuper) {
    return <Alert severity="info">Only the super admin can manage admin accounts.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Admins
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Admins can use every page here, but their permanent deletes wait for you to approve. Only you can add or remove
        admins.
      </Typography>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            {admins.map((a) => (
              <Stack key={a.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {a.email}
                </Typography>
                <Chip size="small" label={a.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'} variant="outlined" />
                <Typography variant="caption" color="text.secondary" sx={{ width: 230 }}>
                  Added {dateTime(a.createdAt)} · last in {dateTime(a.lastLoginAt)}
                </Typography>
                <Button size="small" color="error" disabled={a.role === 'SUPER_ADMIN'} onClick={() => remove(a)}>
                  Remove
                </Button>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Add an admin
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField label="Email" size="small" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField
              label="Starting password"
              helperText="At least 10 characters. Pass it on securely."
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <Box>
              <Button variant="contained" disabled={!email.trim() || password.length < 10} onClick={add}>
                Add
              </Button>
            </Box>
          </Stack>
          {created && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setCreated(null)}>
              {created.admin.email} can now sign in as an admin.
              {created.provisioningUri && created.totpSecret && (
                <Box sx={{ mt: 1 }}>
                  They need this in their authenticator app (shown once):
                  <Box sx={{ my: 1 }}>
                    <QRCodeSVG value={created.provisioningUri} size={140} />
                  </Box>
                  <code>{created.totpSecret}</code>
                </Box>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
