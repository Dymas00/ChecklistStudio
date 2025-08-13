
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sidebar } from '@/components/layout/sidebar';
import { ClipboardList, Search, Filter, Eye, Edit, Star } from 'lucide-react';
import { useState } from 'react';
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

export default function Checklists() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['/api/checklists'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: user?.role === 'administrador',
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Checklists</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os checklists do sistema
          </p>
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
