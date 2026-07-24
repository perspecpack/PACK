import React from 'react';
import { Sparkles, Construction, HelpCircle, LayoutDashboard, FolderKanban, ShieldCheck, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface ProvisionalPageProps {
  title: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'Visão Geral': LayoutDashboard,
  'Meus Projetos': FolderKanban,
  'Aprovações': ShieldCheck,
  'Configurações': Settings,
  'Ajuda e Suporte': HelpCircle,
};

export default function ProvisionalPage({ title }: ProvisionalPageProps) {
  const Icon = ICON_MAP[title] || Construction;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#F8FAFC]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6 flex flex-col items-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-650 shadow-inner">
          <Icon className="w-8 h-8 text-teal-600 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <div className="h-0.5 w-12 bg-[#00F59B] mx-auto rounded-full" />
        </div>

        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
          Este módulo será disponibilizado em uma próxima atualização.
        </p>

        <div className="pt-2 text-xs font-semibold text-teal-650 flex items-center gap-1.5 justify-center">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>PERSPECPACK Innovation</span>
        </div>
      </motion.div>
    </div>
  );
}
