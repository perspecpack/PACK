import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Building2, 
  ShieldCheck, 
  AlertTriangle,
  X,
  Edit2,
  Eye,
  CheckCircle,
  Ban,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/src/context/AppContext';
import { cn } from '@/lib/utils';

interface DbProfile {
  id: string;
  user_id: string;
  full_name: string;
  role_title: string;
  phone: string;
  whatsapp: string;
  corporate_email: string;
  company_name: string;
  cnpj: string;
  company_website: string;
  company_logo_url: string;
  city: string;
  state: string;
  country: string;
  company_type: string;
  company_type_other?: string;
  main_interests: string[];
  main_interest_other?: string;
  profile_completed: boolean;
  account_status: 'active' | 'pending' | 'blocked';
  plan_type: 'free' | 'premium';
  premium_until?: string | null;
  created_at: string;
}

const COMPANY_TYPES = [
  'Montadora / OEM',
  'Fabricante de Embalagens Metálicas',
  'Fabricante de Componentes Automotivos',
  'Fornecedor Tier 1',
  'Integrador Logístico',
  'Empresa de Engenharia',
  'Consultoria Técnica',
  'Outros'
];

const INTERESTS = [
  { id: 'patterns', label: 'Acessar padrões OEM' },
  { id: 'components', label: 'Baixar componentes homologados' },
  { id: 'docs', label: 'Consultar documentação técnica' },
  { id: 'checklists', label: 'Executar checklists de validação' },
  { id: 'reports', label: 'Gerar relatórios de conformidade' },
  { id: 'publish', label: 'Publicar padrões da minha organização' },
  { id: 'other', label: 'Outro' }
];

