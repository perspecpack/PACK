import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Eye, 
  CheckCircle, 
  Ban, 
  Trash2, 
  X, 
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DbProfile {
  id: string;
  user_id: string;
  full_name: string;
  role_title: string;
  phone: string;
  corporate_email: string;
  company_name: string;
  cnpj?: string;
  company_website?: string;
  company_logo_url?: string;
  city?: string;
  state?: string;
  country?: string;
  company_type?: string;
  profile_completed: boolean;
  account_status: string;
  user_status: 'pending' | 'active' | 'rejected';
  created_at: string;
}

export default function RegistrationRequests() {
  const [requests, setRequests] = useState<DbProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modal states
  const [viewingRequest, setViewingRequest] = useState<DbProfile | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as DbProfile[]) || []);
    } catch (err: any) {
      console.error('Error fetching registration requests:', err);
      setErrorMessage('Erro ao carregar solicitações: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (targetUser: DbProfile) => {
    const confirmApprove = window.confirm(`Deseja aprovar o acesso do usuário ${targetUser.full_name || 'Sem Nome'}?`);
    if (!confirmApprove) return;

    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;

      const nowStr = new Date().toISOString();
      const { error } = await supabase
        .from('user_profiles')
        .update({
          user_status: 'active',
          account_status: 'active',
          updated_at: nowStr
        })
        .eq('user_id', targetUser.user_id);

      if (error) throw error;

      alert('Usuário aprovado com sucesso.');
      
      // Update local state
      setRequests(prev => prev.filter(r => r.user_id !== targetUser.user_id));
      setViewingRequest(null);
    } catch (err: any) {
      console.error('Error approving user:', err);
      alert('Erro ao aprovar usuário: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReject = async (targetUser: DbProfile) => {
    const confirmReject = window.confirm(`Deseja rejeitar a solicitação do usuário ${targetUser.full_name || 'Sem Nome'}?`);
    if (!confirmReject) return;

    setIsUpdatingStatus(true);
    try {
      if (!supabase) return;

      const nowStr = new Date().toISOString();
      const { error } = await supabase
        .from('user_profiles')
        .update({
          user_status: 'rejected',
          account_status: 'blocked',
          updated_at: nowStr
        })
        .eq('user_id', targetUser.user_id);

      if (error) throw error;

      alert('Solicitação rejeitada.');
      
      // Update local state to reflect new status if still in list
      setRequests(prev => prev.map(r => r.user_id === targetUser.user_id ? { ...r, user_status: 'rejected', account_status: 'blocked' } : r));
      setViewingRequest(prev => prev?.user_id === targetUser.user_id ? { ...prev, user_status: 'rejected', account_status: 'blocked' } : prev);
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert('Erro ao rejeitar solicitação: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (targetUser: DbProfile) => {
    const confirmDelete = window.confirm(`ATENÇÃO: Tem certeza que deseja excluir permanentemente a solicitação e a conta do usuário ${targetUser.full_name || 'Sem Nome'} (${targetUser.corporate_email})? Esta ação não pode ser desfeita.`);
    if (!confirmDelete) return;

    setIsUpdatingStatus(true);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      
      const { error } = await supabase.rpc('delete_user_by_admin', {
        target_user_id: targetUser.user_id
      });

      if (error) throw error;

      alert('Solicitação excluída com sucesso!');
      
      // Update local state
      setRequests(prev => prev.filter(r => r.user_id !== targetUser.user_id));
      setViewingRequest(null);
    } catch (err: any) {
      console.error('Error deleting request:', err);
      alert('Erro ao excluir solicitação: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-left">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Solicitações de Cadastro</h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Gerencie novos pedidos de acesso. Aprove ou rejeite solicitações de usuários corporativos.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-250 text-rose-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

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
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12 pl-6">Nome</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Empresa</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Cargo</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">E-mail</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Telefone</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Data</TableHead>
                <TableHead className="text-[11.5px] font-bold text-slate-600 uppercase h-12">Status</TableHead>
                <TableHead className="text-right text-[11.5px] font-bold text-slate-600 uppercase h-12 pr-6 w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center text-slate-400 font-medium">
                    Nenhuma solicitação pendente ou rejeitada no momento.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 align-middle font-bold text-slate-900">{req.full_name || 'Sem nome'}</TableCell>
                    <TableCell className="align-middle text-slate-700 font-semibold">{req.company_name || 'N/A'}</TableCell>
                    <TableCell className="align-middle text-slate-600">{req.role_title || 'N/A'}</TableCell>
                    <TableCell className="align-middle text-slate-600 font-mono text-[11px]">{req.corporate_email}</TableCell>
                    <TableCell className="align-middle text-slate-600">{req.phone || 'N/A'}</TableCell>
                    <TableCell className="align-middle text-slate-500 text-[11px] whitespace-nowrap">{formatDate(req.created_at)}</TableCell>
                    <TableCell className="align-middle">
                      <Badge className={
                        req.user_status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                      }>
                        {req.user_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle text-right pr-6 space-x-1">
                      <Button
                        onClick={() => setViewingRequest(req)}
                        size="sm"
                        variant="ghost"
                        title="Visualizar Cadastro"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-teal-650 hover:bg-teal-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {req.user_status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprove(req)}
                            size="sm"
                            variant="ghost"
                            title="Aprovar Usuário"
                            className="h-8 w-8 p-0 text-emerald-650 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleReject(req)}
                            size="sm"
                            variant="ghost"
                            title="Rejeitar Solicitação"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        onClick={() => handleDelete(req)}
                        size="sm"
                        variant="ghost"
                        title="Excluir Solicitação"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-650 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                <User className="w-5 h-5 text-[#00F59B]" />
                <span>Dados de {viewingRequest.full_name || 'Cadastro'}</span>
              </h3>
              <button 
                onClick={() => setViewingRequest(null)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors cursor-pointer"
                disabled={isUpdatingStatus}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-left overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Nome Completo</span>
                  <span className="font-bold text-slate-800 text-[13px]">{viewingRequest.full_name || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Empresa</span>
                  <span className="font-bold text-slate-800 text-[13px]">{viewingRequest.company_name || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Cargo / Função</span>
                  <span className="font-semibold text-slate-700">{viewingRequest.role_title || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">E-mail</span>
                  <span className="font-mono font-bold text-slate-700 break-all">{viewingRequest.corporate_email}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Telefone / WhatsApp</span>
                  <span className="font-semibold text-slate-700">{viewingRequest.phone || 'N/A'}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Data de Cadastro</span>
                  <span className="font-semibold text-slate-600">{formatDate(viewingRequest.created_at)}</span>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Status</span>
                  <span className="block mt-0.5">
                    <Badge className={
                      viewingRequest.user_status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-250 font-bold'
                        : 'bg-rose-50 text-rose-700 border border-rose-250 font-bold'
                    }>
                      {viewingRequest.user_status === 'pending' ? 'Aguardando Aprovação' : 'Solicitação Rejeitada'}
                    </Badge>
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleApprove(viewingRequest)}
                  className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold h-10 px-4 rounded-xl flex gap-1.5 items-center shadow-sm"
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>Aprovar Usuário</span>
                </Button>

                {viewingRequest.user_status === 'pending' && (
                  <Button 
                    onClick={() => handleReject(viewingRequest)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-10 px-4 rounded-xl flex gap-1.5 items-center shadow-sm"
                    disabled={isUpdatingStatus}
                  >
                    <Ban className="w-4.5 h-4.5" />
                    <span>Rejeitar</span>
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
