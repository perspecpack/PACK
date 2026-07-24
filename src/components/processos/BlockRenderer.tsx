import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Block, 
  BLOCK_METADATA, 
  validateBlock 
} from './BlockFactory';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Asterisk,
  Settings2,
  GripVertical
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  HeadingTextBlockEditor, 
  TextAnswerBlockEditor, 
  ChoiceAnswerBlockEditor, 
  DateBlockEditor, 
  FileUploadBlockEditor, 
  ApprovalDecisionBlockEditor,
  AcknowledgementBlockEditor
} from './BlockEditors';
import * as LucideIcons from 'lucide-react';

interface BlockRendererProps {
  block: Block;
  isActive: boolean;
  onSelect: () => void;
  onChange: (updatedBlock: Block) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function BlockRenderer({
  block,
  isActive,
  onSelect,
  onChange,
  onDelete,
  onMove,
  onDuplicate,
  isFirst,
  isLast
}: BlockRendererProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const meta = BLOCK_METADATA[block.type];
  const IconComponent = (LucideIcons as any)[meta?.icon || 'FileText'] || LucideIcons.FileText;

  // dnd-kit sortable integration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined
  };

  // Run validation
  const errors = validateBlock(block);
  const hasErrors = errors.length > 0;
  const errorFields = errors.map(err => err.field);

  // Render the editor based on block type
  const renderEditor = () => {
    const props = { block, onChange, errors: errorFields };
    switch (block.type) {
      case 'heading_text':
        return <HeadingTextBlockEditor {...props} />;
      case 'short_answer':
      case 'long_answer':
        return <TextAnswerBlockEditor {...props} />;
      case 'multiple_choice':
      case 'checkbox':
      case 'dropdown':
        return <ChoiceAnswerBlockEditor {...props} />;
      case 'date':
        return <DateBlockEditor {...props} />;
      case 'file_upload':
        return <FileUploadBlockEditor {...props} />;
      case 'approval_decision':
        return <ApprovalDecisionBlockEditor {...props} />;
      case 'acknowledgement':
        return <AcknowledgementBlockEditor {...props} />;
      default:
        return null;
    }
  };

