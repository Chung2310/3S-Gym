import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Check, CheckCircle2, CircleDot, PenLine, RotateCcw, Undo2, User } from 'lucide-react';

export interface CustomerSignaturePadHandle {
  isEmpty: () => boolean;
  toDataUrl: () => string | null;
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

interface Props {
  signerName: string;
  onSignerNameChange: (name: string) => void;
  onSignatureChange?: (hasSignature: boolean) => void;
  placeholderName?: string;
}

const INK_COLORS = [
  { id: 'blue', label: 'Xanh mực', hex: '#003b70', bgClass: 'bg-[#003b70]' },
  { id: 'black', label: 'Đen', hex: '#0f172a', bgClass: 'bg-[#0f172a]' },
  { id: 'red', label: 'Đỏ', hex: '#dc2626', bgClass: 'bg-[#dc2626]' },
] as const;

const STROKE_WIDTHS = [
  { id: 'thin', label: 'Mảnh', value: 2 },
  { id: 'medium', label: 'Vừa', value: 3.5 },
  { id: 'thick', label: 'Đậm', value: 5.5 },
] as const;

const CustomerSignaturePad = forwardRef<CustomerSignaturePadHandle, Props>(function CustomerSignaturePad(
  { signerName, onSignerNameChange, onSignatureChange, placeholderName = 'Họ và tên khách hàng' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(INK_COLORS[0].hex);
  const [selectedWidth, setSelectedWidth] = useState<number>(STROKE_WIDTHS[1].value);

  // Redraw all strokes onto the canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const allStrokes = [...strokesRef.current];
    if (currentStrokeRef.current) {
      allStrokes.push(currentStrokeRef.current);
    }

    for (const stroke of allStrokes) {
      const { points, color, width } = stroke;
      if (points.length === 0) continue;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        continue;
      }

      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      const last = points[points.length - 1];
      const secondLast = points[points.length - 2];
      ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Resize canvas according to container dimensions and DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 280);
    const height = 180; // Standard comfortable signature height

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    redraw();
  }, [redraw]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const notifyChange = useCallback(() => {
    const count = strokesRef.current.length;
    setStrokeCount(count);
    onSignatureChange?.(count > 0);
  }, [onSignatureChange]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    notifyChange();
    redraw();
  }, [notifyChange, redraw]);

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    notifyChange();
    redraw();
  }, [notifyChange, redraw]);

  const isEmpty = useCallback(() => strokesRef.current.length === 0, []);

  const toDataUrl = useCallback((): string | null => {
    if (isEmpty()) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return canvas.toDataURL('image/png');
  }, [isEmpty]);

  const toBlob = useCallback(async (): Promise<Blob | null> => {
    if (isEmpty()) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [isEmpty]);

  useImperativeHandle(
    ref,
    () => ({
      isEmpty,
      toDataUrl,
      toBlob,
      clear,
    }),
    [isEmpty, toDataUrl, toBlob, clear],
  );

  // Pointer event handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const point = getCanvasCoords(e);
    currentStrokeRef.current = {
      points: [point],
      color: selectedColor,
      width: selectedWidth,
    };
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current) return;
    e.preventDefault();
    const point = getCanvasCoords(e);
    currentStrokeRef.current.points.push(point);
    redraw();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    strokesRef.current.push(currentStrokeRef.current);
    currentStrokeRef.current = null;
    notifyChange();
    redraw();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentStrokeRef.current) {
      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      currentStrokeRef.current = null;
      redraw();
    }
  };

  const hasSigned = strokeCount > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition duration-200 hover:border-slate-300">
      {/* Header & Tools bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-[#003b70]">
            <PenLine size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Bảng vẽ chữ ký khách hàng
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  hasSigned
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasSigned ? (
                  <>
                    <CheckCircle2 size={11} /> Đã có chữ ký
                  </>
                ) : (
                  <>
                    <CircleDot size={11} /> Chờ khách ký
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Khách hàng dùng ngón tay, bút cảm ứng hoặc chuột để ký tên trực tiếp
            </p>
          </div>
        </div>

        {/* Paint-like Tools: Color, Stroke size, Undo, Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Colors */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {INK_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setSelectedColor(c.hex)}
                className={`relative flex h-6 w-6 items-center justify-center rounded-lg transition-transform ${c.bgClass} ${
                  selectedColor === c.hex
                    ? 'scale-110 ring-2 ring-sky-500 ring-offset-1'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                {selectedColor === c.hex && <Check size={12} className="text-white drop-shadow-xs" />}
              </button>
            ))}
          </div>

          {/* Stroke Widths */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.id}
                type="button"
                title={`Nét ${w.label}`}
                onClick={() => setSelectedWidth(w.value)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                  selectedWidth === w.value
                    ? 'bg-[#003b70] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Undo */}
          <button
            type="button"
            disabled={!hasSigned}
            onClick={undo}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Hoàn tác nét vẽ"
          >
            <Undo2 size={13} />
            <span>Hoàn tác</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            disabled={!hasSigned}
            onClick={clear}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-2.5 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Xóa trắng bảng vẽ"
          >
            <RotateCcw size={13} />
            <span>Ký lại</span>
          </button>
        </div>
      </div>

      {/* Canvas Drawing Area */}
      <div
        ref={containerRef}
        className="relative mt-3 w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white shadow-inner"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="block w-full cursor-crosshair select-none"
          style={{ touchAction: 'none' }}
        />

        {/* Decorative baseline guide */}
        <div className="pointer-events-none absolute bottom-5 left-8 right-8 flex items-center gap-2 opacity-35">
          <span className="text-xs font-bold text-slate-400">✕</span>
          <div className="h-[1px] flex-1 border-b border-dashed border-slate-400" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Dòng ký tên
          </span>
        </div>

        {/* Watermark placeholder if no strokes */}
        {!hasSigned && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-slate-300 select-none">
            <PenLine size={32} className="opacity-40 mb-1 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400">
              Chạm hoặc rê chuột vào đây để ký tên
            </span>
          </div>
        )}
      </div>

      {/* Signer Name Input */}
      <div className="mt-3 flex items-center gap-2">
        <label
          htmlFor="signer-name-input"
          className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600"
        >
          <User size={13} />
          <span>Họ tên người ký:</span>
        </label>
        <input
          id="signer-name-input"
          type="text"
          value={signerName}
          onChange={(e) => onSignerNameChange(e.target.value)}
          placeholder={placeholderName}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
        />
      </div>
    </div>
  );
});

export default CustomerSignaturePad;
