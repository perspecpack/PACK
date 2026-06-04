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

export interface TechnicalArea {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  icon: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  isVisibleToUsers: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentEntry {
  id: string;
  organizationId: string;
  technicalAreaId?: string;
  name: string;
  description?: string;
  application?: string;
  revision: string;
  status: 'active' | 'inactive';
  stepFileUrl?: string;
  pdfFileUrl?: string;
  dwgFileUrl?: string;
  imageUrl?: string;
  threeDModelUrl?: string;
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
  technicalAreaId?: string;
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
  technicalAreaId?: string;
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

export interface ChecklistHeaderField {
  label: string;
  type: 'text' | 'number';
  required: boolean;
}

export interface ChecklistHeaderConfig {
  enabled: boolean;
  fields: ChecklistHeaderField[];
}

export interface ChecklistTemplate {
  id: string;
  organizationId: string;
  technicalAreaId?: string;
  name: string;
  revision: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  sections: ChecklistSection[];
  headerConfig?: ChecklistHeaderConfig;
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
  id?: string;
  email: string;
  role: 'master' | 'user';
  companyName?: string;
  companyLogoUrl?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  roleTitle: string;
  phone: string;
  whatsapp: string;
  corporateEmail: string;
  companyName: string;
  cnpj: string;
  companyWebsite: string;
  companyLogoUrl: string;
  city: string;
  state: string;
  country: string;
  companyType: string;
  companyTypeOther?: string;
  mainInterests: string[];
  mainInterestOther?: string;
  profileCompleted: boolean;
  accountStatus: 'active' | 'pending' | 'blocked';
  planType: 'free' | 'premium';
  premiumUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadLog {
  id: string;
  user_id: string;
  organization_id: string;
  technicalAreaId?: string;
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

export interface SupportRequest {
  id: string;
  user_id: string | null;
  subject: string;
  category: string;
  message: string;
  status: 'novo' | 'em_analise' | 'em_atendimento' | 'concluido' | 'arquivado';
  response?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
  // For master UI joining
  user_email?: string;
  user_company_name?: string;
}

