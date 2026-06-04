import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileUploadField } from '@/components/ui/FileUploadField';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  HardDrive, 
  FileText, 
  Image as ImageIcon,
  CheckSquare,
  ShieldCheck,
  FolderKanban,
  FileDown,
  Paperclip
} from 'lucide-react';
import { ModuleType, DocumentType, StandardType, ChecklistSection, ChecklistCriterion, ChecklistHeaderField } from '@/src/types';

const DEFAULT_SECTIONS = [
  { title: 'Identificação do Projeto', sortOrder: 1 },
  { title: 'Estrutura da Embalagem', sortOrder: 2 },
  { title: 'Componentes Homologados', sortOrder: 3 },
  { title: 'Empilhamento', sortOrder: 4 },
  { title: 'Movimentação e Logística', sortOrder: 5 },
  { title: 'Ergonomia', sortOrder: 6 },
  { title: 'Identificação e Etiquetagem', sortOrder: 7 },
  { title: 'Segurança', sortOrder: 8 },
  { title: 'Documentação Técnica', sortOrder: 9 },
  { title: 'Aprovação Final', sortOrder: 10 }
];

const RESPONSE_TYPES = [
  { value: 'conformance', label: 'Conforme/Não Conforme/N.A.' },
  { value: 'yes_no', label: 'Sim/Não/N.A.' },
  { value: 'free_text', label: 'Texto Livre' },
  { value: 'number', label: 'Numérico' },
  { value: 'evidence', label: 'Evidência (Foto/Arquivo)' }
];

const DOCUMENT_TYPES: DocumentType[] = [
  'Caderno de Encargos',
  'Manual',
  'Norma',
  'Procedimento',
  'Apresentação',
  'Boletim Técnico'
];

const STANDARD_TYPES: StandardType[] = [
  'Norma de Embalagem',
  'Diretriz de AGV',
  'Norma de Ergonomia',
  'Padrão de Empilhamento',
  'Norma de Segurança',
  'Outros'
];

