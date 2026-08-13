import { createTheme } from '@mui/material/styles';

// Dense, keyboard-first, internal tool aesthetic - deliberately plainer than
// the consumer apps' theme (see the spec's section 10 intro: "dense,
// keyboard-first and built for sustained queue work rather than for
// occasional mobile use"). Still PitchMate's navy/green brand, just without
// the consumer app's lighter touches.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#14213D' },
    secondary: { main: '#2E9E52' },
    error: { main: '#C62828' },
    warning: { main: '#FFA000' },
    background: { default: '#F4F5F7' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
  },
  components: {
    MuiTableCell: { styleOverrides: { root: { padding: '6px 12px' } } },
  },
});
