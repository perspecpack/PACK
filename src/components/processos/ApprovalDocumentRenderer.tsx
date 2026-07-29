import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle, 
  Loader2, 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  Workflow, 
  Info, 
  Calendar, 
  ChevronRight, 
  Eye, 
  Settings2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  GripVertical, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  FileDown,
  CheckCircle2,
  FolderArchive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Block, validateBlock, BLOCK_METADATA } from './BlockFactory';
import { 
  HeadingTextBlockEditor, 
  TextAnswerBlockEditor, 
  ChoiceAnswerBlockEditor, 
  DateBlockEditor, 
  FileUploadBlockEditor, 
  ApprovalDecisionBlockEditor,
  AcknowledgementBlockEditor,
  RequestInfoBlockEditor,
  AnalysisMaterialsBlockEditor
} from './BlockEditors';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import BlockFieldHeader from './BlockFieldHeader';

export type RendererMode = 
  | 'template-editor' 
  | 'template-preview' 
  | 'approval-preparation' 
  | 'public-validation' 
  | 'read-only-result'
  | 'pdf';

export interface CompanyBrandingData {
  companyName: string;
  tradeName?: string;
  companyLogoUrl?: string;
  shortDescription?: string;
  footerText?: string;
  companyWebsite?: string;
  corporateEmail?: string;
  phone?: string;
  cnpj?: string;
}

export interface DocumentData {
  title: string;
  client?: string;
  project?: string;
  code?: string;
  revision?: string;
  responsible_internal?: string;
  deadline?: string | null;
  description?: string;
  notes_for_client?: string;
  publication_code?: string;
  version?: number;
  status?: string;
}

interface ApprovalDocumentRendererProps {
  mode: RendererMode;
  companyBranding: CompanyBrandingData;
  documentData: DocumentData;
  blocks: Block[];
  materials?: any[];
  
  // Callbacks for template-editor
  activeBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  onUpdateBlock?: (id: string, updatedBlock: Block) => void;
  onDeleteBlock?: (id: string) => void;
  onMoveBlock?: (id: string, direction: 'up' | 'down') => void;
  onDuplicateBlock?: (id: string) => void;
  
  // Callbacks for preparation & validation modes
  answers?: any[];
  onAnswerChange?: (blockId: string, val: any) => void;
  validationErrors?: Record<string, string>;
  onDocumentDataChange?: (data: Partial<DocumentData>) => void;
  onAddMaterial?: (file: File, name: string, category: string, revision?: string) => Promise<void>;
  onRemoveMaterial?: (materialId: string, filePath: string) => Promise<void>;
  
  // Public validation state
  respondentName?: string;
  respondentRole?: string;
  respondentEmail?: string;
  onRespondentNameChange?: (val: string) => void;
  onRespondentRoleChange?: (val: string) => void;
  onRespondentEmailChange?: (val: string) => void;
  
  // Validation actions
  step?: number;
  submitting?: boolean;
  successData?: any;
  onSubmitResponse?: () => void;
  onGoToReview?: () => void;
  onGoBack?: () => void;
  handleDownloadPDF?: () => void;
  pdfReportBlob?: Blob | null;
  zipApprovalBlob?: Blob | null;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  pendingFields?: string[];
}

