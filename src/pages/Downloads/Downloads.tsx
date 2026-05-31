import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FileText, 
  CheckSquare, 
  FolderKanban, 
  ShieldCheck, 
  Download, 
  Layers,
  FileDown,
  HardDrive,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp } from '@/src/context/AppContext';
import { ModuleType, ChecklistTemplate } from '@/src/types';

const MODULE_INFO: Record<ModuleType, { title: string; icon: React.ComponentType<any> }> = {
  components: { title: 'Componentes Homologados', icon: Layers },
  documentation: { title: 'Caderno de Encargos', icon: FileText },
  standards: { title: 'Documentação Técnica', icon: ShieldCheck },
  checklists: { title: 'Checklist de Validação', icon: CheckSquare },
  reference_projects: { title: 'Projetos de Referência', icon: FolderKanban },
  cad_library: { title: 'Biblioteca CAD', icon: HardDrive },
  procedures: { title: 'Procedimentos', icon: Box }
};

const RESPONSE_TYPES = [
  { value: 'conformance', label: 'Conforme/Não Conforme/N.A.' },
  { value: 'yes_no', label: 'Sim/Não/N.A.' },
  { value: 'free_text', label: 'Texto Livre' },
  { value: 'number', label: 'Numérico' },
  { value: 'evidence', label: 'Evidência (Foto/Arquivo)' }
];

