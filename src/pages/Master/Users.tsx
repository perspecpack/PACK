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
  Loader2,
  Key,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/src/context/AppContext';
import { cn } from '@/lib/utils';

const cleanEnvVar = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

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

export interface UpgradeRequest {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  estimated_users: number | null;
  notes: string | null;
  status: 'novo' | 'em_analise' | 'em_contato' | 'proposta_enviada' | 'aprovado' | 'rejeitado' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const { logPageAccess } = useApp();
  
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  
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

  // Temporary Password State
  const [resettingPasswordUser, setResettingPasswordUser] = useState<DbProfile | null>(null);
  const [generatedTempPassword, setGeneratedTempPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

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

  // Requests Data State
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  
  // Request Modals & Status edit
  const [viewingRequest, setViewingRequest] = useState<UpgradeRequest | null>(null);
  const [editingRequestStatus, setEditingRequestStatus] = useState<UpgradeRequest | null>(null);
  const [newStatus, setNewStatus] = useState<UpgradeRequest['status']>('novo');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      logPageAccess('Master - Gestão de Usuários');
      fetchUsers();
    } else {
      logPageAccess('Master - Solicitações Premium');
      fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setIsRequestsLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabase
        .from('upgrade_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      console.error('Error fetching upgrade requests:', err);
      setErrorMessage('Erro ao carregar solicitações: ' + err.message);
    } finally {
      setIsRequestsLoading(false);
    }
  };

