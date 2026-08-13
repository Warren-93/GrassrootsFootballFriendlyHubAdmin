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
  Typography,
} from '@mui/material';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { adminUserRepository } from '../api/adminRepository';
import type { AdminUserView } from '../api/types';

export function UsersPage() {
  const [rows, setRows] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUserView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function load() {
    setLoading(true);
    adminUserRepository.search('').then((result) => {
      setLoading(false);
      if (result.ok) setRows(result.value);
      else setErrorMessage(result.message);
    });
  }

  useEffect(load, []);

  function updateRow(user: AdminUserView) {
    setRows((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    if (selected?.id === user.id) setSelected(user);
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
    setToast(result.ok ? 'Password reset issued (logged server-side - no email provider configured).' : result.message);
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

  async function deleteUser(user: AdminUserView) {
    if (
      !window.confirm(
        `Permanently delete ${user.displayName} (${user.email})? This removes their account and club/team memberships. This cannot be undone.`,
      )
    )
      return;
    const result = await adminUserRepository.delete(user.id);
    if (result.ok) {
      setRows((prev) => prev.filter((u) => u.id !== user.id));
      if (selected?.id === user.id) setSelected(null);
      setToast('User deleted.');
    } else {
      setErrorMessage(result.message);
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
            onClick={() => setSelected(row)}
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
            label="Delete account"
            onClick={() => deleteUser(row)}
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
        <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        density="compact"
        disableRowSelectionOnClick
        showToolbar
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        slots={{ loadingOverlay: () => <CircularProgress sx={{ m: 4 }} /> }}
      />

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.displayName}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">{selected.email}</Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Roles across clubs/teams
                  </Typography>
                  {selected.memberships.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No memberships.
                    </Typography>
                  ) : (
                    selected.memberships.map((m, i) => (
                      <Typography key={i} variant="caption">
                        {m.role} · {m.teamId ? `team ${m.teamId}` : `club ${m.clubId}`}
                      </Typography>
                    ))
                  )}
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} message={toast} />
    </Stack>
  );
}
