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

export type StandardType =
  | 'Norma de Ergonomia'
  | 'Diretriz de AGV'
  | 'Norma de Empilhamento'
  | 'Padrão de Empilhamento'
  | 'Padrão de Dispositivo'
  | 'Norma de Segurança'
  | 'Norma de Embalagem'
  | 'Outros';

export interface StandardEntry {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  standardType?: StandardType;
  revision: string;
  status: 'active' | 'inactive';
  referenceDocument?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistCriterion {
  id: string;
  checklistSectionId: string;
  code: string;
  description: string;
  reference?: string;
  responseType: 'conformance' | 'yes_no' | 'free_text' | 'number' | 'evidence';
  required: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSection {
  id: string;
  checklistTemplateId: string;
  title: string;
  description?: string;
  sortOrder: number;
  criteria: ChecklistCriterion[];
}

export interface ChecklistTemplate {
  id: string;
  organizationId: string;
  name: string;
  revision: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  sections: ChecklistSection[];
  // For backwards compatibility in lists
  items?: any[];
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

export interface DownloadLog {
  id: string;
  user_id: string;
  organization_id: string;
  content_type: string;
  content_id: string;
  file_name: string;
  download_date: string;
}

export interface UploadLog {
  id: string;
  user_id: string;
  organization_id: string;
  content_type: string;
  file_name: string;
  upload_date: string;
}

export interface PageAccessLog {
  id: string;
  user_id: string;
  page: string;
  access_date: string;
}

