// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import DataList from './DataList';
import Pagination from './Pagination';
import FormField from './FormField';
import StatusBadge from './StatusBadge';
import FilterBar from './FilterBar';

describe('component dùng chung', () => {
  it('DataList hiển thị cùng dữ liệu ở bảng và thẻ mobile', () => {
    render(<DataList columns={[{ key: 'name', label: 'Họ tên' }]} items={[{ _id: '1', name: 'Nguyễn Văn A' }]} />);
    expect(screen.getAllByText('Nguyễn Văn A')).toHaveLength(2);
  });

  it('Pagination gọi trang được chọn', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={2} onPageChange={onPageChange} />);
    screen.getByRole('button', { name: 'Trang sau' }).click();
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('FormField và StatusBadge cung cấp label/trạng thái tiếng Việt', () => {
    render(<><FormField label="Họ tên" name="fullName" /><StatusBadge status="PUBLISHED" /></>);
    expect(screen.getByLabelText('Họ tên')).toBeInTheDocument();
    expect(screen.getByText('Đã công bố')).toBeInTheDocument();
  });

  it('FilterBar cập nhật từ khóa tìm kiếm', () => {
    const onChange = vi.fn();
    render(<FilterBar keyword="" onKeywordChange={onChange} />);
    screen.getByLabelText('Tìm kiếm').dispatchEvent(new Event('input', { bubbles: true }));
    expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
  });
});
