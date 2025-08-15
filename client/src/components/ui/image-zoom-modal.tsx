import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageZoomModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageZoomModal({ src, alt, isOpen, onClose }: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'imagem';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetZoom();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-black">
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="text-white hover:bg-white/20"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <span className="text-white text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="text-white hover:bg-white/20"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-black pt-16 pb-4">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            draggable={false}
            onDoubleClick={() => {
              if (zoom === 1) {
                setZoom(2);
              } else {
                setZoom(1);
              }
            }}
          />
        </div>

        {/* Footer with image info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-3">
          <p className="text-white text-sm text-center truncate">
            {alt}
          </p>
          <p className="text-white/70 text-xs text-center mt-1">
            Clique duas vezes para ampliar • Use os controles para navegar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}