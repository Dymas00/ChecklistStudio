import { useState } from 'react';
// Import do hook de autenticação
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sidebar } from '@/components/layout/sidebar';
import Footer from '@/components/layout/footer';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3, 
  FileDown, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Filter
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { exportReportToPDF } from '@/lib/reports-export';
import { useToast } from '@/hooks/use-toast';
import StoreSelector from '@/components/checklist/store-selector';
import { formatStoreNumber } from '@shared/stores';

interface ReportFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  templateType: string;
  status: string;
  technician: string;
  storeNumber: string;
}

interface ReportData {
  totalChecklists: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  approvalRate: number;
  averageRating: number;
  technicianPerformance: Array<{
    technicianId: string;
    technicianName: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    rating: number;
  }>;
  templateStats: Array<{
    templateType: string;
    templateName: string;
    total: number;
    approved: number;
    approvalRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
    approved: number;
    rejected: number;
  }>;
  storeStats: Array<{
    storeNumber: string;
    storeName: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
    averageRating: number;
  }>;
}

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
    templateType: 'all',
    status: 'all',
    technician: 'all',
    storeNumber: 'all'
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const { data: checklists, isLoading: loadingChecklists } = useQuery({
    queryKey: ['/api/checklists']
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users']
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/templates']
  });

  // Check permissions after hooks
  if (!user || !['administrador', 'coordenador'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Apenas administradores e coordenadores podem acessar relatórios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate report data based on filters
  const generateReportData = (): ReportData => {
    if (!checklists) return {
      totalChecklists: 0,
      approvedCount: 0,
      rejectedCount: 0,
      pendingCount: 0,
      approvalRate: 0,
      averageRating: 0,
      technicianPerformance: [],
      templateStats: [],
      dailyStats: [],
      storeStats: []
    };

    let filteredChecklists = Array.isArray(checklists) ? checklists.filter((checklist: any) => {
      const checklistDate = new Date(checklist.createdAt);
      
      // Date filter
      if (filters.dateFrom && checklistDate < filters.dateFrom) return false;
      if (filters.dateTo && checklistDate > filters.dateTo) return false;
      
      // Template filter
      if (filters.templateType !== 'all' && checklist.templateId !== filters.templateType) return false;
      
      // Status filter
      if (filters.status !== 'all' && checklist.status !== filters.status) return false;
      
      // Technician filter
      if (filters.technician !== 'all' && checklist.technicianId !== filters.technician) return false;
      
      // Store filter - get store number from responses
      if (filters.storeNumber !== 'all') {
        const storeNumber = checklist.responses ? Object.values(checklist.responses).find((value: any) => 
          typeof value === 'string' && /^\d+$/.test(value) && value.length >= 3
        ) : null;
        if (storeNumber !== filters.storeNumber) return false;
      }
      
      return true;
    }) : [];

    const totalChecklists = filteredChecklists.length;
    const approvedCount = filteredChecklists.filter((c: any) => c.status === 'aprovado').length;
    const rejectedCount = filteredChecklists.filter((c: any) => c.status === 'rejeitado').length;
    const pendingCount = filteredChecklists.filter((c: any) => c.status === 'pendente').length;
    const approvalRate = totalChecklists > 0 ? (approvedCount / totalChecklists) * 100 : 0;
    
    const ratingsSum = filteredChecklists
      .filter((c: any) => c.rating && c.status === 'aprovado')
      .reduce((sum: number, c: any) => sum + c.rating, 0);
    const ratingsCount = filteredChecklists.filter((c: any) => c.rating && c.status === 'aprovado').length;
    const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    // Technician performance
    const technicianStats = new Map();
    filteredChecklists.forEach((checklist: any) => {
      const techId = checklist.technicianId;
      if (!technicianStats.has(techId)) {
        technicianStats.set(techId, {
          technicianId: techId,
          technicianName: Array.isArray(users) ? users.find((u: any) => u.id === techId)?.name || 'Técnico não encontrado' : 'Técnico não encontrado',
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          ratings: []
        });
      }
      
      const stats = technicianStats.get(techId);
      stats.total++;
      if (stats[checklist.status] !== undefined) {
        stats[checklist.status]++;
      }
      // Only count ratings from approved checklists
      if (checklist.rating && checklist.status === 'aprovado') {
        stats.ratings.push(checklist.rating);
      }
    });

    const technicianPerformance = Array.from(technicianStats.values()).map((stats: any) => ({
      ...stats,
      rating: stats.ratings.length > 0 ? stats.ratings.reduce((a: number, b: number) => a + b) / stats.ratings.length : 0
    }));

    // Template statistics
    const templateStats = new Map();
    filteredChecklists.forEach((checklist: any) => {
      const templateId = checklist.templateId;
      if (!templateStats.has(templateId)) {
        templateStats.set(templateId, {
          templateType: templateId,
          templateName: Array.isArray(templates) ? templates.find((t: any) => t.id === templateId)?.name || templateId : templateId,
          total: 0,
          approved: 0
        });
      }
      
      const stats = templateStats.get(templateId);
      stats.total++;
      if (checklist.status === 'aprovado') stats.approved++;
    });

    const templateStatsArray = Array.from(templateStats.values()).map((stats: any) => ({
      ...stats,
      approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0
    }));

    // Daily statistics for the last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayChecklists = filteredChecklists.filter((c: any) => 
        format(new Date(c.createdAt), 'yyyy-MM-dd') === dateStr
      );
      
      dailyStats.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        total: dayChecklists.length,
        approved: dayChecklists.filter((c: any) => c.status === 'aprovado').length,
        rejected: dayChecklists.filter((c: any) => c.status === 'rejeitado').length
      });
    }

    // Store statistics
    const storeStats = new Map();
    filteredChecklists.forEach((checklist: any) => {
      const storeNumber = checklist.responses ? Object.values(checklist.responses).find((value: any) => 
        typeof value === 'string' && /^\d+$/.test(value) && value.length >= 3
      ) : null;
      
      if (storeNumber) {
        if (!storeStats.has(storeNumber)) {
          storeStats.set(storeNumber, {
            storeNumber: String(storeNumber),
            storeName: formatStoreNumber(Number(storeNumber)),
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
            ratings: []
          });
        }
        
        const stats = storeStats.get(storeNumber);
        stats.total++;
        if (checklist.status === 'aprovado') {
          stats.approved++;
          if (checklist.rating) stats.ratings.push(checklist.rating);
        } else if (checklist.status === 'rejeitado') {
          stats.rejected++;
        } else if (checklist.status === 'pendente') {
          stats.pending++;
        }
      }
    });

    const storeStatsArray = Array.from(storeStats.values()).map((stats: any) => ({
      ...stats,
      approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
      averageRating: stats.ratings.length > 0 ? stats.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.ratings.length : 0
    })).sort((a, b) => b.total - a.total); // Sort by total descending

    return {
      totalChecklists,
      approvedCount,
      rejectedCount,
      pendingCount,
      approvalRate,
      averageRating,
      technicianPerformance,
      templateStats: templateStatsArray,
      dailyStats,
      storeStats: storeStatsArray
    };
  };

  const reportData = generateReportData();

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await exportReportToPDF({
        filters,
        reportData,
        generatedBy: user?.name || 'Sistema',
        generatedAt: new Date().toISOString()
      });
      
      toast({
        title: 'Sucesso',
        description: 'Relatório exportado com sucesso!',
      });
    } catch (error) {
      // Error handled by toast notification
      toast({
        title: 'Erro',
        description: 'Falha ao exportar relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loadingChecklists) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-64 p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Análise de desempenho técnico e estatísticas operacionais
            </p>
          </div>
          
          <Button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Exportar Relatório
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? (
                        format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? (
                        format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Template Type */}
              <div className="space-y-2">
                <Label>Tipo de Template</Label>
                <Select value={filters.templateType} onValueChange={(value) => setFilters(prev => ({ ...prev, templateType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os templates</SelectItem>
                    {Array.isArray(templates) && templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Technician */}
              <div className="space-y-2">
                <Label>Técnico</Label>
                <Select value={filters.technician} onValueChange={(value) => setFilters(prev => ({ ...prev, technician: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os técnicos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os técnicos</SelectItem>
                    {Array.isArray(users) && users.filter((u: any) => u.role === 'tecnico').map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Store Number */}
              <div className="space-y-2">
                <Label>Loja</Label>
                <StoreSelector
                  value={filters.storeNumber === 'all' ? '' : filters.storeNumber}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, storeNumber: value || 'all' }))}
                  placeholder="Todas as lojas"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Checklists</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.totalChecklists}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.approvalRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.averageRating.toFixed(1)}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Técnicos Ativos</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.technicianPerformance.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Aprovados</span>
                  </div>
                  <span className="font-semibold">{reportData.approvedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Rejeitados</span>
                  </div>
                  <span className="font-semibold">{reportData.rejectedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Pendentes</span>
                  </div>
                  <span className="font-semibold">{reportData.pendingCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.templateStats.slice(0, 4).map((template, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{template.templateName}</span>
                      <div className="text-xs text-gray-500">{template.total} checklists</div>
                    </div>
                    <Badge variant={template.approvalRate >= 80 ? 'default' : template.approvalRate >= 60 ? 'secondary' : 'destructive'}>
                      {template.approvalRate.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technician Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Técnico</th>
                    <th className="text-center py-2">Total</th>
                    <th className="text-center py-2">Aprovados</th>
                    <th className="text-center py-2">Rejeitados</th>
                    <th className="text-center py-2">Pendentes</th>
                    <th className="text-center py-2">Taxa</th>
                    <th className="text-center py-2">Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.technicianPerformance.map((tech, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{tech.technicianName}</td>
                      <td className="text-center py-2">{tech.total}</td>
                      <td className="text-center py-2 text-green-600">{tech.approved}</td>
                      <td className="text-center py-2 text-red-600">{tech.rejected}</td>
                      <td className="text-center py-2 text-yellow-600">{tech.pending}</td>
                      <td className="text-center py-2">
                        {tech.total > 0 ? ((tech.approved / tech.total) * 100).toFixed(0) : '0'}%
                      </td>
                      <td className="text-center py-2">
                        {tech.rating > 0 ? Number(tech.rating).toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Store Performance Statistics */}
        {reportData.storeStats.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Desempenho por Loja
                <Badge variant="secondary" className="ml-2">
                  {reportData.storeStats.length} lojas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Loja</th>
                      <th className="text-center py-2">Total</th>
                      <th className="text-center py-2">Aprovados</th>
                      <th className="text-center py-2">Rejeitados</th>
                      <th className="text-center py-2">Pendentes</th>
                      <th className="text-center py-2">Taxa de Aprovação</th>
                      <th className="text-center py-2">Avaliação Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.storeStats.slice(0, 20).map((store, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{store.storeName}</td>
                        <td className="text-center py-2">{store.total}</td>
                        <td className="text-center py-2 text-green-600">{store.approved}</td>
                        <td className="text-center py-2 text-red-600">{store.rejected}</td>
                        <td className="text-center py-2 text-yellow-600">{store.pending}</td>
                        <td className="text-center py-2">
                          <Badge variant={store.approvalRate >= 80 ? 'default' : store.approvalRate >= 60 ? 'secondary' : 'destructive'}>
                            {store.approvalRate.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="text-center py-2">
                          {store.averageRating > 0 ? store.averageRating.toFixed(1) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.storeStats.length > 20 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Mostrando top 20 lojas. Use filtros para ver lojas específicas.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}