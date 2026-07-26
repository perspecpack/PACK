import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Building2, 
  Folder, 
  User, 
  Copy, 
  Trash2, 
  Edit2, 
  Eye, 
  ExternalLink, 
  FileCheck2, 
  X, 
  Search, 
  Filter, 
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';

interface Solicitacao {
  id: string;
  process_id: string;
  title: string;
  client: string;
  project: string;
  code: string;
  revision: string;
  responsible_internal: string;
  deadline: string | null;
  status: 'draft' | 'ready' | 'published' | 'validated' | 'revoked';
  updated_at: string;
  blocks: any[];
  materials: any[];
  template_name?: string;
  public_token?: string;
  description?: string;
  notes_for_client?: string;
}

interface TemplateModel {
  id: string;
  name: string;
  description: string;
  category?: string;
  organization?: string;
  createdAt: string;
  blocks: any[];
  user_id?: string;
}

export default function AprovacoesList() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [requests, setRequests] = useState<Solicitacao[]>([]);
  const [templates, setTemplates] = useState<TemplateModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Template Selector Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  const fetchData = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      // 1. Fetch Requests
      const { data: reqData, error: reqError } = await supabase
        .from('process_requests')
        .select('*, processes(name), process_publications(public_token, status)')
        .order('updated_at', { ascending: false });
      
      if (reqError) throw reqError;
      
      const mappedRequests = (reqData || []).map(r => {
        const activePub = Array.isArray(r.process_publications) 
          ? r.process_publications.find((p: any) => p.status === 'awaiting_validation') || r.process_publications[0]
          : r.process_publications;

        return {
          id: r.id,
          process_id: r.process_id,
          title: r.title,
          client: r.client || '',
          project: r.project || '',
          code: r.code || '',
          revision: r.revision || '',
          responsible_internal: r.responsible_internal || '',
          deadline: r.deadline,
          status: r.status,
          updated_at: r.updated_at,
          blocks: Array.isArray(r.blocks) ? r.blocks : [],
          materials: Array.isArray(r.materials) ? r.materials : [],
          template_name: r.processes?.name || 'Modelo não encontrado',
          public_token: activePub?.public_token,
          description: r.description || '',
          notes_for_client: r.notes_for_client || ''
        };
      });
      setRequests(mappedRequests);

      // 2. Fetch Templates (for the selector modal)
      const { data: tplData, error: tplError } = await supabase
        .from('processes')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (tplError) throw tplError;
      setTemplates(tplData || []);

    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Actions
  const handlePublishRequest = async (req: Solicitacao, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmPublish = window.confirm(
      'Deseja publicar esta solicitação? Isso gerará o link de validação pública para o cliente e bloqueará alterações diretas.'
    );
    if (!confirmPublish) return;

    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('publish_request', {
          p_request_id: req.id,
          p_revoke_previous: true
        });
        if (error) throw error;
        toast.success('Solicitação publicada com sucesso!');
        
        const link = `${window.location.origin}/validar/${data.public_token}`;
        navigator.clipboard.writeText(link).then(() => {
          toast.success('Link de validação copiado para a área de transferência!');
        }).catch(() => {
          toast.info(`Link gerado: ${link}`);
        });

        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar solicitação');
    }
  };

  const handleRevokeRequest = async (reqId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm('Deseja realmente revogar esta publicação? O link público deixará de funcionar.');
    if (!confirm) return;
    try {
      if (supabase) {
        const { error: reqError } = await supabase
          .from('process_requests')
          .update({ status: 'revoked' })
          .eq('id', reqId);
        if (reqError) throw reqError;

        const { error: pubError } = await supabase
          .from('process_publications')
          .update({ status: 'revoked', revoked_at: new Date().toISOString() })
          .eq('request_id', reqId);
        if (pubError) throw pubError;

        toast.success('Publicação revogada com sucesso!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao revogar publicação.');
    }
  };

  const handleCopyLink = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/validar/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link de validação copiado!');
    }).catch(() => {
      toast.info(`Link: ${link}`);
    });
  };

  const handleDuplicateRequest = async (req: Solicitacao, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDup = window.confirm('Deseja duplicar esta solicitação como um novo rascunho?');
    if (!confirmDup) return;

    try {
      if (supabase && user) {
        const { data, error } = await supabase
          .from('process_requests')
          .insert({
            process_id: req.process_id,
            user_id: user.id,
            title: `${req.title} (Cópia)`,
            client: req.client,
            project: req.project,
            code: req.code,
            revision: req.revision ? `${req.revision}-Copy` : '01',
            responsible_internal: req.responsible_internal,
            deadline: req.deadline,
            description: req.description,
            notes_for_client: req.notes_for_client,
            status: 'draft',
            blocks: req.blocks.map(b => ({ ...b, id: `${b.id}-copy` })),
            materials: req.materials
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Solicitação duplicada com sucesso!');
        navigate(`/app/aprovacoes/solicitacao/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao duplicar solicitação');
    }
  };

  const handleDeleteRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Deseja realmente excluir esta solicitação permanentemente?');
    if (!confirmDelete) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from('process_requests')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Solicitação excluída!');
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir solicitação');
    }
  };

  const getStatusBadge = (status: Solicitacao['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border border-slate-200 gap-1 rounded-lg py-0.5">
            <Clock className="w-3 h-3 text-slate-500" />
            Em preparação
          </Badge>
        );
      case 'ready':
        return (
          <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50/80 border border-teal-200 gap-1 rounded-lg py-0.5">
            <FileCheck2 className="w-3 h-3 text-[#0d857a]" />
            Pronto para publicar
          </Badge>
        );
      case 'published':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50/80 border border-indigo-200 gap-1 rounded-lg py-0.5">
            <Send className="w-3 h-3 text-indigo-500" />
            Publicado
          </Badge>
        );
      case 'validated':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80 border border-emerald-200 gap-1 rounded-lg py-0.5">
            <CheckCircle className="w-3 h-3 text-emerald-650" />
            Validado
          </Badge>
        );
      case 'revoked':
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50/80 border border-red-200 gap-1 rounded-lg py-0.5">
            <XCircle className="w-3 h-3 text-red-500" />
            Revogado
          </Badge>
        );
      default:
        return null;
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.template_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter templates inside modal selector
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    (t.organization || '').toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-550">Carregando aprovações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-[#0d857a]" />
            Aprovações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Prepare, publique e acompanhe solicitações enviadas aos seus clientes.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 self-start sm:self-center cursor-pointer border-0 text-xs"
        >
          <Plus className="w-4 h-4 text-slate-900 stroke-[3px]" />
          Nova Aprovação
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Pesquisar por título, cliente, projeto, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9.5 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700 focus:border-[#0d857a] focus:ring-1 focus:ring-[#0d857a]/20 outline-none w-full sm:w-44"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Em preparação</option>
            <option value="ready">Pronto para publicar</option>
            <option value="published">Publicado</option>
            <option value="validated">Validado</option>
            <option value="revoked">Revogado</option>
          </select>
        </div>
      </div>

      {/* Requests Grid / List */}
      {filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs"
        >
          <ClipboardCheck className="w-8 h-8 text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-xs text-slate-455 max-w-sm mb-6">
            Ajuste os filtros ou clique em "+ Nova Aprovação" para iniciar a preparação de um processo.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs border-0 cursor-pointer"
          >
            Selecionar Modelo
          </Button>
        </motion.div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredRequests.map(req => {
            const isEditable = req.status === 'draft' || req.status === 'ready';
            
            return (
              <div
                key={req.id}
                onClick={() => navigate(`/app/aprovacoes/solicitacao/${req.id}`)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/30 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                    req.status === 'validated' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : req.status === 'published'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    <ClipboardCheck className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-sm text-slate-800 tracking-tight truncate group-hover:text-[#0d857a]">
                        {req.title}
                      </h3>
                      {getStatusBadge(req.status)}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-slate-500 text-xs font-medium">
                      {req.client && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {req.client}
                        </span>
                      )}
                      {req.project && (
                        <span className="flex items-center gap-1">
                          <Folder className="w-3.5 h-3.5 text-slate-400" />
                          {req.project} {req.revision ? `(Rev ${req.revision})` : ''}
                        </span>
                      )}
                      {req.responsible_internal && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {req.responsible_internal}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1 font-medium">
                      <span>Modelo: <strong className="text-slate-500">{req.template_name}</strong></span>
                      <span>•</span>
                      <span>Última atualização: {new Date(req.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 md:mt-0 pl-14 md:pl-0 flex-wrap">
                  {/* Publicar button */}
                  {req.status === 'ready' && (
                    <Button
                      type="button"
                      onClick={(e) => handlePublishRequest(req, e)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 font-bold text-xs px-3 py-1.5 h-8 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Publicar e gerar link"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publicar
                    </Button>
                  )}

                  {/* Copiar Link button */}
                  {req.status === 'published' && req.public_token && (
                    <Button
                      type="button"
                      onClick={(e) => handleCopyLink(req.public_token!, e)}
                      className="bg-emerald-55 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 font-bold text-xs px-3 py-1.5 h-8 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Copiar Link de Validação"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Link
                    </Button>
                  )}

                  {/* Visualizar como cliente (Public link) */}
                  {req.status === 'published' && req.public_token && (
                    <a
                      href={`/validar/${req.public_token}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-slate-50 text-slate-500 hover:text-[#0d857a] hover:bg-teal-50 border border-slate-200 rounded-lg flex items-center justify-center transition-colors"
                      title="Visualizar como Cliente"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Revogar button */}
                  {req.status === 'published' && (
                    <button
                      onClick={(e) => handleRevokeRequest(req.id, e)}
                      className="p-1.5 bg-red-50 text-red-650 hover:bg-red-105 hover:text-red-700 border border-red-200/60 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      title="Revogar Link"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Visualizar respostas (Validado) */}
                  {req.status === 'validated' && (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/validacoes?search=${req.code || req.title}`);
                      }}
                      className="bg-emerald-55 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 font-bold text-xs px-3 py-1.5 h-8 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Abrir Resultado"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Ver Respostas
                    </Button>
                  )}

                  <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/aprovacoes/solicitacao/${req.id}`);
                    }}
                    className="p-2 text-slate-455 hover:text-[#0d857a] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title={isEditable ? 'Editar Solicitação' : 'Visualizar Solicitação'}
                  >
                    {isEditable ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={(e) => handleDuplicateRequest(req, e)}
                    className="p-2 text-slate-455 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title={req.status === 'published' ? 'Criar Nova Versão' : 'Duplicar Solicitação'}
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteRequest(req.id, e)}
                    className="p-2 text-slate-455 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title="Excluir Solicitação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0d857a] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SELECT TEMPLATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px]">Nova Aprovação</h3>
                  <p className="text-[11px] text-slate-455">Selecione um modelo para preparar a solicitação</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-all border-0 bg-transparent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar inside Modal */}
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar modelo..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs border-slate-200 focus-visible:border-[#0d857a]"
                  />
                </div>
              </div>

              {/* Templates List inside Modal */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('/app/modelos/novo');
                  }}
                  className="flex items-center justify-between p-3 border border-dashed border-slate-350 hover:border-[#0d857a] hover:bg-[#0d857a]/5 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8.5 w-8.5 bg-slate-105 text-slate-500 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Criar em branco</h4>
                      <p className="text-[10px] text-slate-455">Iniciar a partir de um modelo novo</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 pb-1">Modelos Existentes</span>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-455 italic">
                    Nenhum modelo disponível.
                  </div>
                ) : (
                  filteredTemplates.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setIsModalOpen(false);
                        navigate(`/app/aprovacoes/solicitacao/nova/${tpl.id}`);
                      }}
                      className="flex items-center justify-between p-3.5 border border-slate-200 hover:border-[#0d857a]/40 hover:bg-[#0d857a]/5 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8.5 w-8.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          <ClipboardCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-800 truncate">{tpl.name}</h4>
                          <p className="text-[10px] text-slate-455 truncate max-w-[280px]">
                            {tpl.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#0d857a] group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