export default function Downloads() {
  const { 
    organizations, 
    organizationModules, 
    components, 
    documents, 
    standards, 
    checklists, 
    referenceProjects,
    logDownload,
    logPageAccess 
  } = useApp();

  const [selectedOEM, setSelectedOEM] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<ModuleType>('components');
  const [viewingChecklist, setViewingChecklist] = useState<ChecklistTemplate | null>(null);

  const activeOems = organizations.filter(o => o.status === 'active');

  // Set default selected OEM on load
  useEffect(() => {
    if (activeOems.length > 0 && !selectedOEM) {
      setSelectedOEM(activeOems[0].id);
    }
  }, [activeOems, selectedOEM]);

  // Log page access on component mount
  useEffect(() => {
    logPageAccess('Fornecedor - Portal de Downloads');
  }, [logPageAccess]);

  // Set default module based on organization's enabled modules
  useEffect(() => {
    if (selectedOEM) {
      const allowedModules = ['components', 'documentation', 'standards', 'checklists'];
      const orgMods = organizationModules.filter(m => m.organizationId === selectedOEM && m.enabled && allowedModules.includes(m.moduleType));
      if (orgMods.length > 0) {
        // Find if current selectedModule is enabled, otherwise pick first enabled
        const isCurrentEnabled = orgMods.some(m => m.moduleType === selectedModule);
        if (!isCurrentEnabled) {
          setSelectedModule(orgMods[0].moduleType);
        }
      }
    }
  }, [selectedOEM, organizationModules]);

  const selectedOEMObj = activeOems.find(o => o.id === selectedOEM);
  const selectedOEMName = selectedOEMObj?.name || '';

  // Get active modules for selected OEM
  const allowedModules = ['components', 'documentation', 'standards', 'checklists'];
  const activeModules = organizationModules.filter(m => m.organizationId === selectedOEM && m.enabled && allowedModules.includes(m.moduleType));

  // Helper to get real records count per module
  const getRecordCount = (moduleType: ModuleType) => {
    switch (moduleType) {
      case 'components': return components.filter(c => c.organizationId === selectedOEM && c.status === 'active').length;
      case 'documentation': return documents.filter(d => d.organizationId === selectedOEM && d.status === 'active').length;
      case 'standards': return standards.filter(s => s.organizationId === selectedOEM && s.status === 'active').length;
      case 'checklists': return checklists.filter(c => c.organizationId === selectedOEM && c.status === 'active').length;
      case 'reference_projects': return referenceProjects.filter(p => p.organizationId === selectedOEM && p.status === 'active').length;
      default: return 0;
    }
  };

  // Helper to render static vector logos or abbreviations
  const renderOEMLogo = (name: string, logoUrl?: string) => {
    if (logoUrl) {
      return <img src={logoUrl} alt={name} className="h-10 object-contain max-w-[120px]" />;
    }

    const n = name.toLowerCase();
    if (n.includes('volkswagen') || n === 'vw') {
      return <div className="text-2xl font-bold font-serif text-blue-900 border-2 border-blue-900 rounded-full w-12 h-12 flex items-center justify-center">W</div>;
    }
    if (n.includes('hyundai')) {
      return <div className="text-2xl font-bold font-serif italic text-blue-800 font-extrabold">H</div>;
    }
    if (n.includes('nissan')) {
      return <div className="text-[13px] font-bold border border-gray-800 rounded-full px-2 py-0.5 tracking-wider">NISSAN</div>;
    }
    if (n.includes('renault')) {
      return <div className="w-6 h-9 border-4 border-yellow-500 transform rotate-45 shrink-0 mx-auto"></div>;
    }
    if (n.includes('scania')) {
      return <div className="text-sm font-black text-red-600 tracking-wide">SCANIA</div>;
    }
    if (n.includes('gestamp')) {
      return <div className="text-sm font-bold text-blue-700 tracking-tighter">Gestamp</div>;
    }

    // Default abbreviation
    return <div className="text-lg font-bold text-slate-700 uppercase bg-slate-100 rounded px-3 py-1.5">{name.substring(0, 2)}</div>;
  };

  return (
    <div className="flex flex-col gap-10 max-w-[1200px] mx-auto pb-12">
      
      {/* Selecione a Organização */}
      <section>
        <h2 className="text-[14px] font-bold text-gray-800 mb-4 uppercase tracking-wider">Selecione a organização</h2>
        
        {activeOems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 font-medium">
            Nenhuma organização ativa cadastrada pelo administrador.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {activeOems.map((oem) => (
              <button
                key={oem.id}
                onClick={() => setSelectedOEM(oem.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 bg-white border rounded-xl transition-all duration-200 gap-4 cursor-pointer",
                  selectedOEM === oem.id 
                    ? "border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500 scale-[1.02]" 
                    : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                )}
              >
                <div className="h-14 flex items-center justify-center grayscale opacity-80 mix-blend-multiply transition-all">
                  {renderOEMLogo(oem.name, oem.logoUrl)}
                </div>
                <span className="text-[13px] font-bold text-gray-900">{oem.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedOEM && (
        <>
          {/* Módulos Habilitados (Categorias de Conteúdo) */}
          <section>
            <h2 className="text-[14px] font-bold text-gray-800 mb-4 uppercase tracking-wider">
              Conteúdo disponível &mdash; {selectedOEMName}
            </h2>
            
            {activeModules.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 font-medium">
                Nenhum módulo de conteúdo está ativo para esta organização.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {activeModules.map((mod) => {
                  const info = MODULE_INFO[mod.moduleType];
                  if (!info) return null;

                  const IconComponent = info.icon;
                  const recordCount = getRecordCount(mod.moduleType);
                  const isSelected = selectedModule === mod.moduleType;

                  return (
                    <div 
                      key={mod.id} 
                      onClick={() => setSelectedModule(mod.moduleType)}
                      className={cn(
                        "bg-white border p-6 rounded-xl flex flex-col items-center text-center transition-all cursor-pointer group select-none",
                        isSelected 
                          ? "border-teal-500 shadow-md ring-1 ring-teal-500 scale-[1.01]" 
                          : "border-gray-200 hover:border-teal-400 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors",
                        isSelected ? "bg-teal-600 text-white" : "bg-teal-50/80 text-teal-600 group-hover:bg-teal-100/80"
                      )}>
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <h3 className="text-[13px] font-bold text-gray-900 mb-1 leading-snug h-10 flex items-center">{info.title}</h3>
                      <span className={cn(
                        "inline-flex items-center justify-center text-[12px] font-bold px-2 py-0.5 rounded-md mt-2",
                        isSelected ? "bg-teal-100 text-teal-800" : "bg-teal-50 text-teal-700"
                      )}>
                        {recordCount} itens
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Listagem de Itens do Módulo Selecionado */}
          {activeModules.some(m => m.moduleType === selectedModule) && (
            <section className="space-y-4">
              <h2 className="text-[14px] font-bold text-gray-800 uppercase tracking-wider">
                {MODULE_INFO[selectedModule]?.title} &mdash; {selectedOEMName}
              </h2>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                
                {/* Table for components */}
                {selectedModule === 'components' && (
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[80px]">Imagem</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Componente</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Aplicação Recomendada</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[100px]">Rev.</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[200px]">Downloads CAD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.filter(c => c.organizationId === selectedOEM && c.status === 'active').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-gray-400 font-medium">
                            Nenhum componente cadastrado ou publicado para esta organização.
                          </TableCell>
                        </TableRow>
                      ) : (
                        components.filter(c => c.organizationId === selectedOEM && c.status === 'active').map((comp) => (
                          <TableRow key={comp.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="align-middle">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                                {comp.imageUrl ? (
                                  <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Layers className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-middle font-bold text-[13px] text-gray-900">{comp.name}</TableCell>
                            <TableCell className="align-middle text-[13px] text-gray-600">{comp.application || comp.description || '-'}</TableCell>
                            <TableCell className="align-middle text-[13px] text-gray-700 font-mono font-bold">{comp.revision}</TableCell>
                            <TableCell className="align-middle">
                              <div className="flex gap-1.5">
                                {comp.stepFileUrl && (
                                  <a 
                                    href={comp.stepFileUrl} 
                                    onClick={() => logDownload(comp.organizationId, 'Componente (STEP)', comp.id, comp.stepFileUrl?.split('/').pop() || 'arquivo.step')}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold font-mono"
                                  >
                                    STEP
                                  </a>
                                )}
                                {comp.pdfFileUrl && (
                                  <a 
                                    href={comp.pdfFileUrl} 
                                    onClick={() => logDownload(comp.organizationId, 'Componente (PDF)', comp.id, comp.pdfFileUrl?.split('/').pop() || 'arquivo.pdf')}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold font-mono"
                                  >
                                    PDF
                                  </a>
                                )}
                                {comp.dwgFileUrl && (
                                  <a 
                                    href={comp.dwgFileUrl} 
                                    onClick={() => logDownload(comp.organizationId, 'Componente (DWG)', comp.id, comp.dwgFileUrl?.split('/').pop() || 'arquivo.dwg')}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold font-mono"
                                  >
                                    DWG
                                  </a>
                                )}
                                {!comp.stepFileUrl && !comp.pdfFileUrl && !comp.dwgFileUrl && <span className="text-xs text-gray-400 italic">Indisponível</span>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Table for documents */}
                {selectedModule === 'documentation' && (
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Título</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Tipo</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Descrição</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[100px]">Rev.</TableHead>
                        <TableHead className="text-right text-[12px] font-bold text-gray-600 uppercase h-12 pr-6 w-[100px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.filter(d => d.organizationId === selectedOEM && d.status === 'active').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-gray-400 font-medium">
                            Nenhum manual ou documento cadastrado para esta organização.
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.filter(d => d.organizationId === selectedOEM && d.status === 'active').map((doc) => (
                          <TableRow key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-bold text-[13px] text-gray-900">{doc.title}</TableCell>
                            <TableCell className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">{doc.documentType}</TableCell>
                            <TableCell className="text-[13px] text-gray-600">{doc.description || '-'}</TableCell>
                            <TableCell className="text-[13px] text-gray-700 font-semibold font-mono">{doc.revision}</TableCell>
                            <TableCell className="text-right pr-6">
                              {doc.fileUrl ? (
                                <a 
                                  href={doc.fileUrl} 
                                  onClick={() => logDownload(doc.organizationId, 'Documentação Técnica', doc.id, doc.fileName || doc.fileUrl?.split('/').pop() || 'documento.pdf')}
                                  target="_blank" 
                                  rel="noreferrer"
                                >
                                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 w-8 p-0 rounded-md shadow-sm">
                                    <Download className="w-[15px] h-[15px]" />
                                  </Button>
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Sem PDF</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Table for standards */}
                {selectedModule === 'standards' && (
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Norma / Padrão</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Doc. Referência</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Descrição</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[100px]">Rev.</TableHead>
                        <TableHead className="text-right text-[12px] font-bold text-gray-600 uppercase h-12 pr-6 w-[100px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standards.filter(s => s.organizationId === selectedOEM && s.status === 'active').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-gray-400 font-medium">
                            Nenhuma norma ou padrão técnico cadastrado para esta organização.
                          </TableCell>
                        </TableRow>
                      ) : (
                        standards.filter(s => s.organizationId === selectedOEM && s.status === 'active').map((std) => (
                          <TableRow key={std.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="align-middle">
                              <div className="font-bold text-[13px] text-gray-900">{std.title}</div>
                              <div className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">{std.standardType || 'Norma de Embalagem'}</div>
                            </TableCell>
                            <TableCell className="text-[13px] text-gray-600 font-bold font-mono">{std.referenceDocument || '-'}</TableCell>
                            <TableCell className="text-[13px] text-gray-600">{std.description || '-'}</TableCell>
                            <TableCell className="text-[13px] text-gray-700 font-semibold font-mono">{std.revision}</TableCell>
                            <TableCell className="text-right pr-6">
                              {std.fileUrl ? (
                                <a 
                                  href={std.fileUrl} 
                                  onClick={() => logDownload(std.organizationId, 'Normas e Padrões', std.id, std.fileName || std.fileUrl?.split('/').pop() || 'norma.pdf')}
                                  target="_blank" 
                                  rel="noreferrer"
                                >
                                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 w-8 p-0 rounded-md shadow-sm">
                                    <Download className="w-[15px] h-[15px]" />
                                  </Button>
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Sem PDF</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Table for checklists */}
                {selectedModule === 'checklists' && (
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Checklist</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Critérios de Inspeção</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[100px]">Rev.</TableHead>
                        <TableHead className="text-right text-[12px] font-bold text-gray-600 uppercase h-12 pr-6 w-[180px]">Opções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklists.filter(c => c.organizationId === selectedOEM && c.status === 'active').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center text-gray-400 font-medium">
                            Nenhum checklist de validação cadastrado para esta organização.
                          </TableCell>
                        </TableRow>
                      ) : (
                        checklists.filter(c => c.organizationId === selectedOEM && c.status === 'active').map((chk) => (
                          <TableRow key={chk.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-bold text-[13px] text-gray-900">{chk.name}</TableCell>
                            <TableCell className="text-[13px] text-gray-600 font-medium">
                              {chk.sections?.reduce((sum: number, s: any) => sum + (s.criteria?.length || 0), 0) || 0} regras de validação
                            </TableCell>
                            <TableCell className="text-[13px] text-gray-700 font-semibold font-mono">{chk.revision}</TableCell>
                            <TableCell className="text-right pr-6">
                              <Button 
                                onClick={() => {
                                  setViewingChecklist(chk);
                                  logPageAccess(`Fornecedor - Visualizar Checklist: ${chk.name}`);
                                }}
                                size="sm" 
                                className="bg-teal-600 hover:bg-teal-700 text-white h-8 px-3 rounded-md shadow-sm text-xs font-bold gap-1"
                              >
                                Visualizar Requisitos
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Table for reference projects */}
                {selectedModule === 'reference_projects' && (
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12 w-[80px]">Imagem</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Projeto</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Aplicação Recomendada</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Descrição</TableHead>
                        <TableHead className="text-[12px] font-bold text-gray-600 uppercase h-12">Anexos de Projeto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referenceProjects.filter(p => p.organizationId === selectedOEM && p.status === 'active').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-gray-400 font-medium">
                            Nenhum projeto de referência cadastrado ou publicado para esta organização.
                          </TableCell>
                        </TableRow>
                      ) : (
                        referenceProjects.filter(p => p.organizationId === selectedOEM && p.status === 'active').map((proj) => (
                          <TableRow key={proj.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="align-middle">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                                {proj.imageUrl ? (
                                  <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FolderKanban className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-middle font-bold text-[13px] text-gray-900">{proj.name}</TableCell>
                            <TableCell className="align-middle text-[13px] text-gray-600">{proj.application || '-'}</TableCell>
                            <TableCell className="align-middle text-[13px] text-gray-500">{proj.description || '-'}</TableCell>
                            <TableCell className="align-middle">
                              {proj.attachmentUrl ? (
                                <a 
                                  href={proj.attachmentUrl} 
                                  onClick={() => logDownload(proj.organizationId, 'Projeto de Referência', proj.id, proj.attachmentName || proj.attachmentUrl?.split('/').pop() || 'anexo.zip')}
                                  target="_blank" 
                                  rel="noreferrer" 
                                  title={proj.attachmentName}
                                  className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 text-[11px] px-2.5 py-1 rounded-md font-bold transition-colors w-fit"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="max-w-[120px] truncate">{proj.attachmentType || 'ANEXO'}</span>
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Nenhum anexo</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}

              </div>
            </section>
          )}
        </>
      )}

      {/* Modal Requisitos */}
      {viewingChecklist && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[900px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-[#06242c] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] bg-teal-500/20 text-[#00F59B] px-2 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">
                  Checklist Técnico &bull; Rev. {viewingChecklist.revision}
                </span>
                <h3 className="font-extrabold text-[16px] text-white mt-1">{viewingChecklist.name}</h3>
              </div>
              <button onClick={() => setViewingChecklist(null)} className="text-slate-300 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50">
              {viewingChecklist.sections?.map((sec, idx) => {
                if (!sec.criteria || sec.criteria.length === 0) return null;
                return (
                  <div key={sec.id || idx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <h4 className="text-[13px] font-bold text-slate-800">
                        {idx + 1}. {sec.title}
                      </h4>
                      <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0">
                        {sec.criteria.length} {sec.criteria.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {sec.criteria.map((crit, cIdx) => (
                        <div key={crit.id || cIdx} className="p-4 flex flex-col md:flex-row md:items-start gap-3 hover:bg-slate-50/40 transition-colors">
                          <div className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded w-fit shrink-0">
                            {crit.code}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-[13px] text-slate-900 font-semibold leading-relaxed">
                              {crit.description}
                            </p>
                            {crit.reference && (
                              <p className="text-[11px] text-slate-500 font-medium">
                                <span className="font-bold">Referência Técnica:</span> {crit.reference}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {RESPONSE_TYPES.find(r => r.value === crit.responseType)?.label || crit.responseType}
                            </span>
                            {crit.required && (
                              <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded">
                                Obrigatório (Mandatory)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {(!viewingChecklist.sections || viewingChecklist.sections.every(s => !s.criteria || s.criteria.length === 0)) && (
                <div className="text-center py-12 text-slate-400 italic text-[13px]">
                  Nenhum critério técnico cadastrado neste modelo de checklist.
                </div>
              )}
            </div>

            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button 
                onClick={() => setViewingChecklist(null)} 
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs px-4 h-9"
              >
                Fechar
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