export default function Users() {
  const { logPageAccess } = useApp();
  
  // Data State
  const [users, setUsers] = useState<DbProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');

  // Modals
  const [viewingUser, setViewingUser] = useState<DbProfile | null>(null);
  const [editingUser, setEditingUser] = useState<DbProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Form Fields
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [companyTypeOther, setCompanyTypeOther] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [mainInterestOther, setMainInterestOther] = useState('');

  useEffect(() => {
    logPageAccess('Master - Gestão de Usuários');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMessage('Erro ao carregar usuários: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'pending' | 'blocked') => {
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('user_profiles')
        .update({ account_status: status })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, account_status: status } : u));
      if (viewingUser?.user_id === userId) {
        setViewingUser(prev => prev ? { ...prev, account_status: status } : null);
      }
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleUpdatePlan = async (userId: string, plan: 'free' | 'premium') => {
    try {
      if (!supabase) return;
      
      let premiumUntilVal = null;
      if (plan === 'premium') {
        const oneYear = new Date();
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        premiumUntilVal = oneYear.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          plan_type: plan,
          premium_until: premiumUntilVal
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan_type: plan, premium_until: premiumUntilVal } : u));
      if (viewingUser?.user_id === userId) {
        setViewingUser(prev => prev ? { ...prev, plan_type: plan, premium_until: premiumUntilVal } : null);
      }
    } catch (err: any) {
      alert('Erro ao atualizar plano: ' + err.message);
    }
  };

  const openEditModal = (profile: DbProfile) => {
    setEditingUser(profile);
    setFullName(profile.full_name || '');
    setRoleTitle(profile.role_title || '');
    setPhone(profile.phone || '');
    setWhatsapp(profile.whatsapp || '');
    setCorporateEmail(profile.corporate_email || '');
    setCompanyName(profile.company_name || '');
    setCnpj(profile.cnpj || '');
    setCompanyWebsite(profile.company_website || '');
    setCompanyLogoUrl(profile.company_logo_url || '');
    setCity(profile.city || '');
    setState(profile.state || '');
    setCountry(profile.country || 'Brasil');
    setCompanyType(profile.company_type || '');
    setCompanyTypeOther(profile.company_type_other || '');
    setSelectedInterests(profile.main_interests || []);
    setMainInterestOther(profile.main_interest_other || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      if (!supabase) return;
      const updatedFields = {
        full_name: fullName.trim(),
        role_title: roleTitle.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        corporate_email: corporateEmail.trim(),
        company_name: companyName.trim(),
        cnpj: cnpj.trim(),
        company_website: companyWebsite.trim(),
        company_logo_url: companyLogoUrl,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        company_type: companyType,
        company_type_other: companyType === 'Outros' ? companyTypeOther.trim() : null,
        main_interests: selectedInterests,
        main_interest_other: selectedInterests.includes('Outro') ? mainInterestOther.trim() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updatedFields)
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? { ...u, ...updatedFields } : u));
      setEditingUser(null);
    } catch (err: any) {
      alert('Erro ao salvar edições: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInterestToggle = (interestLabel: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestLabel)
        ? prev.filter(i => i !== interestLabel)
        : [...prev, interestLabel]
    );
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.substring(0, 14);
    
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
    }
    setCnpj(value);
  };

  const filteredUsers = users.filter(u => {
    // Exclude master admin from users list
    const masterEmail = import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL;
    if (masterEmail && u.corporate_email?.toLowerCase() === masterEmail.toLowerCase()) {
      return false;
    }

    // Search filter
    const name = u.full_name?.toLowerCase() || '';
    const email = u.corporate_email?.toLowerCase() || '';
    const company = u.company_name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || email.includes(term) || company.includes(term);

    // Plan Filter
    const matchesPlan = planFilter === 'all' || u.plan_type === planFilter;

    // Status Filter
    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and search controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Pesquisar por nome, e-mail ou empresa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl border-slate-350 shadow-inner"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtros:</span>
          </div>

          {/* Plan filter */}
          <select 
            value={planFilter} 
            onChange={(e: any) => setPlanFilter(e.target.value)}
            className="h-9 border border-slate-300 rounded-xl px-3 bg-white text-[11px] font-bold text-slate-600 focus:outline-none shadow-sm"
          >
            <option value="all">Todos os Planos</option>
            <option value="free">Plano FREE</option>
            <option value="premium">Plano PREMIUM</option>
          </select>

          {/* Status filter */}
          <select 
            value={statusFilter} 
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-9 border border-slate-300 rounded-xl px-3 bg-white text-[11px] font-bold text-slate-600 focus:outline-none shadow-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="pending">Pendente</option>
            <option value="blocked">Bloqueado</option>
          </select>

          <Button 
            onClick={fetchUsers}
            variant="outline"
            className="h-9 px-3 text-[11px] font-bold border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl shadow-sm text-slate-700"
          >
            Atualizar Lista
          </Button>

        </div>

      </div>

      {/* Users table card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-650 mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Carregando perfis de usuários...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium text-xs italic">
            Nenhum usuário encontrado correspondente aos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <th className="py-4 px-6">Nome / Cargo</th>
                  <th className="py-4 px-6">Empresa / CNPJ</th>
                  <th className="py-4 px-6">Plano</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Data de Cadastro</th>
                  <th className="py-4 px-6 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.map((profile) => {
                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/40 transition-colors">
                      
                      {/* Name / Email */}
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 text-[13px]">{profile.full_name || 'Sem Nome'}</span>
                          <span className="text-slate-500 text-[11px] leading-tight font-medium mt-0.5">{profile.corporate_email}</span>
                          <span className="text-[9.5px] text-slate-400 font-medium italic mt-0.5">{profile.role_title || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-800">{profile.company_name || 'N/A'}</span>
                          <span className="text-slate-400 text-[11px] leading-tight font-mono">{profile.cnpj || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500 font-semibold mt-0.5">{profile.company_type}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col text-left gap-1">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border w-fit",
                            profile.plan_type === 'premium'
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-650 border-slate-200"
                          )}>
                            {profile.plan_type}
                          </span>
                          {profile.plan_type === 'premium' && (
                            <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-350" />
                              <span>{formatDate(profile.premium_until)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border",
                          profile.account_status === 'active'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : profile.account_status === 'pending'
                            ? "bg-amber-50 text-amber-700 border-amber-250"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {profile.account_status === 'active' && 'Ativo'}
                          {profile.account_status === 'pending' && 'Pendente'}
                          {profile.account_status === 'blocked' && 'Bloqueado'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-6 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(profile.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right pr-6 align-middle">
                        <div className="flex items-center justify-end gap-2.5">
                          
                          {/* Plan toggling */}
                          {profile.plan_type === 'premium' ? (
                            <button
                              onClick={() => handleUpdatePlan(profile.user_id, 'free')}
                              title="Alterar para Plano FREE"
                              className="text-slate-450 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                            >
                              <Sparkles className="w-4.5 h-4.5 text-slate-400" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdatePlan(profile.user_id, 'premium')}
                              title="Alterar para Plano PREMIUM"
                              className="text-amber-550 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                            </button>
                          )}

                          {/* Block/Activate */}
                          {profile.account_status === 'active' ? (
                            <button
                              onClick={() => handleUpdateStatus(profile.user_id, 'blocked')}
                              title="Bloquear Usuário"
                              className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Ban className="w-4.5 h-4.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(profile.user_id, 'active')}
                              title="Ativar Usuário"
                              className="text-emerald-600 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => setViewingUser(profile)}
                            title="Visualizar Perfil Completo"
                            className="text-teal-650 hover:text-teal-800 p-1.5 hover:bg-teal-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>

                          {/* Edit details */}
                          <button
                            onClick={() => openEditModal(profile)}
                            title="Editar Perfil"
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW PROFILE MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[620px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-[#00F59B]" />
                <span>Perfil de {viewingUser.full_name || 'Usuário'}</span>
              </h3>
              <button 
                onClick={() => setViewingUser(null)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-5 border-b border-slate-100">
                {viewingUser.company_logo_url ? (
                  <div className="border border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center h-20 w-36 shadow-inner shrink-0 select-none">
                    <img src={viewingUser.company_logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="w-36 h-20 border border-dashed border-slate-350 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-slate-400 shrink-0 select-none">
                    <Building2 className="w-6 h-6 text-slate-350" />
                    <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Sem Logo</span>
                  </div>
                )}
                <div className="text-center sm:text-left space-y-1.5 flex-1 w-full">
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{viewingUser.full_name || 'Sem Nome Cadastrado'}</h4>
                  <p className="text-xs font-bold text-slate-500">{viewingUser.role_title || 'Sem Cargo'}</p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border",
                      viewingUser.plan_type === 'premium'
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-655 border-slate-200"
                    )}>
                      Plano {viewingUser.plan_type}
                    </span>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border",
                      viewingUser.account_status === 'active'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {viewingUser.account_status === 'active' ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">E-mail Corporativo</span>
                  <span className="font-bold text-slate-800 break-all">{viewingUser.corporate_email}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Telefone</span>
                  <span className="font-bold text-slate-800">{viewingUser.phone || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">WhatsApp</span>
                  <span className="font-bold text-slate-800">{viewingUser.whatsapp || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Empresa</span>
                  <span className="font-bold text-slate-800">{viewingUser.company_name || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">CNPJ</span>
                  <span className="font-mono font-bold text-slate-700">{viewingUser.cnpj || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Site Oficial</span>
                  {viewingUser.company_website ? (
                    <a 
                      href={viewingUser.company_website.startsWith('http') ? viewingUser.company_website : `https://${viewingUser.company_website}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="font-bold text-teal-650 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{viewingUser.company_website}</span>
                    </a>
                  ) : (
                    <span className="font-bold text-slate-400">N/A</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Localização</span>
                  <span className="font-bold text-slate-800">
                    {viewingUser.city || 'N/A'}, {viewingUser.state || 'N/A'} — {viewingUser.country || 'N/A'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Tipo de Empresa</span>
                  <span className="font-bold text-slate-850">
                    {viewingUser.company_type === 'Outros' 
                      ? `Outros (${viewingUser.company_type_other || ''})` 
                      : viewingUser.company_type || 'N/A'}
                  </span>
                </div>

                <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block mb-1">Interesses Principais</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingUser.main_interests && viewingUser.main_interests.length > 0 ? (
                      viewingUser.main_interests.map((interest, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-650 px-2 py-1 rounded-lg font-semibold text-[10.5px]">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 font-medium italic">Nenhum interesse selecionado.</span>
                    )}
                    {viewingUser.main_interest_other && (
                      <span className="bg-teal-50 border border-teal-150 text-teal-900 px-2 py-1 rounded-lg font-bold text-[10.5px]">
                        Outro: {viewingUser.main_interest_other}
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex gap-2">
                {viewingUser.plan_type === 'premium' ? (
                  <Button 
                    onClick={() => handleUpdatePlan(viewingUser.user_id, 'free')}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold h-9 px-4 rounded-xl"
                  >
                    Mudar para FREE
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpdatePlan(viewingUser.user_id, 'premium')}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-9 px-4 rounded-xl flex gap-1 items-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Mudar para PREMIUM</span>
                  </Button>
                )}

                {viewingUser.account_status === 'active' ? (
                  <Button 
                    onClick={() => handleUpdateStatus(viewingUser.user_id, 'blocked')}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 px-4 rounded-xl"
                  >
                    Bloquear Usuário
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpdateStatus(viewingUser.user_id, 'active')}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl"
                  >
                    Ativar Usuário
                  </Button>
                )}
              </div>
              <Button
                onClick={() => setViewingUser(null)}
                variant="outline"
                className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-9 px-5 rounded-xl"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[680px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#00F59B]" />
                <span>Editar Perfil de {editingUser.full_name || 'Usuário'}</span>
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-left">
              
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-[12px] text-teal-650 uppercase tracking-wider border-b border-slate-100 pb-1.5">1. Dados Pessoais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Nome Completo</Label>
                    <Input 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Cargo / Função</Label>
                    <Input 
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Telefone</Label>
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">WhatsApp</Label>
                    <Input 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-750">E-mail Corporativo</Label>
                    <Input 
                      value={corporateEmail}
                      onChange={(e) => setCorporateEmail(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-[12px] text-teal-650 uppercase tracking-wider border-b border-slate-100 pb-1.5">2. Dados da Empresa</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Nome da Empresa</Label>
                    <Input 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">CNPJ da Empresa</Label>
                    <Input 
                      value={cnpj}
                      onChange={handleCnpjChange}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Site Oficial</Label>
                    <Input 
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Cidade</Label>
                    <Input 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Estado</Label>
                    <Input 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">País</Label>
                    <Input 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-750">URL do Logotipo da Empresa</Label>
                    <Input 
                      value={companyLogoUrl}
                      onChange={(e) => setCompanyLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-10 text-xs rounded-lg border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Company Type */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-[12px] text-teal-650 uppercase tracking-wider border-b border-slate-100 pb-1.5">3. Tipo de Empresa</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-750">Selecione o Tipo de Organização</Label>
                    <select 
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 bg-white text-xs text-slate-800 focus:outline-none shadow-sm"
                    >
                      <option value="">Selecione uma opção...</option>
                      {COMPANY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {companyType === 'Outros' && (
                    <div className="space-y-1.5 animate-in fade-in duration-250">
                      <Label className="text-[11px] font-bold text-slate-750">Descreva o tipo da empresa</Label>
                      <Input 
                        value={companyTypeOther}
                        onChange={(e) => setCompanyTypeOther(e.target.value)}
                        className="h-10 text-xs rounded-lg border-slate-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-[12px] text-teal-650 uppercase tracking-wider border-b border-slate-100 pb-1.5">4. Interesse Principal na Plataforma</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {INTERESTS.map(item => {
                      const isSelected = selectedInterests.includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInterestToggle(item.label)}
                          className={cn(
                            "flex items-center gap-2 border rounded-xl p-3 text-xs text-left font-medium transition-all shadow-sm",
                            isSelected
                              ? "bg-teal-55 bg-teal-50 border-teal-400 text-teal-950 font-bold"
                              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50/50"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                            isSelected ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"
                          )}>
                            {isSelected && <span className="text-[9px] font-black">&#10003;</span>}
                          </div>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedInterests.includes('Outro') && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <Label className="text-[11px] font-bold text-slate-750">Descreva o seu interesse</Label>
                      <Input 
                        value={mainInterestOther}
                        onChange={(e) => setMainInterestOther(e.target.value)}
                        className="h-10 text-xs rounded-lg border-slate-300"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <Button 
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-10 px-5 rounded-xl"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit}
                className="bg-teal-650 hover:bg-teal-700 text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
