import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import PortalNotFound from '../components/PortalNotFound';
import FeatureRoute from '../components/FeatureRoute';
import AdminRoutes from './AdminRoutes';

// Pages
import InBodyPage from '../pages/pt/InBodyPage';
import PtCustomersPage from '../pages/pt/PtCustomersPage';
import PtDashboardPage from '../pages/pt/PtDashboardPage';
import RoadmapPage from '../pages/pt/RoadmapPage';
import ExerciseLibraryPage from '../pages/pt/ExerciseLibraryPage';
import WorkoutPlansPage from '../pages/pt/WorkoutPlansPage';
import ProgressPage from '../pages/pt/ProgressPage';
import NutritionPage from '../pages/pt/NutritionPage';
import CarePage from '../pages/pt/CarePage';
import PtAssistantPage from '../pages/pt/PtAssistantPage';
import KnowledgeSearchPage from '../pages/pt/KnowledgeSearchPage';
import AdminKnowledgePage from '../pages/admin/AdminKnowledgePage';
import CustomerPortalPage from '../pages/customer/CustomerPortalPage';
import CalendarPage from '../pages/common/CalendarPage';
import NotificationsPage from '../pages/common/NotificationsPage';

import { FeaturesProvider, useFeatures } from '../services/features';
import { getSession } from '../services/session';
import type { Session, User } from '../types';

const roleDestinations = {
  ADMIN: '/admin',
  PT: '/pt/customers',
  CUSTOMER: '/me',
} as const;
const roleLabels = { ADMIN: 'ADMIN', PT: 'PT', CUSTOMER: 'khách hàng' } as const;

function PortalContent({ user }: { user: User }) {
  const { features } = useFeatures();
  const location = useLocation();
  const isPortalRoot = location.pathname === '/portal' || location.pathname === '/portal/' || location.pathname === '/';

  return (
    <AppShell user={user} features={features}>
      <Routes>
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="calendar"
          element={
            <FeatureRoute user={user} roles={['ADMIN', 'PT']}>
              <CalendarPage role={user.role} />
            </FeatureRoute>
          }
        />
        <Route
          path="admin/knowledge"
          element={
            <FeatureRoute user={user} roles={['ADMIN']} feature="KNOWLEDGE_BASE">
              <AdminKnowledgePage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/knowledge-search"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="KNOWLEDGE_BASE">
              <KnowledgeSearchPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/assistant"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="PT_ASSISTANT">
              <PtAssistantPage />
            </FeatureRoute>
          }
        />
        <Route
          path="admin/*"
          element={
            <FeatureRoute user={user} roles={['ADMIN']}>
              <AdminRoutes />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/inbody"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="OCR_INBODY">
              <InBodyPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/roadmaps/*"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="ROADMAP">
              <RoadmapPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/exercises"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY">
              <ExerciseLibraryPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/workout-plans/*"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY">
              <WorkoutPlansPage />
            </FeatureRoute>
          }
        />
        <Route path="pt/workouts" element={<Navigate to="/pt/workout-plans" replace />} />
        <Route
          path="pt/progress/*"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="PROGRESS">
              <ProgressPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/nutrition"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="NUTRITION_AI">
              <NutritionPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/care"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="CARE">
              <CarePage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/dashboard"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="DASHBOARD">
              <PtDashboardPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/customers/*"
          element={
            <FeatureRoute user={user} roles={['PT']}>
              <PtCustomersPage />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/*"
          element={
            <FeatureRoute user={user} roles={['PT']}>
              <PtCustomersPage />
            </FeatureRoute>
          }
        />
        <Route
          path="me/*"
          element={
            <FeatureRoute user={user} roles={['CUSTOMER']}>
              <CustomerPortalPage />
            </FeatureRoute>
          }
        />
        <Route
          path="*"
          element={
            isPortalRoot ? (
              <Navigate to={roleDestinations[user.role]} replace />
            ) : (
              <PortalNotFound destination={roleDestinations[user.role]} roleLabel={roleLabels[user.role]} />
            )
          }
        />
      </Routes>
    </AppShell>
  );
}

export default function PortalRoutes({ session: providedSession }: { session?: Session }) {
  const session = providedSession || getSession();
  const user: User = session?.user || { username: '', role: 'CUSTOMER' };
  return (
    <FeaturesProvider>
      <PortalContent user={user} />
    </FeaturesProvider>
  );
}
