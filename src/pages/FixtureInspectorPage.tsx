import { useState } from 'react';
import { Alert, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { fixtureInspectorRepository } from '../api/adminRepository';
import type { FixtureInspectorView } from '../api/types';

export function FixtureInspectorPage() {
  const [fixtureId, setFixtureId] = useState('');
  const [view, setView] = useState<FixtureInspectorView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!fixtureId) return;
    setLoading(true);
    setErrorMessage(null);
    const result = await fixtureInspectorRepository.get(fixtureId);
    setLoading(false);
    if (result.ok) setView(result.value);
    else {
      setView(null);
      setErrorMessage(result.message);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Fixture inspector
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Read-only. Message content isn't shown here - no messaging feature exists yet.
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
