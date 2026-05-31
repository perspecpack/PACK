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
  Info,
  Eye
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

const MODULE_CONFIGS: Record<string, {
  title: string;
  desc: string;
  emoji: string;
  labelSingular: string;
  labelPlural: string;
  colorClasses: {
    border: string;
    borderHover: string;
    bgIcon: string;
    textIcon: string;
    textTitleHover: string;
    bgCounter: string;
    textCounter: string;
    shadowHover: string;
    glowBg: string;
  };
  futureThumbnailType: 'component' | 'document' | 'standard' | 'checklist';
}> = {
  components: {
    title: 'Componentes Homologados',
    desc: 'Peças, rodízios, engates, travas e componentes aprovados.',
    emoji: '📦',
    labelSingular: 'Componente',
    labelPlural: 'Componentes',
    colorClasses: {
      border: 'border-orange-100/70',
      borderHover: 'hover:border-orange-400',
      bgIcon: 'bg-orange-50 border-orange-200/50',
      textIcon: 'text-orange-600',
      textTitleHover: 'group-hover:text-orange-600',
      bgCounter: 'bg-orange-50/70 border-orange-100',
      textCounter: 'text-orange-700',
      shadowHover: 'hover:shadow-[0_12px_30px_rgba(249,115,22,0.08)]',
      glowBg: 'bg-orange-500',
    },
    futureThumbnailType: 'component'
  },
  documentation: {
    title: 'Documentação Técnica',
    desc: 'Cadernos de encargos, manuais e documentos oficiais.',
    emoji: '📄',
    labelSingular: 'Documento',
    labelPlural: 'Documentos',
    colorClasses: {
      border: 'border-blue-100/70',
      borderHover: 'hover:border-blue-400',
      bgIcon: 'bg-blue-50 border-blue-200/50',
      textIcon: 'text-blue-600',
      textTitleHover: 'group-hover:text-blue-600',
      bgCounter: 'bg-blue-50/70 border-blue-100',
      textCounter: 'text-blue-700',
      shadowHover: 'hover:shadow-[0_12px_30px_rgba(59,130,246,0.08)]',
      glowBg: 'bg-blue-500',
    },
    futureThumbnailType: 'document'
  },
  standards: {
    title: 'Normas e Padrões',
    desc: 'Critérios de projeto, empilhamento, AGV e logística.',
    emoji: '🛡️',
    labelSingular: 'Norma',
    labelPlural: 'Normas',
    colorClasses: {
      border: 'border-purple-100/70',
      borderHover: 'hover:border-purple-400',
      bgIcon: 'bg-purple-50 border-purple-200/50',
      textIcon: 'text-purple-600',
      textTitleHover: 'group-hover:text-purple-600',
      bgCounter: 'bg-purple-50/70 border-purple-100',
      textCounter: 'text-purple-700',
      shadowHover: 'hover:shadow-[0_12px_30px_rgba(168,85,247,0.08)]',
      glowBg: 'bg-purple-500',
    },
    futureThumbnailType: 'standard'
  },
  checklists: {
    title: 'Checklists de Validação',
    desc: 'Validação de conformidade e geração de relatórios.',
    emoji: '✅',
    labelSingular: 'Checklist',
    labelPlural: 'Checklists',
    colorClasses: {
      border: 'border-emerald-100/70',
      borderHover: 'hover:border-emerald-400',
      bgIcon: 'bg-emerald-50 border-emerald-200/50',
      textIcon: 'text-emerald-600',
      textTitleHover: 'group-hover:text-emerald-600',
      bgCounter: 'bg-emerald-50/70 border-emerald-100',
      textCounter: 'text-emerald-700',
      shadowHover: 'hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)]',
      glowBg: 'bg-emerald-500',
    },
    futureThumbnailType: 'checklist'
  }
};

