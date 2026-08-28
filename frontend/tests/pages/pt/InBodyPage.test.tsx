// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import InBodyPage from '../../../src/pages/pt/InBodyPage';

vi.mock('../../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

const mockRecords = [
  {
    _id: 'inbody-1',
    customerId: { _id: 'cust-1', fullName: 'Trần Văn Mạnh', phone: '0901234567' },
    measurementDate: '2026-08-28T00:00:00.000Z',
    weight: 75.0,
    bmi: 24.2,
    bodyFatPercentage: 20.5,
    muscleMass: 34.0,
    bmr: 1680,
    visceralFatLevel: 5,
    inbodyScore: 82,
    source: 'MANUAL',
    status: 'PUBLISHED',
    ocrStatus: 'NOT_APPLICABLE',
  },
  {
    _id: 'inbody-2',
    customerId: { _id: 'cust-1', fullName: 'Trần Văn Mạnh', phone: '0901234567' },
    measurementDate: '2026-07-28T00:00:00.000Z',
    weight: 77.5,
    bmi: 25.0,
    bodyFatPercentage: 22.5,
    muscleMass: 33.2,
    bmr: 1650,
    visceralFatLevel: 6,
    inbodyScore: 78,
    source: 'AI_SCAN',
    status: 'DRAFT',
    ocrStatus: 'CONFIRMED',
  },
];

describe('InBodyPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({
      data: mockRecords,
      meta: { page: 1, limit: 15, total: 2, totalPages: 1 },
      message: 'Thành công',
    });
    vi.mocked(api.patch).mockReset().mockResolvedValue({ data: mockRecords[0], message: 'Thành công' });
    vi.mocked(api.delete).mockReset().mockResolvedValue({ message: 'Đã xóa', data: null });
  });

  it('hiển thị danh sách phiếu InBody và đầy đủ nút thao tác', async () => {
    render(
      <ToastProvider>
        <InBodyPage />
      </ToastProvider>
    );

    expect((await screen.findAllByText('Trần Văn Mạnh'))[0]).toBeInTheDocument();
    expect(screen.getByText('75 kg')).toBeInTheDocument();
    expect(screen.getByText('20.5%')).toBeInTheDocument();
    expect(screen.getByText('34 kg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nhập Thủ Công/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quét Phiếu InBody/i })).toBeInTheDocument();
  });

  it('mở modal phân tích chi tiết & gợi ý tư vấn PT khi bấm nút Phân Tích', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <InBodyPage />
      </ToastProvider>
    );

    const analyzeButtons = await screen.findAllByRole('button', { name: /Xem phân tích & tư vấn PT/i });
    expect(analyzeButtons.length).toBeGreaterThan(0);
    await user.click(analyzeButtons[0]);

    // Modal phân tích mở ra với các tiêu đề phân tích
    expect(await screen.findByText('Phân Tích InBody & Tư Vấn PT')).toBeInTheDocument();
    expect(screen.getByText('Phân Tích Thành Phần Cơ Thể (Body Composition)')).toBeInTheDocument();
    expect(screen.getByText('Điểm Mạnh Của Học Viên')).toBeInTheDocument();
    expect(screen.getByText('Kịch Bản & Hướng Dẫn Tư Vấn Chuyên Sâu Cho PT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sao chép' })).toBeInTheDocument();
  });

  it('mở modal nhập thủ công khi bấm nút Nhập Thủ Công', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <InBodyPage />
      </ToastProvider>
    );

    const manualButton = screen.getByRole('button', { name: /Nhập Thủ Công/i });
    await user.click(manualButton);

    expect(await screen.findByText('Nhập kết quả InBody thủ công')).toBeInTheDocument();
    expect(screen.getByLabelText('Ngày đo InBody')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu kết quả InBody' })).toBeInTheDocument();
  });
});
