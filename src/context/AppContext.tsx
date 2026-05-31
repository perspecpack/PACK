import React, { createContext, useContext, useState, useEffect } from 'react';

// Type Definitions
export type OrganizationType = 
  | 'oem' 
  | 'tier1' 
  | 'component_manufacturer' 
  | 'industrial_client' 
  | 'internal_standard';

export interface OEM {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  logoUrl?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string; // Lucide icon name as string
  status: 'active' | 'inactive';
  createdAt: string;
}

export type FileType = 'STEP' | 'PDF' | 'DWG' | 'XLSX' | 'DOCX' | 'PNG' | 'JPG';

export interface FileEntry {
  id: string;
  name: string;
  oemId: string;
  categoryId: string;
  fileType: FileType;
  revision: string;
  description?: string;
  status: 'published' | 'draft';
  fileUrl: string;
  createdAt: string;
}

export type TechCategory =
  | 'porta_etiquetas'
  | 'rodizios'
  | 'travas_canhao'
  | 'engates'
  | 'batentes'
  | 'agv'
  | 'olhais'
  | 'estruturas'
  | 'skids'
  | 'colunas_empilhamento';

export interface ComponentEntry {
  id: string;
  name: string;
  oemId: string;
  techCategory: TechCategory;
  description?: string;
  application?: string;
  revision: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  stepUrl?: string;
  pdfUrl?: string;
  dwgUrl?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  category: string; // e.g. 'Estrutura', 'Empilhamento'
  description: string;
  isMandatory: boolean;
  techRef?: string;
  order: number;
}

