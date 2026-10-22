import { useMemo, useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import type { ActivityEvent } from '../api/types';
import { dateTime } from '../api/format';

/** A newest-first list of dated events, with a quick text filter. */
export function Timeline({ events }: { events: ActivityEvent[] }) {
  const [filter, setFilter] = useState('');
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return f ? events.filter((e) => e.text.toLowerCase().includes(f) || e.kind.toLowerCase().includes(f)) : events;
  }, [events, filter]);

  return (
    <Stack spacing={1}>
      <TextField size="small" placeholder="Filter the timeline" value={filter} onChange={(e) => setFilter(e.target.value)} />
      {shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing recorded.
        </Typography>
      ) : (
        shown.map((e, i) => (
          <Box key={`${e.at}-${i}`} sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150, flexShrink: 0 }}>
              {dateTime(e.at)}
            </Typography>
            <Typography variant="body2">{e.text}</Typography>
          </Box>
        ))
      )}
    </Stack>
  );
}