  // Render read-only preview of the block when not active
  const renderPreview = () => {
    switch (block.type) {
      case 'heading_text':
        return (
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-[16px] leading-tight">
              {block.title || <span className="text-slate-300 italic">Sem título</span>}
            </h4>
            {block.description && (
              <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">
                {block.description}
              </p>
            )}
          </div>
        );

      case 'short_answer':
      case 'long_answer':
        return (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-[14px] leading-tight flex items-center gap-1">
                {block.title || <span className="text-slate-300 italic">Sem pergunta</span>}
                {block.required && <Asterisk className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </h4>
              {block.description && <p className="text-slate-450 text-[11px] leading-normal">{block.description}</p>}
            </div>
            {block.type === 'long_answer' ? (
              <div className="w-full h-14 bg-slate-50/50 border border-slate-200/80 rounded-lg p-2 text-slate-400 text-xs select-none">
                {block.placeholder || 'Resposta longa...'}
              </div>
            ) : (
              <div className="w-full h-8.5 bg-slate-50/50 border border-slate-200/80 rounded-lg px-2.5 flex items-center text-slate-400 text-xs select-none">
                {block.placeholder || 'Resposta curta...'}
              </div>
            )}
          </div>
        );

      case 'multiple_choice':
      case 'checkbox':
      case 'dropdown':
        return (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-[14px] leading-tight flex items-center gap-1">
                {block.title || <span className="text-slate-300 italic">Sem pergunta</span>}
                {block.required && <Asterisk className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </h4>
              {block.description && <p className="text-slate-450 text-[11px] leading-normal">{block.description}</p>}
            </div>

            {block.type === 'dropdown' ? (
              <div className="w-full max-w-xs h-8.5 bg-slate-50/50 border border-slate-200/80 rounded-lg px-2.5 flex items-center justify-between text-slate-400 text-xs select-none">
                <span>Selecione uma opção...</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {(block.options || []).map(opt => (
                  <div key={opt.id} className="flex items-center gap-2.5">
                    <div className={`h-4.5 w-4.5 border border-slate-300 bg-slate-50/40 ${block.type === 'multiple_choice' ? 'rounded-full' : 'rounded'}`} />
                    <span className="text-[12px] text-slate-650 font-medium">{opt.text}</span>
                  </div>
                ))}
                {block.allowOther && (
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4.5 w-4.5 border border-slate-300 bg-slate-50/40 ${block.type === 'multiple_choice' ? 'rounded-full' : 'rounded'}`} />
                    <span className="text-[12px] text-slate-400 italic">Outro...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-[14px] leading-tight flex items-center gap-1">
                {block.title || <span className="text-slate-300 italic">Sem pergunta</span>}
                {block.required && <Asterisk className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </h4>
              {block.description && <p className="text-slate-450 text-[11px] leading-normal">{block.description}</p>}
            </div>
            <div className="w-full max-w-xs h-8.5 bg-slate-50/50 border border-slate-200/80 rounded-lg px-2.5 flex items-center justify-between text-slate-400 text-xs select-none">
              <span>DD/MM/AAAA</span>
              <LucideIcons.Calendar className="w-4 h-4 text-slate-450" />
            </div>
          </div>
        );

      case 'file_upload':
        return (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-[14px] leading-tight flex items-center gap-1">
                {block.title || <span className="text-slate-300 italic">Sem pergunta</span>}
                {block.required && <Asterisk className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </h4>
              {block.description && <p className="text-slate-450 text-[11px] leading-normal">{block.description}</p>}
            </div>
            <div className="w-full max-w-sm border border-dashed border-slate-250 rounded-xl p-4 bg-slate-50/20 flex flex-col items-center justify-center text-center space-y-1.5 select-none">
              <LucideIcons.UploadCloud className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Enviar arquivo</span>
              <span className="text-[10px] text-slate-400">
                Máx: {block.maxFiles || 1} arquivo(s) até {block.maxSizeMB || 10} MB.
              </span>
            </div>
          </div>
        );

      case 'approval_decision':
        return (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-[14px] leading-tight flex items-center gap-1">
                {block.title || <span className="text-slate-300 italic">Sem título de decisão</span>}
                {block.required && <Asterisk className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </h4>
              {block.description && <p className="text-slate-450 text-[11px] leading-normal">{block.description}</p>}
            </div>
            
            <div className="flex gap-2 flex-wrap pt-1">
              {(block.decisions || []).map(dec => {
                const stylePill = 
                  dec.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  dec.semanticType === 'attention' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  dec.semanticType === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-slate-50 text-slate-700 border-slate-200';
                
                return (
                  <span key={dec.id} className={`text-[11px] px-3 py-1 border rounded-xl font-bold uppercase tracking-wider ${stylePill}`}>
                    {dec.text}
                  </span>
                );
              })}
            </div>
          </div>
        );

      case 'acknowledgement':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-[14px] leading-tight flex items-center gap-1">
                {block.title || <span className="text-slate-300 italic">Sem declaração</span>}
                {block.required && <Asterisk className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </h4>
              {block.description && <p className="text-slate-450 text-[11px] leading-normal">{block.description}</p>}
            </div>
            <div className="flex items-start gap-3 bg-slate-50/50 border border-slate-200/80 p-4.5 rounded-xl select-none">
              <div className="h-4.5 w-4.5 border border-slate-300 bg-slate-50/40 rounded mt-0.5" />
              <span className="text-[13px] leading-relaxed text-slate-650 font-medium">
                {block.declarationText || 'Texto da declaração de ciência...'}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isHeading = block.type === 'heading_text';

  return (
    <Card 
      ref={setNodeRef}
      style={dndStyle}
      onClick={onSelect}
      className={`border transition-all duration-200 rounded-2xl bg-white relative overflow-hidden group/card cursor-pointer select-none ${
        isActive 
          ? 'border-[#0d857a] shadow-md ring-1 ring-[#0d857a]/20' 
          : hasErrors 
            ? 'border-red-200 hover:border-red-300 shadow-xs'
            : 'border-slate-200 hover:border-slate-300/90 shadow-xs'
      }`}
    >
      {/* Selected Indicator Bar */}
      {isActive && (
        <div className="absolute top-0 left-0 bottom-0 w-[5px] bg-[#00F59B]" />
      )}

      {/* Main Container */}
      <CardContent className={`p-6 ${isActive ? 'pl-7.5' : 'pl-6'}`}>
        <div className="flex items-start gap-3">
          {/* Grip Handle for Drag and Drop */}
          <div 
            {...attributes}
            {...listeners}
            className="flex items-center justify-center p-1 text-slate-300 hover:text-slate-500 rounded-md cursor-grab active:cursor-grabbing hover:bg-slate-100/70 shrink-0 select-none focus:outline-none focus:ring-1 focus:ring-[#0d857a] transition-all"
            aria-label="Reordenar bloco"
            title="Arraste para reordenar o bloco"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Block Icon Label */}
          <div className={`h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 transition-colors ${
            isActive ? 'bg-[#0d857a]/5 text-[#0d857a] border-[#0d857a]/20' : 'text-slate-400 group-hover/card:text-slate-650'
          }`}>
            <IconComponent className="w-4.5 h-4.5" />
          </div>

          {/* Body Section */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* If active show editor, otherwise show preview */}
            {isActive ? renderEditor() : renderPreview()}

            {/* Error Message Block */}
            {hasErrors && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50/50 border border-red-100 rounded-xl px-3 py-2 mt-2 w-fit">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors[0].message}</span>
              </div>
            )}

            {/* Selected Block Action Panel (Directly inside Card) */}
            {isActive && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                {/* Left: Reordering & Duplication & Delete */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMove('up'); }}
                    disabled={isFirst}
                    className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                    title="Mover para Cima"
                    aria-label="Mover bloco para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMove('down'); }}
                    disabled={isLast}
                    className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                    title="Mover para Baixo"
                    aria-label="Mover bloco para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-6 w-px bg-slate-200 mx-1" />
                  
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                    className="h-8 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-650 transition-all cursor-pointer"
                    title="Duplicar Bloco"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="h-8 px-2.5 bg-slate-50 hover:bg-red-50 hover:border-red-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-slate-200 transition-all cursor-pointer"
                    title="Excluir Bloco"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>

                {/* Right: Required Switch (only if not heading_text) */}
                {!isHeading && (
                  <div className="flex items-center gap-3 self-end sm:self-center select-none bg-slate-50/60 border border-slate-150 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Obrigatório
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.required}
                        onChange={(e) => onChange({ ...block, required: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d857a]"></div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
