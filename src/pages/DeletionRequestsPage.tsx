import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { deletionRepository } from '../api/adminRepository';
import type { DeletionRequestStatus, DeletionRequestView } from '../api/types';
import { dateTime } from '../api/format';
import { useAdminMe } from '../auth/AdminMeContext';
import { DeleteDialog } from '../components/DeleteDialog';

const STATUS_COLOURS: Record<DeletionRequestStatus, 'warning' | 'success' | 'default' | 'error'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

/**
 * Permanent deletes waiting for the super admin, and the record of past ones.
 * The super admin approves (password again) or rejects; the admin who asked
 * can withdraw theirs while it waits.
 */
export function DeletionRequestsPage() {
  const me = useAdminMe();
  const isSuper = me?.role === 'SUPER_ADMIN';
  const navigate = useNavigate();
  const [status, setStatus] = useState<DeletionRequestStatus | 'ALL'>('PENDING');
  const [rows, setRows] = useState<DeletionRequestView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [approving, setApproving] = useState<DeletionRequestView | null>(null);
  const [rejecting, setRejecting] = useState<DeletionRequestView | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  function load() {
    deletionRepository.list(status === 'ALL' ? undefined : status).then((result) => {
      if (result.ok) setRows(result.value);
      else setError(result.message);
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [status]);

  async function reject() {
    if (!rejecting) return;
    const result = await deletionRepository.reject(rejecting.id, rejectNote.trim() || undefined);
    setRejecting(null);
    setRejectNote('');
    if (result.ok) {
      setMessage(`Rejected - ${result.value.targetLabel} was not deleted.`);
      load();
    } else setError(result.message);
  }

  async function withdraw(request: DeletionRequestView) {
    const result = await deletionRepository.cancel(request.id);
    if (result.ok) {
      setMessage('Request withdrawn.');
      load();
    } else setError(result.message);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Delete requests
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Admins ask for users and teams to be permanently deleted from their pages. Nothing is deleted until the super
        admin approves it here with their password. Everything is recorded in the audit log.
      </Typography>

      <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v) => v && setStatus(v)}>
        <ToggleButton value="PENDING">Waiting</ToggleButton>
        <ToggleButton value="COMPLETED">Deleted</ToggleButton>
        <ToggleButton value="REJECTED">Rejected</ToggleButton>
        <ToggleButton value="CANCELLED">Withdrawn</ToggleButton>
        <ToggleButton value="ALL">All</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage(null)}>{message}</Alert>}

      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nothing here.
        </Typography>
      )}

      {rows.map((r) => (
        <Card key={r.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Chip size="small" label={r.targetType === 'USER' ? 'User' : 'Team'} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                {r.status === 'PENDING' ? (
                  <Link component="button" onClick={() => navigate(`/${r.targetType === 'USER' ? 'users' : 'teams'}/${r.targetId}`)}>
                    {r.targetLabel}
                  </Link>
                ) : (
                  r.targetLabel
                )}
              </Typography>
              <Chip size="small" color={STATUS_COLOURS[r.status]} label={r.status} />
            </Stack>
            <Typography variant="body2">
              Asked for by {r.requestedByEmail}, {dateTime(r.requestedAt)}: "{r.reason}"
            </Typography>
            {r.summary && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Preview when asked: {r.summary}
              </Typography>
            )}
            {r.decidedAt && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {r.status === 'COMPLETED' ? 'Approved' : r.status === 'REJECTED' ? 'Rejected' : 'Closed'} by {r.decidedByEmail},{' '}
                {dateTime(r.decidedAt)}
                {r.decisionNote ? `: "${r.decisionNote}"` : ''}
              </Typography>
            )}
            {r.result && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Removed: {r.result}
              </Typography>
            )}
          </CardContent>
          {r.status === 'PENDING' && (
            <CardActions>
              {isSuper && (
                <>
                  <Button color="error" variant="contained" size="small" onClick={() => setApproving(r)}>
                    Review and approve
                  </Button>
                  <Button size="small" onClick={() => setRejecting(r)}>
                    Reject
                  </Button>
                </>
              )}
              {(isSuper || r.requestedByAdminId === me?.id) && (
                <Button size="small" onClick={() => withdraw(r)}>
                  Withdraw
                </Button>
              )}
            </CardActions>
          )}
        </Card>
      ))}

      {approving && (
        <DeleteDialog
          open
          targetType={approving.targetType}
          targetId={approving.targetId}
          existingRequest={approving}
          onClose={() => setApproving(null)}
          onDone={(_, done) => {
            setApproving(null);
            setMessage(`${done.targetLabel} was permanently deleted.`);
            load();
          }}
        />
      )}

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject this delete?</DialogTitle>
        <DialogContent>
          <TextField
            label="Note to the admin (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            size="small"
            fullWidth
            multiline
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Cancel</Button>
          <Button variant="contained" onClick={reject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
