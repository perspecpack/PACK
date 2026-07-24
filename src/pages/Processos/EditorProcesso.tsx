import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Workflow, ArrowLeft, Loader2, Save, CloudCheck, CloudLightning, RefreshCw, AlertTriangle } from 'lucide-react';
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

  // Configure sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px activation distance prevents dragging when normal touch scrolling
      },
    })
  );

  // Load process
  useEffect(() => {
    const loadProcess = async () => {
      setLoading(true);
      try {
        if (supabase && user) {
          const { data, error } = await supabase
            .from('processes')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          
          // Apply legacy migration to loaded blocks
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
        toast.error('Erro ao carregar o processo.');
      } finally {
        setLoading(false);
      }
    };

    loadProcess();
  }, [id, user]);

  // Unsaved changes beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = 'Você possui alterações não salvas neste processo. Deseja realmente sair?';
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
        // Save to Supabase (User ID is secured by RLS rules)
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

      // Also update localStorage as secondary fallback
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

    // Debounce save between 800ms and 1500ms (we use 1000ms)
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
    toast.success('Alterações salvas com sucesso.');
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

    // Smooth scroll to new block after layout render
    setTimeout(() => {
      const el = document.getElementById(`block-card-${newBlock.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Delete block dialog helpers
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

  // Move block up or down
  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!processo) return;

    const index = processo.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === processo.blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedBlocks = [...processo.blocks];
    
    // Swap blocks
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[targetIndex];
    updatedBlocks[targetIndex] = temp;

    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    triggerAutosave(updatedProcess);
    
    // Keep focus on moved block
    setTimeout(() => {
      const el = document.getElementById(`block-card-${blockId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Duplicate block
  const handleDuplicateBlock = (blockId: string) => {
    if (!processo) return;

    const index = processo.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const original = processo.blocks[index];
    const duplicated: Block = {
      ...original,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      // Copy settings and title, but not response state if any
      title: `${original.title} (Cópia)`
    };

    const updatedBlocks = [...processo.blocks];
    // Insert immediately below original
    updatedBlocks.splice(index + 1, 0, duplicated);

    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    setActiveBlockId(duplicated.id);
    triggerAutosave(updatedProcess);

    toast.success('Bloco duplicado');

    // Smooth scroll to duplicated block
    setTimeout(() => {
      const el = document.getElementById(`block-card-${duplicated.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Update block content/settings
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

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      if (!processo) return;
      
      const oldIndex = processo.blocks.findIndex(b => b.id === active.id);
      const newIndex = processo.blocks.findIndex(b => b.id === over.id);
      
      const updatedBlocks = arrayMove(processo.blocks, oldIndex, newIndex);
      const updatedProcess = { ...processo, blocks: updatedBlocks };
      
      setProcesso(updatedProcess);
      triggerAutosave(updatedProcess);
      
      toast.success('Posição do bloco atualizada');
    }
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
          <Workflow className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">Processo não encontrado</h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            O processo de aprovação que você tentou acessar não existe ou foi excluído.
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/processos')}
          className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer border-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Voltar para Lista
        </Button>
      </div>
    );
  }

  // Check if we should allow page leave (for react router navigation)
  const handleBackNavigation = () => {
    if (saveStatus === 'unsaved') {
      const confirmLeave = window.confirm('Você possui alterações não salvas neste processo. Deseja realmente sair?');
      if (!confirmLeave) return;
    }
    navigate('/app/processos');
  };

  return (
    <div className="w-full">
      {/* Editor Status Action Bar */}
      <div className="flex items-center justify-between pb-3 bg-transparent -mt-2 mb-2 max-w-6xl mx-auto px-1">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-slate-450 hover:text-[#0d857a] text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista
        </button>

        <div className="flex items-center gap-3">
          {renderSaveStatus()}
          
          <Button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0d857a] border border-slate-200 h-8.5 px-3.5 text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
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
            />
          </DndContext>
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
    </div>
  );
}
