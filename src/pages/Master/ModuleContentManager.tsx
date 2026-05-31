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
import { ModuleType, DocumentType } from '@/src/types';

const DOCUMENT_TYPES: DocumentType[] = [
  'Caderno de Encargos',
  'Manual',
  'Norma',
  'Procedimento',
  'Apresentação',
  'Boletim Técnico'
];

const CHECKLIST_CATEGORIES = [
  'Estrutura',
  'Empilhamento',
  'Ergonomia',
  'AGV',
  'Identificação',
  'Segurança',
  'Logística',
  'Documentação'
];

export default function ModuleContentManager() {
  const { orgId, moduleType } = useParams<{ orgId: string; moduleType: string }>();
  const navigate = useNavigate();
  
  const { 
    organizations,
    components, addComponent, updateComponent, deleteComponent,
    documents, addDocument, updateDocument, deleteDocument,
    standards, addStandard, updateStandard, deleteStandard,
    checklists, addChecklist, updateChecklist, deleteChecklist,
    referenceProjects, addReferenceProject, updateReferenceProject, deleteReferenceProject
  } = useApp();

  const org = organizations.find(o => o.id === orgId);

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

  // Document / Standard / Checklist Shared File States
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileTypeState, setFileTypeState] = useState('');

  // Document Specific States
  const [documentType, setDocumentType] = useState<DocumentType>('Manual');

  // Standard Specific States
  const [referenceDocument, setReferenceDocument] = useState('');

  // Checklist Specific States
  const [checklistItems, setChecklistItems] = useState<{ id?: string; category: string; description: string; required: boolean; reference?: string; sortOrder: number }[]>([]);

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
        return components.filter(c => c.organizationId === orgId);
      case 'documentation':
        return documents.filter(d => d.organizationId === orgId);
      case 'standards':
        return standards.filter(s => s.organizationId === orgId);
      case 'checklists':
        return checklists.filter(c => c.organizationId === orgId);
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
    setDocumentType('Manual');
    setFileUrl('');
    setFileName('');
    setFileTypeState('');
    setReferenceDocument('');
    setAttachmentUrl('');
    setAttachmentName('');
    setAttachmentType('');
    setChecklistItems([
      { category: 'Estrutura', description: '', required: true, sortOrder: 1 }
    ]);

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
    setDocumentType(rec.documentType || 'Manual');
    setFileUrl(rec.fileUrl || '');
    setFileName(rec.fileName || '');
    setFileTypeState(rec.fileType || '');
    setReferenceDocument(rec.referenceDocument || '');
    setAttachmentUrl(rec.attachmentUrl || '');
    setAttachmentName(rec.attachmentName || '');
    setAttachmentType(rec.attachmentType || '');
    setChecklistItems(rec.items ? [...rec.items] : []);

    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (moduleType === 'components') {
      const componentData = {
        organizationId: orgId!,
        name,
        description: description || undefined,
        application: application || undefined,
        revision,
        status,
        stepFileUrl: stepFileUrl || undefined,
        pdfFileUrl: pdfFileUrl || undefined,
        dwgFileUrl: dwgFileUrl || undefined,
        imageUrl: imageUrl || undefined
      };

      if (editingId) {
        updateComponent(editingId, componentData);
      } else {
        addComponent(componentData);
      }
    } else if (moduleType === 'documentation') {
      const docData = {
        organizationId: orgId!,
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
        title: name,
        description: description || undefined,
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
        name,
        revision,
        status,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileType: fileTypeState || undefined
      };

      // Map dynamic items
      const items = checklistItems.map((itm, idx) => ({
        id: itm.id,
        category: itm.category as any,
        description: itm.description,
        required: itm.required,
        reference: itm.reference || undefined,
        sortOrder: idx + 1
      }));

      if (editingId) {
        updateChecklist(editingId, chkData, items);
      } else {
        addChecklist(chkData, items);
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

  // Dynamic Checklist Row Handlers
  const addChecklistItemRow = () => {
    setChecklistItems(prev => [
      ...prev,
      { category: 'Estrutura', description: '', required: true, sortOrder: prev.length + 1 }
    ]);
  };

  const removeChecklistItemRow = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateChecklistItemRow = (index: number, field: string, value: any) => {
    setChecklistItems(prev => prev.map((itm, i) => i === index ? { ...itm, [field]: value } : itm));
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto font-sans">
      {/* Back Link */}
      <Link 
        to={`/master/content/${orgId}`} 
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para {org.name}
      </Link>

      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[12px] font-extrabold text-teal-600 uppercase tracking-wider">{org.name}</span>
          <h2 className="text-[18px] font-black text-slate-900 mt-0.5">{getModuleTitle()}</h2>
          <p className="text-[13px] text-slate-500 mt-1">Gerencie os registros do módulo específico para esta organização.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
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
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Título</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Doc. de Referência</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[100px]">Revisão</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Anexo</TableHead>
                </>
              )}
              {moduleType === 'checklists' && (
                <>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Nome do Checklist</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[100px]">Itens</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase w-[100px]">Revisão</TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-600 uppercase">Template Anexo</TableHead>
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
                            <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" />
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
                      <TableCell className="align-middle font-bold text-[13px] text-slate-900">
                        {rec.title}
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
                      <TableCell className="align-middle font-bold text-[13px] text-slate-700">
                        {rec.items?.length || 0} critérios
                      </TableCell>
                      <TableCell className="align-middle font-mono font-bold text-[12px] text-slate-700">
                        {rec.revision}
                      </TableCell>
                      <TableCell className="align-middle">
                        {rec.fileUrl ? (
                          <a href={rec.fileUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 flex items-center gap-1.5 font-bold text-[12px] bg-teal-50 border border-teal-100 px-2 py-1 rounded-md w-fit">
                            <FileDown className="w-3.5 h-3.5" />
                            <span className="max-w-[120px] truncate">{rec.fileName || 'Template'}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Nenhum</span>
                        )}
                      </TableCell>
                    </>
                  )}

                  {moduleType === 'reference_projects' && (
                    <>
                      <TableCell className="align-middle">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          {rec.imageUrl ? (
                            <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" />
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
                      : 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[650px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                        onUploadComplete={(url) => setImageUrl(url)}
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
                        onUploadComplete={(url) => setStepFileUrl(url)}
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
                        onUploadComplete={(url) => setPdfFileUrl(url)}
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
                        onUploadComplete={(url) => setDwgFileUrl(url)}
                        onRemove={() => setDwgFileUrl('')}
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

                {moduleType === 'checklists' && (
                  <>
                    {/* Checklist Template Upload */}
                    <div className="col-span-2">
                      <FileUploadField
                        label="Modelo PDF, Planilha XLSX ou Documento DOCX de Apoio"
                        acceptedTypes="application/pdf,.docx,.xlsx"
                        bucket="checklists"
                        currentFileUrl={fileUrl}
                        orgSlug={org.slug}
                        moduleType="checklists"
                        onUploadComplete={(url, name, ext) => {
                          setFileUrl(url);
                          setFileName(name);
                          setFileTypeState(ext);
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
                        onUploadComplete={(url) => setImageUrl(url)}
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

                {/* Checklist Criteria dynamic list */}
                {moduleType === 'checklists' && (
                  <div className="col-span-2 border-t border-slate-100 pt-4 mt-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itens / Critérios de Inspeção</Label>
                      <Button 
                        type="button" 
                        onClick={addChecklistItemRow}
                        className="h-8 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded px-2.5 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Critério
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {checklistItems.map((itm, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 relative space-y-2">
                          <button 
                            type="button" 
                            onClick={() => removeChecklistItemRow(idx)}
                            className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="grid grid-cols-2 gap-3 pr-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                              <select 
                                value={itm.category} 
                                onChange={(e) => updateChecklistItemRow(idx, 'category', e.target.value)}
                                className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-[12px] text-slate-800"
                              >
                                {CHECKLIST_CATEGORIES.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Documento / Ref</label>
                              <Input 
                                value={itm.reference || ''} 
                                onChange={(e) => updateChecklistItemRow(idx, 'reference', e.target.value)}
                                placeholder="VW 39D 120"
                                className="h-8 text-[12px] rounded border-slate-300"
                              />
                            </div>

                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição da Checagem</label>
                              <Input 
                                value={itm.description} 
                                onChange={(e) => updateChecklistItemRow(idx, 'description', e.target.value)}
                                placeholder="Possui cantoneiras de empilhamento homologadas?"
                                required
                                className="h-8 text-[12px] rounded border-slate-300"
                              />
                            </div>

                            <div className="col-span-2 flex items-center gap-1.5 mt-1">
                              <input 
                                type="checkbox" 
                                id={`req-${idx}`}
                                checked={itm.required} 
                                onChange={(e) => updateChecklistItemRow(idx, 'required', e.target.checked)}
                                className="rounded border-slate-300 text-teal-600 w-3.5 h-3.5"
                              />
                              <label htmlFor={`req-${idx}`} className="text-[11px] font-bold text-slate-600 select-none cursor-pointer">
                                Critério Obrigatório (Mandatory)
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
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
