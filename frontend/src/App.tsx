import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PortalRoutes from './routes/PortalRoutes';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/ToastProvider';

function MainContent() {
  const location = useLocation();
  const hideNavbar = location.pathname !== '/';

  return (
    <div className="App">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
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
