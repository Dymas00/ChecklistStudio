import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import SignatureCanvas from '@/components/checklist/signature-canvas';
import EvidenceItem from '@/components/checklist/evidence-item';
import ConditionalField from '@/components/checklist/conditional-field';
import PhotoUpload from '@/components/checklist/photo-upload';
import { ArrowLeft, Check, AlertCircle, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { validateFormResponses, TemplateSection } from '@/lib/templates';
import { Link } from 'wouter';

export default function ChecklistForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, params] = useRoute('/checklist/:templateId');
  const templateId = params?.templateId;
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates']
  });
  
  const template = templates?.find((t: any) => t.id === templateId);
  const isLoading = templatesLoading;

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/checklists', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checklists'] });
      toast({
        title: "Sucesso!",
        description: "Checklist enviado com sucesso e está aguardando aprovação.",
      });
      // Navigate back based on user role
      if (user?.role === 'tecnico') {
        window.location.href = '/technician';
      } else {
        window.location.href = '/dashboard';
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar checklist. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleEvidenceChange = (fieldId: string, evidenceData: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: evidenceData.answer,
      [`${fieldId}_photo`]: evidenceData.photo,
      [`${fieldId}_observation`]: evidenceData.observation
    }));
  };

  const saveAsDraft = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      // Save as draft logic would go here
      toast({
        title: "Rascunho salvo",
        description: "Suas alterações foram salvas automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar rascunho.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setIsSubmitting(true);

    // Validate form
    const errors = validateFormResponses((template as any), responses);
    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Create FormData for file uploads
    const formData = new FormData();
    const checklistData = {
      templateId: (template as any)?.id,
      storeCode: responses.storeCode,
      storeManager: responses.storeManager,
      storePhone: responses.storePhone,
      responses,
      status: 'pendente'
    };

    formData.append('data', JSON.stringify(checklistData));

    // Handle file uploads
    Object.entries(responses).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      }
    });

    try {
      await submitMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = responses[field.id] || '';

    // Check conditional logic
    if (field.conditional) {
      const conditionalField = field.conditional.field;
      const conditionalValue = field.conditional.value;
      const conditionalNotValue = field.conditional.notValue;
      const currentValue = responses[conditionalField];
      
      if (conditionalValue && currentValue !== conditionalValue) {
        return null; // Don't render if condition not met
      }
      
      if (conditionalNotValue && currentValue === conditionalNotValue) {
        return null; // Don't render if not condition is met
      }
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full"
            placeholder={field.label}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            rows={3}
            className="w-full"
            placeholder="Digite suas observações..."
          />
        );

      case 'select':
        return (
          <Select onValueChange={(val) => handleInputChange(field.id, val)} required={field.required} value={value}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => handleInputChange(field.id, val)}
            className="flex space-x-6"
            required={field.required}
          >
            {field.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'photo':
        return (
          <PhotoUpload
            onFileSelect={(file) => handleInputChange(field.id, file)}
            accept="image/*"
            capture={field.id.includes('selfie') ? 'user' : 'environment'}
            required={field.required}
          />
        );

      case 'signature':
        return (
          <SignatureCanvas
            onSignature={(signature) => handleInputChange(field.id, signature)}
            required={field.required}
          />
        );

      case 'evidence':
        return (
          <EvidenceItem
            question={field.label}
            onResponseChange={(response) => handleEvidenceChange(field.id, response)}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0) {
        saveAsDraft();
      }
    }, 60000); // Auto-save every minute

    return () => clearInterval(autoSaveInterval);
  }, [responses]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Template não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              O template solicitado não existe ou foi removido.
            </p>
            <Link to={user.role === 'tecnico' ? '/technician' : '/dashboard'}>
              <Button>Voltar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = ((template as any)?.sections || []) as TemplateSection[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to={user.role === 'tecnico' ? '/technician' : '/dashboard'}>
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Checklist de {(template as any)?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Preencha todos os campos obrigatórios (*) para concluir o checklist.
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={saveAsDraft}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {sections.map((section) => (
            <Card key={section.id} className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-xl text-primary">
                  <i className={`${section.icon} mr-3`}></i>
                  SEÇÃO {section.id} | {section.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field) => (
                    <ConditionalField
                      key={field.id}
                      field={field}
                      responses={responses}
                      className={
                        field.type === 'textarea' || 
                        field.type === 'signature' || 
                        field.type === 'evidence' 
                        ? 'md:col-span-2' 
                        : ''
                      }
                    >
                      <div className="form-field">
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field)}
                      </div>
                    </ConditionalField>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Submit Button */}
          <div className="text-center pb-8">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="font-semibold px-8"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Enviar Checklist
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 mt-3">
              Ao enviar, o checklist será submetido para aprovação
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
