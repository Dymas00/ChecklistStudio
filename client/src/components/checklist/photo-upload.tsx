import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, Image } from 'lucide-react';

interface PhotoUploadProps {
  onFileSelect: (file: File | undefined) => void;
  accept?: string;
  capture?: 'user' | 'environment';
  required?: boolean;
  className?: string;
}

export default function PhotoUpload({ 
  onFileSelect, 
  accept = "image/*", 
  capture,
  required, 
  className 
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(undefined);
    setPreviewUrl('');
    onFileSelect(undefined);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Cleanup preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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
          <div 
            className="p-6 text-center cursor-pointer" 
            onClick={triggerFileSelect}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
              {capture === 'user' ? (
                <Camera className="w-6 h-6 text-primary" />
              ) : (
                <Upload className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <p className="text-sm font-medium text-gray-700 mb-1">
              {capture === 'user' ? 'Tire uma selfie' : 'Adicionar foto'}
            </p>
            <p className="text-xs text-gray-500">
              Clique para abrir a câmera ou selecionar uma foto
              {required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <Image className="w-4 h-4 text-gray-400 mr-2" />
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
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500">
              Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileSelect}
              className="mt-3 w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Alterar Foto
            </Button>
          </div>
        </Card>
      )}
      
      {required && !selectedFile && (
        <p className="text-xs text-red-500 mt-1">
          Foto é obrigatória
        </p>
      )}
    </div>
  );
}
