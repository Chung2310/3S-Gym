import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
interface FilterBarProps { keyword: string; onKeywordChange: (value: string) => void; children?: ReactNode; ariaLabel?: string }
export default function FilterBar({ keyword, onKeywordChange, children, ariaLabel = 'Tìm kiếm' }: FilterBarProps) { return <div className="filter-bar"><label className="search-field"><Search size={18} /><span className="sr-only">{ariaLabel}</span><input aria-label={ariaLabel} value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="Tìm theo tên, số điện thoại..." /></label>{children}</div>; }
