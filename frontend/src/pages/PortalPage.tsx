import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import PortalNotFound from '../components/PortalNotFound';
import FeatureRoute from '../components/FeatureRoute';
import AdminRoutes from '../components/admin/AdminRoutes';
import PtRoutes from '../components/customers/PtRoutes';
import CustomerRoutes from '../components/customer-portal/CustomerRoutes';
import InBodyWorkspace from '../components/inbody/InBodyWorkspace';
import RoadmapWorkspace from '../components/roadmap/RoadmapWorkspace';
import ExerciseLibrary from '../components/exercises/ExerciseLibrary';
import WorkoutWorkspace from '../components/workouts/WorkoutWorkspace';
import ProgressWorkspace from '../components/progress/ProgressWorkspace';
import NutritionWorkspace from '../components/nutrition/NutritionWorkspace';
import CareWorkspace from '../components/care/CareWorkspace';
import PtDashboard from '../components/dashboard/PtDashboard';
import NotificationCenter from '../components/notifications/NotificationCenter';
import InternalCalendar from '../components/calendar/InternalCalendar';
import KnowledgeBase from '../components/knowledge/KnowledgeBase';
import KnowledgeSearch from '../components/knowledge/KnowledgeSearch';
import PtAssistant from '../components/assistant/PtAssistant';
import { FeaturesProvider, useFeatures } from '../services/features';
import { getSession } from '../services/session';
import type { Session, User } from '../types';

const roleDestinations = {
  ADMIN: '/portal/admin',
  PT: '/portal/pt/customers',
  CUSTOMER: '/portal/me',
} as const;
const roleLabels = { ADMIN: 'ADMIN', PT: 'PT', CUSTOMER: 'khách hàng' } as const;

function PortalRoutes({ user }: { user: User }) {
  const { features } = useFeatures();
  const location = useLocation();
  const isPortalRoot = location.pathname === '/portal' || location.pathname === '/';

  return <AppShell user={user} features={features}>
    <Routes>
      <Route path="notifications" element={<NotificationCenter />} />
      <Route path="calendar" element={<FeatureRoute user={user} roles={['ADMIN', 'PT']}><InternalCalendar role={user.role} /></FeatureRoute>} />
      <Route path="admin/knowledge" element={<FeatureRoute user={user} roles={['ADMIN']} feature="KNOWLEDGE_BASE"><KnowledgeBase /></FeatureRoute>} />
      <Route path="pt/knowledge-search" element={<FeatureRoute user={user} roles={['PT']} feature="KNOWLEDGE_BASE"><KnowledgeSearch /></FeatureRoute>} />
      <Route path="pt/assistant" element={<FeatureRoute user={user} roles={['PT']} feature="PT_ASSISTANT"><PtAssistant /></FeatureRoute>} />
      <Route path="admin/*" element={<FeatureRoute user={user} roles={['ADMIN']}><AdminRoutes /></FeatureRoute>} />
      <Route path="pt/inbody" element={<FeatureRoute user={user} roles={['PT']} feature="OCR_INBODY"><InBodyWorkspace /></FeatureRoute>} />
      <Route path="pt/roadmaps/*" element={<FeatureRoute user={user} roles={['PT']} feature="ROADMAP"><RoadmapWorkspace /></FeatureRoute>} />
      <Route path="pt/exercises" element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><ExerciseLibrary /></FeatureRoute>} />
      <Route path="pt/workout-plans/*" element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><WorkoutWorkspace /></FeatureRoute>} />
      <Route path="pt/workouts" element={<Navigate to="/portal/pt/workout-plans" replace />} />
      <Route path="pt/progress/*" element={<FeatureRoute user={user} roles={['PT']} feature="PROGRESS"><ProgressWorkspace /></FeatureRoute>} />
      <Route path="pt/nutrition" element={<FeatureRoute user={user} roles={['PT']} feature="NUTRITION_AI"><NutritionWorkspace /></FeatureRoute>} />
      <Route path="pt/care" element={<FeatureRoute user={user} roles={['PT']} feature="CARE"><CareWorkspace /></FeatureRoute>} />
      <Route path="pt/dashboard" element={<FeatureRoute user={user} roles={['PT']} feature="DASHBOARD"><PtDashboard /></FeatureRoute>} />
      <Route path="pt/customers/*" element={<FeatureRoute user={user} roles={['PT']}><PtRoutes /></FeatureRoute>} />
      <Route path="pt/*" element={<FeatureRoute user={user} roles={['PT']}><PtRoutes /></FeatureRoute>} />
      <Route path="me/*" element={<FeatureRoute user={user} roles={['CUSTOMER']}><CustomerRoutes /></FeatureRoute>} />
      <Route path="*" element={isPortalRoot ? <Navigate to={roleDestinations[user.role]} replace /> : <PortalNotFound destination={roleDestinations[user.role]} roleLabel={roleLabels[user.role]} />} />
    </Routes>
  </AppShell>;
}

export default function PortalPage({ session: providedSession }: { session?: Session }) {
  const session = providedSession || getSession();
  const user: User = session?.user || { username: '', role: 'CUSTOMER' };
  return <FeaturesProvider><PortalRoutes user={user} /></FeaturesProvider>;
}