export default function ModuleContentManager() {
  const { orgId, techAreaId, moduleType } = useParams<{ orgId: string; techAreaId: string; moduleType: string }>();
  const navigate = useNavigate();
  
  const { 
    organizations,
    technicalAreas,
    components, addComponent, updateComponent, deleteComponent,
    documents, addDocument, updateDocument, deleteDocument,
    standards, addStandard, updateStandard, deleteStandard,
    checklists, addChecklist, updateChecklist, deleteChecklist,
    referenceProjects, addReferenceProject, updateReferenceProject, deleteReferenceProject,
    logUpload,
    logPageAccess
  } = useApp();

  const org = organizations.find(o => o.id === orgId);
  const techArea = technicalAreas.find(t => t.id === techAreaId);

  // Log page access on component mount/update
  React.useEffect(() => {
    if (org && moduleType) {
      logPageAccess(`Master - Módulo: ${getModuleTitle()} (${org.name} - ${techArea?.name || 'Geral'})`);
    }
  }, [orgId, techAreaId, moduleType, logPageAccess, techArea]);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Common Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [revision, setRevision] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Component Specific States
  const [application, setApplication] = useState('');
  const [stepFileUrl, setStepFileUrl] = useState('');
  const [pdfFileUrl, setPdfFileUrl] = useState('');
  const [dwgFileUrl, setDwgFileUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [threeDModelUrl, setThreeDModelUrl] = useState('');

  // Document / Standard / Checklist Shared File States
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileTypeState, setFileTypeState] = useState('');

  // Document Specific States
  const [documentType, setDocumentType] = useState<DocumentType>('Manual');

  // Standard Specific States
  const [referenceDocument, setReferenceDocument] = useState('');
  const [standardType, setStandardType] = useState<StandardType>('Norma de Embalagem');

  // Checklist Specific States
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [editingCriterionIndex, setEditingCriterionIndex] = useState<number | null>(null);
  const [hasHeader, setHasHeader] = useState(false);
  const [headerFields, setHeaderFields] = useState<ChecklistHeaderField[]>([]);
  
  // Local states for editing a criterion
  const [critCode, setCritCode] = useState('');
  const [critDescription, setCritDescription] = useState('');
  const [critReference, setCritReference] = useState('');
  const [critResponseType, setCritResponseType] = useState<'conformance' | 'yes_no' | 'free_text' | 'number' | 'evidence'>('conformance');
  const [critRequired, setCritRequired] = useState(true);
  const [critSortOrder, setCritSortOrder] = useState(1);

  // Project Specific States
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState('');

  if (!org) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-[600px] mx-auto space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg">Organização não encontrada</h3>
        <Button onClick={() => navigate('/master/content')} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
          Voltar para Conteúdo
        </Button>
      </div>
    );
  }

  // Get module records
  const getRecords = () => {
    switch (moduleType) {
      case 'components':
        return components.filter(c => c.organizationId === orgId && c.technicalAreaId === techAreaId);
      case 'documentation':
        return documents.filter(d => d.organizationId === orgId && d.technicalAreaId === techAreaId);
      case 'standards':
        return standards.filter(s => s.organizationId === orgId && s.technicalAreaId === techAreaId);
      case 'checklists':
        return checklists.filter(c => c.organizationId === orgId && c.technicalAreaId === techAreaId);
      case 'reference_projects':
        return referenceProjects.filter(p => p.organizationId === orgId);
      default:
        return [];
    }
  };

  const records = getRecords();

  const getModuleTitle = () => {
    switch (moduleType) {
      case 'components': return 'Componentes Homologados';
      case 'documentation': return 'Caderno de Encargos';
      case 'standards': return 'Documentação Técnica';
      case 'checklists': return 'Checklist de Validação';
      case 'reference_projects': return 'Projetos de Referência';
      default: return 'Gerenciador';
    }
  };

  // Open modals
  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setRevision(moduleType === 'checklists' ? '01' : 'A');
    setStatus('active');
    
    // reset specific
    setApplication('');
    setStepFileUrl('');
    setPdfFileUrl('');
    setDwgFileUrl('');
    setImageUrl('');
    setThreeDModelUrl('');
    setDocumentType('Manual');
    setStandardType('Norma de Embalagem');
    setFileUrl('');
    setFileName('');
    setFileTypeState('');
    setReferenceDocument('');
    setAttachmentUrl('');
    setAttachmentName('');
    setAttachmentType('');
    
    // Pre-populate with default 10 sections
    if (moduleType === 'checklists') {
      setHasHeader(true);
      setHeaderFields([
        { label: 'Número da Peça / Part Number', type: 'text', required: true },
        { label: 'Nome da Peça', type: 'text', required: true },
        { label: 'Nome do Projeto', type: 'text', required: false }
      ]);
    } else {
      setHasHeader(false);
      setHeaderFields([]);
    }

    setSections(
      DEFAULT_SECTIONS.map((sec, idx) => ({
        id: '',
        checklistTemplateId: '',
        title: sec.title,
        sortOrder: sec.sortOrder,
        criteria: []
      }))
    );
    setActiveSectionIndex(0);
    setIsAddingCriterion(false);
    setEditingCriterionIndex(null);

    setIsModalOpen(true);
  };

  const openEditModal = (rec: any) => {
    setEditingId(rec.id);
    setName(rec.name || rec.title || '');
    setDescription(rec.description || '');
    setRevision(rec.revision || '');
    setStatus(rec.status || 'active');
    
    // specific
    setApplication(rec.application || '');
    setStepFileUrl(rec.stepFileUrl || '');
    setPdfFileUrl(rec.pdfFileUrl || '');
    setDwgFileUrl(rec.dwgFileUrl || '');
    setImageUrl(rec.imageUrl || '');
    setThreeDModelUrl(rec.threeDModelUrl || '');
    setDocumentType(rec.documentType || 'Manual');
    setStandardType(rec.standardType || 'Norma de Embalagem');
    setFileUrl(rec.fileUrl || '');
    setFileName(rec.fileName || '');
    setFileTypeState(rec.fileType || '');
    setReferenceDocument(rec.referenceDocument || '');
    setAttachmentUrl(rec.attachmentUrl || '');
    setAttachmentName(rec.attachmentName || '');
    setAttachmentType(rec.attachmentType || '');
    
    if (moduleType === 'checklists') {
      setHasHeader(rec.headerConfig?.enabled || false);
      setHeaderFields(rec.headerConfig?.fields || []);
    } else {
      setHasHeader(false);
      setHeaderFields([]);
    }

    // Deep copy checklists sections & criteria
    setSections(rec.sections ? JSON.parse(JSON.stringify(rec.sections)) : []);
    setActiveSectionIndex(0);
    setIsAddingCriterion(false);
    setEditingCriterionIndex(null);

    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (moduleType === 'components') {
      const componentData = {
        organizationId: orgId!,
        technicalAreaId: techAreaId!,
        name,
        description: description || undefined,
        application: application || undefined,
        revision,
        status,
        stepFileUrl: stepFileUrl || undefined,
        pdfFileUrl: pdfFileUrl || undefined,
        dwgFileUrl: dwgFileUrl || undefined,
        imageUrl: imageUrl || undefined,
        threeDModelUrl: threeDModelUrl || undefined
      };

      if (editingId) {
        updateComponent(editingId, componentData);
      } else {
        addComponent(componentData);
      }
    } else if (moduleType === 'documentation') {
      const docData = {
        organizationId: orgId!,
        technicalAreaId: techAreaId!,
        title: name,
        description: description || undefined,
        documentType,
        revision,
        status,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileType: fileTypeState || undefined
      };

      if (editingId) {
        updateDocument(editingId, docData);
      } else {
        addDocument(docData);
      }
    } else if (moduleType === 'standards') {
      const stdData = {
        organizationId: orgId!,
        technicalAreaId: techAreaId!,
        title: name,
        description: description || undefined,
        standardType,
        revision,
        status,
        referenceDocument: referenceDocument || undefined,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileType: fileTypeState || undefined
      };

      if (editingId) {
        updateStandard(editingId, stdData);
      } else {
        addStandard(stdData);
      }
    } else if (moduleType === 'checklists') {
      const chkData = {
        organizationId: orgId!,
        technicalAreaId: techAreaId!,
        name,
        revision,
        status,
        headerConfig: {
          enabled: hasHeader,
          fields: hasHeader ? headerFields.filter(f => f.label.trim() !== '') : []
        }
      };

      if (editingId) {
        updateChecklist(editingId, chkData, sections);
      } else {
        addChecklist(chkData, sections);
      }
    } else if (moduleType === 'reference_projects') {
      const projData = {
        organizationId: orgId!,
        name,
        description: description || undefined,
        application: application || undefined,
        imageUrl: imageUrl || undefined,
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
        attachmentType: attachmentType || undefined,
        status
      };

      if (editingId) {
        updateReferenceProject(editingId, projData);
      } else {
        addReferenceProject(projData);
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingId) return;

    if (moduleType === 'components') deleteComponent(deletingId);
    else if (moduleType === 'documentation') deleteDocument(deletingId);
    else if (moduleType === 'standards') deleteStandard(deletingId);
    else if (moduleType === 'checklists') deleteChecklist(deletingId);
    else if (moduleType === 'reference_projects') deleteReferenceProject(deletingId);

    setDeletingId(null);
  };

  // Dynamic Checklist Criteria Handlers
  const handleSaveCriterion = () => {
    if (!critCode.trim() || !critDescription.trim()) return;

    const newCriterion: ChecklistCriterion = {
      id: editingCriterionIndex !== null && sections[activeSectionIndex]?.criteria[editingCriterionIndex]?.id 
        ? sections[activeSectionIndex].criteria[editingCriterionIndex].id 
        : '',
      checklistSectionId: sections[activeSectionIndex]?.id || '',
      code: critCode.trim(),
      description: critDescription.trim(),
      reference: critReference.trim() || undefined,
      responseType: critResponseType,
      required: critRequired,
      sortOrder: critSortOrder || ((sections[activeSectionIndex]?.criteria?.length || 0) + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSections(prev => prev.map((sec, idx) => {
      if (idx === activeSectionIndex) {
        let updatedCriteria = [...(sec.criteria || [])];
        if (editingCriterionIndex !== null) {
          updatedCriteria[editingCriterionIndex] = newCriterion;
        } else {
          updatedCriteria.push(newCriterion);
        }
        // Sort criteria by sortOrder
        updatedCriteria.sort((a, b) => a.sortOrder - b.sortOrder);
        return { ...sec, criteria: updatedCriteria };
      }
      return sec;
    }));

    setIsAddingCriterion(false);
    setEditingCriterionIndex(null);
  };

  const handleDeleteCriterion = (cIdx: number) => {
    setSections(prev => prev.map((sec, idx) => {
      if (idx === activeSectionIndex) {
        const updatedCriteria = sec.criteria.filter((_, i) => i !== cIdx);
        return { ...sec, criteria: updatedCriteria };
      }
      return sec;
    }));
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto font-sans">
      {/* Back Link */}
      <Link 
        to={`/master/content/${orgId}`} 
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para {org.name} {techArea ? `(${techArea.name})` : ''}
      </Link>

      {/* Header Panel */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-xs font-bold text-[#00F59B] uppercase tracking-wider">
            {org.name} {techArea ? `| ${techArea.icon} ${techArea.name}` : ''}
          </span>
          <h2 className="text-[26px] font-extrabold tracking-tight mt-1">{getModuleTitle()}</h2>
          <p className="text-slate-300 mt-2 text-[14px] max-w-[650px] leading-relaxed">
            Gerencie os registros do módulo específico para esta área técnica.
          </p>
        </div>
        <Button 
          onClick={openAddModal}
          className="relative z-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Adicionar Registro
        </Button>
      </div>

      {/* Polymorphic Table List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              {/* Header Columns based on Module Type */}
              {moduleType === 'components' && (
                <>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[80px]">Imagem</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Nome</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Descrição / Aplicação</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[100px]">Revisão</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Arquivos CAD</TableHead>
                </>
              )}
              {moduleType === 'documentation' && (
                <>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Título / Tipo</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Descrição</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[100px]">Revisão</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Anexo</TableHead>
                </>
              )}
              {moduleType === 'standards' && (
                <>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Título / Tipo</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Doc. de Referência</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[100px]">Revisão</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Anexo</TableHead>
                </>
              )}
              {moduleType === 'checklists' && (
                <>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Nome do Checklist</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[150px]">Qtd. Requisitos</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[120px]">Revisão</TableHead>
                </>
              )}
              {moduleType === 'reference_projects' && (
                <>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[80px]">Imagem</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Nome do Projeto</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Aplicação / Uso</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Anexos de Projeto</TableHead>
                </>
              )}
              <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-bold text-slate-600 uppercase pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum registro cadastrado para este módulo nesta organização.
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => (
                <TableRow key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  
                  {/* Row content mapping */}
                  {moduleType === 'components' && (
                    <>
                      <TableCell className="align-middle">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          {rec.imageUrl ? (
                            <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <HardDrive className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle font-bold text-[13px] text-slate-900">
                        {rec.name}
                      </TableCell>
                      <TableCell className="align-middle text-[13px] text-slate-500 max-w-[300px] truncate">
                        {rec.description || rec.application || <span className="text-slate-300 italic">Nenhuma</span>}
                      </TableCell>
                      <TableCell className="align-middle font-mono font-bold text-[12px] text-slate-700">
                        {rec.revision}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex gap-1.5">
                          {rec.stepFileUrl && <a href={rec.stepFileUrl} target="_blank" rel="noreferrer" className="bg-blue-50 border border-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded font-bold font-mono">STEP</a>}
                          {rec.pdfFileUrl && <a href={rec.pdfFileUrl} target="_blank" rel="noreferrer" className="bg-red-50 border border-red-100 text-red-700 text-[9px] px-1 py-0.5 rounded font-bold font-mono">PDF</a>}
                          {rec.dwgFileUrl && <a href={rec.dwgFileUrl} target="_blank" rel="noreferrer" className="bg-amber-50 border border-amber-100 text-amber-700 text-[9px] px-1 py-0.5 rounded font-bold font-mono">DWG</a>}
                          {!rec.stepFileUrl && !rec.pdfFileUrl && !rec.dwgFileUrl && <span className="text-xs text-slate-400 italic">Nenhum</span>}
                        </div>
                      </TableCell>
                    </>
                  )}

                  {moduleType === 'documentation' && (
                    <>
                      <TableCell className="align-middle">
                        <div className="font-bold text-[13px] text-slate-900">{rec.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">{rec.documentType}</div>
                      </TableCell>
                      <TableCell className="align-middle text-[13px] text-slate-500 max-w-[300px] truncate">
                        {rec.description || <span className="text-slate-300 italic">Nenhuma</span>}
                      </TableCell>
                      <TableCell className="align-middle font-mono font-bold text-[12px] text-slate-700">
                        {rec.revision}
                      </TableCell>
                      <TableCell className="align-middle">
                        {rec.fileUrl ? (
                          <a href={rec.fileUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 flex items-center gap-1.5 font-bold text-[12px] bg-teal-50 border border-teal-100 px-2 py-1 rounded-md w-fit">
                            <FileDown className="w-3.5 h-3.5" /> 
                            <span className="max-w-[120px] truncate">{rec.fileName || 'Baixar'}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Nenhum</span>
                        )}
                      </TableCell>
                    </>
                  )}

                  {moduleType === 'standards' && (
                    <>
                      <TableCell className="align-middle">
                        <div className="font-bold text-[13px] text-slate-900">{rec.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">{rec.standardType || 'Norma de Embalagem'}</div>
                      </TableCell>
                      <TableCell className="align-middle text-[13px] text-slate-600 font-medium">
                        {rec.referenceDocument || <span className="text-slate-400 italic">-</span>}
                      </TableCell>
                      <TableCell className="align-middle font-mono font-bold text-[12px] text-slate-700">
                        {rec.revision}
                      </TableCell>
                      <TableCell className="align-middle">
                        {rec.fileUrl ? (
                          <a href={rec.fileUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 flex items-center gap-1.5 font-bold text-[12px] bg-teal-50 border border-teal-100 px-2 py-1 rounded-md w-fit">
                            <FileDown className="w-3.5 h-3.5" /> 
                            <span className="max-w-[120px] truncate">{rec.fileName || 'Baixar'}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Nenhum</span>
                        )}
                      </TableCell>
                    </>
                  )}

                  {moduleType === 'checklists' && (
                    <>
                      <TableCell className="align-middle font-bold text-[13px] text-slate-900">
                        {rec.name}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="bg-teal-50 border border-teal-100 text-teal-700 font-bold px-2.5 py-0.5 rounded text-[11px]">
                          {rec.sections?.reduce((sum: number, s: any) => sum + (s.criteria?.length || 0), 0) || 0} itens
                        </span>
                      </TableCell>
                      <TableCell className="align-middle font-mono font-bold text-[12px] text-slate-700">
                        {rec.revision}
                      </TableCell>
                    </>
                  )}

                  {moduleType === 'reference_projects' && (
                    <>
                      <TableCell className="align-middle">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          {rec.imageUrl ? (
                            <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <FolderKanban className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle font-bold text-[13px] text-slate-900">
                        {rec.name}
                      </TableCell>
                      <TableCell className="align-middle text-[13px] text-slate-500 max-w-[300px] truncate">
                        {rec.description || rec.application || <span className="text-slate-300 italic">Nenhuma</span>}
                      </TableCell>
                      <TableCell className="align-middle">
                        {rec.attachmentUrl ? (
                          <a href={rec.attachmentUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-bold text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono truncate max-w-[150px]">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{rec.attachmentName || 'Anexo'}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Nenhum</span>
                        )}
                      </TableCell>
                    </>
                  )}

                  {/* Common Status and Actions */}
                  <TableCell className="align-middle">
                    <Badge className={rec.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold'
                    }>
                      {rec.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(rec)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(rec.id)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit polymorphic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white border border-slate-200 rounded-xl shadow-xl w-full ${moduleType === 'checklists' ? 'max-w-[1100px]' : 'max-w-[650px]'} overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">
                {editingId ? 'Editar Registro' : `Novo Registro - ${getModuleTitle()}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Form Content based on Module Type */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Title/Name field */}
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-slate-700">
                    {moduleType === 'documentation' || moduleType === 'standards' ? 'Título do Registro' : 'Nome'}
                  </Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Rodízio 150mm, Caderno de Encargos Geral..."
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                {/* Technical Area Info (Read-only) */}
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Área Técnica Escopada</Label>
                  <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 flex items-center font-bold">
                    {techArea ? `${techArea.icon} ${techArea.name}` : 'Nenhuma'}
                  </div>
                </div>

                {/* Revision and Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Revisão</Label>
                  <Input 
                    value={revision} 
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="Ex: A, 01, Rev. B"
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Status</Label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                {/* Module-Specific Fields with Supabase Storage File Uploads */}
                {moduleType === 'components' && (
                  <>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Aplicação Recomendada</Label>
                      <Input 
                        value={application} 
                        onChange={(e) => setApplication(e.target.value)}
                        placeholder="Ex: Estruturas de racks móveis, rebocadores" 
                        className="h-10 text-[14px] rounded-lg border-slate-300"
                      />
                    </div>
                    
                    {/* Component Image Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Imagem do Componente (.png, .jpg, .webp)"
                        acceptedTypes="image/png,image/jpeg,image/webp"
                        bucket="components"
                        currentFileUrl={imageUrl}
                        orgSlug={org.slug}
                        moduleType="components"
                        onUploadComplete={(url) => {
                          setImageUrl(url);
                          logUpload(orgId!, 'Componente (Imagem)', url.split('/').pop() || 'imagem.png');
                        }}
                        onRemove={() => setImageUrl('')}
                      />
                    </div>

                    {/* CAD File STEP Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Arquivo STEP (.step, .stp)"
                        acceptedTypes=".step,.stp"
                        bucket="components"
                        currentFileUrl={stepFileUrl}
                        orgSlug={org.slug}
                        moduleType="components"
                        onUploadComplete={(url) => {
                          setStepFileUrl(url);
                          logUpload(orgId!, 'Componente (STEP)', url.split('/').pop() || 'arquivo.step');
                        }}
                        onRemove={() => setStepFileUrl('')}
                      />
                    </div>

                    {/* PDF File Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Arquivo PDF (.pdf)"
                        acceptedTypes="application/pdf"
                        bucket="components"
                        currentFileUrl={pdfFileUrl}
                        orgSlug={org.slug}
                        moduleType="components"
                        onUploadComplete={(url) => {
                          setPdfFileUrl(url);
                          logUpload(orgId!, 'Componente (PDF)', url.split('/').pop() || 'arquivo.pdf');
                        }}
                        onRemove={() => setPdfFileUrl('')}
                      />
                    </div>

                    {/* DWG File Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Arquivo DWG (.dwg)"
                        acceptedTypes=".dwg"
                        bucket="components"
                        currentFileUrl={dwgFileUrl}
                        orgSlug={org.slug}
                        moduleType="components"
                        onUploadComplete={(url) => {
                          setDwgFileUrl(url);
                          logUpload(orgId!, 'Componente (DWG)', url.split('/').pop() || 'arquivo.dwg');
                        }}
                        onRemove={() => setDwgFileUrl('')}
                      />
                    </div>

                    {/* 3D Model Upload for Visualization */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Modelo 3D para Visualização (.glb, .gltf, .stl) - Visualização interativa (não disponível para download)"
                        acceptedTypes=".glb,.gltf,.stl"
                        bucket="components"
                        currentFileUrl={threeDModelUrl}
                        orgSlug={org.slug}
                        moduleType="components"
                        onUploadComplete={(url) => {
                          setThreeDModelUrl(url);
                          logUpload(orgId!, 'Componente (Modelo 3D)', url.split('/').pop() || 'modelo.glb');
                        }}
                        onRemove={() => setThreeDModelUrl('')}
                      />
                    </div>
                  </>
                )}

                {moduleType === 'documentation' && (
                  <>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Tipo de Documento</Label>
                      <select 
                        value={documentType} 
                        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                      >
                        {DOCUMENT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Document Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Arquivo Principal (.pdf, .docx, .xlsx, .zip)"
                        acceptedTypes="application/pdf,.docx,.xlsx,application/zip,application/x-zip-compressed"
                        bucket="documents"
                        currentFileUrl={fileUrl}
                        orgSlug={org.slug}
                        moduleType="documentation"
                        onUploadComplete={(url, name, ext) => {
                          setFileUrl(url);
                          setFileName(name);
                          setFileTypeState(ext);
                          logUpload(orgId!, 'Documentação Técnica', name);
                        }}
                        onRemove={() => {
                          setFileUrl('');
                          setFileName('');
                          setFileTypeState('');
                        }}
                      />
                    </div>
                  </>
                )}

                {moduleType === 'standards' && (
                  <>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Tipo de Documentação Técnica</Label>
                      <select 
                        value={standardType} 
                        onChange={(e) => setStandardType(e.target.value as StandardType)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                      >
                        {STANDARD_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Documento de Referência</Label>
                      <Input 
                        value={referenceDocument} 
                        onChange={(e) => setReferenceDocument(e.target.value)}
                        placeholder="Ex: ISO 11228-1, HMC-STD-8" 
                        className="h-10 text-[14px] rounded-lg border-slate-300"
                      />
                    </div>

                    {/* Standard Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Arquivo do Padrão (.pdf, .docx, .xlsx, .zip)"
                        acceptedTypes="application/pdf,.docx,.xlsx,application/zip,application/x-zip-compressed"
                        bucket="standards"
                        currentFileUrl={fileUrl}
                        orgSlug={org.slug}
                        moduleType="standards"
                        onUploadComplete={(url, name, ext) => {
                          setFileUrl(url);
                          setFileName(name);
                          setFileTypeState(ext);
                          logUpload(orgId!, 'Normas e Padrões', name);
                        }}
                        onRemove={() => {
                          setFileUrl('');
                          setFileName('');
                          setFileTypeState('');
                        }}
                      />
                    </div>
                  </>
                )}



                {moduleType === 'reference_projects' && (
                  <>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Aplicação / Uso do Projeto</Label>
                      <Input 
                        value={application} 
                        onChange={(e) => setApplication(e.target.value)}
                        placeholder="Ex: Transporte de parachoques pintados, Skid de motores" 
                        className="h-10 text-[14px] rounded-lg border-slate-300"
                      />
                    </div>
                    
                    {/* Project Image Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Imagem Principal (.png, .jpg, .webp)"
                        acceptedTypes="image/png,image/jpeg,image/webp"
                        bucket="reference-projects"
                        currentFileUrl={imageUrl}
                        orgSlug={org.slug}
                        moduleType="reference_projects"
                        onUploadComplete={(url) => {
                          setImageUrl(url);
                          logUpload(orgId!, 'Projeto de Referência (Imagem)', url.split('/').pop() || 'imagem.png');
                        }}
                        onRemove={() => setImageUrl('')}
                      />
                    </div>

                    {/* Project Attachment File Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Arquivos Anexos (.step, .pdf, .dwg, .zip)"
                        acceptedTypes=".step,.stp,application/pdf,.dwg,application/zip,application/x-zip-compressed"
                        bucket="reference-projects"
                        currentFileUrl={attachmentUrl}
                        orgSlug={org.slug}
                        moduleType="reference_projects"
                        onUploadComplete={(url, name, ext) => {
                          setAttachmentUrl(url);
                          setAttachmentName(name);
                          setAttachmentType(ext);
                          logUpload(orgId!, 'Projeto de Referência (Anexo)', name);
                        }}
                        onRemove={() => {
                          setAttachmentUrl('');
                          setAttachmentName('');
                          setAttachmentType('');
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Description (Common, except checklists) */}
                {moduleType !== 'checklists' && (
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-bold text-slate-700">Descrição</Label>
                    <Textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalhes adicionais, notas, especificações de projeto..." 
                      className="text-[14px] rounded-lg border-slate-300 min-h-[60px]" 
                    />
                  </div>
                )}

                {/* Configuração do Cabeçalho do Projeto */}
                {moduleType === 'checklists' && (
                  <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-slate-800">Cabeçalho do Projeto</Label>
                        <p className="text-[11px] text-slate-500">
                          Habilite para exigir que o usuário preencha dados como Part Number e Nome do Projeto ao executar a validação.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <input
                          type="checkbox"
                          id="chk-has-header"
                          checked={hasHeader}
                          onChange={(e) => {
                            setHasHeader(e.target.checked);
                            if (e.target.checked && headerFields.length === 0) {
                              setHeaderFields([
                                { label: 'Número da Peça / Part Number', type: 'text', required: true },
                                { label: 'Nome da Peça', type: 'text', required: true },
                                { label: 'Nome do Projeto', type: 'text', required: false }
                              ]);
                            }
                          }}
                          className="rounded border-slate-350 text-teal-600 w-4 h-4 focus:ring-teal-500 cursor-pointer"
                        />
                        <Label htmlFor="chk-has-header" className="text-[12.5px] font-bold text-slate-700 cursor-pointer select-none">
                          Habilitar Cabeçalho
                        </Label>
                      </div>
                    </div>

                    {hasHeader && (
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campos do Cabeçalho</span>
                        
                        <div className="grid grid-cols-1 gap-2.5">
                          {headerFields.map((field, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="flex-1">
                                <Input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => {
                                    const newFields = [...headerFields];
                                    newFields[idx].label = e.target.value;
                                    setHeaderFields(newFields);
                                  }}
                                  placeholder="Nome do Campo (ex: Número da Peça)"
                                  className="h-8.5 text-[12.5px] border-slate-300 focus:ring-teal-500 rounded-lg shadow-sm"
                                  required
                                />
                              </div>
                              
                              <div className="w-28 shrink-0">
                                <select
                                  value={field.type}
                                  onChange={(e) => {
                                    const newFields = [...headerFields];
                                    newFields[idx].type = e.target.value as 'text' | 'number';
                                    setHeaderFields(newFields);
                                  }}
                                  className="w-full h-8.5 px-2 bg-white border border-slate-300 rounded-lg text-[12px] text-slate-800 focus:ring-teal-500 shadow-sm font-semibold"
                                >
                                  <option value="text">Texto</option>
                                  <option value="number">Número</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                                <input
                                  type="checkbox"
                                  id={`field-req-${idx}`}
                                  checked={field.required}
                                  onChange={(e) => {
                                    const newFields = [...headerFields];
                                    newFields[idx].required = e.target.checked;
                                    setHeaderFields(newFields);
                                  }}
                                  className="rounded border-slate-300 text-teal-600 w-3.5 h-3.5 focus:ring-teal-500 cursor-pointer"
                                />
                                <Label htmlFor={`field-req-${idx}`} className="text-[11.5px] font-bold text-slate-700 cursor-pointer select-none">
                                  Obrigatório
                                </Label>
                              </div>

                              <Button
                                type="button"
                                onClick={() => {
                                  setHeaderFields(headerFields.filter((_, fIdx) => fIdx !== idx));
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8.5 w-8.5 p-0 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          onClick={() => {
                            setHeaderFields([...headerFields, { label: '', type: 'text', required: false }]);
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold h-8.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-sm mt-1"
                        >
                          <Plus className="w-4 h-4 text-slate-550" /> Adicionar Campo ao Cabeçalho
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist Criteria dynamic list */}
                {moduleType === 'checklists' && (
                  <div className="col-span-2 border-t border-slate-100 pt-4 mt-2 space-y-4">
                    <div className="grid grid-cols-12 gap-6 min-h-[500px]">
                      {/* Left Panel: Sections List */}
                      <div className="col-span-4 border-r border-slate-200 pr-4 space-y-2">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Seções do Checklist</Label>
                        <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                          {sections.map((sec, idx) => {
                            const isSelected = activeSectionIndex === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setActiveSectionIndex(idx);
                                  setEditingCriterionIndex(null);
                                  setIsAddingCriterion(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-between ${
                                  isSelected 
                                    ? 'bg-teal-50 text-teal-800 border-l-4 border-teal-600 font-semibold shadow-sm' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                                }`}
                              >
                                <span className="truncate pr-2">{idx + 1}. {sec.title}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isSelected ? 'bg-teal-200 text-teal-900' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {sec.criteria?.length || 0}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Panel: Criteria List / Edit for the selected Section */}
                      <div className="col-span-8 space-y-4">
                        {activeSectionIndex !== null && sections[activeSectionIndex] && (
                          <>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div>
                                <h4 className="text-[14px] font-extrabold text-slate-800">
                                  {activeSectionIndex + 1}. {sections[activeSectionIndex].title}
                                </h4>
                                <p className="text-[12px] text-slate-500 mt-0.5">Gerencie os critérios de conformidade pertencentes a esta seção.</p>
                              </div>
                              
                              {!isAddingCriterion && editingCriterionIndex === null && (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingCriterion(true);
                                    // Pre-fill next code suggestion e.g. "2.2"
                                    const sectionNum = activeSectionIndex + 1;
                                    const nextItemNum = (sections[activeSectionIndex].criteria?.length || 0) + 1;
                                    setCritCode(`${sectionNum}.${nextItemNum}`);
                                    setCritDescription('');
                                    setCritReference('');
                                    setCritResponseType('conformance');
                                    setCritRequired(true);
                                    setCritSortOrder(nextItemNum);
                                  }}
                                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Adicionar Critério
                                </Button>
                              )}
                            </div>

                            {/* Criterion Form (Inline Add/Edit) */}
                            {(isAddingCriterion || editingCriterionIndex !== null) && (
                              <div className="bg-slate-50 border border-teal-100 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                                <h5 className="text-[12px] font-bold text-teal-900 flex items-center gap-1.5">
                                  <CheckSquare className="w-4 h-4" />
                                  {isAddingCriterion ? 'Novo Critério' : 'Editar Critério'}
                                </h5>
                                
                                <div className="grid grid-cols-6 gap-3">
                                  <div className="col-span-2 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">Código</Label>
                                    <Input
                                      value={critCode}
                                      onChange={(e) => setCritCode(e.target.value)}
                                      placeholder="Ex: 1.1"
                                      className="h-8 text-[12px] bg-white border-slate-300"
                                      required
                                    />
                                  </div>

                                  <div className="col-span-4 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">Referência Técnica</Label>
                                    <Input
                                      value={critReference}
                                      onChange={(e) => setCritReference(e.target.value)}
                                      placeholder="Ex: ISO 11228-1, Opcional"
                                      className="h-8 text-[12px] bg-white border-slate-300"
                                    />
                                  </div>

                                  <div className="col-span-6 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">Descrição do Critério</Label>
                                    <Textarea
                                      value={critDescription}
                                      onChange={(e) => setCritDescription(e.target.value)}
                                      placeholder="O que o inspetor/fornecedor deve avaliar?"
                                      className="text-[12px] bg-white min-h-[50px] rounded-lg border-slate-300"
                                      required
                                    />
                                  </div>

                                  <div className="col-span-3 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">Tipo de Resposta</Label>
                                    <select
                                      value={critResponseType}
                                      onChange={(e) => setCritResponseType(e.target.value as any)}
                                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-[12px] text-slate-800"
                                    >
                                      {RESPONSE_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="col-span-3 flex items-center gap-2 mt-5">
                                    <input
                                      type="checkbox"
                                      id="crit-req"
                                      checked={critRequired}
                                      onChange={(e) => setCritRequired(e.target.checked)}
                                      className="rounded border-slate-300 text-teal-600 w-4 h-4 focus:ring-teal-500"
                                    />
                                    <Label htmlFor="crit-req" className="text-[12px] font-semibold text-slate-700 cursor-pointer select-none">
                                      Obrigatório (Mandatory)
                                    </Label>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      setIsAddingCriterion(false);
                                      setEditingCriterionIndex(null);
                                    }}
                                    className="h-8 px-3 text-xs text-slate-600"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleSaveCriterion}
                                    className="h-8 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                                  >
                                    Confirmar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Criteria List */}
                            {!isAddingCriterion && editingCriterionIndex === null && (
                              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[350px] overflow-y-auto">
                                <Table>
                                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                                    <TableRow>
                                      <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-9 w-[70px]">Cód.</TableHead>
                                      <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-9">Descrição</TableHead>
                                      <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-9 w-[120px]">Ref. Técnica</TableHead>
                                      <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-9 w-[130px]">Resposta</TableHead>
                                      <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-9 w-[80px]">Obrig.</TableHead>
                                      <TableHead className="text-right text-[11px] font-bold text-slate-600 uppercase h-9 pr-4 w-[100px]">Ações</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {!sections[activeSectionIndex].criteria || sections[activeSectionIndex].criteria.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-400 italic text-[12px]">
                                          Nenhum critério cadastrado nesta seção. Clique em "+ Adicionar Critério" para criar.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      sections[activeSectionIndex].criteria.map((crit, cIdx) => (
                                        <TableRow key={cIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                          <TableCell className="align-middle py-2 font-mono text-[12px] font-bold text-slate-700">
                                            {crit.code}
                                          </TableCell>
                                          <TableCell className="align-middle py-2 text-[12px] text-slate-900 font-medium">
                                            {crit.description}
                                          </TableCell>
                                          <TableCell className="align-middle py-2 text-[11px] text-slate-500 font-semibold">
                                            {crit.reference || <span className="text-slate-300 italic">-</span>}
                                          </TableCell>
                                          <TableCell className="align-middle py-2 text-[11px] text-slate-600">
                                            {RESPONSE_TYPES.find(r => r.value === crit.responseType)?.label || crit.responseType}
                                          </TableCell>
                                          <TableCell className="align-middle py-2">
                                            {crit.required ? (
                                              <Badge className="bg-red-50 border border-red-200 text-red-700 font-bold text-[9px] px-1.5 py-0">Sim</Badge>
                                            ) : (
                                              <Badge className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] px-1.5 py-0">Não</Badge>
                                            )}
                                          </TableCell>
                                          <TableCell className="align-middle py-2 text-right pr-4 space-x-1">
                                            <Button
                                              type="button"
                                              onClick={() => {
                                                setEditingCriterionIndex(cIdx);
                                                setCritCode(crit.code);
                                                setCritDescription(crit.description);
                                                setCritReference(crit.reference || '');
                                                setCritResponseType(crit.responseType);
                                                setCritRequired(crit.required);
                                                setCritSortOrder(crit.sortOrder);
                                              }}
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                              type="button"
                                              onClick={() => handleDeleteCriterion(cIdx)}
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Form Footer */}
              <footer className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-lg text-slate-600 border-slate-300 font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg shadow-sm"
                >
                  Salvar
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Registro?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Tem certeza de que deseja excluir permanentemente este registro da organização? Esta ação é irreversível.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 h-10 rounded-lg text-slate-600 border-slate-300 font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-10 rounded-lg shadow-sm"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
