// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import AiExerciseWizard from '../../../src/components/exercises/AiExerciseWizard';
import ExerciseLibraryPage from '../../../src/pages/pt/ExerciseLibraryPage';
import { api } from '../../../src/services/api';

const generatedDrafts = [
  { name: 'Cable Row', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH', equipment: ['Cáp'], description: 'Kéo cáp.', technique: 'Giữ lưng trung lập.', commonMistakes: [], contraindications: [], variants: [] },
  { name: 'Lat Pulldown', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH', equipment: ['Cáp'], description: 'Kéo xô.', technique: 'Kéo về ngực trên.', commonMistakes: [], contraindications: [], variants: [] },
] as const;

beforeEach(() => {
  vi.mocked(api.post).mockReset();
  vi.mocked(api.get).mockReset().mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0, total: 0 }, message: '' });
});

describe('AiExerciseWizard', () => {
  it('generates, edits, selects, and saves only reviewed batch drafts', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { drafts: generatedDrafts, discardedCount: 0 }, message: 'Đã tạo bản nháp.' })
      .mockResolvedValueOnce({ data: [generatedDrafts[0]], message: 'Đã lưu 1 bài tập vào thư viện.' });
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<AiExerciseWizard open onClose={vi.fn()} onSaved={onSaved} />);

    await user.selectOptions(screen.getByLabelText('Chế độ tạo'), 'BATCH');
    await user.type(screen.getByLabelText('Nhóm cơ'), 'Lưng');
    await user.selectOptions(screen.getByLabelText('Cấp độ'), 'INTERMEDIATE');
    await user.selectOptions(screen.getByLabelText('Cách ghi nhận'), 'STRENGTH');
    await user.type(screen.getByLabelText('Thiết bị'), 'Cáp');
    await user.clear(screen.getByLabelText('Số lượng'));
    await user.type(screen.getByLabelText('Số lượng'), '2');
    await user.click(screen.getByRole('button', { name: 'Tạo bản nháp' }));

    expect(api.post).toHaveBeenNthCalledWith(1, '/api/ai/exercise-generations', {
      mode: 'BATCH', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH',
      equipment: ['Cáp'], quantity: 2, additionalRequest: '',
    });
    await user.clear(await screen.findByLabelText('Tên bài tập 1'));
    await user.type(screen.getByLabelText('Tên bài tập 1'), 'Cable Row chỉnh sửa');
    await user.click(screen.getByLabelText('Chọn bài tập 2'));
    await user.click(screen.getByRole('button', { name: 'Lưu 1 bài tập' }));

    expect(api.post).toHaveBeenNthCalledWith(2, '/api/exercises/bulk', {
      exercises: [expect.objectContaining({ name: 'Cable Row chỉnh sửa' })],
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('fixes quantity at one in single mode', () => {
    render(<AiExerciseWizard open onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.getByLabelText('Chế độ tạo')).toHaveValue('SINGLE');
    expect(screen.queryByLabelText('Số lượng')).not.toBeInTheDocument();
  });

  it('validates batch quantity before calling the API', async () => {
    const user = userEvent.setup();
    render(<AiExerciseWizard open onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText('Chế độ tạo'), 'BATCH');
    await user.type(screen.getByLabelText('Nhóm cơ'), 'Lưng');
    await user.clear(screen.getByLabelText('Số lượng'));
    await user.type(screen.getByLabelText('Số lượng'), '11');
    await user.click(screen.getByRole('button', { name: 'Tạo bản nháp' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Số lượng phải từ 2 đến 10');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('keeps configuration after generation fails', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('AI tạm thời không phản hồi.'));
    const user = userEvent.setup();
    render(<AiExerciseWizard open onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Nhóm cơ'), 'Vai');
    await user.click(screen.getByRole('button', { name: 'Tạo bản nháp' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('AI tạm thời không phản hồi.');
    expect(screen.getByLabelText('Nhóm cơ')).toHaveValue('Vai');
  });

  it('keeps edited drafts and selections after saving fails', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { drafts: generatedDrafts, discardedCount: 0 }, message: '' })
      .mockRejectedValueOnce(new Error('Không thể lưu bài tập.'));
    const user = userEvent.setup();
    render(<AiExerciseWizard open onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Nhóm cơ'), 'Lưng');
    await user.click(screen.getByRole('button', { name: 'Tạo bản nháp' }));
    await user.clear(await screen.findByLabelText('Tên bài tập 1'));
    await user.type(screen.getByLabelText('Tên bài tập 1'), 'Cable Row đã sửa');
    await user.click(screen.getByRole('button', { name: 'Lưu 2 bài tập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu bài tập.');
    expect(screen.getByLabelText('Tên bài tập 1')).toHaveValue('Cable Row đã sửa');
    expect(screen.getByLabelText('Chọn bài tập 1')).toBeChecked();
  });

  it('disables saving when no draft is selected', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { drafts: generatedDrafts, discardedCount: 0 }, message: '' });
    const user = userEvent.setup();
    render(<AiExerciseWizard open onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Nhóm cơ'), 'Lưng');
    await user.click(screen.getByRole('button', { name: 'Tạo bản nháp' }));
    await user.click(await screen.findByLabelText('Chọn tất cả'));
    expect(screen.getByRole('button', { name: 'Lưu 0 bài tập' })).toBeDisabled();
  });
});

describe('ExerciseLibraryPage AI entry point', () => {
  it('opens the AI wizard from the exercise library', async () => {
    const user = userEvent.setup();
    render(<ExerciseLibraryPage />);
    await user.click(screen.getByRole('button', { name: 'Tạo bằng AI' }));
    expect(screen.getByRole('dialog', { name: 'Tạo bài tập bằng AI' })).toBeVisible();
  });
});
