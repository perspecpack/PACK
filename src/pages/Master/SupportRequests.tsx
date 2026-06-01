import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  MessageSquare, 
  Archive, 
  Check, 
  Clock, 
  AlertCircle, 
  Search,
  Loader2,
  Calendar,
  User,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/src/context/AppContext';
import { supabase } from '@/lib/supabase';
import { SupportRequest } from '@/src/types';
import { cn } from '@/lib/utils';

type FilterType = 'todos' | 'novo' | 'em_analise' | 'em_atendimento' | 'concluido' | 'arquivado';

export default function SupportRequests() {
  const { updateSupportRequest, logPageAccess } = useApp();
  
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals/Detail State
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  
  // Reply State
  const [responseText, setResponseText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      if (!supabase) return;
      const { data: reqs, error: reqsErr } = await supabase
        .from('support_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (reqsErr) throw reqsErr;
      
      const userIds = reqs ? reqs.map(r => r.user_id).filter(Boolean) : [];
      if (userIds.length > 0) {
        const { data: profs, error: profsErr } = await supabase
          .from('user_profiles')
          .select('user_id, corporate_email, company_name')
          .in('user_id', userIds);
        if (profsErr) throw profsErr;
        
        const merged = reqs.map(r => {
          const prof = profs.find(p => p.user_id === r.user_id);
          return {
            ...r,
            user_email: prof?.corporate_email || 'usuario@perspecpack.com',
            user_company_name: prof?.company_name || 'Fornecedor avulso'
          };
        });
        setRequests(merged);
      } else {
        setRequests((reqs || []).map(r => ({
          ...r,
          user_email: 'usuario@perspecpack.com',
          user_company_name: 'Fornecedor avulso'
        })));
      }
    } catch (err) {
      console.error('Error fetching support requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    logPageAccess('Master - Solicitações de Suporte');
    fetchRequests();
  }, [logPageAccess]);

  const handleUpdateStatus = async (id: string, newStatus: SupportRequest['status']) => {
    try {
      if (!supabase) return;
      const { error } = await supabase
        .from('support_requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
      
      await updateSupportRequest(id, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedRequest || !responseText.trim()) return;
    setIsSubmittingReply(true);
    
    try {
      if (!supabase) return;
      const updatedFields = {
        status: 'em_atendimento' as const,
        response: responseText.trim(),
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('support_requests')
        .update({
          status: 'em_atendimento',
          response: responseText.trim(),
          responded_at: updatedFields.responded_at,
          updated_at: updatedFields.updated_at
        })
        .eq('id', selectedRequest.id);
      if (error) throw error;

      await updateSupportRequest(selectedRequest.id, updatedFields);
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, ...updatedFields } : r));
      setSelectedRequest(prev => prev ? { ...prev, ...updatedFields } : null);
      setResponseText('');
      setIsReplyModalOpen(false);
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleArchive = async (id: string) => {
    await handleUpdateStatus(id, 'arquivado');
  };

  const getStatusBadge = (status: SupportRequest['status']) => {
    switch (status) {
      case 'novo':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[11px] font-bold uppercase py-0.5 px-2">Novo</Badge>;
      case 'em_analise':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[11px] font-bold uppercase py-0.5 px-2">Em Análise</Badge>;
      case 'em_atendimento':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 border text-[11px] font-bold uppercase py-0.5 px-2">Respondido</Badge>;
      case 'concluido':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[11px] font-bold uppercase py-0.5 px-2">Concluído</Badge>;
      case 'arquivado':
        return <Badge className="bg-slate-100 text-slate-650 border-slate-200 border text-[11px] font-bold uppercase py-0.5 px-2">Arquivado</Badge>;
    }
  };

  // Filter and search logic
  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'todos' || r.status === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      r.subject.toLowerCase().includes(searchLower) ||
      r.message.toLowerCase().includes(searchLower) ||
      (r.user_email && r.user_email.toLowerCase().includes(searchLower)) ||
      (r.user_company_name && r.user_company_name.toLowerCase().includes(searchLower));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search and Filters bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Pesquisar por assunto, mensagem, email ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-650 focus:border-teal-650"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(['todos', 'novo', 'em_analise', 'em_atendimento', 'concluido', 'arquivado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all uppercase tracking-wider",
                filter === f
                  ? "bg-[#06242c] text-white border-[#06242c] font-bold shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {f === 'todos' && 'Todos'}
              {f === 'novo' && 'Novos'}
              {f === 'em_analise' && 'Em Análise'}
              {f === 'em_atendimento' && 'Em Atendimento'}
              {f === 'concluido' && 'Concluídos'}
              {f === 'arquivado' && 'Arquivados'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 text-slate-550">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Carregando solicitações...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-20 text-center text-slate-450 italic text-xs font-semibold">
            Nenhuma solicitação encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-250 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Usuário / Empresa</th>
                  <th className="py-4 px-6">Assunto / Categoria</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Date */}
                    <td className="py-4 px-6 align-middle">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* User / Company */}
                    <td className="py-4 px-6 align-middle">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={r.user_email}>
                            {r.user_email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {r.user_company_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Subject / Category */}
                    <td className="py-4 px-6 align-middle">
                      <div className="space-y-0.5 max-w-[280px]">
                        <div className="text-xs font-bold text-slate-900 truncate" title={r.subject}>
                          {r.subject}
                        </div>
                        <div className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider">
                          {r.category}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 align-middle">
                      {getStatusBadge(r.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setSelectedRequest(r);
                            setIsViewModalOpen(true);
                          }}
                          title="Visualizar Mensagem"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Reply */}
                        {r.status !== 'arquivado' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-teal-50 text-teal-600 hover:text-teal-700"
                            onClick={() => {
                              setSelectedRequest(r);
                              setIsReplyModalOpen(true);
                            }}
                            title="Responder Solicitação"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Archive */}
                        {r.status !== 'arquivado' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700"
                            onClick={() => handleArchive(r.id)}
                            title="Arquivar Solicitação"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL VIEW MODAL */}
      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Detalhes da Solicitação</span>
              </h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Metadata Box */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 text-xs text-slate-650">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Remetente:</span>
                  <span className="font-bold text-slate-800">{selectedRequest.user_email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Empresa:</span>
                  <span className="font-bold text-slate-800">{selectedRequest.user_company_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Data de Envio:</span>
                  <span className="font-bold text-slate-800">{new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Categoria:</span>
                  <span className="text-teal-650 font-bold uppercase tracking-wider">{selectedRequest.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Status Atual:</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                    
                    {/* Status Dropdown/Selector */}
                    <select
                      value={selectedRequest.status}
                      onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value as any)}
                      className="border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="novo">Novo</option>
                      <option value="em_analise">Em Análise</option>
                      <option value="em_atendimento">Em Atendimento</option>
                      <option value="concluido">Concluído</option>
                      <option value="arquivado">Arquivado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <span className="font-bold text-[10px] text-slate-450 uppercase tracking-wider block">Mensagem</span>
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.message}
                </div>
              </div>

              {/* Response Content (if any) */}
              {selectedRequest.response ? (
                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-450 uppercase tracking-wider">
                    <span className="font-bold">Resposta Enviada</span>
                    <span>{new Date(selectedRequest.responded_at!).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-teal-50/30 border border-teal-100/50 p-4 rounded-2xl text-xs text-teal-950 whitespace-pre-wrap leading-relaxed">
                    {selectedRequest.response}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold">Nenhuma resposta enviada ainda.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-250 flex justify-between items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="w-1/2 text-xs font-semibold h-10 rounded-xl"
              >
                Fechar
              </Button>
              {selectedRequest.status !== 'arquivado' && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsReplyModalOpen(true);
                  }}
                  className="w-1/2 bg-[#06242c] hover:bg-teal-950 text-white text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Responder</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPLY MODAL */}
      {isReplyModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00F59B]" />
                <span>Responder Solicitação</span>
              </h3>
              <button 
                onClick={() => setIsReplyModalOpen(false)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1 text-xs text-slate-650">
                <span className="font-semibold text-slate-400 uppercase tracking-wide block">Respondendo para:</span>
                <span className="font-bold text-slate-800 block text-sm">{selectedRequest.user_email}</span>
                <span className="font-bold text-[#06242c] block">Assunto: {selectedRequest.subject}</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Mensagem de Resposta</label>
                <textarea
                  rows={6}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escreva a resposta que será salva e associada a esta solicitação..."
                  className="w-full border border-slate-350 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-650 focus:border-teal-650 shadow-sm font-sans resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-250 flex justify-between items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsReplyModalOpen(false)}
                className="w-1/2 text-xs font-semibold h-10 rounded-xl"
                disabled={isSubmittingReply}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendReply}
                className="w-1/2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                disabled={isSubmittingReply || !responseText.trim()}
              >
                {isSubmittingReply ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enviar Resposta</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
