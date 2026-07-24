import React from 'react';
import { Block, BLOCK_METADATA } from './BlockFactory';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BlockRendererProps {
  block: Block;
  onDelete?: (id: string) => void;
}

export default function BlockRenderer({ block, onDelete }: BlockRendererProps) {
  // Dynamically resolve icon from lucide-react if available, or fallback to FileText
  const meta = BLOCK_METADATA[block.type];
  const IconComponent = (LucideIcons as any)[meta?.icon || 'FileText'] || LucideIcons.FileText;

  return (
    <Card className="border border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl bg-white overflow-hidden group">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200/85 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/20 transition-all">
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 text-[14px] truncate">
              {block.title}
            </h4>
            {onDelete && (
              <button
                onClick={() => onDelete(block.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                title="Excluir Bloco"
              >
                <LucideIcons.Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {block.description && (
            <p className="text-slate-450 text-[12px] leading-relaxed">
              {block.description}
            </p>
          )}
          <div className="pt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
              Bloco Estrutural
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
