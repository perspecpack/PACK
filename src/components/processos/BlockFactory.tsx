import React from 'react';

export type BlockType = 
  | 'project_approval' 
  | 'inspection' 
  | 'audit' 
  | 'field_validation' 
  | 'prototype_acceptance' 
  | 'technical_delivery' 
  | 'commissioning'
  | 'checklist';

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  description?: string;
  required: boolean;
  status: 'pending' | 'completed' | 'in_progress';
  config: Record<string, any>;
}

export const BLOCK_METADATA: Record<BlockType, { title: string; description: string; icon: string }> = {
  project_approval: {
    title: 'Aprovação de Projeto',
    description: 'Etapa formal de aprovação técnica de desenhos, 3D ou especificações.',
    icon: 'ShieldCheck'
  },
  inspection: {
    title: 'Inspeção de Qualidade',
    description: 'Verificação técnica de itens com conformidade física ou dimensional.',
    icon: 'ScanFace'
  },
  audit: {
    title: 'Auditoria de Processo',
    description: 'Avaliação sistemática de conformidade regulatória ou de diretrizes.',
    icon: 'ClipboardCheck'
  },
  field_validation: {
    title: 'Validação de Campo',
    description: 'Coleta de dados locais e assinaturas de validação prática.',
    icon: 'MapPin'
  },
  prototype_acceptance: {
    title: 'Aceite de Protótipo',
    description: 'Homologação e validação de peças piloto ou protótipos físicos.',
    icon: 'Boxes'
  },
  technical_delivery: {
    title: 'Entrega Técnica',
    description: 'Checklist e encerramento para entrega oficial de dispositivos.',
    icon: 'PackageCheck'
  },
  commissioning: {
    title: 'Comissionamento',
    description: 'Testes funcionais estruturados para ativação de máquinas e sistemas.',
    icon: 'Cpu'
  },
  checklist: {
    title: 'Checklist de Verificação',
    description: 'Lista de verificação simples de conformidade geral.',
    icon: 'CheckSquare'
  }
};

export const BlockFactory = {
  createBlock(type: BlockType, title?: string): Block {
    const meta = BLOCK_METADATA[type];
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      type,
      title: title || meta.title,
      description: meta.description,
      required: true,
      status: 'pending',
      config: {}
    };
  }
};
