import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Workflow, Sparkles, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProcessHeaderProps {
  name: string;
  description?: string;
  category?: string;
  organization?: string;
}

export default function ProcessHeader({ name, description, category, organization }: ProcessHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 border-b border-slate-200/80 pb-5 bg-white -mx-6 md:-mx-10 lg:-mx-12 xl:-mx-14 px-6 md:px-10 lg:px-12 xl:px-14 pt-2">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/modelos')}
          className="flex items-center gap-1.5 text-slate-455 hover:text-[#0d857a] text-[11px] font-semibold transition-colors cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Biblioteca de Modelos
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Editor de Modelos</span>
        </div>
      </div>

      {/* Main Title Block */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2 truncate">
              <Workflow className="w-5.5 h-5.5 text-[#0d857a] shrink-0" />
              {name}
            </h1>
            {category && (
              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200/80 text-[10px]">
                {category}
              </Badge>
            )}
            {organization && (
              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200/80 text-[10px]">
                {organization}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-[13px] text-slate-500 max-w-4xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
