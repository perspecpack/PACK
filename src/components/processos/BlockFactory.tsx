import React from 'react';

export type BlockType = 
  | 'heading_text' 
  | 'short_answer' 
  | 'long_answer' 
  | 'multiple_choice' 
  | 'checkbox' 
  | 'dropdown' 
  | 'date' 
  | 'file_upload' 
  | 'approval_decision'
  | 'acknowledgement'
  | 'request_information'
  | 'analysis_materials';

export interface RequestInfoField {
  id: string;
  key: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  enabled: boolean;
  required: boolean;
  visibleToClient: boolean;
  position: number;
}

export interface DecisionOption {
  id: string;
  text: string;
  semanticType: 'positive' | 'attention' | 'negative' | 'neutral';
  requireComment: boolean;
}

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  description?: string;
  required: boolean;
  
  // Choice and dropdown configurations
  options?: ChoiceOption[];
  allowOther?: boolean;
  
  // Text limit configurations
  maxLength?: number;
  placeholder?: string;
  
  // Checkbox specific configurations
  minSelections?: number;
  maxSelections?: number;
  
  // Date specific configurations
  allowPastDates?: boolean;
  allowFutureDates?: boolean;
  minDate?: string;
  maxDate?: string;
  
  // File upload configurations
  maxFiles?: number;
  maxSizeMB?: number;
  allowedFileTypes?: string[]; // e.g. ['images', 'pdf', 'documents', 'spreadsheets', 'cad', 'others']
  
  // Approval decision configurations
  decisions?: DecisionOption[];

  // Acknowledgement / Consent configuration
  declarationText?: string;
  
  // Who fills this block
  filledBy?: 'company' | 'client' | 'both';

  // Prefilled or captured value
  value?: any;

  // request_information fields
  fields?: RequestInfoField[];

  // analysis_materials configurations
  minFiles?: number;
  allowExternalLinks?: boolean;
  allowDownload?: boolean;
  requireDescription?: boolean;
  requireCategory?: boolean;
  requireRevision?: boolean;
  visibleToClient?: boolean;
}

export const BLOCK_METADATA: Record<
  BlockType, 
  { title: string; description: string; icon: string; category: 'content' | 'field' | 'approval' | 'preparation' }
> = {
  heading_text: {
    title: 'Título e Texto',
    description: 'Adicione títulos, instruções ou informações ao processo.',
    icon: 'Type',
    category: 'content'
  },
  short_answer: {
    title: 'Resposta Curta',
    description: 'Campo para respostas breves em uma única linha.',
    icon: 'Text',
    category: 'field'
  },
  long_answer: {
    title: 'Resposta Longa',
    description: 'Campo para comentários ou textos maiores.',
    icon: 'AlignLeft',
    category: 'field'
  },
  multiple_choice: {
    title: 'Múltipla Escolha',
    description: 'Permite selecionar apenas uma opção.',
    icon: 'CircleDot',
    category: 'field'
  },
  checkbox: {
    title: 'Caixas de Seleção',
    description: 'Permite selecionar uma ou mais opções.',
    icon: 'CheckSquare2',
    category: 'field'
  },
  dropdown: {
    title: 'Lista Suspensa',
    description: 'Permite selecionar uma opção em uma lista.',
    icon: 'ChevronDownSquare',
    category: 'field'
  },
  date: {
    title: 'Data',
    description: 'Campo para selecionar ou informar uma data.',
    icon: 'CalendarDays',
    category: 'field'
  },
  file_upload: {
    title: 'Upload de Arquivo',
    description: 'Permite anexar documentos, imagens ou outros arquivos.',
    icon: 'UploadCloud',
    category: 'field'
  },
  approval_decision: {
    title: 'Decisão de Aprovação',
    description: 'Decisão de aprovação, aprovação com ressalvas ou solicitação de alteração.',
    icon: 'ShieldCheck',
    category: 'approval'
  },
  acknowledgement: {
    title: 'Confirmação de Ciência',
    description: 'Adicione uma declaração que o respondente deve confirmar antes de concluir o processo.',
    icon: 'FileCheck2',
    category: 'field'
  },
  request_information: {
    title: 'Informações Gerais da Solicitação',
    description: 'Defina quais informações a empresa deverá preencher antes de publicar a aprovação.',
    icon: 'Info',
    category: 'preparation'
  },
  analysis_materials: {
    title: 'Materiais para Análise',
    description: 'Permita que a empresa anexe documentos, imagens, vídeos e arquivos técnicos para o cliente analisar.',
    icon: 'FolderOpen',
    category: 'preparation'
  }
};

