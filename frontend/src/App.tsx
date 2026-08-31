import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PortalRoutes from './routes/PortalRoutes';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/ToastProvider';
import { destinationForRole, getSession } from './services/session';

/** Map route prefixes to page titles for SEO & UX */
function titleForPath(pathname: string): string {
  if (pathname === '/') return '3S Wellness Fitness & Yoga | Phòng Tập Gym & Yoga Cao Cấp Bắc Ninh';
  if (pathname === '/login') return 'Đăng Nhập | 3S Wellness Fitness & Yoga';
  return '3S Gym — Hệ Thống Quản Lý';
}

function MainContent() {
  const location = useLocation();
  const session = getSession();
  const hideNavbar = location.pathname !== '/';

  useEffect(() => {
    document.title = titleForPath(location.pathname);
  }, [location.pathname]);

  return (
    <div className="App">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route
            path="/"
            element={session ? <Navigate to={destinationForRole()} replace /> : <LandingPage />}
          />
          <Route
            path="/login"
            element={session ? <Navigate to={destinationForRole()} replace /> : <LoginPage />}
          />
          <Route path="/consultation" element={<ProtectedRoute><Navigate to="/pt/nutrition-assistant" replace /></ProtectedRoute>} />
          <Route path="/portal/*" element={<ProtectedRoute><PortalRoutes /></ProtectedRoute>} />
          <Route path="/*" element={<ProtectedRoute><PortalRoutes /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider><MainContent /></ToastProvider>
    </Router>
  );
}

export default App;
