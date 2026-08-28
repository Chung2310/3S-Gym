// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import TransferFormModal from '../../../src/components/ui/TransferFormModal';

vi.mock('../../../src/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/api')>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } };
});

describe('TransferFormModal', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({
      data: [{ _id: 'cust-1', fullName: 'Học viên A', phone: '0901234567' }],
      message: '',
    });
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('gửi yêu cầu chuyển giao PT cho khách hàng', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { _id: 't-1' }, message: 'Gửi yêu cầu chuyển PT thành công' });
    const user = userEvent.setup();
    const handleSaved = vi.fn();

    render(
      <ToastProvider>
        <TransferFormModal open={true} onClose={() => {}} onSaved={handleSaved} />
      </ToastProvider>
    );

    expect(screen.getByRole('dialog', { name: 'Tạo yêu cầu chuyển PT' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mã PT nhận')).toBeInTheDocument();
    expect(screen.getByLabelText('Lý do chuyển')).toBeInTheDocument();
  });

  it('sửa thông tin yêu cầu chuyển PT khi có dữ liệu', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { _id: 't-1' }, message: 'Cập nhật thành công' });
    const user = userEvent.setup();
    const handleSaved = vi.fn();

    render(
      <ToastProvider>
        <TransferFormModal
          open={true}
          transfer={{ _id: 't-1', customerId: 'cust-1', toPtId: 'pt-2', reason: 'Chuyển ca tập' }}
          onClose={() => {}}
          onSaved={handleSaved}
        />
      </ToastProvider>
    );

    expect(screen.getByRole('dialog', { name: 'Sửa yêu cầu chuyển PT' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mã PT nhận')).toHaveValue('pt-2');
    expect(screen.getByLabelText('Lý do chuyển')).toHaveValue('Chuyển ca tập');
  });
});
