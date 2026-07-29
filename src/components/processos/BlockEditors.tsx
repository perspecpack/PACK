import React from 'react';
import { Block, ChoiceOption, DecisionOption, BLOCK_METADATA, RequestInfoField } from './BlockFactory';
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
              Exemplo de preenchimento (opcional)
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

// 10. CONFIRMAÇÃO DE CIÊNCIA
export function AcknowledgementBlockEditor({ block, onChange, errors }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título do Bloco
        </Label>
        <Input
          id={`title-${block.id}`}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Declaração de Ciência"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[14px]"
        />
        {errors.includes('title') && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>O título é obrigatório.</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`decl-${block.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Texto da Declaração
        </Label>
        <Textarea
          id={`decl-${block.id}`}
          value={block.declarationText || ''}
          onChange={(e) => onChange({ ...block, declarationText: e.target.value })}
          placeholder="Digite a declaração de confirmação..."
          className="min-h-[100px] border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 text-[13px] p-2.5"
        />
        {errors.includes('declarationText') && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>O texto da declaração é obrigatório.</span>
          </div>
        )}
      </div>

      {/* Visual Simulation of the checkbox field in the editor */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-455 uppercase tracking-wider block mb-2.5">
          Pré-visualização do Campo
        </span>
        <div className="flex items-start gap-3 bg-slate-50/50 border border-slate-155 p-4.5 rounded-xl">
          <Checkbox 
            id={`preview-check-${block.id}`}
            disabled 
            className="mt-0.5 border-slate-300" 
          />
          <label 
            htmlFor={`preview-check-${block.id}`}
            className="text-[13px] leading-relaxed text-slate-700 font-medium select-none pointer-events-none"
          >
            {block.declarationText || 'Texto da declaração de ciência...'}
            {block.required && <span className="text-red-500 ml-1 font-bold">*</span>}
          </label>
        </div>
      </div>
    </div>
  );
}

// 10. INFORMAÇÕES GERAIS DA SOLICITAÇÃO
export function RequestInfoBlockEditor({ block, onChange }: EditorProps) {
  const fields = block.fields || [];

  const handleFieldChange = (fieldId: string, updates: Partial<RequestInfoField>) => {
    const updatedFields = fields.map(f => {
      if (f.id === fieldId) {
        const updated = { ...f, ...updates };
        if (f.key === 'title') {
          updated.enabled = true;
          updated.required = true;
        }
        return updated;
      }
      return f;
    });
    onChange({ ...block, fields: updatedFields });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título da Seção
        </Label>
        <Input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Informações Gerais da Solicitação"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Descrição da Seção
        </Label>
        <Input
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Instruções para o preenchimento..."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] text-[13px]"
        />
      </div>

      <div className="pt-2 border-t border-slate-100 space-y-3">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Configuração dos Campos
        </Label>
        
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {fields.map((field) => {
            let pSettings = {
              placeholder: 'Ex: Digite aqui...',
              helperText: 'Ex: Adicione orientações de preenchimento.'
            };
            switch (field.key) {
              case 'client':
                pSettings = {
                  placeholder: 'Ex: Volkswagen do Brasil',
                  helperText: 'Ex: Informe o nome da empresa ou organização que realizará a validação.'
                };
                break;
              case 'project':
                pSettings = {
                  placeholder: 'Ex: Rack Hyundai BC4B',
                  helperText: 'Ex: Informe o nome ou identificação principal do projeto.'
                };
                break;
              case 'code':
                pSettings = {
                  placeholder: 'Ex: 407-034368-26',
                  helperText: 'Ex: Informe o código interno, número do pedido ou referência aplicável.'
                };
                break;
              case 'revision':
                pSettings = {
                  placeholder: 'Ex: 03',
                  helperText: 'Ex: Informe exatamente a revisão dos documentos enviados para análise.'
                };
                break;
              case 'responsible_internal':
                pSettings = {
                  placeholder: 'Ex: Airon Denis Otaviano',
                  helperText: 'Ex: Informe o nome do responsável interno pela solicitação.'
                };
                break;
              case 'deadline':
                pSettings = {
                  placeholder: 'Ex: 30/07/2026',
                  helperText: 'Ex: Informe a data limite para a conclusão da análise.'
                };
                break;
              case 'description':
                pSettings = {
                  placeholder: 'Ex: Informe o objetivo desta solicitação de aprovação.',
                  helperText: 'Ex: Descreva resumidamente o objetivo ou escopo desta validação.'
                };
                break;
              case 'notes_for_client':
                pSettings = {
                  placeholder: 'Ex: Adicione orientações importantes para o cliente.',
                  helperText: 'Ex: Adicione observações ou instruções adicionais.'
                };
                break;
            }

            return (
              <div key={field.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-450 uppercase font-bold">Ativo</span>
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      disabled={field.key === 'title'}
                      onChange={(e) => handleFieldChange(field.id, { enabled: e.target.checked })}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {field.enabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do campo</label>
                      <Input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
                        className="h-8 text-xs bg-white"
                      />
                      <span className="block text-[9px] text-slate-400 font-normal leading-tight">
                        Texto que identifica esta informação para a empresa e para o cliente.
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Exemplo de preenchimento</label>
                      <Input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleFieldChange(field.id, { placeholder: e.target.value })}
                        placeholder={pSettings.placeholder}
                        className="h-8 text-xs bg-white"
                      />
                      <span className="block text-[9px] text-slate-400 font-normal leading-tight">
                        Exemplo exibido dentro do campo antes do preenchimento.
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Texto de orientação</label>
                      <Input
                        type="text"
                        value={field.helperText || ''}
                        onChange={(e) => handleFieldChange(field.id, { helperText: e.target.value })}
                        placeholder={pSettings.helperText}
                        className="h-8 text-xs bg-white"
                      />
                      <span className="block text-[9px] text-slate-400 font-normal leading-tight">
                        Informação complementar exibida para ajudar no preenchimento.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        id={`req-${field.id}`}
                        checked={field.required}
                        disabled={field.key === 'title'}
                        onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
                        className="cursor-pointer"
                      />
                      <label htmlFor={`req-${field.id}`} className="text-[10px] font-bold text-slate-550 uppercase cursor-pointer">Obrigatório</label>
                    </div>
                    <div className="flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        id={`vis-${field.id}`}
                        checked={field.visibleToClient}
                        onChange={(e) => handleFieldChange(field.id, { visibleToClient: e.target.checked })}
                        className="cursor-pointer"
                      />
                      <label htmlFor={`vis-${field.id}`} className="text-[10px] font-bold text-slate-550 uppercase cursor-pointer">Visível ao cliente</label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 11. MATERIAIS PARA ANÁLISE
export function AnalysisMaterialsBlockEditor({ block, onChange }: EditorProps) {
  const allowedTypes = block.allowedFileTypes || [];

  const toggleFileType = (type: string) => {
    const next = allowedTypes.includes(type)
      ? allowedTypes.filter(t => t !== type)
      : [...allowedTypes, type];
    onChange({ ...block, allowedFileTypes: next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Título da Seção
        </Label>
        <Input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ex: Materiais para Análise"
          className="h-10 border-slate-200 focus-visible:border-[#0d857a] text-[14px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Descrição da Seção
        </Label>
        <Input
          type="text"
          value={block.description || ''}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Instruções para o preenchimento..."
          className="h-9 border-slate-200 focus-visible:border-[#0d857a] text-[13px]"
        />
      </div>

      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-655">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Quantidade Mínima de Arquivos
          </Label>
          <Input
            type="number"
            value={block.minFiles ?? 0}
            onChange={(e) => onChange({ ...block, minFiles: Math.max(0, parseInt(e.target.value) || 0) })}
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Quantidade Máxima de Arquivos
          </Label>
          <Input
            type="number"
            value={block.maxFiles ?? 10}
            onChange={(e) => onChange({ ...block, maxFiles: Math.max(1, parseInt(e.target.value) || 10) })}
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tamanho Máximo por Arquivo (MB)
          </Label>
          <Input
            type="number"
            value={block.maxSizeMB ?? 50}
            onChange={(e) => onChange({ ...block, maxSizeMB: Math.max(1, parseInt(e.target.value) || 50) })}
            className="h-8"
          />
        </div>

        <div className="col-span-2 pt-2 border-t border-slate-100 space-y-2 select-none">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Valores Obrigatórios por Material
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`req-desc-${block.id}`}
                checked={block.requireDescription ?? false}
                onChange={(e) => onChange({ ...block, requireDescription: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor={`req-desc-${block.id}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">Descrição</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`req-cat-${block.id}`}
                checked={block.requireCategory ?? false}
                onChange={(e) => onChange({ ...block, requireCategory: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor={`req-cat-${block.id}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">Categoria</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`req-rev-${block.id}`}
                checked={block.requireRevision ?? false}
                onChange={(e) => onChange({ ...block, requireRevision: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor={`req-rev-${block.id}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">Revisão</label>
            </div>
          </div>
        </div>

        <div className="col-span-2 pt-2 border-t border-slate-100 space-y-2 select-none">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Tipos de Arquivos Permitidos e Links
          </Label>
          <div className="grid grid-cols-3 gap-y-2.5 gap-x-2">
            {[
              { key: 'pdf', label: 'PDF' },
              { key: 'images', label: 'Imagens' },
              { key: 'videos', label: 'Vídeos' },
              { key: 'documents', label: 'Documentos' },
              { key: 'spreadsheets', label: 'Planilhas' },
              { key: 'cad_step', label: 'STEP' },
              { key: 'cad_stl', label: 'STL' },
              { key: 'cad_dwg', label: 'DWG' },
              { key: 'cad_dxf', label: 'DXF' },
              { key: 'zip', label: 'Arquivo ZIP' },
              { key: 'others', label: 'Outros arquivos' }
            ].map(type => (
              <div key={type.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`type-${type.key}-${block.id}`}
                  checked={allowedTypes.includes(type.key)}
                  onChange={() => toggleFileType(type.key)}
                  className="cursor-pointer"
                />
                <label htmlFor={`type-${type.key}-${block.id}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">{type.label}</label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`allow-links-${block.id}`}
                checked={block.allowExternalLinks ?? true}
                onChange={(e) => onChange({ ...block, allowExternalLinks: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor={`allow-links-${block.id}`} className="text-[11px] font-medium text-[#0d857a] font-bold cursor-pointer">Links Externos</label>
            </div>
          </div>
        </div>

        <div className="col-span-2 pt-2 border-t border-slate-100 space-y-2 select-none">
          <Label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block mb-2">
            Permissões do Cliente
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`vis-cli-${block.id}`}
                checked={block.visibleToClient ?? true}
                onChange={(e) => onChange({ ...block, visibleToClient: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor={`vis-cli-${block.id}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">Visível ao cliente</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`allow-dl-${block.id}`}
                checked={block.allowDownload ?? true}
                onChange={(e) => onChange({ ...block, allowDownload: e.target.checked })}
                className="cursor-pointer"
              />
              <label htmlFor={`allow-dl-${block.id}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">Permitir download</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


