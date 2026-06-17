import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Edit } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export default function SignaturePad({
  label,
  value,
  onChange,
  onClear,
  disabled
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showCanvas, setShowCanvas] = useState(!value);

  // Toggle canvas view if value changes externally
  useEffect(() => {
    if (!value) {
      setShowCanvas(true);
      setHasDrawn(false);
    } else {
      setShowCanvas(false);
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || !showCanvas) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    if (!coords) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Deep blue for pen color

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || !showCanvas) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save to parent state as base64 dataUrl
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    onChange('');
    if (onClear) onClear();
  };

  const handleEditClick = () => {
    setShowCanvas(true);
    setHasDrawn(false);
    onChange('');
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factor in case the canvas CSS width/height is different from coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  return (
    <div className="flex flex-col space-y-2 border border-slate-205 dark:border-slate-800 p-3 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
      <div className="flex justify-between items-center">
        <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {value ? (
            <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Firma Capturada
            </span>
          ) : (
            <span className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
              Firma Pendiente
            </span>
          )}
        </div>
      </div>

      <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 overflow-hidden h-40 flex items-center justify-center">
        {showCanvas ? (
          <canvas
            ref={canvasRef}
            width={400}
            height={160}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />
        ) : (
          <img
            src={value}
            alt={`Firma de ${label}`}
            className="max-h-full max-w-full object-contain p-2"
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        {showCanvas ? (
          <button
            type="button"
            onClick={clearCanvas}
            disabled={disabled}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-3xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEditClick}
            disabled={disabled}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-3xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Edit className="w-3.5 h-3.5" />
            Volver a Firmar
          </button>
        )}
      </div>
    </div>
  );
}
