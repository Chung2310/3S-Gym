export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Phân trang"><button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trang trước</button><span>Trang {page}/{totalPages}</span><button type="button" aria-label="Trang sau" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Trang sau</button></nav>;
}
