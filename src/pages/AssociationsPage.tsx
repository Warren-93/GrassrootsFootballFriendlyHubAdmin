import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { associationRepository } from '../api/adminRepository';
import type { AssociationInput, AssociationView, LeagueView, Organisation } from '../api/types';
import { ORGANISATION_LABELS } from '../api/teamLabels';
import { dateTime } from '../api/format';

const EMPTY: AssociationInput = { name: '' };

/** "Premier, Div 1\nDiv 2" -> ["Premier", "Div 1", "Div 2"]: one per line or comma-separated. */
function parseDivisions(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((d) => d.trim())
    .filter(Boolean);
}

function toInput(a: AssociationView): AssociationInput {
  const { name, shortName, linkedOrganisation, contactName, contactEmail, website, notes } = a;
  return { name, shortName, linkedOrganisation, contactName, contactEmail, website, notes };
}

/**
 * Registered, verified associations with the leagues they run and the
 * divisions in each. Kept by admins - associations don't sign in. This is the
 * future source of the Organisation / League / Division options on create
 * team; for now create team still uses the fixed list, so changes here don't
 * affect what managers see.
 */
export function AssociationsPage() {
  const [rows, setRows] = useState<AssociationView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; input: AssociationInput } | null>(null);
  const [leagueEdit, setLeagueEdit] = useState<{ association: AssociationView; league: LeagueView | null; name: string; divisions: string } | null>(null);

  function load() {
    associationRepository.list().then((result) => {
      if (result.ok) setRows(result.value);
      else setError(result.message);
    });
  }

  useEffect(load, []);

  function replace(updated: AssociationView) {
    setRows((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function saveAssociation() {
    if (!editing) return;
    const result = editing.id
      ? await associationRepository.update(editing.id, editing.input)
      : await associationRepository.create(editing.input);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEditing(null);
    load();
  }

  async function removeAssociation(a: AssociationView) {
    if (!window.confirm(`Remove ${a.name} and its ${a.leagues.length} league(s) from the list?`)) return;
    const result = await associationRepository.remove(a.id);
    if (result.ok) setRows((prev) => prev.filter((x) => x.id !== a.id));
    else setError(result.message);
  }

  async function saveLeague() {
    if (!leagueEdit) return;
    const divisions = parseDivisions(leagueEdit.divisions);
    const { association, league } = leagueEdit;
    const result = league
      ? await associationRepository.updateLeague(association.id, league.id, leagueEdit.name, divisions)
      : await associationRepository.addLeague(association.id, leagueEdit.name, divisions);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    replace(result.value);
    setLeagueEdit(null);
  }

  async function removeLeague(a: AssociationView, league: LeagueView) {
    if (!window.confirm(`Remove ${league.name} from ${a.name}?`)) return;
    const result = await associationRepository.removeLeague(a.id, league.id);
    if (result.ok) replace(result.value);
    else setError(result.message);
  }

  const field = (key: keyof AssociationInput, label: string, extra: object = {}) => (
    <TextField
      label={label}
      size="small"
      fullWidth
      value={(editing?.input[key] as string | null | undefined) ?? ''}
      onChange={(e) => setEditing((cur) => cur && { ...cur, input: { ...cur.input, [key]: e.target.value } })}
      {...extra}
    />
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Associations
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({ id: null, input: { ...EMPTY } })}>
          Add association
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Associations that have signed up with Kickabout, with the leagues and divisions they run. Everything listed here
        counts as verified. Create team still offers the built-in organisation list for now, so changes here don't affect
        managers yet.
      </Typography>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No associations added yet.
        </Typography>
      )}

      {rows.map((a) => (
        <Card key={a.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {a.name}
              </Typography>
              {a.shortName && <Chip size="small" label={a.shortName} />}
              <Chip size="small" color="success" variant="outlined" label="Verified" />
              {a.linkedOrganisationLabel && <Chip size="small" variant="outlined" label={`Matches: ${a.linkedOrganisationLabel}`} />}
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Edit details">
                <IconButton size="small" onClick={() => setEditing({ id: a.id, input: toInput(a) })}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove association">
                <IconButton size="small" color="error" onClick={() => removeAssociation(a)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            {(a.contactName || a.contactEmail || a.website) && (
              <Typography variant="body2">
                {[a.contactName, a.contactEmail, a.website].filter(Boolean).join(' · ')}
              </Typography>
            )}
            {a.notes && (
              <Typography variant="body2" color="text.secondary">
                {a.notes}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Added {dateTime(a.createdAt)}
              {a.createdByEmail ? ` by ${a.createdByEmail}` : ''} · updated {dateTime(a.updatedAt)}
            </Typography>

            <Stack spacing={1}>
              {a.leagues.map((l) => (
                <Stack key={l.id} direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160 }}>
                    {l.name}
                  </Typography>
                  {l.divisions.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No divisions
                    </Typography>
                  ) : (
                    l.divisions.map((d) => <Chip key={d} size="small" label={d} />)
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton
                    size="small"
                    aria-label={`Edit ${l.name}`}
                    onClick={() => setLeagueEdit({ association: a, league: l, name: l.name, divisions: l.divisions.join('\n') })}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" aria-label={`Remove ${l.name}`} color="error" onClick={() => removeLeague(a, l)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Box>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setLeagueEdit({ association: a, league: null, name: '', divisions: '' })}>
                  Add league
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? 'Edit association' : 'Add association'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {field('name', 'Name', { required: true })}
            {field('shortName', 'Short name', { helperText: 'e.g. SWFA' })}
            <TextField
              select
              label="Matches built-in organisation"
              size="small"
              value={editing?.input.linkedOrganisation ?? ''}
              onChange={(e) =>
                setEditing((cur) => cur && { ...cur, input: { ...cur.input, linkedOrganisation: (e.target.value || null) as Organisation | null } })
              }
              helperText="Optional. Which entry on today's create-team list this is."
            >
              <MenuItem value="">None</MenuItem>
              {Object.entries(ORGANISATION_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            {field('contactName', 'Contact name')}
            {field('contactEmail', 'Contact email')}
            {field('website', 'Website')}
            {field('notes', 'Notes', { multiline: true, minRows: 2 })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" disabled={!editing?.input.name.trim()} onClick={saveAssociation}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!leagueEdit} onClose={() => setLeagueEdit(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {leagueEdit?.league ? 'Edit league' : 'Add league'} - {leagueEdit?.association.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="League name"
              size="small"
              value={leagueEdit?.name ?? ''}
              onChange={(e) => setLeagueEdit((cur) => cur && { ...cur, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Divisions"
              helperText="One per line (or separated by commas), in the order they should show."
              size="small"
              multiline
              minRows={4}
              value={leagueEdit?.divisions ?? ''}
              onChange={(e) => setLeagueEdit((cur) => cur && { ...cur, divisions: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeagueEdit(null)}>Cancel</Button>
          <Button variant="contained" disabled={!leagueEdit?.name.trim()} onClick={saveLeague}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
