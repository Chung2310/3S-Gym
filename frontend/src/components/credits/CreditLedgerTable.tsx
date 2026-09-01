import type { CreditLedgerEntry } from '../../types/credits';

const labels: Record<CreditLedgerEntry['type'], string> = {
  TOPUP: 'Nạp credit',
  RESERVE: 'Tạm giữ AI',
  SETTLE: 'Quyết toán AI',
  RELEASE: 'Hoàn credit',
  ADJUSTMENT: 'Điều chỉnh',
};

export default function CreditLedgerTable({ entries }: { entries: CreditLedgerEntry[] }) {
  if (!entries.length) {
    return (
      <div className="wallet-empty-state">
        Chưa có giao dịch credit nào được ghi nhận.
      </div>
    );
  }

  return (
    <div className="pt-dash-table-wrap">
      <table className="pt-dash-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Loại giao dịch</th>
            <th>Biến động</th>
            <th>Số dư sau</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isPositive = entry.availableDelta >= 0;
            return (
              <tr key={entry._id}>
                <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: '#64748b', fontSize: '0.76rem' }}>
                  {new Date(entry.createdAt).toLocaleString('vi-VN')}
                </td>
                <td>
                  <span className="wallet-ledger-badge">
                    {labels[entry.type] || entry.type}
                  </span>
                </td>
                <td style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  <span style={{ color: isPositive ? '#16a34a' : '#e11d48' }}>
                    {entry.availableDelta > 0 ? `+${entry.availableDelta}` : entry.availableDelta} credit
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: '#1e293b', fontFamily: "'Oswald', sans-serif", fontSize: '0.88rem' }}>
                  {entry.availableAfter}
                </td>
                <td style={{ color: '#475569', fontSize: '0.76rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.reason || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
