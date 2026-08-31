// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { useMobile, useIsMobile } from '../../src/hooks/useMobile';

describe('useMobile hook', () => {
  const originalInnerWidth = window.innerWidth;

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    // Mock matchMedia nếu chưa có trong jsdom
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    setWindowWidth(originalInnerWidth);
  });

  it('trả về true khi kích thước màn hình nhỏ hơn 768px (Mobile)', () => {
    setWindowWidth(500);
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(true);
  });

  it('trả về false khi kích thước màn hình lớn hơn hoặc bằng 768px (Desktop/Tablet lớn)', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(false);
  });

  it('tự động cập nhật khi có sự kiện resize cửa sổ', () => {
    setWindowWidth(1200);
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWindowWidth(480);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);

    act(() => {
      setWindowWidth(1024);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(false);
  });

  it('hỗ trợ tùy biến ngưỡng breakpoint', () => {
    setWindowWidth(900);
    // Với breakpoint mặc định 768: 900px không phải mobile
    const { result: defaultResult } = renderHook(() => useMobile());
    expect(defaultResult.current).toBe(false);

    // Với breakpoint 1024: 900px là mobile/tablet nhỏ
    const { result: customResult } = renderHook(() => useMobile(1024));
    expect(customResult.current).toBe(true);
  });

  it('useIsMobile là bí danh tương đương của useMobile', () => {
    setWindowWidth(600);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
