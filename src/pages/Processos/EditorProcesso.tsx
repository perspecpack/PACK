import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Workflow, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import processes sub-components
import EditorLayout from '@/src/components/processos/EditorLayout';
import ProcessHeader from '@/src/components/processos/ProcessHeader';
import ProcessCanvas from '@/src/components/processos/ProcessCanvas';
import BlockSidebar from '@/src/components/processos/BlockSidebar';
import { Block } from '@/src/components/processos/BlockFactory';

interface Processo {
  id: string;
  name: string;
  description: string;
  category?: string;
  organization?: string;
  createdAt: string;
  blocksCount: number;
  blocks: Block[];
}

export default function EditorProcesso() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('perspecpack:processos');
      if (stored) {
        const list: Processo[] = JSON.parse(stored);
        const found = list.find(p => p.id === id);
        if (found) {
          // Backward compatibility check for blocks array
          if (!found.blocks) {
            found.blocks = [];
          }
          setProcesso(found);
        }
      }
    } catch (e) {
      console.error('Error loading process in editor', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!processo) return;
    
    try {
      const updatedBlocks = processo.blocks.filter(b => b.id !== blockId);
      const updatedProcess = {
        ...processo,
        blocks: updatedBlocks,
        blocksCount: updatedBlocks.length
      };

      setProcesso(updatedProcess);

      // Save back to localStorage
      const stored = localStorage.getItem('perspecpack:processos');
      if (stored) {
        const list: Processo[] = JSON.parse(stored);
        const updatedList = list.map(p => p.id === processo.id ? updatedProcess : p);
        localStorage.setItem('perspecpack:processos', JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error('Error deleting block', e);
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-slate-200/80 rounded-2xl max-w-md mx-auto space-y-6 shadow-xs">
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
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
          <ProcessCanvas
            blocks={processo.blocks || []}
            onAddBlockClick={handleOpenSidebar}
            onDeleteBlock={handleDeleteBlock}
          />
        }
        sidebar={
          <BlockSidebar
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
          />
        }
      />
    </motion.div>
  );
}
