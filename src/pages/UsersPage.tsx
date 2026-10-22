import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { adminUserRepository } from '../api/adminRepository';
import type { AdminUserView } from '../api/types';
import { ago, dateTime } from '../api/format';
import { DeleteDialog } from '../components/DeleteDialog';

export function UsersPage() {
  const [rows, setRows] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<AdminUserView | null>(null);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function load(searchQuery: string) {
    setLoading(true);
    adminUserRepository.search(searchQuery).then((result) => {
      setLoading(false);
      if (result.ok) setRows(result.value);
      else setErrorMessage(result.message);
    });
  }

  // Debounced so every keystroke doesn't fire its own request against the
  // real search endpoint - this used to load everything once and filter
  // client-side in the DataGrid's own quick filter, which stopped scaling
  // once the user list grew past what's comfortable to ship to the browser.
  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateRow(user: AdminUserView) {
    setRows((prev) => prev.map((u) => (u.id === user.id ? user : u)));
  }

  async function toggleSuspend(user: AdminUserView) {
    if (!user.suspended && !window.confirm(`Suspend ${user.displayName}? They will be signed out immediately.`)) return;
    const result = user.suspended
      ? await adminUserRepository.unsuspend(user.id)
      : await adminUserRepository.suspend(user.id);
    if (result.ok) updateRow(result.value);
    else setErrorMessage(result.message);
  }

  async function forceReset(user: AdminUserView) {
    const result = await adminUserRepository.forcePasswordReset(user.id);
    setToast(result.ok ? 'Password reset issued. The reset link is emailed, or logged on the server when email is not set up.' : result.message);
  }

  async function resendVerification(user: AdminUserView) {
    const result = await adminUserRepository.resendVerification(user.id);
    setToast(result.ok ? 'Verification email resent.' : result.message);
  }

  async function verifyEmail(user: AdminUserView) {
    const result = await adminUserRepository.verifyEmail(user.id);
    if (result.ok) {
      updateRow(result.value);
      setToast('Email marked as verified.');
    } else {
      setToast(result.message);
    }
  }

  const columns: GridColDef<AdminUserView>[] = [
    { field: 'displayName', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    {
      field: 'emailVerified',
      headerName: 'Verified',
      width: 110,
      renderCell: ({ value }) =>
        value ? <Chip size="small" label="Verified" color="success" variant="outlined" /> : <Chip size="small" label="Unverified" />,
    },
    {
      field: 'suspended',
      headerName: 'Status',
      width: 110,
      renderCell: ({ value }) =>
        value ? <Chip size="small" label="Suspended" color="error" /> : <Chip size="small" label="Active" color="success" variant="outlined" />,
    },
    {
      field: 'memberships',
      headerName: 'Memberships',
      width: 110,
      valueGetter: (_, row) => row.memberships.length,
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 170,
      valueFormatter: (value: string | null) => dateTime(value),
    },
    {
      field: 'lastActiveAt',
      headerName: 'Last active',
      width: 120,
      valueFormatter: (value: string | null) => ago(value),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 240,
      getActions: ({ row }) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon fontSize="small" />}
            label="View details"
            onClick={() => navigate(`/users/${row.id}`)}
          />,
        ];
        if (!row.emailVerified) {
          actions.push(
            <GridActionsCellItem
              key="verify"
              icon={<MarkEmailReadIcon fontSize="small" />}
              label="Verify email now"
              onClick={() => verifyEmail(row)}
            />,
            <GridActionsCellItem
              key="resend"
              icon={<ForwardToInboxIcon fontSize="small" />}
              label="Resend verification"
              onClick={() => resendVerification(row)}
            />,
          );
        }
        actions.push(
          <GridActionsCellItem
            key="reset"
            icon={<LockResetIcon fontSize="small" />}
            label="Force password reset"
            onClick={() => forceReset(row)}
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
          Users
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name or email…"
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
        onRowDoubleClick={({ row }) => navigate(`/users/${row.id}`)}
        showToolbar
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        slots={{ loadingOverlay: () => <CircularProgress sx={{ m: 4 }} /> }}
      />

      {deleting && (
        <DeleteDialog
          open
          targetType="USER"
          targetId={deleting.id}
          onClose={() => setDeleting(null)}
          onDone={(outcome) => {
            const user = deleting;
            setDeleting(null);
            if (outcome === 'deleted') {
              setRows((prev) => prev.filter((u) => u.id !== user.id));
              setToast(`${user.displayName} was permanently deleted.`);
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
