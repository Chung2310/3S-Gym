interface Props {
  label: string;
  ariaLabel: string;
  value?: number;
  placeholder?: number | string;
  min?: number;
  max?: number;
  step?: number | string;
  onChange: (value?: number) => void;
}

export default function TrackingNumberField({ label, ariaLabel, value, placeholder, min = 0, max, step = 1, onChange }: Props) {
  return <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-600"><span>{label}</span><input className="min-h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20" aria-label={ariaLabel} type="number" min={min} max={max} step={step} placeholder={placeholder == null ? '0' : String(placeholder)} value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></label>;
}
