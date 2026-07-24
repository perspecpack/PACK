import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search,
  Type,
  Text,
  AlignLeft,
  CircleDot,
  CheckSquare2,
  ChevronDownSquare,
  CalendarDays,
  UploadCloud,
  ShieldCheck,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { BlockType, BLOCK_METADATA } from './BlockFactory';
import { Input } from '@/components/ui/input';

interface BlockSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: BlockType) => void;
}

const CATEGORY_LABELS = {
  content: 'Conteúdo',
  field: 'Campos de Resposta',
  approval: 'Aprovação'
};

const ICON_MAP = {
  Type,
  Text,
  AlignLeft,
  CircleDot,
  CheckSquare2,
  ChevronDownSquare,
  CalendarDays,
  UploadCloud,
  ShieldCheck
};

export default function BlockSidebar({ isOpen, onClose, onAddBlock }: BlockSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Define block items from the metadata registry
  const blockItems = Object.keys(BLOCK_METADATA).map(key => {
    const type = key as BlockType;
    return {
      type,
      ...BLOCK_METADATA[type]
    };
  });

  // Filter based on search query
  const filteredBlocks = blockItems.filter(
    block =>
      block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const categories: Record<'content' | 'field' | 'approval', typeof filteredBlocks> = {
    content: [],
    field: [],
    approval: []
  };

  filteredBlocks.forEach(block => {
    categories[block.category].push(block);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          />

          {/* Sidebar Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] md:w-[410px] bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
                Adicionar Bloco
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-655 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="px-6 py-3 border-b border-slate-100 shrink-0 bg-slate-50/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar blocos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 h-9 bg-white border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {filteredBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-3">
                  <FolderOpen className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs">Nenhum bloco encontrado para "{searchQuery}"</p>
                </div>
              ) : (
                Object.entries(categories).map(([catKey, items]) => {
                  if (items.length === 0) return null;
                  const categoryName = CATEGORY_LABELS[catKey as 'content' | 'field' | 'approval'];
                  
                  return (
                    <div key={catKey} className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                        {categoryName}
                      </h4>
                      
                      <div className="space-y-2">
                        {items.map(block => {
                          const IconComponent = (ICON_MAP as any)[block.icon] || Text;
                          
                          return (
                            <button
                              key={block.type}
                              onClick={() => {
                                onAddBlock(block.type);
                                onClose();
                              }}
                              className="w-full text-left p-3.5 bg-white border border-slate-150 rounded-xl hover:border-[#0d857a]/30 hover:bg-teal-50/5 hover:shadow-xs group flex items-start gap-3.5 transition-all duration-150 cursor-pointer"
                            >
                              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/20 flex items-center justify-center text-slate-500 shrink-0 transition-colors">
                                <IconComponent className="w-4.5 h-4.5" />
                              </div>

                              <div className="flex-1 min-w-0 space-y-0.5">
                                <h5 className="font-semibold text-slate-800 text-[13px] group-hover:text-[#0d857a] transition-colors leading-tight">
                                  {block.title}
                                </h5>
                                <p className="text-[11px] text-slate-450 leading-normal line-clamp-2">
                                  {block.description}
                                </p>
                              </div>

                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0d857a] group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
