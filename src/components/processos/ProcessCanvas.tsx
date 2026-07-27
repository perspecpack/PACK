import React from 'react';
import { motion } from 'motion/react';
import { Plus, LayoutGrid, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Block } from './BlockFactory';
import ApprovalDocumentRenderer, { CompanyBrandingData, DocumentData } from './ApprovalDocumentRenderer';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ProcessCanvasProps {
  blocks: Block[];
  activeBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, updatedBlock: Block) => void;
  onAddBlockClick: () => void;
  onDeleteBlockClick: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (id: string) => void;
  companyBranding?: CompanyBrandingData;
  documentData?: DocumentData;
}

export default function ProcessCanvas({
  blocks,
  activeBlockId,
  onSelectBlock,
  onUpdateBlock,
  onAddBlockClick,
  onDeleteBlockClick,
  onMoveBlock,
  onDuplicateBlock,
  companyBranding,
  documentData
}: ProcessCanvasProps) {
  return (
    <div className="flex-1 flex flex-col justify-center min-h-[50vh] py-8">
      {blocks.length === 0 ? (
        /* Empty Canvas State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md mx-auto w-full bg-white border border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-xs hover:border-[#0d857a]/45 transition-colors"
        >
          <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-inner">
            <LayoutGrid className="w-5.5 h-5.5 text-slate-455" />
          </div>

          <div className="space-y-2">
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Este processo ainda não possui nenhum componente.
            </p>
            <p className="text-[12px] text-slate-400">
              Clique no botão abaixo para adicionar o primeiro bloco.
            </p>
          </div>

          <Button
            onClick={onAddBlockClick}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 cursor-pointer border-0 text-[12px]"
          >
            <Plus className="w-4 h-4 text-slate-900 stroke-[3px]" />
            Adicionar Bloco
          </Button>
        </motion.div>
      ) : (
        /* Canvas with unified renderer */
        <div className="w-full space-y-6">
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <ApprovalDocumentRenderer
              mode="template-editor"
              blocks={blocks}
              activeBlockId={activeBlockId}
              onSelectBlock={onSelectBlock}
              onUpdateBlock={onUpdateBlock}
              onDeleteBlock={onDeleteBlockClick}
              onMoveBlock={onMoveBlock}
              onDuplicateBlock={onDuplicateBlock}
              companyBranding={companyBranding}
              documentData={documentData}
            />
          </SortableContext>

          {/* Add block button at the bottom of the list */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={onAddBlockClick}
              variant="outline"
              className="border border-slate-200 hover:border-[#0d857a]/40 bg-white hover:bg-slate-50 text-slate-655 hover:text-[#0d857a] text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar Bloco
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
