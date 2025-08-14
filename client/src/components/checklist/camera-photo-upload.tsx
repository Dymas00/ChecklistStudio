import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, Eye, RotateCcw, Check, ImageIcon, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraPhotoUploadProps {
  onFileSelect: (file: File | undefined) => void;
  fieldId: string;
  required?: boolean;
  className?: string;
  label?: string;
}

// Detectar se é dispositivo móvel
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

// Detectar se tem câmera disponível
const hasCameraSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export default function CameraPhotoUpload({ 
  onFileSelect, 
  fieldId,
  required = false, 
  className = '',
  label = 'Adicionar Foto'
}: CameraPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const isMobile = isMobileDevice();
  const hasCamera = hasCameraSupport();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(undefined);
    setPreviewUrl('');
    onFileSelect(undefined);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setShowCameraDialog(true);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast({
        title: 'Erro na Câmera',
        description: 'Não foi possível acessar a câmera. Verifique as permissões.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraDialog(false);
    setCapturedPhoto('');
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Espelhar imagem se estiver usando câmera frontal
        if (facingMode === 'user') {
          context.scale(-1, 1);
          context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        setIsCapturing(true);
      }
    }
  }, [facingMode]);

  const confirmPhoto = useCallback(() => {
    if (capturedPhoto) {
      // Converter data URL para File usando método mais estável
      try {
        const byteString = atob(capturedPhoto.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const timestamp = new Date().getTime();
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const file = new File([blob], `photo_${fieldId}_${timestamp}.jpg`, { type: 'image/jpeg' });
        
        setSelectedFile(file);
        
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        
        stopCamera();
        setIsCapturing(false);
        
        // Delay the callback to prevent state conflicts
        setTimeout(() => {
          onFileSelect(file);
        }, 100);
        
        toast({
          title: 'Sucesso',
          description: 'Foto capturada com sucesso!',
        });
      } catch (error) {
        console.error('Erro ao processar foto:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao processar a foto capturada.',
          variant: 'destructive',
        });
      }
    }
  }, [capturedPhoto, fieldId, onFileSelect, stopCamera, toast]);

  const retakePhoto = () => {
    setCapturedPhoto('');
    setIsCapturing(false);
  };

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  // Cleanup camera stream when dialog closes
  useEffect(() => {
    if (!showCameraDialog && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [showCameraDialog, cameraStream]);

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        required={required}
      />
      
      {!selectedFile ? (
        <Card className="border-2 border-dashed border-gray-300 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 mb-2">{label}</h4>
            
            <div className="space-y-3">
              {/* Botão de Câmera (prioritário em mobile) */}
              {hasCamera && (
                <Button
                  onClick={startCamera}
                  className="w-full"
                  size="sm"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isMobile ? 'Tirar Foto' : 'Usar Câmera'}
                  {isMobile && <Smartphone className="w-4 h-4 ml-2" />}
                </Button>
              )}
              
              {/* Botão de Upload de Arquivo */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isMobile ? 'Câmera/Galeria' : 'Escolher da Galeria'}
              </Button>
            </div>
            
            {required && (
              <p className="text-xs text-red-500 mt-2">
                * Foto obrigatória
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <ImageIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedFile.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="w-6 h-6 p-0 text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {previewUrl && (
              <div className="mt-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500">
              Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
            
            <div className="mt-3 flex gap-2">
              {hasCamera && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Nova Foto
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog da Câmera */}
      <Dialog open={showCameraDialog} onOpenChange={stopCamera}>
        <DialogContent className="max-w-full max-h-full m-0 sm:max-w-lg sm:max-h-[90vh] sm:m-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Capturar Foto</span>
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  className="ml-2"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            {!isCapturing ? (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 sm:h-80 object-cover"
                  style={{ 
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' 
                  }}
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 border-4 border-gray-300"
                  >
                    <div className="w-12 h-12 bg-primary rounded-full"></div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={capturedPhoto}
                  alt="Foto capturada"
                  className="w-full h-64 sm:h-80 object-cover rounded-lg"
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    size="lg"
                    className="bg-white/90 hover:bg-white"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Refazer
                  </Button>
                  
                  <Button
                    onClick={confirmPhoto}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          {!isMobile && (
            <div className="text-xs text-gray-500 text-center">
              Dica: Use um dispositivo móvel para melhor experiência com câmera
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}