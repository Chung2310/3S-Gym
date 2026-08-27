import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ConsultationTool from './pages/ConsultationTool';
import PortalPage from './pages/PortalPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastProvider';

function MainContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/consultation' || location.pathname === '/login' || location.pathname.startsWith('/portal');

  return (
    <div className="App">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/consultation" element={<ProtectedRoute><ConsultationTool /></ProtectedRoute>} />
          <Route path="/portal/*" element={<ProtectedRoute><PortalPage /></ProtectedRoute>} />
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
