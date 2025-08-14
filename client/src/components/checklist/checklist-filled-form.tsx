import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChecklistFilledFormProps {
  checklist: any;
}

export default function ChecklistFilledForm({ checklist }: ChecklistFilledFormProps) {
  // Fetch template data to render the original form structure
  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    staleTime: 10 * 60 * 1000,
  });

  if (!checklist) {
    return (
      <div className="border-t pt-4">
        <p className="text-sm text-gray-500">Nenhum checklist encontrado.</p>
      </div>
    );
  }

  // Find the matching template
  const template = (templates as any[])?.find((t: any) => t.id === checklist.templateId);

  if (!template) {
    // Fallback to simple display if template not found
    return (
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Respostas do Formulário</h4>
        <div className="space-y-3">
          {Object.entries(checklist.responses || {}).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 capitalize">{key}:</p>
              <p className="text-sm text-gray-900 mt-1">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-4">
      <h4 className="font-medium text-gray-900 mb-4">Formulário Preenchido pelo Técnico</h4>
      
      <div className="space-y-6">
        {template.sections?.map((section: any, sectionIndex: number) => (
          <Card key={section.id || sectionIndex} className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {section.icon && <span className="text-xl">{section.icon}</span>}
                {section.title}
              </CardTitle>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {section.fields?.map((field: any, fieldIndex: number) => {
                const response = checklist.responses?.[field.id];
                
                return (
                  <div key={field.id || fieldIndex} className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'url' ? (
                      <Input
                        value={response || ''}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        value={response || ''}
                        disabled
                        className="bg-gray-50 cursor-not-allowed min-h-[100px]"
                        rows={4}
                      />
                    ) : field.type === 'radio' ? (
                      <RadioGroup value={response || ''} disabled className="space-y-2">
                        {field.options?.map((option: string) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={option} 
                              id={`${field.id}-${option}`}
                              disabled
                              className="cursor-not-allowed"
                            />
                            <Label 
                              htmlFor={`${field.id}-${option}`}
                              className={`text-sm cursor-not-allowed ${
                                response === option ? 'font-medium text-blue-600' : 'text-gray-600'
                              }`}
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : field.type === 'select' ? (
                      <Select value={response || ''} disabled>
                        <SelectTrigger className="bg-gray-50 cursor-not-allowed">
                          <SelectValue placeholder={response || "Nenhuma opção selecionada"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'photo' ? (
                      <div className="space-y-3">
                        {response ? (
                          <div className="space-y-2">
                            <img
                              src={`/uploads/${response}`}
                              alt="Foto enviada pelo técnico"
                              className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEySC0zIiBzdHJva2U9IiNhZmFmYWYiLz4KPHN2Zz4K';
                                e.currentTarget.alt = 'Imagem não encontrada';
                              }}
                              onClick={() => window.open(`/uploads/${response}`, '_blank')}
                            />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              📷 Foto anexada
                            </Badge>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                            <p className="text-gray-500 text-sm">Nenhuma foto foi enviada</p>
                          </div>
                        )}
                      </div>
                    ) : field.type === 'signature' ? (
                      <div className="space-y-3">
                        {response ? (
                          <div className="space-y-2">
                            <img
                              src={response}
                              alt="Assinatura digital"
                              className="max-w-full max-h-32 object-contain border rounded-lg bg-white shadow-sm"
                            />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              ✍️ Assinatura capturada
                            </Badge>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                            <p className="text-gray-500 text-sm">Assinatura não foi capturada</p>
                          </div>
                        )}
                      </div>
                    ) : field.type === 'evidence' ? (
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Resposta:</span>
                            <span className="ml-2 text-gray-900">
                              {typeof response === 'object' ? response?.answer || 'Não informado' : response || 'Não informado'}
                            </span>
                          </p>
                        </div>
                        {typeof response === 'object' && response?.photo && (
                          <div className="space-y-2">
                            <img
                              src={`/uploads/${response.photo}`}
                              alt="Evidência fotográfica"
                              className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEySC0zIiBzdHJva2U9IiNhZmFmYWYiLz4KPHN2Zz4K';
                                e.currentTarget.alt = 'Imagem não encontrada';
                              }}
                              onClick={() => window.open(`/uploads/${response.photo}`, '_blank')}
                            />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              📷 Evidência fotográfica
                            </Badge>
                          </div>
                        )}
                        {typeof response === 'object' && response?.comment && (
                          <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Comentário adicional:</span>
                              <span className="ml-2 text-gray-900">{response.comment}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={response || ''}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    )}
                    
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}