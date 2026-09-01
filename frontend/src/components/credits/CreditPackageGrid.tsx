import type { CreditPackage } from '../../types/credits';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CreditPackageGrid({
  packages,
  selectedId,
  onSelect,
}: {
  packages: CreditPackage[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!packages.length) {
    return (
      <div className="wallet-empty-state">
        Chưa có gói credit đang mở bán. Bạn vẫn có thể nhập số tiền tùy chọn bên dưới.
      </div>
    );
  }

  return (
    <div className="wallet-pkg-grid">
      {packages.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <label
            key={item.id}
            className={`wallet-pkg-card${isSelected ? ' wallet-pkg-card--selected' : ''}`}
          >
            <input
              className="sr-only"
              type="radio"
              name="credit-package"
              value={item.id}
              checked={isSelected}
              onChange={() => onSelect(item.id)}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="wallet-pkg-price">
                  {money.format(item.amountVnd)}
                </span>
                {item.bonusCredits > 0 && (
                  <span className="wallet-pkg-bonus">
                    +{item.bonusCredits} bonus
                  </span>
                )}
              </div>
              <strong className="wallet-pkg-name">
                {item.name}
              </strong>
              {item.description && (
                <p className="wallet-pkg-desc">
                  {item.description}
                </p>
              )}
            </div>

            <div className="wallet-pkg-credits">
              <span className="value">{item.grantCredits}</span>
              <span className="unit">credit</span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
