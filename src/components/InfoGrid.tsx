import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

/** Label/value pairs in two columns, for detail pages. */
export function InfoGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, columnGap: 2, rowGap: 0.75 }}>
      {items.map(([label, value]) => (
        <Box key={label} sx={{ display: 'contents' }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" component="div">
            {value ?? '-'}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
