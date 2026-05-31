import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Download,
  Building2,
  HelpCircle,
  LogOut,
  Box,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/context/AppContext';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, viewingAsUser, setViewingAsUser, logout } = useApp();

  const navigation = [
    { name: 'Downloads', href: '/', icon: Download },
    { name: 'Organizações', href: '#', icon: Building2 }, // Visual mockup
    { name: 'Ajuda', href: '#', icon: HelpCircle },
  ];

  const handleBackToMaster = () => {
    setViewingAsUser(false);
    navigate('/master');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSimulating = user?.role === 'master' || viewingAsUser;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Simulation Top Bar */}
      {isSimulating && (
        <div className="bg-[#021318] text-white px-6 py-2 flex items-center justify-between border-b border-[#00F59B]/20 text-[12px] font-semibold shrink-0 z-30">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#00F59B] rounded-full animate-pulse"></span>
            <span className="text-slate-300">Modo de Visualização:</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 border border-emerald-900 rounded">
              Usuário Final (Fornecedor)
            </span>
          </div>
          <button 
            onClick={handleBackToMaster}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#00F59B] hover:bg-[#00D485] text-teal-950 text-xs font-bold rounded transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Área Master
          </button>
        </div>
      )}

      {/* Main body wrapper */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Teal/Petrol Theme */}
        <div className="w-[260px] bg-[#0c3944] text-gray-300 flex flex-col shrink-0 px-0 py-8 z-20 shadow-md">
          <div className="mb-10 flex items-center gap-3 px-6">
            <img src={logoImage} alt="Perspecpack Logo" className="h-10 w-auto object-contain" />
            <img src={brandTextImg} alt="PERSPECPACK" className="h-4.5 w-auto object-contain brightness-0 invert" />
          </div>
          
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive 
                      ? 'bg-teal-600/20 text-teal-400 border-l-4 border-teal-500 font-semibold' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent',
                    'group flex items-center gap-4 px-5 py-3.5 text-[14px] font-medium transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-teal-400' : 'text-gray-400 group-hover:text-white',
                      'flex-shrink-0 h-[20px] w-[20px]'
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 mt-auto px-4">
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 h-auto text-[14px] font-medium gap-3 rounded-md transition-colors"
            >
              <LogOut className="h-[20px] w-[20px]" />
              <span>Sair</span>
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <header className="bg-white border-b border-gray-200 h-[76px] flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Downloads</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">Selecione a organização e acesse os arquivos disponíveis</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 py-1.5 pl-1.5 pr-4 rounded-full cursor-default hover:bg-gray-100 transition-colors shadow-sm">
              <div className="h-8 w-8 rounded-full bg-teal-900 text-teal-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                {user?.email?.substring(0, 1) || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[12px] font-bold text-gray-700 leading-tight">
                  {user?.role === 'master' ? 'Master Admin (Simulando)' : 'Fornecedor'}
                </span>
                <span className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {user?.email || 'fornecedor@perspecpack.com'}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-gray-50 p-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