export const BlockFactory = {
  createBlock(type: BlockType, title?: string): Block {
    const meta = BLOCK_METADATA[type];
    const baseBlock: Block = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      type,
      title: title || meta.title,
      description: '',
      required: false,
      filledBy: type === 'heading_text' ? undefined : 'client'
    };

    switch (type) {
      case 'heading_text':
        baseBlock.title = title || 'Título da Seção';
        baseBlock.description = 'Insira as instruções ou informações aqui...';
        break;
      
      case 'short_answer':
      case 'long_answer':
        baseBlock.required = true;
        baseBlock.placeholder = '';
        break;

      case 'multiple_choice':
      case 'checkbox':
      case 'dropdown':
        baseBlock.required = true;
        baseBlock.options = [
          { id: '1', text: 'Opção 1' },
          { id: '2', text: 'Opção 2' }
        ];
        if (type === 'multiple_choice' || type === 'checkbox') {
          baseBlock.allowOther = false;
        }
        if (type === 'checkbox') {
          baseBlock.minSelections = undefined;
          baseBlock.maxSelections = undefined;
        }
        break;

      case 'date':
        baseBlock.required = true;
        baseBlock.allowPastDates = true;
        baseBlock.allowFutureDates = true;
        break;

      case 'file_upload':
        baseBlock.required = true;
        baseBlock.maxFiles = 1;
        baseBlock.maxSizeMB = 10;
        baseBlock.allowedFileTypes = ['pdf', 'images', 'documents'];
        break;

      case 'approval_decision':
        baseBlock.required = true;
        baseBlock.decisions = [
          { id: '1', text: 'Aprovado', semanticType: 'positive', requireComment: false },
          { id: '2', text: 'Aprovado com ressalvas', semanticType: 'attention', requireComment: true },
          { id: '3', text: 'Solicitar alterações', semanticType: 'negative', requireComment: true }
        ];
        break;

      case 'acknowledgement':
        baseBlock.required = true;
        baseBlock.title = 'Declaração de ciência';
        baseBlock.declarationText = 'Confirmo que analisei as informações apresentadas e estou de acordo com a declaração acima.';
        break;
      
      case 'request_information':
        baseBlock.title = 'Informações Gerais da Solicitação';
        baseBlock.required = true;
        baseBlock.filledBy = 'company';
        baseBlock.fields = [
          { id: 'f1', key: 'title', label: 'Título da solicitação', placeholder: 'Ex: Aprovação de Protótipo Básico', enabled: true, required: true, visibleToClient: true, position: 1 },
          { id: 'f2', key: 'client', label: 'Cliente', placeholder: 'Ex: Volkswagen do Brasil', enabled: true, required: true, visibleToClient: true, position: 2 },
          { id: 'f3', key: 'project', label: 'Projeto', placeholder: 'Ex: Dispositivo de Solda Lateral', enabled: true, required: true, visibleToClient: true, position: 3 },
          { id: 'f4', key: 'code', label: 'Código do projeto', placeholder: 'Ex: PRJ-2026-09', enabled: false, required: false, visibleToClient: true, position: 4 },
          { id: 'f5', key: 'revision', label: 'Revisão', placeholder: 'Ex: 01', enabled: false, required: false, visibleToClient: true, position: 5 },
          { id: 'f6', key: 'responsible_internal', label: 'Responsável interno', placeholder: 'Ex: João da Silva', enabled: false, required: false, visibleToClient: true, position: 6 },
          { id: 'f7', key: 'deadline', label: 'Prazo para resposta', placeholder: '', enabled: false, required: false, visibleToClient: true, position: 7 },
          { id: 'f8', key: 'description', label: 'Descrição do processo', placeholder: 'Descreva as instruções para esta validação...', enabled: false, required: false, visibleToClient: true, position: 8 },
          { id: 'f9', key: 'notes_for_client', label: 'Observações ao cliente', placeholder: 'Notas visíveis apenas para o cliente...', enabled: false, required: false, visibleToClient: true, position: 9 }
        ];
        break;

      case 'analysis_materials':
        baseBlock.title = 'Materiais para Análise';
        baseBlock.required = false;
        baseBlock.filledBy = 'company';
        baseBlock.minFiles = 0;
        baseBlock.maxFiles = 10;
        baseBlock.maxSizeMB = 50;
        baseBlock.allowExternalLinks = true;
        baseBlock.allowDownload = true;
        baseBlock.requireDescription = false;
        baseBlock.requireCategory = false;
        baseBlock.requireRevision = false;
        baseBlock.allowedFileTypes = ['pdf', 'images', 'videos', 'documents', 'spreadsheets', 'cad_step', 'cad_stl', 'cad_dwg', 'cad_dxf', 'zip', 'others'];
        break;
    }

    return baseBlock;
  }
};

