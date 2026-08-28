// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import PackageTemplateView from '../../../src/components/admin/PackageTemplateView';
import PtPackageManagerModal from '../../../src/components/ui/PtPackageManagerModal';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/api')>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('PackageTemplateView & PT Template Preset integration', () => {
  const mockTemplates = [
    {
      _id: 'tpl-1',
      name: 'Gói 12 buổi (1 tháng)',
      totalSessions: 12,
      durationDays: 30,
      price: 3600000,
      description: 'Gói trải nghiệm',
      status: 'ACTIVE',
    },
    {
      _id: 'tpl-2',
      name: 'Gói 36 buổi (3 tháng)',
      totalSessions: 36,
      durationDays: 90,
      price: 9000000,
      description: 'Gói tăng cơ giảm mỡ',
      status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin xem được danh sách gói tập mẫu', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/api/package-templates')) {
        return {
          data: mockTemplates,
          meta: { page: 1, totalPages: 1 },
          message: '',
        };
      }
      return { data: [], message: '' };
    });

    render(
      <ToastProvider>
        <PackageTemplateView />
      </ToastProvider>
    );

    expect((await screen.findAllByText('Gói 12 buổi (1 tháng)')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gói 36 buổi (3 tháng)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('12 buổi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('36 buổi').length).toBeGreaterThan(0);
  });

  it('Admin mở được modal tạo gói tập mẫu mới', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [],
      meta: { page: 1, totalPages: 1 },
      message: '',
    });

    const user = userEvent.setup();
    render(
      <ToastProvider>
        <PackageTemplateView />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Tạo gói mẫu mới' }));
    expect(screen.getByRole('dialog', { name: 'Tạo gói tập mẫu mới' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tên gói tập mẫu')).toBeInTheDocument();
    expect(screen.getByLabelText('Tổng số buổi')).toBeInTheDocument();
    expect(screen.getByLabelText('Thời hạn sử dụng (ngày)')).toBeInTheDocument();
  });

  it('PT có thể bấm chọn nhanh từ gói mẫu khi tạo gói cho học viên', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url.includes('/api/package-templates')) {
        return { data: mockTemplates, message: '' };
      }
      if (url.includes('/api/customers/cust-1/packages')) {
        return { data: [], meta: { page: 1, totalPages: 1 }, message: '' };
      }
      return { data: [], message: '' };
    });

    const user = userEvent.setup();
    render(
      <ToastProvider>
        <PtPackageManagerModal
          open={true}
          customer={{ _id: 'cust-1', fullName: 'Nguyễn Văn A' }}
          onClose={() => {}}
        />
      </ToastProvider>
    );

    // Verify template chips appear
    expect(await screen.findByText('Gói 12 buổi (1 tháng)')).toBeInTheDocument();
    expect(screen.getByText('Gói 36 buổi (3 tháng)')).toBeInTheDocument();

    // Click on 36 session preset
    const presetBtn = screen.getByRole('button', { name: /Gói 36 buổi \(3 tháng\)/i });
    await user.click(presetBtn);

    // Verify form fields auto-filled
    expect(screen.getByLabelText('Tên gói')).toHaveValue('Gói 36 buổi (3 tháng)');
    expect(screen.getByLabelText('Tổng số buổi')).toHaveValue(36);
  });
});
