import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Plus, 
  Library, 
  Trash2, 
  FileText, 
  Building2, 
  Folder, 
  Calendar, 
  ArrowRight,
  Loader2,
  Copy,
  Edit2,
  Ellipsis
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

export default function ProcessosList() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [processos, setProcessos] = useState<Processo[]>([]);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProcessos();
    }
  }, [user]);

  const handleDuplicateModel = async (model: Processo, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDup = window.confirm('Deseja duplicar este modelo?');
    if (!confirmDup) return;

    try {
      if (supabase && user) {
        const { data, error } = await supabase
          .from('processes')
          .insert({
            name: `${model.name} (Cópia)`,
            description: model.description,
            category: model.category,
            organization: model.organization,
            blocks: model.blocks.map(b => ({ ...b, id: `${b.id}-copy` })),
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Modelo duplicado com sucesso!');
        fetchProcessos();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao duplicar modelo');
    }
  };

  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      'Aviso: Excluir este modelo não afetará solicitações ou publicações já enviadas aos clientes, mas o modelo deixará de estar disponível para novas solicitações. Deseja continuar?'
    );
    if (!confirmDelete) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from('processes')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Modelo excluído!');
        setProcessos(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir modelo');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-555">Carregando biblioteca de modelos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Library className="w-6 h-6 text-[#0d857a]" />
            Biblioteca de Modelos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie, edite e reutilize estruturas para os seus processos de aprovação.
          </p>
        </div>

        <Button
          onClick={() => navigate('/app/modelos/novo')}
          className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 self-start sm:self-center cursor-pointer border-0 text-xs"
        >
          <Plus className="w-4 h-4 text-slate-900 stroke-[3px]" />
          Novo Modelo
        </Button>
      </div>

      {/* Templates Content */}
      {processos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs"
        >
          <Library className="w-8 h-8 text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Nenhum modelo cadastrado</h3>
          <p className="text-xs text-slate-455 max-w-sm mb-6">
            Modelos são estruturas reutilizáveis como "Aprovação de Protótipo" ou "Aceite de Projeto".
          </p>
          <Button
            onClick={() => navigate('/app/modelos/novo')}
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
              onClick={() => navigate(`/app/modelos/${model.id}`)}
              className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-slate-50/40 cursor-pointer transition-colors"
            >
              {/* Área A — Informações do modelo */}
              <div className="flex items-start gap-4 flex-1 min-w-0 pr-0 md:pr-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/20 transition-all shrink-0">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight group-hover:text-[#0d857a] transition-colors break-words">
                      {model.name}
                    </h3>
                    {model.category && (
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-2 py-0.5 inline-flex items-center gap-1">
                        <Folder className="w-3 h-3 text-slate-400" />
                        <span>{model.category}</span>
                      </Badge>
                    )}
                  </div>

                  {model.description && (
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed max-w-2xl">
                      {model.description}
                    </p>
                  )}

                  <div className="flex items-center gap-x-4 gap-y-1.5 text-slate-400 text-[11px] pt-1 font-medium flex-wrap">
                    {model.organization && (
                      <span className="inline-flex items-center gap-1.5 shrink-0" title={`Empresa: ${model.organization}`}>
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{model.organization}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{model.blocks?.length || 0} {model.blocks?.length === 1 ? 'bloco estruturado' : 'blocos estruturados'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Criado em {new Date(model.createdAt).toLocaleDateString('pt-BR')}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Área B — Ações */}
              <div 
                className="flex items-center gap-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 self-end md:self-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ação Principal: Usar Modelo */}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/aprovacoes/solicitacao/nova/${model.id}`);
                  }}
                  className="bg-teal-50 hover:bg-[#0d857a]/15 text-[#0d857a] font-bold text-xs px-3 py-1.5 h-8.5 rounded-lg border border-[#0d857a]/25 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                  title="Criar nova solicitação de aprovação usando este modelo"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Usar Modelo</span>
                </Button>

                {/* Ações Secundárias: Menu de três pontos (⋯) */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8.5 w-8.5 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d857a]/20"
                    aria-label="Mais ações"
                    title="Mais ações"
                  >
                    <Ellipsis className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={6}
                    className="w-56 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-2 py-1">
                        Gerenciamento
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/modelos/${model.id}`);
                        }}
                        className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar modelo</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDuplicateModel(model, e)}
                        className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Duplicar modelo</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1 border-slate-100" />

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => handleDeleteModel(model.id, e)}
                      className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Excluir modelo</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
