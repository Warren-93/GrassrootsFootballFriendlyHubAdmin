import { useEffect, useState } from 'react';
import { Badge, Box, Chip, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VerifiedIcon from '@mui/icons-material/Verified';
import FlagIcon from '@mui/icons-material/Flag';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import ChatFilterIcon from '@mui/icons-material/SpeakerNotesOff';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminMeContext } from '../auth/AdminMeContext';
import { adminAccountRepository, deletionRepository } from '../api/adminRepository';
import type { AdminMe } from '../api/types';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
  { path: '/verifications', label: 'Verification queue', icon: <VerifiedIcon fontSize="small" /> },
  { path: '/reports', label: 'Reports queue', icon: <FlagIcon fontSize="small" /> },
  { path: '/teams', label: 'Clubs and teams', icon: <GroupsIcon fontSize="small" /> },
  { path: '/users', label: 'Users', icon: <PeopleIcon fontSize="small" /> },
  { path: '/fixtures', label: 'Fixture inspector', icon: <SearchIcon fontSize="small" /> },
  { path: '/matching-config', label: 'Matching configuration', icon: <TuneIcon fontSize="small" /> },
  { path: '/chat-filter', label: 'Chat filter', icon: <ChatFilterIcon fontSize="small" /> },
  { path: '/deletions', label: 'Delete requests', icon: <DeleteSweepIcon fontSize="small" /> },
  { path: '/audit-log', label: 'Audit log', icon: <HistoryIcon fontSize="small" /> },
];

const SUPER_ADMIN_NAV_ITEMS = [
  { path: '/admins', label: 'Admins', icon: <AdminPanelSettingsIcon fontSize="small" /> },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, signOut } = useAdminAuth();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState(0);

  useEffect(() => {
    adminAccountRepository.me().then((result) => {
      if (result.ok) setMe(result.value);
    });
  }, []);

  // Refreshed on every page change, so the count stays current as requests are dealt with.
  useEffect(() => {
    deletionRepository.list('PENDING').then((result) => {
      if (result.ok) setPendingDeletes(result.value.length);
    });
  }, [location.pathname]);

  const navItems = me?.role === 'SUPER_ADMIN' ? [...NAV_ITEMS, ...SUPER_ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <AdminMeContext.Provider value={me}>
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: 'primary.main' }}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Box component="img" src="/logo-horizontal-reversed-transparent.png" alt="Kickabout" sx={{ height: 26 }} />
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600, opacity: 0.85 }}>
            Admin
          </Typography>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {email}
          </Typography>
          {me && (
            <Chip
              size="small"
              label={me.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}
              sx={{ mr: 1, color: 'inherit', borderColor: 'currentColor' }}
              variant="outlined"
            />
          )}
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
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {item.path === '/deletions' ? (
                  <Badge badgeContent={pendingDeletes} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
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
    </AdminMeContext.Provider>
  );
}
