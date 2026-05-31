import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Search,
  User,
  ChevronDown,
  Settings,
  CreditCard,
  History,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import logoImage from '@/logo.png';

export function AppLayout() {
  const navigate = useNavigate();
  const { user, viewingAsUser, setViewingAsUser, logout } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBackToMaster = () => {
    setViewingAsUser(false);
    navigate('/master');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSimulating = user?.role === 'master' || viewingAsUser;
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'US';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
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

      {/* Fixed Premium Header */}
      <header className="bg-[#06242c] text-white border-b border-teal-950/80 h-[76px] flex items-center justify-between px-6 lg:px-10 shrink-0 shadow-md z-20 sticky top-0">
        {/* Left Side: Logo & Subtitle */}
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setSearchQuery('')}>
          <img src={logoImage} alt="Perspecpack Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col text-left">
            <div className="font-sans font-bold text-[20px] tracking-wider leading-none select-none">
              <span className="text-[#c0c0c0]">PERSPEC</span>
              <span className="text-[#00ff00]">PACK</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              Plataforma de Conformidade para Embalagens Industriais
            </span>
          </div>
        </Link>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar componentes, normas, documentos ou checklists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-teal-950/30 border border-teal-900/60 rounded-full text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-[#00F59B] focus:border-[#00F59B] transition-all"
            />
          </div>
        </div>

        {/* Right Side: Profile dropdown */}
        <div className="flex items-center gap-4 shrink-0" ref={dropdownRef}>
          <div className="relative">
            <button 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 bg-teal-950/40 border border-teal-900/50 py-1.5 pl-1.5 pr-2.5 rounded-full hover:bg-teal-950/80 transition-colors shadow-sm select-none"
            >
              <div className="h-8 w-8 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-[#00F59B]/30">
                {userInitials}
              </div>
              <div className="flex flex-col text-left hidden sm:block">
                <span className="text-[12px] font-bold text-slate-200 leading-tight">
                  {user?.role === 'master' ? 'Master Admin' : 'Fornecedor'}
                </span>
                <span className="text-[9px] text-slate-400 leading-none">
                  {user?.email || 'fornecedor@perspecpack.com'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-2 text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário Logado</p>
                  <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                    {user?.role === 'master' ? 'Master Admin (Simulado)' : 'Fornecedor'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'fornecedor@perspecpack.com'}</p>
                </div>

                <div className="py-1">
                  <button 
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Meu Perfil</span>
                  </button>
                  <button 
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Meu Plano</span>
                  </button>
                  <button 
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    <span>Histórico de Downloads</span>
                  </button>
                  <button 
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Configurações</span>
                  </button>
                  <button 
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Ajuda</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </div>
      </main>
    </div>
  );
}
