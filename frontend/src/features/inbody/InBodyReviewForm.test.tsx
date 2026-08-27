// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/ToastProvider';
import { api } from '../../services/api';
import InBodyScanModal from './InBodyScanModal';

vi.mock('../../services/api', () => ({
  api: { upload: vi.fn(), patch: vi.fn() },
}));

const draft = {
  _id: 'inbody-draft-1', customerId: '507f1f77bcf86cd799439011', measurementDate: '2026-08-30',
  weight: 62.5, bodyFatPercentage: 24.1, muscleMass: 23.4, confidence: 0.61,
  warnings: ['Kiểm tra lại ngày đo.'], ocrWarnings: ['Kiểm tra lại ngày đo.'],
  source: 'AI_SCAN', status: 'DRAFT', ocrStatus: 'REVIEW_REQUIRED', publishedAt: null,
};

describe('InBodyScanModal', () => {
  beforeEach(() => {
    vi.mocked(api.upload).mockReset().mockResolvedValue({ data: draft, message: 'Đã quét phiếu InBody.' });
    vi.mocked(api.patch).mockReset().mockResolvedValue({ data: { ...draft, ocrStatus: 'CONFIRMED' }, message: 'Đã xác nhận dữ liệu OCR InBody.' });
  });

  it('luôn yêu cầu PT review OCR và không hiển thị trạng thái công bố', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><InBodyScanModal open onClose={vi.fn()} onConfirmed={vi.fn()} /></ToastProvider>);

    const customerInput = screen.getByLabelText('Mã khách hàng');
    const dateInput = screen.getByLabelText('Ngày đo');
    const imageInput = screen.getByLabelText('Ảnh phiếu InBody');
    await user.type(customerInput, draft.customerId);
    await user.type(dateInput, '2026-08-30');
    await user.upload(imageInput, new File(['image'], 'inbody.png', { type: 'image/png' }));
    expect(customerInput).toBeValid();
    expect(dateInput).toBeValid();
    expect(imageInput).toBeValid();
    const scanButton = screen.getByRole('button', { name: 'Quét InBody' });
    expect(scanButton).toHaveAttribute('type', 'submit');
    expect(scanButton.closest('form')).toBeTruthy();
    expect(scanButton.closest('form')?.checkValidity()).toBe(true);
    await user.click(scanButton);

    await waitFor(() => expect(api.upload).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Cần PT kiểm tra')).toBeVisible();
    expect(screen.getByText('Độ tin cậy thấp')).toBeVisible();
    expect(screen.getByText('Kiểm tra lại ngày đo.')).toBeVisible();
    expect(screen.queryByText('Đã công bố')).not.toBeInTheDocument();
    expect(api.upload).toHaveBeenCalledWith('/api/inbody/ocr', expect.any(FormData));
  });

  it('gửi dữ liệu PT đã chỉnh tới endpoint confirm canonical', async () => {
    const onConfirmed = vi.fn();
    const user = userEvent.setup();
    render(<ToastProvider><InBodyScanModal open onClose={vi.fn()} onConfirmed={onConfirmed} /></ToastProvider>);
    await user.type(screen.getByLabelText('Mã khách hàng'), draft.customerId);
    await user.type(screen.getByLabelText('Ngày đo'), '2026-08-30');
    await user.upload(screen.getByLabelText('Ảnh phiếu InBody'), new File(['image'], 'inbody.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: 'Quét InBody' }));
    await waitFor(() => expect(api.upload).toHaveBeenCalledTimes(1));
    const weight = await screen.findByLabelText('Cân nặng (kg)');
    await user.clear(weight);
    await user.type(weight, '63');
    await user.click(screen.getByRole('button', { name: 'Xác nhận dữ liệu' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/inbody/inbody-draft-1/confirm-ocr', expect.objectContaining({ weight: 63 })));
    expect(onConfirmed).toHaveBeenCalled();
  });
});
