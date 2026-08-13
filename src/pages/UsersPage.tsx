import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { adminUserRepository } from '../api/adminRepository';
import type { AdminUserView } from '../api/types';

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminUserView[]>([]);
  const [selected, setSelected] = useState<AdminUserView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (!query) return;
    setSearching(true);
    const result = await adminUserRepository.search(query);
    setSearching(false);
    if (result.ok) setResults(result.value);
    else setErrorMessage(result.message);
  }

  async function toggleSuspend() {
    if (!selected) return;
    const result = selected.suspended
      ? await adminUserRepository.unsuspend(selected.id)
      : await adminUserRepository.suspend(selected.id);
    if (result.ok) {
      setSelected(result.value);
      setResults((prev) => prev.map((u) => (u.id === result.value.id ? result.value : u)));
    } else {
      setErrorMessage(result.message);
    }
  }

  async function forceReset() {
    if (!selected) return;
    const result = await adminUserRepository.forcePasswordReset(selected.id);
    setToast(result.ok ? 'Password reset issued (logged server-side - no email provider configured).' : result.message);
  }

  async function resendVerification() {
    if (!selected) return;
    const result = await adminUserRepository.resendVerification(selected.id);
    setToast(result.ok ? 'Verification email resent.' : result.message);
  }

  async function verifyEmail() {
    if (!selected) return;
    const result = await adminUserRepository.verifyEmail(selected.id);
    if (result.ok) {
      setSelected(result.value);
      setResults((prev) => prev.map((u) => (u.id === result.value.id ? result.value : u)));
      setToast('Email marked as verified.');
    } else {
      setToast(result.message);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Users
      </Typography>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      <Stack direction="row" spacing={1}>
        <TextField
          label="Search email or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          size="small"
          fullWidth
        />
        <Button variant="contained" disabled={searching} onClick={search}>
          Search
        </Button>
      </Stack>

      <List dense>
        {results.map((u) => (
          <ListItemButton key={u.id} onClick={() => setSelected(u)} divider>
            <ListItemText primary={u.displayName} secondary={u.email} />
            {u.suspended && <Chip size="small" color="error" label="Suspended" sx={{ mr: 1 }} />}
            {!u.emailVerified && <Chip size="small" label="Unverified" variant="outlined" />}
          </ListItemButton>
        ))}
      </List>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.displayName}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">{selected.email}</Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Roles across clubs/teams
                  </Typography>
                  {selected.memberships.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No memberships.
                    </Typography>
                  ) : (
                    selected.memberships.map((m, i) => (
                      <Typography key={i} variant="caption">
                        {m.role} · {m.teamId ? `team ${m.teamId}` : `club ${m.clubId}`}
                      </Typography>
                    ))
                  )}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap' }}>
              {!selected.emailVerified && (
                <Button onClick={verifyEmail} color="success">
                  Verify email now
                </Button>
              )}
              <Button onClick={resendVerification}>Resend verification</Button>
              <Button onClick={forceReset}>Force password reset</Button>
              <Button color={selected.suspended ? 'success' : 'error'} onClick={toggleSuspend}>
                {selected.suspended ? 'Unsuspend' : 'Suspend'}
              </Button>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} message={toast} />
    </Stack>
  );
}
