import React from 'react';
import { motion } from 'motion/react';
import { Plus, LayoutGrid, PlusCircle, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Block } from './BlockFactory';
import BlockRenderer from './BlockRenderer';

interface ProcessCanvasProps {
  blocks: Block[];
  activeBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, updatedBlock: Block) => void;
  onAddBlockClick: () => void;
  onDeleteBlockClick: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (id: string) => void;
}

export default function ProcessCanvas({
  blocks,
  activeBlockId,
  onSelectBlock,
  onUpdateBlock,
  onAddBlockClick,
  onDeleteBlockClick,
  onMoveBlock,
  onDuplicateBlock
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
            <LayoutGrid className="w-5.5 h-5.5 text-slate-450" />
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
        /* Canvas with Blocks (connected visually) */
        <div className="max-w-2xl mx-auto w-full space-y-6 px-1">
          {blocks.map((block, index) => (
            <React.Fragment key={block.id}>
              {index > 0 && (
                <div className="flex justify-center -my-3 h-6 relative">
                  <div className="w-0.5 bg-slate-200 absolute top-0 bottom-0" />
                  <div className="w-5 h-5 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs z-10">
                    <ArrowDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              )}
              <div
                id={`block-card-${block.id}`}
                className="scroll-mt-24"
              >
                <BlockRenderer
                  block={block}
                  isActive={activeBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onChange={(updatedBlock) => onUpdateBlock(block.id, updatedBlock)}
                  onDelete={() => onDeleteBlockClick(block.id)}
                  onMove={(direction) => onMoveBlock(block.id, direction)}
                  onDuplicate={() => onDuplicateBlock(block.id)}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                />
              </div>
            </React.Fragment>
          ))}

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
