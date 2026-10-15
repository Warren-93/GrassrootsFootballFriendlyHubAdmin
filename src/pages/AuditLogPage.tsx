import { useCallback, useEffect, useState } from 'react';
import { Button, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { auditLogRepository } from '../api/adminRepository';
import type { AuditLogEntry } from '../api/types';

function toCsv(entries: AuditLogEntry[]): string {
  const header = 'timestamp,actorEmail,action,targetType,targetId,reason';
  const rows = entries.map((e) =>
    [e.timestamp, e.actorEmail, e.action, e.targetType, e.targetId, e.reason ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header, ...rows].join('\n');
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [targetType, setTargetType] = useState('');
  const [loading, setLoading] = useState(true);

  // Takes the filter as an argument so the first load runs once, unfiltered,
  // and typing in the filter box only reloads on Enter or the Filter button.
  const load = useCallback((filter: string) => {
    setLoading(true);
    auditLogRepository.list(filter || undefined, undefined, 200).then((result) => {
      if (result.ok) setEntries(result.value);
      setLoading(false);
    });
  }, []);

  useEffect(() => load(''), [load]);

  function exportCsv() {
    const blob = new Blob([toCsv(entries)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Audit log
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Immutable. No delete path exists in this interface.
      </Typography>

      <Stack direction="row" spacing={1}>
        <TextField
          label="Filter by target type (e.g. TEAM, USER, REPORT)"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(targetType)}
          size="small"
          fullWidth
        />
        <Button variant="outlined" onClick={() => load(targetType)}>
          Filter
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv}>
          Export CSV
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{new Date(e.timestamp).toLocaleString()}</TableCell>
                <TableCell>{e.actorEmail}</TableCell>
                <TableCell>{e.action}</TableCell>
                <TableCell>
                  {e.targetType} {e.targetId}
                </TableCell>
                <TableCell>{e.reason ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
