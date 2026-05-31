import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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
  X,
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp } from '@/src/context/AppContext';
import { ModuleType, ChecklistTemplate, ComponentEntry, DocumentEntry, StandardEntry } from '@/src/types';

const MODULE_INFO: Record<ModuleType, { title: string; desc: string; icon: React.ComponentType<any> }> = {
  components: { title: 'Componentes Homologados', desc: 'Biblioteca de partes técnicas e acoplamentos aprovados', icon: Layers },
  documentation: { title: 'Documentação Técnica', desc: 'Manuais técnicos, cadernos de encargos e anexos da engenharia', icon: FileText },
  standards: { title: 'Normas e Padrões', desc: 'Normas de empilhamento, skids, diretrizes de AGV e ergonomia', icon: ShieldCheck },
  checklists: { title: 'Checklists de Validação', desc: 'Templates de inspeção física e conformidade técnica', icon: CheckSquare },
  reference_projects: { title: 'Projetos de Referência', desc: 'Estruturas homologadas e desenhos 3D para consulta', icon: FolderKanban },
  cad_library: { title: 'Biblioteca CAD', desc: 'Arquivos brutos em STEP, DWG e modelagens paramétricas', icon: HardDrive },
  procedures: { title: 'Procedimentos', desc: 'Manuais operacionais de montagem e logística', icon: Box }
};

const ORG_TYPE_LABELS: Record<string, string> = {
  oem: 'Montadora OEM',
  component_manufacturer: 'Fabricante de Componentes',
  packaging_supplier: 'Fornecedor Tier 1',
  packaging_manufacturer: 'Fabricante de Embalagens'
};

const getComponentCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('rodízio') || n.includes('rodizio') || n.includes('roda')) return 'Rodízios';
  if (n.includes('engate') || n.includes('pino') || n.includes('acoplamento')) return 'Engates';
  if (n.includes('etiqueta') || n.includes('porta etiqueta') || n.includes('identificação')) return 'Porta Etiquetas';
  if (n.includes('trava') || n.includes('trinco') || n.includes('fecho')) return 'Travas';
  if (n.includes('cantoneira') || n.includes('canto')) return 'Cantoneiras';
  if (n.includes('skid') || n.includes('base') || n.includes('suporte')) return 'Skids';
  return 'Acessórios';
};

const getDocumentCategory = (doc: DocumentEntry) => {
  const type = doc.documentType;
  if (type === 'Caderno de Encargos') return 'Cadernos de Encargos';
  if (type === 'Norma') return 'Normas Internas';
  if (type === 'Procedimento') return 'Procedimentos';
  if (type === 'Manual') return 'Manuais Técnicos';
  return 'Padrões Logísticos';
};