export interface ChecklistEntry {
  id: string;
  oemId: string;
  name: string;
  revision: string;
  status: 'active' | 'inactive';
  createdAt: string;
  items: ChecklistItem[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  oemId: string;
  packagingType: string; // e.g. 'Rack Metálico'
  description?: string;
  application?: string;
  imageUrl?: string;
  linkedDocIds: string[]; // references to FileEntry ids
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface User {
  email: string;
  role: 'master' | 'user';
}

interface AppContextType {
  oems: OEM[];
  categories: Category[];
  files: FileEntry[];
  components: ComponentEntry[];
  checklists: ChecklistEntry[];
  projects: ProjectEntry[];
  user: User | null;
  viewingAsUser: boolean;
  
  // Auth actions
  login: (email: string, role: 'master' | 'user') => void;
  logout: () => void;
  setViewingAsUser: (val: boolean) => void;

  // OEM actions
  addOEM: (oem: Omit<OEM, 'id' | 'createdAt'>) => void;
  updateOEM: (id: string, oem: Partial<OEM>) => void;
  deleteOEM: (id: string) => void;

  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // File actions
  addFile: (file: Omit<FileEntry, 'id' | 'createdAt'>) => void;
  updateFile: (id: string, file: Partial<FileEntry>) => void;
  deleteFile: (id: string) => void;

  // Component actions
  addComponent: (comp: Omit<ComponentEntry, 'id' | 'createdAt'>) => void;
  updateComponent: (id: string, comp: Partial<ComponentEntry>) => void;
  deleteComponent: (id: string) => void;

  // Checklist actions
  addChecklist: (checklist: Omit<ChecklistEntry, 'id' | 'createdAt' | 'items'>, items: Omit<ChecklistItem, 'id' | 'checklistId'>[]) => void;
  updateChecklist: (id: string, checklist: Partial<Omit<ChecklistEntry, 'items'>>, items?: Omit<ChecklistItem, 'checklistId'>[]) => void;
  deleteChecklist: (id: string) => void;

  // Project actions
  addProject: (proj: Omit<ProjectEntry, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, proj: Partial<ProjectEntry>) => void;
  deleteProject: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Seed Data
const INITIAL_OEMS: OEM[] = [
  { id: 'oem-vw', name: 'Volkswagen', slug: 'volkswagen', organizationType: 'oem', description: 'Diretrizes e normas de embalagens para a rede de fornecedores Volkswagen.', status: 'active', createdAt: new Date().toISOString() },
  { id: 'oem-hyundai', name: 'Hyundai', slug: 'hyundai', organizationType: 'oem', description: 'Especificações técnicas da montadora Hyundai.', status: 'active', createdAt: new Date().toISOString() },
  { id: 'oem-nissan', name: 'Nissan', slug: 'nissan', organizationType: 'oem', description: 'Requisitos de embalagens Nissan.', status: 'active', createdAt: new Date().toISOString() },
  { id: 'oem-renault', name: 'Renault', slug: 'renault', organizationType: 'oem', description: 'Especificações de rack e logísticas Renault.', status: 'active', createdAt: new Date().toISOString() },
  { id: 'oem-scania', name: 'Scania', slug: 'scania', organizationType: 'oem', description: 'Caderno de encargos e embalagens pesadas Scania.', status: 'active', createdAt: new Date().toISOString() },
  { id: 'oem-gestamp', name: 'Gestamp', slug: 'gestamp', organizationType: 'tier1', description: 'Padrões logísticos da multinacional Gestamp.', status: 'active', createdAt: new Date().toISOString() },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-comp', name: 'Componentes Homologados', slug: 'componentes-homologados', description: 'Catálogo de peças, rodízios, e acoplamentos aprovados.', icon: 'Box', status: 'active', createdAt: new Date().toISOString() },
  { id: 'cat-doc', name: 'Documentação Técnica', slug: 'documentacao-tecnica', description: 'Manuais técnicos e cadernos de encargos.', icon: 'FileText', status: 'active', createdAt: new Date().toISOString() },
  { id: 'cat-normas', name: 'Normas e Padrões', slug: 'normas-e-padroes', description: 'Normas internacionais e internas de engenharia.', icon: 'ShieldCheck', status: 'active', createdAt: new Date().toISOString() },
  { id: 'cat-checks', name: 'Checklists', slug: 'checklists', description: 'Formulários dinâmicos de auditoria e liberação.', icon: 'CheckSquare', status: 'active', createdAt: new Date().toISOString() },
  { id: 'cat-proj', name: 'Projetos de Referência', slug: 'projetos-de-referencia', description: 'Projetos aprovados e modelagens 3D de referência.', icon: 'FolderKanban', status: 'active', createdAt: new Date().toISOString() },
];

const INITIAL_FILES: FileEntry[] = [
  { id: 'file-1', name: 'Suporte_Porta_Etiqueta_REV03.step', oemId: 'oem-vw', categoryId: 'cat-comp', fileType: 'STEP', revision: '03', description: 'Modelo 3D do porta-etiquetas padrão VW.', status: 'published', fileUrl: 'https://example.com/files/suporte_porta_etiqueta_rev03.step', createdAt: new Date().toISOString() },
  { id: 'file-2', name: 'VDI_2300_Embalagens_Metalicas.pdf', oemId: 'oem-vw', categoryId: 'cat-normas', fileType: 'PDF', revision: '2024', description: 'Norma alemã para estruturação de embalagens metálicas.', status: 'published', fileUrl: 'https://example.com/files/vdi_2300.pdf', createdAt: new Date().toISOString() },
  { id: 'file-3', name: 'Caderno_Encargos_Geral_2026.pdf', oemId: 'oem-vw', categoryId: 'cat-doc', fileType: 'PDF', revision: '04', description: 'Caderno de encargos gerais de embalagens VW 2026.', status: 'published', fileUrl: 'https://example.com/files/caderno_encargos_2026.pdf', createdAt: new Date().toISOString() },
  { id: 'file-4', name: 'Checklist_Inspecao_Rodizio_AGV.xlsx', oemId: 'oem-vw', categoryId: 'cat-checks', fileType: 'XLSX', revision: '01', description: 'Planilha auxiliar para checagem de rodízios compatíveis com AGV.', status: 'published', fileUrl: 'https://example.com/files/checklist_rodizio_agv.xlsx', createdAt: new Date().toISOString() },
  { id: 'file-5', name: 'Rack_Referencia_Taos_Desenho.dwg', oemId: 'oem-vw', categoryId: 'cat-proj', fileType: 'DWG', revision: '02', description: 'Desenho 2D de referência do rack metálico do VW Taos.', status: 'published', fileUrl: 'https://example.com/files/rack_taos_desenho.dwg', createdAt: new Date().toISOString() },
];

const INITIAL_COMPONENTS: ComponentEntry[] = [
  {
    id: 'comp-1',
    name: 'Rodízio Fixo Poliuretano 150mm',
    oemId: 'oem-vw',
    techCategory: 'rodizios',
    description: 'Rodízio de alta performance para fluxo rebocado (AGV).',
    application: 'Racks metálicos de autopeças pesadas.',
    revision: 'A',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80',
    stepUrl: 'https://example.com/cad/rodizio_150mm.step',
    pdfUrl: 'https://example.com/docs/rodizio_150mm.pdf',
    dwgUrl: 'https://example.com/cad/rodizio_150mm.dwg',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comp-2',
    name: 'Porta Etiqueta Metálico A4',
    oemId: 'oem-vw',
    techCategory: 'porta_etiquetas',
    description: 'Porta etiqueta com proteção acrílica contra poeira e intempéries.',
    application: 'Identificação frontal de racks e caixas paletes.',
    revision: '02',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=500',
    stepUrl: 'https://example.com/cad/porta_etiqueta_a4.step',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CHECKLISTS: ChecklistEntry[] = [
  {
    id: 'check-1',
    oemId: 'oem-vw',
    name: 'Checklist Padrão Embalagens VW',
    revision: '01',
    status: 'active',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item-1', checklistId: 'check-1', category: 'Estrutura', description: 'A estrutura tubular atende à especificação VDI 2300?', isMandatory: true, techRef: 'VDI 2300 Sec. 4', order: 1 },
      { id: 'item-2', checklistId: 'check-1', category: 'Empilhamento', description: 'Possui cantoneiras de empilhamento homologadas?', isMandatory: true, techRef: 'Norma VW 39D 120', order: 2 },
      { id: 'item-3', checklistId: 'check-1', category: 'AGV', description: 'A altura do rodízio está compatível com o sistema AGV (Mínimo 150mm)?', isMandatory: true, techRef: 'Manual Requisitos AGV', order: 3 },
      { id: 'item-4', checklistId: 'check-1', category: 'Ergonomia', description: 'A força de extração da peça é inferior a 15kg?', isMandatory: true, techRef: 'ISO 11228-1', order: 4 },
      { id: 'item-5', checklistId: 'check-1', category: 'Identificação', description: 'O porta-etiquetas está afixado em local visível no painel frontal?', isMandatory: true, techRef: 'VW GLW 2026', order: 5 },
    ]
  }
];

const INITIAL_PROJECTS: ProjectEntry[] = [
  {
    id: 'proj-1',
    name: 'Rack Metálico Taos Parachoque',
    oemId: 'oem-vw',
    packagingType: 'Rack Metálico',
    description: 'Estrutura customizada para transporte de parachoques pintados do VW Taos.',
    application: 'Transporte entre planta de pintura e linha de montagem final.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500',
    linkedDocIds: ['file-5', 'file-3'],
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage if available, otherwise use initial seed
  const [oems, setOems] = useState<OEM[]>(() => {
    const saved = localStorage.getItem('pp_oems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let changed = false;
        const migrated = parsed.map((item: any) => {
          if (!item.organizationType) {
            changed = true;
            return {
              ...item,
              organizationType: item.id === 'oem-gestamp' ? 'tier1' : 'oem'
            };
          }
          return item;
        });
        if (changed) {
          localStorage.setItem('pp_oems', JSON.stringify(migrated));
        }
        return migrated;
      } catch (e) {
        console.error('Error parsing pp_oems', e);
        return INITIAL_OEMS;
      }
    }
    return INITIAL_OEMS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('pp_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [files, setFiles] = useState<FileEntry[]>(() => {
    const saved = localStorage.getItem('pp_files');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [components, setComponents] = useState<ComponentEntry[]>(() => {
    const saved = localStorage.getItem('pp_components');
    return saved ? JSON.parse(saved) : INITIAL_COMPONENTS;
  });

  const [checklists, setChecklists] = useState<ChecklistEntry[]>(() => {
    const saved = localStorage.getItem('pp_checklists');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLISTS;
  });

  const [projects, setProjects] = useState<ProjectEntry[]>(() => {
    const saved = localStorage.getItem('pp_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
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
    localStorage.setItem('pp_oems', JSON.stringify(oems));
  }, [oems]);

  useEffect(() => {
    localStorage.setItem('pp_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pp_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('pp_components', JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    localStorage.setItem('pp_checklists', JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('pp_projects', JSON.stringify(projects));
  }, [projects]);

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

  // OEM Actions
  const addOEM = (oem: Omit<OEM, 'id' | 'createdAt'>) => {
    const newOEM: OEM = {
      ...oem,
      id: `oem-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setOems(prev => [newOEM, ...prev]);
  };

  const updateOEM = (id: string, updatedFields: Partial<OEM>) => {
    setOems(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteOEM = (id: string) => {
    setOems(prev => prev.filter(item => item.id !== id));
  };

  // Category Actions
  const addCategory = (category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setCategories(prev => [newCategory, ...prev]);
  };

  const updateCategory = (id: string, updatedFields: Partial<Category>) => {
    setCategories(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id));
  };

  // File Actions
  const addFile = (file: Omit<FileEntry, 'id' | 'createdAt'>) => {
    const newFile: FileEntry = {
      ...file,
      id: `file-${Math.random().toString(36).substr(2, 9)}`,
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

  // Component Actions
  const addComponent = (comp: Omit<ComponentEntry, 'id' | 'createdAt'>) => {
    const newComp: ComponentEntry = {
      ...comp,
      id: `comp-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setComponents(prev => [newComp, ...prev]);
  };

  const updateComponent = (id: string, updatedFields: Partial<ComponentEntry>) => {
    setComponents(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(item => item.id !== id));
  };

  // Checklist Actions
  const addChecklist = (
    checklist: Omit<ChecklistEntry, 'id' | 'createdAt' | 'items'>,
    items: Omit<ChecklistItem, 'id' | 'checklistId'>[]
  ) => {
    const newChecklistId = `check-${Math.random().toString(36).substr(2, 9)}`;
    const mappedItems: ChecklistItem[] = items.map((item, idx) => ({
      ...item,
      id: `item-${Math.random().toString(36).substr(2, 9)}-${idx}`,
      checklistId: newChecklistId,
    }));

    const newChecklist: ChecklistEntry = {
      ...checklist,
      id: newChecklistId,
      createdAt: new Date().toISOString(),
      items: mappedItems,
    };
    setChecklists(prev => [newChecklist, ...prev]);
  };

  const updateChecklist = (
    id: string,
    checklistFields: Partial<Omit<ChecklistEntry, 'items'>>,
    itemsList?: Omit<ChecklistItem, 'checklistId'>[]
  ) => {
    setChecklists(prev => prev.map(item => {
      if (item.id === id) {
        const updatedChecklist = { ...item, ...checklistFields };
        if (itemsList) {
          updatedChecklist.items = itemsList.map((itm, idx) => ({
            ...itm,
            id: itm.id || `item-${Math.random().toString(36).substr(2, 9)}-${idx}`,
            checklistId: id,
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

  // Project Actions
  const addProject = (proj: Omit<ProjectEntry, 'id' | 'createdAt'>) => {
    const newProj: ProjectEntry = {
      ...proj,
      id: `proj-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [newProj, ...prev]);
  };

  const updateProject = (id: string, updatedFields: Partial<ProjectEntry>) => {
    setProjects(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        oems,
        categories,
        files,
        components,
        checklists,
        projects,
        user,
        viewingAsUser,
        login,
        logout,
        setViewingAsUser,
        addOEM,
        updateOEM,
        deleteOEM,
        addCategory,
        updateCategory,
        deleteCategory,
        addFile,
        updateFile,
        deleteFile,
        addComponent,
        updateComponent,
        deleteComponent,
        addChecklist,
        updateChecklist,
        deleteChecklist,
        addProject,
        updateProject,
        deleteProject,
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
