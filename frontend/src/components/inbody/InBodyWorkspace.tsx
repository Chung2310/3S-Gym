import { useState } from 'react';
import InBodyScanModal from './InBodyScanModal';

export default function InBodyWorkspace() {
  const [open, setOpen] = useState(false);
  return <section><div className="section-header"><div><h1>InBody và OCR</h1><p>Quét, kiểm tra và xác nhận chỉ số trước khi sử dụng.</p></div><button className="button button-primary" onClick={() => setOpen(true)}>Quét InBody</button></div><InBodyScanModal open={open} onClose={() => setOpen(false)} onConfirmed={() => setOpen(false)} /></section>;
}
