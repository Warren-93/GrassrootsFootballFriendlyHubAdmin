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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { adminTeamRepository } from '../api/adminRepository';
import type { AdminTeamView } from '../api/types';

export function ClubsTeamsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminTeamView[]>([]);
  const [selected, setSelected] = useState<AdminTeamView | null>(null);
  const [reason, setReason] = useState('');
  const [mergeOpen, setMergeOpen] = useState(false);
  const [duplicateId, setDuplicateId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (!query) return;
    setSearching(true);
    const result = await adminTeamRepository.search(query);
    setSearching(false);
    if (result.ok) setResults(result.value);
    else setErrorMessage(result.message);
  }

  async function toggleSuspend() {
    if (!selected) return;
    const result = selected.suspended
      ? await adminTeamRepository.unsuspend(selected.id, reason || undefined)
      : await adminTeamRepository.suspend(selected.id, reason || undefined);
    if (result.ok) {
      setSelected(result.value);
      setResults((prev) => prev.map((t) => (t.id === result.value.id ? result.value : t)));
      setReason('');
    } else {
      setErrorMessage(result.message);
    }
  }

  async function merge() {
    if (!selected || !duplicateId) return;
    const result = await adminTeamRepository.merge(selected.id, duplicateId);
    if (result.ok) {
      setMergeOpen(false);
      setDuplicateId('');
      search();
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Clubs and teams
      </Typography>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      <Stack direction="row" spacing={1}>
        <TextField
          label="Search team name"
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
        {results.map((t) => (
          <ListItemButton key={t.id} onClick={() => setSelected(t)} divider>
            <ListItemText primary={t.name} secondary={`${t.clubName} · ${t.ageGroup} · ${t.format}`} />
            {t.suspended && <Chip size="small" color="error" label="Suspended" sx={{ mr: 1 }} />}
            <Chip size="small" label={t.verification} variant="outlined" />
          </ListItemButton>
        ))}
      </List>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.name}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">Club: {selected.clubName}</Typography>
                <Typography variant="body2">
                  {selected.ageGroup} · {selected.gender} · {selected.format} · {selected.abilityLevel}
                </Typography>
                <Typography variant="body2">Verification: {selected.verification}</Typography>
                <TextField
                  label="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMergeOpen(true)}>Merge duplicate into this…</Button>
              <Button color={selected.suspended ? 'success' : 'error'} onClick={toggleSuspend}>
                {selected.suspended ? 'Unsuspend' : 'Suspend'}
              </Button>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={mergeOpen} onClose={() => setMergeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Merge duplicate team</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Primary: {selected?.name} ({selected?.id})
            </Typography>
            <TextField
              label="Duplicate team ID"
              value={duplicateId}
              onChange={(e) => setDuplicateId(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!duplicateId} onClick={merge}>
            Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