export default function ApprovalDocumentRenderer({
  mode,
  companyBranding,
  documentData,
  blocks,
  materials = [],
  
  activeBlockId = null,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onDuplicateBlock,
  
  answers = [],
  onAnswerChange,
  validationErrors = {},
  onDocumentDataChange,
  onAddMaterial,
  onRemoveMaterial,
  
  respondentName = '',
  respondentRole = '',
  respondentEmail = '',
  onRespondentNameChange,
  onRespondentRoleChange,
  onRespondentEmailChange,
  
  step = 1,
  submitting = false,
  successData = null,
  onSubmitResponse,
  onGoToReview,
  onGoBack,
  handleDownloadPDF,
  pdfReportBlob = null,
  zipApprovalBlob = null,
  onSaveDraft,
  onPublish,
  pendingFields = []
}: ApprovalDocumentRendererProps) {
  
  const hasRequestInfoBlock = blocks.some(b => b.type === 'request_information');
  const hasAnalysisMaterialsBlock = blocks.some(b => b.type === 'analysis_materials');

  const getInitials = (name: string) => {
    if (!name) return 'PP';
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');
  };

  // Helper to render public validation Step 3 Success
  if (mode === 'public-validation' && step === 3) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8 text-center animate-in fade-in duration-200">
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner mb-2 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-850 tracking-tight leading-tight">
            Validação registrada com sucesso!
          </h1>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Protocolo: {successData?.protocol}
          </span>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Agradecemos a sua contribuição. A equipe interna da empresa responsável já foi notificada sobre a sua decisão.
          </p>
        </div>

        {/* Success receipt metadata */}
        <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 text-left text-xs space-y-4 max-w-md mx-auto">
          <h3 className="font-bold text-slate-800 border-b border-slate-200/60 pb-1.5 uppercase tracking-wider text-[10px]">
            Detalhes do registro
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-slate-655 font-medium">
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">Responsável:</span>
              {respondentName}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">Cargo/Função:</span>
              {respondentRole}
            </div>
            {respondentEmail && (
              <div className="col-span-full">
                <span className="text-[10px] text-slate-400 block font-normal">E-mail:</span>
                {respondentEmail}
              </div>
            )}
            <div className="col-span-full">
              <span className="text-[10px] text-slate-400 block font-normal">Data/Hora de Envio:</span>
              {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 pt-2 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            {pdfReportBlob ? (
              <Button
                type="button"
                onClick={() => {
                  const url = URL.createObjectURL(pdfReportBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `Relatorio-Oficial-${documentData.publication_code}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer h-9 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FileDown className="w-4 h-4 text-[#0d857a]" />
                <span>Baixar PDF Oficial</span>
              </Button>
            ) : handleDownloadPDF ? (
              <Button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer h-9 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FileDown className="w-4 h-4 text-[#0d857a]" />
                <span>Baixar PDF</span>
              </Button>
            ) : null}

            {zipApprovalBlob && (
              <Button
                type="button"
                onClick={() => {
                  const url = URL.createObjectURL(zipApprovalBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `Pacote-Aprovacao-${documentData.publication_code}.zip`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="w-full sm:w-auto bg-teal-50 hover:bg-teal-100 text-[#0d857a] border border-[#0d857a]/20 cursor-pointer h-9 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Baixar Pacote ZIP</span>
              </Button>
            )}
          </div>
          
          <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl text-left text-[11px] text-amber-800 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Política de Descarte de Arquivos
            </div>
            <p>
              Os arquivos técnicos enviados para análise (modelos 3D, PDF, fotos e vídeos) foram **removidos definitivamente de nossos servidores** para garantir sua segurança e privacidade. O documento PDF oficial assinado acima é o único registro retido em nossa nuvem.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-5 rounded-xl cursor-pointer border-0 text-xs shadow-sm mt-1"
          >
            Nova Resposta
          </Button>
        </div>
      </div>
    );
  }

  // Helper to render public validation Step 2 Confirmation
  if (mode === 'public-validation' && step === 2) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs p-8 space-y-8 animate-in fade-in duration-200">
        <div className="space-y-2 pb-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-850 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-[#0d857a]" />
            Confirmar validação
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Revise as informações abaixo. Após o envio, esta validação será registrada e não poderá ser editada por este link.
          </p>
        </div>

        {/* Review Box */}
        <div className="space-y-5 divide-y divide-slate-100 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
          {/* Respondent info */}
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-bold text-slate-455 uppercase tracking-wider">
              Responsável
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nome completo:</span>
                {respondentName}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Cargo ou Função:</span>
                {respondentRole}
              </div>
              {respondentEmail && (
                <div className="col-span-full">
                  <span className="text-[10px] text-slate-400 block font-medium">E-mail profissional:</span>
                  {respondentEmail}
                </div>
              )}
            </div>
          </div>

          {/* Validation indicators */}
          <div className="space-y-4 pt-5">
            <h3 className="text-[11px] font-bold text-slate-455 uppercase tracking-wider">
              Resultado Principal
            </h3>
            {(() => {
              const decisionBlocks = blocks.filter((b: Block) => b.type === 'approval_decision');
              if (decisionBlocks.length > 0) {
                const lastDec = decisionBlocks[decisionBlocks.length - 1];
                const ans = answers.find(a => a.blockId === lastDec.id);
                if (ans?.value?.id) {
                  const style = 
                    ans.value.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    ans.value.semanticType === 'attention' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    ans.value.semanticType === 'negative' ? 'bg-red-50 text-red-800 border-red-200' :
                    'bg-slate-100 text-slate-800 border-slate-300';
                  return (
                    <div className={`flex items-center justify-between p-3.5 border rounded-xl font-bold text-xs uppercase tracking-wider ${style}`}>
                      <span>{ans.value.text}</span>
                    </div>
                  );
                }
              }
              return <p className="text-xs text-slate-500 italic">Nenhum bloco de aprovação definido no processo.</p>;
            })()}
          </div>

          {/* Total responses summary */}
          <div className="space-y-3 pt-5">
            <h3 className="text-[11px] font-bold text-slate-455 uppercase tracking-wider">
              Dados do Envio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-655">
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Campos Preenchidos</span>
                {answers.filter(a => {
                  const block = blocks.find((b: any) => b.id === a.blockId);
                  if (block?.type === 'heading_text') return false;
                  if (block?.type === 'acknowledgement') return a.value === true;
                  if (block?.type === 'approval_decision') return !!a.value?.id;
                  if (Array.isArray(a.value)) return a.value.length > 0;
                  if (typeof a.value === 'object' && a.value !== null) return !!a.value.otherSelected;
                  return a.value !== undefined && a.value !== '';
                }).length} de {blocks.filter((b: any) => b.type !== 'heading_text').length}
              </div>
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Anexos Carregados</span>
                {answers.reduce((acc, current) => {
                  const block = blocks.find((b: any) => b.id === current.blockId);
                  if (block?.type === 'file_upload' && Array.isArray(current.value)) {
                    return acc + current.value.length;
                  }
                  return acc;
                }, 0)} arquivo(s)
              </div>
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Termos Aceitos</span>
                {answers.filter(a => {
                  const block = blocks.find((b: any) => b.id === a.blockId);
                  return block?.type === 'acknowledgement' && a.value === true;
                }).length} item(ns)
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onGoBack}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-10 px-4 rounded-xl text-xs font-bold"
            disabled={submitting}
          >
            Voltar e revisar
          </Button>
          <Button
            type="button"
            onClick={onSubmitResponse}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-10 px-6 rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1.5 text-xs"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Registrando validação...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-slate-900" />
                <span>Confirmar validação</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Document Container Style
  const isEditing = mode === 'template-editor';
  
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col p-8 space-y-8 font-sans">
      
      {/* 1. CABEÇALHO INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
        
        {/* Left Side: Logo & Company Name */}
        <div className="flex items-center gap-4">
          {companyBranding.companyLogoUrl ? (
            <div className="h-16 w-32 border border-slate-100 rounded-xl p-1.5 bg-white flex items-center justify-center shadow-xs overflow-hidden select-none shrink-0">
              <img src={companyBranding.companyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-extrabold text-sm shrink-0 shadow-inner select-none">
              {getInitials(companyBranding.companyName)}
            </div>
          )}
          
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              {companyBranding.tradeName || companyBranding.companyName || 'Sua Empresa'}
            </h2>
            {companyBranding.shortDescription && (
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">
                {companyBranding.shortDescription}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Solicitacao details */}
        <div className="text-right sm:text-right flex flex-col sm:items-end gap-1.5 select-none text-[11px] text-slate-500 font-medium font-mono">
          {mode === 'template-editor' || mode === 'template-preview' ? (
            <div className="space-y-1 text-[10px] text-slate-400 text-left sm:text-right">
              <p>Código da solicitação: <span className="italic font-bold">Gerado na publicação</span></p>
              <p>Revisão: <span className="italic">Definida na preparação</span></p>
              <Badge className="bg-slate-100 text-slate-500 border-slate-200 font-sans text-[9px] mt-1 select-none">Preview</Badge>
            </div>
          ) : (
            <div className="space-y-1 text-left sm:text-right font-sans">
              <p className="font-mono text-slate-655 text-[10.5px]">Código: <strong className="text-slate-800">{documentData.publication_code || 'PUB-000000'}</strong></p>
              <p className="text-slate-500 text-[10.5px]">Versão: <strong>{documentData.version ? String(documentData.version).padStart(2, '0') : '01'}</strong></p>
              {documentData.revision && <p className="text-slate-500 text-[10.5px]">Revisão Avaliada: <strong className="text-slate-800">{documentData.revision}</strong></p>}
              
              <div className="pt-1.5">
                {documentData.status === 'draft' && <Badge className="bg-slate-100 text-slate-700">Rascunho</Badge>}
                {documentData.status === 'ready' && <Badge className="bg-teal-50 text-teal-700 border-teal-200">Pronta para publicar</Badge>}
                {documentData.status === 'published' && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Publicada</Badge>}
                {documentData.status === 'validated' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Validada</Badge>}
                {documentData.status === 'revoked' && <Badge className="bg-red-50 text-red-700 border-red-200">Revogada</Badge>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. TÍTULO E DESCRIÇÃO DO FORMULÁRIO */}
      <div className="space-y-3 pb-3">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
          {documentData.title || 'Título do Formulário de Aprovação'}
        </h1>
        {documentData.description && (
          <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
            {documentData.description}
          </p>
        )}
      </div>

      {/* 3. DADOS DE CONFIGURAÇÃO AUSENTES WARNING IN EDITOR */}
      {isEditing && !companyBranding.companyName && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span>Configure a identidade da sua empresa para personalizar o formulário enviado ao cliente.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open('/app/perfil', '_blank')}
            className="border-amber-300 text-amber-900 bg-white hover:bg-amber-100/50 h-8 rounded-lg text-[10.5px] font-bold px-3 shrink-0"
          >
            Configurar Identidade
          </Button>
        </div>
      )}

      {/* 4. BLOCO INFORMAÇÕES GERAIS DA SOLICITAÇÃO */}
      {!hasRequestInfoBlock && (
        <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            Informações Gerais da Solicitação
          </h3>
          
          {mode === 'approval-preparation' ? (
            /* INTERACTIVE INPUTS FOR PREPARATION */
            renderRequestInfoForm(documentData, onDocumentDataChange)
          ) : (
            /* STATIC DISPLAY FOR CLIENT */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-700">
              {documentData.client && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Cliente</span>
                  <span className="font-semibold">{documentData.client}</span>
                </div>
              )}
              {documentData.project && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Projeto</span>
                  <span className="font-semibold">{documentData.project} {documentData.revision ? `(Rev ${documentData.revision})` : ''}</span>
                </div>
              )}
              {documentData.code && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Código</span>
                  <span className="font-semibold">{documentData.code}</span>
                </div>
              )}
              {documentData.deadline && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Prazo de Resposta</span>
                  <span className="font-semibold text-amber-700">{new Date(documentData.deadline).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
          )}

          {documentData.notes_for_client && (
            <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl text-xs text-slate-655 leading-relaxed">
              <span className="font-bold text-amber-800 block mb-1">Observações do Fornecedor:</span>
              {documentData.notes_for_client}
            </div>
          )}
        </div>
      )}

      {/* 5. BLOCO MATERIAIS PARA ANÁLISE */}
      {!hasAnalysisMaterialsBlock && (
        <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
          <div className="border-b border-slate-100 pb-1.5 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Materiais para Análise (Anexos da Empresa)
            </h3>
            {mode === 'template-editor' && (
              <Badge className="bg-teal-50 text-teal-700 text-[8px] font-mono border-0">TEMPLATE PLACEHOLDER</Badge>
            )}
          </div>

          {mode === 'template-editor' || mode === 'template-preview' ? (
            /* TEMPLATE PLACEHOLDER VISUAL CARD */
            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-white flex flex-col items-center justify-center space-y-1 text-slate-400 select-none">
              <FileText className="w-6 h-6 text-slate-350" />
              <p className="text-xs font-bold text-slate-550 uppercase tracking-wider pt-1">Arquivos e Documentos</p>
              <p className="text-[10px] text-slate-400">Os arquivos técnicos serão anexados individualmente durante a preparação da solicitação.</p>
            </div>
          ) : (
            /* REAL MATERIALS LIST */
            <div className="space-y-4">
              {mode === 'approval-preparation' && (
                <MaterialsUploaderForm onAddMaterial={onAddMaterial} />
              )}
              {materials.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhum material de análise adicionado ainda.</p>
              ) : (
                <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-xs">
                  {materials.map((mat: any) => (
                    <div key={mat.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/20 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-800">{mat.name}</span>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                              {mat.category}
                            </span>
                            {mat.revision && (
                              <span className="text-[9px] font-mono text-slate-400">({mat.revision})</span>
                            )}
                          </div>
                          {mat.description && <p className="text-[10px] text-slate-455 mt-0.5">{mat.description}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.storage
                                .from('request-materials')
                                .download(mat.filePath);
                              if (error) throw error;
                              const url = URL.createObjectURL(data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = mat.fileName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (err) {
                              console.error(err);
                              toast.error('Erro ao baixar arquivo de análise.');
                            }
                          }}
                          className="p-1.5 text-[#0d857a] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1 text-[11px] font-bold"
                        >
                          <FileDown className="w-4 h-4" />
                          Baixar
                        </button>
                        {mode === 'approval-preparation' && onRemoveMaterial && (
                          <button
                            type="button"
                            onClick={() => onRemoveMaterial(mat.id, mat.filePath)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                            title="Remover material"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. LISTAGEM DE QUESTÕES / QUESTÕES DO CANVASES */}
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <BlockWrapper
            key={block.id}
            block={block}
            mode={mode}
            isActive={activeBlockId === block.id}
            onSelect={onSelectBlock ? () => onSelectBlock(block.id) : undefined}
            onDelete={onDeleteBlock ? () => onDeleteBlock(block.id) : undefined}
            onMove={onMoveBlock ? (dir) => onMoveBlock(block.id, dir) : undefined}
            onDuplicate={onDuplicateBlock ? () => onDuplicateBlock(block.id) : undefined}
            onUpdate={onUpdateBlock ? (updatedBlock) => onUpdateBlock(block.id, updatedBlock) : undefined}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          >
            {/* Block Inner Rendering */}
            <BlockInnerRenderer
              block={block}
              mode={mode}
              answer={answers.find(a => a.blockId === block.id)}
              onAnswerChange={onAnswerChange ? (val) => onAnswerChange(block.id, val) : undefined}
              error={validationErrors[block.id]}
              documentData={documentData}
              materials={materials}
              isActive={activeBlockId === block.id}
              onUpdateBlock={onUpdateBlock ? (updatedBlock) => onUpdateBlock(block.id, updatedBlock) : undefined}
              onDocumentDataChange={onDocumentDataChange}
              onAddMaterial={onAddMaterial}
              onRemoveMaterial={onRemoveMaterial}
            />
          </BlockWrapper>
        ))}
      </div>

      {/* 7. IDENTIFICAÇÃO DO RESPONSÁVEL (SEÇÃO OBRIGATÓRIA) */}
      <div className="space-y-4 bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl">
        <div className="border-b border-slate-100 pb-1.5 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0d857a]" />
            Identificação do Responsável
          </h3>
          {(mode === 'template-editor' || mode === 'template-preview') && (
            <Badge className="bg-slate-200 text-slate-600 border-0 font-sans text-[8px] uppercase tracking-wider font-bold">
              Seção obrigatória da plataforma
            </Badge>
          )}
        </div>

        {mode === 'public-validation' ? (
          /* INTERACTIVE INPUTS FOR CLIENT */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="resp-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="resp-name"
                type="text"
                value={respondentName}
                onChange={(e) => onRespondentNameChange?.(e.target.value)}
                autoComplete="name"
                placeholder="Digite seu nome completo"
                className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
              />
              {validationErrors.respondentName && (
                <span className="text-[10px] text-red-500 font-semibold block">{validationErrors.respondentName}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resp-role" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cargo ou Função <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="resp-role"
                type="text"
                value={respondentRole}
                onChange={(e) => onRespondentRoleChange?.(e.target.value)}
                placeholder="Ex: Engenheiro de Qualidade"
                className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
              />
              {validationErrors.respondentRole && (
                <span className="text-[10px] text-red-500 font-semibold block">{validationErrors.respondentRole}</span>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-full">
              <Label htmlFor="resp-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                E-mail Profissional
              </Label>
              <Input 
                id="resp-email"
                type="email"
                value={respondentEmail}
                onChange={(e) => onRespondentEmailChange?.(e.target.value)}
                autoComplete="email"
                placeholder="nome@empresa.com"
                className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a]"
              />
            </div>
          </div>
        ) : (
          /* PREVIEW / READ-ONLY DISPLAY */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Nome completo:</span>
              {mode === 'read-only-result' ? respondentName : <span className="text-slate-350 italic">Será preenchido pelo cliente</span>}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Cargo ou Função:</span>
              {mode === 'read-only-result' ? respondentRole : <span className="text-slate-350 italic">Será preenchido pelo cliente</span>}
            </div>
            {(mode === 'read-only-result' || respondentEmail) && (
              <div className="col-span-full">
                <span className="text-[10px] text-slate-400 block font-medium">E-mail profissional:</span>
                {respondentEmail || <span className="text-slate-350 italic">Não informado</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. CONFIRMAÇÃO E ETAPA FINAL */}
      <div className="pt-6 border-t border-slate-200">
        {mode === 'public-validation' ? (
          /* ACTION ACTION FOR CLIENT VALIDATION */
          <div className="flex items-center justify-end">
            <Button
              type="button"
              onClick={onGoToReview}
              className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-10 px-5 rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1.5 text-xs"
            >
              <span>Revisar e Finalizar</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-900 stroke-[3px]" />
            </Button>
          </div>
        ) : mode === 'read-only-result' ? (
          /* AUDIT DETAILS IN RECEIPT */
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs select-none">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Processo Validado Digitalmente</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Protocolo criptográfico registrado com carimbo de data/hora.</p>
              </div>
            </div>
            
            {handleDownloadPDF && (
              <Button
                type="button"
                onClick={handleDownloadPDF}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5 text-[#0d857a]" />
                <span>Baixar Relatório PDF</span>
              </Button>
            )}
          </div>
        ) : mode === 'approval-preparation' ? (
          /* AREA DE CONCLUSÃO DA PREPARAÇÃO */
          <div className="bg-slate-50/50 border border-slate-200/80 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Finalizar preparação</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Revise as informações preenchidas e publique quando a aprovação estiver pronta para ser enviada ao cliente.
                </p>
              </div>

              {/* Estado de salvamento */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-slate-400">
                  {submitting ? (
                    <span className="flex items-center gap-1.5 text-teal-650 font-semibold bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold bg-slate-100/80 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                      <span>Alterações salvas</span>
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Resumo do estado da aprovação (Pendências) */}
            <div className="border-t border-b border-slate-150/65 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {(!pendingFields || pendingFields.length === 0) ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-700">Pronta para publicar</span>
                    <span className="text-slate-450 block text-[11px] mt-0.5">Todos os campos obrigatórios foram preenchidos.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-amber-700">Existem pendências</span>
                      <span className="text-slate-455 block text-[11px] mt-0.5">Preencha os campos obrigatórios antes de publicar.</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={onGoBack} // Ver pendências rolls back to first input
                    className="text-[#0d857a] hover:text-[#0b6a62] font-bold text-xs flex items-center gap-1 cursor-pointer border-0 bg-transparent"
                  >
                    <span>Ver pendências</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Ações Finais */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
              <Button
                type="button"
                onClick={onSaveDraft}
                disabled={submitting}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-10 px-5 text-xs font-bold rounded-xl cursor-pointer"
              >
                Salvar Rascunho
              </Button>
              {onGoToReview && (
                <Button
                  type="button"
                  onClick={onGoToReview}
                  disabled={submitting}
                  variant="outline"
                  className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer h-10 px-5 text-xs font-bold rounded-xl"
                >
                  Rever Aprovação
                </Button>
              )}
              <Button
                type="button"
                onClick={onPublish}
                disabled={submitting || (pendingFields && pendingFields.length > 0)}
                className="w-full sm:w-auto bg-[#00F59B] hover:bg-[#00D485] text-slate-900 h-10 px-6 text-xs font-bold rounded-xl border-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-[#00F59B]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                title={pendingFields && pendingFields.length > 0 ? "Conclua os campos obrigatórios para publicar." : ""}
              >
                <span>Publicar Agora</span>
              </Button>
            </div>
          </div>
        ) : (
          /* PREVIEW STUB FOR EDITOR */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-4.5 border border-slate-150 rounded-2xl text-xs select-none">
            <div className="flex items-center gap-2 text-slate-500">
              <Info className="w-4 h-4 text-slate-400" />
              <span>O cliente clicará aqui para avançar para a tela de revisão e confirmação final.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-indigo-50 text-indigo-700 font-sans text-[8px] uppercase tracking-wider font-bold">Etapa final da validação</Badge>
              <Button disabled={true} className="bg-[#00F59B] text-slate-900 h-9 px-4 text-xs font-bold rounded-xl opacity-60">Revisar e Finalizar</Button>
            </div>
          </div>
        )}
      </div>

      {/* 9. RODAPÉ INSTITUCIONAL */}
      <div className="pt-6 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[10.5px] text-slate-400 select-none">
        <div>
          <span className="font-semibold text-slate-500">{companyBranding.tradeName || companyBranding.companyName || 'Sua Empresa'}</span>
          {companyBranding.companyWebsite && <span className="mx-2">• {companyBranding.companyWebsite}</span>}
          {companyBranding.corporateEmail && <span className="mx-2">• {companyBranding.corporateEmail}</span>}
        </div>
        
        {companyBranding.footerText && (
          <p className="max-w-md text-center md:text-right leading-relaxed italic">
            {companyBranding.footerText}
          </p>
        )}
        
        <div className="flex items-center gap-1 pt-2 md:pt-0 font-medium tracking-tight">
          <Workflow className="w-3.5 h-3.5 text-slate-350" />
          <span>Validação digital processada pelo <strong className="text-slate-455">PERSPECPACK</strong></span>
        </div>
      </div>

    </div>
  );
}

interface BlockWrapperProps {
  block: Block;
  mode: RendererMode;
  isActive: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onMove?: (direction: 'up' | 'down') => void;
  onDuplicate?: () => void;
  onUpdate?: (updatedBlock: Block) => void;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}

/* BLOCK WRAPPER FOR TEMPLATE EDITING CONTROL AND DRAGGING */
function BlockWrapper({
  block,
  mode,
  isActive,
  onSelect,
  onDelete,
  onMove,
  onDuplicate,
  onUpdate,
  isFirst,
  isLast,
  children
}: BlockWrapperProps) {
  
  if (mode !== 'template-editor') {
    // Plain simple render for preview, validation, preparation
    return (
      <div className={isActive ? 'ring-2 ring-[#0d857a]/20 rounded-2xl' : ''}>
        {children}
      </div>
    );
  }

  // Sortable template editor code
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined
  };

  const isCompanyField = block.filledBy === 'company' || block.filledBy === 'both';
  const meta = BLOCK_METADATA[block.type];
  const isHeading = block.type === 'heading_text';

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      className="group relative scroll-mt-24 transition-all"
    >
      {/* Visual Outline Box */}
      <div
        onClick={onSelect}
        className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer relative ${
          isActive 
            ? 'border-[#0d857a] ring-2 ring-[#0d857a]/10 bg-[#0d857a]/[0.01]' 
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Editing Overlay Header */}
        <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100/60 pb-2">
          <div className="flex items-center gap-2">
            {/* Grip handle */}
            <div 
              {...attributes} 
              {...listeners} 
              className="p-1 text-slate-350 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-grab shrink-0"
              title="Arrastar para reordenar"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            
            <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              {block.title || <span className="text-slate-300 italic">Sem título</span>}
              {block.required && <span className="text-red-500 font-bold">*</span>}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 select-none">
            {/* FilledBy Badge */}
            <Badge className={`text-[8.5px] border-0 px-2 py-0.5 font-bold uppercase tracking-wider ${
              block.filledBy === 'company' 
                ? 'bg-teal-50 text-teal-700'
                : block.filledBy === 'both'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-655'
            }`}>
              {block.filledBy === 'company' ? 'Empresa' : block.filledBy === 'both' ? 'Ambos' : 'Cliente'}
            </Badge>

            {/* Block Type Category */}
            <span className="text-[10px] text-slate-400 font-medium font-mono">{meta?.title}</span>
          </div>
        </div>

        {/* Children Visual Component */}
        <div className="mb-4">
          {children}
        </div>

        {/* Selected Block Action Panel (Directly inside Card) */}
        {isActive && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Left: Reordering & Duplication & Delete */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {onMove && (
                <>
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={(e) => { e.stopPropagation(); onMove('up'); }}
                    className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={(e) => { e.stopPropagation(); onMove('down'); }}
                    className="h-8 w-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <div className="h-6 w-px bg-slate-200 mx-1" />
              
              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                  className="h-8 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-650 transition-all cursor-pointer"
                  title="Duplicar Bloco"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicar</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="h-8 px-2.5 bg-slate-50 hover:bg-red-50 hover:border-red-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-slate-200 transition-all cursor-pointer"
                  title="Excluir Bloco"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )}
            </div>

            {/* Right: Required Switch & FilledBy (only if not heading_text) */}
            {!isHeading && onUpdate && (
              <div className="flex items-center gap-4 flex-wrap self-end sm:self-center">
                {/* FilledBy Selector */}
                {block.type === 'request_information' || block.type === 'analysis_materials' ? (
                  <div className="flex items-center gap-2 select-none bg-slate-50/60 border border-slate-150 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Preenchido por
                    </span>
                    <span className="text-xs font-bold text-teal-600">
                      Empresa (Fixo)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 select-none bg-slate-50/60 border border-slate-150 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Preenchido por
                    </span>
                    <select
                      value={block.filledBy || 'client'}
                      onChange={(e) => onUpdate({ ...block, filledBy: e.target.value as any })}
                      className="text-xs font-semibold bg-transparent border-0 text-slate-700 outline-none cursor-pointer focus:ring-0"
                    >
                      <option value="client">Cliente</option>
                      <option value="company">Empresa</option>
                      <option value="both">Ambos</option>
                    </select>
                  </div>
                )}

                {/* Required Toggle */}
                <div className="flex items-center gap-3 select-none bg-slate-50/60 border border-slate-150 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Obrigatório
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={block.required}
                      onChange={(e) => onUpdate({ ...block, required: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d857a]"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* BLOCK INNER PREVIEW OR INPUT RENDERING based on Context Mode */
interface BlockInnerRendererProps {
  block: Block;
  mode: RendererMode;
  answer?: any;
  onAnswerChange?: (val: any) => void;
  error?: string;
  documentData?: DocumentData;
  materials?: any[];
  isActive?: boolean;
  onUpdateBlock?: (updatedBlock: Block) => void;
  onDocumentDataChange?: (data: Partial<DocumentData>) => void;
  onAddMaterial?: (file: File, name: string, category: string, revision?: string) => Promise<void>;
  onRemoveMaterial?: (materialId: string, filePath: string) => Promise<void>;
}

function renderRequestInfoForm(documentData: DocumentData, onDocumentDataChange?: (data: Partial<DocumentData>) => void) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Título da Solicitação *</Label>
        <Input
          value={documentData.title || ''}
          onChange={(e) => onDocumentDataChange?.({ title: e.target.value })}
          placeholder="Ex: Aprovação Rack Hyundai BC4B"
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Cliente *</Label>
        <Input
          value={documentData.client || ''}
          onChange={(e) => onDocumentDataChange?.({ client: e.target.value })}
          placeholder="Ex: Volkswagen do Brasil"
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Projeto *</Label>
        <Input
          value={documentData.project || ''}
          onChange={(e) => onDocumentDataChange?.({ project: e.target.value })}
          placeholder="Ex: Rack Hyundai BC4B"
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Código do Projeto</Label>
        <Input
          value={documentData.code || ''}
          onChange={(e) => onDocumentDataChange?.({ code: e.target.value })}
          placeholder="Ex: 407-034368-26"
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Revisão</Label>
        <Input
          value={documentData.revision || ''}
          onChange={(e) => onDocumentDataChange?.({ revision: e.target.value })}
          placeholder="Ex: 03"
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Responsável Interno</Label>
        <Input
          value={documentData.responsible_internal || ''}
          onChange={(e) => onDocumentDataChange?.({ responsible_internal: e.target.value })}
          placeholder="Ex: Nome do responsável"
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Prazo Limite para Resposta</Label>
        <Input
          type="datetime-local"
          value={documentData.deadline ? documentData.deadline.substring(0, 16) : ''}
          onChange={(e) => onDocumentDataChange?.({ deadline: e.target.value })}
          className="h-10 text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Descrição do Processo</Label>
        <Textarea
          value={documentData.description || ''}
          onChange={(e) => onDocumentDataChange?.({ description: e.target.value })}
          placeholder="Descrição geral sobre o que deve ser validado neste fluxo..."
          className="min-h-[80px] text-xs bg-white border-slate-200"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Observações / Instruções para o Cliente</Label>
        <Textarea
          value={documentData.notes_for_client || ''}
          onChange={(e) => onDocumentDataChange?.({ notes_for_client: e.target.value })}
          placeholder="Ex: Por favor, analise o desenho técnico..."
          className="min-h-[80px] text-xs bg-white border-slate-200"
        />
      </div>
    </div>
  );
}

interface MaterialsUploaderFormProps {
  onAddMaterial?: (file: File, name: string, category: string, revision?: string) => Promise<void>;
  block?: Block;
}

function MaterialsUploaderForm({ onAddMaterial, block }: MaterialsUploaderFormProps) {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [cat, setCat] = React.useState('Desenho Técnico');
  const [rev, setRev] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Por favor, selecione um arquivo.');
      return;
    }
    if (!name.trim()) {
      toast.error('Informe o nome do material.');
      return;
    }

    setLoading(true);
    try {
      if (onAddMaterial) {
        await onAddMaterial(file, name, cat, rev || undefined);
        setName('');
        setDesc('');
        setRev('');
        setFile(null);
        const fileInput = document.getElementById('materials-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4 mb-4 select-none">
      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Adicionar Material de Análise</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-450">Nome do Material *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Desenho Técnico Geral"
            className="h-8.5 text-xs bg-white border-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-450">Categoria {block?.requireCategory && '*'}</Label>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full h-8.5 border border-slate-200 bg-white rounded-lg text-xs px-2.5 outline-none"
          >
            <option>Desenho Técnico</option>
            <option>Modelo 3D</option>
            <option>Render/Imagem</option>
            <option>Vídeo de Funcionamento</option>
            <option>Planilha Técnica</option>
            <option>Relatório/Documento</option>
            <option>Outro</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-450">Revisão {block?.requireRevision && '*'}</Label>
          <Input
            value={rev}
            onChange={(e) => setRev(e.target.value)}
            placeholder="Ex: Rev A"
            className="h-8.5 text-xs bg-white border-slate-200"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[10px] font-bold text-slate-450">Arquivo * (PDF, STEP, DWG, ZIP, Imagens, etc)</Label>
          <Input
            id="materials-file-input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="h-8.5 text-xs bg-white py-1 border-slate-200"
          />
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-8.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer border-0 flex items-center justify-center gap-1"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Adicionar Anexo
          </Button>
        </div>
      </div>
    </form>
  );
}

function BlockInnerRenderer({
  block,
  mode,
  answer,
  onAnswerChange,
  error,
  documentData,
  materials = [],
  isActive = false,
  onUpdateBlock,
  onDocumentDataChange,
  onAddMaterial,
  onRemoveMaterial
}: BlockInnerRendererProps) {
  
  if (mode === 'template-editor' && isActive && onUpdateBlock) {
    const errors = validateBlock(block);
    const errorFields = errors.map(err => err.field);
    const props = { block, onChange: onUpdateBlock, errors: errorFields };
    switch (block.type) {
      case 'heading_text':
        return <HeadingTextBlockEditor {...props} />;
      case 'short_answer':
      case 'long_answer':
        return <TextAnswerBlockEditor {...props} />;
      case 'multiple_choice':
      case 'checkbox':
      case 'dropdown':
        return <ChoiceAnswerBlockEditor {...props} />;
      case 'date':
        return <DateBlockEditor {...props} />;
      case 'file_upload':
        return <FileUploadBlockEditor {...props} />;
      case 'approval_decision':
        return <ApprovalDecisionBlockEditor {...props} />;
      case 'acknowledgement':
        return <AcknowledgementBlockEditor {...props} />;
      case 'request_information':
        return <RequestInfoBlockEditor {...props} />;
      case 'analysis_materials':
        return <AnalysisMaterialsBlockEditor {...props} />;
      default:
        return null;
    }
  }

  const isReadOnly = mode === 'read-only-result' || mode === 'template-editor' || mode === 'template-preview';
  const isPublicValidation = mode === 'public-validation';
  const isPreparation = mode === 'approval-preparation';

  // Check if this block should be active for client/company input
  const isCompanyField = block.filledBy === 'company' || block.filledBy === 'both';
  const canRespond = (isPublicValidation && (block.filledBy === 'client' || block.filledBy === 'both')) ||
                     (isPreparation && isCompanyField);

  // Fallback check: if in public validation and is company-only block, display static read-only
  const isCompanyStaticOnClient = isPublicValidation && block.filledBy === 'company';

  // Value getter helper
  const val = canRespond 
    ? (isPreparation ? block.value : answer?.value)
    : (isCompanyStaticOnClient ? block.value : (answer?.value !== undefined ? answer.value : ''));

  switch (block.type) {
    case 'heading_text':
      return (
        <div className="space-y-1">
          {block.description && (
            <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">
              {block.description}
            </p>
          )}
        </div>
      );

    case 'request_information': {
      if (isPreparation) {
        return documentData ? renderRequestInfoForm(documentData, onDocumentDataChange) : null;
      }
      const enabledFields = (block.fields || []).filter(f => f.enabled && (isPreparation || f.visibleToClient));
      if (enabledFields.length === 0) {
        return <p className="text-xs text-slate-400 italic">Nenhuma informação geral visível.</p>;
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
          {enabledFields.map(field => {
            let fieldVal = '';
            if (field.key === 'title') fieldVal = documentData?.title || '';
            else if (field.key === 'client') fieldVal = documentData?.client || '';
            else if (field.key === 'project') fieldVal = documentData?.project || '';
            else if (field.key === 'code') fieldVal = documentData?.code || '';
            else if (field.key === 'revision') fieldVal = documentData?.revision || '';
            else if (field.key === 'responsible_internal') fieldVal = documentData?.responsible_internal || '';
            else if (field.key === 'deadline') fieldVal = documentData?.deadline ? new Date(documentData.deadline).toLocaleString('pt-BR') : '';
            else if (field.key === 'description') fieldVal = documentData?.description || '';
            else if (field.key === 'notes_for_client') fieldVal = documentData?.notes_for_client || '';

            return (
              <div key={field.id} className={`space-y-1 ${field.key === 'title' || field.key === 'description' || field.key === 'notes_for_client' ? 'col-span-full' : ''}`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label}</span>
                <span className="text-xs text-slate-800 font-semibold">{fieldVal || <span className="text-slate-300 italic font-normal">Não informado</span>}</span>
              </div>
            );
          })}
        </div>
      );
    }

    case 'analysis_materials': {
      return (
        <div className="space-y-4">
          {isPreparation && (
            <MaterialsUploaderForm onAddMaterial={onAddMaterial} block={block} />
          )}
          {materials.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum material de análise adicionado ainda.</p>
          ) : (
            <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-xs">
              {materials.map((mat: any) => (
                <div key={mat.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/20 bg-white">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">{mat.name}</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          {mat.category}
                        </span>
                        {mat.revision && (
                          <span className="text-[9px] font-mono text-slate-400">({mat.revision})</span>
                        )}
                      </div>
                      {mat.description && <p className="text-[10px] text-slate-455 mt-0.5">{mat.description}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.storage
                            .from('request-materials')
                            .download(mat.filePath);
                          if (error) throw error;
                          const url = URL.createObjectURL(data);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = mat.fileName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error(err);
                          toast.error('Erro ao baixar arquivo de análise.');
                        }
                      }}
                      className="p-1.5 text-[#0d857a] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1 text-[11px] font-bold"
                    >
                      <FileDown className="w-4 h-4" />
                      Baixar
                    </button>
                    {isPreparation && onRemoveMaterial && (
                      <button
                        type="button"
                        onClick={() => onRemoveMaterial(mat.id, mat.filePath)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                        title="Remover material"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'short_answer':
    case 'long_answer': {
      const fieldContent = (canRespond && onAnswerChange) ? (
        block.type === 'long_answer' ? (
          <Textarea 
            value={val || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={block.placeholder || 'Sua resposta longa...'}
            className="min-h-[80px] text-xs border-slate-200 bg-white"
          />
        ) : (
          <Input 
            value={val || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={block.placeholder || 'Sua resposta curta...'}
            className="h-9.5 text-xs border-slate-200 bg-white"
          />
        )
      ) : (
        <div className="text-xs text-slate-700 bg-slate-50/50 border border-slate-155 p-3 rounded-xl leading-relaxed whitespace-pre-wrap min-h-[38px] flex items-center w-full">
          {val ? String(val) : <span className="text-slate-350 italic">Sem resposta</span>}
        </div>
      );

      return (
        <div className="w-full">
          <BlockFieldHeader
            title={block.title}
            description={block.description}
            required={block.required}
            blockType={block.type}
            mode={mode}
            validationMessage={error}
          />
          {fieldContent}
        </div>
      );
    }

    case 'multiple_choice':
    case 'dropdown':
    case 'checkbox': {
      const isMultiple = block.type === 'checkbox';
      const isDropdown = block.type === 'dropdown';

      const getCheckboxState = (currentVal: any) => {
        if (Array.isArray(currentVal)) {
          const otherSelected = currentVal.includes('Outro');
          const list = currentVal.filter(item => item !== 'Outro');
          return { list, otherSelected, otherText: '' };
        }
        if (currentVal && typeof currentVal === 'object') {
          return {
            list: currentVal.list || [],
            otherSelected: !!currentVal.otherSelected,
            otherText: currentVal.otherText || ''
          };
        }
        return { list: [], otherSelected: false, otherText: '' };
      };

      const getRadioState = (currentVal: any) => {
        if (currentVal && typeof currentVal === 'object') {
          return {
            value: currentVal.value || '',
            otherSelected: !!currentVal.otherSelected,
            otherText: currentVal.otherText || ''
          };
        }
        if (typeof currentVal === 'string') {
          if (currentVal === 'Outro') {
            return { value: '', otherSelected: true, otherText: '' };
          }
          return { value: currentVal, otherSelected: false, otherText: '' };
        }
        return { value: '', otherSelected: false, otherText: '' };
      };

      let fieldContent = null;
      if (canRespond && onAnswerChange) {
        if (isDropdown) {
          fieldContent = (
            <select
              value={val || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              className="w-full max-w-xs h-9.5 border border-slate-200 bg-white rounded-lg text-xs px-2.5"
            >
              <option value="">Selecione uma opção...</option>
              {(block.options || []).map(opt => (
                <option key={opt.id} value={opt.text}>{opt.text}</option>
              ))}
            </select>
          );
        } else if (isMultiple) {
          const state = getCheckboxState(val);
          const handleOptionClick = (optText: string) => {
            const nextList = state.list.includes(optText)
              ? state.list.filter(t => t !== optText)
              : [...state.list, optText];
            onAnswerChange({ ...state, list: nextList });
          };
          const handleOtherClick = () => {
            onAnswerChange({ ...state, otherSelected: !state.otherSelected });
          };
          const handleOtherTextChange = (text: string) => {
            onAnswerChange({ ...state, otherText: text });
          };

          fieldContent = (
            <div className="space-y-2.5 pt-1">
              {(block.options || []).map(opt => {
                const isChecked = state.list.includes(opt.text);
                return (
                  <label key={opt.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleOptionClick(opt.text)}
                      className="rounded border-slate-300 text-[#0d857a] w-4 h-4 cursor-pointer"
                    />
                    <span>{opt.text}</span>
                  </label>
                );
              })}
              {block.allowOther && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.otherSelected}
                      onChange={handleOtherClick}
                      className="rounded border-slate-300 text-[#0d857a] w-4 h-4 cursor-pointer"
                    />
                    <span>Outro</span>
                  </label>
                  {state.otherSelected && (
                    <Input
                      type="text"
                      value={state.otherText}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      placeholder="Por favor, especifique..."
                      className="h-8.5 text-xs border-slate-200 bg-white max-w-xs focus-visible:border-[#0d857a]"
                    />
                  )}
                </div>
              )}
            </div>
          );
        } else {
          const state = getRadioState(val);
          const handleOptionClick = (optText: string) => {
            onAnswerChange(optText);
          };
          const handleOtherClick = () => {
            onAnswerChange({ value: '', otherSelected: true, otherText: '' });
          };
          const handleOtherTextChange = (text: string) => {
            onAnswerChange({ value: '', otherSelected: true, otherText: text });
          };

          fieldContent = (
            <div className="space-y-2.5 pt-1">
              {(block.options || []).map(opt => {
                const isChecked = !state.otherSelected && state.value === opt.text;
                return (
                  <label key={opt.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      checked={isChecked}
                      onChange={() => handleOptionClick(opt.text)}
                      className="rounded-full border-slate-300 text-[#0d857a] w-4.5 h-4.5 cursor-pointer"
                    />
                    <span>{opt.text}</span>
                  </label>
                );
              })}
              {block.allowOther && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      checked={state.otherSelected}
                      onChange={handleOtherClick}
                      className="rounded-full border-slate-300 text-[#0d857a] w-4.5 h-4.5 cursor-pointer"
                    />
                    <span>Outro</span>
                  </label>
                  {state.otherSelected && (
                    <Input
                      type="text"
                      value={state.otherText}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      placeholder="Por favor, especifique..."
                      className="h-8.5 text-xs border-slate-200 bg-white max-w-xs focus-visible:border-[#0d857a]"
                    />
                  )}
                </div>
              )}
            </div>
          );
        }
      } else {
        if (isDropdown) {
          fieldContent = (
            <div className="font-semibold text-slate-800">
              {val || <span className="text-slate-350 italic font-normal">Nenhuma selecionada</span>}
            </div>
          );
        } else if (isMultiple) {
          const state = getCheckboxState(val);
          fieldContent = (
            <div className="space-y-2 pt-1 text-xs">
              {(block.options || []).map(opt => {
                const isChecked = state.list.includes(opt.text);
                return (
                  <div key={opt.id} className="flex items-center gap-2.5 select-none opacity-85">
                    <div className={`h-4.5 w-4.5 border flex items-center justify-center rounded ${
                      isChecked 
                        ? 'border-[#0d857a] bg-[#0d857a]/10 text-[#0d857a]' 
                        : 'border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      {isChecked && <div className="h-2 w-2 bg-[#0d857a] rounded-full" />}
                    </div>
                    <span className={`font-medium ${isChecked ? 'text-slate-800 font-bold' : 'text-slate-505'}`}>{opt.text}</span>
                  </div>
                );
              })}
              {block.allowOther && (
                <div className="flex items-start gap-2.5 select-none opacity-85">
                  <div className={`h-4.5 w-4.5 border flex items-center justify-center rounded ${
                    state.otherSelected 
                      ? 'border-[#0d857a] bg-[#0d857a]/10 text-[#0d857a]' 
                      : 'border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    {state.otherSelected && <div className="h-2 w-2 bg-[#0d857a] rounded-full" />}
                  </div>
                  <span className={`font-medium ${state.otherSelected ? 'text-slate-800 font-bold' : 'text-slate-505'}`}>
                    Outro{state.otherSelected && state.otherText ? `: ${state.otherText}` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        } else {
          const state = getRadioState(val);
          fieldContent = (
            <div className="space-y-2 pt-1 text-xs">
              {(block.options || []).map(opt => {
                const isChecked = !state.otherSelected && state.value === opt.text;
                return (
                  <div key={opt.id} className="flex items-center gap-2.5 select-none opacity-85">
                    <div className={`h-4.5 w-4.5 border flex items-center justify-center rounded-full ${
                      isChecked 
                        ? 'border-[#0d857a] bg-[#0d857a]/10 text-[#0d857a]' 
                        : 'border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      {isChecked && <div className="h-2 w-2 bg-[#0d857a] rounded-full" />}
                    </div>
                    <span className={`font-medium ${isChecked ? 'text-slate-800 font-bold' : 'text-slate-505'}`}>{opt.text}</span>
                  </div>
                );
              })}
              {block.allowOther && (
                <div className="flex items-start gap-2.5 select-none opacity-85">
                  <div className={`h-4.5 w-4.5 border flex items-center justify-center rounded-full ${
                    state.otherSelected 
                      ? 'border-[#0d857a] bg-[#0d857a]/10 text-[#0d857a]' 
                      : 'border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    {state.otherSelected && <div className="h-2 w-2 bg-[#0d857a] rounded-full" />}
                  </div>
                  <span className={`font-medium ${state.otherSelected ? 'text-slate-800 font-bold' : 'text-slate-505'}`}>
                    Outro{state.otherSelected && state.otherText ? `: ${state.otherText}` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        }
      }

      return (
        <div className="w-full">
          <BlockFieldHeader
            title={block.title}
            description={block.description}
            required={block.required}
            blockType={block.type}
            mode={mode}
            validationMessage={error}
          />
          {fieldContent}
        </div>
      );
    }

    case 'date': {
      const fieldContent = (canRespond && onAnswerChange) ? (
        <Input 
          type="date"
          value={val || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          className="h-9.5 text-xs border-slate-200 bg-white max-w-xs"
        />
      ) : (
        <div className="text-xs text-slate-700 bg-slate-50/50 border border-slate-150 px-3.5 py-2.5 rounded-xl inline-flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{val ? new Date(val).toLocaleDateString('pt-BR') : <span className="text-slate-350 italic">Não selecionada</span>}</span>
        </div>
      );

      return (
        <div className="w-full">
          <BlockFieldHeader
            title={block.title}
            description={block.description}
            required={block.required}
            blockType={block.type}
            mode={mode}
            validationMessage={error}
          />
          {fieldContent}
        </div>
      );
    }

    case 'file_upload': {
      let fieldContent = null;
      // In template editor/preview, display generic placeholder
      if (mode === 'template-editor' || mode === 'template-preview') {
        fieldContent = (
          <div className="border border-dashed border-slate-250 rounded-xl p-4 bg-slate-50/40 text-center text-[11px] text-slate-400 select-none">
            Área de upload de arquivos (PDF, imagens, zip, etc.) que o cliente responderá.
          </div>
        );
      } else {
        fieldContent = isReadOnly ? (
          /* READ ONLY FILE LIST */
          (!val || val.length === 0) ? (
            <p className="text-xs text-slate-400 italic">Nenhum arquivo anexado.</p>
          ) : (
            <div className="border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
              {(val as any[]).map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-700 font-semibold">{f.originalName || f.fileName || f.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ACTIVE UPLOAD CONTROLS (TBD or using validation responses storage bucket) */
          <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-white flex flex-col items-center justify-center space-y-1.5 text-slate-400">
            <Plus className="w-5 h-5 text-slate-350" />
            <p className="text-xs font-bold text-slate-650 uppercase tracking-wider">Clique para anexar arquivo</p>
            <p className="text-[10px] text-slate-400">Máximo: {block.maxFiles || 5} arquivos, {block.maxSizeMB || 10}MB cada</p>
          </div>
        );
      }

      return (
        <div className="w-full">
          <BlockFieldHeader
            title={block.title}
            description={block.description}
            required={block.required}
            blockType={block.type}
            mode={mode}
            validationMessage={error}
          />
          {fieldContent}
        </div>
      );
    }

    case 'approval_decision': {
      const fieldContent = (canRespond && onAnswerChange) ? (
        <div className="space-y-3.5">
          <div className="flex flex-wrap gap-2 pt-1">
            {(block.decisions || []).map(dec => {
              const isSelected = val?.id === dec.id;
              let stylePill = 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50';
              if (isSelected) {
                stylePill = 
                  dec.semanticType === 'positive' ? 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' :
                  dec.semanticType === 'attention' ? 'border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20' :
                  dec.semanticType === 'negative' ? 'border-red-300 bg-red-50 text-red-800 ring-2 ring-red-500/20' :
                  'border-slate-800 bg-slate-900 text-white';
              }
              
              return (
                <button
                  type="button"
                  key={dec.id}
                  onClick={() => onAnswerChange({ id: dec.id, text: dec.text, semanticType: dec.semanticType, comment: val?.comment || '' })}
                  className={`text-[10px] px-3.5 py-1.5 border rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer ${stylePill}`}
                >
                  {dec.text}
                </button>
              );
            })}
          </div>
          
          {/* Conditional Comments */}
          {(() => {
            const decOpt = block.decisions?.find((d: any) => d.id === val?.id);
            if (decOpt) {
              return (
                <div className="space-y-1.5 animate-fadeIn">
                  <Label htmlFor={`comment-${block.id}`} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Justificativa / Comentários {decOpt.requireComment && <span className="text-red-500 font-bold">*</span>}
                  </Label>
                  <Textarea 
                    id={`comment-${block.id}`}
                    value={val?.comment || ''}
                    onChange={(e) => onAnswerChange({ ...val, comment: e.target.value })}
                    placeholder={decOpt.requireComment 
                      ? "É obrigatório inserir uma justificativa para a decisão selecionada..." 
                      : "Justificativa ou comentário adicional (opcional)..."
                    }
                    className="min-h-[80px] text-xs border-slate-200 focus-visible:border-[#0d857a]"
                  />
                </div>
              );
            }
            return null;
          })()}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {val?.id ? (
            <div className="space-y-3">
              {(() => {
                const decStyle = 
                  val.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
                  val.semanticType === 'attention' ? 'bg-amber-50 text-amber-800 border-amber-250' :
                  val.semanticType === 'negative' ? 'bg-red-50 text-red-800 border-red-250' :
                  'bg-slate-50 text-slate-800 border-slate-250';
                return (
                  <div className={`border rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider inline-block ${decStyle}`}>
                    {val.text}
                  </div>
                );
              })()}
              
              {val.comment && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-1">Comentários / Justificativa:</span>
                  {val.comment}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Nenhuma decisão registrada.</p>
          )}
        </div>
      );

      return (
        <div className="w-full">
          <BlockFieldHeader
            title={block.title}
            description={block.description}
            required={block.required}
            blockType={block.type}
            mode={mode}
            validationMessage={error}
          />
          {fieldContent}
        </div>
      );
    }

    case 'acknowledgement': {
      const fieldContent = (canRespond && onAnswerChange) ? (
        <label className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
          <input
            type="checkbox"
            checked={val === true}
            onChange={(e) => onAnswerChange(e.target.checked)}
            className="rounded border-slate-300 text-[#0d857a] w-4.5 h-4.5 mt-0.5 cursor-pointer shrink-0"
          />
          <div>
            <span className="font-semibold block text-slate-800">Declaração de ciência e conformidade</span>
            <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 border border-slate-200/80 p-3 rounded-lg leading-relaxed whitespace-pre-line italic">
              "{block.declarationText || 'Confirmo que revisei o projeto e autorizo o início das atividades correspondentes.'}"
            </p>
          </div>
        </label>
      ) : (
        <div className="text-xs leading-relaxed space-y-3.5 select-none">
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl italic text-slate-655 whitespace-pre-line">
            "{block.declarationText || 'Confirmo que revisei o projeto e autorizo o início das atividades correspondentes.'}"
          </div>
          
          <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider select-none ${
            val === true ? 'text-emerald-700' : 'text-slate-400 italic font-semibold'
          }`}>
            <CheckCircle className={`w-5 h-5 shrink-0 ${val === true ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>{val === true ? 'Termo aceito e assinado digitalmente' : 'Termo ainda não aceito'}</span>
          </div>
        </div>
      );

      return (
        <div className="w-full">
          <BlockFieldHeader
            title={block.title}
            description={block.description}
            required={block.required}
            blockType={block.type}
            mode={mode}
            validationMessage={error}
          />
          {fieldContent}
        </div>
      );
    }

    default:
      return null;
  }
}
