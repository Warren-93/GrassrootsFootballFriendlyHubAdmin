import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Link, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { adminTeamRepository } from '../api/adminRepository';
import type { AdminTeamDetail } from '../api/types';
import { dateTime, roleLabel } from '../api/format';
import { abilityLevelLabel, organisationLabel } from '../api/teamLabels';
import { InfoGrid } from '../components/InfoGrid';
import { Timeline } from '../components/Timeline';
import { DeleteDialog } from '../components/DeleteDialog';

export function TeamDetailPage() {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminTeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    adminTeamRepository.detail(teamId).then((result) => {
      if (result.ok) setDetail(result.value);
      else setError(result.message);
    });
  }, [teamId]);

  const team = detail?.team;
  return (
    <Stack spacing={2}>
      <Box>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/teams')}>
          Clubs and teams
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="info">{notice}</Alert>}
      {!detail && !error && <CircularProgress />}
      {team && detail && (
        <>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {team.name}
            </Typography>
            {team.suspended && <Chip size="small" color="error" label="Suspended" />}
            {team.archived && <Chip size="small" label="Archived" />}
            <Chip size="small" label={team.verification.replace(/_/g, ' ')} variant="outlined" />
            <Button color="error" variant="outlined" size="small" startIcon={<DeleteForeverIcon />} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </Stack>

          <Card variant="outlined">
            <CardContent>
              <InfoGrid
                items={[
                  ['Club', team.clubName],
                  ['Age group / gender', `${team.ageGroup} · ${team.gender}`],
                  ['Format', team.format.replace(/_/g, ' ')],
                  ['Division', abilityLevelLabel(team.abilityLevel)],
                  ['Organisation', organisationLabel(team.organisation ?? null)],
                  ['League', team.league],
                  ['Postcode', team.postcode],
                  ['Travel radius', `${detail.travelRadiusMiles} miles`],
                  ['Home / away', detail.homeAwayPreference],
                  ['Manager', detail.managerName],
                  ['Contact phone', detail.contactPhone],
                  ['Shown in search', detail.searchVisible ? 'Yes' : 'No'],
                  ['Shares contact details', detail.shareContactDetails ? 'Yes' : 'No'],
                  ['Created', dateTime(team.createdAt)],
                  ['Last updated', dateTime(team.updatedAt)],
                  ['First fixture confirmed', dateTime(detail.firstFixtureConfirmedAt)],
                  ['Description', detail.description],
                  ['Team ID', <code key="id">{team.id}</code>],
                ]}
              />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Data held
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(detail.counts).map(([label, count]) => (
                  <Chip key={label} size="small" variant="outlined" label={`${label}: ${count}`} />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                People
              </Typography>
              {detail.members.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nobody is a member of this team or its club.
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {detail.members.map((m) => (
                    <Typography key={m.membershipId} variant="body2">
                      <Link component="button" onClick={() => navigate(`/users/${m.userId}`)}>
                        {m.displayName ?? 'Deleted user'}
                      </Link>{' '}
                      ({m.email ?? '-'}) · {roleLabel(m.role)}
                      {m.teamId ? '' : ' (whole club)'} · joined {dateTime(m.joinedAt)}
                    </Typography>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {detail.club && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Club
                </Typography>
                <InfoGrid
                  items={[
                    ['Name', detail.club.name],
                    ['Contact email', detail.club.contactEmail],
                    ['Website', detail.club.website],
                    ['Postcode', detail.club.postcode],
                    ['Created', dateTime(detail.club.createdAt)],
                    ['Teams', detail.club.teamNames.join(', ')],
                    ['Venues', detail.club.venues],
                  ]}
                />
              </CardContent>
            </Card>
          )}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Activity
              </Typography>
              <Timeline events={detail.timeline} />
            </CardContent>
          </Card>

          <DeleteDialog
            open={deleting}
            targetType="TEAM"
            targetId={team.id}
            onClose={() => setDeleting(false)}
            onDone={(outcome) => {
              setDeleting(false);
              if (outcome === 'deleted') navigate('/teams');
              else setNotice('Sent to the super admin for approval. Nothing has been deleted yet.');
            }}
          />
        </>
      )}
    </Stack>
  );
}
