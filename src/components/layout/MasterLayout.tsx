import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Building2, 
  Tags, 
  FileText, 
  Layers, 
  CheckSquare, 
  FolderKanban, 
  Eye, 
  Settings as SettingsIcon, 
  LogOut,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/context/AppContext';

export function MasterLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, setViewingAsUser, user } = useApp();

  const navigation = [
    { name: 'Organizações', href: '/master/oems', icon: Building2 },
    { name: 'Conteúdo', href: '/master/content', icon: Layers },
    { name: 'Uploads', href: '/master/uploads', icon: FileText },
  ];

  const handleViewPlatform = () => {
    setViewingAsUser(true);
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] overflow-hidden font-sans">
      {/* Sidebar - Deep Petrol & Neon Green accents */}
      <div className="w-[280px] bg-[#06242c] text-slate-300 flex flex-col shrink-0 px-0 py-8 border-r border-teal-950 shadow-[4px_0_24px_rgba(6,36,44,0.15)] z-20">
        <div className="text-white font-bold text-[20px] tracking-tight mb-10 flex items-center gap-3 px-6">
          <div className="relative">
            <Box className="w-8 h-8 text-[#00F59B]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00F59B] rounded-full animate-ping"></div>
          </div>
          <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent font-extrabold">PERSPECPACK</span>
        </div>

        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-950/60 border border-teal-800/40 rounded-lg text-xs font-semibold text-[#00F59B]">
            <Shield className="w-4 h-4 shrink-0" />
            <span>PAINEL MASTER (ADMIN)</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href === '/master/content' && location.pathname.startsWith('/master/content'));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive 
                    ? 'bg-[#00F59B]/10 text-white border-l-4 border-[#00F59B] font-semibold' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent',
                  'group flex items-center gap-3.5 px-4 py-3 text-[14px] transition-all duration-200 rounded-r-md'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-[#00F59B]' : 'text-slate-400 group-hover:text-white',
                    'flex-shrink-0 h-[18px] w-[18px] transition-colors duration-200'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate flex-1">{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-teal-950/50 mt-4 space-y-1">
            <button
              onClick={handleViewPlatform}
              className="w-full text-left text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent group flex items-center gap-3.5 px-4 py-3 text-[14px] transition-all duration-200 rounded-r-md"
            >
              <Eye className="flex-shrink-0 h-[18px] w-[18px] text-slate-400 group-hover:text-white" />
              <span className="truncate flex-1">Visualizar Plataforma</span>
              <span className="text-[10px] bg-teal-900 text-[#00F59B] px-1.5 py-0.5 rounded font-mono font-bold">LIVE</span>
            </button>

            <Link
              to="/master/settings"
              className={cn(
                location.pathname === '/master/settings'
                  ? 'bg-[#00F59B]/10 text-white border-l-4 border-[#00F59B] font-semibold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent',
                'group flex items-center gap-3.5 px-4 py-3 text-[14px] transition-all duration-200 rounded-r-md'
              )}
            >
              <SettingsIcon className={cn(
                location.pathname === '/master/settings' ? 'text-[#00F59B]' : 'text-slate-400 group-hover:text-white',
                'flex-shrink-0 h-[18px] w-[18px]'
              )} />
              <span className="truncate flex-1">Configurações</span>
            </Link>
          </div>
        </nav>

        <div className="pt-4 mt-auto px-4 border-t border-teal-950/50">
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/5 px-4 py-3 h-auto text-[14px] font-medium gap-3 rounded-md transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>Sair</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <header className="bg-white border-b border-[#E2E8F0] h-[76px] flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
          <div>
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Área Master</span>
            <h1 className="text-[18px] font-bold text-[#0F172A] tracking-tight">
              {location.pathname === '/master' && 'Gestão de Organizações'}
              {location.pathname.startsWith('/master/oems') && 'Gestão de Organizações'}
              {location.pathname.startsWith('/master/content') && 'Gestão de Conteúdo por Organização'}
              {location.pathname.startsWith('/master/uploads') && 'Central de Uploads'}
              {location.pathname.startsWith('/master/settings') && 'Configurações'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 py-1.5 pl-1.5 pr-4 rounded-full cursor-default shadow-sm">
              <div className="h-8 w-8 rounded-full bg-teal-950 border border-teal-800 text-[#00F59B] flex items-center justify-center font-bold text-sm shadow-inner">
                M
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[13px] font-bold text-slate-800 leading-tight">Master Admin</span>
                <span className="text-[10px] text-slate-500 font-medium">{user?.email || 'master@perspecpack.com'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F8FAFC] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
