import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { verificationRepository } from '../api/adminRepository';
import type { VerificationRequestView } from '../api/types';

export function VerificationQueuePage() {
  const [queue, setQueue] = useState<VerificationRequestView[]>([]);
  const [selected, setSelected] = useState<VerificationRequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    setLoading(true);
    verificationRepository.queue().then((result) => {
      if (result.ok) setQueue(result.value);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function approve(id: string) {
    const result = await verificationRepository.approve(id);
    if (result.ok) {
      setSelected(null);
      load();
    } else {
      setErrorMessage(result.message);
    }
  }

  async function reject() {
    if (!selected) return;
    setRejecting(true);
    const result = await verificationRepository.reject(selected.id, rejectReason);
    setRejecting(false);
    if (result.ok) {
      setSelected(null);
      setRejectReason('');
      load();
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Verification queue
      </Typography>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : queue.length === 0 ? (
        <Typography color="text.secondary">Nothing pending review.</Typography>
      ) : (
        <List dense>
          {queue.map((r) => (
            <ListItemButton key={r.id} onClick={() => setSelected(r)} divider>
              <ListItemText
                primary={`Team ${r.teamId}`}
                secondary={`Submitted ${new Date(r.submittedAt).toLocaleString()}`}
              />
              <Chip size="small" label={r.status.replace(/_/g, ' ')} />
            </ListItemButton>
          ))}
        </List>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>Verification request - team {selected.teamId}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">Affiliation number: {selected.affiliationNumber ?? '—'}</Typography>
                <Typography variant="body2">Contact: {selected.contactDetails}</Typography>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Evidence
                  </Typography>
                  {selected.evidenceUrls.map((url) => (
                    <Typography key={url} variant="body2" component="a" href={url} target="_blank" sx={{ display: 'block' }}>
                      {url}
                    </Typography>
                  ))}
                </Box>
                {selected.status === 'AWAITING_SECOND_REJECTION' && (
                  <Alert severity="warning">
                    Already rejected once (reason: "{selected.firstRejectionReason}"). A different administrator
                    must confirm to finalize.
                  </Alert>
                )}
                <TextField
                  label="Rejection reason (sent to the applicant verbatim)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button color="error" disabled={rejecting || !rejectReason} onClick={reject}>
                Reject
              </Button>
              <Button variant="contained" onClick={() => approve(selected.id)}>
                Approve
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}
