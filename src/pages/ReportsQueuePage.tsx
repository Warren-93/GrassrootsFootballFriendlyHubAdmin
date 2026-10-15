import { useEffect, useState } from 'react';
import {
  Alert,
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
import { adminConversationRepository, reportRepository } from '../api/adminRepository';
import type { ConversationMessageView, ReportView } from '../api/types';
import { IdCaption, TeamNameLine } from '../components/TeamName';

const SEVERITY_COLOR: Record<string, 'default' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'default',
  HIGH: 'warning',
  SAFEGUARDING: 'error',
};

/** Who sent a message in the conversation between the report's two teams. */
function senderLabel(report: ReportView, teamId: string): string {
  if (teamId === report.reporterTeamId && report.reporterTeamName) return report.reporterTeamName;
  if (teamId === report.reportedTeamId && report.reportedTeamName) return report.reportedTeamName;
  return `team ${teamId.slice(0, 8)}`;
}

export function ReportsQueuePage() {
  const [queue, setQueue] = useState<ReportView[]>([]);
  const [selected, setSelected] = useState<ReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessageView[] | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  function load() {
    setLoading(true);
    reportRepository.queue().then((result) => {
      if (result.ok) setQueue(result.value);
      else setErrorMessage(result.message);
      setLoadFailed(!result.ok);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function handleAction(action: string) {
    if (!selected || !reason) return;
    setActing(true);
    const result = await reportRepository.act(selected.id, action, reason);
    setActing(false);
    if (result.ok) {
      setSelected(null);
      setReason('');
      load();
    } else {
      setErrorMessage(result.message);
    }
  }

  async function loadMessages() {
    if (!selected) return;
    setLoadingMessages(true);
    const result = await adminConversationRepository.between(selected.reporterTeamId, selected.reportedTeamId);
    setLoadingMessages(false);
    if (result.ok) setMessages(result.value);
    else setErrorMessage(result.message);
  }

  async function handleAssignToMe() {
    if (!selected) return;
    setActing(true);
    const result = await reportRepository.assign(selected.id);
    setActing(false);
    if (result.ok) {
      setSelected(result.value);
      load();
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Reports queue
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Safeguarding reports are surfaced first and cannot be bulk-actioned.
      </Typography>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : queue.length === 0 ? (
        // After a failed load the error above explains the empty list.
        !loadFailed && <Typography color="text.secondary">No open reports.</Typography>
      ) : (
        <List dense>
          {queue.map((r) => (
            <ListItemButton
              key={r.id}
              onClick={() => {
                setSelected(r);
                setMessages(null);
              }}
              divider
            >
              <ListItemText
                primary={`${r.type.replace(/_/g, ' ')} - ${r.reportedTeamName ?? `team ${r.reportedTeamId}`}`}
                secondary={
                  <>
                    {`Reported by ${r.reporterTeamName ?? r.reporterTeamId} · ${new Date(r.createdAt).toLocaleString()}`}
                    {(r.reportedTeamName || r.reporterTeamName) && (
                      <IdCaption>
                        Reported team ID {r.reportedTeamId} · reporting team ID {r.reporterTeamId}
                      </IdCaption>
                    )}
                  </>
                }
              />
              <Chip size="small" label={r.severity} color={SEVERITY_COLOR[r.severity]} sx={{ mr: 1 }} />
              {r.assignedAdminId && <Chip size="small" label="Assigned" variant="outlined" />}
            </ListItemButton>
          ))}
        </List>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              {selected.type.replace(/_/g, ' ')} report
              <Chip size="small" label={selected.severity} color={SEVERITY_COLOR[selected.severity]} sx={{ ml: 1 }} />
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TeamNameLine label="Reported team" id={selected.reportedTeamId} name={selected.reportedTeamName} />
                <TeamNameLine label="Reporting team" id={selected.reporterTeamId} name={selected.reporterTeamName} />
                {selected.relatedFixtureId && (
                  <Typography variant="body2">Related fixture: {selected.relatedFixtureId}</Typography>
                )}
                {selected.internalNotes.length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Internal notes
                    </Typography>
                    {selected.internalNotes.map((n, i) => (
                      <Typography key={i} variant="caption">
                        {new Date(n.createdAt).toLocaleString()}: {n.note}
                      </Typography>
                    ))}
                  </Stack>
                )}
                <Stack spacing={0.5}>
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Messages between these teams
                    </Typography>
                    {messages === null && (
                      <Button size="small" disabled={loadingMessages} onClick={loadMessages}>
                        {loadingMessages ? 'Loading…' : 'Load messages'}
                      </Button>
                    )}
                  </Stack>
                  {messages !== null &&
                    (messages.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        No conversation exists between these two teams.
                      </Typography>
                    ) : (
                      messages.map((m) => (
                        <Typography key={m.id} variant="caption" sx={{ display: 'block' }}>
                          {new Date(m.createdAt).toLocaleString()} · {senderLabel(selected, m.senderTeamId)}: {m.body}
                        </Typography>
                      ))
                    ))}
                </Stack>
                <TextField
                  label="Note (required for every action)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap' }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant="outlined"
                disabled={acting || !!selected.assignedAdminId}
                onClick={handleAssignToMe}
              >
                {selected.assignedAdminId ? 'Assigned' : 'Assign to me'}
              </Button>
              <Button disabled={acting || !reason} onClick={() => handleAction('dismiss')}>
                Dismiss
              </Button>
              <Button disabled={acting || !reason} onClick={() => handleAction('warn')}>
                Warn
              </Button>
              <Button color="warning" disabled={acting || !reason} onClick={() => handleAction('suspend')}>
                Suspend
              </Button>
              <Button color="error" variant="contained" disabled={acting || !reason} onClick={() => handleAction('escalate')}>
                Escalate
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}
