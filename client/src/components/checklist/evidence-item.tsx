import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import SimplePhotoUpload from './simple-photo-upload';
import { Camera, FileText } from 'lucide-react';

interface EvidenceItemProps {
  question: string;
  onResponseChange: (response: { answer: string; photo?: File; observation?: string }) => void;
  required?: boolean;
  className?: string;
}

export default function EvidenceItem({ 
  question, 
  onResponseChange, 
  required, 
  className 
}: EvidenceItemProps) {
  const [answer, setAnswer] = useState<string>('');
  const [photo, setPhoto] = useState<File | undefined>();
  const [observation, setObservation] = useState<string>('');

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    
    // Reset photo and observation when answer changes
    if (value === 'sim') {
      setObservation('');
    } else {
      setPhoto(undefined);
    }
  };

  const handlePhotoChange = (file: File | undefined) => {
    setPhoto(file);
  };

  const handleObservationChange = (value: string) => {
    setObservation(value);
  };

  // Update parent component whenever any value changes
  useEffect(() => {
    onResponseChange({
      answer,
      photo: answer === 'sim' ? photo : undefined,
      observation: answer === 'nao' ? observation : undefined,
    });
  }, [answer, photo, observation, onResponseChange]);

  return (
    <Card className={`evidence-item p-4 border border-gray-200 hover:shadow-sm transition-shadow ${className}`}>
      <Label className="block text-sm font-medium text-gray-700 mb-3">
        {question}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <RadioGroup
        value={answer}
        onValueChange={handleAnswerChange}
        className="flex space-x-6 mb-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sim" id={`${question}-sim`} />
          <Label htmlFor={`${question}-sim`} className="text-gray-700 cursor-pointer font-medium">
            SIM
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="nao" id={`${question}-nao`} />
          <Label htmlFor={`${question}-nao`} className="text-gray-700 cursor-pointer font-medium">
            NÃO
          </Label>
        </div>
      </RadioGroup>

      {/* Show photo upload for SIM answers */}
      {answer === 'sim' && (
        <div className="evidence-photo border-t border-gray-100 pt-4">
          <div className="flex items-center mb-2">
            <Camera className="w-4 h-4 text-gray-500 mr-2" />
            <Label className="text-sm font-medium text-gray-700">
              Anexar Foto Comprobatória {required && <span className="text-red-500">*</span>}
            </Label>
          </div>
          <SimplePhotoUpload
            onFileSelect={handlePhotoChange}
            fieldId={`${question}-photo`}
            label="Anexar Foto"
          />
        </div>
      )}

      {/* Show observation textarea for NÃO answers */}
      {answer === 'nao' && (
        <div className="evidence-obs border-t border-gray-100 pt-4">
          <div className="flex items-center mb-2">
            <FileText className="w-4 h-4 text-gray-500 mr-2" />
            <Label className="text-sm font-medium text-gray-700">
              Observações Detalhadas {required && <span className="text-red-500">*</span>}
            </Label>
          </div>
          <Textarea
            value={observation}
            onChange={(e) => handleObservationChange(e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Descreva detalhadamente o problema encontrado, suas possíveis causas e ações recomendadas..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Seja específico sobre o problema para facilitar a análise posterior
          </p>
        </div>
      )}

      {required && !answer && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          Esta pergunta é obrigatória
        </div>
      )}
      
      {answer && answer === 'sim' && required && !photo && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-600">
          Foto comprobatória é obrigatória para respostas afirmativas
        </div>
      )}
      
      {answer && answer === 'nao' && required && !observation.trim() && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-600">
          Observações detalhadas são obrigatórias para respostas negativas
        </div>
      )}
    </Card>
  );
}
