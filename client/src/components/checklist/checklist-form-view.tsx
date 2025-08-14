import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChecklistFormViewProps {
  checklist: any;
}

export default function ChecklistFormView({ checklist }: ChecklistFormViewProps) {
  // Fetch template data to structure the responses
  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    staleTime: 10 * 60 * 1000,
  });

  if (!checklist.responses || Object.keys(checklist.responses).length === 0) {
    return (
      <div className="border-t pt-4">
        <p className="text-sm text-gray-500">Nenhuma resposta registrada.</p>
      </div>
    );
  }

  // Find the matching template
  const template = (templates as any[])?.find((t: any) => t.id === checklist.templateId);

  if (!template) {
    // Fallback to simple key-value display
    return (
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Respostas do Formulário</h4>
        <div className="space-y-3">
          {Object.entries(checklist.responses).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 capitalize">{key}:</p>
              <div className="text-sm text-gray-900 mt-1">
                {typeof value === 'object' ? (
                  <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render with template structure
  return (
    <div className="border-t pt-4">
      <h4 className="font-medium text-gray-900 mb-4">Checklist Preenchido</h4>
      <div className="space-y-6">
        {template.sections?.map((section: any, sectionIndex: number) => (
          <div key={section.id || sectionIndex} className="bg-white rounded-lg border shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {section.icon && <span className="text-xl">{section.icon}</span>}
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </div>
            
            <div className="p-6 space-y-6">
              {section.fields?.map((field: any, fieldIndex: number) => {
                const response = checklist.responses?.[field.id];
                
                // Skip fields without responses
                if (response === undefined || response === null || response === '') {
                  return null;
                }
                
                return (
                  <div key={field.id || fieldIndex} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      {field.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 border rounded-lg p-4">
                      {field.type === 'photo' && response ? (
                        <div className="space-y-3">
                          <img
                            src={`/uploads/${response}`}
                            alt="Foto enviada"
                            className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEySC0zIiBzdHJva2U9IiNhZmFmYWYiLz4KPHN2Zz4K';
                              e.currentTarget.alt = 'Imagem não encontrada';
                            }}
                            onClick={() => window.open(`/uploads/${response}`, '_blank')}
                          />
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            📷 Imagem anexada pelo técnico
                          </p>
                        </div>
                      ) : field.type === 'signature' && response ? (
                        <div className="space-y-3">
                          <img
                            src={response}
                            alt="Assinatura digital"
                            className="max-w-full max-h-32 object-contain border rounded-lg bg-white shadow-sm"
                          />
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            ✍️ Assinatura digital
                          </p>
                        </div>
                      ) : field.type === 'evidence' && response ? (
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Resposta:</span> 
                              <span className="ml-2 text-gray-600">
                                {typeof response === 'object' && response !== null ? response.answer || 'Não informado' : response || 'Não informado'}
                              </span>
                            </p>
                          </div>
                          {(typeof response === 'object' && response !== null && response.photo) && (
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
                                📷 Evidência fotográfica anexada
                              </Badge>
                            </div>
                          )}
                          {(typeof response === 'object' && response !== null && response.comment) && (
                            <div className="bg-white rounded-lg p-3 border">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Comentário:</span>
                                <span className="ml-2 text-gray-600">{response.comment}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : field.type === 'textarea' ? (
                        <div className="bg-white rounded p-3 border min-h-[80px]">
                          <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans">{response}</pre>
                        </div>
                      ) : field.type === 'radio' ? (
                        <div className="bg-white rounded p-3 border">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {response}
                          </Badge>
                        </div>
                      ) : field.type === 'select' ? (
                        <div className="bg-white rounded p-3 border">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                            {response}
                          </Badge>
                        </div>
                      ) : (
                        <div className="bg-white rounded p-3 border">
                          <span className="text-gray-700">{response}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}