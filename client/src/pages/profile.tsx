import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Mail,
  Phone,
  Building,
  FileText,
  Key
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@shared/schema';

const roleLabels = {
  [UserRole.TECNICO]: 'Técnico',
  [UserRole.ANALISTA]: 'Analista', 
  [UserRole.COORDENADOR]: 'Coordenador',
  [UserRole.ADMINISTRADOR]: 'Administrador',
};

const roleBadgeColors = {
  [UserRole.TECNICO]: 'bg-blue-100 text-blue-800',
  [UserRole.ANALISTA]: 'bg-green-100 text-green-800',
  [UserRole.COORDENADOR]: 'bg-orange-100 text-orange-800',
  [UserRole.ADMINISTRADOR]: 'bg-purple-100 text-purple-800',
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    contractor: user?.contractor || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const editMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest('PUT', `/api/users/${user?.id}`, userData);
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      refreshUser();
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (passwords: any) => {
      return apiRequest('POST', `/api/users/${user?.id}/change-password`, passwords);
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao alterar senha",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleEditOpen = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      contractor: user?.contractor || '',
    });
    setIsEditDialogOpen(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>

        {/* Profile Card */}
        <div className="max-w-2xl">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <Badge 
                      className={roleBadgeColors[user.role as keyof typeof roleBadgeColors] || 'bg-gray-100 text-gray-800'}
                    >
                      {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                    </Badge>
                  </div>
                </div>
                
                <Button onClick={handleEditOpen} variant="outline">
                  Editar Perfil
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">E-mail</Label>
                    <div className="flex items-center mt-1 text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </div>
                  
                  {user.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                      <div className="flex items-center mt-1 text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {user.cpf && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">CPF</Label>
                      <div className="flex items-center mt-1 text-gray-900">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        {user.cpf}
                      </div>
                    </div>
                  )}
                  
                  {user.contractor && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Empreiteira</Label>
                      <div className="flex items-center mt-1 text-gray-900">
                        <Building className="w-4 h-4 mr-2 text-gray-400" />
                        {user.contractor}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-0 shadow-sm mt-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Segurança
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Senha</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Altere sua senha regularmente para manter sua conta segura
                  </p>
                </div>
                
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Alterar Senha</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Senha Atual</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsPasswordDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="contractor">Empreiteira</Label>
                <Input
                  id="contractor"
                  value={formData.contractor}
                  onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={editMutation.isPending}
                >
                  {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}