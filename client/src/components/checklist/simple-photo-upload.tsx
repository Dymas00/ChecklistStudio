import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface SimplePhotoUploadProps {
  onFileSelect: (file: File | undefined) => void;
  fieldId: string;
  required?: boolean;
  className?: string;
  label?: string;
  initialValue?: File | string; // Can be a File or URL string for existing photos
}

export default function SimplePhotoUpload({ 
  onFileSelect, 
  fieldId,
  required = false, 
  className = '',
  label = 'Adicionar Foto',
  initialValue
}: SimplePhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [hasExistingPhoto, setHasExistingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to handle initial value (existing photo)
  useEffect(() => {
    if (initialValue) {
      if (initialValue instanceof File) {
        setSelectedFile(initialValue);
        const url = URL.createObjectURL(initialValue);
        setPreviewUrl(url);
        setHasExistingPhoto(false);
      } else if (typeof initialValue === 'string') {
        // For existing photos stored as file paths/URLs
        setPreviewUrl(`/uploads/${initialValue}`);
        setHasExistingPhoto(true);
        setSelectedFile(undefined);
      }
    }
  }, [initialValue]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setSelectedFile(file);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Call parent callback
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(undefined);
    setPreviewUrl('');
    setHasExistingPhoto(false);
    onFileSelect(undefined);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (previewUrl && !hasExistingPhoto) {
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
        onChange={handleFileSelect}
        className="hidden"
        required={required}
      />
      
      {!selectedFile && !hasExistingPhoto ? (
        <Card className="border-2 border-dashed border-gray-300 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center cursor-pointer" onClick={triggerFileSelect}>
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 mb-2">{label}</h4>
            
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              type="button"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar da Galeria
            </Button>
            
            {required && (
              <p className="text-xs text-red-500 mt-2">
                * Campo obrigatório
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
                  {selectedFile ? selectedFile.name : hasExistingPhoto ? 'Foto existente' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="w-6 h-6 p-0 text-gray-400 hover:text-red-600"
                type="button"
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
            
            {selectedFile && (
              <div className="mt-3 text-xs text-gray-500">
                Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={triggerFileSelect}
                className="w-full"
                type="button"
              >
                <Upload className="w-4 h-4 mr-2" />
                {hasExistingPhoto && !selectedFile ? 'Alterar Foto' : 'Alterar Foto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}