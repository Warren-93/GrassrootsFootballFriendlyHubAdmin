import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { overviewRepository } from '../api/adminRepository';
import type { OverviewResponse } from '../api/types';

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 600, color: highlight ? 'error.main' : 'text.primary' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    overviewRepository.get().then((result) => {
      if (result.ok) setData(result.value);
      else setErrorMessage(result.message);
    });
  }, []);

  if (errorMessage) return <Alert severity="error">{errorMessage}</Alert>;
  if (!data) return <CircularProgress />;

  const safeguardingCount = data.reportQueueDepthBySeverity.SAFEGUARDING ?? 0;

  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Overview
      </Typography>

      {safeguardingCount > 0 && (
        <Alert severity="error">
          {safeguardingCount} safeguarding-flagged report{safeguardingCount === 1 ? '' : 's'} awaiting review.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Verification backlog" value={data.verificationBacklog} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Teams created this week" value={data.teamsCreatedThisWeek} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Fixtures created this week" value={data.fixturesCreatedThisWeek} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Error rate" value={`${data.errorRatePercent}%`} />
        </Grid>
      </Grid>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Report queue depth by severity
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(data.reportQueueDepthBySeverity).map(([severity, count]) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={severity}>
              <StatCard label={severity} value={count} highlight={severity === 'SAFEGUARDING' && count > 0} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
