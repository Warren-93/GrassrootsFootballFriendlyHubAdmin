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
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useNavigate } from 'react-router-dom';
import { dateTime } from '../api/format';
import { DeleteDialog } from '../components/DeleteDialog';
import { adminTeamRepository } from '../api/adminRepository';
import type { AdminTeamView } from '../api/types';
import { abilityLevelLabel, organisationLabel } from '../api/teamLabels';

export function ClubsTeamsPage() {
  const [rows, setRows] = useState<AdminTeamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [mergeTarget, setMergeTarget] = useState<AdminTeamView | null>(null);
  const [duplicateId, setDuplicateId] = useState('');
  const [merging, setMerging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminTeamView | null>(null);
  const navigate = useNavigate();

  function load(searchQuery: string) {
    setLoading(true);
    adminTeamRepository.search(searchQuery).then((result) => {
      setLoading(false);
      if (result.ok) setRows(result.value);
      else setErrorMessage(result.message);
    });
  }

  // Debounced so typing doesn't fire a request per keystroke - this used to
  // load everything once and filter client-side in the DataGrid's own quick
  // filter, even though the backend already supports a real search query.
  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateRow(team: AdminTeamView) {
    setRows((prev) => prev.map((t) => (t.id === team.id ? team : t)));
  }

  async function toggleSuspend(team: AdminTeamView) {
    if (!team.suspended && !window.confirm(`Suspend ${team.name}? Their open friendly requests will be cancelled.`)) return;
    const result = team.suspended
      ? await adminTeamRepository.unsuspend(team.id)
      : await adminTeamRepository.suspend(team.id);
    if (result.ok) updateRow(result.value);
    else setErrorMessage(result.message);
  }

  async function verifyTeam(team: AdminTeamView) {
    const result = await adminTeamRepository.verify(team.id);
    if (result.ok) {
      updateRow(result.value);
      setToast('Team verified.');
    } else {
      setErrorMessage(result.message);
    }
  }

  async function merge() {
    if (!mergeTarget || !duplicateId) return;
    setMerging(true);
    const result = await adminTeamRepository.merge(mergeTarget.id, duplicateId);
    setMerging(false);
    if (result.ok) {
      setMergeTarget(null);
      setDuplicateId('');
      setToast('Teams merged.');
      load(query);
    } else {
      setErrorMessage(result.message);
    }
  }

  const columns: GridColDef<AdminTeamView>[] = [
    { field: 'name', headerName: 'Team', flex: 1, minWidth: 160 },
    { field: 'clubName', headerName: 'Club', flex: 1, minWidth: 160 },
    { field: 'ageGroup', headerName: 'Age group', width: 100 },
    { field: 'gender', headerName: 'Gender', width: 90 },
    { field: 'format', headerName: 'Format', width: 130, valueFormatter: (value: string) => value?.replace(/_/g, ' ') },
    { field: 'abilityLevel', headerName: 'Division', width: 190, valueFormatter: (value: string | null) => abilityLevelLabel(value) },
    { field: 'organisation', headerName: 'Organisation', width: 220, valueFormatter: (value: string | null) => organisationLabel(value) },
    {
      field: 'verification',
      headerName: 'Verification',
      width: 130,
      renderCell: ({ value }) => (
        <Chip size="small" label={value.replace(/_/g, ' ')} color={value === 'VERIFIED' ? 'success' : 'default'} variant="outlined" />
      ),
    },
    {
      field: 'suspended',
      headerName: 'Status',
      width: 110,
      renderCell: ({ value }) =>
        value ? <Chip size="small" label="Suspended" color="error" /> : <Chip size="small" label="Active" color="success" variant="outlined" />,
    },
    { field: 'createdAt', headerName: 'Created', width: 170, valueFormatter: (value: string | null) => dateTime(value) },
    { field: 'updatedAt', headerName: 'Last updated', width: 170, valueFormatter: (value: string | null) => dateTime(value) },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: ({ row }) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon fontSize="small" />}
            label="View details"
            onClick={() => navigate(`/teams/${row.id}`)}
          />,
        ];
        if (row.verification !== 'VERIFIED') {
          actions.push(
            <GridActionsCellItem
              key="verify"
              icon={<VerifiedIcon fontSize="small" />}
              label="Verify team now"
              onClick={() => verifyTeam(row)}
            />,
          );
        }
        actions.push(
          <GridActionsCellItem
            key="merge"
            icon={<CallMergeIcon fontSize="small" />}
            label="Merge duplicate into this…"
            onClick={() => setMergeTarget(row)}
          />,
          <GridActionsCellItem
            key="suspend"
            icon={row.suspended ? <CheckCircleIcon fontSize="small" color="success" /> : <BlockIcon fontSize="small" color="error" />}
            label={row.suspended ? 'Unsuspend' : 'Suspend'}
            onClick={() => toggleSuspend(row)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteForeverIcon fontSize="small" color="error" />}
            label="Delete permanently…"
            onClick={() => setDeleting(row)}
            showInMenu
          />,
        );
        return actions;
      },
    },
  ];

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Clubs and teams
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search team or club name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> } }}
          />
          <Button size="small" startIcon={<RefreshIcon />} onClick={() => load(query)} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        density="compact"
        disableRowSelectionOnClick
        onRowDoubleClick={({ row }) => navigate(`/teams/${row.id}`)}
        showToolbar
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        slots={{ loadingOverlay: () => <CircularProgress sx={{ m: 4 }} /> }}
      />

      <Dialog open={!!mergeTarget} onClose={() => setMergeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Merge duplicate team</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Primary: {mergeTarget?.name} ({mergeTarget?.id})
            </Typography>
            <TextField
              label="Duplicate team ID"
              value={duplicateId}
              onChange={(e) => setDuplicateId(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeTarget(null)}>Cancel</Button>
          <Button variant="contained" disabled={!duplicateId || merging} onClick={merge}>
            Merge
          </Button>
        </DialogActions>
      </Dialog>

      {deleting && (
        <DeleteDialog
          open
          targetType="TEAM"
          targetId={deleting.id}
          onClose={() => setDeleting(null)}
          onDone={(outcome) => {
            const team = deleting;
            setDeleting(null);
            if (outcome === 'deleted') {
              setToast(`${team.name} was permanently deleted.`);
              load(query);
            } else {
              setToast('Sent to the super admin for approval. Nothing has been deleted yet.');
            }
          }}
        />
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} message={toast} />
    </Stack>
  );
}
