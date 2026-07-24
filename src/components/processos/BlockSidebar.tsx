import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, LayoutGrid } from 'lucide-react';

interface BlockSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockSidebar({ isOpen, onClose }: BlockSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#0d857a]" />
                <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
                  Adicionar Bloco
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                title="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50">
              <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-[#0d857a] shadow-inner">
                <Sparkles className="w-8 h-8 text-[#0d857a] animate-pulse" />
              </div>
              
              <div className="space-y-2 max-w-[280px]">
                <h4 className="font-bold text-slate-800 text-[14px]">
                  Componentes em Breve
                </h4>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Os componentes estarão disponíveis na próxima etapa da implementação.
                </p>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase border border-slate-200/60 rounded-full px-3.5 py-1 bg-white">
                PERSPECPACK Process Constructor
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
