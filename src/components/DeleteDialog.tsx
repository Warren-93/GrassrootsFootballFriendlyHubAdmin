import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { deletionRepository } from '../api/adminRepository';
import type { DeletionPreview, DeletionRequestView, DeletionTargetType } from '../api/types';
import { useAdminMe } from '../auth/AdminMeContext';

interface Props {
  open: boolean;
  targetType: DeletionTargetType;
  targetId: string;
  /** Approving a request someone already made: shows its reason instead of asking for one. */
  existingRequest?: DeletionRequestView;
  onClose: () => void;
  /** `deleted` when it ran, `requested` when it's waiting for the super admin. */
  onDone: (outcome: 'deleted' | 'requested', request: DeletionRequestView) => void;
}

/**
 * The one way into a permanent delete. It always shows the live preview
 * first. An admin can only send it to the super admin for approval; the
 * super admin can approve it on the spot by re-entering their password (and
 * authenticator code, when those are on) - the API checks it again.
 */
export function DeleteDialog({ open, targetType, targetId, existingRequest, onClose, onDone }: Props) {
  const me = useAdminMe();
  const isSuper = me?.role === 'SUPER_ADMIN';
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setReason('');
    setPassword('');
    setCode('');
    setNote('');
    setError(null);
    setLoading(true);
    deletionRepository.preview(targetType, targetId).then((result) => {
      setLoading(false);
      if (result.ok) setPreview(result.value);
      else setError(result.message);
    });
  }, [open, targetType, targetId]);

  const needsCode = isSuper && !!me?.totpRequired;
  const canSubmit =
    !!preview && !busy && (existingRequest || reason.trim().length > 0) && (!isSuper || (password && (!needsCode || code)));

  async function submit() {
    setBusy(true);
    setError(null);
    let request = existingRequest ?? null;
    if (!request) {
      const asked = await deletionRepository.request(targetType, targetId, reason.trim());
      if (!asked.ok) {
        setBusy(false);
        setError(asked.message);
        return;
      }
      request = asked.value;
    }
    if (!isSuper) {
      setBusy(false);
      onDone('requested', request);
      return;
    }
    const approved = await deletionRepository.approve(request.id, password, needsCode ? code : undefined, note || undefined);
    setBusy(false);
    if (approved.ok) onDone('deleted', approved.value);
    // The request stays waiting, so a mistyped password can simply be tried again.
    else setError(approved.message);
  }

  const what = targetType === 'USER' ? 'user' : 'team';
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Permanently delete {what}</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress size={24} sx={{ m: 2 }} />}
        {preview && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="error">
              This permanently deletes <strong>{preview.targetLabel}</strong> and everything below. It can't be undone.
            </Alert>

            {preview.clubsDeleted.length > 0 && (
              <Section title="Clubs deleted">{preview.clubsDeleted.map((c) => c.name).join(', ')}</Section>
            )}
            {preview.teamsDeleted.length > 0 && (
              <Section title="Teams deleted">{preview.teamsDeleted.map((t) => t.name).join(', ')}</Section>
            )}
            {preview.records.length > 0 && (
              <Section title="Records removed">
                {preview.records.map((r) => `${r.label}: ${r.count}`).join(' · ')}
              </Section>
            )}
            {preview.otherTeamsAffected.length > 0 && (
              <Section title="Other teams affected">
                {preview.otherTeamsAffected.map((line) => (
                  <Box key={line}>{line}</Box>
                ))}
              </Section>
            )}
            {preview.warnings.map((w) => (
              <Alert key={w} severity="warning">
                {w}
              </Alert>
            ))}

            {existingRequest ? (
              <Section title={`Asked for by ${existingRequest.requestedByEmail}`}>{existingRequest.reason}</Section>
            ) : (
              <TextField
                label="Reason"
                helperText="Recorded in the audit log."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                size="small"
                required
                multiline
                fullWidth
              />
            )}

            {isSuper ? (
              <>
                {existingRequest && (
                  <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} size="small" fullWidth />
                )}
                <Typography variant="body2" color="text.secondary">
                  Confirm it's you to approve this delete.
                </Typography>
                <TextField
                  label="Your password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="small"
                  fullWidth
                />
                {needsCode && (
                  <TextField
                    label="Authenticator code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    size="small"
                    fullWidth
                  />
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nothing is deleted yet: this goes to the super admin, who approves it with their password.
              </Typography>
            )}
          </Stack>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" color="error" disabled={!canSubmit} onClick={submit}>
          {busy ? 'Working…' : isSuper ? (existingRequest ? 'Approve and delete' : 'Delete permanently') : 'Send for approval'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" component="div">
        {children}
      </Typography>
    </Box>
  );
}
