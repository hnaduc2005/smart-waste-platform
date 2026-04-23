import { Navigate, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import WasteClassifierPage from './pages/WasteClassifierPage';
import FirebasePushNotification from './components/common/FirebasePushNotification';
import GamificationPage from './pages/GamificationPage';

/** Route guard: redirect to /login if not authenticated */
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Route guard: redirect to /dashboard if already logged in */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <>
      <FirebasePushNotification />
      <Routes>
      {/* Default: redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes (redirect to dashboard if already logged in) */}
      <Route path="/login" element={
        <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
      } />
      <Route path="/register" element={
        <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>
      } />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <PrivateRoute><DashboardPage /></PrivateRoute>
      } />
      <Route path="/waste-classifier" element={
        <PrivateRoute><WasteClassifierPage /></PrivateRoute>
      } />
      <Route path="/gamification" element={
        <PrivateRoute><GamificationPage /></PrivateRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
