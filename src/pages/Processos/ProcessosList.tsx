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
  Loader2
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
    setLoading(true);
    try {
      if (supabase && user) {
        // Query from Supabase (RLS will automatically restrict to the user's own processes)
        const { data, error } = await supabase
          .from('processes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Map database fields to our interface
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
      } else {
        // LocalStorage fallback
        const stored = localStorage.getItem('perspecpack:processos');
        if (stored) {
          setProcessos(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.error('Error fetching processes', e);
      toast.error('Erro ao carregar processos.');
      
      // Fallback
      const stored = localStorage.getItem('perspecpack:processos');
      if (stored) {
        setProcessos(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessos();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Confirm delete request
    const confirmDelete = window.confirm('Deseja excluir este processo? Essa ação não poderá ser desfeita.');
    if (!confirmDelete) return;

    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('processes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      // Update local state and local storage fallback
      const updated = processos.filter(p => p.id !== id);
      setProcessos(updated);
      localStorage.setItem('perspecpack:processos', JSON.stringify(updated));
      toast.success('Processo excluído com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir processo');
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/app/processos/${id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-550">Carregando processos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-[#0d857a]" />
            Processos de Aprovação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie e crie fluxos digitais de aprovação personalizados para sua organização.
          </p>
        </div>

        {processos.length > 0 && (
          <Button
            onClick={() => navigate('/app/processos/novo')}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 self-start sm:self-center cursor-pointer border-0 text-xs"
          >
            <Plus className="w-4 h-4 text-slate-900 stroke-[3px]" />
            Novo Processo
          </Button>
        )}
      </div>

      {processos.length === 0 ? (
        /* Elegante Empty State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs"
        >
          <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d857a] mb-6 shadow-inner animate-pulse">
            <Workflow className="w-8 h-8 text-[#0d857a]" />
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
            Processos de Aprovação
          </h2>

          <p className="text-slate-500 text-sm max-w-lg leading-relaxed mb-6">
            Crie processos digitais para aprovação de projetos, inspeções, validações, auditorias ou qualquer outro fluxo da sua empresa.
          </p>

          <p className="text-slate-400 text-xs mb-8 italic">
            Nenhum processo encontrado.
          </p>

          <Button
            onClick={() => navigate('/app/processos/novo')}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border-0 text-sm"
          >
            <Plus className="w-4 h-4 text-slate-900 stroke-[3px]" />
            Novo Processo
          </Button>
        </motion.div>
      ) : (
        /* Sleek Premium List (Linear/Figma inspired) */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
        >
          <div className="divide-y divide-slate-100">
            {processos.map((processo, index) => (
              <motion.div
                key={processo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => handleRowClick(processo.id)}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/50 cursor-pointer transition-colors duration-155"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-450 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/20 transition-all shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-[15px] text-slate-800 tracking-tight truncate group-hover:text-[#0d857a] transition-colors">
                        {processo.name}
                      </h3>
                      {processo.category && (
                        <Badge variant="outline" className="bg-slate-50/80 text-slate-500 border-slate-200 text-[11px] px-2 py-0">
                          <Folder className="w-3 h-3 mr-1 text-slate-400" />
                          {processo.category}
                        </Badge>
                      )}
                    </div>
                    
                    {processo.description && (
                      <p className="text-slate-500 text-xs line-clamp-1 max-w-2xl leading-relaxed">
                        {processo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-slate-400 text-[11px] font-medium pt-1">
                      {processo.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {processo.organization}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Criado em {new Date(processo.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0 pl-14 md:pl-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                      {(processo.blocks || []).length} blocos
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(processo.id, e)}
                    className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title="Excluir Processo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ArrowRight className="w-4 h-4 text-slate-350 group-hover:text-[#0d857a] group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
