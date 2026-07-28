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
import { generatePDFReport, exportTXTFile, generateTXTComprovante, calculateSHA256, generatePDFReportBlobAndHash } from '@/src/utils/exportUtils';
import JSZip from 'jszip';
import ApprovalDocumentRenderer from '@/src/components/processos/ApprovalDocumentRenderer';

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
  const [pdfReportBlob, setPdfReportBlob] = useState<Blob | null>(null);
  const [zipApprovalBlob, setZipApprovalBlob] = useState<Blob | null>(null);

  const hasRequestInfoBlock = (publication?.snapshot?.blocks || []).some((b: any) => b.type === 'request_information');
  const hasAnalysisMaterialsBlock = (publication?.snapshot?.blocks || []).some((b: any) => b.type === 'analysis_materials');

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
        if (block.value !== undefined && block.value !== null) {
          defaultValue = block.value;
        } else if (block.type === 'checkbox') {
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
        
        const fileHash = await calculateSHA256(file);

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
          mimeType: file.type,
          fileHash
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

      if (block.required && block.filledBy !== 'company') {
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
          const isSelected = Array.isArray(val)
            ? val.length > 0
            : (val && typeof val === 'object' ? (val.list?.length > 0 || !!val.otherSelected) : false);
          if (!isSelected) {
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
      if (block.type === 'checkbox') {
        const count = Array.isArray(val)
          ? val.length
          : (val && typeof val === 'object' ? (val.list?.length || 0) + (val.otherSelected ? 1 : 0) : 0);
        if (count > 0) {
          if (block.minSelections !== undefined && count < block.minSelections) {
            errors[block.id] = `Selecione no mínimo ${block.minSelections} opção(ões).`;
          }
          if (block.maxSelections !== undefined && count > block.maxSelections) {
            errors[block.id] = `Selecione no máximo ${block.maxSelections} opção(ões).`;
          }
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

      // Rich formatted answers for block tracing and traceability
      const formattedAnswers = blocks.map((block: Block) => {
        const ans = answers.find(a => a.blockId === block.id);
        const value = ans?.value;
        
        let answer = '';
        let selected_option_ids: string[] = [];
        let selected_option_labels: string[] = [];
        let other_text = '';
        let comment = '';
        let confirmed = false;
        let attached_files: any[] = [];
        
        if (block.type === 'short_answer' || block.type === 'long_answer' || block.type === 'date' || block.type === 'dropdown') {
          answer = value !== undefined ? String(value) : '';
          if (block.type === 'dropdown' && value) {
            const opt = block.options?.find(o => o.text === value);
            if (opt) {
              selected_option_ids = [opt.id];
              selected_option_labels = [opt.text];
            }
          }
        } else if (block.type === 'multiple_choice') {
          if (typeof value === 'object' && value !== null) {
            if (value.otherSelected) {
              other_text = value.otherText || '';
              selected_option_labels = ['Outro'];
              answer = `Outro: ${other_text}`;
            }
          } else if (value) {
            answer = String(value);
            const opt = block.options?.find(o => o.text === value);
            if (opt) {
              selected_option_ids = [opt.id];
              selected_option_labels = [opt.text];
            }
          }
        } else if (block.type === 'checkbox') {
          if (Array.isArray(value)) {
            selected_option_labels = value;
            selected_option_ids = value.map(val => block.options?.find(o => o.text === val)?.id).filter(Boolean) as string[];
            answer = value.join(', ');
          } else if (typeof value === 'object' && value !== null) {
            selected_option_labels = value.list || [];
            selected_option_ids = (value.list || []).map((val: string) => block.options?.find(o => o.text === val)?.id).filter(Boolean) as string[];
            if (value.otherSelected) {
              other_text = value.otherText || '';
              selected_option_labels.push('Outro');
            }
            answer = selected_option_labels.join(', ');
          }
        } else if (block.type === 'acknowledgement') {
          confirmed = value === true;
          answer = confirmed ? 'Confirmado' : 'Não confirmado';
        } else if (block.type === 'file_upload') {
          attached_files = Array.isArray(value) ? value : [];
          answer = `${attached_files.length} arquivo(s) enviado(s)`;
        } else if (block.type === 'approval_decision') {
          if (value?.id) {
            selected_option_ids = [value.id];
            selected_option_labels = [value.text];
            comment = value.comment || '';
            answer = value.text;
          }
        }

        return {
          block_id: block.id,
          block_type: block.type,
          block_title: block.title,
          answer,
          selected_option_ids,
          selected_option_labels,
          other_text,
          comment,
          confirmed,
          attached_files,
          answered_at: new Date().toISOString()
        };
      });

      // Extract attachments to separate parameter
      const attachmentList: any[] = [];
      formattedAnswers.forEach(ans => {
        if (ans.block_type === 'file_upload' && Array.isArray(ans.attached_files)) {
          ans.attached_files.forEach((file: any) => {
            attachmentList.push({
              block_id: ans.block_id,
              storage_path: file.path,
              original_name: file.name,
              mime_type: file.mimeType,
              size_bytes: file.size,
              fileHash: file.fileHash
            });
          });
        }
      });

      // Fetch materials and calculate hashes list
      const materialsList = publication.snapshot?.materials || [];
      const materialsHashesMap: { [name: string]: string } = {};
      materialsList.forEach((m: any) => {
        materialsHashesMap[m.fileName || m.name] = m.fileHash || 'N/A';
      });

      // Call submit RPC first to generate protocol and metadata columns
      const { data: submitData, error: submitError } = await supabase.rpc('submit_validation_response', {
        p_token: token,
        p_respondent_name: respondentName.trim(),
        p_respondent_role: respondentRole.trim(),
        p_respondent_email: respondentEmail.trim() || null,
        p_answers: formattedAnswers,
        p_primary_decision: primaryDecisionObj,
        p_attachments: attachmentList,
        p_pdf_hash: null, // will be updated immediately below
        p_materials_hashes: materialsHashesMap,
        p_client_attachments_count: attachmentList.length,
        p_client_attachments_names: attachmentList.map(a => a.original_name),
        p_validation_source: 'web',
        p_metadata: {
          client_ip: 'anonymous',
          user_agent: navigator.userAgent
        }
      });

      if (submitError) throw submitError;

      // Now generate the PDF report locally using the official validation response metadata
      const tempResp = {
        protocol: submitData.protocol,
        respondent_name: respondentName.trim(),
        respondent_role: respondentRole.trim(),
        respondent_email: respondentEmail.trim() || 'Não informado',
        primary_decision: primaryDecisionObj,
        answers: formattedAnswers,
        submitted_at: submitData.submitted_at
      };

      const { blob: pdfBlob, hash: pdfHash } = await generatePDFReportBlobAndHash(publication, tempResp);

      // Save PDF report Blob to local state
      setPdfReportBlob(pdfBlob);

      // Upload the official PDF report to storage
      const pdfStoragePath = `${token}/report.pdf`;
      const { error: pdfUploadError } = await supabase.storage
        .from('validation-attachments')
        .upload(pdfStoragePath, pdfBlob, {
          cacheControl: '3600',
          contentType: 'application/pdf',
          upsert: true
        });

      if (pdfUploadError) throw pdfUploadError;

      // Update the pdf_hash in the database via update_pdf_hash RPC
      const { error: hashUpdateError } = await supabase.rpc('update_pdf_hash', {
        p_token: token,
        p_pdf_hash: pdfHash
      });

      if (hashUpdateError) throw hashUpdateError;

      // Create ZIP containing the PDF report, manifest and all analyzed files (materials and attachments)
      const zip = new JSZip();
      
      // Add PDF report
      zip.file(`Relatorio-Oficial-${publication.publication_code}.pdf`, pdfBlob);

      // Download and add company materials to ZIP
      for (const mat of materialsList) {
        try {
          const { data, error } = await supabase.storage
            .from('request-materials')
            .download(mat.filePath);
          if (!error && data) {
            zip.file(`Materiais_Analise/${mat.fileName || mat.name}`, data);
          }
        } catch (e) {
          console.error('Falha ao baixar material para incluir no ZIP:', mat, e);
        }
      }

      // Download and add client attachments to ZIP
      for (const att of attachmentList) {
        try {
          const { data, error } = await supabase.storage
            .from('validation-attachments')
            .download(att.storage_path);
          if (!error && data) {
            zip.file(`Anexos_Resposta/${att.original_name}`, data);
          }
        } catch (e) {
          console.error('Falha ao baixar anexo do cliente para incluir no ZIP:', att, e);
        }
      }

      // Add audit manifest json file
      const manifest = {
        protocol: submitData.protocol,
        date: submitData.submitted_at,
        process: {
          name: publication.snapshot?.name,
          code: publication.publication_code,
          version: publication.version,
          project: publication.snapshot?.project,
          client: publication.snapshot?.client,
          revision: publication.snapshot?.revision
        },
        respondent: {
          name: respondentName.trim(),
          role: respondentRole.trim(),
          email: respondentEmail.trim() || 'Não informado'
        },
        decision: primaryDecisionObj,
        pdf_report: {
          fileName: `Relatorio-Oficial-${publication.publication_code}.pdf`,
          sha256: pdfHash
        },
        analyzed_materials_hashes: materialsHashesMap,
        client_attachments_hashes: attachmentList.map(a => ({
          fileName: a.original_name,
          sha256: a.fileHash || 'N/A'
        }))
      };
      
      zip.file('manifesto_validacao.json', JSON.stringify(manifest, null, 2));

      // Generate ZIP blob and save to local state
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setZipApprovalBlob(zipBlob);

      // Perform cleanup: Delete all temporary files from the server Storage!
      // 1. Delete company materials from request-materials bucket
      const materialsPaths = materialsList.map((m: any) => m.filePath).filter(Boolean);
      if (materialsPaths.length > 0) {
        try {
          await supabase.storage.from('request-materials').remove(materialsPaths);
        } catch (e) {
          console.error('Error during cleanup of request-materials:', e);
        }
      }

      // 2. Delete client attachments from validation-attachments bucket (excluding report.pdf)
      const attachmentPaths = attachmentList.map((a: any) => a.storage_path).filter(Boolean);
      if (attachmentPaths.length > 0) {
        try {
          await supabase.storage.from('validation-attachments').remove(attachmentPaths);
        } catch (e) {
          console.error('Error during cleanup of validation-attachments:', e);
        }
      }

      setSuccessData(submitData);
      setStep(3);
      toast.success('Validação registrada com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      console.error(err);
      toast.error('Não foi possível registrar a validação. Verifique sua conexão e tente novamente.');
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

    const companyBranding = {
    companyName: publication?.snapshot?.company_name || publication?.organization || 'PERSPECPACK',
    tradeName: publication?.snapshot?.trade_name || publication?.snapshot?.company_name || publication?.organization || 'PERSPECPACK',
    companyLogoUrl: publication?.snapshot?.company_logo_url || '',
    companyWebsite: publication?.snapshot?.company_website || '',
    corporateEmail: publication?.snapshot?.corporate_email || '',
    phone: publication?.snapshot?.phone || '',
    shortDescription: publication?.snapshot?.short_description || '',
    footerText: publication?.snapshot?.footer_text || ''
  };

  const documentData = {
    title: publication?.snapshot?.title || publication?.snapshot?.name || '',
    client: publication?.snapshot?.client || '',
    project: publication?.snapshot?.project || '',
    code: publication?.snapshot?.code || '',
    revision: publication?.snapshot?.revision || '',
    responsible_internal: publication?.snapshot?.responsible_internal || '',
    deadline: publication?.snapshot?.deadline || null,
    description: publication?.snapshot?.description || '',
    notes_for_client: publication?.snapshot?.notes_for_client || '',
    status: publication?.status || '',
    publication_code: publication?.publication_code || '',
    version: publication?.version || 1
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER LOGO */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8 px-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#0d857a] rounded-lg flex items-center justify-center text-white">
              <Workflow className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-sm">PERSPECPACK</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-200/60 border border-slate-300/40 px-3 py-1 rounded-lg">
            ValidaÃ§Ã£o Digital
          </span>
        </div>

        <ApprovalDocumentRenderer
          mode="public-validation"
          companyBranding={companyBranding}
          documentData={documentData}
          blocks={publication?.snapshot?.blocks || []}
          materials={publication?.snapshot?.materials || []}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          validationErrors={formErrors}
          respondentName={respondentName}
          respondentRole={respondentRole}
          respondentEmail={respondentEmail}
          onRespondentNameChange={setRespondentName}
          onRespondentRoleChange={setRespondentRole}
          onRespondentEmailChange={setRespondentEmail}
          step={step}
          submitting={submitting}
          successData={successData}
          onSubmitResponse={handleSubmitResponse}
          onGoToReview={handleGoToReview}
          onGoBack={() => setStep(1)}
          handleDownloadPDF={handleDownloadPDF}
          pdfReportBlob={pdfReportBlob}
          zipApprovalBlob={zipApprovalBlob}
        />
      </div>
    </div>
  );
}