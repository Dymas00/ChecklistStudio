import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  PieChart, 
  Plus,
  TrendingUp,
  AlertTriangle,
  Star
} from 'lucide-react';
import { getStatusBadgeClass, getStatusLabel, formatTimeAgo } from '@/lib/templates';
import { Link } from 'wouter';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/dashboard/metrics']
  });

  if (!user || user.role === 'tecnico') {
    return null; // Will be handled by auth redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Visão geral do sistema de checklists
              </p>
            </div>
            
            {(user?.role === 'tecnico' || isAdmin) && (
              <Link to="/checklists">
                <Button className="font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Checklist
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total de Checklists
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(metrics as any)?.total || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">
                      +12%
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      vs. mês anterior
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pendentes
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(metrics as any)?.pending || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mr-1" />
                    <span className="text-orange-600 text-sm font-medium">
                      Atenção
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      requer aprovação
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Aprovados
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(metrics as any)?.approved || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">
                      {metrics?.approvalRate}%
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      taxa de aprovação
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Taxa de Aprovação
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(typeof (metrics as any)?.approvalRate === 'number' ? (metrics as any)?.approvalRate.toFixed(1) : "0.0")}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">
                      +2.1%
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      vs. média anterior
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Checklists and Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Checklists */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">Checklists Recentes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {((metrics as any)?.recentChecklists || [])?.map((checklist: any) => (
                      <div key={checklist.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                            <ClipboardList className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {checklist.templateId} - {checklist.storeCode}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {checklist.technicianId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusBadgeClass(checklist.status)}>
                            {getStatusLabel(checklist.status)}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(checklist.createdAt)}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum checklist encontrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Technician Ranking */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg">Ranking de Técnicos</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {((metrics as any)?.technicianRankings || [])?.map((tech: any, index: number) => (
                      <div key={tech.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            index === 0 ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-sm font-bold ${
                              index === 0 ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {tech.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {tech.completedChecklists} checklists
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(parseFloat(tech.rating))
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {tech.rating}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum técnico encontrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
