export type ComponentCategory = 
  | 'porta_etiquetas' 
  | 'rodizios' 
  | 'travas_canhao' 
  | 'engates' 
  | 'batentes' 
  | 'agv' 
  | 'olhais' 
  | 'estruturas';

export type DocumentCategory = 
  | 'caderno_encargos' 
  | 'normas' 
  | 'boletins' 
  | 'procedimentos' 
  | 'apresentacoes';

export type ProjectStatus = 'in_development' | 'in_validation' | 'compliant' | 'rejected';

export type OrganizationType = 
  | 'oem' 
  | 'tier1' 
  | 'component_manufacturer' 
  | 'industrial_client' 
  | 'internal_standard';

export interface OEM {
  id: string;
  name: string;
  organizationType: OrganizationType;
  logo_url?: string;
  created_at: string;
}

export interface OEMComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  oem_id: string;
  description: string;
  step_url?: string;
  pdf_url?: string;
  dwg_url?: string;
  image_url?: string;
  revision: string;
  status: 'active' | 'obsolete' | 'in_review';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  oem_id: string;
  responsible_id: string;
  status: ProjectStatus;
  checklist_id: string;
  created_at: string;
}
