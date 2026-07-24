import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Search,
  User,
  ChevronDown,
  CreditCard,
  History,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  Layers,
  ShieldCheck,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import logoImage from '@/logo.png';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, viewingAsUser, setViewingAsUser, logout } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const menuItems = [
    { name: 'Visão Geral', path: '/app/visao-geral', icon: LayoutDashboard },
    { name: 'Meus Projetos', path: '/app/projetos', icon: FolderKanban },
    { name: 'Padrões das Organizações', path: '/app/padroes', icon: Layers },
    { name: 'Aprovações', path: '/app/aprovacoes', icon: ShieldCheck },
  ];

  const secondaryItems = [
    { name: 'Configurações', path: '/app/configuracoes', icon: Settings },
    { name: 'Ajuda e Suporte', path: '/app/ajuda', icon: HelpCircle },
  ];

  const handleLogoClick = () => {
    setSearchQuery('');
    setResetTrigger(prev => prev + 1);
  };

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

  const displayName = user?.role === 'master' 
    ? 'Master Admin' 
    : (profile?.companyName || profile?.fullName || 'Fornecedor');

  const getInitials = () => {
    if (user?.role === 'master') return 'MA';
    const name = profile?.companyName || profile?.fullName;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };
  const userInitials = getInitials();
  const companyLogo = (profile?.companyLogoUrl || user?.companyLogoUrl)?.trim();

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
        {/* Hamburger Menu Button for Mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 -ml-2 mr-1 text-slate-300 hover:text-white rounded-lg focus:outline-none cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Left Side: Logo & Subtitle */}
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={handleLogoClick}>
          <img src={logoImage} alt="Perspecpack Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col text-left">
            <div className="font-sans text-[20px] tracking-wider leading-none select-none">
              <span className="font-bold text-[#c0c0c0]">PERSPEC</span>
              <span className="font-normal text-[#00ff00]">PACK</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              Uma nova perspectiva para padrões industriais
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
              <div className="h-8 w-8 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-[#00F59B]/30 overflow-hidden">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="h-full w-full object-contain p-0.5 bg-white" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="flex flex-col text-left hidden sm:block max-w-[180px]">
                <span className="text-[13px] font-bold text-slate-200 leading-none truncate block">
                  {user?.role === 'master' 
                    ? 'Master Admin' 
                    : `${displayName} (${profile?.planType === 'premium' ? 'Premium' : 'Free'})`}
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
                    {user?.role === 'master' ? 'Master Admin (Simulado)' : displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'fornecedor@perspecpack.com'}</p>
                  {user?.role !== 'master' && profile && (
                    <div className="mt-2">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                        profile.planType === 'premium'
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-650 border-slate-200"
                      )}>
                        Plano {profile.planType}
                      </span>
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <Link 
                    to="/app/perfil"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Meu Perfil</span>
                  </Link>
                  <Link 
                    to="/app/meu-plano"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-650 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Meu Plano</span>
                  </Link>
                  <Link 
                    to="/app/historico-downloads"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-650 transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    <span>Histórico de Downloads</span>
                  </Link>
                  <Link 
                    to="/app/ajuda"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-teal-650 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Ajuda</span>
                  </Link>
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

      {/* Sidebar + Main Content Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay Backdrop */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-[#020d11]/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:static flex flex-col bg-[#06242c] text-white border-r border-teal-950/80 transition-all duration-300 ease-in-out shrink-0 h-full",
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            isCollapsed ? "md:w-[76px]" : "md:w-[260px]"
          )}
          style={{ top: isMobileOpen ? '0' : 'auto' }}
        >
          {/* Mobile Sidebar Close Header */}
          <div className="flex items-center justify-between p-4 border-b border-teal-950/80 md:hidden shrink-0">
            <div className="font-sans text-[16px] tracking-wider leading-none select-none">
              <span className="font-bold text-[#c0c0c0]">PERSPEC</span>
              <span className="font-normal text-[#00ff00]">PACK</span>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="p-1 hover:bg-teal-950/40 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Group */}
          <div className="flex-1 py-4 overflow-y-auto space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3.5 px-3.5 py-3.5 mx-3 rounded-xl transition-all duration-200 font-semibold text-[13px] select-none relative",
                    isActive
                      ? "bg-[#0c3741] text-white border border-[#00F59B]/30 shadow-md"
                      : "text-slate-400 hover:bg-[#0c3741]/20 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors shrink-0",
                    isActive ? "text-[#00F59B]" : "text-slate-400 group-hover:text-slate-200"
                  )} />
                  <span className={cn(
                    "transition-opacity duration-200 whitespace-nowrap",
                    isCollapsed ? "md:opacity-0 md:w-0 md:pointer-events-none" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                  
                  {/* Active dot indicator */}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-[#00F59B] rounded-full animate-pulse" />
                  )}
                  {/* Tooltip on hover when collapsed */}
                  {isCollapsed && (
                    <div className="hidden group-hover:block absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 shadow-md border border-slate-800">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}

            {/* Separator / Divider */}
            <div className="px-6 py-3">
              <div className="border-t border-teal-950/80" />
            </div>

            {secondaryItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3.5 px-3.5 py-3.5 mx-3 rounded-xl transition-all duration-200 font-semibold text-[13px] select-none relative",
                    isActive
                      ? "bg-[#0c3741] text-white border border-[#00F59B]/30 shadow-md"
                      : "text-slate-400 hover:bg-[#0c3741]/20 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors shrink-0",
                    isActive ? "text-[#00F59B]" : "text-slate-400 group-hover:text-slate-200"
                  )} />
                  <span className={cn(
                    "transition-opacity duration-200 whitespace-nowrap",
                    isCollapsed ? "md:opacity-0 md:w-0 md:pointer-events-none" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                  
                  {/* Active dot indicator */}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-[#00F59B] rounded-full animate-pulse" />
                  )}
                  {/* Tooltip on hover when collapsed */}
                  {isCollapsed && (
                    <div className="hidden group-hover:block absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 shadow-md border border-slate-800">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Toggle Expand/Collapse Button (Desktop/Tablet) */}
          <div className="p-4 border-t border-teal-950/80 hidden md:block shrink-0">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full py-2.5 bg-teal-950/40 hover:bg-teal-950/80 border border-teal-900/50 rounded-xl flex items-center justify-center transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Recolher Menu</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="w-full mx-auto px-6 md:px-10 lg:px-12 xl:px-14 pt-9 pb-12">
            <Outlet context={{ searchQuery, setSearchQuery, resetTrigger }} />
          </div>
        </main>
      </div>
    </div>
  );
}
