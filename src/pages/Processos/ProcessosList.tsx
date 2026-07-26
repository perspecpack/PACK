import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Plus, 
  Workflow, 
  Trash2, 
  FileText, 
  Building2, 
  Folder, 
  Calendar, 
  ArrowRight,
  Loader2,
  Copy,
  Send,
  Eye,
  Edit2,
  ExternalLink,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';

interface Processo {
  id: string;
  name: string;
  description: string;
  category?: string;
  organization?: string;
  createdAt: string;
  blocks: any[];
  user_id?: string;
}

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

export default function ProcessosList() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'templates' | 'requests'>('templates');
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [requests, setRequests] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProcessos = async () => {
    try {
      if (supabase && user) {
        const { data, error } = await supabase
          .from('processes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const mapped = (data || []).map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category,
          organization: p.organization,
          createdAt: p.created_at,
          blocks: Array.isArray(p.blocks) ? p.blocks : [],
          user_id: p.user_id
        }));
        
        setProcessos(mapped);
      }
    } catch (e) {
      console.error('Error fetching processes', e);
      toast.error('Erro ao carregar modelos.');
    }
  };

  const fetchRequests = async () => {
    try {
      if (supabase && user) {
        // Query process_requests and join processes to get the template name
        const { data, error } = await supabase
          .from('process_requests')
          .select('*, processes(name), process_publications(public_token, status)')
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        const mapped = (data || []).map(r => {
          // Find the active publication token if exists
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
        
        setRequests(mapped);
      }
    } catch (e) {
      console.error('Error fetching requests', e);
      toast.error('Erro ao carregar solicitações.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProcessos(), fetchRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Deseja excluir este modelo? Essa ação não poderá ser desfeita.');
    if (!confirmDelete) return;

    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('processes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Modelo excluído com sucesso');
        fetchProcessos();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir modelo');
    }
  };

  const handleDuplicateModel = async (model: Processo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('processes')
          .insert({
            name: `${model.name} (Cópia)`,
            description: model.description,
            category: model.category,
            organization: model.organization,
            blocks: model.blocks,
            user_id: user.id
          });
        if (error) throw error;
        toast.success('Modelo duplicado com sucesso');
        fetchProcessos();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao duplicar modelo');
    }
  };

  const handleDeleteRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Deseja excluir esta solicitação? Essa ação não poderá ser desfeita.');
    if (!confirmDelete) return;

    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('process_requests')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Solicitação excluída com sucesso');
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir solicitação');
    }
  };

  const handleDuplicateRequest = async (req: Solicitacao, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('process_requests')
          .insert({
            process_id: req.process_id,
            title: `${req.title} (Cópia)`,
            client: req.client,
            project: req.project,
            code: req.code,
            revision: req.revision,
            responsible_internal: req.responsible_internal,
            deadline: req.deadline,
            description: req.description,
            notes_for_client: req.notes_for_client,
            status: 'draft',
            blocks: req.blocks,
            materials: req.materials,
            user_id: user.id
          });
        if (error) throw error;
        toast.success('Solicitação duplicada com sucesso');
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao duplicar solicitação');
    }
  };

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

        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar solicitação');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-550">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-[#0d857a]" />
            Processos de Aprovação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie modelos reutilizáveis e gerencie solicitações específicas de aprovação para seus clientes.
          </p>
        </div>

        {activeTab === 'templates' && (
          <Button
            onClick={() => navigate('/app/processos/novo')}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 self-start sm:self-center cursor-pointer border-0 text-xs"
          >
            <Plus className="w-4 h-4 text-slate-900 stroke-[3px]" />
            Novo Modelo
          </Button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 pt-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'border-[#0d857a] text-[#0d857a]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Modelos ({processos.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'border-[#0d857a] text-[#0d857a]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Solicitações ({requests.length})
        </button>
      </div>

      {/* Templates Content */}
      {activeTab === 'templates' && (
        processos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white border border-slate-200 rounded-2xl"
          >
            <Workflow className="w-8 h-8 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-700 text-sm mb-2">Nenhum modelo cadastrado</h3>
            <p className="text-xs text-slate-450 max-w-sm mb-6">
              Modelos são estruturas reutilizáveis como "Aprovação de Protótipo" ou "Aceite de Projeto".
            </p>
            <Button
              onClick={() => navigate('/app/processos/novo')}
              className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-4 py-2 rounded-xl text-xs border-0 cursor-pointer"
            >
              Criar Primeiro Modelo
            </Button>
          </motion.div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {processos.map(model => (
              <div
                key={model.id}
                onClick={() => navigate(`/app/processos/${model.id}`)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/30 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/20 transition-all shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-slate-800 tracking-tight truncate group-hover:text-[#0d857a]">
                        {model.name}
                      </h3>
                      {model.category && (
                        <Badge variant="outline" className="bg-slate-50/80 text-slate-500 border-slate-200 text-[10px] px-2 py-0">
                          <Folder className="w-3 h-3 mr-1 text-slate-400" />
                          {model.category}
                        </Badge>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-slate-455 text-xs line-clamp-1 max-w-xl">
                        {model.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1">
                      {model.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {model.organization}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Criado em {new Date(model.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0 pl-14 md:pl-0">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/processos/solicitacao/nova/${model.id}`);
                    }}
                    className="bg-teal-50 hover:bg-[#0d857a]/10 text-[#0d857a] font-bold text-xs px-3 py-1.5 h-8.5 rounded-lg border border-[#0d857a]/25 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Usar Modelo
                  </Button>

                  <button
                    onClick={(e) => handleDuplicateModel(model, e)}
                    className="p-2 text-slate-450 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title="Duplicar Modelo"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteModel(model.id, e)}
                    className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title="Excluir Modelo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0d857a] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Requests Content */}
      {activeTab === 'requests' && (
        requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white border border-slate-200 rounded-2xl"
          >
            <FileText className="w-8 h-8 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-700 text-sm mb-2">Nenhuma solicitação criada</h3>
            <p className="text-xs text-slate-455 max-w-sm mb-6">
              Solicitações são instâncias específicas de um modelo, por exemplo, preenchendo os dados do projeto de um cliente para validação.
            </p>
            <Button
              onClick={() => setActiveTab('templates')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs border-0 cursor-pointer"
            >
              Escolher um Modelo
            </Button>
          </motion.div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {requests.map(req => {
              const isEditable = req.status === 'draft' || req.status === 'ready';
              
              return (
                <div
                  key={req.id}
                  onClick={() => navigate(`/app/processos/solicitacao/${req.id}`)}
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
                      <FileText className="w-5 h-5" />
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
                            <Building2 className="w-3.5 h-3.5" />
                            {req.client}
                          </span>
                        )}
                        {req.project && (
                          <span className="flex items-center gap-1">
                            <Folder className="w-3.5 h-3.5" />
                            {req.project} {req.revision ? `(Rev ${req.revision})` : ''}
                          </span>
                        )}
                        {req.responsible_internal && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {req.responsible_internal}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1">
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
                    {isEditable && (
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
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 font-bold text-xs px-3 py-1.5 h-8 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Copiar Link de Validação"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Link
                      </Button>
                    )}

                    {/* Visualizar public link button */}
                    {req.status === 'published' && req.public_token && (
                      <a
                        href={`/validar/${req.public_token}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-slate-50 text-slate-500 hover:text-[#0d857a] hover:bg-teal-50 border border-slate-200 rounded-lg flex items-center justify-center transition-colors"
                        title="Abrir Link Público"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/processos/solicitacao/${req.id}`);
                      }}
                      className="p-2 text-slate-450 hover:text-[#0d857a] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title={isEditable ? 'Editar Solicitação' : 'Visualizar Solicitação'}
                    >
                      {isEditable ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={(e) => handleDuplicateRequest(req, e)}
                      className="p-2 text-slate-450 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title="Duplicar Solicitação"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteRequest(req.id, e)}
                      className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title="Excluir Solicitação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
