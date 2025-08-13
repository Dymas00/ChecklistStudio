import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  onSignature: (signature: string) => void;
  required?: boolean;
  className?: string;
}

export default function SignatureCanvas({ onSignature, required, className }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setContext(ctx);
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 192; // h-48 equivalent
        
        // Set drawing properties
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX, clientY;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling while drawing
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Convert canvas to base64 and call onSignature
    if (canvasRef.current && hasSignature) {
      const signatureData = canvasRef.current.toDataURL();
      onSignature(signatureData);
    }
  };

  const clearSignature = () => {
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
    onSignature('');
  };

  return (
    <Card className={`signature-canvas border-2 border-dashed border-gray-300 p-4 bg-gray-50 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-48 cursor-crosshair bg-white rounded-lg border"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
      
      <div className="mt-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          className="text-primary hover:text-primary/80"
          disabled={!hasSignature}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Limpar Assinatura
        </Button>
        
        <div className="flex items-center text-xs text-gray-500">
          <PenTool className="w-3 h-3 mr-1" />
          Assine com o dedo ou mouse
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </div>
      
      {required && !hasSignature && (
        <p className="text-xs text-red-500 mt-1">
          Assinatura é obrigatória
        </p>
      )}
    </Card>
  );
}
