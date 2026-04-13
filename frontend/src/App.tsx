import { useState } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import MapDispatcher from './pages/MapDispatcher';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Fleet from './pages/Fleet';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('map');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'map' && <MapDispatcher />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'fleet' && <Fleet />}
    </DashboardLayout>
  );
}

export default App;
