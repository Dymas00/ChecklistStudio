import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  ClipboardCheck,
  BarChart3,
  ClipboardList,
  FileText,
  Users,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import claroLogo from '@/assets/claro-empresas-logo-final.png';
import { Link, useLocation } from 'wouter';

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, isAdmin } = useAuth();
  const [location] = useLocation();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      show: ['analista', 'coordenador', 'administrador'].includes(user?.role || ''),
    },
    {
      name: 'Checklists',
      href: '/checklists',
      icon: ClipboardList,
      show: true,
    },
    {
      name: 'Relatórios',
      href: '/reports',
      icon: BarChart3,
      show: ['administrador', 'coordenador'].includes(user?.role || ''),
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileText,
      show: ['administrador', 'coordenador', 'analista'].includes(user?.role || ''),
    },
    {
      name: 'Usuários',
      href: '/users',
      icon: Users,
      show: isAdmin,
    },
  ];

  const isActive = (href: string) => {
    return location === href || location.startsWith(href + '/');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full w-64 bg-white">
      {/* Menu Title */}
      <div className="flex justify-center py-4 border-b border-gray-200 w-full">
        <h1 className="text-lg font-semibold text-gray-900">
          Checklist Virtual
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary bg-primary/10 hover:bg-primary/15'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={handleLinkClick}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {user.role === 'administrador' ? 'Administrador' :
               user.role === 'coordenador' ? 'Coordenador' :
               user.role === 'analista' ? 'Analista' : 'Técnico'}
            </p>
          </div>
        </div>

        <Separator className="mb-3" />

        <Link to="/profile" onClick={handleLinkClick}>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start mb-1 ${
              isActive('/profile')
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:text-primary hover:bg-primary/5'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            handleLinkClick();
          }}
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:bg-white lg:shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Checklist Virtual
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}