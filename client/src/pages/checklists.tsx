
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sidebar } from '@/components/layout/sidebar';
import { ClipboardList, Search, Filter, Eye, Edit, Star, Plus, ArrowUp, Power, Settings, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'rejeitado':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'aprovado':
      return 'Aprovado';
    case 'rejeitado':
      return 'Rejeitado';
    case 'pendente':
      return 'Pendente';
    default:
      return status;
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}min atrás`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h atrás`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  }
}

// Template icons mapping
const templateIcons = {
  upgrade: ArrowUp,
  ativacao: Power,
  migracao: RefreshCw,
  manutencao: Settings,
};

// Template colors mapping
const templateColors = {
  upgrade: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  ativacao: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  migracao: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  manutencao: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
};

export default function Checklists() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewChecklistDialogOpen, setIsNewChecklistDialogOpen] = useState(false);

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['/api/checklists'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: user?.role === 'administrador',
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    enabled: isNewChecklistDialogOpen,
  });

  const filteredChecklists = checklists?.filter((checklist: any) => {
    const matchesSearch = 
      checklist.storeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.storeManager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.templateId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || checklist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getTechnicianName = (technicianId: string) => {
    const technician = users?.find((u: any) => u.id === technicianId);
    return technician?.name || 'Técnico não encontrado';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 p-6">
        {/* Header with New Checklist Button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checklists</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os checklists do sistema
            </p>
          </div>
          
          {(user?.role === 'tecnico' || user?.role === 'administrador') && (
            <Dialog open={isNewChecklistDialogOpen} onOpenChange={setIsNewChecklistDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Checklist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Selecionar Template</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Escolha o tipo de checklist que deseja preencher:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(templates as any)?.filter((template: any) => template.active).map((template: any) => {
                      const sectionsCount = Array.isArray(template.sections) ? template.sections.length : 0;
                      const Icon = templateIcons[template.type as keyof typeof templateIcons] || Settings;
                      const colors = templateColors[template.type as keyof typeof templateColors] || templateColors.upgrade;
                      
                      return (
                        <Card key={template.id} className={`hover:shadow-md transition-shadow cursor-pointer border-2 hover:${colors.border}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${colors.text}`} />
                              </div>
                            </div>
                            
                            <CardTitle className="text-lg mb-2">
                              {template.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {template.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>{sectionsCount} seções</span>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Ativo
                              </Badge>
                            </div>
                            
                            <Link to={`/checklist-form?template=${template.id}`}>
                              <Button 
                                className="w-full"
                                onClick={() => setIsNewChecklistDialogOpen(false)}
                              >
                                Usar este Template
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {(!templates || templates.length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <ClipboardList className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum template disponível
                      </h3>
                      <p className="text-gray-600">
                        Aguarde enquanto carregamos os templates disponíveis
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por código da loja, gerente ou template..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklists List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              Checklists ({filteredChecklists.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredChecklists.length > 0 ? (
                filteredChecklists.map((checklist: any) => (
                  <div key={checklist.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ClipboardList className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {checklist.templateId} - Loja {checklist.storeCode}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Gerente: {checklist.storeManager}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span>Por {user?.role === 'administrador' ? getTechnicianName(checklist.technicianId) : 'você'}</span>
                            <span className="mx-2">•</span>
                            <span>{formatTimeAgo(checklist.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <Badge className={getStatusBadgeClass(checklist.status)}>
                            {getStatusLabel(checklist.status)}
                          </Badge>
                          
                          {checklist.status === 'aprovado' && checklist.rating && (
                            <div className="flex items-center justify-end mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < checklist.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {checklist.status === 'pendente' && (
                            <Link to={`/checklist/${checklist.templateId}?edit=${checklist.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Nenhum checklist encontrado
                  </p>
                  <p className="text-gray-400 text-sm">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando um novo checklist'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
