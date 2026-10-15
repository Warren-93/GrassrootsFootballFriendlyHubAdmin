import { useState } from 'react';
import { Alert, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { adminConversationRepository, fixtureInspectorRepository } from '../api/adminRepository';
import type { ConversationMessageView, FixtureInspectorView } from '../api/types';

export function FixtureInspectorPage() {
  const [fixtureId, setFixtureId] = useState('');
  const [view, setView] = useState<FixtureInspectorView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ConversationMessageView[] | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  async function load() {
    if (!fixtureId) return;
    setLoading(true);
    setErrorMessage(null);
    setMessages(null);
    const result = await fixtureInspectorRepository.get(fixtureId);
    setLoading(false);
    if (result.ok) setView(result.value);
    else {
      setView(null);
      setErrorMessage(result.message);
    }
  }

  async function loadMessages() {
    if (!view) return;
    setLoadingMessages(true);
    const result = await adminConversationRepository.between(view.fixture.homeTeam.id, view.fixture.awayTeam.id);
    setLoadingMessages(false);
    if (result.ok) setMessages(result.value);
    else setErrorMessage(result.message);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Fixture inspector
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Read-only. Message content is loaded separately, on request, and every view is audit-logged.
      </Typography>

      <Stack direction="row" spacing={1}>
        <TextField
          label="Fixture ID"
          value={fixtureId}
          onChange={(e) => setFixtureId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          size="small"
          fullWidth
        />
        <Button variant="contained" disabled={loading} onClick={load}>
          Inspect
        </Button>
      </Stack>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {view && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {view.fixture.homeTeam.name} vs {view.fixture.awayTeam.name}
            </Typography>
            <Typography variant="body2">
              {view.fixture.date} {view.fixture.startTime}-{view.fixture.endTime} · {view.fixture.status}
            </Typography>
            <Typography variant="body2">Cost share: {view.fixture.costShare}</Typography>
            <Typography variant="body2">Referee: {view.fixture.refereeArrangement}</Typography>
            <Typography variant="body2">
              Venue:{' '}
              {view.fixture.venue
                ? [view.fixture.venue.name, view.fixture.venue.address, view.fixture.venue.postcode].filter(Boolean).join(', ')
                : 'not set'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Messages between these teams
              </Typography>
              {messages === null && (
                <Button size="small" disabled={loadingMessages} onClick={loadMessages}>
                  {loadingMessages ? 'Loading…' : 'Load messages'}
                </Button>
              )}
            </Stack>
            {messages !== null && (
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                {messages.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No conversation exists between these two teams.
                  </Typography>
                ) : (
                  messages.map((m) => (
                    <Typography key={m.id} variant="caption" sx={{ display: 'block' }}>
                      {new Date(m.createdAt).toLocaleString()} · team {m.senderTeamId.slice(0, 8)}: {m.body}
                    </Typography>
                  ))
                )}
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Audit trail
            </Typography>
            {view.auditTrail.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No administrator actions recorded against this fixture.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {view.auditTrail.map((entry) => (
                  <Typography key={entry.id} variant="caption">
                    {new Date(entry.timestamp).toLocaleString()} · {entry.actorEmail} · {entry.action}
                    {entry.reason ? ` - "${entry.reason}"` : ''}
                  </Typography>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
