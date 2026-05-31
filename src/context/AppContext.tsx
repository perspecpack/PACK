import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Organization,
  OrganizationModule,
  ComponentEntry,
  DocumentEntry,
  StandardEntry,
  ChecklistTemplate,
  ChecklistSection,
  ChecklistCriterion,
  ReferenceProjectEntry,
  User,
  OrganizationType,
  ModuleType,
  DocumentType,
  StandardType,
  DownloadLog,
  UploadLog,
  PageAccessLog
} from '../types';

export type {
  Organization,
  OrganizationModule,
  ComponentEntry,
  DocumentEntry,
  StandardEntry,
  ChecklistTemplate,
  ChecklistSection,
  ChecklistCriterion,
  ReferenceProjectEntry,
  User,
  OrganizationType,
  ModuleType,
  DocumentType,
  StandardType,
  DownloadLog,
  UploadLog,
  PageAccessLog
};

export type OEM = Organization;
export type ProjectEntry = ReferenceProjectEntry;
export type TechCategory = string;
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  status: 'active';
  description?: string;
}
export type FileType = 'STEP' | 'PDF' | 'DWG' | 'XLSX' | 'DOCX' | 'PNG' | 'JPG';

// Backward compatibility or raw files
export interface FileEntry {
  id: string;
  name: string;
  oemId: string;
  categoryId: string;
  fileType: 'STEP' | 'PDF' | 'DWG' | 'XLSX' | 'DOCX' | 'PNG' | 'JPG';
  revision: string;
  description?: string;
  status: 'published' | 'draft';
  fileUrl: string;
  createdAt: string;
}

interface AppContextType {
  // New State
  organizations: Organization[];
  organizationModules: OrganizationModule[];
  components: ComponentEntry[];
  documents: DocumentEntry[];
  standards: StandardEntry[];
  checklists: ChecklistTemplate[];
  referenceProjects: ReferenceProjectEntry[];
  
  downloadsLog: DownloadLog[];
  uploadsLog: UploadLog[];
  pageAccessLog: PageAccessLog[];
  
  // Backward compatibility fields
  oems: Organization[];
  categories: { id: string; name: string; slug: string; icon: string; status: 'active' }[];
  files: FileEntry[];
  projects: any[];

  // User state
  user: User | null;
  viewingAsUser: boolean;
  syncError: string | null;
  
  // Auth actions
  login: (email: string, role: 'master' | 'user') => void;
  logout: () => void;
  setViewingAsUser: (val: boolean) => void;

  // Logging actions
  logDownload: (orgId: string, contentType: string, contentId: string, fileName: string) => Promise<void>;
  logUpload: (orgId: string, contentType: string, fileName: string) => Promise<void>;
  logPageAccess: (page: string) => Promise<void>;

  // Organization actions
  addOrganization: (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>, modules: Record<ModuleType, boolean>) => void;
  updateOrganization: (id: string, org: Partial<Organization>, modules?: Record<ModuleType, boolean>) => void;
  deleteOrganization: (id: string) => void;
  
  // Compatibility OEM aliases
  addOEM: (org: any) => void;
  updateOEM: (id: string, org: any) => void;
  deleteOEM: (id: string) => void;