const getStandardCategory = (std: StandardEntry) => {
  const type = std.standardType;
  const title = std.title.toLowerCase();
  if (type === 'Norma de Ergonomia' || title.includes('ergonomia')) return 'Ergonomia';
  if (type === 'Diretriz de AGV' || title.includes('agv')) return 'AGV';
  if (type === 'Norma de Empilhamento' || type === 'Padrão de Empilhamento' || title.includes('empilhamento')) return 'Empilhamento';
  if (type === 'Norma de Segurança' || title.includes('segurança') || title.includes('seguranca')) return 'Segurança';
  if (type === 'Norma de Embalagem' || type === 'Padrão de Dispositivo' || title.includes('dispositivo')) return 'Estrutura';
  if (title.includes('movimentação') || title.includes('movimentacao') || title.includes('logística') || title.includes('logistica')) return 'Movimentação';
  if (title.includes('identificação') || title.includes('identificacao') || title.includes('etiqueta')) return 'Identificação';
  if (title.includes('rodízio') || title.includes('rodizio') || title.includes('roda')) return 'Rodízios';
  return 'Estrutura';
};

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
    logPageAccess,
    logUpload,
    user
  } = useApp();

  const { searchQuery, setSearchQuery } = useOutletContext<{ searchQuery: string; setSearchQuery: (q: string) => void }>();

  // Steps: 'org_selection' | 'module_selection' | 'content_view' | 'checklist_execution'
  const [step, setStep] = useState<'org_selection' | 'module_selection' | 'content_view' | 'checklist_execution'>('org_selection');
  const [selectedOEM, setSelectedOEM] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<ModuleType>('components');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Checklist Execution state
  const [activeChecklist, setActiveChecklist] = useState<ChecklistTemplate | null>(null);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, { status: 'C' | 'NC' | 'NA'; note: string }>>({});
  const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);

  const activeOems = organizations.filter(o => o.status === 'active');
  const selectedOEMObj = activeOems.find(o => o.id === selectedOEM);
  const selectedOEMName = selectedOEMObj?.name || '';

  // Get active modules for selected OEM (only components, documentation, standards, checklists, reference_projects if has items)
  const allowedModules = ['components', 'documentation', 'standards', 'checklists', 'reference_projects'];
  const activeModules = organizationModules.filter(m => 
    m.organizationId === selectedOEM && 
    m.enabled && 
    allowedModules.includes(m.moduleType)
  );

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

  // Set default category when module changes
  useEffect(() => {
    if (step === 'content_view') {
      if (selectedModule === 'components') setSelectedCategory('Rodízios');
      else if (selectedModule === 'documentation') setSelectedCategory('Cadernos de Encargos');
      else if (selectedModule === 'standards') setSelectedCategory('Estrutura');
      else setSelectedCategory('');
    }
  }, [selectedModule, step]);

  // Log page access on component mount
  useEffect(() => {
    logPageAccess('Fornecedor - Portal de Downloads');
  }, [logPageAccess]);

  // Initialize checklist answers when entering checklist execution
  const startChecklistExecution = (checklist: ChecklistTemplate) => {
    setActiveChecklist(checklist);
    const initialAnswers: Record<string, { status: 'C' | 'NC' | 'NA'; note: string }> = {};
    checklist.sections?.forEach(sec => {
      sec.criteria?.forEach(crit => {
        initialAnswers[crit.id] = { status: 'C', note: '' };
      });
    });
    setChecklistAnswers(initialAnswers);
    setStep('checklist_execution');
    logPageAccess(`Fornecedor - Executar Checklist: ${checklist.name}`);
  };

  // Checklist execution progress calculation
  const getChecklistProgress = () => {
    if (!activeChecklist) return 0;
    let total = 0;
    let answered = 0;
    activeChecklist.sections?.forEach(sec => {
      sec.criteria?.forEach(crit => {
        total++;
        if (checklistAnswers[crit.id]?.status) answered++;
      });
    });
    return total === 0 ? 0 : Math.round((answered / total) * 100);
  };

  const isChecklistCompliant = () => {
    return !Object.values(checklistAnswers).some((ans: any) => ans.status === 'NC');
  };

  // Download checklist report
  const handleExportChecklistReport = () => {
    if (!activeChecklist) return;

    let reportText = `RELATÓRIO DE CONFORMIDADE TÉCNICA - PERSPECPACK\n`;
    reportText += `==================================================\n\n`;
    reportText += `Checklist: ${activeChecklist.name}\n`;
    reportText += `Revisão: ${activeChecklist.revision}\n`;
    reportText += `Organização Proprietária: ${selectedOEMName}\n`;
    reportText += `Validador: ${user?.email || 'fornecedor@perspecpack.com'}\n`;
    reportText += `Data de Inspeção: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    reportText += `Status Geral: ${isChecklistCompliant() ? 'CONFORME (APROVADO)' : 'NÃO CONFORME (REPROVADO)'}\n\n`;
    reportText += `REGRAS E ITENS AVALIADOS:\n`;
    reportText += `--------------------------------------------------\n\n`;

    activeChecklist.sections?.forEach((sec, sIdx) => {
      reportText += `Seção ${sIdx + 1}: ${sec.title}\n`;
      sec.criteria?.forEach(crit => {
        const ans = checklistAnswers[crit.id];
        const statusText = ans?.status === 'C' ? 'CONFORME' : ans?.status === 'NC' ? 'NÃO CONFORME' : 'N.A.';
        reportText += `  - [${crit.code}] ${crit.description}\n`;
        reportText += `    Status: ${statusText}\n`;
        if (ans?.note) {
          reportText += `    Observação/Evidência: ${ans.note}\n`;
        }
        reportText += `\n`;
      });
      reportText += `\n`;
    });

    // File generation
    const element = document.createElement("a");
    const file = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_inspecao_${activeChecklist.name.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // Save logs
    logUpload(selectedOEM, `Relatório de Checklist (${activeChecklist.name})`, `relatorio_inspecao_${activeChecklist.name.toLowerCase().replace(/\s+/g, '_')}.txt`);

    setShowReportSuccessModal(true);
  };

  // Helper to render static vector logos or abbreviations
  const renderOEMLogo = (name: string, logoUrl?: string, large?: boolean) => {
    if (logoUrl) {
      return <img src={logoUrl} alt={name} className={large ? "h-28 w-56 object-contain" : "h-16 w-32 object-contain"} />;
    }

    const n = name.toLowerCase();
    if (n.includes('volkswagen') || n === 'vw') {
      return <div className={cn("font-bold font-serif text-blue-900 border-4 border-blue-900 rounded-full flex items-center justify-center bg-blue-50/50", large ? "text-5xl w-24 h-24 border-[5px]" : "text-3xl w-16 h-16")}>W</div>;
    }
    if (n.includes('hyundai')) {
      return <div className={cn("font-serif italic text-blue-800 font-black", large ? "text-6xl" : "text-3xl")}>H</div>;
    }
    if (n.includes('nissan')) {
      return <div className={cn("font-bold border-2 border-gray-800 rounded-full bg-slate-50 tracking-wider text-center", large ? "text-2xl px-6 py-2 border-[3px]" : "text-[14px] px-3 py-1")}>NISSAN</div>;
    }
    if (n.includes('renault')) {
      return <div className={cn("border-4 border-yellow-500 transform rotate-45 bg-yellow-50/20 shrink-0", large ? "w-12 h-18 border-[5px]" : "w-8 h-12")}></div>;
    }
    if (n.includes('scania')) {
      return <div className={cn("font-black text-red-600 tracking-wide border-b-2 border-red-600", large ? "text-3xl border-b-[3px]" : "text-lg")}>SCANIA</div>;
    }
    if (n.includes('gestamp')) {
      return <div className={cn("font-bold text-blue-700 tracking-tighter uppercase", large ? "text-3xl" : "text-lg")}>Gestamp</div>;
    }

    return <div className={cn("font-black text-slate-700 uppercase bg-slate-100 rounded", large ? "text-4xl px-6 py-3" : "text-2xl px-4 py-2")}>{name.substring(0, 2)}</div>;
  };

  // Global search compiler
  const searchResults = (() => {
    if (!searchQuery) return null;
    const query = searchQuery.toLowerCase().trim();
    
    const matchedComponents = components.filter(c => 
      c.status === 'active' && 
      (c.name.toLowerCase().includes(query) || (c.description && c.description.toLowerCase().includes(query)) || (c.application && c.application.toLowerCase().includes(query)))
    );

    const matchedDocuments = documents.filter(d => 
      d.status === 'active' && 
      (d.title.toLowerCase().includes(query) || (d.description && d.description.toLowerCase().includes(query)))
    );

    const matchedStandards = standards.filter(s => 
      s.status === 'active' && 
      (s.title.toLowerCase().includes(query) || (s.description && s.description.toLowerCase().includes(query)))
    );

    const matchedChecklists = checklists.filter(c => 
      c.status === 'active' && 
      c.name.toLowerCase().includes(query)
    );

    return {
      components: matchedComponents,
      documents: matchedDocuments,
      standards: matchedStandards,
      checklists: matchedChecklists,
      total: matchedComponents.length + matchedDocuments.length + matchedStandards.length + matchedChecklists.length
    };
  })();

  // Main navigation helper
  const handleOrgClick = (orgId: string) => {
    setSelectedOEM(orgId);
    setStep('module_selection');
  };

  const handleModuleClick = (moduleType: ModuleType) => {
    setSelectedModule(moduleType);
    setStep('content_view');
  };

  return (
    <div className="space-y-6 font-sans">

      {/* GLOBAL SEARCH VIEW */}
      {searchQuery && searchResults && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-[18px] font-extrabold text-slate-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-teal-600" />
                <span>Resultados da Pesquisa</span>
              </h2>
              <p className="text-slate-500 text-[12px] mt-0.5">
                Encontramos {searchResults.total} item(ns) correspondentes a "{searchQuery}"
              </p>
            </div>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {searchResults.total === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium text-sm italic">
              Nenhum componente, norma, documento ou checklist corresponde aos termos pesquisados.
            </div>
          ) : (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* Components Results */}
              {searchResults.components.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <span>Componentes Homologados ({searchResults.components.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.components.map(comp => {
                      const orgName = organizations.find(o => o.id === comp.organizationId)?.name || 'N/A';
                      return (
                        <div key={comp.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex justify-between items-center gap-3">
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase">
                              {orgName}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1">{comp.name}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{comp.application || comp.description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {comp.stepFileUrl && (
                              <a 
                                href={comp.stepFileUrl}
                                onClick={() => logDownload(comp.organizationId, 'Componente (STEP)', comp.id, comp.stepFileUrl?.split('/').pop() || 'file.step')}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-bold font-mono border border-blue-100"
                              >
                                STEP
                              </a>
                            )}
                            {comp.pdfFileUrl && (
                              <a 
                                href={comp.pdfFileUrl}
                                onClick={() => logDownload(comp.organizationId, 'Componente (PDF)', comp.id, comp.pdfFileUrl?.split('/').pop() || 'file.pdf')}
                                className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded font-bold font-mono border border-red-100"
                              >
                                PDF
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents Results */}
              {searchResults.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Documentações Técnicas ({searchResults.documents.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.documents.map(doc => {
                      const orgName = organizations.find(o => o.id === doc.organizationId)?.name || 'N/A';
                      return (
                        <div key={doc.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex justify-between items-center gap-3">
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase mr-1.5">
                              {orgName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                              {doc.documentType}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1">{doc.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{doc.description}</p>
                          </div>
                          {doc.fileUrl && (
                            <a 
                              href={doc.fileUrl}
                              onClick={() => logDownload(doc.organizationId, 'Documentação Técnica', doc.id, doc.fileName || 'doc.pdf')}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] px-2 py-1.5 rounded font-bold shrink-0 border border-teal-100"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standards Results */}
              {searchResults.standards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Normas e Padrões ({searchResults.standards.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.standards.map(std => {
                      const orgName = organizations.find(o => o.id === std.organizationId)?.name || 'N/A';
                      return (
                        <div key={std.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex justify-between items-center gap-3">
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase mr-1.5">
                              {orgName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                              {std.standardType}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1">{std.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{std.description}</p>
                          </div>
                          {std.fileUrl && (
                            <a 
                              href={std.fileUrl}
                              onClick={() => logDownload(std.organizationId, 'Normas e Padrões', std.id, std.fileName || 'norma.pdf')}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] px-2 py-1.5 rounded font-bold shrink-0 border border-teal-100"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Checklists Results */}
              {searchResults.checklists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>Checklists de Validação ({searchResults.checklists.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.checklists.map(chk => {
                      const orgName = organizations.find(o => o.id === chk.organizationId)?.name || 'N/A';
                      return (
                        <div key={chk.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex justify-between items-center gap-3">
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase">
                              {orgName}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1">{chk.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Revisão: {chk.revision} &bull; {chk.sections?.length || 0} seções</p>
                          </div>
                          <Button 
                            onClick={() => {
                              setSelectedOEM(chk.organizationId);
                              startChecklistExecution(chk);
                              setSearchQuery('');
                            }}
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 h-8 px-3 rounded-lg"
                          >
                            Abrir
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>
      )}

      {/* STEP 1: ORGANIZATION SELECTION */}
      {step === 'org_selection' && !searchQuery && (
        <section className="space-y-8 animate-in fade-in duration-250">
          <div className="text-center md:text-left">
            <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Selecione uma organização</h2>
            <p className="text-slate-500 text-sm mt-1">Escolha a organização cujos padrões deseja consultar.</p>
          </div>

          {activeOems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium">
              Nenhuma organização ativa disponível. Cadastre no painel master.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOems.map((org) => {
                return (
                  <button
                    key={org.id}
                    onClick={() => handleOrgClick(org.id)}
                    className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg shadow-sm cursor-pointer group min-h-[260px] gap-6"
                  >
                    <div className="h-32 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                      {renderOEMLogo(org.name, org.logoUrl, true)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[13px] text-slate-700 group-hover:text-teal-600 transition-colors">
                        {org.name}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* STEP 2: MODULE SELECTION */}
      {step === 'module_selection' && !searchQuery && selectedOEMObj && (
        <section className="space-y-8 animate-in fade-in duration-200">
          {/* Breadcrumbs / Back button */}
          <button 
            onClick={() => setStep('org_selection')}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Organizações</span>
          </button>

          <div className="space-y-1">
            <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
              {selectedOEMName}
            </h2>
            <p className="text-slate-500 text-sm">
              {selectedOEMObj.description || `Diretrizes e padrões da rede de fornecedores ${selectedOEMName}.`}
            </p>
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Módulos Disponíveis</h3>

          {activeModules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium">
              Nenhum módulo ativo cadastrado para esta organização.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeModules.map((mod) => {
                const info = MODULE_INFO[mod.moduleType];
                if (!info) return null;

                const IconComponent = info.icon;
                const recordCount = getRecordCount(mod.moduleType);

                return (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleClick(mod.moduleType)}
                    className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-6 flex flex-col justify-between text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg shadow-sm cursor-pointer group h-52"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-[#00F59B]/10 group-hover:text-teal-700 transition-colors">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-[15px] text-slate-900 group-hover:text-teal-600 transition-colors">
                          {info.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">
                          {info.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full w-fit">
                      {recordCount} {recordCount === 1 ? 'item' : 'itens'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* STEP 3: CONTENT VIEW */}
      {step === 'content_view' && !searchQuery && selectedOEMObj && (
        <section className="space-y-6 animate-in fade-in duration-200">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
            <button onClick={() => setStep('org_selection')} className="hover:text-teal-600 transition-colors">
              Organizações
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => setStep('module_selection')} className="hover:text-teal-600 transition-colors">
              {selectedOEMName}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-teal-600">{MODULE_INFO[selectedModule]?.title}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {(() => {
                  const Icon = MODULE_INFO[selectedModule]?.icon || Layers;
                  return <Icon className="w-6 h-6 text-teal-600" />;
                })()}
                <span>{MODULE_INFO[selectedModule]?.title} &mdash; {selectedOEMName}</span>
              </h2>
            </div>
          </div>

          {/* MODULE: COMPONENTES HOMOLOGADOS */}
          {selectedModule === 'components' && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Category sidebar list */}
              <div className="w-full lg:w-[240px] bg-white border border-slate-200 rounded-xl p-3 shrink-0 shadow-sm space-y-1">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase px-3.5 py-2 tracking-wider">
                  Categorias
                </span>
                {['Rodízios', 'Engates', 'Porta Etiquetas', 'Travas', 'Cantoneiras', 'Skids', 'Acessórios'].map(cat => {
                  const itemsCount = components.filter(c => 
                    c.organizationId === selectedOEM && 
                    c.status === 'active' && 
                    getComponentCategory(c.name) === cat
                  ).length;
                  const isActive = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold flex justify-between items-center transition-all",
                        isActive 
                          ? "bg-teal-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span>{cat}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Table side */}
              <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px]">Imagem</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Nome</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Código/Ref</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Descrição</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[200px]">Arquivos CAD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filteredList = components.filter(c => 
                        c.organizationId === selectedOEM && 
                        c.status === 'active' && 
                        getComponentCategory(c.name) === selectedCategory
                      );

                      if (filteredList.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} className="h-28 text-center text-slate-400 font-medium italic">
                              Nenhum componente cadastrado nesta categoria.
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredList.map(comp => (
                        <TableRow key={comp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="align-middle">
                            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                              {comp.imageUrl ? (
                                <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                              ) : (
                                <Layers className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle font-bold text-[13px] text-slate-900">{comp.name}</TableCell>
                          <TableCell className="align-middle text-[12px] text-slate-500 font-bold font-mono uppercase">{comp.id.substring(0, 8)}</TableCell>
                          <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{comp.revision}</TableCell>
                          <TableCell className="align-middle text-[13px] text-slate-500 leading-normal">{comp.application || comp.description || '-'}</TableCell>
                          <TableCell className="align-middle">
                            <div className="flex gap-1.5">
                              {comp.stepFileUrl && (
                                <a 
                                  href={comp.stepFileUrl}
                                  onClick={() => logDownload(comp.organizationId, 'Componente (STEP)', comp.id, comp.stepFileUrl?.split('/').pop() || 'file.step')}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-750 text-[10px] px-2 py-1 rounded font-bold font-mono border border-blue-100"
                                >
                                  STEP
                                </a>
                              )}
                              {comp.pdfFileUrl && (
                                <a 
                                  href={comp.pdfFileUrl}
                                  onClick={() => logDownload(comp.organizationId, 'Componente (PDF)', comp.id, comp.pdfFileUrl?.split('/').pop() || 'file.pdf')}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="bg-red-50 hover:bg-red-100 text-red-750 text-[10px] px-2 py-1 rounded font-bold font-mono border border-red-100"
                                >
                                  PDF
                                </a>
                              )}
                              {comp.dwgFileUrl && (
                                <a 
                                  href={comp.dwgFileUrl}
                                  onClick={() => logDownload(comp.organizationId, 'Componente (DWG)', comp.id, comp.dwgFileUrl?.split('/').pop() || 'file.dwg')}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded font-bold font-mono border border-amber-100"
                                >
                                  DWG
                                </a>
                              )}
                              {!comp.stepFileUrl && !comp.pdfFileUrl && !comp.dwgFileUrl && (
                                <span className="text-xs text-slate-400 italic">Indisponível</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* MODULE: DOCUMENTAÇÃO TÉCNICA */}
          {selectedModule === 'documentation' && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Category sidebar list */}
              <div className="w-full lg:w-[240px] bg-white border border-slate-200 rounded-xl p-3 shrink-0 shadow-sm space-y-1">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase px-3.5 py-2 tracking-wider">
                  Categorias
                </span>
                {['Cadernos de Encargos', 'Normas Internas', 'Padrões Logísticos', 'Manuais Técnicos', 'Procedimentos'].map(cat => {
                  const itemsCount = documents.filter(d => 
                    d.organizationId === selectedOEM && 
                    d.status === 'active' && 
                    getDocumentCategory(d) === cat
                  ).length;
                  const isActive = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold flex justify-between items-center transition-all",
                        isActive 
                          ? "bg-teal-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span>{cat}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Table side */}
              <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Documento</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Descrição</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-right pr-6">Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filteredList = documents.filter(d => 
                        d.organizationId === selectedOEM && 
                        d.status === 'active' && 
                        getDocumentCategory(d) === selectedCategory
                      );

                      if (filteredList.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="h-28 text-center text-slate-400 font-medium italic">
                              Nenhum documento cadastrado nesta categoria.
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredList.map(doc => (
                        <TableRow key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="align-middle">
                            <span className="font-bold text-[13px] text-slate-900 block">{doc.title}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 block">{doc.documentType}</span>
                          </TableCell>
                          <TableCell className="align-middle text-[13px] text-slate-500">{doc.description || '-'}</TableCell>
                          <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{doc.revision}</TableCell>
                          <TableCell className="align-middle text-right pr-6">
                            {doc.fileUrl ? (
                              <a 
                                href={doc.fileUrl}
                                onClick={() => logDownload(doc.organizationId, 'Documentação Técnica', doc.id, doc.fileName || 'file.pdf')}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 w-8 p-0 rounded-md">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Indisponível</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* MODULE: NORMAS E PADRÕES */}
          {selectedModule === 'standards' && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Category sidebar list */}
              <div className="w-full lg:w-[240px] bg-white border border-slate-200 rounded-xl p-3 shrink-0 shadow-sm space-y-1">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase px-3.5 py-2 tracking-wider">
                  Agrupamentos
                </span>
                {['Estrutura', 'Empilhamento', 'Ergonomia', 'AGV', 'Rodízios', 'Identificação', 'Segurança', 'Movimentação'].map(cat => {
                  const itemsCount = standards.filter(s => 
                    s.organizationId === selectedOEM && 
                    s.status === 'active' && 
                    getStandardCategory(s) === cat
                  ).length;
                  const isActive = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold flex justify-between items-center transition-all",
                        isActive 
                          ? "bg-teal-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span>{cat}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Table side */}
              <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Norma / Diretriz</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Referência Técnica</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Descrição</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                      <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-right pr-6">Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filteredList = standards.filter(s => 
                        s.organizationId === selectedOEM && 
                        s.status === 'active' && 
                        getStandardCategory(s) === selectedCategory
                      );

                      if (filteredList.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={5} className="h-28 text-center text-slate-400 font-medium italic">
                              Nenhuma norma cadastrada neste agrupamento.
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredList.map(std => (
                        <TableRow key={std.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="align-middle">
                            <span className="font-bold text-[13px] text-slate-900 block">{std.title}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 block">{std.standardType || 'Norma de Engenharia'}</span>
                          </TableCell>
                          <TableCell className="align-middle text-[13px] text-slate-600 font-mono font-bold">{std.referenceDocument || '-'}</TableCell>
                          <TableCell className="align-middle text-[13px] text-slate-500">{std.description || '-'}</TableCell>
                          <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{std.revision}</TableCell>
                          <TableCell className="align-middle text-right pr-6">
                            {std.fileUrl ? (
                              <a 
                                href={std.fileUrl}
                                onClick={() => logDownload(std.organizationId, 'Normas e Padrões', std.id, std.fileName || 'norma.pdf')}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 w-8 p-0 rounded-md">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Indisponível</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* MODULE: CHECKLISTS DE VALIDAÇÃO */}
          {selectedModule === 'checklists' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Modelo de Checklist</TableHead>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Requisitos de Conformidade</TableHead>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[180px] text-right pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredList = checklists.filter(c => 
                      c.organizationId === selectedOEM && 
                      c.status === 'active'
                    );

                    if (filteredList.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center text-slate-400 font-medium italic">
                            Nenhum checklist disponível para esta organização.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredList.map(chk => (
                      <TableRow key={chk.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="align-middle font-bold text-[13px] text-slate-900">{chk.name}</TableCell>
                        <TableCell className="align-middle text-[13px] text-slate-500">
                          {chk.sections?.reduce((sum, s) => sum + (s.criteria?.length || 0), 0) || 0} critérios técnicos de inspeção
                        </TableCell>
                        <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{chk.revision}</TableCell>
                        <TableCell className="align-middle text-right pr-6">
                          <Button 
                            onClick={() => startChecklistExecution(chk)}
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 px-4 rounded-lg text-xs flex gap-1 items-center ml-auto"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>Executar Inspeção</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          )}

          {/* MODULE: PROJETOS DE REFERÊNCIA */}
          {selectedModule === 'reference_projects' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px]">Imagem</TableHead>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Projeto</TableHead>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Descrição</TableHead>
                    <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[150px]">Arquivos Disponíveis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredList = referenceProjects.filter(p => 
                      p.organizationId === selectedOEM && 
                      p.status === 'active'
                    );

                    if (filteredList.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center text-slate-400 font-medium italic">
                            Nenhum projeto de referência cadastrado.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredList.map(proj => (
                      <TableRow key={proj.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="align-middle">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                            {proj.imageUrl ? (
                              <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />
                            ) : (
                              <FolderKanban className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle font-bold text-[13px] text-slate-900">{proj.name}</TableCell>
                        <TableCell className="align-middle text-[13px] text-slate-500">{proj.description || '-'}</TableCell>
                        <TableCell className="align-middle">
                          {proj.attachmentUrl ? (
                            <a 
                              href={proj.attachmentUrl}
                              onClick={() => logDownload(proj.organizationId, 'Projeto de Referência', proj.id, proj.attachmentName || 'anexo.zip')}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-teal-55 hover:bg-teal-100 text-teal-700 text-[10px] px-2.5 py-1 rounded font-bold border border-teal-100 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{proj.attachmentType || 'ANEXO'}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Nenhum anexo</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          )}

        </section>
      )}

      {/* STEP 4: INTERACTIVE CHECKLIST EXECUTION */}
      {step === 'checklist_execution' && !searchQuery && activeChecklist && (
        <section className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header/Back Link */}
          <button 
            onClick={() => setStep('content_view')}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista de Checklists</span>
          </button>

          {/* Checklist Metadata header */}
          <div className="bg-[#06242c] text-white p-6 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <span className="bg-teal-500/20 text-[#00F59B] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
                  Validação de Embalagem &bull; Rev. {activeChecklist.revision}
                </span>
                <h2 className="text-[22px] font-extrabold tracking-tight">{activeChecklist.name}</h2>
                <p className="text-slate-300 text-xs">
                  Responda a todos os requisitos de inspeção da {selectedOEMName} para emitir o relatório de conformidade.
                </p>
              </div>

              {/* Progress and status */}
              <div className="flex items-center gap-4 bg-teal-950/40 p-4 rounded-xl border border-teal-900/40 shrink-0 w-full md:w-auto">
                <div className="space-y-1 flex-1 md:flex-initial">
                  <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                    Progresso Geral
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-teal-950/80 rounded-full h-2 overflow-hidden border border-teal-900">
                      <div 
                        className="bg-[#00F59B] h-full transition-all duration-300"
                        style={{ width: `${getChecklistProgress()}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-xs text-white">{getChecklistProgress()}%</span>
                  </div>
                </div>

                <div className="border-l border-teal-900/60 pl-4 space-y-0.5 shrink-0">
                  <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                    Status Atual
                  </span>
                  {isChecklistCompliant() ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Conforme
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-400 bg-rose-950/60 border border-rose-900/60 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> NC Pendente
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Form List of sections */}
          <div className="space-y-6">
            {activeChecklist.sections?.map((sec, sIdx) => (
              <div key={sec.id || sIdx} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-extrabold text-[14px] text-slate-800">
                    Seção {sIdx + 1}: {sec.title}
                  </h3>
                  <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold font-mono">
                    {sec.criteria?.length || 0} requisitos
                  </Badge>
                </div>

                <div className="divide-y divide-slate-150">
                  {sec.criteria?.map((crit, cIdx) => {
                    const ans = checklistAnswers[crit.id] || { status: 'C', note: '' };

                    return (
                      <div key={crit.id || cIdx} className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-slate-50/20 transition-colors">
                        {/* Criterion info */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                              {crit.code}
                            </span>
                            {crit.required && (
                              <span className="text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.2 rounded uppercase">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-slate-850 font-bold leading-normal">
                            {crit.description}
                          </p>
                          {crit.reference && (
                            <p className="text-[11px] text-slate-450 font-medium">
                              <span className="font-extrabold">Referência:</span> {crit.reference}
                            </p>
                          )}

                          {/* Notes/Evidences input */}
                          <div className="pt-2">
                            <input 
                              type="text"
                              placeholder="Adicionar observações técnicas ou link de imagem de evidência..."
                              value={ans.note}
                              onChange={(e) => setChecklistAnswers({
                                ...checklistAnswers,
                                [crit.id]: { ...ans, note: e.target.value }
                              })}
                              className="w-full max-w-lg px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        {/* Conformance selector chips */}
                        <div className="flex gap-1.5 shrink-0 self-start lg:pt-1">
                          <button
                            onClick={() => setChecklistAnswers({
                              ...checklistAnswers,
                              [crit.id]: { ...ans, status: 'C' }
                            })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1",
                              ans.status === 'C'
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-extrabold shadow-sm"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Conforme</span>
                          </button>

                          <button
                            onClick={() => setChecklistAnswers({
                              ...checklistAnswers,
                              [crit.id]: { ...ans, status: 'NC' }
                            })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1",
                              ans.status === 'NC'
                                ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold shadow-sm"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Não Conforme</span>
                          </button>

                          <button
                            onClick={() => setChecklistAnswers({
                              ...checklistAnswers,
                              [crit.id]: { ...ans, status: 'NA' }
                            })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1",
                              ans.status === 'NA'
                                ? "bg-slate-100 border-slate-300 text-slate-700 font-extrabold shadow-sm"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            <span>N.A.</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action footer */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left text-xs text-slate-450 font-medium">
              Ao concluir, clique no botão ao lado para baixar o relatório final e registrar a auditoria.
            </div>
            <div className="flex gap-3 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                onClick={() => setStep('content_view')}
                className="w-full sm:w-auto text-xs font-semibold h-10 px-5 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExportChecklistReport}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5 justify-center"
              >
                <FileDown className="w-4.5 h-4.5" />
                <span>Gerar Relatório & Salvar</span>
              </Button>
            </div>
          </div>

        </section>
      )}

      {/* SUCCESS MODAL FOR REPORT */}
      {showReportSuccessModal && activeChecklist && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[18px] font-extrabold text-slate-900">Relatório Salvo com Sucesso!</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed">
                O arquivo de auditoria conformidade para o checklist <strong>{activeChecklist.name}</strong> foi gerado e baixado localmente.
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                O upload do registro foi auditado com sucesso na central de controle administratriva.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowReportSuccessModal(false);
                setStep('content_view');
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 px-6 rounded-xl w-full"
            >
              Concluir
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
