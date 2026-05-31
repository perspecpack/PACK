import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Organization,
  OrganizationModule,
  ComponentEntry,
  DocumentEntry,
  StandardEntry,
  ChecklistEntry,
  ChecklistItem,
  ReferenceProjectEntry,
  User,
  OrganizationType,
  ModuleType,
  DocumentType
} from '../types';

export type {
  Organization,
  OrganizationModule,
  ComponentEntry,
  DocumentEntry,
  StandardEntry,
  ChecklistEntry,
  ChecklistItem,
  ReferenceProjectEntry,
  User,
  OrganizationType,
  ModuleType,
  DocumentType
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
  checklists: ChecklistEntry[];
  referenceProjects: ReferenceProjectEntry[];
  
  // Backward compatibility fields
  oems: Organization[];
  categories: { id: string; name: string; slug: string; icon: string; status: 'active' }[];
  files: FileEntry[];
  projects: any[];

  // User state
  user: User | null;
  viewingAsUser: boolean;
  
  // Auth actions
  login: (email: string, role: 'master' | 'user') => void;
  logout: () => void;
  setViewingAsUser: (val: boolean) => void;

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
  addChecklist: (checklist: Omit<ChecklistEntry, 'id' | 'createdAt' | 'updatedAt' | 'items'>, items: Omit<ChecklistItem, 'id' | 'checklistId' | 'createdAt'>[]) => void;
  updateChecklist: (id: string, checklist: Partial<Omit<ChecklistEntry, 'items'>>, items?: Omit<ChecklistItem, 'checklistId' | 'createdAt'>[]) => void;
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
  { id: 'org-vw', name: 'Volkswagen', slug: 'volkswagen', organizationType: 'oem', description: 'Diretrizes e normas de embalagens para a rede de fornecedores Volkswagen.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org-hyundai', name: 'Hyundai', slug: 'hyundai', organizationType: 'oem', description: 'Especificações técnicas da montadora Hyundai.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org-nissan', name: 'Nissan', slug: 'nissan', organizationType: 'oem', description: 'Requisitos de embalagens Nissan.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org-renault', name: 'Renault', slug: 'renault', organizationType: 'oem', description: 'Especificações de rack e logísticas Renault.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org-scania', name: 'Scania', slug: 'scania', organizationType: 'oem', description: 'Caderno de encargos e embalagens pesadas Scania.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org-gestamp', name: 'Gestamp', slug: 'gestamp', organizationType: 'tier1', description: 'Padrões logísticos da multinacional Gestamp.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MODULE_TYPES: ModuleType[] = ['components', 'documentation', 'standards', 'checklists', 'reference_projects', 'cad_library', 'procedures'];

const INITIAL_MODULES: OrganizationModule[] = [];
INITIAL_ORGANIZATIONS.forEach(org => {
  MODULE_TYPES.forEach(mod => {
    // Default enabled modules based on specification:
    // components, documentation (standards in spec as 'standards'), checklists, reference_projects are active by default
    const isDefaultEnabled = ['components', 'documentation', 'standards', 'checklists', 'reference_projects'].includes(mod);
    INITIAL_MODULES.push({
      id: `mod-${org.id}-${mod}`,
      organizationId: org.id,
      moduleType: mod,
      enabled: isDefaultEnabled,
      createdAt: new Date().toISOString()
    });
  });
});

const INITIAL_COMPONENTS: ComponentEntry[] = [
  {
    id: 'comp-1',
    organizationId: 'org-vw',
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
    id: 'comp-2',
    organizationId: 'org-vw',
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
    id: 'comp-3',
    organizationId: 'org-hyundai',
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
    id: 'doc-1',
    organizationId: 'org-vw',
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
    id: 'doc-2',
    organizationId: 'org-vw',
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
    id: 'doc-3',
    organizationId: 'org-hyundai',
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
    id: 'std-1',
    organizationId: 'org-vw',
    title: 'VDI 2300 - Embalagens Metálicas',
    description: 'Norma alemã regulatória para estruturação de embalagens metálicas.',
    revision: '2024',
    status: 'active',
    referenceDocument: 'VDI 2300',
    fileUrl: 'https://example.com/files/vdi_2300.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'std-2',
    organizationId: 'org-vw',
    title: 'Padrão Ergonômico de Levantamento de Carga',
    description: 'Limites de força para manuseio manual de peças no rack.',
    revision: 'Rev. B',
    status: 'active',
    referenceDocument: 'ISO 11228-1',
    fileUrl: 'https://example.com/files/ergonomia_vw.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'std-3',
    organizationId: 'org-hyundai',
    title: 'Padrão de Empilhamento HMC-STD-8',
    description: 'Requisitos de segurança e encaixe de cantoneiras para empilhamento.',
    revision: '01',
    status: 'active',
    referenceDocument: 'HMC-STD-8',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_CHECKLISTS: ChecklistEntry[] = [
  {
    id: 'chk-1',
    organizationId: 'org-vw',
    name: 'Checklist Padrão Embalagens VW',
    revision: '01',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-1', checklistId: 'chk-1', category: 'Estrutura', description: 'A estrutura tubular atende à especificação VDI 2300?', required: true, reference: 'VDI 2300 Sec. 4', sortOrder: 1, createdAt: new Date().toISOString() },
      { id: 'item-2', checklistId: 'chk-1', category: 'Empilhamento', description: 'Possui cantoneiras de empilhamento homologadas?', required: true, reference: 'Norma VW 39D 120', sortOrder: 2, createdAt: new Date().toISOString() },
      { id: 'item-3', checklistId: 'chk-1', category: 'AGV', description: 'A altura do rodízio está compatível com o sistema AGV (Mínimo 150mm)?', required: true, reference: 'Manual Requisitos AGV', sortOrder: 3, createdAt: new Date().toISOString() },
      { id: 'item-4', checklistId: 'chk-1', category: 'Ergonomia', description: 'A força de extração da peça é inferior a 15kg?', required: true, reference: 'ISO 11228-1', sortOrder: 4, createdAt: new Date().toISOString() },
      { id: 'item-5', checklistId: 'chk-1', category: 'Identificação', description: 'O porta-etiquetas está afixado em local visível no painel frontal?', required: true, reference: 'VW GLW 2026', sortOrder: 5, createdAt: new Date().toISOString() },
    ]
  },
  {
    id: 'chk-2',
    organizationId: 'org-hyundai',
    name: 'Validação Geral de Embalagem Hyundai',
    revision: '02',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-6', checklistId: 'chk-2', category: 'Estrutura', description: 'Solda de acordo com o padrão Hyundai Weld-Spec?', required: true, reference: 'HMC-W-201', sortOrder: 1, createdAt: new Date().toISOString() },
      { id: 'item-7', checklistId: 'chk-2', category: 'Segurança', description: 'Dispositivos de trava funcionais e sem cantos vivos?', required: true, reference: 'Safety Manual HMC', sortOrder: 2, createdAt: new Date().toISOString() }
    ]
  }
];

const INITIAL_REFERENCE_PROJECTS: ReferenceProjectEntry[] = [
  {
    id: 'proj-1',
    organizationId: 'org-vw',
    name: 'Rack Metálico Taos Parachoque',
    description: 'Estrutura customizada para transporte de parachoques pintados do VW Taos.',
    application: 'Transporte entre planta de pintura e linha de montagem final.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj-2',
    organizationId: 'org-hyundai',
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
  { id: 'file-1', name: 'Suporte_Porta_Etiqueta_REV03.step', oemId: 'org-vw', categoryId: 'cat-comp', fileType: 'STEP', revision: '03', description: 'Modelo 3D do porta-etiquetas padrão VW.', status: 'published', fileUrl: 'https://example.com/files/suporte_porta_etiqueta_rev03.step', createdAt: new Date().toISOString() },
  { id: 'file-2', name: 'VDI_2300_Embalagens_Metalicas.pdf', oemId: 'org-vw', categoryId: 'cat-normas', fileType: 'PDF', revision: '2024', description: 'Norma alemã para estruturação de embalagens metálicas.', status: 'published', fileUrl: 'https://example.com/files/vdi_2300.pdf', createdAt: new Date().toISOString() },
  { id: 'file-3', name: 'Caderno_Encargos_Geral_2026.pdf', oemId: 'org-vw', categoryId: 'cat-doc', fileType: 'PDF', revision: '04', description: 'Caderno de encargos gerais de embalagens VW 2026.', status: 'published', fileUrl: 'https://example.com/files/caderno_encargos_2026.pdf', createdAt: new Date().toISOString() },
  { id: 'file-4', name: 'Checklist_Inspecao_Rodizio_AGV.xlsx', oemId: 'org-vw', categoryId: 'cat-checks', fileType: 'XLSX', revision: '01', description: 'Planilha auxiliar para checagem de rodízios compatíveis com AGV.', status: 'published', fileUrl: 'https://example.com/files/checklist_rodizio_agv.xlsx', createdAt: new Date().toISOString() },
  { id: 'file-5', name: 'Rack_Referencia_Taos_Desenho.dwg', oemId: 'org-vw', categoryId: 'cat-proj', fileType: 'DWG', revision: '02', description: 'Desenho 2D de referência do rack metálico do VW Taos.', status: 'published', fileUrl: 'https://example.com/files/rack_taos_desenho.dwg', createdAt: new Date().toISOString() },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State from LocalStorage or Seed
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

  const [checklists, setChecklists] = useState<ChecklistEntry[]>(() => {
    const saved = localStorage.getItem('pp_checklists_v2');
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

  // User auth state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pp_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Mode to simulate public view
  const [viewingAsUser, setViewingAsUser] = useState<boolean>(() => {
    return localStorage.getItem('pp_viewing_as_user') === 'true';
  });

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
    localStorage.setItem('pp_checklists_v2', JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('pp_reference_projects_v2', JSON.stringify(referenceProjects));
  }, [referenceProjects]);

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
    const newOrgId = `org-${Math.random().toString(36).substring(2, 9)}`;
    const newOrg: Organization = {
      ...org,
      id: newOrgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create module associations
    const newModules: OrganizationModule[] = MODULE_TYPES.map(mod => ({
      id: `mod-${newOrgId}-${mod}`,
      organizationId: newOrgId,
      moduleType: mod,
      enabled: !!modules[mod],
      createdAt: new Date().toISOString()
    }));

    setOrganizations(prev => [newOrg, ...prev]);
    setOrganizationModules(prev => [...prev, ...newModules]);
  };

  const updateOrganization = (id: string, updatedFields: Partial<Organization>, modules?: Record<ModuleType, boolean>) => {
    setOrganizations(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));
    
    if (modules) {
      setOrganizationModules(prev => {
        // Remove old modules for this organization
        const filtered = prev.filter(m => m.organizationId !== id);
        // Add updated modules
        const updatedModules: OrganizationModule[] = MODULE_TYPES.map(mod => ({
          id: `mod-${id}-${mod}`,
          organizationId: id,
          moduleType: mod,
          enabled: !!modules[mod],
          createdAt: new Date().toISOString()
        }));
        return [...filtered, ...updatedModules];
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
    const newComp: ComponentEntry = {
      ...comp,
      id: `comp-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setComponents(prev => [newComp, ...prev]);
  };

  const updateComponent = (id: string, updatedFields: Partial<ComponentEntry>) => {
    setComponents(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));
  };

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(item => item.id !== id));
  };

  // Document Actions
  const addDocument = (doc: Omit<DocumentEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDoc: DocumentEntry = {
      ...doc,
      id: `doc-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const updateDocument = (id: string, updatedFields: Partial<DocumentEntry>) => {
    setDocuments(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(item => item.id !== id));
  };

  // Standard Actions
  const addStandard = (std: Omit<StandardEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStd: StandardEntry = {
      ...std,
      id: `std-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setStandards(prev => [newStd, ...prev]);
  };

  const updateStandard = (id: string, updatedFields: Partial<StandardEntry>) => {
    setStandards(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));
  };

  const deleteStandard = (id: string) => {
    setStandards(prev => prev.filter(item => item.id !== id));
  };

  // Checklist Actions
  const addChecklist = (
    checklist: Omit<ChecklistEntry, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
    items: Omit<ChecklistItem, 'id' | 'checklistId' | 'createdAt'>[]
  ) => {
    const newChecklistId = `chk-${Math.random().toString(36).substring(2, 9)}`;
    const mappedItems: ChecklistItem[] = items.map((item, idx) => ({
      ...item,
      id: `item-${Math.random().toString(36).substring(2, 9)}-${idx}`,
      checklistId: newChecklistId,
      createdAt: new Date().toISOString()
    }));

    const newChecklist: ChecklistEntry = {
      ...checklist,
      id: newChecklistId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: mappedItems,
    };
    setChecklists(prev => [newChecklist, ...prev]);
  };

  const updateChecklist = (
    id: string,
    checklistFields: Partial<Omit<ChecklistEntry, 'items'>>,
    itemsList?: Omit<ChecklistItem, 'checklistId' | 'createdAt'>[]
  ) => {
    setChecklists(prev => prev.map(item => {
      if (item.id === id) {
        const updatedChecklist = { ...item, ...checklistFields, updatedAt: new Date().toISOString() };
        if (itemsList) {
          updatedChecklist.items = itemsList.map((itm, idx) => ({
            ...itm,
            id: itm.id || `item-${Math.random().toString(36).substring(2, 9)}-${idx}`,
            checklistId: id,
            createdAt: (itm as any).createdAt || new Date().toISOString()
          }));
        }
        return updatedChecklist;
      }
      return item;
    }));
  };

  const deleteChecklist = (id: string) => {
    setChecklists(prev => prev.filter(item => item.id !== id));
  };

  // Reference Project Actions
  const addReferenceProject = (proj: Omit<ReferenceProjectEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProj: ReferenceProjectEntry = {
      ...proj,
      id: `proj-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setReferenceProjects(prev => [newProj, ...prev]);
  };

  const updateReferenceProject = (id: string, updatedFields: Partial<ReferenceProjectEntry>) => {
    setReferenceProjects(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() } : item));
  };

  const deleteReferenceProject = (id: string) => {
    setReferenceProjects(prev => prev.filter(item => item.id !== id));
  };

  // Raw Files actions
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

  // Compatibility fields mapping
  const activeOems = organizations.filter(o => o.status === 'active');
  const dummyCategories = [
    { id: 'cat-comp', name: 'Componentes Homologados', slug: 'componentes-homologados', icon: 'Box', status: 'active' as const },
    { id: 'cat-doc', name: 'Documentação Técnica', slug: 'documentacao-tecnica', icon: 'FileText', status: 'active' as const },
    { id: 'cat-normas', name: 'Normas e Padrões', slug: 'normas-e-padroes', icon: 'ShieldCheck', status: 'active' as const },
    { id: 'cat-checks', name: 'Checklists', icon: 'CheckSquare', slug: 'checklists', status: 'active' as const },
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
        
        oems: organizations,
        categories: dummyCategories,
        files,
        projects: referenceProjects,

        user,
        viewingAsUser,
        login,
        logout,
        setViewingAsUser,

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
