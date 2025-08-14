import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus,
  Upload,
  Edit,
  Trash2,
  ArrowUp,
  Power,
  Settings,
  RefreshCw,
  Eye,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import TemplateBuilder, { TemplateData } from '@/components/templates/template-builder';
import DragDropTemplateBuilder from '@/components/templates/drag-drop-template-builder';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAgo } from '@/lib/templates';

export default function Templates() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/templates']
  });

  const createMutation = useMutation({
    mutationFn: async (templateData: TemplateData) => {
      return apiRequest('POST', '/api/templates', templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Template criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateData }) => {
      return apiRequest('PUT', `/api/templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: "Sucesso",
        description: "Template atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest('DELETE', `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Sucesso",
        description: "Template removido com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover template",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (templateId: string, templateName: string) => {
    if (window.confirm(`Tem certeza que deseja remover o template "${templateName}"?`)) {
      deleteMutation.mutate(templateId);
    }
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleCreateTemplate = (templateData: TemplateData) => {
    createMutation.mutate(templateData);
  };

  const handleUpdateTemplate = (templateData: TemplateData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: templateData });
    }
  };

  if (!user || user.role === 'tecnico') {
    return null; // Will be handled by auth redirect
  }

  const templateIcons = {
    upgrade: ArrowUp,
    ativacao: Power,
    manutencao: Settings,
    migracao: RefreshCw,
  };

  const templateColors = {
    upgrade: { bg: 'bg-blue-100', text: 'text-blue-600' },
    ativacao: { bg: 'bg-green-100', text: 'text-green-600' },
    manutencao: { bg: 'bg-orange-100', text: 'text-orange-600' },
    migracao: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-600 mt-1">
                Gerencie os templates de checklist
              </p>
            </div>
            
            {isAdmin && (
              <div className="flex space-x-3">
                <Button variant="outline" className="font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Template
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {((templates as any) || [])?.map((template: any) => {
              const Icon = templateIcons[template.type as keyof typeof templateIcons] || Settings;
              const colors = templateColors[template.type as keyof typeof templateColors] || { bg: 'bg-gray-100', text: 'text-gray-600' };
              const sectionsCount = Array.isArray(template.sections) ? template.sections.length : 0;
              
              return (
                <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      
                      {isAdmin && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 text-gray-400 hover:text-blue-600"
                            onClick={() => handleEditTemplate(template)}
                            title="Editar template"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 text-gray-400 hover:text-red-600"
                            onClick={() => handleDelete(template.id, template.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-lg mb-2">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{sectionsCount} seções</span>
                      <span>
                        {formatTimeAgo(template.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={template.active ? "default" : "secondary"}
                          className={template.active ? "bg-green-100 text-green-800" : ""}
                        >
                          {template.active ? "Ativo" : "Inativo"}
                        </Badge>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80 font-medium p-0"
                          onClick={() => handleViewTemplate(template)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (!templates || ((templates as any) || []).length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Crie seu primeiro template de checklist
            </p>
            {isAdmin && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Template
              </Button>
            )}
          </div>
        )}

        {/* Template View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                {selectedTemplate && (
                  <>
                    <div className={`w-8 h-8 ${templateColors[selectedTemplate.type]?.bg || 'bg-gray-100'} rounded-lg flex items-center justify-center mr-3`}>
                      {(() => {
                        const Icon = templateIcons[selectedTemplate.type as keyof typeof templateIcons] || Settings;
                        return <Icon className={`w-4 h-4 ${templateColors[selectedTemplate.type]?.text || 'text-gray-600'}`} />;
                      })()}
                    </div>
                    {selectedTemplate.name}
                    <Badge 
                      variant={selectedTemplate.active ? "default" : "secondary"}
                      className={`ml-3 ${selectedTemplate.active ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {selectedTemplate.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-6">
                {/* Template Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Tipo</h3>
                      <p className="text-gray-600 capitalize">{selectedTemplate.type}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Última atualização</h3>
                      <p className="text-gray-600">{formatTimeAgo(selectedTemplate.updatedAt)}</p>
                    </div>
                  </div>
                  {selectedTemplate.description && (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-900 mb-1">Descrição</h3>
                      <p className="text-gray-600">{selectedTemplate.description}</p>
                    </div>
                  )}
                </div>

                {/* Template Sections */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Seções do Template ({Array.isArray(selectedTemplate.sections) ? selectedTemplate.sections.length : 0})
                  </h3>
                  
                  <div className="space-y-4">
                    {Array.isArray(selectedTemplate.sections) && selectedTemplate.sections.map((section: any, index: number) => (
                      <Card key={section.id || index} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-primary font-semibold text-sm">{section.id}</span>
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              SEÇÃO {section.id} | {section.title}
                            </h4>
                          </div>
                          
                          {Array.isArray(section.fields) && (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 mb-2">
                                {section.fields.length} campos configurados
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {section.fields.map((field: any, fieldIndex: number) => (
                                  <div key={field.id || fieldIndex} className="flex items-center p-2 bg-gray-50 rounded">
                                    <div className="flex items-center mr-2">
                                      {field.required && (
                                        <AlertCircle className="w-3 h-3 text-orange-500 mr-1" />
                                      )}
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {field.label}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {field.type} {field.required ? "(obrigatório)" : "(opcional)"}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Template Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            
            <DragDropTemplateBuilder
              onSave={handleCreateTemplate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Editar Template</DialogTitle>
            </DialogHeader>
            
            {editingTemplate && (
              <DragDropTemplateBuilder
                initialData={{
                  name: editingTemplate.name,
                  type: editingTemplate.type,
                  description: editingTemplate.description || '',
                  icon: editingTemplate.icon,
                  sections: editingTemplate.sections || []
                }}
                onSave={handleUpdateTemplate}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingTemplate(null);
                }}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
