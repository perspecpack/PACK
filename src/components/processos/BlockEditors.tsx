import React from 'react';
import { Block, ChoiceOption, DecisionOption, BLOCK_METADATA } from './BlockFactory';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Info, 
  HelpCircle, 
  Settings2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface EditorProps {
  block: Block;
  onChange: (updatedBlock: Block) => void;
  errors: string[];
}

// 1. TÍTULO E TEXTO
export function HeadingTextBlockEditor({ block, onChange, errors }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Digite um título..."
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor={`desc-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Descrição / Texto de Apoio
        </Label>
        <Textarea
          id={`desc-${block.id}`}
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Digite instruções ou informações detalhadas para o usuário..."
          className="min-h-[90px] border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px] p-2.5"
        />
      </div>

      {errors.includes('title_or_description') && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Preencha pelo menos o título ou a descrição deste bloco.</span>
        </div>
      )}
    </div>
  );
}

// 2. & 3. RESPOSTA CURTA E LONGA
export function TextAnswerBlockEditor({ block, onChange }: EditorProps) {
  const isLong = block.type === 'long_answer';
  
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título da Pergunta / Campo
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder={isLong ? "Ex: Descreva o parecer técnico final..." : "Ex: Código do Dispositivo"}
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`desc-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Orientação ou Descrição (opcional)
        </Label>
        <Input
          id={`desc-${block.id}`}
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Ex: Informe exatamente como consta na placa de identificação."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px]"
        />
      </div>

      {/* Field Preview (Simulated Input) */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Pré-visualização do Campo
        </span>
        {isLong ? (
          <div className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-400 text-xs select-none">
            Área de resposta de texto longo...
          </div>
        ) : (
          <div className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2.5 flex items-center text-slate-450 text-xs select-none">
            Linha de resposta curta...
          </div>
        )}
      </div>

      {/* Configurações Extra */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-slate-400" />
            Configurações do Campo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`placeholder-${block.id}`} className="text-[11px] font-semibold text-slate-500">
              Texto de Exemplo / Placeholder (opcional)
            </Label>
            <Input
              id={`placeholder-${block.id}`}
              type="text"
              value={block.placeholder || ''}
              onChange={(e) => onChange({ ...block, placeholder: e.target.value })}
              placeholder="Ex: Digite aqui..."
              className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`max-len-${block.id}`} className="text-[11px] font-semibold text-slate-500">
              Limite Máximo de Caracteres (opcional)
            </Label>
            <Input
              id={`max-len-${block.id}`}
              type="number"
              value={block.maxLength !== undefined ? block.maxLength : ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : undefined;
                onChange({ ...block, maxLength: val });
              }}
              placeholder="Sem limite definido"
              className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 4., 5. & 6. MÚLTIPLA ESCOLHA, CAIXAS DE SELEÇÃO E LISTA SUSPENSA
export function ChoiceAnswerBlockEditor({ block, onChange, errors }: EditorProps) {
  const isMultiple = block.type === 'multiple_choice';
  const isCheckbox = block.type === 'checkbox';
  const isDropdown = block.type === 'dropdown';

  const options = block.options || [];

  const handleOptionTextChange = (optId: string, text: string) => {
    const updatedOptions = options.map(opt => opt.id === optId ? { ...opt, text } : opt);
    onChange({ ...block, options: updatedOptions });
  };

  const handleAddOption = () => {
    const nextId = String(options.reduce((max, opt) => Math.max(max, parseInt(opt.id) || 0), 0) + 1);
    const newOptions = [...options, { id: nextId, text: `Opção ${nextId}` }];
    onChange({ ...block, options: newOptions });
  };

  const handleRemoveOption = (optId: string) => {
    const updatedOptions = options.filter(opt => opt.id !== optId);
    onChange({ ...block, options: updatedOptions });
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === options.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedOptions = [...options];
    const temp = updatedOptions[index];
    updatedOptions[index] = updatedOptions[newIndex];
    updatedOptions[newIndex] = temp;

    onChange({ ...block, options: updatedOptions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título da Pergunta
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Qual o tipo de material inspecionado?"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`desc-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Descrição ou Instrução (opcional)
        </Label>
        <Input
          id={`desc-${block.id}`}
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Ex: Escolha a opção correspondente ao relatório do fornecedor."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px]"
        />
      </div>

      {/* Options List */}
      <div className="space-y-2 pt-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Opções de Escolha
        </Label>

        {options.map((opt, index) => (
          <div key={opt.id} className="flex items-center gap-2 group/option">
            <span className="text-slate-350 text-xs w-4 font-mono select-none">
              {index + 1}.
            </span>
            
            <Input
              type="text"
              value={opt.text}
              onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
              placeholder={`Opção ${index + 1}`}
              className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs flex-1"
            />

            <div className="flex items-center gap-1 opacity-0 group-hover/option:opacity-100 transition-all shrink-0">
              <button
                type="button"
                onClick={() => handleMoveOption(index, 'up')}
                disabled={index === 0}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                title="Mover para cima"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveOption(index, 'down')}
                disabled={index === options.length - 1}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                title="Mover para baixo"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveOption(opt.id)}
                disabled={options.length <= 1}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                title="Remover opção"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddOption}
          className="flex items-center gap-1.5 text-xs text-[#0d857a] hover:text-[#0b6a62] font-semibold pt-1 transition-colors cursor-pointer border-0 bg-transparent"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Opção
        </button>

        {errors.includes('options') && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Este bloco deve possuir pelo menos 2 opções válidas e não duplicadas.</span>
          </div>
        )}
      </div>

      {/* Choice Settings */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Settings2 className="w-4 h-4 text-slate-400" />
          Configurações Extras
        </span>

        <div className="space-y-3">
          {(isMultiple || isCheckbox) && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-650 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={block.allowOther || false}
                onChange={(e) => onChange({ ...block, allowOther: e.target.checked })}
                className="rounded border-slate-300 text-[#0d857a] focus:ring-[#0d857a]/20 w-4 h-4 cursor-pointer"
              />
              Permitir opção "Outro"
            </label>
          )}

          {isCheckbox && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor={`min-sel-${block.id}`} className="text-[11px] font-semibold text-slate-500">
                  Seleções Mínimas (opcional)
                </Label>
                <Input
                  id={`min-sel-${block.id}`}
                  type="number"
                  value={block.minSelections !== undefined ? block.minSelections : ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    onChange({ ...block, minSelections: val });
                  }}
                  placeholder="Sem mínimo"
                  className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`max-sel-${block.id}`} className="text-[11px] font-semibold text-slate-500">
                  Seleções Máximas (opcional)
                </Label>
                <Input
                  id={`max-sel-${block.id}`}
                  type="number"
                  value={block.maxSelections !== undefined ? block.maxSelections : ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    onChange({ ...block, maxSelections: val });
                  }}
                  placeholder="Sem máximo"
                  className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
                />
              </div>

              {(errors.includes('minSelections') || errors.includes('maxSelections')) && (
                <div className="col-span-1 md:col-span-2 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>A quantidade máxima não pode ser menor que a mínima e os valores devem ser positivos.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 7. DATA
export function DateBlockEditor({ block, onChange, errors }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título da Pergunta
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Data da Inspeção Visual"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`desc-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Descrição ou Instrução (opcional)
        </Label>
        <Input
          id={`desc-${block.id}`}
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Ex: Informe a data em que o comissionamento foi concluído."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px]"
        />
      </div>

      {/* Date Settings */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Settings2 className="w-4 h-4 text-slate-400" />
          Restrições de Data
        </span>

        <div className="space-y-3">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-650 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={block.allowPastDates ?? true}
                onChange={(e) => onChange({ ...block, allowPastDates: e.target.checked })}
                className="rounded border-slate-300 text-[#0d857a] focus:ring-[#0d857a]/20 w-4 h-4 cursor-pointer"
              />
              Permitir datas passadas
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-650 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={block.allowFutureDates ?? true}
                onChange={(e) => onChange({ ...block, allowFutureDates: e.target.checked })}
                className="rounded border-slate-300 text-[#0d857a] focus:ring-[#0d857a]/20 w-4 h-4 cursor-pointer"
              />
              Permitir datas futuras
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor={`min-date-${block.id}`} className="text-[11px] font-semibold text-slate-500">
                Data Mínima (opcional)
              </Label>
              <Input
                id={`min-date-${block.id}`}
                type="date"
                value={block.minDate || ''}
                onChange={(e) => onChange({ ...block, minDate: e.target.value || undefined })}
                className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`max-date-${block.id}`} className="text-[11px] font-semibold text-slate-500">
                Data Máxima (opcional)
              </Label>
              <Input
                id={`max-date-${block.id}`}
                type="date"
                value={block.maxDate || ''}
                onChange={(e) => onChange({ ...block, maxDate: e.target.value || undefined })}
                className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
              />
            </div>

            {errors.includes('maxDate') && (
              <div className="col-span-1 md:col-span-2 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>A data máxima não pode ser anterior à data mínima.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. UPLOAD DE ARQUIVO
export function FileUploadBlockEditor({ block, onChange, errors }: EditorProps) {
  const allowedTypes = block.allowedFileTypes || [];

  const handleTypeToggle = (type: string) => {
    const nextTypes = allowedTypes.includes(type)
      ? allowedTypes.filter(t => t !== type)
      : [...allowedTypes, type];
    onChange({ ...block, allowedFileTypes: nextTypes });
  };

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'images', label: 'Imagens (PNG, JPG, etc)' },
    { value: 'documents', label: 'Documentos (DOCX, TXT)' },
    { value: 'spreadsheets', label: 'Planilhas (XLSX, CSV)' },
    { value: 'cad', label: 'Arquivos CAD (STEP, DWG)' },
    { value: 'others', label: 'Outros' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título do Campo de Upload
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Anexar Relatório de Medição 3D"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`desc-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Instruções ou Descrição (opcional)
        </Label>
        <Input
          id={`desc-${block.id}`}
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Ex: Envie o documento assinado digitalmente."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px]"
        />
      </div>

      {/* Preview box */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Pré-visualização do Campo
        </span>
        <div className="w-full border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2 select-none">
          <UploadCloudIcon className="w-8 h-8 text-slate-400" />
          <span className="text-xs font-semibold text-slate-650">Clique para enviar ou arraste os arquivos</span>
          <span className="text-[10px] text-slate-400">
            Máx: {block.maxFiles || 1} arquivo(s) de até {block.maxSizeMB || 10} MB.
          </span>
          <div className="flex gap-1.5 flex-wrap justify-center pt-1">
            {allowedTypes.map(t => (
              <span key={t} className="text-[9px] font-bold text-slate-500 bg-slate-200/60 border border-slate-300/40 px-1.5 py-0.5 rounded uppercase">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Configs */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Settings2 className="w-4 h-4 text-slate-400" />
          Configurações de Arquivo
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`max-files-${block.id}`} className="text-[11px] font-semibold text-slate-500">
              Qtd Máxima de Arquivos
            </Label>
            <Input
              id={`max-files-${block.id}`}
              type="number"
              min="1"
              value={block.maxFiles || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : 1;
                onChange({ ...block, maxFiles: val });
              }}
              className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`max-size-${block.id}`} className="text-[11px] font-semibold text-slate-500">
              Tamanho Máximo por Arquivo (MB)
            </Label>
            <Input
              id={`max-size-${block.id}`}
              type="number"
              min="1"
              value={block.maxSizeMB || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : 10;
                onChange({ ...block, maxSizeMB: val });
              }}
              className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Formatos Permitidos
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fileTypeOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowedTypes.includes(opt.value)}
                  onChange={() => handleTypeToggle(opt.value)}
                  className="rounded border-slate-300 text-[#0d857a] focus:ring-[#0d857a]/20 w-4 h-4 cursor-pointer"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {errors.includes('allowedFileTypes') && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Selecione pelo menos um tipo de formato de arquivo.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 9. DECISÃO DE APROVAÇÃO
export function ApprovalDecisionBlockEditor({ block, onChange, errors }: EditorProps) {
  const decisions = block.decisions || [];

  const handleDecisionTextChange = (decId: string, text: string) => {
    const updated = decisions.map(d => d.id === decId ? { ...d, text } : d);
    onChange({ ...block, decisions: updated });
  };

  const handleDecisionSemanticChange = (decId: string, semanticType: DecisionOption['semanticType']) => {
    const updated = decisions.map(d => d.id === decId ? { ...d, semanticType } : d);
    onChange({ ...block, decisions: updated });
  };

  const handleDecisionCommentToggle = (decId: string, requireComment: boolean) => {
    const updated = decisions.map(d => d.id === decId ? { ...d, requireComment } : d);
    onChange({ ...block, decisions: updated });
  };

  const handleAddDecision = () => {
    const nextId = String(decisions.reduce((max, d) => Math.max(max, parseInt(d.id) || 0), 0) + 1);
    const newDecisions = [
      ...decisions,
      { id: nextId, text: `Decisão ${nextId}`, semanticType: 'neutral' as const, requireComment: false }
    ];
    onChange({ ...block, decisions: newDecisions });
  };

  const handleRemoveDecision = (decId: string) => {
    const updated = decisions.filter(d => d.id !== decId);
    onChange({ ...block, decisions: updated });
  };

  const handleMoveDecision = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === decisions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...decisions];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    onChange({ ...block, decisions: updated });
  };

  const semanticStyles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    attention: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    negative: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
  };

  const semanticLabels = {
    positive: 'Positivo',
    attention: 'Atenção',
    negative: 'Negativo',
    neutral: 'Neutro'
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título da Seção de Aprovação
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Parecer do Responsável de Qualidade"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`desc-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Descrição ou Instrução (opcional)
        </Label>
        <Input
          id={`desc-${block.id}`}
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Ex: Registre sua aprovação após auditar a documentação."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px]"
        />
      </div>

      {/* Decisions List */}
      <div className="space-y-3 pt-2">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Decisões Disponíveis
        </Label>

        <div className="space-y-3.5">
          {decisions.map((dec, index) => (
            <div key={dec.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 flex flex-col gap-3 group/decision relative">
              <div className="flex items-center gap-2.5">
                <span className="text-slate-350 text-xs font-mono select-none w-4">
                  {index + 1}.
                </span>
                
                <Input
                  type="text"
                  value={dec.text}
                  onChange={(e) => handleDecisionTextChange(dec.id, e.target.value)}
                  placeholder={`Decisão ${index + 1}`}
                  className="h-8 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-xs flex-1 bg-white"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveDecision(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-450 hover:text-slate-650 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                    title="Mover"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDecision(index, 'down')}
                    disabled={index === decisions.length - 1}
                    className="p-1 text-slate-450 hover:text-slate-650 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                    title="Mover"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDecision(dec.id)}
                    disabled={decisions.length <= 2}
                    className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Semantic Types Selection & Comment Flag */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-6.5">
                {/* Type Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Cor:</span>
                  {(['positive', 'attention', 'negative', 'neutral'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleDecisionSemanticChange(dec.id, type)}
                      className={`text-[10px] px-2.5 py-0.5 border rounded-full font-semibold transition-all cursor-pointer ${
                        dec.semanticType === type 
                          ? semanticStyles[type] + ' border-current scale-105 shadow-xs ring-1 ring-offset-1 ring-slate-100'
                          : 'bg-white text-slate-450 hover:text-slate-650 border-slate-200'
                      }`}
                    >
                      {semanticLabels[type]}
                    </button>
                  ))}
                </div>

                {/* Comment Flag */}
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer select-none self-start sm:self-center">
                  <input
                    type="checkbox"
                    checked={dec.requireComment}
                    onChange={(e) => handleDecisionCommentToggle(dec.id, e.target.checked)}
                    className="rounded border-slate-300 text-[#0d857a] focus:ring-[#0d857a]/20 w-3.5 h-3.5 cursor-pointer"
                  />
                  Exigir comentário
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddDecision}
          className="flex items-center gap-1.5 text-xs text-[#0d857a] hover:text-[#0b6a62] font-semibold pt-1 transition-colors cursor-pointer border-0 bg-transparent"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Decisão
        </button>

        {errors.includes('decisions') && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>O bloco deve conter pelo menos 2 decisões válidas e não duplicadas.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Upload Cloud Icon SVG Helper since we use lucide-react but want a nice helper
function UploadCloudIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.04-1.29-1.92-2.34-2.34A5.5 5.5 0 0 0 4 11.5c0 2.79 2.54 4.5 5 4.5" />
      <path d="M12 13v6" />
      <path d="m9 16 3-3 3 3" />
    </svg>
  );
}
