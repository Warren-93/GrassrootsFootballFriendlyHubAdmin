import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import { fixtureInspectorRepository, type FixtureSearch } from '../api/adminRepository';
import type { FixtureListItem } from '../api/types';

const STATUSES = ['', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

/**
 * Every fixture, newest date first, searchable by team name (either side),
 * a date range and status. Click a row to open it in full.
 */
export function FixtureInspectorPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState<FixtureSearch>({});
  const [rows, setRows] = useState<FixtureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fixtureId, setFixtureId] = useState('');

  // Debounced so typing a team name doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fixtureInspectorRepository.list(search).then((result) => {
        setLoading(false);
        if (result.ok) setRows(result.value);
        else setErrorMessage(result.message);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const columns: GridColDef<FixtureListItem>[] = [
    { field: 'date', headerName: 'Date', width: 110 },
    {
      field: 'startTime',
      headerName: 'Time',
      width: 110,
      valueGetter: (_, row) => `${row.startTime?.slice(0, 5)}-${row.endTime?.slice(0, 5)}`,
    },
    { field: 'homeTeamName', headerName: 'Home', flex: 1, minWidth: 160 },
    { field: 'awayTeamName', headerName: 'Away', flex: 1, minWidth: 160 },
    { field: 'venueName', headerName: 'Venue', flex: 1, minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Chip size="small" label={value} variant="outlined" color={value === 'CONFIRMED' ? 'success' : value === 'CANCELLED' ? 'error' : 'default'} />
      ),
    },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Fixture inspector
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Click a fixture to see it in full. Read-only; message content is loaded on request and every view is audit-logged.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <TextField
          label="Team"
          placeholder="Part of either team's name"
          size="small"
          value={search.teamQuery ?? ''}
          onChange={(e) => setSearch((s) => ({ ...s, teamQuery: e.target.value }))}
          slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> } }}
          sx={{ minWidth: 240 }}
        />
        <TextField
          label="From"
          type="date"
          size="small"
          value={search.from ?? ''}
          onChange={(e) => setSearch((s) => ({ ...s, from: e.target.value }))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={search.to ?? ''}
          onChange={(e) => setSearch((s) => ({ ...s, to: e.target.value }))}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={search.status ?? ''}
          onChange={(e) => setSearch((s) => ({ ...s, status: e.target.value }))}
          sx={{ minWidth: 140 }}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s || 'Any'}
            </MenuItem>
          ))}
        </TextField>
        <Button onClick={() => setSearch({})}>Clear</Button>
      </Stack>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        density="compact"
        onRowClick={({ row }) => navigate(`/fixtures/${row.id}`)}
        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        slots={{ loadingOverlay: () => <CircularProgress sx={{ m: 4 }} /> }}
      />

      <Stack direction="row" spacing={1}>
        <TextField
          label="Open by fixture ID"
          value={fixtureId}
          onChange={(e) => setFixtureId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fixtureId.trim() && navigate(`/fixtures/${fixtureId.trim()}`)}
          size="small"
          sx={{ minWidth: 320 }}
        />
        <Button disabled={!fixtureId.trim()} onClick={() => navigate(`/fixtures/${fixtureId.trim()}`)}>
          Open
        </Button>
      </Stack>
    </Stack>
  );
}
