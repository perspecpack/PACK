import React from 'react';
import { AlertCircle } from 'lucide-react';
import { BlockType, BLOCK_METADATA } from './BlockFactory';
import { RendererMode } from './ApprovalDocumentRenderer';

interface BlockFieldHeaderProps {
  title: string;
  description?: string;
  required: boolean;
  blockType: BlockType;
  mode: RendererMode;
  validationMessage?: string;
}

export default function BlockFieldHeader({
  title,
  description,
  required,
  blockType,
  mode,
  validationMessage
}: BlockFieldHeaderProps) {
  const isEditor = mode === 'template-editor';
  const hasConfiguredTitle = title && title.trim().length > 0;
  
  // Use block metadata default title as fallback if no custom title is configured
  const displayTitle = hasConfiguredTitle 
    ? title 
    : (BLOCK_METADATA[blockType]?.title || 'Campo de Resposta');

  return (
    <div className="space-y-1.5 mb-3 text-left">
      {/* Title & Required Indicator */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <h4 className={`font-bold text-slate-800 text-[13px] sm:text-[14px] leading-snug tracking-tight ${
          !hasConfiguredTitle ? 'text-slate-500 italic' : ''
        }`}>
          {displayTitle}
        </h4>
        {required && (
          <span className="text-red-500 font-bold text-xs select-none" title="Campo obrigatório">
            *
          </span>
        )}
      </div>

      {/* Description / Instructions */}
      {description && description.trim().length > 0 ? (
        <p className="text-slate-500 text-[11.5px] leading-relaxed whitespace-pre-line">
          {description}
        </p>
      ) : null}

      {/* Editor Warning for empty titles (legacy blocks fallback check) */}
      {isEditor && !hasConfiguredTitle && (
        <p className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg w-fit mt-1 select-none animate-in fade-in duration-200">
          Adicione um título para tornar este campo mais claro para o cliente.
        </p>
      )}

      {/* Validation Message */}
      {validationMessage && (
        <p className="text-[10.5px] text-red-500 font-semibold flex items-center gap-1 mt-1.5 animate-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>{validationMessage}</span>
        </p>
      )}
    </div>
  );
}
