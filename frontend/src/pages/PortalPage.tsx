import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import FeatureRoute from '../components/FeatureRoute';
import AdminRoutes from '../features/admin/AdminRoutes';
import PtRoutes from '../features/customers/PtRoutes';
import CustomerRoutes from '../features/customer-portal/CustomerRoutes';
import InBodyWorkspace from '../features/inbody/InBodyWorkspace';
import RoadmapWorkspace from '../features/roadmap/RoadmapWorkspace';
import ExerciseLibrary from '../features/exercises/ExerciseLibrary';
import WorkoutWorkspace from '../features/workouts/WorkoutWorkspace';
import ProgressWorkspace from '../features/progress/ProgressWorkspace';
import NutritionWorkspace from '../features/nutrition/NutritionWorkspace';
import { FeaturesProvider, useFeatures } from '../services/features';
import { getSession } from '../services/session';
import type { Session, User } from '../types';

const roleDestinations = {
  ADMIN: '/portal/admin',
  PT: '/portal/pt/customers',
  CUSTOMER: '/portal/me',
} as const;

function PortalRoutes({ user }: { user: User }) {
  const { features } = useFeatures();
  const location = useLocation();
  const isPortalRoot = location.pathname === '/portal' || location.pathname === '/';

  return <AppShell user={user} features={features}>
    <Routes>
      <Route path="/portal/admin/*" element={<FeatureRoute user={user} roles={['ADMIN']}><AdminRoutes /></FeatureRoute>} />
      <Route path="/portal/pt/inbody" element={<FeatureRoute user={user} roles={['PT']} feature="OCR_INBODY"><InBodyWorkspace /></FeatureRoute>} />
      <Route path="/portal/pt/roadmaps" element={<FeatureRoute user={user} roles={['PT']} feature="ROADMAP"><RoadmapWorkspace /></FeatureRoute>} />
      <Route path="/portal/pt/exercises" element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><ExerciseLibrary /></FeatureRoute>} />
      <Route path="/portal/pt/workouts" element={<FeatureRoute user={user} roles={['PT']} feature="PROGRESS"><WorkoutWorkspace /></FeatureRoute>} />
      <Route path="/portal/pt/progress" element={<FeatureRoute user={user} roles={['PT']} feature="PROGRESS"><ProgressWorkspace /></FeatureRoute>} />
      <Route path="/portal/pt/nutrition" element={<FeatureRoute user={user} roles={['PT']} feature="NUTRITION_AI"><NutritionWorkspace /></FeatureRoute>} />
      <Route path="/portal/pt/*" element={<FeatureRoute user={user} roles={['PT']}><PtRoutes /></FeatureRoute>} />
      <Route path="/portal/me/*" element={<FeatureRoute user={user} roles={['CUSTOMER']}><CustomerRoutes /></FeatureRoute>} />
      <Route path="*" element={isPortalRoot ? <Navigate to={roleDestinations[user.role]} replace /> : <Navigate to="/portal" replace />} />
    </Routes>
  </AppShell>;
}

export default function PortalPage({ session: providedSession }: { session?: Session }) {
  const session = providedSession || getSession();
  const user: User = session?.user || { username: '', role: 'CUSTOMER' };
  return <FeaturesProvider><PortalRoutes user={user} /></FeaturesProvider>;
}
