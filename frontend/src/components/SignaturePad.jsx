import { useEffect, useRef, useState } from 'react';

export default function SignaturePad({ onCapture, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const points = useRef([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Match the canvas's actual pixel buffer to its real rendered size,
  // so drawing coordinates line up 1:1 with what the mouse/finger reports.
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    points.current = [getPos(e)];
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    const last = points.current[points.current.length - 1];
    ctx.strokeStyle = '#0b1a3a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    points.current.push(pos);
    setHasDrawn(true);
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    points.current = [];
    setHasDrawn(false);
  };

  const confirm = () => {
    const path = points.current.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    onCapture(path);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="signature-pad"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
        <button className="btn btn-outline" onClick={clear} type="button">Clear</button>
        {onCancel && <button className="btn btn-outline" onClick={onCancel} type="button">Cancel</button>}
        <button className="btn btn-primary" onClick={confirm} disabled={!hasDrawn} type="button">
          Confirm signature
        </button>
      </div>
    </div>
  );
}