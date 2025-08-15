import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Hash,
  Move,
  Edit,
  Copy
} from 'lucide-react';
import { TemplateData, TemplateSection, TemplateField } from './template-builder';
import FieldPalette, { getFieldTypeConfig } from './field-palette';

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

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
  { value: 'migracao', label: 'Migração', icon: RefreshCw }
];

interface DragDropTemplateBuilderProps {
  initialData?: TemplateData;
  onSave: (data: TemplateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface SortableFieldProps {
  field: TemplateField;
  sectionId: number;
  onUpdate: (field: TemplateField) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function SortableField({ field, sectionId, onUpdate, onRemove, onDuplicate }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldType = fieldTypes.find(t => t.value === field.type);
  const FieldIcon = fieldType?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 ${isDragging ? 'opacity-50 shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <FieldIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">{fieldType?.label}</span>
          {field.required && (
            <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
          )}
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onDuplicate}
            title="Duplicar campo"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
            onClick={onRemove}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-gray-500">Rótulo</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            className="mt-1"
            placeholder="Nome do campo..."
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-500">Campo obrigatório</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(required) => onUpdate({ ...field, required })}
          />
        </div>

        {(field.type === 'radio' || field.type === 'select') && (
          <div>
            <Label className="text-xs text-gray-500">Opções (uma por linha)</Label>
            <Textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => onUpdate({
                ...field,
                options: e.target.value.split('\n').filter(opt => opt.trim())
              })}
              className="mt-1"
              rows={3}
              placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableSectionProps {
  section: TemplateSection;
  onUpdate: (section: TemplateSection) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isActive?: boolean;
  onSetActive?: () => void;
}

function SortableSection({ section, onUpdate, onRemove, onDuplicate, isActive, onSetActive }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addField = () => {
    const newField: TemplateField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: 'Novo Campo',
      type: 'text',
      required: false
    };
    onUpdate({
      ...section,
      fields: [...section.fields, newField]
    });
  };

  const updateField = (fieldId: string, updatedField: TemplateField) => {
    onUpdate({
      ...section,
      fields: section.fields.map(f => f.id === fieldId ? updatedField : f)
    });
  };

  const removeField = (fieldId: string) => {
    onUpdate({
      ...section,
      fields: section.fields.filter(f => f.id !== fieldId)
    });
  };

  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = section.fields.find(f => f.id === fieldId);
    if (fieldToDuplicate) {
      const duplicatedField: TemplateField = {
        ...fieldToDuplicate,
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: `${fieldToDuplicate.label} (Cópia)`
      };
      onUpdate({
        ...section,
        fields: [...section.fields, duplicatedField]
      });
    }
  };

  const handleFieldsReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = section.fields.findIndex(field => field.id === active.id);
      const newIndex = section.fields.findIndex(field => field.id === over.id);
      
      onUpdate({
        ...section,
        fields: arrayMove(section.fields, oldIndex, newIndex)
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <Card 
        className={`border-2 border-dashed transition-all cursor-pointer ${
          isActive 
            ? 'border-blue-500 bg-blue-100/50 shadow-md' 
            : 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
        }`}
        onClick={onSetActive}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 hover:bg-blue-100 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Move className="w-5 h-5 text-blue-600" />
              </div>
              {isActive && (
                <Badge className="bg-blue-500 text-white">
                  Seção Ativa
                </Badge>
              )}
              <div className="flex-1">
                <Input
                  value={section.title}
                  onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                  className="font-semibold text-lg border-none bg-transparent p-0 focus:ring-0 focus:border-none"
                  placeholder="Nome da seção..."
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicate}
                title="Duplicar seção"
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700 hover:border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
              })
            )}
            collisionDetection={closestCenter}
            onDragEnd={handleFieldsReorder}
          >
            <SortableContext 
              items={section.fields.map(field => field.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 mb-4">
                {section.fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    onUpdate={(updatedField) => updateField(field.id, updatedField)}
                    onRemove={() => removeField(field.id)}
                    onDuplicate={() => duplicateField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            size="sm"
            onClick={addField}
            className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Campo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DragDropTemplateBuilder({
  initialData,
  onSave,
  onCancel,
  isLoading = false
}: DragDropTemplateBuilderProps) {
  const [template, setTemplate] = useState<TemplateData>(initialData || {
    name: '',
    type: 'upgrade',
    description: '',
    icon: 'ArrowUp',
    sections: []
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Sync state with initialData when it changes
  useEffect(() => {
    if (initialData) {
      setTemplate(initialData);
      // Auto-select first section if available
      if (initialData.sections && initialData.sections.length > 0 && !activeSection) {
        setActiveSection(initialData.sections[0].id);
      }
    }
  }, [initialData]);

  // Auto-select first section when sections are added but none is active
  useEffect(() => {
    if (template.sections.length > 0 && !activeSection) {
      setActiveSection(template.sections[0].id);
    }
  }, [template.sections.length, activeSection]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSection = () => {
    const sectionNumber = template.sections.length + 1;
    const newSection: TemplateSection = {
      id: Date.now(),
      title: `SEÇÃO ${sectionNumber}`,
      icon: 'Settings',
      fields: []
    };
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setActiveSection(newSection.id);
  };

  const addFieldToSection = (sectionId: number, fieldType: string) => {
    const fieldConfig = getFieldTypeConfig(fieldType);
    const newField: TemplateField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: fieldConfig?.label || 'Novo Campo',
      type: fieldType,
      required: false
    };
    
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, fields: [...s.fields, newField] }
          : s
      )
    }));
  };

  const addFieldFromPalette = (fieldType: string) => {
    if (activeSection && template.sections.find(s => s.id === activeSection)) {
      addFieldToSection(activeSection, fieldType);
    } else if (template.sections.length > 0) {
      // Auto-select first section and add field there
      const firstSection = template.sections[0];
      setActiveSection(firstSection.id);
      addFieldToSection(firstSection.id, fieldType);
    }
  };

  const updateSection = (sectionId: number, updatedSection: TemplateSection) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? updatedSection : s)
    }));
  };

  const removeSection = (sectionId: number) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
    
    // If we're removing the active section, clear activeSection
    if (activeSection === sectionId) {
      const remainingSections = template.sections.filter(s => s.id !== sectionId);
      setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null);
    }
  };

  const duplicateSection = (sectionId: number) => {
    const sectionToDuplicate = template.sections.find(s => s.id === sectionId);
    if (sectionToDuplicate) {
      const duplicatedSection: TemplateSection = {
        ...sectionToDuplicate,
        id: Date.now(),
        title: `${sectionToDuplicate.title} (Cópia)`,
        fields: sectionToDuplicate.fields.map(field => ({
          ...field,
          id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      };
      setTemplate(prev => ({
        ...prev,
        sections: [...prev.sections, duplicatedSection]
      }));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = template.sections.findIndex(section => `section-${section.id}` === active.id);
      const overIndex = template.sections.findIndex(section => `section-${section.id}` === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        setTemplate(prev => ({
          ...prev,
          sections: arrayMove(prev.sections, activeIndex, overIndex)
        }));
      }
    }
    
    setActiveId(null);
  };

  const handleSave = () => {
    if (!template.name || !template.type) return;
    onSave(template);
  };

  const isValid = template.name && template.type && template.sections.length > 0;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {initialData ? 'Editar Template' : 'Criar Novo Template'}
          </h2>
          <p className="text-gray-600">
            Use drag-and-drop para reorganizar seções e campos
          </p>
        </div>

        {/* Template Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Checklist de Upgrade"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={template.type}
                  onValueChange={(type) => setTemplate(prev => ({ ...prev, type }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={template.description}
                onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste template..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Seções do Template</h3>
          <Button onClick={addSection} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Seção
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={template.sections.map(section => `section-${section.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {template.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  onSetActive={() => setActiveSection(section.id)}
                  onUpdate={(updatedSection) => updateSection(section.id, updatedSection)}
                  onRemove={() => removeSection(section.id)}
                  onDuplicate={() => duplicateSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeId ? (
              <div className="opacity-80">
                {activeId.startsWith('section-') ? (
                  <Card className="border-2 border-blue-300 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <Move className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">Movendo seção...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-white border rounded-lg p-4 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Movendo campo...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {template.sections.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma seção criada ainda</p>
            <Button onClick={addSection} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Seção
            </Button>
          </div>
        )}
      </div>

      <Separator />

        {/* Actions */}
        <div className="flex justify-between items-center pt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={!isValid || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar with Field Palette */}
      <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto max-h-screen">
        <div className="p-4">
          <FieldPalette onAddField={addFieldFromPalette} />
          
          {activeSection && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Seção Ativa
              </p>
              <p className="text-xs text-blue-600">
                {template.sections.find(s => s.id === activeSection)?.title || 'Seção Selecionada'}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Clique em um tipo de campo para adicionar à esta seção
              </p>
            </div>
          )}

          {!activeSection && template.sections.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Selecione uma Seção
              </p>
              <p className="text-xs text-yellow-600">
                Clique em uma seção para torná-la ativa antes de adicionar campos
              </p>
            </div>
          )}
          
          {template.sections.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Comece Criando uma Seção
              </p>
              <p className="text-xs text-yellow-600">
                Adicione uma seção primeiro para começar a inserir campos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}