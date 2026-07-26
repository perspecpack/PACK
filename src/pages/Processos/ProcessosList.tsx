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
  Copy
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
                  <div className="flex items-center gap-4 text-slate-400 text-[10px] pt-1 font-medium">
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
                    navigate(`/app/aprovacoes/solicitacao/nova/${model.id}`);
                  }}
                  className="bg-teal-55 bg-teal-50 hover:bg-[#0d857a]/10 text-[#0d857a] font-bold text-xs px-3 py-1.5 h-8.5 rounded-lg border border-[#0d857a]/25 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  Usar Modelo
                </Button>

                <button
                  onClick={(e) => handleDuplicateModel(model, e)}
                  className="p-2 text-slate-455 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                  title="Duplicar Modelo"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleDeleteModel(model.id, e)}
                  className="p-2 text-slate-455 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                  title="Excluir Modelo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0d857a] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