export interface ValidationError {
  blockId: string;
  field: string;
  message: string;
}

export function validateBlock(block: Block): ValidationError[] {
  const errors: ValidationError[] = [];

  // Heading Text specific validations
  if (block.type === 'heading_text') {
    if (!block.title.trim() && !block.description?.trim()) {
      errors.push({
        blockId: block.id,
        field: 'title_or_description',
        message: 'O bloco de Título e Texto deve conter pelo menos um título ou uma descrição preenchidos.'
      });
    }
    return errors;
  }

  // Acknowledgement validation
  if (block.type === 'acknowledgement') {
    if (!block.declarationText || !block.declarationText.trim()) {
      errors.push({
        blockId: block.id,
        field: 'declarationText',
        message: 'O texto da declaração é obrigatório.'
      });
    }
    if (!block.title.trim()) {
      errors.push({
        blockId: block.id,
        field: 'title',
        message: 'O título do bloco é obrigatório.'
      });
    }
    return errors;
  }

  // Special blocks validation
  if (block.type === 'request_information') {
    if (!block.title.trim()) {
      errors.push({ blockId: block.id, field: 'title', message: 'O título do bloco é obrigatório.' });
    }
    const enabledFields = block.fields?.filter(f => f.enabled) || [];
    if (enabledFields.length === 0) {
      errors.push({ blockId: block.id, field: 'fields', message: 'Pelo menos um campo de informação geral deve estar ativado.' });
    }
    const titleField = block.fields?.find(f => f.key === 'title');
    if (!titleField || !titleField.enabled) {
      errors.push({ blockId: block.id, field: 'fields', message: 'O campo "Título da solicitação" é obrigatório e deve estar ativado.' });
    }
    return errors;
  }

  if (block.type === 'analysis_materials') {
    if (!block.title.trim()) {
      errors.push({ blockId: block.id, field: 'title', message: 'O título do bloco é obrigatório.' });
    }
    return errors;
  }

  // Common check: title required for all fields/questions
  if (!block.title.trim()) {
    errors.push({
      blockId: block.id,
      field: 'title',
      message: 'O título do bloco é obrigatório.'
    });
  }

  // Choice blocks validations (multiple_choice, checkbox, dropdown)
  if (['multiple_choice', 'checkbox', 'dropdown'].includes(block.type)) {
    const options = block.options || [];
    
    if (options.length < 2) {
      errors.push({
        blockId: block.id,
        field: 'options',
        message: 'O bloco deve conter no mínimo 2 opções.'
      });
    }

    // Check for duplicates
    const cleanedTexts = options.map(opt => opt.text.trim());
    const duplicates = cleanedTexts.filter((item, index) => cleanedTexts.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push({
        blockId: block.id,
        field: 'options',
        message: `Existem opções duplicadas: "${duplicates[0]}".`
      });
    }
  }

  // Checkbox limits validation
  if (block.type === 'checkbox') {
    const min = block.minSelections;
    const max = block.maxSelections;
    
    if (min !== undefined && min < 0) {
      errors.push({
        blockId: block.id,
        field: 'minSelections',
        message: 'A quantidade mínima de seleções não pode ser negativa.'
      });
    }

    if (max !== undefined && max < 0) {
      errors.push({
        blockId: block.id,
        field: 'maxSelections',
        message: 'A quantidade máxima de seleções não pode ser negativa.'
      });
    }

    if (min !== undefined && max !== undefined && max < min) {
      errors.push({
        blockId: block.id,
        field: 'maxSelections',
        message: 'A quantidade máxima de seleções não pode ser menor que a mínima.'
      });
    }
  }

  // Date validations
  if (block.type === 'date') {
    const minD = block.minDate;
    const maxD = block.maxDate;

    if (minD && maxD && new Date(maxD) < new Date(minD)) {
      errors.push({
        blockId: block.id,
        field: 'maxDate',
        message: 'A data máxima não pode ser anterior à data mínima.'
      });
    }
  }

  // File upload validations
  if (block.type === 'file_upload') {
    const maxFiles = block.maxFiles || 0;
    const maxSize = block.maxSizeMB || 0;
    const types = block.allowedFileTypes || [];

    if (maxFiles <= 0) {
      errors.push({
        blockId: block.id,
        field: 'maxFiles',
        message: 'A quantidade máxima de arquivos deve ser maior que zero.'
      });
    }

    if (maxSize <= 0) {
      errors.push({
        blockId: block.id,
        field: 'maxSizeMB',
        message: 'O tamanho máximo por arquivo deve ser maior que zero.'
      });
    }

    if (types.length === 0) {
      errors.push({
        blockId: block.id,
        field: 'allowedFileTypes',
        message: 'Selecione pelo menos um tipo de arquivo permitido.'
      });
    }
  }

  // Approval decision validations
  if (block.type === 'approval_decision') {
    const decisions = block.decisions || [];
    
    if (decisions.length < 2) {
      errors.push({
        blockId: block.id,
        field: 'decisions',
        message: 'O bloco de decisão deve conter no mínimo 2 opções de decisão.'
      });
    }

    const cleanedTexts = decisions.map(d => d.text.trim());
    const duplicates = cleanedTexts.filter((item, index) => cleanedTexts.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push({
        blockId: block.id,
        field: 'decisions',
        message: `Existem decisões duplicadas: "${duplicates[0]}".`
      });
    }
  }

  return errors;
}

export interface ProcessValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export function validateProcess(blocks: Block[]): ProcessValidationResult {
  let allErrors: ValidationError[] = [];
  
  blocks.forEach(block => {
    const blockErrors = validateBlock(block);
    allErrors = [...allErrors, ...blockErrors];
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: []
  };
}

export function migrateLegacyBlocks(blocks: Block[]): Block[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(block => {
    let migrated = { ...block };
    
    // Check if it's a legacy checkbox declaration (exactly 1 option starting with "Confirmo")
    if (
      block.type === 'checkbox' &&
      block.options &&
      block.options.length === 1 &&
      block.options[0].text.trim().startsWith('Confirmo')
    ) {
      migrated = {
        ...block,
        type: 'acknowledgement',
        declarationText: block.options[0].text,
        options: undefined,
        minSelections: undefined,
        maxSelections: undefined,
        allowOther: undefined
      } as Block;
    }

    if (migrated.type !== 'heading_text' && !migrated.filledBy) {
      migrated.filledBy = 'client';
    }
    
    return migrated;
  });
}