const ORG_TYPE_LABELS: Record<string, string> = {
  oem: 'Montadora OEM',
  component_manufacturer: 'Fabricante de Componentes',
  packaging_supplier: 'Fornecedor Tier 1',
  packaging_manufacturer: 'Fabricante de Embalagens'
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

  const { searchQuery, setSearchQuery, resetTrigger } = useOutletContext<{ searchQuery: string; setSearchQuery: (q: string) => void; resetTrigger: number }>();

  // Steps: 'org_selection' | 'module_selection' | 'content_view' | 'checklist_execution'
  const [step, setStep] = useState<'org_selection' | 'module_selection' | 'content_view' | 'checklist_execution'>('org_selection');
  const [selectedOEM, setSelectedOEM] = useState<string>('');
  const [selectedItemForModal, setSelectedItemForModal] = useState<{
    type: 'component' | 'document' | 'standard';
    data: any;
  } | null>(null);

  useEffect(() => {
    if (resetTrigger > 0) {
      setStep('org_selection');
      setSelectedOEM('');
      setSelectedModule('components');
      setActiveChecklist(null);
      setSelectedItemForModal(null);
    }
  }, [resetTrigger]);
  const [selectedModule, setSelectedModule] = useState<ModuleType>('components');
  
  // Checklist Execution state
  const [activeChecklist, setActiveChecklist] = useState<ChecklistTemplate | null>(null);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, { status: 'C' | 'NC' | 'NA'; note: string }>>({});
  const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);

  const activeOems = organizations.filter(o => o.status === 'active');
  const selectedOEMObj = activeOems.find(o => o.id === selectedOEM);
  const selectedOEMName = selectedOEMObj?.name || '';

  // Get active modules for selected OEM (only components, documentation, standards, checklists)
  const allowedModules = ['components', 'documentation', 'standards', 'checklists'];
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
              Biblioteca oficial de padrões, componentes homologados, documentação técnica e critérios de validação.
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
                const config = MODULE_CONFIGS[mod.moduleType as keyof typeof MODULE_CONFIGS];
                if (!config) return null;

                const recordCount = getRecordCount(mod.moduleType);
                const counterText = `${recordCount} ${recordCount === 1 ? config.labelSingular : config.labelPlural}`;

                return (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleClick(mod.moduleType)}
                    className={cn(
                      "bg-white border rounded-2xl p-8 flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-md cursor-pointer group h-[260px] relative overflow-hidden",
                      config.colorClasses.border,
                      config.colorClasses.borderHover,
                      config.colorClasses.shadowHover
                    )}
                  >
                    {/* PREPARAÇÃO PARA O FUTURO: Estrutura para imagem de fundo discreta */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.015] transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-transparent to-black" />
                    <div className={cn("absolute -right-12 -top-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none", config.colorClasses.glowBg)} />

                    {/* PREPARAÇÃO PARA O FUTURO: Espaço reservado para Thumbnails (Componente, Documento ou Checklist) */}
                    {/* 
                    <div className="absolute right-4 top-4 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
                      {config.futureThumbnailType === 'component' && <div className="border border-dashed border-slate-300 w-full h-full rounded" />}
                      {config.futureThumbnailType === 'document' && <div className="border border-dashed border-slate-300 w-full h-full rounded" />}
                      {config.futureThumbnailType === 'standard' && <div className="border border-dashed border-slate-300 w-full h-full rounded" />}
                      {config.futureThumbnailType === 'checklist' && <div className="border border-dashed border-slate-300 w-full h-full rounded" />}
                    </div> 
                    */}

                    <div className="space-y-4 relative z-10">
                      <div className={cn("w-14 h-14 border rounded-2xl flex items-center justify-center text-[26px] shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0", config.colorClasses.bgIcon)}>
                        {config.emoji}
                      </div>
                      <div className="space-y-2">
                        <h4 className={cn("font-extrabold text-[17px] text-slate-900 transition-colors duration-250", config.colorClasses.textTitleHover)}>
                          {config.title}
                        </h4>
                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                          {config.desc}
                        </p>
                      </div>
                    </div>
                    
                    <span className={cn("text-[11.5px] font-bold px-3 py-1 rounded-full w-fit border relative z-10 transition-colors shadow-inner", config.colorClasses.bgCounter, config.colorClasses.textCounter)}>
                      {counterText}
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
            <div className="w-full">
              {(() => {
                const filteredList = components.filter(c => 
                  c.organizationId === selectedOEM && 
                  c.status === 'active'
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium italic shadow-sm">
                      Nenhum componente cadastrado para esta organização.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
                    {filteredList.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => setSelectedItemForModal({ type: 'component', data: comp })}
                        className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                            {comp.imageUrl ? (
                              <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <Layers className="w-10 h-10 text-slate-300 group-hover:scale-105 transition-transform duration-300" />
                            )}
                            <div className="absolute top-2 right-2">
                              <span className="bg-slate-900/60 backdrop-blur-sm text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                REV {comp.revision}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-[13px] text-slate-850 line-clamp-1 group-hover:text-teal-650 transition-colors">
                              {comp.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {comp.application || comp.description || 'Sem descrição adicional.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono text-[10px] font-bold uppercase">
                            COD: {comp.id.substring(0, 8)}
                          </span>
                          <span className="text-teal-600 group-hover:text-teal-750 font-bold flex items-center gap-1 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalhes</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODULE: DOCUMENTAÇÃO TÉCNICA */}
          {selectedModule === 'documentation' && (
            <div className="w-full">
              {(() => {
                const filteredList = documents.filter(d => 
                  d.organizationId === selectedOEM && 
                  d.status === 'active'
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium italic shadow-sm">
                      Nenhum documento cadastrado para esta organização.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
                    {filteredList.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedItemForModal({ type: 'document', data: doc })}
                        className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                              <FileText className="w-6 h-6 text-teal-600" />
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="bg-slate-900/60 backdrop-blur-sm text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                REV {doc.revision}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-[13px] text-slate-850 line-clamp-1 group-hover:text-teal-650 transition-colors">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {doc.description || 'Sem descrição adicional.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono text-[10px] font-bold uppercase">
                            {doc.fileName ? doc.fileName.split('.').pop()?.toUpperCase() : 'PDF'}
                          </span>
                          <span className="text-teal-600 group-hover:text-teal-750 font-bold flex items-center gap-1 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalhes</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODULE: NORMAS E PADRÕES */}
          {selectedModule === 'standards' && (
            <div className="w-full">
              {(() => {
                const filteredList = standards.filter(s => 
                  s.organizationId === selectedOEM && 
                  s.status === 'active'
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium italic shadow-sm">
                      Nenhuma norma cadastrada para esta organização.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
                    {filteredList.map(std => (
                      <div 
                        key={std.id}
                        onClick={() => setSelectedItemForModal({ type: 'standard', data: std })}
                        className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                              <ShieldCheck className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="bg-slate-900/60 backdrop-blur-sm text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                REV {std.revision}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-[13px] text-slate-850 line-clamp-1 group-hover:text-teal-650 transition-colors">
                              {std.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {std.description || 'Sem descrição adicional.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono text-[10px] font-bold uppercase">
                            {std.referenceDocument || 'REF: N/A'}
                          </span>
                          <span className="text-teal-600 group-hover:text-teal-750 font-bold flex items-center gap-1 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalhes</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODULE: CHECKLISTS DE VALIDAÇÃO */}
          {selectedModule === 'checklists' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
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
      {/* ITEM DETAILS MODAL */}
      {selectedItemForModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItemForModal(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row h-auto max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedItemForModal(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Media Preview */}
            <div className="w-full md:w-1/2 bg-slate-50/50 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-150 relative min-h-[280px] md:min-h-[450px]">
              {selectedItemForModal.type === 'component' ? (
                selectedItemForModal.data.imageUrl ? (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <img 
                      src={selectedItemForModal.data.imageUrl} 
                      alt={selectedItemForModal.data.name} 
                      className="max-w-full max-h-[350px] object-contain rounded-2xl shadow-md border border-slate-200 bg-white" 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                      <Layers className="w-10 h-10 text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold">Imagem não disponível</span>
                  </div>
                )
              ) : selectedItemForModal.type === 'document' ? (
                <div className="flex flex-col items-center justify-center gap-4 text-teal-600">
                  <div className="w-24 h-24 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-inner">
                    <FileText className="w-12 h-12 text-teal-600 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-550 uppercase tracking-widest bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                    {selectedItemForModal.data.documentType}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-purple-600">
                  <div className="w-24 h-24 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-12 h-12 text-purple-600 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-550 uppercase tracking-widest bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
                    {selectedItemForModal.data.standardType || 'Norma'}
                  </span>
                </div>
              )}
            </div>

            {/* Right Side: Technical Specs & Download */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
              <div className="space-y-6">
                {/* Rev */}
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 border border-slate-200 text-slate-650 font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    REV {selectedItemForModal.data.revision}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-[20px] font-extrabold text-slate-900 leading-snug">
                    {selectedItemForModal.type === 'component' ? selectedItemForModal.data.name : selectedItemForModal.data.title}
                  </h3>
                  <span className="text-slate-400 font-mono text-[11px] font-bold block mt-1 uppercase">
                    ID: {selectedItemForModal.data.id}
                  </span>
                </div>

                {/* Technical Information Table */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3.5 text-xs">
                  {selectedItemForModal.type === 'component' && (
                    <>
                      {selectedItemForModal.data.application && (
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-slate-450 uppercase text-[9px] tracking-wider">Aplicação</span>
                          <span className="text-slate-800 font-semibold">{selectedItemForModal.data.application}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-slate-450 uppercase text-[9px] tracking-wider">Organização</span>
                        <span className="text-slate-800 font-semibold">{selectedOEMName}</span>
                      </div>
                    </>
                  )}

                  {selectedItemForModal.type === 'document' && (
                    <>
                      {selectedItemForModal.data.fileName && (
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-slate-450 uppercase text-[9px] tracking-wider">Nome do Arquivo</span>
                          <span className="text-slate-800 font-mono font-semibold truncate" title={selectedItemForModal.data.fileName}>
                            {selectedItemForModal.data.fileName}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {selectedItemForModal.type === 'standard' && (
                    <>
                      {selectedItemForModal.data.referenceDocument && (
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-slate-450 uppercase text-[9px] tracking-wider">Referência Técnica</span>
                          <span className="text-slate-800 font-mono font-bold">{selectedItemForModal.data.referenceDocument}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Description */}
                {((selectedItemForModal.data.description && selectedItemForModal.data.description !== '-') || (selectedItemForModal.data.application && selectedItemForModal.type !== 'component')) && (
                  <div className="space-y-1.5">
                    <span className="font-extrabold text-slate-450 uppercase text-[9px] tracking-wider block">Descrição Detalhada</span>
                    <p className="text-[13px] text-slate-650 leading-relaxed font-medium">
                      {selectedItemForModal.data.description || selectedItemForModal.data.application}
                    </p>
                  </div>
                )}
              </div>

              {/* Downloads Actions */}
              <div className="mt-8 pt-6 border-t border-slate-150 space-y-3">
                <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                  Arquivos para Download
                </span>

                {selectedItemForModal.type === 'component' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {selectedItemForModal.data.stepFileUrl ? (
                      <a 
                        href={selectedItemForModal.data.stepFileUrl}
                        onClick={() => logDownload(selectedItemForModal.data.organizationId, 'Componente (STEP)', selectedItemForModal.data.id, selectedItemForModal.data.stepFileUrl?.split('/').pop() || 'file.step')}
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center min-h-[50px] w-full"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>STEP 3D</span>
                      </a>
                    ) : (
                      <button disabled className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold py-2 px-3 rounded-xl flex flex-col items-center justify-center cursor-not-allowed text-center min-h-[50px] w-full">
                        <span>STEP 3D</span>
                        <span className="text-[9px] text-red-400 font-semibold normal-case mt-0.5">indisponível</span>
                      </button>
                    )}

                    {selectedItemForModal.data.pdfFileUrl ? (
                      <a 
                        href={selectedItemForModal.data.pdfFileUrl}
                        onClick={() => logDownload(selectedItemForModal.data.organizationId, 'Componente (PDF)', selectedItemForModal.data.id, selectedItemForModal.data.pdfFileUrl?.split('/').pop() || 'file.pdf')}
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center min-h-[50px] w-full"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>PDF 2D</span>
                      </a>
                    ) : (
                      <button disabled className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold py-2 px-3 rounded-xl flex flex-col items-center justify-center cursor-not-allowed text-center min-h-[50px] w-full">
                        <span>PDF 2D</span>
                        <span className="text-[9px] text-red-400 font-semibold normal-case mt-0.5">indisponível</span>
                      </button>
                    )}

                    {selectedItemForModal.data.dwgFileUrl ? (
                      <a 
                        href={selectedItemForModal.data.dwgFileUrl}
                        onClick={() => logDownload(selectedItemForModal.data.organizationId, 'Componente (DWG)', selectedItemForModal.data.id, selectedItemForModal.data.dwgFileUrl?.split('/').pop() || 'file.dwg')}
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center min-h-[50px] w-full"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>DWG 2D</span>
                      </a>
                    ) : (
                      <button disabled className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold py-2 px-3 rounded-xl flex flex-col items-center justify-center cursor-not-allowed text-center min-h-[50px] w-full">
                        <span>DWG 2D</span>
                        <span className="text-[9px] text-red-400 font-semibold normal-case mt-0.5">indisponível</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {selectedItemForModal.data.fileUrl ? (
                      <a 
                        href={selectedItemForModal.data.fileUrl}
                        onClick={() => logDownload(
                          selectedItemForModal.data.organizationId, 
                          selectedItemForModal.type === 'document' ? 'Documentação Técnica' : 'Normas e Padrões', 
                          selectedItemForModal.data.id, 
                          selectedItemForModal.data.fileName || 'file.pdf'
                        )}
                        target="_blank" 
                        rel="noreferrer"
                        className={cn(
                          "w-full text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-center border text-white",
                          selectedItemForModal.type === 'document' 
                            ? "bg-teal-600 hover:bg-teal-700 border-teal-700" 
                            : "bg-purple-600 hover:bg-purple-700 border-purple-700"
                        )}
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar Arquivo Oficial ({selectedItemForModal.data.fileName?.split('.').pop()?.toUpperCase() || 'PDF'})</span>
                      </a>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 text-slate-450 p-4 rounded-xl text-center text-xs font-bold">
                        Arquivo não disponível para este item.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
