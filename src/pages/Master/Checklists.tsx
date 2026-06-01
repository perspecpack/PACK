import React, { useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import { ChecklistTemplate, ChecklistSection, ChecklistCriterion, ChecklistHeaderField } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckSquare } from 'lucide-react';

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

export default function Checklists() {
  const { checklists, oems, addChecklist, updateChecklist, deleteChecklist } = useApp();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);

  // Form states - Checklist Metadata
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [revision, setRevision] = useState('01');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Form states - Project Header Configuration
  const [hasHeader, setHasHeader] = useState(false);
  const [headerFields, setHeaderFields] = useState<ChecklistHeaderField[]>([]);

  // Form states - Dynamic Sections and Criteria
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [editingCriterionIndex, setEditingCriterionIndex] = useState<number | null>(null);

  // Local states for editing a criterion
  const [critCode, setCritCode] = useState('');
  const [critDescription, setCritDescription] = useState('');
  const [critReference, setCritReference] = useState('');
  const [critResponseType, setCritResponseType] = useState<'conformance' | 'yes_no' | 'free_text' | 'number' | 'evidence'>('conformance');
  const [critRequired, setCritRequired] = useState(true);
  const [critSortOrder, setCritSortOrder] = useState(1);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingChecklist(null);
    setName('');
    setOrganizationId(oems[0]?.id || '');
    setRevision('01');
    setStatus('active');
    
    // Default header fields for new checklists
    setHasHeader(true);
    setHeaderFields([
      { label: 'Número da Peça / Part Number', type: 'text', required: true },
      { label: 'Nome da Peça', type: 'text', required: true },
      { label: 'Nome do Projeto', type: 'text', required: false }
    ]);
    
    // Pre-populate with default 10 sections
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

  const openEditModal = (chk: ChecklistTemplate) => {
    setEditingChecklist(chk);
    setName(chk.name);
    setOrganizationId(chk.organizationId);
    setRevision(chk.revision);
    setStatus(chk.status);
    
    // Load header fields from editingChecklist if available
    setHasHeader(chk.headerConfig?.enabled || false);
    setHeaderFields(chk.headerConfig?.fields || []);
    
    // Deep copy checklists sections & criteria
    setSections(chk.sections ? JSON.parse(JSON.stringify(chk.sections)) : []);
    setActiveSectionIndex(0);
    setIsAddingCriterion(false);
    setEditingCriterionIndex(null);

    setIsModalOpen(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organizationId) return;

    const checklistData = {
      organizationId,
      name,
      revision,
      status,
      headerConfig: {
        enabled: hasHeader,
        fields: hasHeader ? headerFields.filter(f => f.label.trim() !== '') : []
      }
    };

    if (editingChecklist) {
      updateChecklist(editingChecklist.id, checklistData, sections);
    } else {
      addChecklist(checklistData, sections);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteChecklist(id);
    setDeletingId(null);
  };

  const getOEMName = (id: string) => oems.find(o => o.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto font-sans">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Modelos de Checklists</h2>
          <p className="text-[13px] text-slate-500 mt-1">Crie e configure checklists técnicos dinâmicos para homologação de embalagens industriais.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Novo Checklist
        </Button>
      </div>

      {/* Checklists Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome do Checklist</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Organização</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[100px]">Revisão</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[150px]">Qtd. Requisitos</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum checklist cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              checklists.map((chk) => (
                <TableRow key={chk.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle font-bold text-[13px] text-slate-900">
                    {chk.name}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600">
                    {getOEMName(chk.organizationId)}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] font-mono text-slate-700">
                    {chk.revision}
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="bg-teal-50 border border-teal-100 text-teal-700 font-bold px-2.5 py-0.5 rounded text-[11px]">
                      {chk.sections?.reduce((sum: number, s: any) => sum + (s.criteria?.length || 0), 0) || 0} itens
                    </span>
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={chk.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold'
                    }>
                      {chk.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(chk)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(chk.id)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[1100px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingChecklist ? 'Editar Checklist' : 'Novo Checklist de Organização'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Metadata Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="chk-name" className="text-xs font-bold text-slate-700">Nome do Checklist</Label>
                  <Input 
                    id="chk-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Checklist Geral de Embalagens Metálicas" 
                    required 
                    className="h-10 text-[13px] bg-white rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-oem" className="text-xs font-bold text-slate-700">Organização</Label>
                  <select 
                    id="chk-oem" 
                    value={organizationId} 
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[13px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    {oems.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 font-mono">
                  <Label htmlFor="chk-rev" className="text-xs font-bold text-slate-700">Revisão</Label>
                  <Input 
                    id="chk-rev" 
                    value={revision} 
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="Ex: 01" 
                    required 
                    className="h-10 text-[13px] bg-white rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-status" className="text-xs font-bold text-slate-700">Status</Label>
                  <select 
                    id="chk-status" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[13px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Configuração do Cabeçalho do Projeto */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
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

              {/* Side-by-side Editor */}
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

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Checklist?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Tem certeza que deseja excluir permanentemente este checklist? Todos os critérios salvos nele serão removidos definitivamente.
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
                  onClick={() => handleDelete(deletingId)}
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
