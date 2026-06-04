import React, { useState, useEffect } from 'react';
import { 
  Key, 
  User, 
  Building2, 
  Eye, 
  CheckCircle, 
  Ban, 
  X, 
  AlertTriangle,
  Loader2,
  Calendar,
  Phone,
  Copy,
  Check,
  Search,
  MessageSquare,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResetRequest {
  id: string;
  user_id: string;
  email: string;
  preferred_contact: 'whatsapp' | 'email';
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  temporary_password?: string | null;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  created_at: string;
  updated_at: string;
  // Merged profile info
  full_name?: string;
  company_name?: string;
  phone?: string;
  whatsapp?: string;
}

export default function PasswordResets() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filtering and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'cancelled'>('all');

  // Modal states
  const [viewingRequest, setViewingRequest] = useState<ResetRequest | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      
      // 1. Fetch password reset requests
      const { data: reqData, error: reqErr } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (reqErr) throw reqErr;

      const requestsList = (reqData as ResetRequest[]) || [];

      if (requestsList.length > 0) {
        // 2. Fetch profiles for user mapping
        const userIds = Array.from(new Set(requestsList.map(r => r.user_id)));
        const { data: profData, error: profErr } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, company_name, phone, whatsapp')
          .in('user_id', userIds);

        if (!profErr && profData) {
          // Merge profiles
          const profilesMap = new Map<string, any>(profData.map((p: any) => [p.user_id, p]));
          requestsList.forEach(req => {
            const prof = profilesMap.get(req.user_id);
            if (prof) {
              req.full_name = prof.full_name;
              req.company_name = prof.company_name;
              req.phone = prof.phone;
              req.whatsapp = prof.whatsapp;
            }
          });
        }
      }

      setRequests(requestsList);
    } catch (err: any) {
      console.error('Error fetching password resets:', err);
      setErrorMessage('Erro ao carregar solicitações de recuperação: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const generateTempPassword = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const getRandChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
    
    const l1 = getRandChar(letters);
    const l2 = getRandChar(letters);
    const l3 = getRandChar(letters);
    const n1 = getRandChar(numbers);
    const n2 = getRandChar(numbers);
    const n3 = getRandChar(numbers);
    const n4 = getRandChar(numbers);
    const l4 = getRandChar(letters);
    
    return `${l1}${l2}${l3}#${n1}${n2}${n3}${n4}${l4}`;
  };

  const handleGenerateTempPassword = async (req: ResetRequest) => {
    const confirmGen = window.confirm(`Deseja gerar uma senha temporária para o usuário ${req.full_name || req.email}?`);
    if (!confirmGen) return;

    setIsUpdatingStatus(true);
    const tempPassword = generateTempPassword();

    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');

      // 1. Update the user password in Auth via RPC
      const { error: rpcError } = await supabase.rpc('reset_user_password_by_admin', {
        target_user_id: req.user_id,
        new_plaintext_password: tempPassword
      });

      if (rpcError) throw rpcError;

      // 2. Update status of request in password_reset_requests
      const nowStr = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'approved',
          temporary_password: tempPassword,
          processed_at: nowStr,
          processed_by: 'Master Admin',
          updated_at: nowStr
        })
        .eq('id', req.id);

      if (updateErr) throw updateErr;

      alert(`Senha temporária gerada com sucesso: ${tempPassword}\n\nEnvie este código ao usuário.`);
      
      // Refresh local state
      setRequests(prev => prev.map(r => r.id === req.id ? { 
        ...r, 
        status: 'approved', 
        temporary_password: tempPassword, 
        processed_at: nowStr, 
        processed_by: 'Master Admin' 
      } : r));

      // Update viewing request if open
      setViewingRequest(prev => prev?.id === req.id ? { 
        ...prev, 
        status: 'approved', 
        temporary_password: tempPassword, 
        processed_at: nowStr, 
        processed_by: 'Master Admin' 
      } : prev);

    } catch (err: any) {
      console.error('Error generating temporary password:', err);
      alert('Erro ao gerar senha temporária: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelRequest = async (req: ResetRequest) => {
    const confirmCancel = window.confirm(`Deseja cancelar esta solicitação de recuperação de senha?`);
    if (!confirmCancel) return;

    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;

      const nowStr = new Date().toISOString();
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'cancelled',
          processed_at: nowStr,
          processed_by: 'Master Admin',
          updated_at: nowStr
        })
        .eq('id', req.id);

      if (error) throw error;

      alert('Solicitação cancelada com sucesso.');
      
      setRequests(prev => prev.map(r => r.id === req.id ? { 
        ...r, 
        status: 'cancelled', 
        processed_at: nowStr, 
        processed_by: 'Master Admin' 
      } : r));

      setViewingRequest(prev => prev?.id === req.id ? { 
        ...prev, 
        status: 'cancelled', 
        processed_at: nowStr, 
        processed_by: 'Master Admin' 
      } : prev);

    } catch (err: any) {
      console.error('Error cancelling request:', err);
      alert('Erro ao cancelar solicitação: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkAsCompleted = async (req: ResetRequest) => {
    const confirmComplete = window.confirm(`Deseja marcar esta solicitação como concluída?`);
    if (!confirmComplete) return;

    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;

      const nowStr = new Date().toISOString();
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'completed',
          processed_at: nowStr,
          processed_by: 'Master Admin',
          updated_at: nowStr
        })
        .eq('id', req.id);

      if (error) throw error;

      alert('Solicitação marcada como concluída.');
      
      setRequests(prev => prev.map(r => r.id === req.id ? { 
        ...r, 
        status: 'completed', 
        processed_at: nowStr, 
        processed_by: 'Master Admin' 
      } : r));

      setViewingRequest(prev => prev?.id === req.id ? { 
        ...prev, 
        status: 'completed', 
        processed_at: nowStr, 
        processed_by: 'Master Admin' 
      } : prev);

    } catch (err: any) {
      console.error('Error completing request:', err);
      alert('Erro ao concluir solicitação: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  };

  // Filter & Search Logic
  const filteredRequests = requests.filter(req => {
    const name = (req.full_name || '').toLowerCase();
    const email = (req.email || '').toLowerCase();
    const company = (req.company_name || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = name.includes(query) || email.includes(query) || company.includes(query);
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-left">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Recuperação de Senha</h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Controle de acesso. Analise pedidos de recuperação de senha, gere senhas temporárias de uso único e monitore o status de redefinições.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-250 text-rose-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-250 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500 placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* Tabs Filter */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto gap-0.5">
          {(['all', 'pending', 'approved', 'completed', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === f 
                  ? 'bg-[#06242c] text-[#00F59B] shadow-sm' 
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              {f === 'all' && 'Todos'}
              {f === 'pending' && 'Pendentes'}
              {f === 'approved' && 'Aprovadas'}
              {f === 'completed' && 'Redefinidas'}
              {f === 'cancelled' && 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3.5">
            <Loader2 className="w-8 h-8 text-teal-650 animate-spin" />
            <span className="text-slate-400 text-xs font-semibold">Carregando solicitações...</span>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12 pl-6">Data Solicitação</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Nome</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Empresa</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">E-mail</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Telefone</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Canal Preferencial</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Status</TableHead>
                <TableHead className="text-right text-[11.5px] font-bold text-slate-600 uppercase h-12 pr-6 w-[180px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center text-slate-400 font-medium">
                    Nenhuma solicitação encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 align-middle text-slate-500 text-[11px] whitespace-nowrap">{formatDate(req.requested_at)}</TableCell>
                    <TableCell className="align-middle font-bold text-slate-900">{req.full_name || 'Sem nome'}</TableCell>
                    <TableCell className="align-middle text-slate-700 font-semibold">{req.company_name || 'N/A'}</TableCell>
                    <TableCell className="align-middle text-slate-600 font-mono text-[11px]">{req.email}</TableCell>
                    <TableCell className="align-middle text-slate-600">{req.phone || 'N/A'}</TableCell>
                    <TableCell className="align-middle text-center">
                      <Badge className={
                        req.preferred_contact === 'whatsapp'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold inline-flex items-center gap-1'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-250 font-bold inline-flex items-center gap-1'
                      }>
                        {req.preferred_contact === 'whatsapp' ? (
                          <MessageSquare className="w-3 h-3" />
                        ) : (
                          <Mail className="w-3 h-3" />
                        )}
                        <span className="capitalize">{req.preferred_contact}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge className={
                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' :
                        req.status === 'approved' ? 'bg-sky-50 text-sky-700 border border-sky-200 font-bold animate-pulse' :
                        req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' :
                        'bg-slate-50 text-slate-600 border border-slate-200 font-semibold'
                      }>
                        {req.status === 'pending' && 'Pendente'}
                        {req.status === 'approved' && 'Aprovado'}
                        {req.status === 'completed' && 'Concluído'}
                        {req.status === 'cancelled' && 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle text-right pr-6 space-x-1">
                      <Button
                        onClick={() => setViewingRequest(req)}
                        size="sm"
                        variant="ghost"
                        title="Visualizar Detalhes"
                        className="h-8 w-8 p-0 text-slate-550 hover:text-teal-650 hover:bg-teal-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {req.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleGenerateTempPassword(req)}
                            size="sm"
                            variant="ghost"
                            title="Gerar Senha Temporária"
                            className="h-8 w-8 p-0 text-amber-650 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleCancelRequest(req)}
                            size="sm"
                            variant="ghost"
                            title="Cancelar Solicitação"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {req.status === 'approved' && (
                        <>
                          <Button
                            onClick={() => handleMarkAsCompleted(req)}
                            size="sm"
                            variant="ghost"
                            title="Marcar como Concluído"
                            className="h-8 w-8 p-0 text-emerald-650 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleCancelRequest(req)}
                            size="sm"
                            variant="ghost"
                            title="Cancelar Solicitação"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* DETAIL MODAL */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-[#00F59B]" />
                <span>Solicitação de Acesso</span>
              </h3>
              <button 
                onClick={() => setViewingRequest(null)}
                className="text-slate-350 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors cursor-pointer"
                disabled={isUpdatingStatus}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-left overflow-y-auto">
              <div className="space-y-4">
                
                {/* Profile Information */}
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">Dados do Usuário</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">Nome Completo</span>
                      <span className="font-bold text-slate-800 text-[12.5px]">{viewingRequest.full_name || 'Sem nome'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">Empresa</span>
                      <span className="font-bold text-slate-800 text-[12.5px]">{viewingRequest.company_name || 'N/A'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">E-mail Cadastrado</span>
                      <span className="font-mono text-slate-700 font-semibold">{viewingRequest.email}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">Telefone</span>
                      <span className="font-semibold text-slate-700">{viewingRequest.phone || viewingRequest.whatsapp || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Reset Request Information */}
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">Detalhes da Solicitação</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">Canal Preferencial</span>
                      <span className="font-bold text-slate-800 text-[11.5px] capitalize">{viewingRequest.preferred_contact}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">Data Solicitação</span>
                      <span className="font-semibold text-slate-700">{formatDate(viewingRequest.requested_at)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 block">Status da Recuperação</span>
                      <span className="block mt-0.5">
                        <Badge className={
                          viewingRequest.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-250 font-bold' :
                          viewingRequest.status === 'approved' ? 'bg-sky-50 text-sky-700 border border-sky-250 font-bold' :
                          viewingRequest.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold' :
                          'bg-slate-50 text-slate-600 border border-slate-200 font-semibold'
                        }>
                          {viewingRequest.status === 'pending' && 'Pendente'}
                          {viewingRequest.status === 'approved' && 'Aprovado (Senha Ativa)'}
                          {viewingRequest.status === 'completed' && 'Concluído'}
                          {viewingRequest.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </span>
                    </div>
                    {viewingRequest.processed_at && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 block">Processado em</span>
                        <span className="font-semibold text-slate-600">{formatDate(viewingRequest.processed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Temporary Password Actions / Display */}
                {viewingRequest.status === 'approved' && viewingRequest.temporary_password && (
                  <div className="bg-sky-50/50 border border-sky-200/60 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Senha Temporária Ativa</span>
                    <div className="flex items-center justify-between bg-white border border-sky-200 p-2.5 rounded-lg">
                      <span className="font-mono text-base font-extrabold text-[#0c3944] tracking-widest">{viewingRequest.temporary_password}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyToClipboard(viewingRequest.temporary_password!, viewingRequest.id)}
                        className="h-8 text-sky-750 hover:bg-sky-100 flex items-center gap-1 text-[11px]"
                      >
                        {copiedId === viewingRequest.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-650" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-sky-750 font-medium pt-1">
                      Atenção: Esta senha é de uso único e possui validade de 24 horas a partir da geração. Envie-a manualmente pelo {viewingRequest.preferred_contact === 'whatsapp' ? 'WhatsApp' : 'E-mail'} do usuário.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
              <div className="flex gap-2">
                {viewingRequest.status === 'pending' && (
                  <Button 
                    onClick={() => handleGenerateTempPassword(viewingRequest)}
                    className="bg-amber-650 hover:bg-amber-700 text-white text-xs font-bold h-10 px-4 rounded-xl flex gap-1.5 items-center shadow-sm"
                    disabled={isUpdatingStatus}
                  >
                    <Key className="w-4 h-4" />
                    <span>Gerar Senha</span>
                  </Button>
                )}

                {viewingRequest.status === 'approved' && (
                  <Button 
                    onClick={() => handleMarkAsCompleted(viewingRequest)}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold h-10 px-4 rounded-xl flex gap-1.5 items-center shadow-sm"
                    disabled={isUpdatingStatus}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Concluir</span>
                  </Button>
                )}

                {(viewingRequest.status === 'pending' || viewingRequest.status === 'approved') && (
                  <Button 
                    onClick={() => handleCancelRequest(viewingRequest)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-10 px-4 rounded-xl flex gap-1.5 items-center shadow-sm"
                    disabled={isUpdatingStatus}
                  >
                    <Ban className="w-4 h-4" />
                    <span>Cancelar</span>
                  </Button>
                )}
              </div>
              
              <Button
                onClick={() => setViewingRequest(null)}
                variant="outline"
                className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-10 px-5 rounded-xl"
                disabled={isUpdatingStatus}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