  const handleApproveUpgrade = async (request: UpgradeRequest) => {
    const confirmApprove = window.confirm(`Deseja aprovar o upgrade para Premium para o usuário ${request.contact_name} (${request.company_name})?`);
    if (!confirmApprove) return;
    
    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;
      
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      const premiumUntilVal = oneYear.toISOString().split('T')[0];
      const nowStr = new Date().toISOString();

      // 1. Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          plan_type: 'premium',
          account_status: 'active',
          premium_until: premiumUntilVal,
          updated_at: nowStr
        })
        .eq('user_id', request.user_id);
      
      if (profileError) throw profileError;

      // 2. Update upgrade_requests status to 'aprovado'
      const { error: requestError } = await supabase
        .from('upgrade_requests')
        .update({
          status: 'aprovado',
          updated_at: nowStr
        })
        .eq('id', request.id);
      
      if (requestError) throw requestError;

      alert('Upgrade para Premium aprovado com sucesso!');
      
      // Refresh state
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'aprovado', updated_at: nowStr } : r));
      if (viewingRequest?.id === request.id) {
        setViewingRequest(prev => prev ? { ...prev, status: 'aprovado', updated_at: nowStr } : null);
      }
      // Also sync user in state if loaded
      setUsers(prev => prev.map(u => u.user_id === request.user_id ? { ...u, plan_type: 'premium', account_status: 'active', premium_until: premiumUntilVal } : u));
    } catch (err: any) {
      console.error('Error approving upgrade:', err);
      alert('Erro ao aprovar upgrade: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectRequest = async (request: UpgradeRequest) => {
    const confirmReject = window.confirm(`Deseja rejeitar a solicitação de upgrade de ${request.contact_name} (${request.company_name})?`);
    if (!confirmReject) return;
    
    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;
      const nowStr = new Date().toISOString();

      const { error } = await supabase
        .from('upgrade_requests')
        .update({
          status: 'rejeitado',
          updated_at: nowStr
        })
        .eq('id', request.id);
      
      if (error) throw error;

      alert('Solicitação rejeitada com sucesso.');
      
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'rejeitado', updated_at: nowStr } : r));
      if (viewingRequest?.id === request.id) {
        setViewingRequest(prev => prev ? { ...prev, status: 'rejeitado', updated_at: nowStr } : null);
      }
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert('Erro ao rejeitar solicitação: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveRequestStatus = async () => {
    if (!editingRequestStatus) return;
    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;
      const nowStr = new Date().toISOString();

      const { error } = await supabase
        .from('upgrade_requests')
        .update({
          status: newStatus,
          updated_at: nowStr
        })
        .eq('id', editingRequestStatus.id);

      if (error) throw error;

      // If status is changed to approved, check if we should trigger the flows
      if (newStatus === 'aprovado') {
        // Run profile upgrade as well
        const oneYear = new Date();
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        const premiumUntilVal = oneYear.toISOString().split('T')[0];
        
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            plan_type: 'premium',
            account_status: 'active',
            premium_until: premiumUntilVal,
            updated_at: nowStr
          })
          .eq('user_id', editingRequestStatus.user_id);
        
        if (profileError) throw profileError;
        setUsers(prev => prev.map(u => u.user_id === editingRequestStatus.user_id ? { ...u, plan_type: 'premium', account_status: 'active', premium_until: premiumUntilVal } : u));
      }

      setRequests(prev => prev.map(r => r.id === editingRequestStatus.id ? { ...r, status: newStatus, updated_at: nowStr } : r));
      setEditingRequestStatus(null);
    } catch (err: any) {
      alert('Erro ao atualizar status da solicitação: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_status', 'active')
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
      
      if (status === 'active') {
        const { error } = await supabase.rpc('confirm_user_email_by_admin', {
          target_user_id: userId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .update({ account_status: status })
          .eq('user_id', userId);
        if (error) throw error;
      }
      
      // Update local state
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, account_status: status } : u));
      if (viewingUser?.user_id === userId) {
        setViewingUser(prev => prev ? { ...prev, account_status: status } : null);
      }
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleDeleteUser = async (targetUser: DbProfile) => {
    const confirmDelete = window.confirm(`ATENÇÃO: Tem certeza que deseja excluir permanentemente o usuário ${targetUser.full_name || 'Sem Nome'} (${targetUser.corporate_email}) e todos os seus dados? Esta ação não pode ser desfeita.`);
    if (!confirmDelete) return;

    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      
      const { error } = await supabase.rpc('delete_user_by_admin', {
        target_user_id: targetUser.user_id
      });

      if (error) throw error;

      alert('Usuário excluído com sucesso!');
      
      // Update local state
      setUsers(prev => prev.filter(u => u.user_id !== targetUser.user_id));
      if (viewingUser?.user_id === targetUser.user_id) {
        setViewingUser(null);
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Erro ao excluir usuário: ' + err.message);
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

  const handleGenerateTempPassword = async (targetUser: DbProfile) => {
    const tempPass = `PACK-${Math.floor(1000 + Math.random() * 9000)}`;
    setResettingPasswordUser(targetUser);
    setGeneratedTempPassword(tempPass);
    setPasswordResetSuccess(false);
    setIsResettingPassword(false);
  };

  const handleConfirmPasswordReset = async () => {
    if (!resettingPasswordUser || !generatedTempPassword) return;
    setIsResettingPassword(true);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      
      const { data, error } = await supabase.rpc('reset_user_password_by_admin', {
        target_user_id: resettingPasswordUser.user_id,
        new_plaintext_password: generatedTempPassword
      });

      if (error) throw error;

      setPasswordResetSuccess(true);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      alert('Erro ao redefinir senha: ' + err.message);
    } finally {
      setIsResettingPassword(false);
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
    const masterEmail = cleanEnvVar(import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL || 'perspec03d@gmail.com').toLowerCase();
    if (masterEmail && u.corporate_email?.toLowerCase() === masterEmail) {
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

  const filteredRequests = requests.filter(r => {
    // Exclude master admin from requests list
    const masterEmail = cleanEnvVar(import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL || 'perspec03d@gmail.com').toLowerCase();
    if (masterEmail && r.email?.toLowerCase() === masterEmail) {
      return false;
    }

    // Search filter
    const name = r.contact_name?.toLowerCase() || '';
    const email = r.email?.toLowerCase() || '';
    const company = r.company_name?.toLowerCase() || '';
    const term = requestSearchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || email.includes(term) || company.includes(term);

    // Status filter
    const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;

    return matchesSearch && matchesStatus;
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

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "pb-3.5 text-sm font-bold border-b-2 px-1 transition-all",
              activeTab === 'users'
                ? "border-teal-650 text-teal-650 font-black border-teal-600"
                : "border-transparent text-slate-450 hover:text-slate-700"
            )}
          >
            Lista de Usuários
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              "pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5",
              activeTab === 'requests'
                ? "border-teal-650 text-teal-650 font-black border-teal-600"
                : "border-transparent text-slate-450 hover:text-slate-700"
            )}
          >
            <span>Solicitações Premium</span>
            {requests.filter(r => r.status === 'novo').length > 0 && (
              <span className="bg-amber-500 text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'novo').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
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
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              
              <div className="flex items-center gap-1.5 text-xs text-slate-550">
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
                                className="text-indigo-650 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Generate temp password */}
                              <button
                                onClick={() => handleGenerateTempPassword(profile)}
                                title="Gerar Senha de Acesso Único"
                                className="text-amber-600 hover:text-amber-800 p-1.5 hover:bg-amber-50 rounded-lg transition-all"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleDeleteUser(profile)}
                                title="Excluir Usuário"
                                className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
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
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {/* Requests Filter and search controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Pesquisar por responsável, e-mail ou empresa..." 
                value={requestSearchTerm}
                onChange={(e) => setRequestSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl border-slate-350 shadow-inner"
              />
              {requestSearchTerm && (
                <button onClick={() => setRequestSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              
              <div className="flex items-center gap-1.5 text-xs text-slate-550">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
              </div>

              <select 
                value={requestStatusFilter} 
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="h-9 border border-slate-300 rounded-xl px-3 bg-white text-[11px] font-bold text-slate-600 focus:outline-none shadow-sm"
              >
                <option value="all">Todos</option>
                <option value="novo">Novos</option>
                <option value="em_analise">Em Análise</option>
                <option value="em_contato">Em Contato</option>
                <option value="proposta_enviada">Proposta Enviada</option>
                <option value="aprovado">Aprovados</option>
                <option value="rejeitado">Rejeitados</option>
                <option value="cancelado">Cancelados</option>
              </select>

              <Button 
                onClick={fetchRequests}
                variant="outline"
                className="h-9 px-3 text-[11px] font-bold border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl shadow-sm text-slate-700"
              >
                Atualizar Lista
              </Button>

            </div>

          </div>

          {/* Requests table card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {isRequestsLoading ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-teal-650 mx-auto" />
                <p className="text-xs text-slate-500 mt-2 font-medium">Carregando solicitações de upgrade...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-medium text-xs italic">
                Nenhuma solicitação de upgrade encontrada correspondente aos filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/20 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider select-none">
                      <th className="py-4 px-6">Empresa</th>
                      <th className="py-4 px-6">Responsável</th>
                      <th className="py-4 px-6">E-mail / Telefone</th>
                      <th className="py-4 px-6">Usuários Estimados</th>
                      <th className="py-4 px-6">Data</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right pr-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredRequests.map((req) => {
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                          
                          {/* Company */}
                          <td className="py-3.5 px-6 font-bold text-slate-900 text-[13px]">
                            {req.company_name}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-6 font-semibold text-slate-800">
                            {req.contact_name}
                          </td>

                          {/* Email / Phone */}
                          <td className="py-3.5 px-6">
                            <div className="flex flex-col text-left">
                              <span className="font-mono text-slate-600">{req.email}</span>
                              {req.phone && (
                                <span className="text-slate-450 text-[10.5px] leading-tight font-medium mt-0.5">{req.phone}</span>
                              )}
                            </div>
                          </td>

                          {/* Estimated Users */}
                          <td className="py-3.5 px-6 font-mono text-center sm:text-left">
                            {req.estimated_users !== null ? req.estimated_users : '-'}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-6 font-mono text-slate-505 whitespace-nowrap">
                            {formatDate(req.created_at)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-6">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border",
                              req.status === 'novo'
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : req.status === 'em_analise'
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : req.status === 'em_contato'
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : req.status === 'proposta_enviada'
                                ? "bg-amber-50 text-amber-700 border-amber-250"
                                : req.status === 'aprovado'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : req.status === 'rejeitado'
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-650 border-slate-200"
                            )}>
                              {req.status === 'novo' && 'Novo'}
                              {req.status === 'em_analise' && 'Em Análise'}
                              {req.status === 'em_contato' && 'Em Contato'}
                              {req.status === 'proposta_enviada' && 'Proposta Enviada'}
                              {req.status === 'aprovado' && 'Aprovado'}
                              {req.status === 'rejeitado' && 'Rejeitado'}
                              {req.status === 'cancelado' && 'Cancelado'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-6 text-right pr-6 align-middle">
                            <div className="flex items-center justify-end gap-2.5">
                              
                              {/* View details */}
                              <button
                                onClick={() => setViewingRequest(req)}
                                title="Visualizar Detalhes"
                                className="text-teal-650 hover:text-teal-800 p-1.5 hover:bg-teal-50 rounded-lg transition-all"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </button>

                              {/* Edit status */}
                              <button
                                onClick={() => {
                                  setEditingRequestStatus(req);
                                  setNewStatus(req.status);
                                }}
                                title="Alterar Status"
                                className="text-indigo-650 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Approve Upgrade */}
                              {req.status !== 'aprovado' && (
                                <button
                                  onClick={() => handleApproveUpgrade(req)}
                                  title="Aprovar Upgrade"
                                  className="text-emerald-650 hover:text-emerald-800 p-1.5 hover:bg-emerald-50 rounded-lg transition-all"
                                >
                                  <CheckCircle className="w-4.5 h-4.5" />
                                </button>
                              )}

                              {/* Reject Request */}
                              {req.status !== 'rejeitado' && req.status !== 'aprovado' && (
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  title="Rejeitar Solicitação"
                                  className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Ban className="w-4.5 h-4.5" />
                                </button>
                              )}

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
        </>
      )}

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

                <Button 
                  onClick={() => {
                    handleGenerateTempPassword(viewingUser);
                    setViewingUser(null);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-9 px-4 rounded-xl flex gap-1.5 items-center"
                >
                  <Key className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                  <span>Gerar Senha Temporária</span>
                </Button>
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

      {/* VIEW REQUEST DETAILS MODAL */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[550px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00F59B]" />
                <span>Solicitação de Upgrade Premium</span>
              </h3>
              <button 
                onClick={() => setViewingRequest(null)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">ID da Solicitação</span>
                  <span className="font-mono text-slate-600">{viewingRequest.id}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">ID do Usuário</span>
                  <span className="font-mono text-slate-600">{viewingRequest.user_id}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Empresa</span>
                  <span className="font-bold text-slate-800">{viewingRequest.company_name}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Responsável</span>
                  <span className="font-bold text-slate-800">{viewingRequest.contact_name}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">E-mail</span>
                  <span className="font-mono font-bold text-slate-800 break-all">{viewingRequest.email}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Telefone</span>
                  <span className="font-bold text-slate-800">{viewingRequest.phone || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Quantidade Estimada de Usuários</span>
                  <span className="font-bold text-slate-800">{viewingRequest.estimated_users !== null ? viewingRequest.estimated_users : 'Não especificado'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Status Atual</span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border",
                    viewingRequest.status === 'novo' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    viewingRequest.status === 'em_analise' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                    viewingRequest.status === 'em_contato' ? "bg-purple-50 text-purple-700 border-purple-200" :
                    viewingRequest.status === 'proposta_enviada' ? "bg-amber-50 text-amber-700 border-amber-250" :
                    viewingRequest.status === 'aprovado' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    viewingRequest.status === 'rejeitado' ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-slate-100 text-slate-655 border-slate-200"
                  )}>
                    {viewingRequest.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Criado Em</span>
                  <span className="font-mono text-slate-600">{formatDate(viewingRequest.created_at)}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Última Atualização</span>
                  <span className="font-mono text-slate-600">{formatDate(viewingRequest.updated_at)}</span>
                </div>

                <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block mb-1">Observações</span>
                  <p className="bg-slate-50 border border-slate-200 p-3 rounded-xl leading-relaxed text-slate-700 break-words whitespace-pre-wrap">
                    {viewingRequest.notes || 'Nenhuma observação informada.'}
                  </p>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex gap-2">
                {viewingRequest.status !== 'aprovado' && (
                  <Button 
                    onClick={() => handleApproveUpgrade(viewingRequest)}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl flex gap-1 items-center"
                    disabled={isUpdatingStatus}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aprovar Upgrade</span>
                  </Button>
                )}

                {viewingRequest.status !== 'rejeitado' && viewingRequest.status !== 'aprovado' && (
                  <Button 
                    onClick={() => handleRejectRequest(viewingRequest)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 px-4 rounded-xl flex gap-1 items-center"
                    disabled={isUpdatingStatus}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Rejeitar Solicitação</span>
                  </Button>
                )}
              </div>
              
              <Button
                onClick={() => setViewingRequest(null)}
                variant="outline"
                className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-9 px-5 rounded-xl"
              >
                Fechar
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT REQUEST STATUS MODAL */}
      {editingRequestStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#00F59B]" />
                <span>Alterar Status da Solicitação</span>
              </h3>
              <button 
                onClick={() => setEditingRequestStatus(null)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-750">Selecione o Novo Status</Label>
                <select 
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full h-10 border border-slate-300 rounded-lg px-3 bg-white text-xs text-slate-800 focus:outline-none shadow-sm font-bold"
                >
                  <option value="novo">Novo</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="em_contato">Em Contato</option>
                  <option value="proposta_enviada">Proposta Enviada</option>
                  <option value="aprovado">Aprovado (Efetua o Upgrade)</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              {newStatus === 'aprovado' && (
                <div className="bg-amber-50 border border-amber-250 rounded-xl p-3.5 flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-normal font-medium text-left">
                    <strong>Atenção:</strong> Alterar o status para <strong>Aprovado</strong> ativará imediatamente o plano <strong>PREMIUM</strong> e o status de conta <strong>ATIVO</strong> para o fornecedor.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <Button 
                variant="outline"
                onClick={() => setEditingRequestStatus(null)}
                className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-10 px-5 rounded-xl animate-none"
                disabled={isUpdatingStatus}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveRequestStatus}
                className="bg-teal-650 hover:bg-teal-750 text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
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

      {/* PASSWORD RESET CONFIRMATION MODAL */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col animate-none">
            
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-[#00F59B]" />
                <span>Senha de Acesso Único</span>
              </h3>
              <button 
                onClick={() => setResettingPasswordUser(null)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors cursor-pointer"
                disabled={isResettingPassword}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-left text-xs text-slate-650 leading-relaxed">
              {passwordResetSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-[14px] text-slate-800 text-center">Senha Alterada com Sucesso!</h4>
                    <p className="text-slate-500 text-center">
                      Copie a senha abaixo e envie ao usuário <strong>{resettingPasswordUser.full_name}</strong>:
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 mt-2">
                      <span className="font-mono text-lg font-black text-teal-850 tracking-wider select-all">
                        {generatedTempPassword}
                      </span>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTempPassword);
                          alert('Senha copiada para a área de transferência!');
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 text-[11px] px-3 rounded-lg"
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium text-center">
                      Esta senha permitirá o login único. Oriente o usuário a acessar o menu de perfil e alterá-la imediatamente após entrar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>
                    Você está gerando uma senha temporária de acesso para o usuário <strong>{resettingPasswordUser.full_name}</strong> ({resettingPasswordUser.corporate_email}).
                  </p>
                  <p>
                    A senha atual do usuário será substituída imediatamente no banco de dados da plataforma pela credencial temporária abaixo:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="font-mono text-lg font-black text-teal-850 tracking-wider">
                      {generatedTempPassword}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-250 rounded-xl p-3.5 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-normal font-medium">
                      O usuário poderá utilizar esta nova senha para realizar o login e então acessar seu perfil para redefinir uma senha definitiva própria.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              {passwordResetSuccess ? (
                <Button 
                  onClick={() => setResettingPasswordUser(null)}
                  className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white text-xs font-bold h-10 rounded-xl"
                >
                  Concluir
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setResettingPasswordUser(null)}
                    className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-10 rounded-xl"
                    disabled={isResettingPassword}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmPasswordReset}
                    className="bg-[#0c3944] hover:bg-[#124d5b] text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Definindo...</span>
                      </>
                    ) : (
                      <span>Gerar e Aplicar Senha</span>
                    )}
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
