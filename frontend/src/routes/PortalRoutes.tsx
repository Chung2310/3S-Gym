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
import MyWorkoutPlans from '../components/workouts/MyWorkoutPlans';
import WorkoutStudioPage from '../pages/pt/WorkoutStudioPage';
import ProgressPage from '../pages/pt/ProgressPage';
import NutritionPage from '../pages/pt/NutritionPage';
import CarePage from '../pages/pt/CarePage';
import PtAssistantPage from '../pages/pt/PtAssistantPage';
import KnowledgeSearchPage from '../pages/pt/KnowledgeSearchPage';
import AdminKnowledgePage from '../pages/admin/AdminKnowledgePage';
import AdminCustomersPage from '../pages/admin/AdminCustomersPage';
import AdminTransfersPage from '../pages/admin/AdminTransfersPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import CustomerPortalPage from '../pages/customer/CustomerPortalPage';
import NotificationsPage from '../pages/common/NotificationsPage';
import ConsultationTool from '../pages/ConsultationTool';
import WalletPage from '../pages/common/WalletPage';
import PaymentResultPage from '../pages/common/PaymentResultPage';
import CreditAdminPage from '../pages/admin/CreditAdminPage';

import { FeaturesProvider, useFeatures } from '../services/features';
import { getSession } from '../services/session';
import type { Session, User } from '../types';
import { CreditWalletProvider } from '../contexts/CreditWalletContext';

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
    <CreditWalletProvider><AppShell user={user} features={features}>
      <Routes>
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="wallet/payment-result" element={<PaymentResultPage />} />
        <Route path="admin/credits" element={<FeatureRoute user={user} roles={['ADMIN']}><CreditAdminPage /></FeatureRoute>} />
        <Route
          path="consultation"
          element={
            <FeatureRoute user={user} roles={['PT']}>
              <ConsultationTool />
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
          path="admin/customers"
          element={
            <FeatureRoute user={user} roles={['ADMIN']}>
              <AdminCustomersPage />
            </FeatureRoute>
          }
        />
        <Route
          path="admin/transfers"
          element={
            <FeatureRoute user={user} roles={['ADMIN']}>
              <AdminTransfersPage />
            </FeatureRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <FeatureRoute user={user} roles={['ADMIN']}>
              <AdminUsersPage />
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
            <FeatureRoute user={user} roles={['PT']}>
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
        <Route path="pt/exercises" element={<Navigate to="/pt/my-workout-plans?tab=exercises" replace />} />
        <Route
          path="pt/my-workout-plans/new"
          element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><WorkoutStudioPage /></FeatureRoute>}
        />
        <Route
          path="pt/my-workout-plans/:templateId/edit"
          element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><WorkoutStudioPage /></FeatureRoute>}
        />
        <Route
          path="pt/my-workout-plans"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY">
              <MyWorkoutPlans />
            </FeatureRoute>
          }
        />
        <Route
          path="pt/customers/:customerId/workout-plans/:planId/edit"
          element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><WorkoutStudioPage /></FeatureRoute>}
        />
        <Route
          path="pt/customer-workout-plans"
          element={<Navigate to="/pt/customers" replace />}
        />
        <Route path="pt/workout-plans/*" element={<Navigate to="/pt/my-workout-plans" replace />} />
        <Route path="pt/workouts" element={<Navigate to="/pt/my-workout-plans" replace />} />
        <Route
          path="pt/progress/*"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="PROGRESS">
              <ProgressPage />
            </FeatureRoute>
          }
        />
        <Route path="pt/nutrition-assistant" element={<Navigate to="/pt/assistant" replace />} />
        <Route
          path="pt/nutrition"
          element={
            <FeatureRoute user={user} roles={['PT']} feature="NUTRITION_AI">
              <NutritionPage />
            </FeatureRoute>
          }
        />
        <Route path="pt/care" element={<Navigate to="/pt/dashboard" replace />} />
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
          path="me/assistant"
          element={
            <FeatureRoute user={user} roles={['CUSTOMER']}>
              <PtAssistantPage />
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
    </AppShell></CreditWalletProvider>
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
