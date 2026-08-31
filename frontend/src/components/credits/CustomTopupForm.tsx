export default function CustomTopupForm({
  value,
  selected,
  onChange,
  onSelect,
}: {
  value: string;
  selected: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={`wallet-custom-topup${selected ? ' wallet-custom-topup--selected' : ''}`}
    >
      <label>
        <input
          type="radio"
          name="credit-package"
          checked={selected}
          onChange={onSelect}
        />
        <span>Số tiền tùy chọn</span>
      </label>
      <p className="hint">
        Tối thiểu 10.000đ, tối đa 50.000.000đ (bội số của 1.000đ).
      </p>
      <input
        aria-label="Số tiền nạp tùy chọn"
        type="number"
        min={10000}
        max={50000000}
        step={1000}
        value={value}
        onFocus={onSelect}
        onChange={(event) => {
          onSelect();
          onChange(event.target.value);
        }}
        placeholder="Ví dụ: 100000"
      />
    </div>
  );
}
