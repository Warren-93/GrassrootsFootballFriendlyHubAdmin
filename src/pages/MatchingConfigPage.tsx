import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { matchingConfigRepository } from '../api/adminRepository';
import type { SearchResponse, WeightsInput } from '../api/types';

const FACTORS: { key: keyof WeightsInput; label: string }[] = [
  { key: 'age', label: 'Age' },
  { key: 'availability', label: 'Availability' },
  { key: 'format', label: 'Format' },
  { key: 'distance', label: 'Distance' },
  { key: 'homeAway', label: 'Home / away' },
  { key: 'ability', label: 'Ability' },
];

export function MatchingConfigPage() {
  const [weights, setWeights] = useState<WeightsInput>({
    age: 25, availability: 25, format: 15, distance: 15, homeAway: 10, ability: 10,
  });
  const [versionNote, setVersionNote] = useState('');
  const [previewTeamId, setPreviewTeamId] = useState('');
  const [preview, setPreview] = useState<SearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    matchingConfigRepository.current().then((result) => {
      if (result.ok) setWeights((w) => ({ ...w, ...result.value }));
    });
  }, []);

  const total = FACTORS.reduce((sum, f) => sum + (weights[f.key] as number), 0);

  function setFactor(key: keyof WeightsInput, value: number) {
    setWeights((w) => ({ ...w, [key]: value }));
  }

  async function runPreview() {
    if (!previewTeamId) return;
    setPreviewing(true);
    setErrorMessage(null);
    const result = await matchingConfigRepository.preview(previewTeamId, weights);
    setPreviewing(false);
    if (result.ok) setPreview(result.value);
    else setErrorMessage(result.message);
  }

  async function publish() {
    if (total !== 100 || !versionNote) return;
    setPublishing(true);
    setErrorMessage(null);
    const result = await matchingConfigRepository.publish(weights, versionNote);
    setPublishing(false);
    if (result.ok) setVersionNote('');
    else setErrorMessage(result.message);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Matching configuration
      </Typography>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}
      <Alert severity={total === 100 ? 'success' : 'warning'}>Total: {total}% (must equal 100%)</Alert>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            {FACTORS.map((f) => (
              <Box key={f.key}>
                <Typography variant="body2">
                  {f.label}: {weights[f.key]}%
                </Typography>
                <Slider
                  value={weights[f.key] as number}
                  min={0}
                  max={60}
                  onChange={(_, v) => setFactor(f.key, v as number)}
                />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Preview against a real search
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              label="Team ID to search from"
              value={previewTeamId}
              onChange={(e) => setPreviewTeamId(e.target.value)}
              size="small"
              fullWidth
            />
            <Button variant="outlined" disabled={previewing || total !== 100} onClick={runPreview}>
              Preview
            </Button>
          </Stack>
          {preview && (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {preview.totalResults} result(s) with these weights
              </Typography>
              {preview.results.slice(0, 10).map((r) => (
                <Typography key={r.team.id} variant="body2">
                  {r.team.name} - {r.score}% ({r.band}, {r.milesApart.toFixed(1)} mi)
                </Typography>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Version note (required to publish)"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              disabled={publishing || total !== 100 || !versionNote}
              onClick={publish}
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
