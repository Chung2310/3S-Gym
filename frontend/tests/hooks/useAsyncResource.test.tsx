// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncResource } from '../../src/hooks/useAsyncResource';

describe('useAsyncResource', () => {
  it('quản lý loading, success và refresh', async () => {
    const loader = vi.fn().mockResolvedValueOnce('lần đầu').mockResolvedValueOnce('lần hai');
    const { result } = renderHook(() => useAsyncResource(loader));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.data).toBe('lần đầu'));
    expect(result.current.status).toBe('success');

    await act(async () => { await result.current.refresh(); });
    expect(result.current.data).toBe('lần hai');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('giữ dữ liệu hiện tại khi refresh thất bại', async () => {
    const loader = vi.fn().mockResolvedValueOnce('dữ liệu cũ').mockRejectedValueOnce(new Error('Mất kết nối'));
    const { result } = renderHook(() => useAsyncResource(loader));
    await waitFor(() => expect(result.current.data).toBe('dữ liệu cũ'));

    await act(async () => { await result.current.refresh(); });
    expect(result.current.status).toBe('error');
    expect(result.current.data).toBe('dữ liệu cũ');
    expect(result.current.error).toEqual(new Error('Mất kết nối'));
  });
});
