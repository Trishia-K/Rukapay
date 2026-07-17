import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SignInLog from './pages/SignInLog';
import Meetings from './pages/Meetings';
import MeetingRoom from './pages/MeetingRoom';
import Archive from './pages/Archive';
import Team from './pages/Team';
import Reports from './pages/Reports';
import SignIn from './pages/SignIn';
import RegisterFingerprint from './pages/RegisterFingerprint';
import AdminGate from './components/AdminGate';
function Sidebar() {
  return (
    <aside className="sidebar no-print">
      <div className="logo-slot">
        <img src="/logo.png" alt="RukaPay" className="brand-logo" />
      </div>

      <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
      <NavLink to="/sign-in-log" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Sign-In / Sign-Out Log</NavLink>
      <NavLink to="/meetings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Meetings</NavLink>
      <NavLink to="/archive" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Archive</NavLink>
      <NavLink to="/team" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Team</NavLink>
      <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Reports</NavLink>
      <NavLink to="/sign-in" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Open Sign-In Screen</NavLink>
    </aside>
  );
}

export default function App() {
  const location = useLocation();
 const isSignInScreen = location.pathname.startsWith('/sign-in') && location.pathname !== '/sign-in-log';
  const isRegisterScreen = location.pathname.startsWith('/register/');

  if (isSignInScreen) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>
    );
  }

  if (isRegisterScreen) {
    return (
      <Routes>
        <Route path="/register/:personId" element={<RegisterFingerprint />} />
      </Routes>
    );
  }

  if (isSignInScreen) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sign-in-log" element={<SignInLog />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/:id" element={<MeetingRoom />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/team" element={<AdminGate><Team /></AdminGate>} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}
