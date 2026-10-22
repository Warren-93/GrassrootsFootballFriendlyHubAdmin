import { Navigate, Route, Routes } from 'react-router-dom';
import { BootstrapPage } from './pages/BootstrapPage';
import { SignInPage } from './pages/SignInPage';
import { OverviewPage } from './pages/OverviewPage';
import { VerificationQueuePage } from './pages/VerificationQueuePage';
import { ReportsQueuePage } from './pages/ReportsQueuePage';
import { ClubsTeamsPage } from './pages/ClubsTeamsPage';
import { UsersPage } from './pages/UsersPage';
import { FixtureInspectorPage } from './pages/FixtureInspectorPage';
import { MatchingConfigPage } from './pages/MatchingConfigPage';
import { ChatFilterPage } from './pages/ChatFilterPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AdminLayout } from './layout/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/bootstrap" element={<BootstrapPage />} />
      <Route path="/sign-in" element={<SignInPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/verifications" element={<VerificationQueuePage />} />
          <Route path="/reports" element={<ReportsQueuePage />} />
          <Route path="/teams" element={<ClubsTeamsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/fixtures" element={<FixtureInspectorPage />} />
          <Route path="/matching-config" element={<MatchingConfigPage />} />
          <Route path="/chat-filter" element={<ChatFilterPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
