import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Workflow, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  UploadCloud, 
  X, 
  Clock, 
  ShieldCheck, 
  FileDown, 
  ArrowLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Block, validateBlock } from '@/src/components/processos/BlockFactory';
import { generatePDFReport, exportTXTFile, generateTXTComprovante } from '@/src/utils/exportUtils';

interface AnswerState {
  blockId: string;
  value: any; // Can be text, choice array, file list, decision obj, etc.
}

interface ValidationErrors {
  [key: string]: string;
}

export default function ValidarPublico() {
  const { token } = useParams<{ token: string }>();
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Publication details
  const [publication, setPublication] = useState<any>(null);
  const [legacyResponse, setLegacyResponse] = useState<any>(null);
  
  // Active preenchimento state
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Form, 2 = Review, 3 = Success
  const [respondentName, setRespondentName] = useState('');
  const [respondentRole, setRespondentRole] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [uploadsProgress, setUploadsProgress] = useState<{ [blockId: string]: number }>({});
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Load publication by token
  const loadPublication = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!supabase) {
        throw new Error('As credenciais do Supabase não estão configuradas.');
      }
      
      const { data, error } = await supabase.rpc('get_public_publication', {
        p_token: token
      });
      
      if (error) throw error;
      
      if (!data) {
        setErrorMsg('Esta publicação não foi encontrada ou foi revogada.');
        return;
      }
      
      setPublication(data.publication);
      
      if (data.publication.status === 'validated') {
        setLegacyResponse(data.response);
      }
      
      // Initialize answers array
      const blocks = data.publication.snapshot?.blocks || [];
      const initialAnswers: AnswerState[] = blocks.map((block: Block) => {
        let defaultValue: any = '';
        if (block.type === 'checkbox') {
          defaultValue = [];
        } else if (block.type === 'acknowledgement') {
          defaultValue = false;
        } else if (block.type === 'approval_decision') {
          defaultValue = { id: '', text: '', comment: '' };
        } else if (block.type === 'file_upload') {
          defaultValue = [];
        }
        return { blockId: block.id, value: defaultValue };
      });
      setAnswers(initialAnswers);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar a página de validação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPublication();
    }
  }, [token]);

  // Answer handler
  const handleAnswerChange = (blockId: string, value: any) => {
    setAnswers(prev => prev.map(ans => ans.blockId === blockId ? { ...ans, value } : ans));
    
    // Clear error for this field
    if (formErrors[blockId]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[blockId];
        return copy;
      });
    }
  };

  // Upload file helper
  const handleFileUpload = async (block: Block, files: FileList | null) => {
    if (!files || files.length === 0 || !supabase) return;
    
    const maxFiles = block.maxFiles || 1;
    const maxSize = block.maxSizeMB || 10;
    const currentFiles = answers.find(a => a.blockId === block.id)?.value || [];
    
    if (currentFiles.length + files.length > maxFiles) {
      toast.error(`Você pode enviar no máximo ${maxFiles} arquivo(s) neste campo.`);
      return;
    }

    setUploadsProgress(prev => ({ ...prev, [block.id]: 10 }));
    
    const newUploadedFiles = [...currentFiles];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate Size
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`O arquivo "${file.name}" excede o tamanho máximo de ${maxSize}MB.`);
          continue;
        }
        
        // Validate Type
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const allowedTypes = block.allowedFileTypes || [];
        const isTypeAllowed = allowedTypes.some(type => {
          if (type === 'images' && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return true;
          if (type === 'pdf' && ext === 'pdf') return true;
          if (type === 'documents' && ['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return true;
          if (type === 'spreadsheets' && ['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return true;
          if (type === 'cad' && ['dwg', 'dxf', 'step', 'stp', 'iges', 'igs'].includes(ext)) return true;
          if (type === 'others') return true;
          return false;
        });

        if (!isTypeAllowed) {
          toast.error(`A extensão .${ext} não é permitida para o arquivo "${file.name}".`);
          continue;
        }

        setUploadsProgress(prev => ({ ...prev, [block.id]: 30 }));

        // Upload to private bucket validation-attachments
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_{2,}/g, '_');
        const uuid = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
        const storagePath = `${token}/${uuid}-${cleanFileName}`;
        
        const { data, error } = await supabase.storage
          .from('validation-attachments')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (error) throw error;
        
        newUploadedFiles.push({
          name: file.name,
          size: file.size,
          path: storagePath,
          mimeType: file.type
        });
        
        setUploadsProgress(prev => ({ ...prev, [block.id]: 70 }));
      }
      
      handleAnswerChange(block.id, newUploadedFiles);
      setUploadsProgress(prev => ({ ...prev, [block.id]: 100 }));
      toast.success('Upload concluído com sucesso.');
      
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar arquivos.');
    } finally {
      setTimeout(() => {
        setUploadsProgress(prev => {
          const copy = { ...prev };
          delete copy[block.id];
          return copy;
        });
      }, 800);
    }
  };

  const handleRemoveFile = async (blockId: string, filePath: string) => {
    try {
      if (supabase) {
        // Delete file from private storage
        await supabase.storage.from('validation-attachments').remove([filePath]);
      }
      const currentFiles = answers.find(a => a.blockId === blockId)?.value || [];
      const updated = currentFiles.filter((f: any) => f.path !== filePath);
      handleAnswerChange(blockId, updated);
      toast.success('Arquivo removido');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover arquivo.');
    }
  };

  // Frontend validations before step 2 review
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // 1. Validate respondent ID
    if (!respondentName.trim()) {
      errors.respondentName = 'O nome completo é obrigatório.';
    } else if (respondentName.trim().length < 3) {
      errors.respondentName = 'O nome deve conter pelo menos 3 caracteres.';
    }

    if (!respondentRole.trim()) {
      errors.respondentRole = 'O cargo ou função é obrigatório.';
    } else if (respondentRole.trim().length < 2) {
      errors.respondentRole = 'O cargo deve conter pelo menos 2 caracteres.';
    }

    if (respondentEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(respondentEmail.trim())) {
        errors.respondentEmail = 'Insira um endereço de e-mail válido.';
      }
    }

    // 2. Validate Blocks
    const blocks = publication.snapshot?.blocks || [];
    blocks.forEach((block: Block) => {
      const ans = answers.find(a => a.blockId === block.id);
      const val = ans?.value;

      if (block.required) {
        if (block.type === 'acknowledgement' && val !== true) {
          errors[block.id] = 'Você deve aceitar a declaração de ciência para prosseguir.';
        } else if (block.type === 'approval_decision') {
          if (!val?.id) {
            errors[block.id] = 'Selecione uma decisão de aprovação.';
          } else {
            const decOpt = block.decisions?.find((d: any) => d.id === val.id);
            if (decOpt?.requireComment && !val?.comment?.trim()) {
              errors[block.id] = 'É obrigatório inserir um comentário/justificativa para esta decisão.';
            }
          }
        } else if (block.type === 'checkbox') {
          if (!Array.isArray(val) || val.length === 0) {
            errors[block.id] = 'Selecione pelo menos uma opção.';
          }
        } else if (block.type === 'file_upload') {
          if (!Array.isArray(val) || val.length === 0) {
            errors[block.id] = 'É obrigatório anexar pelo menos um arquivo.';
          }
        } else if (!val || (typeof val === 'string' && !val.trim())) {
          errors[block.id] = 'Este campo é obrigatório.';
        }
      }

      // Check min/max checkbox limits
      if (block.type === 'checkbox' && Array.isArray(val) && val.length > 0) {
        if (block.minSelections !== undefined && val.length < block.minSelections) {
          errors[block.id] = `Selecione no mínimo ${block.minSelections} opção(ões).`;
        }
        if (block.maxSelections !== undefined && val.length > block.maxSelections) {
          errors[block.id] = `Selecione no máximo ${block.maxSelections} opção(ões).`;
        }
      }
    });

    setFormErrors(errors);
    
    const isValid = Object.keys(errors).length === 0;
    
    if (!isValid) {
      toast.error('Por favor, corrija os erros de validação antes de avançar.');
      // Scroll to first error
      setTimeout(() => {
        const firstErrKey = Object.keys(errors)[0];
        const el = document.getElementById(`field-wrapper-${firstErrKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    
    return isValid;
  };

  const handleGoToReview = () => {
    if (validateForm()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit response via RPC
  const handleSubmitResponse = async () => {
    setSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase desconfigurado.');

      // Extract primary decision
      const blocks = publication.snapshot?.blocks || [];
      const decisionBlocks = blocks.filter((b: Block) => b.type === 'approval_decision');
      
      let primaryDecisionObj = null;
      if (decisionBlocks.length > 0) {
        const lastDecBlock = decisionBlocks[decisionBlocks.length - 1];
        const ans = answers.find(a => a.blockId === lastDecBlock.id);
        if (ans && ans.value?.id) {
          primaryDecisionObj = {
            id: ans.value.id,
            text: ans.value.text,
            comment: ans.value.comment,
            semanticType: ans.value.semanticType
          };
        }
      }

      // Extract attachments to separate parameter
      const attachmentList: any[] = [];
      answers.forEach(ans => {
        const block = blocks.find((b: Block) => b.id === ans.blockId);
        if (block?.type === 'file_upload' && Array.isArray(ans.value)) {
          ans.value.forEach((file: any) => {
            attachmentList.push({
              block_id: block.id,
              storage_path: file.path,
              original_name: file.name,
              mime_type: file.mimeType,
              size_bytes: file.size
            });
          });
        }
      });

      // Invoke transaction secure RPC
      const { data, error } = await supabase.rpc('submit_validation_response', {
        p_token: token,
        p_respondent_name: respondentName.trim(),
        p_respondent_role: respondentRole.trim(),
        p_respondent_email: respondentEmail.trim() || null,
        p_answers: answers,
        p_primary_decision: primaryDecisionObj,
        p_attachments: attachmentList
      });

      if (error) throw error;

      setSuccessData(data);
      setStep(3);
      toast.success('Validação registrada com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao registrar validação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Download Comprovante handlers
  const handleDownloadPDF = () => {
    if (!publication || !successData) return;
    generatePDFReport(publication, successData);
  };

  const handleDownloadTXT = () => {
    if (!publication || !successData) return;
    const txt = generateTXTComprovante(publication, successData);
    exportTXTFile(`Comprovante-${successData.protocol}.txt`, txt);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Carregando validação digital...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-xs space-y-6">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Indisponível</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {errorMsg}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Already validated view
  if (legacyResponse) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-[#0d857a]/5 border-b border-slate-100 p-6 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d857a] mx-auto shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Esta validação já foi concluída</h2>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Protocolo: {legacyResponse.protocol}
            </span>
          </div>

          <div className="p-8 space-y-6 divide-y divide-slate-100">
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Dados do Responsável
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nome:</span>
                  {legacyResponse.respondent_name}
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cargo ou Função:</span>
                  {legacyResponse.respondent_role}
                </div>
                {legacyResponse.respondent_email && (
                  <div className="col-span-full">
                    <span className="text-slate-400 block text-[11px]">E-mail:</span>
                    {legacyResponse.respondent_email}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Decisão Final Registrada
              </h3>
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {legacyResponse.primary_decision?.text || 'Decisão concluída'}
                </span>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 border rounded-lg ${
                  legacyResponse.primary_decision?.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  legacyResponse.primary_decision?.semanticType === 'attention' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  legacyResponse.primary_decision?.semanticType === 'negative' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-slate-50 text-slate-700 border-slate-100'
                }`}>
                  {legacyResponse.primary_decision?.semanticType || 'neutro'}
                </span>
              </div>
              
              {legacyResponse.primary_decision?.comment && (
                <div className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <span className="font-semibold block mb-1">Comentário/Justificativa:</span>
                  {legacyResponse.primary_decision.comment}
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-center text-[11px] text-slate-400 font-medium">
              Validado em {new Date(legacyResponse.submitted_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      {/* HEADER LOGO */}
      <div className="max-w-2xl mx-auto flex items-center justify-between pb-6 border-b border-slate-200 mb-8 px-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#0d857a] rounded-lg flex items-center justify-center text-white">
            <Workflow className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-sm">PERSPECPACK</span>
        </div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-200/60 border border-slate-300/40 px-3 py-1 rounded-lg">
          Validação Digital
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          /* STEP 1: FILL FORM */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs p-8 space-y-8"
          >
            {/* Process details */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-xl font-bold text-slate-850 tracking-tight leading-tight">
                  {publication.snapshot?.name}
                </h1>
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-md shrink-0">
                  {publication.publication_code}
                </span>
              </div>
              
              {publication.snapshot?.description && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {publication.snapshot.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 pt-1 font-medium">
                {publication.organization && (
                  <span>Empresa responsável: <strong>{publication.organization}</strong></span>
                )}
                <span>Versão: <strong>{String(publication.version).padStart(2, '0')}</strong></span>
                <span>Publicado em: <strong>{new Date(publication.published_at).toLocaleDateString('pt-BR')}</strong></span>
              </div>
            </div>

            {/* MANDATORY IDENTIFICATION */}
            <div className="space-y-4 bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0d857a]" />
                Identificação do Responsável
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5" id="field-wrapper-respondentName">
                  <Label htmlFor="resp-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="resp-name"
                    type="text"
                    value={respondentName}
                    onChange={(e) => {
                      setRespondentName(e.target.value);
                      if (formErrors.respondentName) setFormErrors(prev => { const c = { ...prev }; delete c.respondentName; return c; });
                    }}
                    autoComplete="name"
                    placeholder="Digite seu nome completo"
                    className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                  />
                  {formErrors.respondentName && (
                    <span className="text-[10px] text-red-500 font-semibold block">{formErrors.respondentName}</span>
                  )}
                </div>

                <div className="space-y-1.5" id="field-wrapper-respondentRole">
                  <Label htmlFor="resp-role" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Cargo ou Função <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="resp-role"
                    type="text"
                    value={respondentRole}
                    onChange={(e) => {
                      setRespondentRole(e.target.value);
                      if (formErrors.respondentRole) setFormErrors(prev => { const c = { ...prev }; delete c.respondentRole; return c; });
                    }}
                    autoComplete="organization-title"
                    placeholder="Ex: Engenheiro da Qualidade"
                    className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                  />
                  {formErrors.respondentRole && (
                    <span className="text-[10px] text-red-500 font-semibold block">{formErrors.respondentRole}</span>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2" id="field-wrapper-respondentEmail">
                  <Label htmlFor="resp-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    E-mail Profissional (opcional)
                  </Label>
                  <Input 
                    id="resp-email"
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => {
                      setRespondentEmail(e.target.value);
                      if (formErrors.respondentEmail) setFormErrors(prev => { const c = { ...prev }; delete c.respondentEmail; return c; });
                    }}
                    autoComplete="email"
                    placeholder="Ex: seu.nome@empresa.com"
                    className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                  />
                  {formErrors.respondentEmail && (
                    <span className="text-[10px] text-red-500 font-semibold block">{formErrors.respondentEmail}</span>
                  )}
                </div>
              </div>
            </div>

            {/* BLOCKS RENDERER */}
            <div className="space-y-8 pt-4">
              {(publication.snapshot?.blocks || []).map((block: Block, index: number) => {
                const ans = answers.find(a => a.blockId === block.id);
                const value = ans?.value;
                const error = formErrors[block.id];

                return (
                  <div 
                    key={block.id} 
                    id={`field-wrapper-${block.id}`}
                    className={`space-y-3 pb-6 border-b border-slate-100 last:border-b-0 last:pb-0 ${
                      error ? 'ring-2 ring-red-500/10 p-4 rounded-xl border border-red-200/60 bg-red-50/5' : ''
                    }`}
                  >
                    {/* Block title and desc */}
                    {block.type !== 'heading_text' && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-slate-800 text-[13.5px] leading-tight flex items-center gap-1">
                          <span>{index + 1}. {block.title}</span>
                          {block.required && <span className="text-red-500 font-bold">*</span>}
                        </h4>
                        {block.description && (
                          <p className="text-slate-455 text-[11px] leading-relaxed">{block.description}</p>
                        )}
                      </div>
                    )}

                    {/* INPUTS RENDERERS */}
                    {block.type === 'heading_text' && (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                        <h2 className="font-bold text-slate-800 text-[15px]">{block.title}</h2>
                        {block.description && (
                          <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">{block.description}</p>
                        )}
                      </div>
                    )}

                    {block.type === 'short_answer' && (
                      <Input 
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                        placeholder={block.placeholder || 'Sua resposta...'}
                        maxLength={block.maxLength}
                        className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                      />
                    )}

                    {block.type === 'long_answer' && (
                      <div className="space-y-1">
                        <Textarea 
                          value={value || ''}
                          onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                          placeholder={block.placeholder || 'Escreva sua resposta detalhada...'}
                          maxLength={block.maxLength}
                          className="min-h-[90px] text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 p-2.5"
                        />
                        {block.maxLength && (
                          <div className="text-[10px] text-right text-slate-400 font-medium">
                            {String(value || '').length}/{block.maxLength} caracteres
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'multiple_choice' && (
                      <div className="space-y-2 pt-0.5">
                        {(block.options || []).map(opt => {
                          const isSelected = value === opt.text;
                          return (
                            <div 
                              key={opt.id} 
                              onClick={() => handleAnswerChange(block.id, opt.text)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className={`h-4.5 w-4.5 border rounded-full flex items-center justify-center ${
                                isSelected ? 'border-[#0d857a] bg-[#0d857a]/5' : 'border-slate-300 bg-white group-hover:border-slate-400'
                              } transition-all`}>
                                {isSelected && <div className="h-2 w-2 rounded-full bg-[#0d857a]" />}
                              </div>
                              <span className="text-xs text-slate-750 font-medium">{opt.text}</span>
                            </div>
                          );
                        })}
                        {block.allowOther && (
                          <div className="space-y-2 pt-1">
                            <div 
                              onClick={() => handleAnswerChange(block.id, { otherSelected: true, otherText: '' })}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div className={`h-4.5 w-4.5 border rounded-full flex items-center justify-center ${
                                value?.otherSelected ? 'border-[#0d857a] bg-[#0d857a]/5' : 'border-slate-300 bg-white'
                              }`}>
                                {value?.otherSelected && <div className="h-2 w-2 rounded-full bg-[#0d857a]" />}
                              </div>
                              <span className="text-xs text-slate-500 italic">Outro...</span>
                            </div>
                            {value?.otherSelected && (
                              <Input 
                                type="text"
                                value={value?.otherText || ''}
                                onChange={(e) => handleAnswerChange(block.id, { otherSelected: true, otherText: e.target.value })}
                                placeholder="Especifique a opção..."
                                className="h-8.5 text-xs border-slate-200 focus-visible:border-[#0d857a] max-w-sm"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'checkbox' && (
                      <div className="space-y-2 pt-0.5">
                        {(block.options || []).map(opt => {
                          const isChecked = Array.isArray(value) && value.includes(opt.text);
                          const toggleCheck = () => {
                            const current = Array.isArray(value) ? value : [];
                            if (isChecked) {
                              handleAnswerChange(block.id, current.filter(v => v !== opt.text));
                            } else {
                              handleAnswerChange(block.id, [...current, opt.text]);
                            }
                          };
                          return (
                            <div 
                              key={opt.id} 
                              onClick={toggleCheck}
                              className="flex items-start gap-3 cursor-pointer group"
                            >
                              <div className={`h-4.5 w-4.5 border rounded flex items-center justify-center shrink-0 mt-0.5 ${
                                isChecked ? 'border-[#0d857a] bg-[#0d857a] text-white' : 'border-slate-300 bg-white group-hover:border-slate-400'
                              } transition-all`}>
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                              </div>
                              <span className="text-xs text-slate-750 font-medium leading-tight">{opt.text}</span>
                            </div>
                          );
                        })}
                        
                        {block.allowOther && (
                          <div className="space-y-2 pt-1">
                            <div 
                              onClick={() => {
                                const current = typeof value === 'object' && value !== null && !Array.isArray(value) ? value : { list: [], otherSelected: false, otherText: '' };
                                handleAnswerChange(block.id, { ...current, otherSelected: !current.otherSelected });
                              }}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div className={`h-4.5 w-4.5 border rounded flex items-center justify-center ${
                                value?.otherSelected ? 'border-[#0d857a] bg-[#0d857a] text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {value?.otherSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                              </div>
                              <span className="text-xs text-slate-500 italic">Outro...</span>
                            </div>
                            {value?.otherSelected && (
                              <Input 
                                type="text"
                                value={value?.otherText || ''}
                                onChange={(e) => handleAnswerChange(block.id, { ...value, otherText: e.target.value })}
                                placeholder="Especifique a opção..."
                                className="h-8.5 text-xs border-slate-200 focus-visible:border-[#0d857a] max-w-sm"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'dropdown' && (
                      <select
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                        className="h-9.5 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700 w-full max-w-md focus:border-[#0d857a] focus:ring-1 focus:ring-[#0d857a]/20 outline-none"
                      >
                        <option value="">Selecione uma opção...</option>
                        {(block.options || []).map(opt => (
                          <option key={opt.id} value={opt.text}>{opt.text}</option>
                        ))}
                      </select>
                    )}

                    {block.type === 'date' && (
                      <div className="space-y-1">
                        <Input 
                          type="date"
                          value={value || ''}
                          onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                          className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 max-w-xs bg-white text-slate-700"
                        />
                      </div>
                    )}

                    {block.type === 'file_upload' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="relative cursor-pointer">
                            <input 
                              type="file"
                              multiple={(block.maxFiles || 1) > 1}
                              onChange={(e) => handleFileUpload(block, e.target.files)}
                              className="sr-only"
                              disabled={uploadsProgress[block.id] !== undefined}
                            />
                            <div className="flex items-center gap-2 h-9 px-4 border border-dashed border-slate-300 hover:border-[#0d857a] hover:bg-[#0d857a]/5 text-slate-650 hover:text-[#0d857a] rounded-xl text-xs font-semibold transition-all">
                              <UploadCloud className="w-4 h-4" />
                              <span>Selecionar arquivo(s)</span>
                            </div>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Máximo: {block.maxFiles || 1} arquivo(s) de até {block.maxSizeMB || 10} MB.
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {uploadsProgress[block.id] !== undefined && (
                          <div className="space-y-1.5 max-w-sm">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Enviando arquivo...</span>
                              <span>{uploadsProgress[block.id]}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#0d857a] transition-all duration-200" 
                                style={{ width: `${uploadsProgress[block.id]}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Uploaded Files List */}
                        {Array.isArray(value) && value.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                            {value.map((file: any) => (
                              <div key={file.path} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">
                                      {file.name}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(block.id, file.path)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'acknowledgement' && (
                      <div className="flex items-start gap-3 bg-slate-50/50 border border-slate-150 p-4.5 rounded-2xl cursor-pointer"
                           onClick={() => handleAnswerChange(block.id, !value)}>
                        <div className={`h-4.5 w-4.5 border rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          value === true ? 'border-[#0d857a] bg-[#0d857a] text-white' : 'border-slate-300 bg-white'
                        } transition-all`}>
                          {value === true && <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>
                        <span className="text-xs text-slate-750 font-medium leading-relaxed select-none">
                          {block.declarationText}
                        </span>
                      </div>
                    )}

                    {block.type === 'approval_decision' && (
                      <div className="space-y-4">
                        <div className="flex gap-2 flex-wrap pt-1">
                          {(block.decisions || []).map(dec => {
                            const isSelected = value?.id === dec.id;
                            
                            const stylePill = 
                              isSelected ? (
                                dec.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/10' :
                                dec.semanticType === 'attention' ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-500/10' :
                                dec.semanticType === 'negative' ? 'bg-red-50 text-red-800 border-red-300 ring-2 ring-red-500/10' :
                                'bg-slate-100 text-slate-800 border-slate-350'
                              ) : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500';
                            
                            return (
                              <button
                                type="button"
                                key={dec.id}
                                onClick={() => handleAnswerChange(block.id, { id: dec.id, text: dec.text, semanticType: dec.semanticType, comment: value?.comment || '' })}
                                className={`text-[10px] px-3.5 py-1.5 border rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer ${stylePill}`}
                              >
                                {dec.text}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Conditional Comments */}
                        {(() => {
                          const decOpt = block.decisions?.find((d: any) => d.id === value?.id);
                          if (decOpt) {
                            return (
                              <div className="space-y-1.5 animate-fadeIn">
                                <Label htmlFor={`comment-${block.id}`} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Justificativa / Comentários {decOpt.requireComment && <span className="text-red-500 font-bold">*</span>}
                                </Label>
                                <Textarea 
                                  id={`comment-${block.id}`}
                                  value={value?.comment || ''}
                                  onChange={(e) => handleAnswerChange(block.id, { ...value, comment: e.target.value })}
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
                    )}

                    {/* Field Error Message */}
                    {error && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-semibold pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                type="button"
                onClick={handleGoToReview}
                className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-10 px-5 rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1 text-xs"
              >
                <span>Revisar e Finalizar</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-900 stroke-[3px]" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          /* STEP 2: CONFIRMATION REVIEW */
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs p-8 space-y-8"
          >
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
                <h3 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
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
                <h3 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
                  Resultado Principal
                </h3>
                {(() => {
                  const blocks = publication.snapshot?.blocks || [];
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
                          <span className="text-[9px] font-bold opacity-80">{ans.value.semanticType}</span>
                        </div>
                      );
                    }
                  }
                  return <p className="text-xs text-slate-500 italic">Nenhum bloco de aprovação definido no processo.</p>;
                })()}
              </div>

              {/* Total responses summary */}
              <div className="space-y-3 pt-5">
                <h3 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
                  Dados do Envio
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-650">
                  <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Campos Respondidos</span>
                    {answers.filter(a => {
                      const block = publication.snapshot?.blocks?.find((b: any) => b.id === a.blockId);
                      if (block?.type === 'heading_text') return false;
                      if (Array.isArray(a.value)) return a.value.length > 0;
                      if (typeof a.value === 'object' && a.value !== null) return !!a.value.id;
                      return a.value !== undefined && a.value !== '';
                    }).length} de {publication.snapshot?.blocks?.filter((b: any) => b.type !== 'heading_text').length}
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Anexos Carregados</span>
                    {answers.reduce((acc, current) => {
                      const block = publication.snapshot?.blocks?.find((b: any) => b.id === current.blockId);
                      if (block?.type === 'file_upload' && Array.isArray(current.value)) {
                        return acc + current.value.length;
                      }
                      return acc;
                    }, 0)} arquivo(s)
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Termos Aceitos</span>
                    {answers.filter(a => {
                      const block = publication.snapshot?.blocks?.find((b: any) => b.id === a.blockId);
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
                onClick={() => setStep(1)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-10 px-4 rounded-xl text-xs font-bold"
                disabled={submitting}
              >
                Voltar e revisar
              </Button>
              <Button
                type="button"
                onClick={handleSubmitResponse}
                className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-10 px-6 rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1.5 text-xs"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
                    <span>Confirmar validação</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          /* STEP 3: SUCCESS COMPROVANTE */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8 text-center"
          >
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
              <p className="text-xs text-slate-500 max-w-md pt-2 leading-relaxed">
                Esta validação foi devidamente arquivada na plataforma e encaminhada à empresa responsável. Guarde seu comprovante abaixo.
              </p>
            </div>

            {/* Receipt details */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-left max-w-md mx-auto space-y-3.5 text-xs font-semibold text-slate-700">
              <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-200/80 pb-2.5 mb-1">
                Resumo da Transação
              </h3>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Processo:</span>
                {publication.snapshot?.name}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Responsável:</span>
                {successData?.respondent_name}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Cargo ou Função:</span>
                {successData?.respondent_role}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Decisão Final:</span>
                <span className={`text-[10px] font-bold uppercase ${
                  successData?.primary_decision?.semanticType === 'positive' ? 'text-emerald-600' :
                  successData?.primary_decision?.semanticType === 'attention' ? 'text-amber-600' :
                  successData?.primary_decision?.semanticType === 'negative' ? 'text-red-600' :
                  'text-slate-500'
                }`}>
                  {successData?.primary_decision?.text || 'Finalizada'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Data e Hora:</span>
                {new Date(successData?.submitted_at).toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 max-w-md mx-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTXT}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-1"
              >
                <FileText className="w-3.5 h-3.5 text-slate-450" />
                <span>Baixar TXT</span>
              </Button>
              
              <Button
                type="button"
                onClick={handleDownloadPDF}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-1 shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5 text-[#0d857a]" />
                <span>Baixar PDF</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
