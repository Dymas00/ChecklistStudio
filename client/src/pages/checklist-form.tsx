import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
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
import SimplePhotoUpload from '@/components/checklist/simple-photo-upload';
import { ArrowLeft, Check, AlertCircle, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { validateFormResponses, TemplateSection } from '@/lib/templates';
import { Link } from 'wouter';
import Footer from '@/components/layout/footer';
import { useFormPersistence } from '@/hooks/useFormPersistence';

export default function ChecklistForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, params] = useRoute('/checklist/:templateId');
  const templateId = params?.templateId;
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get edit ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const isEditing = !!editId;

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch existing checklist data when editing
  const { data: existingChecklist, isLoading: checklistLoading } = useQuery({
    queryKey: ['/api/checklists', editId],
    enabled: !!editId,
    staleTime: Infinity,
  });
  
  const template = (templates as any[])?.find((t: any) => t.id === templateId);
  const isLoading = templatesLoading || (isEditing && checklistLoading);

  // Load existing checklist data when editing
  useEffect(() => {
    if (isEditing && existingChecklist && Object.keys(responses).length === 0) {
      setResponses((existingChecklist as any).responses || {});
    }
  }, [isEditing, existingChecklist]);

  const submitMutation = useMutation({
    mutationFn: async (data: FormData | any) => {
      if (isEditing) {
        // Update existing checklist
        return apiRequest('PUT', `/api/checklists/${editId}`, data);
      } else {
        // Create new checklist
        return apiRequest('POST', '/api/checklists', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checklists'] });
      toast({
        title: "Sucesso!",
        description: isEditing 
          ? "Checklist corrigido e reenviado para aprovação com sucesso!" 
          : "Checklist enviado com sucesso e está aguardando aprovação.",
      });
      // Navigate back based on user role
      if (user?.role === 'tecnico') {
        window.location.href = '/checklists';
      } else {
        window.location.href = '/dashboard';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message?.includes('conexão') 
          ? "Erro de conexão. Verifique sua internet e tente novamente."
          : "Erro ao enviar checklist. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Use form persistence hook
  const { clearDraft } = useFormPersistence(templateId, responses, setResponses, isEditing);

  const handleInputChange = (fieldId: string, value: any) => {
    // Prevent updates during initial load
    if (!templateId) return;
    
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
    
    // Separate files from other responses
    const responsesCopy = { ...responses };
    const hasFiles = Object.values(responses).some(value => value instanceof File);
    
    const checklistData = {
      templateId: (template as any)?.id,
      storeCode: responses.storeCode,
      storeManager: responses.storeManager,
      storePhone: responses.storePhone,
      responses: responsesCopy,
      status: 'pendente'
    };

    let submitData;
    
    if (hasFiles) {
      // Use FormData for file uploads
      
      // Handle file uploads - append files with their field names
      Object.entries(responses).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
          // Remove file from responses to avoid serialization issues
          delete responsesCopy[key];
        }
      });
      
      // Append cleaned data
      formData.append('data', JSON.stringify({
        ...checklistData,
        responses: responsesCopy
      }));
      
      submitData = formData;
    } else {
      // No files, send as JSON
      submitData = checklistData;
    }

    try {
      await submitMutation.mutateAsync(submitData);
      // Clear localStorage draft on successful submission
      clearDraft();
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
          <SimplePhotoUpload
            onFileSelect={(file) => handleInputChange(field.id, file)}
            fieldId={field.id}
            required={field.required}
            label={field.label}
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
    if (Object.keys(responses).length === 0) return;
    
    const autoSaveInterval = setInterval(() => {
      saveAsDraft();
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link to={user.role === 'tecnico' ? '/technician' : '/dashboard'}>
                <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {isEditing ? 'Editar Checklist de' : 'Checklist de'} {(template as any)?.name}
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {isEditing 
                    ? 'Faça as correções necessárias e reenvie para aprovação.' 
                    : 'Preencha todos os campos obrigatórios (*) para concluir o checklist.'
                  }
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveAsDraft}
              disabled={isSaving}
              className="flex items-center w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {sections.map((section) => (
              <Card key={section.id} className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl text-primary">
                    <i className={`${section.icon} mr-3`}></i>
                    {section.title}
                  </CardTitle>
                </CardHeader>
              
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                className="font-semibold px-6 sm:px-8 w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {isEditing ? 'Reenviar para Aprovação' : 'Enviar Checklist'}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 mt-3">
                {isEditing 
                  ? 'Ao reenviar, o checklist voltará ao status pendente para nova aprovação'
                  : 'Ao enviar, o checklist será submetido para aprovação'
                }
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
