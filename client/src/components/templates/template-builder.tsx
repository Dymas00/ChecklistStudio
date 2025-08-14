import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ArrowUp,
  Power,
  Settings,
  RefreshCw,
  FileText,
  Camera,
  Type,
  CheckCircle,
  List,
  Phone,
  Mail,
  User,
  Hash
} from 'lucide-react';

export interface TemplateField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  conditional?: {
    field: string;
    value?: string;
    notValue?: string;
  };
}

export interface TemplateSection {
  id: number;
  title: string;
  icon: string;
  fields: TemplateField[];
}

export interface TemplateData {
  name: string;
  type: string;
  description: string;
  icon: string;
  sections: TemplateSection[];
}

interface TemplateBuilderProps {
  initialData?: TemplateData;
  onSave: (data: TemplateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const fieldTypes = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'textarea', label: 'Texto Longo', icon: FileText },
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'tel', label: 'Telefone', icon: Phone },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'photo', label: 'Foto', icon: Camera },
  { value: 'signature', label: 'Assinatura', icon: User },
  { value: 'evidence', label: 'Evidência', icon: CheckCircle },
  { value: 'radio', label: 'Seleção Única', icon: CheckCircle },
  { value: 'select', label: 'Lista Suspensa', icon: List }
];

const templateTypes = [
  { value: 'upgrade', label: 'Upgrade', icon: ArrowUp },
  { value: 'ativacao', label: 'Ativação', icon: Power },
  { value: 'manutencao', label: 'Manutenção', icon: Settings },
  { value: 'migracao', label: 'Migração', icon: RefreshCw },
  { value: 'custom', label: 'Personalizado', icon: FileText }
];

export default function TemplateBuilder({ initialData, onSave, onCancel, isLoading }: TemplateBuilderProps) {
  const [templateData, setTemplateData] = useState<TemplateData>(
    initialData || {
      name: '',
      type: '',
      description: '',
      icon: 'fas fa-clipboard-check',
      sections: []
    }
  );

  const addSection = () => {
    const newSection: TemplateSection = {
      id: Date.now(),
      title: 'Nova Seção',
      icon: 'fas fa-folder',
      fields: []
    };
    
    setTemplateData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: number, updates: Partial<TemplateSection>) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: number) => {
    setTemplateData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addField = (sectionId: number) => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      label: 'Novo Campo',
      type: 'text',
      required: false
    };

    updateSection(sectionId, {
      fields: [...(templateData.sections.find(s => s.id === sectionId)?.fields || []), newField]
    });
  };

  const updateField = (sectionId: number, fieldId: string, updates: Partial<TemplateField>) => {
    const section = templateData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedFields = section.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    updateSection(sectionId, { fields: updatedFields });
  };

  const removeField = (sectionId: number, fieldId: string) => {
    const section = templateData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedFields = section.fields.filter(field => field.id !== fieldId);
    updateSection(sectionId, { fields: updatedFields });
  };

  const handleSave = () => {
    if (!templateData.name.trim()) {
      alert('Nome do template é obrigatório');
      return;
    }
    if (!templateData.type) {
      alert('Tipo do template é obrigatório');
      return;
    }
    if (templateData.sections.length === 0) {
      alert('Adicione pelo menos uma seção ao template');
      return;
    }

    onSave(templateData);
  };

  const getFieldTypeIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  return (
    <div className="space-y-6">
      {/* Template Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Checklist de Instalação"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="template-type">Tipo</Label>
              <Select 
                value={templateData.type} 
                onValueChange={(value) => setTemplateData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-description">Descrição</Label>
            <Textarea
              id="template-description"
              value={templateData.description}
              onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva brevemente o propósito deste template"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Seções do Template</CardTitle>
            <Button onClick={addSection} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Seção
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templateData.sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma seção adicionada ainda.</p>
              <p className="text-sm">Clique em "Adicionar Seção" para começar.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {templateData.sections.map((section, sectionIndex) => (
                <Card key={section.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            className="font-medium"
                          />
                        </div>
                        <Badge variant="secondary">
                          {section.fields.length} campos
                        </Badge>
                      </div>
                      <Button
                        onClick={() => removeSection(section.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Fields */}
                    <div className="space-y-3">
                      {section.fields.map((field, fieldIndex) => (
                        <Card key={field.id} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              <div className="md:col-span-4">
                                <Label className="text-xs text-gray-600">Nome do Campo</Label>
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                  size="sm"
                                />
                              </div>
                              
                              <div className="md:col-span-3">
                                <Label className="text-xs text-gray-600">Tipo</Label>
                                <Select 
                                  value={field.type}
                                  onValueChange={(value) => updateField(section.id, field.id, { type: value })}
                                >
                                  <SelectTrigger size="sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fieldTypes.map(type => {
                                      const IconComponent = type.icon;
                                      return (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center">
                                            <IconComponent className="w-3 h-3 mr-2" />
                                            {type.label}
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="md:col-span-2 flex items-center space-x-2 pt-5">
                                <input
                                  type="checkbox"
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                                  className="rounded"
                                />
                                <Label htmlFor={`required-${field.id}`} className="text-xs">Obrigatório</Label>
                              </div>
                              
                              <div className="md:col-span-2">
                                <Label className="text-xs text-gray-600">Opções</Label>
                                {(field.type === 'radio' || field.type === 'select') && (
                                  <Textarea
                                    value={field.options?.join('\n') || ''}
                                    onChange={(e) => updateField(section.id, field.id, { 
                                      options: e.target.value.split('\n').filter(o => o.trim()) 
                                    })}
                                    placeholder="Uma opção por linha"
                                    className="text-xs"
                                    rows={3}
                                  />
                                )}
                              </div>
                              
                              <div className="md:col-span-1 flex justify-end pt-5">
                                <Button
                                  onClick={() => removeField(section.id, field.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Button
                        onClick={() => addField(section.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Campo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Template'}
        </Button>
      </div>
    </div>
  );
}