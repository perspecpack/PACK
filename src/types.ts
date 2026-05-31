export type OrganizationType = 
  | 'oem' 
  | 'component_manufacturer' 
  | 'packaging_supplier' 
  | 'packaging_manufacturer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  logoUrl?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Legacy aliases
  oemId?: string;
}

export type ModuleType =
  | 'components'
  | 'documentation'
  | 'standards'
  | 'checklists'
  | 'reference_projects'
  | 'cad_library'
  | 'procedures';

export interface OrganizationModule {
  id: string;
  organizationId: string;
  moduleType: ModuleType;
  enabled: boolean;
  createdAt: string;
}

export interface ComponentEntry {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  application?: string;
  revision: string;
  status: 'active' | 'inactive';
  stepFileUrl?: string;
  pdfFileUrl?: string;
  dwgFileUrl?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy aliases
  oemId?: string;
  techCategory?: string;
  stepUrl?: string;
  pdfUrl?: string;
  dwgUrl?: string;
}

export type DocumentType =
  | 'Caderno de Encargos'
  | 'Manual'
  | 'Norma'
  | 'Procedimento'
  | 'Apresentação'
  | 'Boletim Técnico';

export interface DocumentEntry {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  revision: string;
  status: 'active' | 'inactive';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StandardEntry {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  revision: string;
  status: 'active' | 'inactive';
  referenceDocument?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  category: 
    | 'Estrutura'
    | 'Empilhamento'
    | 'Ergonomia'
    | 'AGV'
    | 'Identificação'
    | 'Segurança'
    | 'Logística'
    | 'Documentação';
  description: string;
  required: boolean;
  reference?: string;
  sortOrder: number;
  createdAt: string;
  // Legacy aliases
  order?: number;
  isMandatory?: boolean;
  techRef?: string;
}

export interface ChecklistEntry {
  id: string;
  organizationId: string;
  name: string;
  revision: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  // Legacy aliases
  oemId?: string;
}

export interface ReferenceProjectEntry {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  application?: string;
  imageUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Legacy aliases
  oemId?: string;
  packagingType?: string;
  linkedDocIds?: string[];
}

export interface User {
  email: string;
  role: 'master' | 'user';
}
