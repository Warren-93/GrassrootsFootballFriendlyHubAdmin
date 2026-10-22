import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FixtureDetailCard } from '../components/FixtureDetailCard';

export function FixtureDetailPage() {
  const { fixtureId = '' } = useParams();
  const navigate = useNavigate();
  return (
    <Stack spacing={2}>
      <Box>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Fixtures
        </Button>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Fixture
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Read-only. Message content is loaded separately, on request, and every view is audit-logged.
      </Typography>
      <FixtureDetailCard fixtureId={fixtureId} />
    </Stack>
  );
}
