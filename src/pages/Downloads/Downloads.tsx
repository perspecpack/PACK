import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Building2,
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
  Eye,
  Paperclip,
  Trash2,
  Loader2,
  Sparkles,
  LayoutGrid,
  List,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useApp } from '@/src/context/AppContext';
import { ThreeDViewer } from '@/components/ui/ThreeDViewer';
import { ModuleType, ChecklistTemplate, ComponentEntry, DocumentEntry, StandardEntry } from '@/src/types';
import { jsPDF } from 'jspdf';
import { supabase, uploadFileToStorage } from '@/lib/supabase';
import perspecpackLogo from '@/PERSPECPACK.png';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const MODULE_INFO: Record<ModuleType, { title: string; desc: string; icon: React.ComponentType<any> }> = {
  components: { title: 'Componentes Homologados', desc: 'Biblioteca de partes técnicas e acoplamentos aprovados', icon: Layers },
  documentation: { title: 'Caderno de Encargos', desc: 'Cadernos de encargos, manuais e anexos da engenharia', icon: FileText },
  standards: { title: 'Documentação Técnica', desc: 'Normas de empilhamento, skids, diretrizes de AGV e ergonomia', icon: ShieldCheck },
  checklists: { title: 'Checklist de Validação', desc: 'Templates de inspeção e conformidade física', icon: CheckSquare },
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
    title: 'Caderno de Encargos',
    desc: 'Cadernos de encargos, manuais e anexos da engenharia.',
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
    title: 'Documentação Técnica',
    desc: 'Normas de empilhamento, skids, diretrizes de AGV e ergonomia.',
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
    title: 'Checklist de Validação',
    desc: 'Templates de inspeção e conformidade física.',
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
  const navigate = useNavigate();
  const { 
    organizations, 
    organizationModules, 
    technicalAreas,
    components, 
    documents, 
    standards, 
    checklists, 
    referenceProjects,
    logDownload,
    logPageAccess,
    logUpload,
    user,
    profile
  } = useApp();

  const { searchQuery, setSearchQuery, resetTrigger } = useOutletContext<{ searchQuery: string; setSearchQuery: (q: string) => void; resetTrigger: number }>();

  // Steps: 'org_selection' | 'tech_area_selection' | 'module_selection' | 'content_view' | 'checklist_execution'
  const [step, setStep] = useState<'org_selection' | 'tech_area_selection' | 'module_selection' | 'content_view' | 'checklist_execution'>('org_selection');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handlePremiumDownload = (e: React.MouseEvent) => {
    if (user?.role === 'master' || profile?.planType === 'premium') {
      return;
    }
    e.preventDefault();
    setShowUpgradeModal(true);
  };
  const [selectedOEM, setSelectedOEM] = useState<string>('');
  const [selectedTechnicalArea, setSelectedTechnicalArea] = useState<string>('');
  const [selectedItemForModal, setSelectedItemForModal] = useState<{
    type: 'component' | 'document' | 'standard';
    data: any;
  } | null>(null);

  const [modalMediaTab, setModalMediaTab] = useState<'image' | '3d'>('3d');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (selectedItemForModal && selectedItemForModal.type === 'component') {
      if (selectedItemForModal.data.threeDModelUrl) {
        setModalMediaTab('3d');
      } else {
        setModalMediaTab('image');
      }
    }
  }, [selectedItemForModal]);

  useEffect(() => {
    if (resetTrigger > 0) {
      setStep('org_selection');
      setSelectedOEM('');
      setSelectedTechnicalArea('');
      setSelectedModule('components');
      setActiveChecklist(null);
      setSelectedItemForModal(null);
    }
  }, [resetTrigger]);
  const [selectedModule, setSelectedModule] = useState<ModuleType>('components');
  
  // Checklist Execution state
  const [activeChecklist, setActiveChecklist] = useState<ChecklistTemplate | null>(null);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, { 
    status: 'C' | 'NC' | 'NA' | null; 
    note: string; 
    evidenceUrl?: string;
    evidenceLoading?: boolean;
  }>>({});
  const [headerAnswers, setHeaderAnswers] = useState<Record<string, string>>({});
  const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [generatedValCode, setGeneratedValCode] = useState('');
  const [generatedVerCode, setGeneratedVerCode] = useState('');
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState<boolean[]>([]);

  // Photo upload handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!activeChecklist || !selectedOEMObj) return;

    const files = Array.from(e.target.files);
    
    // Check if adding these files exceeds the limit of 3
    if (evidencePhotos.length + files.length > 3) {
      alert('Você pode anexar no máximo 3 fotos.');
      return;
    }

    for (const file of files) {
      // Validate type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert(`Arquivo "${file.name}" inválido. Apenas fotos nos formatos JPEG, JPG ou PNG são permitidas.`);
        continue;
      }

      // Validate size (2MB = 2097152 bytes)
      if (file.size > 2 * 1024 * 1024) {
        alert(`Arquivo "${file.name}" excede o limite de 2MB.`);
        continue;
      }

      // Upload
      setUploadingPhotos(prev => [...prev, true]);
      try {
        const { publicUrl } = await uploadFileToStorage(
          file,
          'checklist-evidencias',
          selectedOEMObj.slug || 'oem',
          'checklists'
        );

        setEvidencePhotos(prev => [...prev, publicUrl]);
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        alert('Erro ao fazer upload da foto: ' + error.message);
      } finally {
        setUploadingPhotos(prev => {
          const next = [...prev];
          next.pop();
          return next;
        });
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setEvidencePhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const activeOems = organizations.filter(o => o.status === 'active');
  const selectedOEMObj = activeOems.find(o => o.id === selectedOEM);
  const selectedOEMName = selectedOEMObj?.name || '';

  // Get active modules for selected OEM and Technical Area (only components, documentation, standards, checklists)
  const allowedModules = ['components', 'documentation', 'standards', 'checklists'];
  const activeModules = organizationModules
    .filter(m => 
      m.organizationId === selectedOEM && 
      m.technicalAreaId === selectedTechnicalArea &&
      m.enabled && 
      allowedModules.includes(m.moduleType)
    )
    .sort((a, b) => allowedModules.indexOf(a.moduleType) - allowedModules.indexOf(b.moduleType));

  // Helper to get real records count per module scoped to technical area
  const getRecordCount = (moduleType: ModuleType) => {
    switch (moduleType) {
      case 'components': return components.filter(c => c.organizationId === selectedOEM && c.technicalAreaId === selectedTechnicalArea && c.status === 'active').length;
      case 'documentation': return documents.filter(d => d.organizationId === selectedOEM && d.technicalAreaId === selectedTechnicalArea && d.status === 'active').length;
      case 'standards': return standards.filter(s => s.organizationId === selectedOEM && s.technicalAreaId === selectedTechnicalArea && s.status === 'active').length;
      case 'checklists': return checklists.filter(c => c.organizationId === selectedOEM && c.technicalAreaId === selectedTechnicalArea && c.status === 'active').length;
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
    if (!(user?.role === 'master' || profile?.planType === 'premium')) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveChecklist(checklist);
    setEvidencePhotos([]);
    setUploadingPhotos([]);
    
    // Initialize header answers
    const initialHeaderAnswers: Record<string, string> = {};
    if (checklist.headerConfig?.enabled && checklist.headerConfig.fields) {
      checklist.headerConfig.fields.forEach(field => {
        initialHeaderAnswers[field.label] = '';
      });
    }
    setHeaderAnswers(initialHeaderAnswers);

    const initialAnswers: Record<string, { 
      status: 'C' | 'NC' | 'NA' | null; 
      note: string; 
      evidenceUrl?: string;
      evidenceLoading?: boolean;
    }> = {};
    checklist.sections?.forEach(sec => {
      sec.criteria?.forEach(crit => {
        initialAnswers[crit.id] = { status: null, note: '', evidenceUrl: undefined };
      });
    });
    setChecklistAnswers(initialAnswers);
    setStep('checklist_execution');
    logPageAccess(`Fornecedor - Executar Checklist: ${checklist.name}`);
  };

  // Stats helper
  const getChecklistStats = () => {
    let total = 0;
    let conforms = 0;
    let nonConforms = 0;
    let na = 0;
    let pending = 0;

    if (activeChecklist) {
      activeChecklist.sections?.forEach(sec => {
        sec.criteria?.forEach(crit => {
          total++;
          const ans = checklistAnswers[crit.id];
          const status = ans?.status;
          if (!status) {
            pending++;
          } else if (status === 'C') {
            conforms++;
          } else if (status === 'NC') {
            nonConforms++;
          } else if (status === 'NA') {
            na++;
          }
        });
      });
    }

    const progress = total === 0 ? 0 : Math.round(((total - pending) / total) * 100);

    return { total, conforms, nonConforms, na, pending, progress };
  };

  // Status helper
  const getChecklistStatus = () => {
    if (!activeChecklist) return { text: 'PENDENTE', colorClass: 'bg-slate-100 text-slate-700 border-slate-200' };

    let hasMandatoryNC = false;
    let hasOptionalNC = false;
    let hasUnanswered = false;

    activeChecklist.sections?.forEach(sec => {
      sec.criteria?.forEach(crit => {
        const ans = checklistAnswers[crit.id];
        const status = ans?.status;

        if (!status) {
          hasUnanswered = true;
        } else if (status === 'NC') {
          if (crit.required) {
            hasMandatoryNC = true;
          } else {
            hasOptionalNC = true;
          }
        }
      });
    });

    if (hasMandatoryNC) {
      return { 
        text: 'REPROVADO', 
        colorClass: 'bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }

    if (hasUnanswered) {
      return { 
        text: 'PENDENTE', 
        colorClass: 'bg-slate-150 text-slate-700 border-slate-250 hover:bg-slate-200',
        badgeClass: 'bg-slate-200 text-slate-800 border-slate-350'
      };
    }

    if (hasOptionalNC) {
      return { 
        text: 'APROVADO COM RESSALVAS', 
        colorClass: 'bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }

    return { 
      text: 'APROVADO', 
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  };

  const generateValidationCode = () => {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `V-${year}-${randomNumber}`;
  };

  const generateVerificationCode = () => {
    const hex = '0123456789ABCDEF';
    const randBlock = () => Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * 16)]).join('');
    return `${randBlock()}-${randBlock()}-${randBlock()}`;
  };


  const handleOpenConfirmation = () => {
    if (!activeChecklist) return;

    // Validate required header fields
    if (activeChecklist.headerConfig?.enabled && activeChecklist.headerConfig.fields) {
      const missingFields = activeChecklist.headerConfig.fields
        .filter(field => field.required && !headerAnswers[field.label]?.trim());
      
      if (missingFields.length > 0) {
        alert(`Por favor, preencha todos os campos obrigatórios do cabeçalho do projeto:\n- ${missingFields.map(f => f.label).join('\n- ')}`);
        return;
      }
    }

    const currentStatus = getChecklistStatus();
    const stats = getChecklistStats();

    if (stats.pending > 0 && currentStatus.text !== 'REPROVADO') {
      alert(`Existem ${stats.pending} item(ns) pendente(s) de resposta. Por favor, responda a todos os critérios antes de prosseguir.`);
      return;
    }

    const valCode = generateValidationCode();
    const verCode = generateVerificationCode();
    setGeneratedValCode(valCode);
    setGeneratedVerCode(verCode);

    setShowConfirmationModal(true);
  };

  const handleExportChecklistReport = async () => {
    if (!activeChecklist || !supabase) return;

    setIsSubmittingChecklist(true);
    const stats = getChecklistStats();
    const currentStatus = getChecklistStatus();

    try {
      // 1. Safety Uniqueness Verification Loop
      let valCode = generatedValCode;
      let verCode = generatedVerCode;
      let isUnique = false;
      let checkAttempts = 0;
      while (!isUnique && checkAttempts < 10) {
        const { data, error } = await supabase
          .from('checklist_executions')
          .select('id')
          .or(`validation_code.eq.${valCode},verification_code.eq.${verCode}`);
        
        if (error) {
          console.error('Error checking code uniqueness:', error);
          break;
        }
        
        if (!data || data.length === 0) {
          isUnique = true;
        } else {
          valCode = generateValidationCode();
          verCode = generateVerificationCode();
          checkAttempts++;
        }
      }
      
      // Update state for consistency in React view
      setGeneratedValCode(valCode);
      setGeneratedVerCode(verCode);

      const companyName = user?.companyName || (user?.email ? user.email.split('@')[1].split('.')[0].toUpperCase() : 'FORNECEDOR');
      const companyLogoUrl = user?.companyLogoUrl || null;

      // 2. Preload Logo Images (Official and Custom)
      let perspecpackLogoImg: HTMLImageElement | null = null;
      let issuerLogoImg: HTMLImageElement | null = null;

      try {
        perspecpackLogoImg = await loadImage(perspecpackLogo);
      } catch (e) {
        console.error('Error preloading official logo:', e);
      }

      if (companyLogoUrl) {
        try {
          issuerLogoImg = await loadImage(companyLogoUrl);
        } catch (e) {
          console.error('Error preloading issuer logo:', e);
        }
      }

      // Preload checklist evidence photos
      const loadedPhotos: HTMLImageElement[] = [];
      for (const url of evidencePhotos) {
        try {
          const img = await loadImage(url);
          loadedPhotos.push(img);
        } catch (e) {
          console.error('Error preloading evidence photo:', e);
        }
      }

      // 3. Generate PDF structure
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [6, 36, 44]; // Deep Teal
      const secondaryColor = [0, 245, 155]; // Neon Green
      const grayColor = [100, 116, 139]; // Slate

      // Status color maps
      let statusBg = [241, 245, 249];
      let statusText = [71, 85, 105];
      if (currentStatus.text === 'APROVADO') {
        statusBg = [209, 250, 229];
        statusText = [6, 95, 70];
      } else if (currentStatus.text === 'APROVADO COM RESSALVAS') {
        statusBg = [254, 243, 199];
        statusText = [146, 64, 14];
      } else if (currentStatus.text === 'REPROVADO') {
        statusBg = [254, 226, 226];
        statusText = [153, 27, 27];
      }

      // Layout helper
      let y = 35; // Start content below the header (margin top 15mm + header height 15mm)
      const pageHeight = 297;
      const pageWidth = 210;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 25) { // Leave 25mm space at bottom for footer
          doc.addPage();
          y = 35; // Start below top header space on the new page
        }
      };

      // --- PAGE 1: TITLE & HIGHLIGHTED VALIDATION BOX ---
      
      // Validation Code highlight box (top of first page)
      doc.setFillColor(240, 253, 250); // very soft teal/emerald
      doc.rect(margin, y, contentWidth, 20, 'F');
      doc.setDrawColor(0, 245, 155); // Neon green border
      doc.setLineWidth(0.4);
      doc.rect(margin, y, contentWidth, 20, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(6, 36, 44);
      doc.text('CÓDIGO DE VALIDAÇÃO PÚBLICA', margin + 6, y + 6);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(6, 36, 44);
      doc.text(valCode, margin + 6, y + 14);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Verifique a autenticidade deste relatório em perspecpack.com', pageWidth - margin - 6, y + 14, { align: 'right' });
      y += 26;

      // Title & Overview
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('Relatório de Validação de Embalagem', margin, y);
      y += 6;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Checklist Oficial: ${activeChecklist.name} (Rev. ${activeChecklist.revision})`, margin, y);
      y += 10;

      // Status general box
      checkPageBreak(25);
      doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
      doc.rect(margin, y, contentWidth, 20, 'F');
      doc.setDrawColor(statusText[0], statusText[1], statusText[2]);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, contentWidth, 20, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(statusText[0], statusText[1], statusText[2]);
      doc.text('RESULTADO DA AVALIAÇÃO / STATUS GERAL', margin + 6, y + 6);

      doc.setFontSize(14);
      doc.text(currentStatus.text, margin + 6, y + 14);

      // Add progress inside the box
      doc.setFontSize(8);
      doc.setTextColor(statusText[0], statusText[1], statusText[2]);
      doc.text(`PROGRESSO: ${stats.progress}%`, pageWidth - margin - 6, y + 14, { align: 'right' });
      y += 26;

      // Metadata Table details
      checkPageBreak(35);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 26, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 26, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      // Metadata elements
      doc.text('Organização OEM:', margin + 4, y + 6);
      doc.setFont('Helvetica', 'normal');
      doc.text(selectedOEMName, margin + 34, y + 6);

      doc.setFont('Helvetica', 'bold');
      doc.text('Código Validação:', margin + 110, y + 6);
      doc.setFont('Helvetica', 'normal');
      doc.text(valCode, margin + 140, y + 6);

      doc.setFont('Helvetica', 'bold');
      doc.text('Validador / Auditor:', margin + 4, y + 13);
      doc.setFont('Helvetica', 'normal');
      doc.text(user?.email || 'fornecedor@perspecpack.com', margin + 34, y + 13);

      doc.setFont('Helvetica', 'bold');
      doc.text('Rastreabilidade:', margin + 110, y + 13);
      doc.setFont('Helvetica', 'normal');
      doc.text(verCode, margin + 140, y + 13);

      doc.setFont('Helvetica', 'bold');
      doc.text('Data de Emissão:', margin + 4, y + 20);
      doc.setFont('Helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('pt-BR'), margin + 34, y + 20);

      doc.setFont('Helvetica', 'bold');
      doc.text('Estatísticas:', margin + 110, y + 20);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${stats.conforms} Conformes | ${stats.nonConforms} Não Conf. | ${stats.na} N.A.`, margin + 140, y + 20);

      y += 34;

      // Project information header block in PDF
      if (activeChecklist.headerConfig?.enabled && headerAnswers && Object.keys(headerAnswers).length > 0) {
        const headerCount = Object.keys(headerAnswers).length;
        const boxHeight = 8 + (headerCount * 6);
        checkPageBreak(boxHeight + 10);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, boxHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, contentWidth, boxHeight, 'S');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(6, 36, 44);
        doc.text('INFORMAÇÕES DO PROJETO', margin + 4, y + 6);

        doc.setFontSize(8);
        let fieldY = y + 12;
        Object.entries(headerAnswers).forEach(([label, val]) => {
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text(`${label}:`, margin + 6, fieldY);
          
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          doc.text(String(val), margin + 50, fieldY);
          fieldY += 6;
        });
        y += boxHeight + 10;
      }

      // Render evidence photos in PDF (side-by-side) if there are any
      if (loadedPhotos.length > 0) {
        checkPageBreak(50);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(6, 36, 44);
        doc.text('REGISTRO FOTOGRÁFICO DE EVIDÊNCIAS', margin, y + 6);
        y += 10;

        const imgWidth = 55;
        const imgHeight = 35;
        const imgGap = 5;

        loadedPhotos.forEach((img, index) => {
          const imgX = margin + index * (imgWidth + imgGap);
          try {
            // Draw image border
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.rect(imgX, y, imgWidth, imgHeight, 'S');
            
            // Add image
            doc.addImage(img, 'JPEG', imgX + 0.5, y + 0.5, imgWidth - 1, imgHeight - 1, undefined, 'FAST');
          } catch (e) {
            console.error('Error rendering image in PDF:', e);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.rect(imgX, y, imgWidth, imgHeight, 'S');
            doc.text(`[Erro Imagem ${index + 1}]`, imgX + imgWidth / 2, y + imgHeight / 2, { align: 'center' });
          }
        });
        y += imgHeight + 10;
      }

      // Table Title
      checkPageBreak(12);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('DETALHAMENTO DOS CRITÉRIOS AVALIADOS', margin, y);
      y += 6;

      // Table Header
      checkPageBreak(10);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);

      doc.text('CÓDIGO', margin + 2, y + 5.5);
      doc.text('DESCRIÇÃO DO CRITÉRIO', margin + 22, y + 5.5);
      doc.text('TIPO', margin + 112, y + 5.5);
      doc.text('PARECER', margin + 132, y + 5.5);
      doc.text('OBSERVAÇÕES E EVIDÊNCIAS', margin + 152, y + 5.5);

      y += 8;

      // Iterate criteria and sections
      activeChecklist.sections?.forEach(sec => {
        // Draw Section header
        checkPageBreak(12);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(sec.title.toUpperCase(), margin + 2, y + 4.5);
        doc.line(margin, y + 6, pageWidth - margin, y + 6);
        y += 6;

        sec.criteria?.forEach(crit => {
          const ans = checklistAnswers[crit.id] || { status: null, note: '' };
          const critCode = crit.code;
          const critDesc = crit.description;
          const critReq = crit.required ? 'Obrigatório' : 'Opcional';
          
          let statusText = 'Pendente';
          if (ans.status === 'C') statusText = 'Conforme';
          else if (ans.status === 'NC') statusText = 'Não Conforme';
          else if (ans.status === 'NA') statusText = 'N.A.';

          let noteText = ans.note || '-';

          // Split texts to wrap columns
          const descLines = doc.splitTextToSize(critDesc, 85);
          const noteLines = doc.splitTextToSize(noteText, 40);

          // Calculate height needed
          const linesHeight = Math.max(descLines.length, noteLines.length) * 3.5 + 4;
          const neededHeight = Math.max(linesHeight, 8);

          checkPageBreak(neededHeight);

          // Alternating backgrounds (subtle)
          // Draw bottom border line
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y + neededHeight, pageWidth - margin, y + neededHeight);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(51, 65, 85);

          // Draw Code (column 1)
          doc.text(critCode, margin + 2, y + 5);

          // Draw Desc (column 2)
          doc.text(descLines, margin + 22, y + 5);

          // Draw Type (column 3)
          if (crit.required) {
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(153, 27, 27); // red
          } else {
            doc.setTextColor(71, 85, 105);
          }
          doc.text(critReq, margin + 112, y + 5);

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(51, 65, 85);

          // Draw Result (column 4)
          if (ans.status === 'C') {
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(6, 95, 70); // green
          } else if (ans.status === 'NC') {
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(153, 27, 27); // red
          } else {
            doc.setTextColor(71, 85, 105);
          }
          doc.text(statusText, margin + 132, y + 5);

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(71, 85, 105);

          // Draw Observations (column 5)
          doc.text(noteLines, margin + 152, y + 5);

          y += neededHeight;
        });
      });

      // 4. Draw headers and footers on ALL pages retrospectively
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // --- HEADER ---
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, 25, pageWidth - margin, 25);
        
        // Header Left: Issuer Logo or Issuer Company Text
        if (issuerLogoImg) {
          try {
            doc.addImage(issuerLogoImg, 'PNG', margin, 12, 35, 10, undefined, 'FAST');
          } catch (e) {
            console.error('Error drawing issuer logo in PDF:', e);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(6, 36, 44);
            doc.text(companyName, margin, 19);
          }
        } else {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(6, 36, 44);
          doc.text(companyName, margin, 19);
        }
        
        // Header Right: Title and Date
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('RELATÓRIO DE CONFORMIDADE TÉCNICA', pageWidth - margin, 15, { align: 'right' });
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });
        
        // --- FOOTER ---
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
        
        // Footer Left: PERSPECPACK Logo
        if (perspecpackLogoImg) {
          try {
            doc.addImage(perspecpackLogoImg, 'PNG', margin, pageHeight - 17, 22, 4.4, undefined, 'FAST');
          } catch (e) {
            console.error('Error drawing PERSPECPACK logo in PDF:', e);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(6, 36, 44);
            doc.text('PERSPECPACK', margin, pageHeight - 14);
          }
        } else {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(6, 36, 44);
          doc.text('PERSPECPACK', margin, pageHeight - 14);
        }
        
        // Footer Tagline
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(' — Uma nova perspectiva para padrões industriais', margin + 24, pageHeight - 13.8);
        
        // Footer Codes
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Validação: ${valCode}  |  Rastreabilidade: ${verCode}`, margin, pageHeight - 7);
        
        // Footer Page Number
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      }

      // 5. Output PDF as Blob, File and Upload to storage
      const pdfBlob = doc.output('blob');
      const filename = `Relatorio_Conformidade_${activeChecklist.name.replace(/\s+/g, '_')}_${valCode}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const { publicUrl: pdfUrl } = await uploadFileToStorage(
        pdfFile,
        'checklist-evidencias',
        selectedOEMObj?.slug || 'oem',
        'relatorios'
      );

      // 6. Save the PDF locally for user download
      doc.save(filename);

      // 7. Persist in checklist_executions
      const { data: execData, error: execError } = await supabase
        .from('checklist_executions')
        .insert({
          organization_id: selectedOEM,
          checklist_id: activeChecklist.id,
          user_id: user?.email || 'fornecedor@perspecpack.com',
          status: 'completed',
          approval_level: currentStatus.text,
          validation_code: valCode,
          verification_code: verCode,
          progress: stats.progress,
          total_items: stats.total,
          conforming_items: stats.conforms,
          nonconforming_items: stats.nonConforms,
          na_items: stats.na,
          pending_items: stats.pending,
          pdf_url: pdfUrl,
          report_status: currentStatus.text,
          generated_at: new Date().toISOString(),
          header_data: {
            ...(activeChecklist.headerConfig?.enabled ? headerAnswers : {}),
            _evidence_photos: evidencePhotos
          }
        })
        .select()
        .single();

      if (execError) throw execError;

      // 8. Persist execution items
      const itemsToInsert = Object.entries(checklistAnswers).map(([critId, val]) => {
        const ans = val as any;
        return {
          execution_id: execData.id,
          criterion_id: critId,
          result: ans.status || null,
          observation: ans.note || null,
          evidence_url: null
        };
      }).filter(item => item.result !== null);

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('checklist_execution_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Log download details
      logUpload(selectedOEM, `PDF de Conformidade (${activeChecklist.name})`, filename);

      // Done
      setShowConfirmationModal(false);
      setShowReportSuccessModal(true);
    } catch (err: any) {
      console.error('Error submitting checklist:', err);
      alert('Ocorreu um erro ao salvar a auditoria: ' + err.message);
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  // Helper to render static vector logos or abbreviations
  const renderOEMLogo = (name: string, logoUrl?: string, large?: boolean, huge?: boolean) => {
    if (logoUrl) {
      if (huge) {
        return <img src={logoUrl} alt={name} className="h-[144px] w-[288px] object-contain" />;
      }
      return <img src={logoUrl} alt={name} className={large ? "h-28 w-56 object-contain" : "h-16 w-32 object-contain"} />;
    }

    const n = name.toLowerCase();
    if (n.includes('volkswagen') || n === 'vw') {
      if (huge) {
        return <div className="font-bold font-serif text-blue-900 border-[5px] border-blue-900 rounded-full flex items-center justify-center bg-blue-50/50 text-7xl w-32 h-32">W</div>;
      }
      return <div className={cn("font-bold font-serif text-blue-900 border-4 border-blue-900 rounded-full flex items-center justify-center bg-blue-50/50", large ? "text-5xl w-24 h-24 border-[5px]" : "text-3xl w-16 h-16")}>W</div>;
    }
    if (n.includes('hyundai')) {
      if (huge) {
        return <div className="font-serif italic text-blue-800 font-black text-8xl leading-none">H</div>;
      }
      return <div className={cn("font-serif italic text-blue-800 font-black", large ? "text-6xl" : "text-3xl")}>H</div>;
    }
    if (n.includes('nissan')) {
      if (huge) {
        return <div className="font-bold border-[3px] border-gray-800 rounded-full bg-slate-50 tracking-wider text-center text-4xl px-9 py-3 border-[4px]">NISSAN</div>;
      }
      return <div className={cn("font-bold border-2 border-gray-800 rounded-full bg-slate-50 tracking-wider text-center", large ? "text-2xl px-6 py-2 border-[3px]" : "text-[14px] px-3 py-1")}>NISSAN</div>;
    }
    if (n.includes('renault')) {
      if (huge) {
        return <div className="border-[5px] border-yellow-500 transform rotate-45 bg-yellow-50/20 shrink-0 w-16 h-24"></div>;
      }
      return <div className={cn("border-4 border-yellow-500 transform rotate-45 bg-yellow-50/20 shrink-0", large ? "w-12 h-18 border-[5px]" : "w-8 h-12")}></div>;
    }
    if (n.includes('scania')) {
      if (huge) {
        return <div className="font-black text-red-600 tracking-wide border-b-[4px] border-red-600 text-5xl">SCANIA</div>;
      }
      return <div className={cn("font-black text-red-600 tracking-wide border-b-2 border-red-600", large ? "text-3xl border-b-[3px]" : "text-lg")}>SCANIA</div>;
    }
    if (n.includes('gestamp')) {
      if (huge) {
        return <div className="font-bold text-blue-700 tracking-tighter uppercase text-5xl">Gestamp</div>;
      }
      return <div className={cn("font-bold text-blue-700 tracking-tighter uppercase", large ? "text-3xl" : "text-lg")}>Gestamp</div>;
    }

    if (huge) {
      return <div className="font-black text-slate-700 uppercase bg-slate-100 rounded text-6xl px-10 py-5">{name.substring(0, 2)}</div>;
    }
    return <div className={cn("font-black text-slate-700 uppercase bg-slate-100 rounded", large ? "text-4xl px-6 py-3" : "text-2xl px-4 py-2")}>{name.substring(0, 2)}</div>;
  };

  const renderOrgHeader = () => {
    if (!selectedOEMObj) return null;

    const orgAreas = technicalAreas.filter(
      area => area.organizationId === selectedOEM && 
      area.status === 'active' && 
      area.isVisibleToUsers
    );
    
    const areasCount = orgAreas.length;
    
    // Count all items in enabled modules for this OEM across all active technical areas
    const orgComponentsCount = components.filter(
      c => c.organizationId === selectedOEM && c.status === 'active'
    ).length;

    const orgDocumentsCount = documents.filter(
      d => d.organizationId === selectedOEM && d.status === 'active'
    ).length;

    const orgStandardsCount = standards.filter(
      s => s.organizationId === selectedOEM && s.status === 'active'
    ).length;

    const orgChecklistsCount = checklists.filter(
      c => c.organizationId === selectedOEM && c.status === 'active'
    ).length;
    
    const totalItems = orgComponentsCount + orgDocumentsCount + orgStandardsCount + orgChecklistsCount;

    return (
      <div className="bg-white border border-slate-100 rounded-2xl py-3 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg w-full mb-6">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-600" />
        
        {/* Soft background pattern */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#0f766e_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Left placeholder to balance centering on desktop */}
        <div className="hidden md:block w-[280px]" />

        {/* Center: Brand Logo */}
        <div className="flex-1 flex justify-center items-center max-w-full relative z-10">
          {renderOEMLogo(selectedOEMObj.name, selectedOEMObj.logoUrl, true, true)}
        </div>

        {/* Right: Indicators */}
        <div className="flex flex-col items-center md:items-end gap-2 md:w-[280px] relative z-10 shrink-0">
          {areasCount > 0 && (
            <div className="bg-slate-50 border border-slate-200 text-slate-650 px-4 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-2 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Áreas Técnicas Disponíveis: <strong className="text-slate-800 font-bold font-mono">{areasCount}</strong></span>
            </div>
          )}
          {totalItems > 0 && (
            <div className="bg-teal-50/60 border border-teal-100 text-teal-850 px-4 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-2 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>Conteúdo Disponível: <strong className="text-teal-900 font-bold font-mono">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</strong></span>
            </div>
          )}
        </div>
      </div>
    );
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
    setStep('tech_area_selection');
  };

  const handleTechAreaClick = (areaId: string) => {
    setSelectedTechnicalArea(areaId);
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
                        <div 
                          key={comp.id} 
                          onClick={() => setSelectedItemForModal({ type: 'component', data: comp })}
                          className="border border-slate-100 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50/80 flex justify-between items-center gap-3 transition-all cursor-pointer group"
                        >
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase">
                              {orgName}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1 group-hover:text-teal-700 transition-colors">{comp.name}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{comp.application || comp.description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {comp.stepFileUrl && (
                              <a 
                                href={comp.stepFileUrl}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!(user?.role === 'master' || profile?.planType === 'premium')) {
                                    e.preventDefault();
                                    setShowUpgradeModal(true);
                                  } else {
                                    logDownload(comp.organizationId, 'Componente (STEP)', comp.id, comp.stepFileUrl?.split('/').pop() || 'file.step');
                                  }
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-bold font-mono border border-blue-100"
                              >
                                STEP
                              </a>
                            )}
                            {comp.pdfFileUrl && (
                              <a 
                                href={comp.pdfFileUrl}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!(user?.role === 'master' || profile?.planType === 'premium')) {
                                    e.preventDefault();
                                    setShowUpgradeModal(true);
                                  } else {
                                    logDownload(comp.organizationId, 'Componente (PDF)', comp.id, comp.pdfFileUrl?.split('/').pop() || 'file.pdf');
                                  }
                                }}
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
                    <span>Cadernos de Encargos ({searchResults.documents.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.documents.map(doc => {
                      const orgName = organizations.find(o => o.id === doc.organizationId)?.name || 'N/A';
                      return (
                        <div 
                          key={doc.id} 
                          onClick={() => setSelectedItemForModal({ type: 'document', data: doc })}
                          className="border border-slate-100 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50/80 flex justify-between items-center gap-3 transition-all cursor-pointer group"
                        >
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase mr-1.5">
                              {orgName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                              {doc.documentType}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1 group-hover:text-teal-700 transition-colors">{doc.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{doc.description}</p>
                          </div>
                          {doc.fileUrl && (
                            <a 
                              href={doc.fileUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                logDownload(doc.organizationId, 'Caderno de Encargos', doc.id, doc.fileName || 'doc.pdf');
                              }}
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
                    <span>Documentação Técnica ({searchResults.standards.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.standards.map(std => {
                      const orgName = organizations.find(o => o.id === std.organizationId)?.name || 'N/A';
                      return (
                        <div 
                          key={std.id} 
                          onClick={() => setSelectedItemForModal({ type: 'standard', data: std })}
                          className="border border-slate-100 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50/80 flex justify-between items-center gap-3 transition-all cursor-pointer group"
                        >
                          <div>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase mr-1.5">
                              {orgName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                              {std.standardType}
                            </span>
                            <h4 className="font-bold text-[13px] text-slate-850 mt-1 group-hover:text-teal-700 transition-colors">{std.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{std.description}</p>
                          </div>
                          {std.fileUrl && (
                            <a 
                              href={std.fileUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                logDownload(std.organizationId, 'Documentação Técnica', std.id, std.fileName || 'norma.pdf');
                              }}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] px-2 py-1.5 rounded font-bold shrink-0 border border-teal-100"
                            >
                              Download
                            </a>
                          )}</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {activeOems.map((org) => {
                const orgAreasCount = technicalAreas.filter(
                  area => area.organizationId === org.id && area.status === 'active' && area.isVisibleToUsers
                ).length;
                
                const orgComponentsCount = components.filter(
                  c => c.organizationId === org.id && c.status === 'active'
                ).length;

                const orgDocumentsCount = documents.filter(
                  d => d.organizationId === org.id && d.status === 'active'
                ).length;

                const orgStandardsCount = standards.filter(
                  s => s.organizationId === org.id && s.status === 'active'
                ).length;

                const orgChecklistsCount = checklists.filter(
                  c => c.organizationId === org.id && c.status === 'active'
                ).length;

                return (
                  <button
                    key={org.id}
                    onClick={() => handleOrgClick(org.id)}
                    className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg shadow-sm cursor-pointer group gap-2.5 w-full"
                  >
                    <div className="h-16 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                      {renderOEMLogo(org.name, org.logoUrl, false)}
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-[13px] text-slate-800 group-hover:text-teal-600 transition-colors">
                        {org.name}
                      </h3>
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t border-slate-100 my-0.5" />

                    {/* Indicators list (aligned left) */}
                    <div className="w-full flex flex-col items-start gap-1.5 px-1">
                      {/* Highlighted Technical Areas count */}
                      {orgAreasCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-900 bg-slate-50 border border-slate-100/70 w-full px-2.5 py-1.5 rounded-lg shadow-sm justify-start">
                          <span>📁</span>
                          <span>{orgAreasCount} {orgAreasCount === 1 ? 'Área Técnica' : 'Áreas Técnicas'}</span>
                        </div>
                      )}

                      {/* Componentes Homologados */}
                      {orgComponentsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold justify-start pl-1">
                          <span>🧩</span>
                          <span>{orgComponentsCount} {orgComponentsCount === 1 ? 'Componente Homologado' : 'Componentes Homologados'}</span>
                        </div>
                      )}

                      {/* Cadernos de Encargos */}
                      {orgDocumentsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold justify-start pl-1">
                          <span>📘</span>
                          <span>{orgDocumentsCount} {orgDocumentsCount === 1 ? 'Caderno de Encargos' : 'Cadernos de Encargos'}</span>
                        </div>
                      )}

                      {/* Documentos Técnicos */}
                      {orgStandardsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold justify-start pl-1">
                          <span>📄</span>
                          <span>{orgStandardsCount} {orgStandardsCount === 1 ? 'Documento Técnico' : 'Documentos Técnicos'}</span>
                        </div>
                      )}

                      {/* Checklists de Validação */}
                      {orgChecklistsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold justify-start pl-1">
                          <span>✅</span>
                          <span>{orgChecklistsCount} {orgChecklistsCount === 1 ? 'Checklist de Validação' : 'Checklists de Validação'}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100 text-center sm:text-left mt-8">
            <span className="text-slate-500 text-sm font-medium">Não encontrou a organização desejada?</span>
            <Button 
              onClick={() => navigate('/ajuda', { state: { defaultCategory: 'Solicitação de Conteúdo' } })}
              variant="outline" 
              size="sm"
              className="bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold gap-2 rounded-xl transition-all"
            >
              <span>📩</span>
              <span>Solicitar Conteúdo</span>
            </Button>
          </div>
        </section>
      )}

      {/* STEP 1.5: TECHNICAL AREA SELECTION */}
      {step === 'tech_area_selection' && !searchQuery && selectedOEMObj && (
        <section className="space-y-8 animate-in fade-in duration-200">
          {/* Back button */}
          <button 
            onClick={() => setStep('org_selection')}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Organizações</span>
          </button>

          {renderOrgHeader()}

          <div className="space-y-1">
            <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
              Selecione uma Área Técnica
            </h2>
            <p className="text-slate-500 text-sm">
              Escolha a área desejada para acessar padrões, componentes homologados, documentação técnica e checklists de validação.
            </p>
          </div>

          {(() => {
            const orgAreas = technicalAreas.filter(
              area => area.organizationId === selectedOEM && 
              area.status === 'active' && 
              area.isVisibleToUsers
            );

            if (orgAreas.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium italic">
                  Nenhuma área técnica ativa disponível para esta organização.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgAreas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => handleTechAreaClick(area.id)}
                    className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-6 flex items-start gap-4 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-md shadow-sm cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300 shrink-0 shadow-inner">
                      {area.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-[15px] text-slate-850 group-hover:text-teal-600 transition-colors">
                        {area.name}
                      </h3>
                      {area.description && (
                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {area.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100 text-center sm:text-left mt-8">
            <span className="text-slate-500 text-sm font-medium">Não encontrou a área técnica desejada?</span>
            <Button 
              onClick={() => navigate('/ajuda', { state: { defaultCategory: 'Solicitação de Conteúdo' } })}
              variant="outline" 
              size="sm"
              className="bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold gap-2 rounded-xl transition-all"
            >
              <span>📩</span>
              <span>Solicitar Conteúdo</span>
            </Button>
          </div>
        </section>
      )}

      {/* STEP 2: MODULE SELECTION */}
      {step === 'module_selection' && !searchQuery && selectedOEMObj && (
        <section className="space-y-8 animate-in fade-in duration-200">
          {/* Breadcrumbs / Back button */}
          <button 
            onClick={() => setStep('tech_area_selection')}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Áreas Técnicas</span>
          </button>

          {renderOrgHeader()}

          <div className="space-y-1">
            <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{selectedOEMName}</span>
              {(() => {
                const area = technicalAreas.find(t => t.id === selectedTechnicalArea);
                if (!area) return null;
                return (
                  <>
                    <span className="text-slate-300 text-xl font-normal">&mdash;</span>
                    <span className="text-teal-600 text-xl font-extrabold flex items-center gap-1.5">
                      <span>{area.icon}</span>
                      <span>{area.name}</span>
                    </span>
                  </>
                );
              })()}
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
            <button onClick={() => setStep('tech_area_selection')} className="hover:text-teal-600 transition-colors">
              {selectedOEMName}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => setStep('module_selection')} className="hover:text-teal-600 transition-colors">
              {(() => {
                const area = technicalAreas.find(t => t.id === selectedTechnicalArea);
                return area ? `${area.icon} ${area.name}` : '';
              })()}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-teal-600">{MODULE_INFO[selectedModule]?.title}</span>
          </div>

          {renderOrgHeader()}

          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {(() => {
                  const Icon = MODULE_INFO[selectedModule]?.icon || Layers;
                  return <Icon className="w-6 h-6 text-teal-600" />;
                })()}
                <span>
                  {MODULE_INFO[selectedModule]?.title} &mdash; {selectedOEMName} ({(() => {
                    const area = technicalAreas.find(t => t.id === selectedTechnicalArea);
                    return area ? `${area.icon} ${area.name}` : 'Sem Área';
                  })()})
                </span>
              </h2>
            </div>
            
            {/* View Mode Toggle */}
            {selectedModule !== 'checklists' && (
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    viewMode === 'grid'
                      ? "bg-white text-teal-600 shadow-sm"
                      : "text-slate-550 hover:text-slate-800"
                  )}
                  title="Exibição em Miniatura"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Miniatura</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    viewMode === 'list'
                      ? "bg-white text-teal-650 shadow-sm"
                      : "text-slate-550 hover:text-slate-800"
                  )}
                  title="Exibição em Lista"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </button>
              </div>
            )}
          </div>

          {/* MODULE: COMPONENTES HOMOLOGADOS */}
          {selectedModule === 'components' && (
            <div className="w-full">
              {(() => {
                const filteredList = components.filter(c => 
                  c.organizationId === selectedOEM && 
                  c.technicalAreaId === selectedTechnicalArea &&
                  c.status === 'active'
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium italic shadow-sm">
                      Nenhum componente cadastrado para esta área técnica.
                    </div>
                  );
                }

                if (viewMode === 'grid') {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-in fade-in duration-200">
                      {filteredList.map(comp => (
                        <div 
                          key={comp.id}
                          onClick={() => setSelectedItemForModal({ type: 'component', data: comp })}
                          className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
                        >
                          <div className="space-y-2">
                            <div className="aspect-square w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative p-2">
                              {comp.imageUrl ? (
                                <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <Layers className="w-8 h-8 text-slate-300 group-hover:scale-105 transition-transform duration-300" />
                              )}
                              <div className="absolute top-1.5 right-1.5">
                                <span className="bg-slate-900/60 backdrop-blur-sm text-white font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                                  REV {comp.revision}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-[12px] text-slate-850 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                {comp.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                                {comp.application || comp.description || 'Sem descrição adicional.'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-mono font-bold uppercase">
                              COD: {comp.id.substring(0, 8)}
                            </span>
                            <span className="text-teal-600 group-hover:text-teal-755 font-bold flex items-center gap-0.5 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full animate-in fade-in duration-200">
                      <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                          <TableRow>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px]">Miniatura</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Nome do Componente</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Aplicação / Descrição</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-center">Código</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-right pr-6">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredList.map(comp => (
                            <TableRow 
                              key={comp.id} 
                              onClick={() => setSelectedItemForModal({ type: 'component', data: comp })}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <TableCell className="align-middle py-2">
                                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1">
                                  {comp.imageUrl ? (
                                    <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Layers className="w-5 h-5 text-slate-300" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="align-middle font-bold text-[13px] text-slate-900">{comp.name}</TableCell>
                              <TableCell className="align-middle text-[12px] text-slate-500 max-w-xs truncate">{comp.application || comp.description || '-'}</TableCell>
                              <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{comp.revision}</TableCell>
                              <TableCell className="align-middle text-[11px] text-slate-400 font-mono text-center uppercase">{comp.id.substring(0, 8)}</TableCell>
                              <TableCell className="align-middle text-right pr-6">
                                <span className="text-teal-600 font-bold text-xs inline-flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Detalhes</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                }
              })()}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100 text-center sm:text-left mt-8 w-full">
                <span className="text-slate-500 text-sm font-medium">Não encontrou o componente desejado?</span>
                <Button 
                  onClick={() => navigate('/ajuda', { state: { defaultCategory: 'Solicitação de Conteúdo' } })}
                  variant="outline" 
                  size="sm"
                  className="bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold gap-2 rounded-xl transition-all"
                >
                  <span>📩</span>
                  <span>Solicitar Conteúdo</span>
                </Button>
              </div>
            </div>
          )}

          {/* MODULE: CADERNO DE ENCARGOS */}
          {selectedModule === 'documentation' && (
            <div className="w-full">
              {(() => {
                const filteredList = documents.filter(d => 
                  d.organizationId === selectedOEM && 
                  d.technicalAreaId === selectedTechnicalArea &&
                  d.status === 'active'
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white border border-slate-250 rounded-2xl p-16 text-center text-slate-400 font-medium italic shadow-sm">
                      Nenhum documento cadastrado para esta área técnica.
                    </div>
                  );
                }

                if (viewMode === 'grid') {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-in fade-in duration-200">
                      {filteredList.map(doc => (
                        <div 
                          key={doc.id}
                          onClick={() => setSelectedItemForModal({ type: 'document', data: doc })}
                          className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
                        >
                          <div className="space-y-2">
                            <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                                <FileText className="w-5 h-5 text-teal-600" />
                              </div>
                              <div className="absolute top-1.5 right-1.5">
                                <span className="bg-slate-900/60 backdrop-blur-sm text-white font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                                  REV {doc.revision}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-[12px] text-slate-850 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                {doc.title}
                              </h4>
                              <p className="text-[10px] text-slate-505 line-clamp-2 leading-tight">
                                {doc.description || 'Sem descrição adicional.'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-mono font-bold uppercase">
                              {doc.fileName ? doc.fileName.split('.').pop()?.toUpperCase() : 'PDF'}
                            </span>
                            <span className="text-teal-600 group-hover:text-teal-755 font-bold flex items-center gap-0.5 transition-colors">
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full animate-in fade-in duration-200">
                      <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                          <TableRow>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[60px] text-center">Formato</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Título do Documento</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Descrição</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-center">Tipo</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-right pr-6">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredList.map(doc => (
                            <TableRow 
                              key={doc.id} 
                              onClick={() => setSelectedItemForModal({ type: 'document', data: doc })}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <TableCell className="align-middle py-2 text-center">
                                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto">
                                  <FileText className="w-4 h-4 text-teal-650" />
                                </div>
                              </TableCell>
                              <TableCell className="align-middle font-bold text-[13px] text-slate-900">{doc.title}</TableCell>
                              <TableCell className="align-middle text-[12px] text-slate-500 max-w-xs truncate">{doc.description || '-'}</TableCell>
                              <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{doc.revision}</TableCell>
                              <TableCell className="align-middle text-[11px] text-slate-505 font-mono text-center uppercase">{doc.documentType || 'PDF'}</TableCell>
                              <TableCell className="align-middle text-right pr-6">
                                <span className="text-teal-600 font-bold text-xs inline-flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Detalhes</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                }
              })()}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100 text-center sm:text-left mt-8 w-full">
                <span className="text-slate-500 text-sm font-medium">Não encontrou o conteúdo desejado?</span>
                <Button 
                  onClick={() => navigate('/ajuda', { state: { defaultCategory: 'Solicitação de Conteúdo' } })}
                  variant="outline" 
                  size="sm"
                  className="bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold gap-2 rounded-xl transition-all"
                >
                  <span>📩</span>
                  <span>Solicitar Conteúdo</span>
                </Button>
              </div>
            </div>
          )}

          {/* MODULE: DOCUMENTAÇÃO TÉCNICA */}
          {selectedModule === 'standards' && (
            <div className="w-full">
              {(() => {
                const filteredList = standards.filter(s => 
                  s.organizationId === selectedOEM && 
                  s.technicalAreaId === selectedTechnicalArea &&
                  s.status === 'active'
                );

                if (filteredList.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium italic shadow-sm">
                      Nenhuma norma cadastrada para esta área técnica.
                    </div>
                  );
                }

                if (viewMode === 'grid') {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-in fade-in duration-200">
                      {filteredList.map(std => (
                        <div 
                          key={std.id}
                          onClick={() => setSelectedItemForModal({ type: 'standard', data: std })}
                          className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group relative overflow-hidden"
                        >
                          <div className="space-y-2">
                            <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                                <ShieldCheck className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="absolute top-1.5 right-1.5">
                                <span className="bg-slate-900/60 backdrop-blur-sm text-white font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                                  REV {std.revision}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-[12px] text-slate-850 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                {std.title}
                              </h4>
                              <p className="text-[10px] text-slate-505 line-clamp-2 leading-tight">
                                {std.description || 'Sem descrição adicional.'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                            <span className="text-slate-450 font-mono font-bold uppercase truncate max-w-[70px]">
                              {std.referenceDocument || 'REF: N/A'}
                            </span>
                            <span className="text-teal-600 group-hover:text-teal-755 font-bold flex items-center gap-0.5 transition-colors">
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full animate-in fade-in duration-200">
                      <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                          <TableRow>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[60px] text-center">Ícone</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Título da Norma / Diretriz</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11">Descrição</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[80px] text-center">Rev.</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[140px] text-center">Referência</TableHead>
                            <TableHead className="text-[12px] font-bold text-slate-600 uppercase h-11 w-[120px] text-right pr-6">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredList.map(std => (
                            <TableRow 
                              key={std.id} 
                              onClick={() => setSelectedItemForModal({ type: 'standard', data: std })}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <TableCell className="align-middle py-2 text-center">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto">
                                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                                </div>
                              </TableCell>
                              <TableCell className="align-middle font-bold text-[13px] text-slate-900">{std.title}</TableCell>
                              <TableCell className="align-middle text-[12px] text-slate-500 max-w-xs truncate">{std.description || '-'}</TableCell>
                              <TableCell className="align-middle text-[12px] text-slate-700 font-bold font-mono text-center">{std.revision}</TableCell>
                              <TableCell className="align-middle text-[11px] text-slate-500 text-center truncate max-w-[120px]" title={std.referenceDocument}>{std.referenceDocument || '-'}</TableCell>
                              <TableCell className="align-middle text-right pr-6">
                                <span className="text-teal-600 font-bold text-xs inline-flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Detalhes</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                }
              })()}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100 text-center sm:text-left mt-8 w-full">
                <span className="text-slate-500 text-sm font-medium">Precisa de um documento específico?</span>
                <Button 
                  onClick={() => navigate('/ajuda', { state: { defaultCategory: 'Solicitação de Conteúdo' } })}
                  variant="outline" 
                  size="sm"
                  className="bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold gap-2 rounded-xl transition-all"
                >
                  <span>📩</span>
                  <span>Solicitar Conteúdo</span>
                </Button>
              </div>
            </div>
          )}

          {/* MODULE: CHECKLISTS DE VALIDAÇÃO */}
          {selectedModule === 'checklists' && (
            <>
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
                        c.technicalAreaId === selectedTechnicalArea &&
                        c.status === 'active'
                      );

                      if (filteredList.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="h-28 text-center text-slate-400 font-medium italic">
                              Nenhum checklist disponível para esta área técnica nesta organização.
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredList.map(chk => (
                        <TableRow key={chk.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="align-middle font-bold text-[13px] text-slate-900">{chk.name}</TableCell>
                          <TableCell className="align-middle text-[13px] text-slate-505">
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100 text-center sm:text-left mt-8 w-full">
                <span className="text-slate-500 text-sm font-medium">Precisa de um checklist específico?</span>
                <Button 
                  onClick={() => navigate('/ajuda', { state: { defaultCategory: 'Solicitação de Conteúdo' } })}
                  variant="outline" 
                  size="sm"
                  className="bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500 text-slate-700 hover:text-teal-700 font-bold gap-2 rounded-xl transition-all"
                >
                  <span>📩</span>
                  <span>Solicitar Conteúdo</span>
                </Button>
              </div>
            </>
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
                        style={{ width: `${getChecklistStats().progress}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-xs text-white">{getChecklistStats().progress}%</span>
                  </div>
                </div>
 
                <div className="border-l border-teal-900/60 pl-4 space-y-0.5 shrink-0">
                  <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                    Status Geral
                  </span>
                  <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 border", getChecklistStatus().badgeClass)}>
                    {getChecklistStatus().text === 'APROVADO' && <CheckCircle className="w-3.5 h-3.5" />}
                    {getChecklistStatus().text === 'APROVADO COM RESSALVAS' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {getChecklistStatus().text === 'REPROVADO' && <X className="w-3.5 h-3.5" />}
                    {getChecklistStatus().text === 'PENDENTE' && <HelpCircle className="w-3.5 h-3.5" />}
                    <span>{getChecklistStatus().text}</span>
                  </span>
                </div>
              </div>
 
            </div>
          </div>

          {/* Project Header fields form & Photographic Evidences */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
            {activeChecklist.headerConfig?.enabled && activeChecklist.headerConfig.fields && activeChecklist.headerConfig.fields.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <h3 className="font-extrabold text-[14px] text-slate-800">Informações do Projeto (Cabeçalho)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChecklist.headerConfig.fields.map((field, fIdx) => (
                    <div key={fIdx} className="space-y-1.5">
                      <Label htmlFor={`header-field-${fIdx}`} className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span>{field.label}</span>
                        {field.required && <span className="text-red-500 font-extrabold">*</span>}
                      </Label>
                      <input
                        id={`header-field-${fIdx}`}
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={headerAnswers[field.label] || ''}
                        onChange={(e) => setHeaderAnswers({
                          ...headerAnswers,
                          [field.label]: e.target.value
                        })}
                        placeholder={`Preencha o/a ${field.label.toLowerCase()}`}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-705 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Uploader */}
            <div className={cn("space-y-4", activeChecklist.headerConfig?.enabled && activeChecklist.headerConfig.fields && activeChecklist.headerConfig.fields.length > 0 ? "border-t border-slate-100 pt-6" : "")}>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-[14px] text-slate-800">Evidências Fotográficas do Projeto</h3>
                <span className="text-slate-400 text-xs font-medium">
                  (Anexe até 3 fotos &bull; JPEG, JPG ou PNG &bull; Máx. 2MB)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Photo Previews */}
                {evidencePhotos.map((photoUrl, idx) => (
                  <div key={idx} className="relative aspect-video sm:aspect-square bg-slate-150 border border-slate-200 rounded-xl overflow-hidden group shadow-sm flex items-center justify-center">
                    <img src={photoUrl} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Uploading placeholders */}
                {uploadingPhotos.map((_, idx) => (
                  <div key={`uploading-${idx}`} className="relative aspect-video sm:aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-[10px] font-bold text-slate-500">Carregando...</span>
                  </div>
                ))}

                {/* Add Photo slot */}
                {evidencePhotos.length + uploadingPhotos.length < 3 && (
                  <div className="relative aspect-video sm:aspect-square">
                    <input
                      type="file"
                      id="checklist-photo-uploader"
                      accept="image/jpeg,image/jpg,image/png"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={evidencePhotos.length + uploadingPhotos.length >= 3}
                    />
                    <label
                      htmlFor="checklist-photo-uploader"
                      className="cursor-pointer h-full w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group shadow-sm"
                    >
                      <Camera className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-teal-700 transition-colors">Anexar Foto</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visual Summary Panel */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total de Critérios</span>
              <span className="text-2xl font-extrabold text-slate-800 mt-2">{getChecklistStats().total}</span>
            </div>
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Conformes (✓)</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-2">{getChecklistStats().conforms}</span>
            </div>
            <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Não Conformes (⚠)</span>
              <span className="text-2xl font-extrabold text-rose-700 mt-2">{getChecklistStats().nonConforms}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">N.A. (⊘)</span>
              <span className="text-2xl font-extrabold text-slate-700 mt-2">{getChecklistStats().na}</span>
            </div>
            <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pendentes</span>
              <span className="text-2xl font-extrabold text-amber-705 mt-2">{getChecklistStats().pending}</span>
            </div>
          </div>
 
          {/* Form List of sections */}
          <div className="space-y-6">
            {activeChecklist.sections?.map((sec, sIdx) => (
              <div key={sec.id || sIdx} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-150">
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
                    const ans = checklistAnswers[crit.id] || { status: null, note: '' };
 
                    return (
                      <div key={crit.id || cIdx} className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-slate-50/10 transition-colors">
                        {/* Criterion info */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-teal-755 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded">
                              {crit.code}
                            </span>
                            {crit.required && (
                              <span className="text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Obrigatório
                              </span>
                            )}
                            {!crit.required && (
                              <span className="text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Opcional
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-slate-800 font-bold leading-normal">
                            {crit.description}
                          </p>
                          {crit.reference && (
                            <p className="text-[11px] text-slate-400 font-medium">
                              <span className="font-extrabold">Referência:</span> {crit.reference}
                            </p>
                          )}
 
                          {/* Observações técnicas */}
                          <div className="pt-2">
                            <input 
                              type="text"
                              placeholder="Adicionar observações técnicas..."
                              value={ans.note}
                              onChange={(e) => setChecklistAnswers({
                                ...checklistAnswers,
                                [crit.id]: { ...ans, note: e.target.value }
                              })}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-705 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all min-h-[36px]"
                            />
                          </div>
                        </div>
 
                        {/* Conformance selector chips (Mutually exclusive with toggle) */}
                        <div className="flex gap-1.5 shrink-0 self-start lg:pt-1">
                          <button
                            onClick={() => setChecklistAnswers({
                              ...checklistAnswers,
                              [crit.id]: { ...ans, status: ans.status === 'C' ? null : 'C' }
                            })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm",
                              ans.status === 'C'
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-extrabold shadow-sm"
                                : "bg-white border-slate-200 text-slate-550 hover:bg-slate-50"
                            )}
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Conforme</span>
                          </button>
 
                          <button
                            onClick={() => setChecklistAnswers({
                              ...checklistAnswers,
                              [crit.id]: { ...ans, status: ans.status === 'NC' ? null : 'NC' }
                            })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm",
                              ans.status === 'NC'
                                ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold shadow-sm"
                                : "bg-white border-slate-200 text-slate-550 hover:bg-slate-50"
                            )}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Não Conforme</span>
                          </button>
 
                          <button
                            onClick={() => setChecklistAnswers({
                              ...checklistAnswers,
                              [crit.id]: { ...ans, status: ans.status === 'NA' ? null : 'NA' }
                            })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm",
                              ans.status === 'NA'
                                ? "bg-slate-100 border-slate-300 text-slate-700 font-extrabold shadow-sm"
                                : "bg-white border-slate-200 text-slate-550 hover:bg-slate-50"
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
              Ao concluir, clique no botão ao lado para abrir o painel de confirmação e emitir o relatório PDF.
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
                onClick={handleOpenConfirmation}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5 justify-center shadow-md"
              >
                <FileDown className="w-4.5 h-4.5" />
                <span>Emitir Relatório</span>
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
              <p className="text-slate-550 text-[13px] leading-relaxed">
                O relatório oficial de conformidade técnica em PDF para o checklist <strong>{activeChecklist.name}</strong> foi gerado e está disponível para download.
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Os dados desta validação foram salvos com sucesso na central de controle administratriva.
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

      {/* CONFIRMATION MODAL */}
      {showConfirmationModal && activeChecklist && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[550px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00F59B]" />
                <span>Resumo da Validação Técnica</span>
              </h3>
              <button 
                onClick={() => setShowConfirmationModal(false)}
                className="text-slate-350 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
                disabled={isSubmittingChecklist}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 gap-4">
                  <span className="font-semibold text-slate-500">Checklist Executado:</span>
                  <span className="font-bold text-slate-800 text-right">{activeChecklist.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Organização OEM:</span>
                  <span className="font-bold text-slate-800">{selectedOEMName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Validador:</span>
                  <span className="font-mono text-slate-700 font-bold">{user?.email || 'fornecedor@perspecpack.com'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Código de Validação:</span>
                  <span className="font-mono text-[#06242c] font-black">{generatedValCode}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="font-semibold text-slate-500">Código de Rastreabilidade:</span>
                  <span className="font-mono text-[#06242c] font-black">{generatedVerCode}</span>
                </div>
              </div>

              {/* Identificação do Emissor */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Identificação do Emissor (Cadastro)</h4>
                  <Link 
                    to="/perfil"
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline"
                  >
                    Editar Perfil
                  </Link>
                </div>
                
                <div className="flex items-center gap-4">
                  {user?.companyLogoUrl ? (
                    <div className="border border-slate-200 rounded-lg p-1 bg-white flex items-center justify-center h-12 w-24 shadow-sm shrink-0">
                      <img src={user.companyLogoUrl} alt="Logo Emissor" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-12 w-24 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-white text-slate-450 shrink-0 select-none">
                      <Building2 className="w-4 h-4" />
                      <span className="text-[8px] font-bold mt-0.5 uppercase">Sem Logo</span>
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Empresa / Emissor</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">
                      {user?.companyName || (user?.email ? user.email.split('@')[1].split('.')[0].toUpperCase() : 'FORNECEDOR')}
                    </span>
                    {!user?.companyName && (
                      <span className="text-[9px] text-amber-600 font-semibold leading-none block">
                        (Usando padrão do email. Preencha no perfil.)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Statistics Panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Geral da Auditoria</h4>
                <div className={cn(
                  "p-4 rounded-xl border flex items-center justify-between shadow-sm",
                  getChecklistStatus().colorClass
                )}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Resultado da Conformidade</span>
                    <div className="font-black text-[15px]">{getChecklistStatus().text}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">Progresso</span>
                    <span className="text-lg font-black">{getChecklistStats().progress}%</span>
                  </div>
                </div>
              </div>

              {/* Counts details */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="block text-[9px] font-bold text-slate-450 uppercase">Conformes</span>
                  <span className="text-sm font-extrabold text-emerald-600">{getChecklistStats().conforms}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="block text-[9px] font-bold text-slate-455 uppercase">Não Conf.</span>
                  <span className="text-sm font-extrabold text-rose-600">{getChecklistStats().nonConforms}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="block text-[9px] font-bold text-slate-455 uppercase">N.A.</span>
                  <span className="text-sm font-extrabold text-slate-600">{getChecklistStats().na}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="block text-[9px] font-bold text-slate-455 uppercase">Pendente</span>
                  <span className="text-sm font-extrabold text-amber-600">{getChecklistStats().pending}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                Ao clicar em confirmar, um relatório técnico em formato <strong>PDF oficial</strong> será emitido e o registro da auditoria será salvo nos servidores para fins de rastreabilidade e auditoria.
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowConfirmationModal(false)}
                className="w-1/2 text-xs font-semibold h-10 rounded-xl"
                disabled={isSubmittingChecklist}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExportChecklistReport}
                className="w-1/2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                disabled={isSubmittingChecklist}
              >
                {isSubmittingChecklist ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Emitir PDF & Salvar</span>
                  </>
                )}
              </Button>
            </div>
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
              {selectedItemForModal.type === 'component' && selectedItemForModal.data.threeDModelUrl && selectedItemForModal.data.imageUrl && (
                <div className="absolute top-4 left-4 z-10 flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    onClick={() => setModalMediaTab('image')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                      modalMediaTab === 'image'
                        ? "bg-white text-teal-600 shadow-sm"
                        : "text-slate-550 hover:text-slate-800"
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Imagem</span>
                  </button>
                  <button
                    onClick={() => setModalMediaTab('3d')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                      modalMediaTab === '3d'
                        ? "bg-white text-teal-600 shadow-sm"
                        : "text-slate-550 hover:text-slate-800"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Visualizar 3D</span>
                  </button>
                </div>
              )}

              {selectedItemForModal.type === 'component' ? (
                modalMediaTab === '3d' && selectedItemForModal.data.threeDModelUrl ? (
                  <ThreeDViewer
                    url={selectedItemForModal.data.threeDModelUrl}
                    poster={selectedItemForModal.data.imageUrl}
                    alt={selectedItemForModal.data.name}
                  />
                ) : selectedItemForModal.data.imageUrl ? (
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
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full">
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
                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
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
                        onClick={(e) => {
                          if (!(user?.role === 'master' || profile?.planType === 'premium')) {
                            e.preventDefault();
                            setShowUpgradeModal(true);
                          } else {
                            logDownload(selectedItemForModal.data.organizationId, 'Componente (STEP)', selectedItemForModal.data.id, selectedItemForModal.data.stepFileUrl?.split('/').pop() || 'file.step');
                          }
                        }}
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
                        onClick={(e) => {
                          if (!(user?.role === 'master' || profile?.planType === 'premium')) {
                            e.preventDefault();
                            setShowUpgradeModal(true);
                          } else {
                            logDownload(selectedItemForModal.data.organizationId, 'Componente (PDF)', selectedItemForModal.data.id, selectedItemForModal.data.pdfFileUrl?.split('/').pop() || 'file.pdf');
                          }
                        }}
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
                        onClick={(e) => {
                          if (!(user?.role === 'master' || profile?.planType === 'premium')) {
                            e.preventDefault();
                            setShowUpgradeModal(true);
                          } else {
                            logDownload(selectedItemForModal.data.organizationId, 'Componente (DWG)', selectedItemForModal.data.id, selectedItemForModal.data.dwgFileUrl?.split('/').pop() || 'file.dwg');
                          }
                        }}
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
                        onClick={() => {
                          logDownload(
                            selectedItemForModal.data.organizationId, 
                            selectedItemForModal.type === 'document' ? 'Caderno de Encargos' : 'Documentação Técnica', 
                            selectedItemForModal.data.id, 
                            selectedItemForModal.data.fileName || 'file.pdf'
                          );
                        }}
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

      {/* UPGRADE POPUP MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00F59B]" />
                <span>Recurso disponível no Plano Premium</span>
              </h3>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-650 border border-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-7 h-7 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-slate-900">Assinatura Premium Necessária</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Para acessar componentes homologados, executar checklists de validação e gerar relatórios de conformidade, atualize sua assinatura.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 border-t border-slate-200 flex flex-col gap-2.5 shrink-0">
              <Button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/meu-plano');
                }}
                className="w-full bg-teal-650 hover:bg-teal-750 text-white font-bold h-11 text-xs rounded-xl shadow-md transition-colors"
              >
                Ver Plano Premium
              </Button>
              <Button
                onClick={() => setShowUpgradeModal(false)}
                variant="outline"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-250 hover:border-slate-300 text-xs font-semibold h-11 rounded-xl transition-colors"
              >
                Continuar no Plano Free
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