  // Component actions
  addComponent: (comp: Omit<ComponentEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComponent: (id: string, comp: Partial<ComponentEntry>) => void;
  deleteComponent: (id: string) => void;

  // Document actions
  addDocument: (doc: Omit<DocumentEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, doc: Partial<DocumentEntry>) => void;
  deleteDocument: (id: string) => void;

  // Standard actions
  addStandard: (std: Omit<StandardEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStandard: (id: string, std: Partial<StandardEntry>) => void;
  deleteStandard: (id: string) => void;

  // Checklist actions
  addChecklist: (checklist: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'updatedAt' | 'sections' | 'items'>, sections: ChecklistSection[]) => void;
  updateChecklist: (id: string, checklist: Partial<Omit<ChecklistTemplate, 'sections' | 'items'>>, sections?: ChecklistSection[]) => void;
  deleteChecklist: (id: string) => void;

  // Reference Project actions
  addReferenceProject: (proj: Omit<ReferenceProjectEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReferenceProject: (id: string, proj: Partial<ReferenceProjectEntry>) => void;
  deleteReferenceProject: (id: string) => void;

  // Raw file actions (for Uploads list)
  addFile: (file: Omit<FileEntry, 'id' | 'createdAt'>) => void;
  updateFile: (id: string, file: Partial<FileEntry>) => void;
  deleteFile: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Seed Data definition
const INITIAL_ORGANIZATIONS: Organization[] = [
  { id: '897455d3-82ff-4b13-94c6-4c4897f2617f', name: 'Volkswagen', slug: 'volkswagen', organizationType: 'oem', description: 'Diretrizes e normas de embalagens para a rede de fornecedores Volkswagen.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2ea10e42-7cf6-42d7-9cb2-9d3326ebde9e', name: 'Hyundai', slug: 'hyundai', organizationType: 'oem', description: 'Especificações técnicas da montadora Hyundai.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b60c2eb7-7f30-410a-ba92-f2ad30018f2d', name: 'Nissan', slug: 'nissan', organizationType: 'oem', description: 'Requisitos de embalagens Nissan.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'fa80459a-14d2-43bb-a15d-852a4ef99dfb', name: 'Renault', slug: 'renault', organizationType: 'oem', description: 'Especificações de rack e logísticas Renault.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '0f898394-bb9e-4a6c-9477-70be0e2e28a5', name: 'Scania', slug: 'scania', organizationType: 'oem', description: 'Caderno de encargos e embalagens pesadas Scania.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '9689e472-8889-4e78-95ef-fce678b8a5cf', name: 'Gestamp', slug: 'gestamp', organizationType: 'component_manufacturer', description: 'Padrões logísticos da multinacional Gestamp.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MODULE_TYPES: ModuleType[] = ['components', 'documentation', 'standards', 'checklists', 'reference_projects', 'cad_library', 'procedures'];

const INITIAL_MODULES: OrganizationModule[] = [];
INITIAL_ORGANIZATIONS.forEach(org => {
  MODULE_TYPES.forEach(mod => {
    // Default enabled modules based on specification:
    // components, documentation (standards in spec as 'standards'), checklists are active by default
    const isDefaultEnabled = ['components', 'documentation', 'standards', 'checklists'].includes(mod);
    INITIAL_MODULES.push({
      id: crypto.randomUUID(),
      organizationId: org.id,
      moduleType: mod,
      enabled: isDefaultEnabled,
      createdAt: new Date().toISOString()
    });
  });
});

const INITIAL_COMPONENTS: ComponentEntry[] = [
  {
    id: '15eb24a7-8f5b-4d43-8ce8-72410a719c8f',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    name: 'Rodízio Fixo Poliuretano 150mm',
    description: 'Rodízio de alta performance para fluxo rebocado (AGV).',
    application: 'Racks metálicos de autopeças pesadas.',
    revision: 'A',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80',
    stepFileUrl: 'https://example.com/cad/rodizio_150mm.step',
    pdfFileUrl: 'https://example.com/docs/rodizio_150mm.pdf',
    dwgFileUrl: 'https://example.com/cad/rodizio_150mm.dwg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '177a458f-2877-4b10-85f0-bd4460f1ad92',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    name: 'Porta Etiqueta Metálico A4',
    description: 'Porta etiqueta com proteção acrílica contra poeira e intempéries.',
    application: 'Identificação frontal de racks e caixas paletes.',
    revision: '02',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=500',
    stepFileUrl: 'https://example.com/cad/porta_etiqueta_a4.step',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3bc9c65a-0ebf-4f24-954a-a719ea5d506d',
    organizationId: '2ea10e42-7cf6-42d7-9cb2-9d3326ebde9e',
    name: 'Trava Canhão Standard H1',
    description: 'Dispositivo mecânico para travamento de portas pivotantes de rack.',
    application: 'Racks de para-lamas e laterais.',
    revision: '01',
    status: 'active',
    stepFileUrl: 'https://example.com/cad/trava_canhao_h1.step',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_DOCUMENTS: DocumentEntry[] = [
  {
    id: '231d667c-9b8c-47bc-8be0-b99f8e40df83',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    title: 'Caderno de Encargos Geral 2026',
    description: 'Caderno de encargos gerais de embalagens VW 2026.',
    documentType: 'Caderno de Encargos',
    revision: '04',
    status: 'active',
    fileUrl: 'https://example.com/files/caderno_encargos_2026.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '362b537d-2b7e-417d-8067-27bfe5b6efc4',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    title: 'Manual de Identificação Visual de Logística',
    description: 'Diretrizes para colagem de etiquetas e tags de rastreabilidade.',
    documentType: 'Manual',
    revision: '01',
    status: 'active',
    fileUrl: 'https://example.com/files/manual_etiqueta.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6e2e0ee3-6b7c-47f9-8db2-2fbfe5e6bfb5',
    organizationId: '2ea10e42-7cf6-42d7-9cb2-9d3326ebde9e',
    title: 'Especificações Técnicas de Racks HMC-2025',
    description: 'Instruções para fornecedores tier-1 desenvolvendo racks novos.',
    documentType: 'Norma',
    revision: '02',
    status: 'active',
    fileUrl: 'https://example.com/files/hmc_2025_spec.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_STANDARDS: StandardEntry[] = [
  {
    id: 'b38d6de4-47b2-4d2c-8067-160de4e5bf56',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    title: 'VDI 2300 - Embalagens Metálicas',
    description: 'Norma alemã regulatória para estruturação de embalagens metálicas.',
    standardType: 'Norma de Embalagem',
    revision: '2024',
    status: 'active',
    referenceDocument: 'VDI 2300',
    fileUrl: 'https://example.com/files/vdi_2300.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'c48b2de4-47b2-4d2c-8067-160de4e5bf56',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    title: 'Padrão Ergonômico de Levantamento de Carga',
    description: 'Limites de força para manuseio manual de peças no rack.',
    standardType: 'Norma de Ergonomia',
    revision: 'Rev. B',
    status: 'active',
    referenceDocument: 'ISO 11228-1',
    fileUrl: 'https://example.com/files/ergonomia_vw.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'd58b2de4-47b2-4d2c-8067-160de4e5bf56',
    organizationId: '2ea10e42-7cf6-42d7-9cb2-9d3326ebde9e',
    title: 'Padrão de Empilhamento HMC-STD-8',
    description: 'Requisitos de segurança e encaixe de cantoneiras para empilhamento.',
    standardType: 'Norma de Empilhamento',
    revision: '01',
    status: 'active',
    referenceDocument: 'HMC-STD-8',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_CHECKLISTS: ChecklistTemplate[] = [
  {
    id: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    name: 'Checklist Padrão Embalagens VW',
    revision: '01',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-vw-1',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Identificação do Projeto',
        sortOrder: 1,
        criteria: []
      },
      {
        id: 'sec-vw-2',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Estrutura da Embalagem',
        sortOrder: 2,
        criteria: [
          { id: 'crit-vw-2-1', checklistSectionId: 'sec-vw-2', code: '2.1', description: 'A estrutura tubular atende à especificação VDI 2300?', reference: 'VDI 2300 Sec. 4', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      {
        id: 'sec-vw-3',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Componentes Homologados',
        sortOrder: 3,
        criteria: []
      },
      {
        id: 'sec-vw-4',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Empilhamento',
        sortOrder: 4,
        criteria: [
          { id: 'crit-vw-4-1', checklistSectionId: 'sec-vw-4', code: '4.1', description: 'Possui cantoneiras de empilhamento homologadas?', reference: 'Norma VW 39D 120', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      {
        id: 'sec-vw-5',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Movimentação e Logística',
        sortOrder: 5,
        criteria: [
          { id: 'crit-vw-5-1', checklistSectionId: 'sec-vw-5', code: '5.1', description: 'A altura do rodízio está compatível com o sistema AGV (Mínimo 150mm)?', reference: 'Manual Requisitos AGV', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      {
        id: 'sec-vw-6',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Ergonomia',
        sortOrder: 6,
        criteria: [
          { id: 'crit-vw-6-1', checklistSectionId: 'sec-vw-6', code: '6.1', description: 'A força de extração da peça é inferior a 15kg?', reference: 'ISO 11228-1', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      {
        id: 'sec-vw-7',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Identificação e Etiquetagem',
        sortOrder: 7,
        criteria: [
          { id: 'crit-vw-7-1', checklistSectionId: 'sec-vw-7', code: '7.1', description: 'O porta-etiquetas está afixado em local visível no painel frontal?', reference: 'VW GLW 2026', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      {
        id: 'sec-vw-8',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Segurança',
        sortOrder: 8,
        criteria: []
      },
      {
        id: 'sec-vw-9',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Documentação Técnica',
        sortOrder: 9,
        criteria: []
      },
      {
        id: 'sec-vw-10',
        checklistTemplateId: 'f78e0ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Aprovação Final',
        sortOrder: 10,
        criteria: []
      }
    ],
    items: []
  },
  {
    id: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b',
    organizationId: '2ea10e42-7cf6-42d7-9cb2-9d3326ebde9e',
    name: 'Validação Geral de Embalagem Hyundai',
    revision: '02',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      { id: 'sec-hy-1', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Identificação do Projeto', sortOrder: 1, criteria: [] },
      {
        id: 'sec-hy-2',
        checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Estrutura da Embalagem',
        sortOrder: 2,
        criteria: [
          { id: 'crit-hy-2-1', checklistSectionId: 'sec-hy-2', code: '2.1', description: 'Solda de acordo com o padrão Hyundai Weld-Spec?', reference: 'HMC-W-201', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      { id: 'sec-hy-3', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Componentes Homologados', sortOrder: 3, criteria: [] },
      { id: 'sec-hy-4', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Empilhamento', sortOrder: 4, criteria: [] },
      { id: 'sec-hy-5', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Movimentação e Logística', sortOrder: 5, criteria: [] },
      { id: 'sec-hy-6', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Ergonomia', sortOrder: 6, criteria: [] },
      { id: 'sec-hy-7', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Identificação e Etiquetagem', sortOrder: 7, criteria: [] },
      {
        id: 'sec-hy-8',
        checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b',
        title: 'Segurança',
        sortOrder: 8,
        criteria: [
          { id: 'crit-hy-8-1', checklistSectionId: 'sec-hy-8', code: '8.1', description: 'Dispositivos de trava funcionais e sem cantos vivos?', reference: 'Safety Manual HMC', responseType: 'conformance', required: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      },
      { id: 'sec-hy-9', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Documentação Técnica', sortOrder: 9, criteria: [] },
      { id: 'sec-hy-10', checklistTemplateId: '1d3e2ea5-d142-4fdf-9730-1c0b3fe0b56b', title: 'Aprovação Final', sortOrder: 10, criteria: [] }
    ],
    items: []
  }
];

const INITIAL_REFERENCE_PROJECTS: ReferenceProjectEntry[] = [
  {
    id: '10ee2d1a-8f5b-4c43-8ce8-72410a719c8f',
    organizationId: '897455d3-82ff-4b13-94c6-4c4897f2617f',
    name: 'Rack Metálico Taos Parachoque',
    description: 'Estrutura customizada para transporte de parachoques pintados do VW Taos.',
    application: 'Transporte entre planta de pintura e linha de montagem final.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '20ee2d1a-8f5b-4c43-8ce8-72410a719c8f',
    organizationId: '2ea10e42-7cf6-42d7-9cb2-9d3326ebde9e',
    name: 'Skid Metálico Motor Gamma 1.6',
    description: 'Skid de precisão para alimentação de linha automatizada de motores.',
    application: 'Alimentação de células robóticas de montagem.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=500',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Compatibility raw files
const INITIAL_FILES: FileEntry[] = [
  { id: '30ee2d1a-8f5b-4c43-8ce8-72410a719c8f', name: 'Suporte_Porta_Etiqueta_REV03.step', oemId: '897455d3-82ff-4b13-94c6-4c4897f2617f', categoryId: 'cat-comp', fileType: 'STEP', revision: '03', description: 'Modelo 3D do porta-etiquetas padrão VW.', status: 'published', fileUrl: 'https://example.com/files/suporte_porta_etiqueta_rev03.step', createdAt: new Date().toISOString() },
  { id: '40ee2d1a-8f5b-4c43-8ce8-72410a719c8f', name: 'VDI_2300_Embalagens_Metalicas.pdf', oemId: '897455d3-82ff-4b13-94c6-4c4897f2617f', categoryId: 'cat-normas', fileType: 'PDF', revision: '2024', description: 'Norma alemã para estruturação de embalagens metálicas.', status: 'published', fileUrl: 'https://example.com/files/vdi_2300.pdf', createdAt: new Date().toISOString() },
  { id: '50ee2d1a-8f5b-4c43-8ce8-72410a719c8f', name: 'Caderno_Encargos_Geral_2026.pdf', oemId: '897455d3-82ff-4b13-94c6-4c4897f2617f', categoryId: 'cat-doc', fileType: 'PDF', revision: '04', description: 'Caderno de encargos gerais de embalagens VW 2026.', status: 'published', fileUrl: 'https://example.com/files/caderno_encargos_2026.pdf', createdAt: new Date().toISOString() },
  { id: '60ee2d1a-8f5b-4c43-8ce8-72410a719c8f', name: 'Checklist_Inspecao_Rodizio_AGV.xlsx', oemId: '897455d3-82ff-4b13-94c6-4c4897f2617f', categoryId: 'cat-checks', fileType: 'XLSX', revision: '01', description: 'Planilha auxiliar para checagem de rodízios compatíveis com AGV.', status: 'published', fileUrl: 'https://example.com/files/checklist_rodizio_agv.xlsx', createdAt: new Date().toISOString() },
  { id: '70ee2d1a-8f5b-4c43-8ce8-72410a719c8f', name: 'Rack_Referencia_Taos_Desenho.dwg', oemId: '897455d3-82ff-4b13-94c6-4c4897f2617f', categoryId: 'cat-proj', fileType: 'DWG', revision: '02', description: 'Desenho 2D de referência do rack metálico do VW Taos.', status: 'published', fileUrl: 'https://example.com/files/rack_taos_desenho.dwg', createdAt: new Date().toISOString() },
];

// --- Supabase Mapping Helpers ---
const mapOrgFromDb = (db: any): Organization => ({
  id: db.id,
  name: db.name,
  slug: db.slug,
  organizationType: db.organization_type,
  logoUrl: db.logo_url || undefined,
  description: db.description || undefined,
  status: db.status as 'active' | 'inactive',
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapOrgToDb = (ts: Partial<Organization>) => {
  const db: any = {};
  if (ts.name !== undefined) db.name = ts.name;
  if (ts.slug !== undefined) db.slug = ts.slug;
  if (ts.organizationType !== undefined) db.organization_type = ts.organizationType;
  if (ts.logoUrl !== undefined) db.logo_url = ts.logoUrl;
  if (ts.description !== undefined) db.description = ts.description;
  if (ts.status !== undefined) db.status = ts.status;
  return db;
};

const mapModFromDb = (db: any): OrganizationModule => ({
  id: db.id,
  organizationId: db.organization_id,
  moduleType: db.module_type as any,
  enabled: db.enabled,
  createdAt: db.created_at
});

const mapCompFromDb = (db: any): ComponentEntry => ({
  id: db.id,
  organizationId: db.organization_id,
  name: db.name,
  description: db.description || undefined,
  application: db.application || undefined,
  revision: db.revision,
  status: db.status as 'active' | 'inactive',
  stepFileUrl: db.step_file_url || undefined,
  pdfFileUrl: db.pdf_file_url || undefined,
  dwgFileUrl: db.dwg_file_url || undefined,
  imageUrl: db.image_url || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapCompToDb = (ts: Partial<ComponentEntry>) => {
  const db: any = {};
  if (ts.organizationId !== undefined) db.organization_id = ts.organizationId;
  if (ts.name !== undefined) db.name = ts.name;
  if (ts.description !== undefined) db.description = ts.description;
  if (ts.application !== undefined) db.application = ts.application;
  if (ts.revision !== undefined) db.revision = ts.revision;
  if (ts.status !== undefined) db.status = ts.status;
  if (ts.stepFileUrl !== undefined) db.step_file_url = ts.stepFileUrl;
  if (ts.pdfFileUrl !== undefined) db.pdf_file_url = ts.pdfFileUrl;
  if (ts.dwgFileUrl !== undefined) db.dwg_file_url = ts.dwgFileUrl;
  if (ts.imageUrl !== undefined) db.image_url = ts.imageUrl;
  return db;
};

const mapDocFromDb = (db: any): DocumentEntry => ({
  id: db.id,
  organizationId: db.organization_id,
  title: db.title,
  description: db.description || undefined,
  documentType: db.document_type as any,
  revision: db.revision,
  status: db.status as 'active' | 'inactive',
  fileUrl: db.file_url || undefined,
  fileName: db.file_name || undefined,
  fileType: db.file_type || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDocToDb = (ts: Partial<DocumentEntry>) => {
  const db: any = {};
  if (ts.organizationId !== undefined) db.organization_id = ts.organizationId;
  if (ts.title !== undefined) db.title = ts.title;
  if (ts.description !== undefined) db.description = ts.description;
  if (ts.documentType !== undefined) db.document_type = ts.documentType;
  if (ts.revision !== undefined) db.revision = ts.revision;
  if (ts.status !== undefined) db.status = ts.status;
  if (ts.fileUrl !== undefined) db.file_url = ts.fileUrl;
  if (ts.fileName !== undefined) db.file_name = ts.fileName;
  if (ts.fileType !== undefined) db.file_type = ts.fileType;
  return db;
};

const mapStdFromDb = (db: any): StandardEntry => ({
  id: db.id,
  organizationId: db.organization_id,
  title: db.title,
  description: db.description || undefined,
  standardType: db.standard_type as any || 'Norma de Embalagem',
  revision: db.revision,
  status: db.status as 'active' | 'inactive',
  referenceDocument: db.reference_document || undefined,
  fileUrl: db.file_url || undefined,
  fileName: db.file_name || undefined,
  fileType: db.file_type || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapStdToDb = (ts: Partial<StandardEntry>) => {
  const db: any = {};
  if (ts.organizationId !== undefined) db.organization_id = ts.organizationId;
  if (ts.title !== undefined) db.title = ts.title;
  if (ts.description !== undefined) db.description = ts.description;
  if (ts.standardType !== undefined) db.standard_type = ts.standardType;
  if (ts.revision !== undefined) db.revision = ts.revision;
  if (ts.status !== undefined) db.status = ts.status;
  if (ts.referenceDocument !== undefined) db.reference_document = ts.referenceDocument;
  if (ts.fileUrl !== undefined) db.file_url = ts.fileUrl;
  if (ts.fileName !== undefined) db.file_name = ts.fileName;
  if (ts.fileType !== undefined) db.file_type = ts.fileType;
  return db;
};

const mapChecklistTemplateFromDb = (db: any): ChecklistTemplate => ({
  id: db.id,
  organizationId: db.organization_id,
  name: db.name,
  revision: db.revision,
  status: db.status as 'active' | 'inactive',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  sections: (db.sections || []).map((sec: any) => ({
    id: sec.id,
    checklistTemplateId: sec.checklist_template_id,
    title: sec.title,
    description: sec.description || undefined,
    sortOrder: sec.sort_order,
    criteria: (sec.criteria || []).map((crit: any) => ({
      id: crit.id,
      checklistSectionId: crit.checklist_section_id,
      code: crit.code,
      description: crit.description,
      reference: crit.reference || undefined,
      responseType: crit.response_type as any,
      required: crit.required,
      sortOrder: crit.sort_order,
      createdAt: crit.created_at,
      updatedAt: crit.updated_at
    })).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
  })).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
  items: []
});

const mapChecklistTemplateToDb = (ts: Partial<ChecklistTemplate>) => {
  const db: any = {};
  if (ts.organizationId !== undefined) db.organization_id = ts.organizationId;
  if (ts.name !== undefined) db.name = ts.name;
  if (ts.revision !== undefined) db.revision = ts.revision;
  if (ts.status !== undefined) db.status = ts.status;
  return db;
};

const mapProjFromDb = (db: any): ReferenceProjectEntry => ({
  id: db.id,
  organizationId: db.organization_id,
  name: db.name,
  description: db.description || undefined,
  application: db.application || undefined,
  imageUrl: db.image_url || undefined,
  attachmentUrl: db.attachment_url || undefined,
  attachmentName: db.attachment_name || undefined,
  attachmentType: db.attachment_type || undefined,
  status: db.status as 'active' | 'inactive',
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapProjToDb = (ts: Partial<ReferenceProjectEntry>) => {
  const db: any = {};
  if (ts.organizationId !== undefined) db.organization_id = ts.organizationId;
  if (ts.name !== undefined) db.name = ts.name;
  if (ts.description !== undefined) db.description = ts.description;
  if (ts.application !== undefined) db.application = ts.application;
  if (ts.imageUrl !== undefined) db.image_url = ts.imageUrl;
  if (ts.attachmentUrl !== undefined) db.attachment_url = ts.attachmentUrl;
  if (ts.attachmentName !== undefined) db.attachment_name = ts.attachmentName;
  if (ts.attachmentType !== undefined) db.attachment_type = ts.attachmentType;
  if (ts.status !== undefined) db.status = ts.status;
  return db;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State from LocalStorage or Seed as fallback
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('pp_organizations_v2');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [organizationModules, setOrganizationModules] = useState<OrganizationModule[]>(() => {
    const saved = localStorage.getItem('pp_organization_modules_v2');
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
  });

  const [components, setComponents] = useState<ComponentEntry[]>(() => {
    const saved = localStorage.getItem('pp_components_v2');
    return saved ? JSON.parse(saved) : INITIAL_COMPONENTS;
  });

  const [documents, setDocuments] = useState<DocumentEntry[]>(() => {
    const saved = localStorage.getItem('pp_documents_v2');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [standards, setStandards] = useState<StandardEntry[]>(() => {
    const saved = localStorage.getItem('pp_standards_v2');
    return saved ? JSON.parse(saved) : INITIAL_STANDARDS;
  });

  const [checklists, setChecklists] = useState<ChecklistTemplate[]>(() => {
    const saved = localStorage.getItem('pp_checklists_v3');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLISTS;
  });

  const [referenceProjects, setReferenceProjects] = useState<ReferenceProjectEntry[]>(() => {
    const saved = localStorage.getItem('pp_reference_projects_v2');
    return saved ? JSON.parse(saved) : INITIAL_REFERENCE_PROJECTS;
  });

  const [files, setFiles] = useState<FileEntry[]>(() => {
    const saved = localStorage.getItem('pp_files_v2');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [downloadsLog, setDownloadsLog] = useState<DownloadLog[]>(() => {
    const saved = localStorage.getItem('pp_downloads_log_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [uploadsLog, setUploadsLog] = useState<UploadLog[]>(() => {
    const saved = localStorage.getItem('pp_uploads_log_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [pageAccessLog, setPageAccessLog] = useState<PageAccessLog[]>(() => {
    const saved = localStorage.getItem('pp_page_access_log_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // User auth state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pp_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Mode to simulate public view
  const [viewingAsUser, setViewingAsUser] = useState<boolean>(() => {
    return localStorage.getItem('pp_viewing_as_user') === 'true';
  });

  const [syncError, setSyncError] = useState<string | null>(null);

  const seedDatabaseToSupabase = async () => {
    if (!supabase) return;
    try {
      console.log('[Supabase Seed] Seeding default organizations...');
      
      // Seed Organizations
      const dbOrgs = INITIAL_ORGANIZATIONS.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        organization_type: org.organizationType,
        logo_url: org.logoUrl || null,
        description: org.description || null,
        status: org.status
      }));
      const { error: orgsErr } = await supabase.from('organizations').insert(dbOrgs);
      if (orgsErr) throw orgsErr;

      // Seed Modules
      const dbModules = INITIAL_MODULES.map(m => ({
        id: m.id,
        organization_id: m.organizationId,
        module_type: m.moduleType,
        enabled: m.enabled
      }));
      const { error: modsErr } = await supabase.from('organization_modules').insert(dbModules);
      if (modsErr) throw modsErr;

      // Seed Components
      const dbComps = INITIAL_COMPONENTS.map(c => ({
        id: c.id,
        organization_id: c.organizationId,
        name: c.name,
        description: c.description || null,
        application: c.application || null,
        revision: c.revision,
        status: c.status,
        image_url: c.imageUrl || null,
        step_file_url: c.stepFileUrl || null,
        pdf_file_url: c.pdfFileUrl || null,
        dwg_file_url: c.dwgFileUrl || null
      }));
      const { error: compsErr } = await supabase.from('components').insert(dbComps);
      if (compsErr) throw compsErr;

      // Seed Documents
      const dbDocs = INITIAL_DOCUMENTS.map(d => ({
        id: d.id,
        organization_id: d.organizationId,
        title: d.title,
        description: d.description || null,
        document_type: d.documentType,
        revision: d.revision,
        status: d.status,
        file_url: d.fileUrl || null
      }));
      const { error: docsErr } = await supabase.from('documents').insert(dbDocs);
      if (docsErr) throw docsErr;

      // Seed Standards
      const dbStds = INITIAL_STANDARDS.map(s => ({
        id: s.id,
        organization_id: s.organizationId,
        title: s.title,
        description: s.description || null,
        standard_type: s.standardType || 'Norma de Embalagem',
        revision: s.revision,
        status: s.status,
        reference_document: s.referenceDocument || null,
        file_url: s.fileUrl || null
      }));
      const { error: stdsErr } = await supabase.from('standards').insert(dbStds);
      if (stdsErr) throw stdsErr;

      // Seed Checklist Templates
      const dbTemplates = INITIAL_CHECKLISTS.map(chk => ({
        id: chk.id,
        organization_id: chk.organizationId,
        name: chk.name,
        revision: chk.revision,
        status: chk.status
      }));
      const { error: templatesErr } = await supabase.from('checklist_templates').insert(dbTemplates);
      if (templatesErr) throw templatesErr;

      // Seed Checklist Sections
      const dbSections = INITIAL_CHECKLISTS.flatMap(chk => 
        chk.sections.map(sec => ({
          id: sec.id,
          checklist_template_id: sec.checklistTemplateId,
          title: sec.title,
          sort_order: sec.sortOrder
        }))
      );
      const { error: sectionsErr } = await supabase.from('checklist_sections').insert(dbSections);
      if (sectionsErr) throw sectionsErr;

      // Seed Checklist Criteria
      const dbCriteria = INITIAL_CHECKLISTS.flatMap(chk => 
        chk.sections.flatMap(sec => 
          sec.criteria.map(crit => ({
            id: crit.id,
            checklist_section_id: crit.checklistSectionId,
            code: crit.code,
            description: crit.description,
            reference: crit.reference || null,
            response_type: crit.responseType,
            required: crit.required,
            sort_order: crit.sortOrder
          }))
        )
      );
      const { error: criteriaErr } = await supabase.from('checklist_criteria').insert(dbCriteria);
      if (criteriaErr) throw criteriaErr;

      // Seed Projects
      const dbProjects = INITIAL_REFERENCE_PROJECTS.map(p => ({
        id: p.id,
        organization_id: p.organizationId,
        name: p.name,
        description: p.description || null,
        application: p.application || null,
        image_url: p.imageUrl || null,
        status: p.status
      }));
      const { error: projsErr } = await supabase.from('reference_projects').insert(dbProjects);
      if (projsErr) throw projsErr;

      console.log('[Supabase Seed] Seeding completed successfully!');
      setSyncError(null);

      // Force update context state to mock seed data to prevent loading an empty state
      setOrganizations(INITIAL_ORGANIZATIONS);
      setOrganizationModules(INITIAL_MODULES);
      setComponents(INITIAL_COMPONENTS);
      setDocuments(INITIAL_DOCUMENTS);
      setStandards(INITIAL_STANDARDS);
      setChecklists(INITIAL_CHECKLISTS);
      setReferenceProjects(INITIAL_REFERENCE_PROJECTS);
    } catch (seedErr: any) {
      console.error('[Supabase Seed] Error seeding database:', seedErr);
      setSyncError(`Erro ao semear o banco de dados Supabase: ${seedErr?.message || String(seedErr)}`);
    }
  };

  // Fetch initial data from Supabase DB on load
  useEffect(() => {
    const fetchFromSupabase = async () => {
      if (!supabase) {
        setSyncError('Supabase client not initialized. Check your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in Vercel settings.');
        return;
      }
      try {
        console.log('[Supabase Sync] Fetching initial data from database...');
        setSyncError(null);
        
        // Fetch Organizations
        const { data: orgsData, error: orgsErr } = await supabase
          .from('organizations')
          .select('*')
          .order('name', { ascending: true });
        if (orgsErr) throw orgsErr;

        // If the database has no organizations, seed it!
        if (!orgsData || orgsData.length === 0) {
          console.log('[Supabase Sync] Database is empty. Seeding initial data...');
          await seedDatabaseToSupabase();
          return;
        }

        setOrganizations((orgsData || []).map(mapOrgFromDb));

        // Fetch Modules
        const { data: modsData, error: modsErr } = await supabase
          .from('organization_modules')
          .select('*');
        if (modsErr) throw modsErr;
        setOrganizationModules((modsData || []).map(mapModFromDb));

        // Fetch Components
        const { data: compsData, error: compsErr } = await supabase
          .from('components')
          .select('*')
          .order('name', { ascending: true });
        if (compsErr) throw compsErr;
        setComponents((compsData || []).map(mapCompFromDb));

        // Fetch Documents
        const { data: docsData, error: docsErr } = await supabase
          .from('documents')
          .select('*')
          .order('title', { ascending: true });
        if (docsErr) throw docsErr;
        setDocuments((docsData || []).map(mapDocFromDb));

        // Fetch Standards
        const { data: stdsData, error: stdsErr } = await supabase
          .from('standards')
          .select('*')
          .order('title', { ascending: true });
        if (stdsErr) throw stdsErr;
        setStandards((stdsData || []).map(mapStdFromDb));

        // Fetch Projects
        const { data: projsData, error: projsErr } = await supabase
          .from('reference_projects')
          .select('*')
          .order('name', { ascending: true });
        if (projsErr) throw projsErr;
        setReferenceProjects((projsData || []).map(mapProjFromDb));

        // Fetch Checklist Templates with Sections and Criteria
        const { data: chksData, error: chksErr } = await supabase
          .from('checklist_template_v3_structured_fix_mock') // Fallback reference or select public template
          .select('*, sections:checklist_sections(*, criteria:checklist_criteria(*))');
        
        // Wait, if it fails because of table mock naming or table does not exist yet (or let's select direct tables)
        const selectQuery = supabase
          .from('checklist_templates')
          .select('*, sections:checklist_sections(*, criteria:checklist_criteria(*))');
        
        const { data: realChks, error: realChksErr } = await selectQuery;
        if (realChksErr) throw realChksErr;

        const tsChecklists = (realChks || []).map((chk: any) => {
          return mapChecklistTemplateFromDb(chk);
        });
        setChecklists(tsChecklists);

        // Fetch Downloads Log
        const { data: dlData, error: dlErr } = await supabase
          .from('downloads_log')
          .select('*')
          .order('download_date', { ascending: false });
        if (!dlErr && dlData) {
          setDownloadsLog(dlData.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            organization_id: d.organization_id,
            content_type: d.content_type,
            content_id: d.content_id,
            file_name: d.file_name,
            download_date: d.download_date
          })));
        }

        // Fetch Uploads Log
        const { data: ulData, error: ulErr } = await supabase
          .from('uploads_log')
          .select('*')
          .order('upload_date', { ascending: false });
        if (!ulErr && ulData) {
          setUploadsLog(ulData.map((u: any) => ({
            id: u.id,
            user_id: u.user_id,
            organization_id: u.organization_id,
            content_type: u.content_type,
            file_name: u.file_name,
            upload_date: u.upload_date
          })));
        }

        // Fetch Page Access Log
        const { data: paData, error: paErr } = await supabase
          .from('page_access_log')
          .select('*')
          .order('access_date', { ascending: false });
        if (!paErr && paData) {
          setPageAccessLog(paData.map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            page: p.page,
            access_date: p.access_date
          })));
        }

        console.log('[Supabase Sync] Fetched successfully from Supabase!');
      } catch (err: any) {
        console.error('[Supabase Sync] Error during loading:', err);
        setSyncError(err?.message || String(err));
      }
    };
    fetchFromSupabase();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pp_organizations_v2', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('pp_organization_modules_v2', JSON.stringify(organizationModules));
  }, [organizationModules]);

  useEffect(() => {
    localStorage.setItem('pp_components_v2', JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    localStorage.setItem('pp_documents_v2', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('pp_standards_v2', JSON.stringify(standards));
  }, [standards]);

  useEffect(() => {
    localStorage.setItem('pp_checklists_v3', JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('pp_reference_projects_v2', JSON.stringify(referenceProjects));
  }, [referenceProjects]);

  useEffect(() => {
    localStorage.setItem('pp_downloads_log_v1', JSON.stringify(downloadsLog));
  }, [downloadsLog]);

  useEffect(() => {
    localStorage.setItem('pp_uploads_log_v1', JSON.stringify(uploadsLog));
  }, [uploadsLog]);

  useEffect(() => {
    localStorage.setItem('pp_page_access_log_v1', JSON.stringify(pageAccessLog));
  }, [pageAccessLog]);

  useEffect(() => {
    localStorage.setItem('pp_files_v2', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pp_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('pp_session');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pp_viewing_as_user', viewingAsUser ? 'true' : 'false');
  }, [viewingAsUser]);

  // Auth actions
  const login = (email: string, role: 'master' | 'user') => {
    setUser({ email, role });
    setViewingAsUser(false);
  };

  const logout = () => {
    setUser(null);
    setViewingAsUser(false);
  };

  // Organization Actions
  const addOrganization = (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>, modules: Record<ModuleType, boolean>) => {
    const newOrgId = crypto.randomUUID();
    const newOrg: Organization = {
      ...org,
      id: newOrgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newModules: OrganizationModule[] = MODULE_TYPES.map(mod => ({
      id: crypto.randomUUID(),
      organizationId: newOrgId,
      moduleType: mod,
      enabled: !!modules[mod],
      createdAt: new Date().toISOString()
    }));

    setOrganizations(prev => [newOrg, ...prev]);
    setOrganizationModules(prev => [...prev, ...newModules]);

    if (supabase) {
      supabase
        .from('organizations')
        .insert({
          id: newOrgId,
          name: org.name,
          slug: org.slug,
          organization_type: org.organizationType,
          logo_url: org.logoUrl || null,
          description: org.description || null,
          status: org.status
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error adding organization to Supabase:', error);
            return;
          }
          const dbModules = newModules.map(m => ({
            id: m.id,
            organization_id: newOrgId,
            module_type: m.moduleType,
            enabled: m.enabled
          }));
          supabase
            .from('organization_modules')
            .insert(dbModules)
            .then(({ error: modErr }) => {
              if (modErr) console.error('Error adding organization modules to Supabase:', modErr);
            });
        });
    }
  };

  const updateOrganization = (id: string, updatedFields: Partial<Organization>, modules?: Record<ModuleType, boolean>) => {
    setOrganizations(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));
    
    let updatedModules: OrganizationModule[] = [];
    if (modules) {
      updatedModules = MODULE_TYPES.map(mod => ({
        id: crypto.randomUUID(),
        organizationId: id,
        moduleType: mod,
        enabled: !!modules[mod],
        createdAt: new Date().toISOString()
      }));
      setOrganizationModules(prev => {
        const filtered = prev.filter(m => m.organizationId !== id);
        return [...filtered, ...updatedModules];
      });
    }

    if (supabase) {
      const dbFields = mapOrgToDb(updatedFields);
      const updatePromise = Object.keys(dbFields).length > 0
        ? supabase.from('organizations').update(dbFields).eq('id', id)
        : Promise.resolve({ error: null });

      updatePromise.then(({ error }) => {
        if (error) {
          console.error('Error updating organization in Supabase:', error);
          return;
        }

        if (modules) {
          supabase
            .from('organization_modules')
            .delete()
            .eq('organization_id', id)
            .then(({ error: delErr }) => {
              if (delErr) {
                console.error('Error deleting organization modules in Supabase:', delErr);
                return;
              }
              const dbModules = updatedModules.map(m => ({
                id: m.id,
                organization_id: id,
                module_type: m.moduleType,
                enabled: m.enabled
              }));
              supabase
                .from('organization_modules')
                .insert(dbModules)
                .then(({ error: insErr }) => {
                  if (insErr) console.error('Error inserting organization modules in Supabase:', insErr);
                });
            });
        }
      });
    }
  };

  const deleteOrganization = (id: string) => {
    setOrganizations(prev => prev.filter(item => item.id !== id));
    setOrganizationModules(prev => prev.filter(item => item.organizationId !== id));
    setComponents(prev => prev.filter(item => item.organizationId !== id));
    setDocuments(prev => prev.filter(item => item.organizationId !== id));
    setStandards(prev => prev.filter(item => item.organizationId !== id));
    setChecklists(prev => prev.filter(item => item.organizationId !== id));
    setReferenceProjects(prev => prev.filter(item => item.organizationId !== id));

    if (supabase) {
      supabase
        .from('organizations')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting organization in Supabase:', error);
        });
    }
  };

  // Compatibility aliases for OEM
  const addOEM = (org: any) => {
    // Default modules enabled
    const defaultModules = {
      components: true,
      documentation: true,
      standards: true,
      checklists: true,
      reference_projects: true,
      cad_library: false,
      procedures: false
    };
    addOrganization({
      name: org.name,
      slug: org.slug,
      organizationType: org.organizationType || 'oem',
      logoUrl: org.logoUrl,
      description: org.description,
      status: org.status || 'active'
    }, defaultModules);
  };
  
  const updateOEM = (id: string, org: any) => {
    updateOrganization(id, org);
  };

  const deleteOEM = (id: string) => {
    deleteOrganization(id);
  };

  // Component Actions
  const addComponent = (comp: Omit<ComponentEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompId = crypto.randomUUID();
    const newComp: ComponentEntry = {
      ...comp,
      id: newCompId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setComponents(prev => [newComp, ...prev]);

    if (supabase) {
      supabase
        .from('components')
        .insert({
          id: newCompId,
          organization_id: comp.organizationId,
          name: comp.name,
          description: comp.description || null,
          application: comp.application || null,
          revision: comp.revision,
          status: comp.status,
          step_file_url: comp.stepFileUrl || null,
          pdf_file_url: comp.pdfFileUrl || null,
          dwg_file_url: comp.dwgFileUrl || null,
          image_url: comp.imageUrl || null
        })
        .then(({ error }) => {
          if (error) console.error('Error adding component to Supabase:', error);
        });
    }
  };

  const updateComponent = (id: string, updatedFields: Partial<ComponentEntry>) => {
    setComponents(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));

    if (supabase) {
      const dbFields = mapCompToDb(updatedFields);
      supabase
        .from('components')
        .update(dbFields)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error updating component in Supabase:', error);
        });
    }
  };

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(item => item.id !== id));

    if (supabase) {
      supabase
        .from('components')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting component in Supabase:', error);
        });
    }
  };

  // Document Actions
  const addDocument = (doc: Omit<DocumentEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDocId = crypto.randomUUID();
    const newDoc: DocumentEntry = {
      ...doc,
      id: newDocId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDocuments(prev => [newDoc, ...prev]);

    if (supabase) {
      supabase
        .from('documents')
        .insert({
          id: newDocId,
          organization_id: doc.organizationId,
          title: doc.title,
          description: doc.description || null,
          document_type: doc.documentType,
          revision: doc.revision,
          status: doc.status,
          file_url: doc.fileUrl || null,
          file_name: doc.fileName || null,
          file_type: doc.fileType || null
        })
        .then(({ error }) => {
          if (error) console.error('Error adding document to Supabase:', error);
        });
    }
  };

  const updateDocument = (id: string, updatedFields: Partial<DocumentEntry>) => {
    setDocuments(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));

    if (supabase) {
      const dbFields = mapDocToDb(updatedFields);
      supabase
        .from('documents')
        .update(dbFields)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error updating document in Supabase:', error);
        });
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(item => item.id !== id));

    if (supabase) {
      supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting document in Supabase:', error);
        });
    }
  };

  // Standard Actions
  const addStandard = (std: Omit<StandardEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStdId = crypto.randomUUID();
    const newStd: StandardEntry = {
      ...std,
      id: newStdId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setStandards(prev => [newStd, ...prev]);

    if (supabase) {
      supabase
        .from('standards')
        .insert({
          id: newStdId,
          organization_id: std.organizationId,
          title: std.title,
          description: std.description || null,
          revision: std.revision,
          status: std.status,
          reference_document: std.referenceDocument || null,
          file_url: std.fileUrl || null,
          file_name: std.fileName || null,
          file_type: std.fileType || null
        })
        .then(({ error }) => {
          if (error) console.error('Error adding standard to Supabase:', error);
        });
    }
  };

  const updateStandard = (id: string, updatedFields: Partial<StandardEntry>) => {
    setStandards(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));

    if (supabase) {
      const dbFields = mapStdToDb(updatedFields);
      supabase
        .from('standards')
        .update(dbFields)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error updating standard in Supabase:', error);
        });
    }
  };

  const deleteStandard = (id: string) => {
    setStandards(prev => prev.filter(item => item.id !== id));

    if (supabase) {
      supabase
        .from('standards')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting standard in Supabase:', error);
        });
    }
  };

  // Checklist Actions
  const addChecklist = (
    checklist: Omit<ChecklistTemplate, 'id' | 'createdAt' | 'updatedAt' | 'sections' | 'items'>,
    sections: ChecklistSection[]
  ) => {
    const templateId = crypto.randomUUID();
    const mappedSections: ChecklistSection[] = sections.map((sec, secIdx) => {
      const secId = crypto.randomUUID();
      return {
        ...sec,
        id: secId,
        checklistTemplateId: templateId,
        sortOrder: sec.sortOrder || (secIdx + 1),
        criteria: (sec.criteria || []).map((crit, critIdx) => ({
          ...crit,
          id: crypto.randomUUID(),
          checklistSectionId: secId,
          sortOrder: crit.sortOrder || (critIdx + 1),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      };
    });

    const newTemplate: ChecklistTemplate = {
      ...checklist,
      id: templateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: mappedSections,
      items: []
    };

    setChecklists(prev => [newTemplate, ...prev]);

    if (supabase) {
      supabase
        .from('checklist_templates')
        .insert({
          id: templateId,
          organization_id: checklist.organizationId,
          name: checklist.name,
          revision: checklist.revision,
          status: checklist.status
        })
        .then(({ error: tErr }) => {
          if (tErr) {
            console.error('Error adding checklist template to Supabase:', tErr);
            return;
          }

          const dbSections = mappedSections.map(sec => ({
            id: sec.id,
            checklist_template_id: templateId,
            title: sec.title,
            description: sec.description || null,
            sort_order: sec.sortOrder
          }));

          supabase
            .from('checklist_sections')
            .insert(dbSections)
            .then(({ error: secErr }) => {
              if (secErr) {
                console.error('Error adding checklist sections to Supabase:', secErr);
                return;
              }

              const dbCriteria = mappedSections.flatMap(sec => 
                sec.criteria.map(crit => ({
                  id: crit.id,
                  checklist_section_id: sec.id,
                  code: crit.code,
                  description: crit.description,
                  reference: crit.reference || null,
                  response_type: crit.responseType,
                  required: crit.required,
                  sort_order: crit.sortOrder
                }))
              );

              if (dbCriteria.length > 0) {
                supabase
                  .from('checklist_criteria')
                  .insert(dbCriteria)
                  .then(({ error: critErr }) => {
                    if (critErr) console.error('Error adding checklist criteria to Supabase:', critErr);
                  });
              }
            });
        });
    }
  };

  const updateChecklist = (
    id: string,
    checklistFields: Partial<Omit<ChecklistTemplate, 'sections' | 'items'>>,
    sectionsList?: ChecklistSection[]
  ) => {
    let finalSections: ChecklistSection[] = [];
    setChecklists(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...checklistFields, updatedAt: new Date().toISOString() };
        if (sectionsList) {
          finalSections = sectionsList.map((sec, secIdx) => {
            const secId = sec.id || crypto.randomUUID();
            return {
              ...sec,
              id: secId,
              checklistTemplateId: id,
              sortOrder: sec.sortOrder || (secIdx + 1),
              criteria: (sec.criteria || []).map((crit, critIdx) => ({
                ...crit,
                id: crit.id || crypto.randomUUID(),
                checklistSectionId: secId,
                sortOrder: crit.sortOrder || (critIdx + 1),
                createdAt: crit.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }))
            };
          });
          updated.sections = finalSections;
        }
        return updated;
      }
      return item;
    }));

    if (supabase) {
      const dbFields = mapChecklistTemplateToDb(checklistFields);

      const updatePromise = Object.keys(dbFields).length > 0
        ? supabase.from('checklist_templates').update(dbFields).eq('id', id)
        : Promise.resolve({ error: null });

      updatePromise.then(({ error }) => {
        if (error) {
          console.error('Error updating checklist template in Supabase:', error);
          return;
        }

        if (sectionsList) {
          supabase
            .from('checklist_sections')
            .delete()
            .eq('checklist_template_id', id)
            .then(({ error: delErr }) => {
              if (delErr) {
                console.error('Error removing old sections in Supabase:', delErr);
                return;
              }

              const dbSections = finalSections.map(sec => ({
                id: sec.id,
                checklist_template_id: id,
                title: sec.title,
                description: sec.description || null,
                sort_order: sec.sortOrder
              }));

              supabase
                .from('checklist_sections')
                .insert(dbSections)
                .then(({ error: insSecErr }) => {
                  if (insSecErr) {
                    console.error('Error inserting sections in Supabase:', insSecErr);
                    return;
                  }

                  const dbCriteria = finalSections.flatMap(sec => 
                    sec.criteria.map(crit => ({
                      id: crit.id,
                      checklist_section_id: sec.id,
                      code: crit.code,
                      description: crit.description,
                      reference: crit.reference || null,
                      response_type: crit.responseType,
                      required: crit.required,
                      sort_order: crit.sortOrder
                    }))
                  );

                  if (dbCriteria.length > 0) {
                    supabase
                      .from('checklist_criteria')
                      .insert(dbCriteria)
                      .then(({ error: insCritErr }) => {
                        if (insCritErr) console.error('Error inserting criteria in Supabase:', insCritErr);
                      });
                  }
                });
            });
        }
      });
    }
  };

  const deleteChecklist = (id: string) => {
    setChecklists(prev => prev.filter(item => item.id !== id));

    if (supabase) {
      supabase
        .from('checklist_templates')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting checklist template in Supabase:', error);
        });
    }
  };

  // Reference Project Actions
  const addReferenceProject = (proj: Omit<ReferenceProjectEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProjId = crypto.randomUUID();
    const newProj: ReferenceProjectEntry = {
      ...proj,
      id: newProjId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setReferenceProjects(prev => [newProj, ...prev]);

    if (supabase) {
      supabase
        .from('reference_projects')
        .insert({
          id: newProjId,
          organization_id: proj.organizationId,
          name: proj.name,
          description: proj.description || null,
          application: proj.application || null,
          image_url: proj.imageUrl || null,
          attachment_url: proj.attachmentUrl || null,
          attachment_name: proj.attachmentName || null,
          attachment_type: proj.attachmentType || null,
          status: proj.status
        })
        .then(({ error }) => {
          if (error) console.error('Error adding reference project to Supabase:', error);
        });
    }
  };

  const updateReferenceProject = (id: string, updatedFields: Partial<ReferenceProjectEntry>) => {
    setReferenceProjects(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));

    if (supabase) {
      const dbFields = mapProjToDb(updatedFields);
      supabase
        .from('reference_projects')
        .update(dbFields)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error updating reference project in Supabase:', error);
        });
    }
  };

  const deleteReferenceProject = (id: string) => {
    setReferenceProjects(prev => prev.filter(item => item.id !== id));

    if (supabase) {
      supabase
        .from('reference_projects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting reference project in Supabase:', error);
        });
    }
  };

  // Raw Files actions (Local state only)
  const addFile = (file: Omit<FileEntry, 'id' | 'createdAt'>) => {
    const newFile: FileEntry = {
      ...file,
      id: `file-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setFiles(prev => [newFile, ...prev]);
  };

  const updateFile = (id: string, updatedFields: Partial<FileEntry>) => {
    setFiles(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(item => item.id !== id));
  };

  const logDownload = useCallback(async (orgId: string, contentType: string, contentId: string, fileName: string) => {
    const userEmail = user?.email || 'anonimo@perspecpack.com';
    const newLog: DownloadLog = {
      id: crypto.randomUUID(),
      user_id: userEmail,
      organization_id: orgId,
      content_type: contentType,
      content_id: contentId,
      file_name: fileName,
      download_date: new Date().toISOString()
    };
    
    setDownloadsLog(prev => [newLog, ...prev]);
    
    if (supabase) {
      const { error } = await supabase.from('downloads_log').insert({
        id: newLog.id,
        user_id: newLog.user_id,
        organization_id: newLog.organization_id,
        content_type: newLog.content_type,
        content_id: newLog.content_id,
        file_name: newLog.file_name,
        download_date: newLog.download_date
      });
      if (error) console.error('Error logging download to Supabase:', error);
    }
  }, [user]);

  const logUpload = useCallback(async (orgId: string, contentType: string, fileName: string) => {
    const userEmail = user?.email || 'anonimo@perspecpack.com';
    const newLog: UploadLog = {
      id: crypto.randomUUID(),
      user_id: userEmail,
      organization_id: orgId,
      content_type: contentType,
      file_name: fileName,
      upload_date: new Date().toISOString()
    };
    
    setUploadsLog(prev => [newLog, ...prev]);
    
    if (supabase) {
      const { error } = await supabase.from('uploads_log').insert({
        id: newLog.id,
        user_id: newLog.user_id,
        organization_id: newLog.organization_id,
        content_type: newLog.content_type,
        file_name: newLog.file_name,
        upload_date: newLog.upload_date
      });
      if (error) console.error('Error logging upload to Supabase:', error);
    }
  }, [user]);

  const logPageAccess = useCallback(async (page: string) => {
    const userEmail = user?.email || 'anonimo@perspecpack.com';
    const newLog: PageAccessLog = {
      id: crypto.randomUUID(),
      user_id: userEmail,
      page: page,
      access_date: new Date().toISOString()
    };
    
    setPageAccessLog(prev => [newLog, ...prev]);
    
    if (supabase) {
      const { error } = await supabase.from('page_access_log').insert({
        id: newLog.id,
        user_id: newLog.user_id,
        page: newLog.page,
        access_date: newLog.access_date
      });
      if (error) console.error('Error logging page access to Supabase:', error);
    }
  }, [user]);

  // Compatibility fields mapping
  const activeOems = organizations.filter(o => o.status === 'active');
  const dummyCategories = [
    { id: 'cat-comp', name: 'Componentes Homologados', slug: 'componentes-homologados', icon: 'Box', status: 'active' as const },
    { id: 'cat-doc', name: 'Caderno de Encargos', slug: 'caderno-de-encargos', icon: 'FileText', status: 'active' as const },
    { id: 'cat-normas', name: 'Documentação Técnica', slug: 'documentacao-tecnica', icon: 'ShieldCheck', status: 'active' as const },
    { id: 'cat-checks', name: 'Checklist de Validação', icon: 'CheckSquare', slug: 'checklist-de-validao', status: 'active' as const },
    { id: 'cat-proj', name: 'Projetos de Referência', icon: 'FolderKanban', slug: 'projetos-de-referencia', status: 'active' as const },
  ];

  return (
    <AppContext.Provider
      value={{
        organizations,
        organizationModules,
        components,
        documents,
        standards,
        checklists,
        referenceProjects,
        
        downloadsLog,
        uploadsLog,
        pageAccessLog,
        
        oems: organizations,
        categories: dummyCategories,
        files,
        projects: referenceProjects,

        user,
        viewingAsUser,
        syncError,
        login,
        logout,
        setViewingAsUser,

        logDownload,
        logUpload,
        logPageAccess,

        addOrganization,
        updateOrganization,
        deleteOrganization,
        
        addOEM,
        updateOEM,
        deleteOEM,

        addComponent,
        updateComponent,
        deleteComponent,

        addDocument,
        updateDocument,
        deleteDocument,

        addStandard,
        updateStandard,
        deleteStandard,

        addChecklist,
        updateChecklist,
        deleteChecklist,

        addReferenceProject,
        updateReferenceProject,
        deleteReferenceProject,

        addFile,
        updateFile,
        deleteFile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
