import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Type,
  FileText,
  Camera,
  CheckCircle,
  List,
  Phone,
  Mail,
  User,
  Hash,
  Plus
} from 'lucide-react';

const fieldTypes = [
  { 
    value: 'text', 
    label: 'Texto', 
    icon: Type, 
    description: 'Campo de texto simples',
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  { 
    value: 'textarea', 
    label: 'Texto Longo', 
    icon: FileText, 
    description: 'Área de texto para descrições',
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  { 
    value: 'email', 
    label: 'E-mail', 
    icon: Mail, 
    description: 'Campo de endereço de e-mail',
    color: 'bg-green-50 text-green-600 border-green-200'
  },
  { 
    value: 'tel', 
    label: 'Telefone', 
    icon: Phone, 
    description: 'Campo de número de telefone',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  { 
    value: 'number', 
    label: 'Número', 
    icon: Hash, 
    description: 'Campo numérico',
    color: 'bg-orange-50 text-orange-600 border-orange-200'
  },
  { 
    value: 'photo', 
    label: 'Foto', 
    icon: Camera, 
    description: 'Upload de imagens',
    color: 'bg-pink-50 text-pink-600 border-pink-200'
  },
  { 
    value: 'signature', 
    label: 'Assinatura', 
    icon: User, 
    description: 'Campo de assinatura digital',
    color: 'bg-gray-50 text-gray-600 border-gray-200'
  },
  { 
    value: 'evidence', 
    label: 'Evidência', 
    icon: CheckCircle, 
    description: 'Campo de verificação com evidência',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  { 
    value: 'radio', 
    label: 'Seleção Única', 
    icon: CheckCircle, 
    description: 'Opções de escolha única',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200'
  },
  { 
    value: 'select', 
    label: 'Lista Suspensa', 
    icon: List, 
    description: 'Menu dropdown com opções',
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  }
];

interface FieldPaletteProps {
  onAddField?: (fieldType: string) => void;
  compact?: boolean;
}

export default function FieldPalette({ onAddField, compact = false }: FieldPaletteProps) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {fieldTypes.map((fieldType) => {
          const Icon = fieldType.icon;
          return (
            <Button
              key={fieldType.value}
              variant="outline"
              size="sm"
              className={`h-auto p-3 border-2 hover:${fieldType.color.replace('bg-', 'bg-').replace('50', '100')} transition-all`}
              onClick={() => onAddField?.(fieldType.value)}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">{fieldType.label}</span>
              </div>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-600" />
          Tipos de Campo
        </CardTitle>
        <p className="text-sm text-gray-600">
          Clique em um tipo para adicioná-lo à seção ativa
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <Button
                key={fieldType.value}
                variant="outline"
                className={`w-full h-auto p-4 border-2 ${fieldType.color} hover:shadow-md transition-all group text-left`}
                onClick={() => onAddField?.(fieldType.value)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{fieldType.label}</span>
                      <Badge variant="secondary" className="text-xs opacity-70 group-hover:opacity-100">
                        Adicionar
                      </Badge>
                    </div>
                    <p className="text-xs opacity-70 group-hover:opacity-90 mt-1">
                      {fieldType.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Field Type Configurations for reference
export const getFieldTypeConfig = (type: string) => {
  return fieldTypes.find(ft => ft.value === type);
};

export { fieldTypes };