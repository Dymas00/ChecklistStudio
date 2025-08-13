import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardCheck,
  ArrowUp,
  Power,
  Settings,
  RefreshCw,
  Star
} from 'lucide-react';
import { getStatusBadgeClass, getStatusLabel, formatTimeAgo } from '@/lib/templates';
import { Link } from 'wouter';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  
  const { data: templates } = useQuery({
    queryKey: ['/api/templates']
  });

  const { data: myChecklists } = useQuery({
    queryKey: ['/api/checklists']
  });

  if (!user || user.role !== 'tecnico') {
    return null; // Will be handled by auth redirect
  }

  const templateIcons = {
    upgrade: ArrowUp,
    ativacao: Power,
    manutencao: Settings,
    migracao: RefreshCw,
  };

  const templateColors = {
    upgrade: 'blue',
    ativacao: 'green', 
    manutencao: 'orange',
    migracao: 'purple',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <ClipboardCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {user.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie seus checklists de campo
          </p>
        </div>

        {/* Action Card */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <CardTitle className="text-xl mb-4">
              Iniciar Novo Checklist
            </CardTitle>
            <p className="text-gray-600 mb-6">
              Selecione o tipo de checklist que deseja preencher
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {((templates as any) || [])?.map((template: any) => {
                const Icon = templateIcons[template.type as keyof typeof templateIcons] || ClipboardCheck;
                const color = templateColors[template.type as keyof typeof templateColors] || 'gray';
                
                return (
                  <Link key={template.id} to={`/checklist/${template.id}`}>
                    <Button
                      variant="outline"
                      className="h-auto p-6 border-2 hover:border-primary hover:bg-primary/5 transition-all group w-full"
                    >
                      <div className="flex flex-col items-center text-center">
                        <Icon className={`w-8 h-8 mb-3 text-${color}-600 group-hover:text-primary transition-colors`} />
                        <h3 className="font-medium text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {template.description}
                        </p>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* My Checklists */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">Meus Checklists</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {((myChecklists as any) || [])?.length > 0 ? ((myChecklists as any) || []).map((checklist: any) => (
                <div key={checklist.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {checklist.templateId} - Loja {checklist.storeCode}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Criado em {formatTimeAgo(checklist.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadgeClass(checklist.status)}>
                      {getStatusLabel(checklist.status)}
                    </Badge>
                    
                    {checklist.status === 'aprovado' && checklist.rating && (
                      <div className="flex items-center justify-end mt-1">
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
                    
                    {checklist.status === 'pendente' && (
                      <Link to={`/checklist/${checklist.templateId}?edit=${checklist.id}`}>
                        <Button variant="ghost" size="sm" className="mt-1 h-auto py-1 px-2">
                          Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Você ainda não possui checklists
                  </p>
                  <p className="text-gray-400 text-sm">
                    Inicie um novo checklist usando os botões acima
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
