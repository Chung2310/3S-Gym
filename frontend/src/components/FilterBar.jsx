import { Search } from 'lucide-react';
export default function FilterBar({ keyword, onKeywordChange, children }) {
  return <div className="filter-bar"><label className="search-field"><Search size={18} /><span className="sr-only">Tìm kiếm</span><input aria-label="Tìm kiếm" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="Tìm theo tên, số điện thoại..." /></label>{children}</div>;
}
