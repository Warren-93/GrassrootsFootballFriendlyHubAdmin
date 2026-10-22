import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Link, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { adminUserRepository } from '../api/adminRepository';
import type { AdminUserDetail } from '../api/types';
import { ago, dateTime, roleLabel } from '../api/format';
import { InfoGrid } from '../components/InfoGrid';
import { Timeline } from '../components/Timeline';
import { DeleteDialog } from '../components/DeleteDialog';

export function UserDetailPage() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    adminUserRepository.detail(userId).then((result) => {
      if (result.ok) setDetail(result.value);
      else setError(result.message);
    });
  }, [userId]);

  const user = detail?.user;
  return (
    <Stack spacing={2}>
      <Box>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')}>
          Users
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="info">{notice}</Alert>}
      {!detail && !error && <CircularProgress />}
      {user && detail && (
        <>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {user.displayName}
            </Typography>
            {user.suspended && <Chip size="small" color="error" label="Suspended" />}
            <Chip size="small" label={user.emailVerified ? 'Email verified' : 'Email unverified'} variant="outlined" />
            <Button color="error" variant="outlined" size="small" startIcon={<DeleteForeverIcon />} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </Stack>

          <Card variant="outlined">
            <CardContent>
              <InfoGrid
                items={[
                  ['Email', user.email],
                  ['Account created', dateTime(user.createdAt)],
                  ['Last active', `${dateTime(user.lastActiveAt)} (${ago(user.lastActiveAt)})`],
                  ['Signed-in sessions', detail.activeSessions],
                  ['Devices with notifications', detail.pushDevices],
                  ['Notifications held', detail.notifications],
                  ['Recent chat messages', detail.chatMessagesSent],
                  ['User ID', <code key="id">{user.id}</code>],
                ]}
              />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Clubs and teams
              </Typography>
              {detail.memberships.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Not a member of any club or team.
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {detail.memberships.map((m) => (
                    <Typography key={m.membershipId} variant="body2">
                      {roleLabel(m.role)} ·{' '}
                      {m.teamId ? (
                        <Link component="button" onClick={() => navigate(`/teams/${m.teamId}`)}>
                          {m.teamName}
                        </Link>
                      ) : (
                        `${m.clubName} (club)`
                      )}
                      {m.teamId && m.clubName ? ` · ${m.clubName}` : ''} · joined {dateTime(m.joinedAt)}
                    </Typography>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

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
            targetType="USER"
            targetId={user.id}
            onClose={() => setDeleting(false)}
            onDone={(outcome) => {
              setDeleting(false);
              if (outcome === 'deleted') navigate('/users');
              else setNotice('Sent to the super admin for approval. Nothing has been deleted yet.');
            }}
          />
        </>
      )}
    </Stack>
  );
}
