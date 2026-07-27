import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  CloudCheck, 
  CloudLightning, 
  RefreshCw, 
  AlertTriangle,
  Eye,
  FileText,
  X,
  ClipboardCheck,
  Library
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import processes sub-components
import EditorLayout from '@/src/components/processos/EditorLayout';
import ProcessHeader from '@/src/components/processos/ProcessHeader';
import ProcessCanvas from '@/src/components/processos/ProcessCanvas';
import BlockSidebar from '@/src/components/processos/BlockSidebar';
import DeleteBlockDialog from '@/src/components/processos/DeleteBlockDialog';
import { Block, BlockFactory, migrateLegacyBlocks, BLOCK_METADATA } from '@/src/components/processos/BlockFactory';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';
import { Monitor, Tablet as TabletIcon, Smartphone } from 'lucide-react';
import ApprovalDocumentRenderer from '@/src/components/processos/ApprovalDocumentRenderer';

// dnd-kit vertical dragging imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Processo {
  id: string;
  name: string;
  description: string;
  category?: string;
  organization?: string;
  createdAt: string;
  blocks: Block[];
  status: string;
  user_id?: string;
}

type SaveStatusType = 'saved' | 'saving' | 'unsaved' | 'error';

export default function EditorProcesso() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  // Deletion state
  const [blockToDeleteId, setBlockToDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<SaveStatusType>('saved');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Configure sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load process
  const loadProcess = async () => {
    setLoading(true);
    try {
      if (supabase && user) {
        // Load process
        const { data, error } = await supabase
          .from('processes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        const migratedBlocks = migrateLegacyBlocks(Array.isArray(data.blocks) ? data.blocks : []);

        setProcesso({
          id: data.id,
          name: data.name,
          description: data.description || '',
          category: data.category || '',
          organization: data.organization || '',
          createdAt: data.created_at,
          blocks: migratedBlocks,
          status: data.status || 'draft',
          user_id: data.user_id
        });
      } else {
        // LocalStorage fallback
        const stored = localStorage.getItem('perspecpack:processos');
        if (stored) {
          const list: Processo[] = JSON.parse(stored);
          const found = list.find(p => p.id === id);
          if (found) {
            const migratedBlocks = migrateLegacyBlocks(Array.isArray(found.blocks) ? found.blocks : []);
            setProcesso({
              ...found,
              blocks: migratedBlocks
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading process in editor', e);
      toast.error('Erro ao carregar o modelo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcess();
  }, [id, user]);

  // Unsaved changes beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = 'Você possui alterações não salvas neste modelo. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveStatus]);

  // Save implementation
  const saveProcess = async (currentProcesso: Processo) => {
    setSaveStatus('saving');
    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('processes')
          .update({
            name: currentProcesso.name,
            description: currentProcesso.description || null,
            category: currentProcesso.category || null,
            organization: currentProcesso.organization || null,
            blocks: currentProcesso.blocks,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProcesso.id);

        if (error) throw error;
      }

      // LocalStorage update
      const stored = localStorage.getItem('perspecpack:processos');
      if (stored) {
        const list: Processo[] = JSON.parse(stored);
        const updatedList = list.map(p => p.id === currentProcesso.id ? {
          ...currentProcesso,
          blocksCount: currentProcesso.blocks.length
        } : p);
        localStorage.setItem('perspecpack:processos', JSON.stringify(updatedList));
      }

      setSaveStatus('saved');
    } catch (e) {
      console.error('Error saving process', e);
      setSaveStatus('error');
      toast.error('Erro ao salvar as alterações automaticamente.');
    }
  };

  // Trigger debounced autosave
  const triggerAutosave = (updatedProcess: Processo) => {
    setSaveStatus('unsaved');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveProcess(updatedProcess);
    }, 1000);
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (!processo) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    saveProcess(processo);
    toast.success('Modelo salvo com sucesso.');
  };

  // Add block handler
  const handleAddBlock = (type: any) => {
    if (!processo) return;
    
    const newBlock = BlockFactory.createBlock(type);
    const updatedBlocks = [...processo.blocks, newBlock];
    const updatedProcess = { ...processo, blocks: updatedBlocks };
    
    setProcesso(updatedProcess);
    setActiveBlockId(newBlock.id);
    setIsSidebarOpen(false);
    triggerAutosave(updatedProcess);

    toast.success(`Bloco de "${BLOCK_METADATA[newBlock.type].title}" adicionado`);

    setTimeout(() => {
      const el = document.getElementById(`block-card-${newBlock.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleDeleteBlockClick = (blockId: string) => {
    setBlockToDeleteId(blockId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!processo || !blockToDeleteId) return;

    const updatedBlocks = processo.blocks.filter(b => b.id !== blockToDeleteId);
    const updatedProcess = { ...processo, blocks: updatedBlocks };

    setProcesso(updatedProcess);
    if (activeBlockId === blockToDeleteId) {
      setActiveBlockId(null);
    }
    setBlockToDeleteId(null);
    triggerAutosave(updatedProcess);
    toast.success('Bloco excluído');
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!processo) return;

    const index = processo.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === processo.blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedBlocks = [...processo.blocks];
    
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[targetIndex];
    updatedBlocks[targetIndex] = temp;

    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    triggerAutosave(updatedProcess);
    
    setTimeout(() => {
      const el = document.getElementById(`block-card-${blockId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const handleDuplicateBlock = (blockId: string) => {
    if (!processo) return;

    const index = processo.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const original = processo.blocks[index];
    const duplicated: Block = {
      ...original,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      title: `${original.title} (Cópia)`
    };

    const updatedBlocks = [...processo.blocks];
    updatedBlocks.splice(index + 1, 0, duplicated);

    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    setActiveBlockId(duplicated.id);
    triggerAutosave(updatedProcess);

    toast.success('Bloco duplicado');

    setTimeout(() => {
      const el = document.getElementById(`block-card-${duplicated.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleUpdateBlock = (blockId: string, updatedBlock: Block) => {
    if (!processo) return;

    const updatedBlocks = processo.blocks.map(b => b.id === blockId ? updatedBlock : b);
    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    triggerAutosave(updatedProcess);
  };

  const handleSelectBlock = (blockId: string) => {
    setActiveBlockId(blockId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      if (!processo) return;
      
      const oldIndex = metroIndex(active.id);
      const newIndex = metroIndex(over.id);
      
      const updatedBlocks = arrayMove(processo.blocks, oldIndex, newIndex);
      const updatedProcess = { ...processo, blocks: updatedBlocks };
      
      setProcesso(updatedProcess);
      triggerAutosave(updatedProcess);
      toast.success('Posição do bloco atualizada');
    }
  };

  const metroIndex = (blockId: any) => {
    return processo?.blocks.findIndex(b => b.id === blockId) ?? -1;
  };

  const handleBackNavigation = () => {
    if (saveStatus === 'unsaved') {
      const confirmLeave = window.confirm('Você possui alterações não salvas neste modelo. Deseja realmente sair?');
      if (!confirmLeave) return;
    }
    navigate('/app/modelos');
  };

  // Render Save Status Label
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
            <CloudCheck className="w-3.5 h-3.5" />
            <span>Salvo</span>
          </span>
        );
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Salvando...</span>
          </span>
        );
      case 'unsaved':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Alterações não salvas</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Erro ao salvar</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md mx-auto space-y-6 shadow-xs">
        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <Library className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">Modelo não encontrado</h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            O modelo de aprovação que você tentou acessar não existe ou foi excluído.
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/modelos')}
          className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer border-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Voltar para Biblioteca de Modelos
        </Button>
      </div>
    );
  }
  const hasRequestInfo = processo.blocks.some(b => b.type === 'request_information');
  const hasAnalysisMaterials = processo.blocks.some(b => b.type === 'analysis_materials');
  const isLegacyModel = !hasRequestInfo || !hasAnalysisMaterials;

  const handleAddLegacyBlocks = () => {
    if (!processo) return;
    const newBlocks = [...processo.blocks];
    
    if (!hasRequestInfo) {
      const reqInfoBlock = BlockFactory.createBlock('request_information');
      newBlocks.unshift(reqInfoBlock);
    }
    if (!hasAnalysisMaterials) {
      const idx = newBlocks.findIndex(b => b.type === 'request_information');
      const matBlock = BlockFactory.createBlock('analysis_materials');
      if (idx !== -1) {
        newBlocks.splice(idx + 1, 0, matBlock);
      } else {
        newBlocks.unshift(matBlock);
      }
    }
    
    const updated = { ...processo, blocks: newBlocks };
    setProcesso(updated);
    triggerAutosave(updated);
    toast.success('Blocos especiais de preparação adicionados ao modelo!');
  };

  const { profile } = useApp();
  const companyBranding = {
    companyName: profile?.companyName || 'Minha Empresa',
    tradeName: profile?.tradeName || profile?.companyName || 'Minha Empresa',
    companyLogoUrl: profile?.companyLogoUrl || '',
    companyWebsite: profile?.companyWebsite || '',
    corporateEmail: profile?.corporateEmail || '',
    phone: profile?.phone || '',
    shortDescription: profile?.shortDescription || '',
    footerText: profile?.footerText || ''
  };

  const documentData = {
    title: processo?.name || '',
    description: processo?.description || '',
    status: processo?.status || 'draft',
    revision: '01',
    code: 'MODELO',
    deadline: null,
    responsible_internal: '',
    publication_code: 'MODELO',
    version: 1
  };

  return (
    <div className="w-full">
      {isLegacyModel && (
        <div className="max-w-6xl mx-auto mb-4 bg-amber-50 border border-amber-200/80 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800">Compatibilidade de Modelo</h4>
              <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                Este modelo ainda não possui os novos blocos especiais de **Informações Gerais** e/ou **Materiais para Análise**. Deseja adicioná-los no início do modelo?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleAddLegacyBlocks}
              className="bg-white hover:bg-amber-100/50 text-amber-700 border border-amber-250/65 h-8 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Adicionar Blocos Especiais
            </Button>
          </div>
        </div>
      )}

      {/* Editor Status Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 bg-transparent -mt-2 mb-2 max-w-6xl mx-auto px-1 gap-3">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-slate-455 hover:text-[#0d857a] text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Biblioteca de Modelos
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {renderSaveStatus()}
          
          <Button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0d857a] border border-slate-200 h-8.5 px-3 text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </Button>

          <Button
            onClick={() => setIsPreviewOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-8.5 px-3 text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-450" />
            Visualizar Modelo
          </Button>

          <Button
            onClick={() => navigate(`/app/aprovacoes/solicitacao/nova/${id}`)}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-8.5 px-4 text-[11px] rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-900 stroke-[2.5px]" />
            Usar Modelo
          </Button>
        </div>
      </div>

      <EditorLayout
        header={
          <ProcessHeader
            name={processo.name}
            description={processo.description}
            category={processo.category}
            organization={processo.organization}
          />
        }
        canvas={
          <div className="w-full flex flex-col items-center">
            {/* Canvas Responsive Width Selector */}
            <div className="flex justify-center gap-1.5 mb-4 border-b border-slate-100 pb-3 select-none w-full max-w-2xl">
              <button
                onClick={() => setCanvasWidth('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  canvasWidth === 'desktop'
                    ? 'bg-teal-50 border-teal-200 text-[#0d857a] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (960px)</span>
              </button>
              <button
                onClick={() => setCanvasWidth('tablet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  canvasWidth === 'tablet'
                    ? 'bg-teal-50 border-teal-200 text-[#0d857a] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <TabletIcon className="w-3.5 h-3.5" />
                <span>Tablet (768px)</span>
              </button>
              <button
                onClick={() => setCanvasWidth('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  canvasWidth === 'mobile'
                    ? 'bg-teal-50 border-teal-200 text-[#0d857a] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Celular (390px)</span>
              </button>
            </div>

            {/* Centered Canvas Container */}
            <div className={`mx-auto transition-all duration-300 ${
              canvasWidth === 'desktop' ? 'max-w-[960px] w-full' :
              canvasWidth === 'tablet' ? 'max-w-[768px] w-full border-x border-slate-200 px-4' :
              'max-w-[390px] w-full border-x border-slate-200 px-4'
            }`}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <ProcessCanvas
                  blocks={processo.blocks || []}
                  activeBlockId={activeBlockId}
                  onSelectBlock={handleSelectBlock}
                  onUpdateBlock={handleUpdateBlock}
                  onAddBlockClick={() => setIsSidebarOpen(true)}
                  onDeleteBlockClick={handleDeleteBlockClick}
                  onMoveBlock={handleMoveBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  companyBranding={companyBranding}
                  documentData={documentData}
                />
              </DndContext>
            </div>
          </div>
        }
        sidebar={
          <BlockSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onAddBlock={handleAddBlock}
          />
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteBlockDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* PREVIEW DRAWER */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)} className="absolute inset-0 bg-black" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                <div className="space-y-1">
                  <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-[#0d857a]" />
                    Visualizar Modelo
                  </h2>
                  <span className="text-[9px] text-slate-455 font-medium">Modo de pré-visualização de estrutura e responsabilidades</span>
                </div>
                <button onClick={() => setIsPreviewOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors border-0 bg-transparent">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="max-w-[768px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <ApprovalDocumentRenderer
                    mode="template-preview"
                    blocks={processo.blocks}
                    companyBranding={companyBranding}
                    documentData={documentData}
                  />
                </div>
              </div>

              {/* Preview Footer */}
              <div className="p-4.5 border-t border-slate-100 flex items-center justify-end shrink-0 bg-slate-50">
                <Button onClick={() => setIsPreviewOpen(false)} className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
