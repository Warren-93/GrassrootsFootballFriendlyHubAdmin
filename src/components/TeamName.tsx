import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Raw IDs in small secondary text next to the name they belong to, so support
 * can still copy the exact ID. Renders as a block-level span so it can sit
 * inside a ListItemText secondary line (which is a <p>).
 */
export function IdCaption({ children }: { children: ReactNode }) {
  return (
    <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      {children}
    </Typography>
  );
}

/**
 * "<label>: <team name>" with the team ID underneath. Falls back to the ID on
 * its own when the API sent no name (versions before admin views had names).
 */
export function TeamNameLine({ label, id, name }: { label: string; id: string; name?: string | null }) {
  return (
    <Box>
      <Typography variant="body2">
        {label}: {name ?? id}
      </Typography>
      {name && <IdCaption>Team ID {id}</IdCaption>}
    </Box>
  );
}
