// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../src/components/ui/ToastProvider';
import FeatureRoute from '../src/components/FeatureRoute';
import PortalRoutes from '../src/routes/PortalRoutes';
import { FeaturesProvider } from '../src/services/features';
import { api } from '../src/services/api';

vi.mock('../src/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/api')>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } };
});

it('PT đi từ CRM sang Trợ lý PT 3S bằng navigation', async () => {
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path === '/api/features/me') return { data: {}, message: '' };
    return { data: [], meta: { page: 1, totalPages: 0 }, message: '' };
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/pt/customers']}>
      <ToastProvider>
        <Routes>
          <Route
            path="/*"
            element={<PortalRoutes session={{ token: 'x', user: { username: 'pt', role: 'PT' } }} />}
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
  expect(await screen.findByRole('heading', { name: 'Khách hàng của tôi' })).toBeVisible();
  await user.click(await screen.findByRole('link', { name: 'Trợ lý PT 3S' }));
  expect(await screen.findByRole('heading', { name: 'Trợ lý PT 3S' })).toBeVisible();
});

it('chặn route khi feature tắt', async () => {
  render(
    <MemoryRouter initialEntries={['/private']}>
      <FeaturesProvider initialFeatures={{ CARE: false }}>
        <Routes>
          <Route
            path="/private"
            element={
              <FeatureRoute user={{ username: 'pt', role: 'PT' }} roles={['PT']} feature="CARE">
                <h1>Private</h1>
              </FeatureRoute>
            }
          />
        </Routes>
      </FeaturesProvider>
    </MemoryRouter>
  );
  expect(await screen.findByRole('heading', { name: 'Tính năng chưa khả dụng' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Private' })).not.toBeInTheDocument();
});
