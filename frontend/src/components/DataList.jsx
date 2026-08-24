export default function DataList({ columns, items, emptyMessage = 'Chưa có dữ liệu.', renderActions }) {
  if (!items.length) return <div className="empty-state">{emptyMessage}</div>;
  return (
    <>
      <div className="data-table-wrap">
        <table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}{renderActions && <th>Thao tác</th>}</tr></thead>
          <tbody>{items.map((item) => <tr key={item._id || item.id}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(item) : item[column.key] || '—'}</td>)}{renderActions && <td>{renderActions(item)}</td>}</tr>)}</tbody>
        </table>
      </div>
      <div className="data-cards">{items.map((item) => <article className="data-card" key={item._id || item.id}>{columns.map((column) => <div className="data-card-row" key={column.key}><span>{column.label}</span><strong>{column.render ? column.render(item) : item[column.key] || '—'}</strong></div>)}{renderActions && <div className="data-card-actions">{renderActions(item)}</div>}</article>)}</div>
    </>
  );
}
