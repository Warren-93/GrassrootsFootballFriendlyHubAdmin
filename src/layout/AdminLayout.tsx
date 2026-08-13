import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VerifiedIcon from '@mui/icons-material/Verified';
import FlagIcon from '@mui/icons-material/Flag';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
  { path: '/verifications', label: 'Verification queue', icon: <VerifiedIcon fontSize="small" /> },
  { path: '/reports', label: 'Reports queue', icon: <FlagIcon fontSize="small" /> },
  { path: '/teams', label: 'Clubs and teams', icon: <GroupsIcon fontSize="small" /> },
  { path: '/users', label: 'Users', icon: <PeopleIcon fontSize="small" /> },
  { path: '/fixtures', label: 'Fixture inspector', icon: <SearchIcon fontSize="small" /> },
  { path: '/matching-config', label: 'Matching configuration', icon: <TuneIcon fontSize="small" /> },
  { path: '/audit-log', label: 'Audit log', icon: <HistoryIcon fontSize="small" /> },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, signOut } = useAdminAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: 'primary.main' }}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Box component="img" src="/favicon.svg" alt="" sx={{ width: 22, height: 22 }} />
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
            PitchMate Admin
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {email}
          </Typography>
          <IconButton color="inherit" size="small" onClick={() => { signOut(); navigate('/sign-in'); }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar variant="dense" />
        <List dense>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar variant="dense" />
        <Outlet />
      </Box>
    </Box>
  );
}
