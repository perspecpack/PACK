import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Building2, 
  Folder, 
  Calendar, 
  User, 
  CheckCircle,
  FileCheck2,
  Clock,
  Download,
  AlertCircle,
  Loader2,
  Info,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';
import { migrateLegacyBlocks, Block, validateProcess } from '@/src/components/processos/BlockFactory';
import ApprovalDocumentRenderer from '@/src/components/processos/ApprovalDocumentRenderer';
import RegistrarValidacaoManualModal from '@/src/components/processos/RegistrarValidacaoManualModal';

import { calculateSHA256, buildApprovalReportData, generatePDFReportBlobAndHash } from '@/src/utils/exportUtils';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  revision?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string;
}

export default function SolicitacaoForm() {
  const { templateId, id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'draft' | 'ready' | 'published' | 'validated' | 'revoked'>('draft');

  // Manual Validation States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualModalSubmitting, setManualModalSubmitting] = useState(false);
  const [manualValidation, setManualValidation] = useState<any>(null);

  // Request Form Fields
  const [reqId, setReqId] = useState(() => id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())));
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [code, setCode] = useState('');
  const [revision, setRevision] = useState('');
  const [responsibleInternal, setResponsibleInternal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [notesForClient, setNotesForClient] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [respondentRole, setRespondentRole] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [answers, setAnswers] = useState<any[]>([]);
  const [processId, setProcessId] = useState('');

  // Blocks & Materials
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const isReadOnly = requestStatus === 'published' || requestStatus === 'validated' || requestStatus === 'revoked';

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStep, setPreviewStep] = useState<number>(1);

  const pendingFields = useMemo(() => {
    let missing: string[] = [];
    if (!title.trim()) {
      missing.push('Título da solicitação');
    }
    const reqInfoBlock = blocks.find(b => b.type === 'request_information');
    if (reqInfoBlock) {
      (reqInfoBlock.fields || []).filter(f => f.enabled && f.required).forEach(field => {
        if (field.key === 'title' && !title.trim()) missing.push(field.label);
        else if (field.key === 'client' && !client.trim()) missing.push(field.label);
        else if (field.key === 'project' && !project.trim()) missing.push(field.label);
        else if (field.key === 'code' && !code.trim()) missing.push(field.label);
        else if (field.key === 'revision' && !revision.trim()) missing.push(field.label);
        else if (field.key === 'responsible_internal' && !responsibleInternal.trim()) missing.push(field.label);
        else if (field.key === 'deadline' && !deadline.trim()) missing.push(field.label);
        else if (field.key === 'description' && !description.trim()) missing.push(field.label);
        else if (field.key === 'notes_for_client' && !notesForClient.trim()) missing.push(field.label);
      });
    } else {
      if (!client.trim()) missing.push('Cliente');
      if (!project.trim()) missing.push('Projeto');
    }

    for (const block of blocks) {
      if (block.type === 'request_information' || block.type === 'analysis_materials') continue;
      if (block.required && (block.filledBy === 'company' || block.filledBy === 'both')) {
        if (block.value === undefined || block.value === null || String(block.value).trim() === '') {
          missing.push(`Bloco obrigatório: "${block.title}"`);
        }
      }
    }

    const matBlock = blocks.find(b => b.type === 'analysis_materials');
    if (matBlock) {
      const minFiles = matBlock.minFiles ?? 0;
      if (materials.length < minFiles) {
        missing.push(`Mínimo de materiais (${minFiles} anexos necessários)`);
      }
    }

    return missing;
  }, [title, client, project, code, revision, responsibleInternal, deadline, description, notesForClient, blocks, materials]);

  const handleScrollToFirstError = () => {
    if (pendingFields.length > 0) {
      toast.error(`Campos pendentes obrigatórios: ${pendingFields.join(', ')}`);
    }

    const inputs = document.querySelectorAll('input, textarea');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i] as HTMLInputElement | HTMLTextAreaElement;
      if (input.required && !input.value.trim()) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
        break;
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (id) {
        // Editing existing request
        if (supabase) {
          const { data, error } = await supabase
            .from('process_requests')
            .select('*, processes(name), process_publications(id, status, publication_code, version, process_validation_responses(*))')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (data) {
            setProcessId(data.process_id);
            setTemplateName(data.processes?.name || 'Modelo não encontrado');
            setTitle(data.title);
            setClient(data.client || '');
            setProject(data.project || '');
            setCode(data.code || '');
            setRevision(data.revision || '');
            setResponsibleInternal(data.responsible_internal || '');
            setDeadline(data.deadline ? data.deadline.substring(0, 16) : '');
            setDescription(data.description || '');
            setNotesForClient(data.notes_for_client || '');
            setRequestStatus(data.status);
            
            const currentBlocks = migrateLegacyBlocks(data.blocks || []);
            setBlocks(currentBlocks);
            setMaterials(data.materials || []);

            // Extract the validated response if exists
            if (data.process_publications) {
              const publicationsList = Array.isArray(data.process_publications)
                ? data.process_publications
                : [data.process_publications];
              
              const activePub = publicationsList.find((p: any) => p.status === 'validated') || publicationsList[0];
              
              if (activePub) {
                const responsesList = Array.isArray(activePub.process_validation_responses)
                  ? activePub.process_validation_responses
                  : [activePub.process_validation_responses];
                
                const response = responsesList.find((r: any) => r !== null && r !== undefined);
                  
                if (response) {
                  setRespondentName(response.respondent_name || '');
                  setRespondentRole(response.respondent_role || '');
                  setRespondentEmail(response.respondent_email || '');
                  
                  const reportData = buildApprovalReportData(activePub, response);
                  const respAnswers = reportData.rendererAnswers;
                  setAnswers(respAnswers);
                  setManualValidation(null);
                } else {
                  // Try to fetch manual validation
                  const { data: manData, error: manError } = await supabase
                    .from('process_manual_validations')
                    .select('*, user_profiles(full_name)')
                    .eq('publication_id', activePub.id)
                    .maybeSingle();
                    
                  if (!manError && manData) {
                    const mappedManual = {
                      isManual: true,
                      result: manData.result,
                      respondentName: manData.respondent_name,
                      respondentRole: manData.respondent_role,
                      responseDate: manData.response_date,
                      validationMethod: manData.validation_method,
                      emailSubject: manData.email_subject || '',
                      notes: manData.notes || '',
                      registeredByName: manData.user_profiles?.full_name || 'Usuário do sistema',
                      protocol: manData.protocol
                    };
                    setRespondentName(manData.respondent_name || '');
                    setRespondentRole(manData.respondent_role || '');
                    setRespondentEmail('Não informado');
                    setManualValidation(mappedManual);
                    
                    const mockResp = {
                      is_manual: true,
                      protocol: manData.protocol,
                      respondent_name: manData.respondent_name,
                      respondent_role: manData.respondent_role,
                      response_date: manData.response_date,
                      validation_method: manData.validation_method,
                      email_subject: manData.email_subject,
                      notes: manData.notes,
                      registered_by_name: manData.user_profiles?.full_name || 'Usuário do sistema',
                      primary_decision: {
                        text: manData.result,
                        semanticType: manData.result === 'Aprovado' ? 'positive' : (manData.result === 'Aprovado com Ressalvas' ? 'attention' : 'negative')
                      }
                    };
                    const reportData = buildApprovalReportData(activePub, mockResp);
                    setAnswers(reportData.rendererAnswers);
                  }
                }
              }
            }
          }
        }
      } else if (templateId) {
        // Creating request from template
        if (supabase) {
          const { data, error } = await supabase
            .from('processes')
            .select('*')
            .eq('id', templateId)
            .single();

          if (error) throw error;
          if (data) {
            setProcessId(data.id);
            setTemplateName(data.name);
            setTitle(`Solicitação: ${data.name}`);
            setBlocks(migrateLegacyBlocks(data.blocks || []));
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados.');
      navigate('/app/aprovacoes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, templateId]);

  const handleSaveManualValidation = async (fields: any) => {
    if (!id || !supabase) return;
    setManualModalSubmitting(true);
    try {
      // 1. Double check database conflicts first (requirement 7)
      const { data: currentReq, error: fetchErr } = await supabase
        .from('process_requests')
        .select('status, process_publications(id, status, publication_code, version)')
        .eq('id', id)
        .single();
        
      if (fetchErr || !currentReq) {
        throw new Error('Falha ao verificar situação atual da solicitação.');
      }
      
      if (currentReq.status === 'validated') {
        throw new Error('Esta solicitação já foi concluída automaticamente pelo portal.');
      }
      
      const publications = currentReq.process_publications || [];
      const activePub = Array.isArray(publications)
        ? publications.find((p: any) => p.status === 'awaiting_validation')
        : (publications as any)?.status === 'awaiting_validation' ? publications : null;
        
      if (!activePub) {
        throw new Error('Não há nenhuma publicação ativa aguardando validação para esta solicitação.');
      }

      // Check manual table just in case
      const { data: existManual, error: manErr } = await supabase
        .from('process_manual_validations')
        .select('id')
        .eq('publication_id', activePub.id)
        .maybeSingle();

      if (existManual) {
        throw new Error('Esta solicitação já possui um registro de validação manual.');
      }
      
      // 2. Call register_manual_validation RPC
      const { data: submitData, error: submitError } = await supabase.rpc('register_manual_validation', {
        p_publication_id: activePub.id,
        p_result: fields.result,
        p_respondent_name: fields.respondentName,
        p_respondent_role: fields.respondentRole,
        p_response_date: fields.responseDate,
        p_validation_method: fields.validationMethod,
        p_email_subject: fields.emailSubject || null,
        p_notes: fields.notes || null,
        p_declared: fields.declared
      });
      
      if (submitError) throw new Error(submitError.message);
      
      // 3. Generate PDF Report Blob and Hash (Requirement 11)
      const mockPub = {
        id: activePub.id,
        publication_code: activePub.publication_code || '',
        version: activePub.version || 1,
        organization: client,
        snapshot: {
          name: title,
          project: project,
          client: client,
          revision: revision,
          description: description,
          responsible_internal: responsibleInternal,
          materials: materials,
          blocks: blocks,
          company_name: companyBranding.companyName,
          trade_name: companyBranding.tradeName || companyBranding.companyName,
          company_logo_url: companyBranding.companyLogoUrl || ''
        }
      };
      
      const tempResp = {
        is_manual: true,
        protocol: submitData.protocol,
        respondent_name: fields.respondentName,
        respondent_role: fields.respondentRole,
        response_date: fields.responseDate,
        validation_method: fields.validationMethod,
        email_subject: fields.emailSubject,
        notes: fields.notes,
        registered_by_name: profile?.fullName || 'Usuário do sistema',
        created_at: submitData.created_at,
        primary_decision: {
          text: fields.result,
          semanticType: fields.result === 'Aprovado' ? 'positive' : (fields.result === 'Aprovado com Ressalvas' ? 'attention' : 'negative')
        }
      };
      
      const { blob: pdfBlob, hash: pdfHash } = await generatePDFReportBlobAndHash(mockPub, tempResp);
      
      // 4. Upload PDF to validation-attachments storage bucket under `${token}/report.pdf`
      const pdfStoragePath = `${submitData.public_token}/report.pdf`;
      const { error: pdfUploadError } = await supabase.storage
        .from('validation-attachments')
        .upload(pdfStoragePath, pdfBlob, {
          cacheControl: '3600',
          contentType: 'application/pdf',
          upsert: true
        });
        
      if (pdfUploadError) throw pdfUploadError;
      
      // 5. Update pdf_hash in process_manual_validations
      const { error: hashUpdateError } = await supabase.rpc('update_manual_pdf_hash', {
        p_publication_id: activePub.id,
        p_pdf_hash: pdfHash
      });
      
      if (hashUpdateError) throw hashUpdateError;
      
      // 6. Perform cleanup of temporary files (Requirement 10)
      const materialsPaths = (materials || []).map((m: any) => m.filePath).filter(Boolean);
      if (materialsPaths.length > 0) {
        try {
          await supabase.storage.from('request-materials').remove(materialsPaths);
        } catch (e) {
          console.error('Erro na limpeza de request-materials:', e);
        }
      }
      
      // 7. Success notifications and state updates
      toast.success('Validação manual registrada com sucesso!');
      setIsManualModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao registrar validação manual.');
    } finally {
      setManualModalSubmitting(false);
    }
  };

  // Handle prefilled value updates from company
  const handleBlockValueChange = (blockId: string, value: any) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, value } : b));
  };

  // Upload a material file
  const uploadMaterial = async (file: File, name: string, category: string, revision?: string) => {
    setUploadingMaterial(true);
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
      const storagePath = `materials/${reqId}/${uniqueId}-${cleanFileName}`;

      const fileHash = await calculateSHA256(file);

      const { error } = await supabase.storage
        .from('request-materials')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const newMaterial: Material = {
        id: uniqueId,
        name,
        description: '',
        category,
        revision: revision || undefined,
        fileName: file.name,
        filePath: storagePath,
        fileSize: file.size,
        mimeType: file.type,
        fileHash
      };

      setMaterials(prev => [...prev, newMaterial]);
      toast.success('Material adicionado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar material.');
      throw err;
    } finally {
      setUploadingMaterial(false);
    }
  };

  // Remove a material
  const handleRemoveMaterial = async (materialId: string, path: string) => {
    const confirmRemove = window.confirm('Deseja remover este material?');
    if (!confirmRemove) return;

    try {
      // Remove from storage
      await supabase.storage.from('request-materials').remove([path]);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Material removido');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover material.');
    }
  };

  // Trigger material download
  const handleDownloadMaterial = async (material: Material) => {
    try {
      const { data, error } = await supabase.storage
        .from('request-materials')
        .download(material.filePath);
      
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao baixar material.');
    }
  };

  // Save/Submit Solicitation
  const handleSave = async (targetStatus: 'draft' | 'ready') => {
    if (!title.trim()) {
      toast.error('O título da solicitação é obrigatório.');
      return;
    }

    if (targetStatus === 'ready') {
      let missingFields = [];
      
      const hasReqInfoBlock = blocks.some(b => b.type === 'request_information');
      if (hasReqInfoBlock) {
        const reqInfoBlock = blocks.find(b => b.type === 'request_information')!;
        (reqInfoBlock.fields || []).filter(f => f.enabled && f.required).forEach(field => {
          if (field.key === 'title' && !title.trim()) missingFields.push(field.label);
          else if (field.key === 'client' && !client.trim()) missingFields.push(field.label);
          else if (field.key === 'project' && !project.trim()) missingFields.push(field.label);
          else if (field.key === 'code' && !code.trim()) missingFields.push(field.label);
          else if (field.key === 'revision' && !revision.trim()) missingFields.push(field.label);
          else if (field.key === 'responsible_internal' && !responsibleInternal.trim()) missingFields.push(field.label);
          else if (field.key === 'deadline' && !deadline.trim()) missingFields.push(field.label);
          else if (field.key === 'description' && !description.trim()) missingFields.push(field.label);
          else if (field.key === 'notes_for_client' && !notesForClient.trim()) missingFields.push(field.label);
        });
      } else {
        if (!client.trim()) missingFields.push('Cliente');
        if (!project.trim()) missingFields.push('Projeto');
      }

      for (const block of blocks) {
        if (block.type === 'request_information' || block.type === 'analysis_materials') continue;
        if (block.required && (block.filledBy === 'company' || block.filledBy === 'both')) {
          if (block.value === undefined || block.value === null || String(block.value).trim() === '') {
            missingFields.push(`Bloco obrigatório: "${block.title}"`);
          }
        }
      }

      const hasAnalysisMaterialsBlock = blocks.some(b => b.type === 'analysis_materials');
      if (hasAnalysisMaterialsBlock) {
        const matBlock = blocks.find(b => b.type === 'analysis_materials')!;
        const minFiles = matBlock.minFiles ?? 0;
        if (materials.length < minFiles) {
          missingFields.push(`Quantidade mínima de materiais (${minFiles} anexos necessários)`);
        }
      }

      if (missingFields.length > 0) {
        toast.error(`Para marcar como pronto para publicar, preencha: ${missingFields.join(', ')}`);
        return;
      }
    }

    setSaving(true);
    try {
      if (supabase && user) {
        const payload = {
          id: reqId,
          process_id: processId,
          user_id: user.id,
          title,
          client,
          project,
          code,
          revision,
          responsible_internal: responsibleInternal,
          deadline: deadline || null,
          description,
          notes_for_client: notesForClient,
          status: targetStatus,
          blocks,
          materials
        };

        const { error } = await supabase
          .from('process_requests')
          .upsert(payload);

        if (error) throw error;
        
        toast.success(
          targetStatus === 'ready' 
            ? 'Solicitação salva e pronta para publicação!' 
            : 'Solicitação salva como rascunho!'
        );
        navigate('/app/aprovacoes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar solicitação.');
    } finally {
      setSaving(false);
    }
  };

  // Publish flow inside form
  const handlePublish = async () => {
    // 1. Validate blocks before publication
    const validation = validateProcess(blocks);
    const hasMissingTitle = validation.errors.some(e => e.field === 'title');
    if (hasMissingTitle) {
      toast.error('Não é possível publicar: todos os blocos de resposta devem conter um título.');
      return;
    }

    if (validation.warnings.length > 0) {
      const confirmWarning = window.confirm(
        `Aviso: Existem blocos de resposta sem descrição ou instrução:\n\n${validation.warnings.join('\n')}\n\nDeseja publicar mesmo assim?`
      );
      if (!confirmWarning) return;
    }

    const confirmPublish = window.confirm('Deseja publicar esta solicitação agora?');
    if (!confirmPublish) return;

    setSaving(true);
    try {
      if (supabase) {
        // Save first as ready
        const payload = {
          id: reqId,
          process_id: processId,
          user_id: user!.id,
          title,
          client,
          project,
          code,
          revision,
          responsible_internal: responsibleInternal,
          deadline: deadline || null,
          description,
          notes_for_client: notesForClient,
          status: 'ready' as const,
          blocks,
          materials
        };
        const { error: saveError } = await supabase.from('process_requests').upsert(payload);
        if (saveError) throw saveError;

        // Call RPC
        const { data, error } = await supabase.rpc('publish_request', {
          p_request_id: reqId,
          p_revoke_previous: true
        });
        if (error) throw error;

        toast.success('Solicitação publicada com sucesso!');
        
        const link = `${window.location.origin}/validar/${data.public_token}`;
        navigator.clipboard.writeText(link).then(() => {
          toast.success('Link de validação copiado!');
        });

        navigate('/app/aprovacoes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar solicitação');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-550">Carregando solicitação...</span>
      </div>
    );
  }

  const companyBranding = {
    companyName: profile?.companyName || 'Minha Empresa',
    tradeName: profile?.tradeName || profile?.companyName || 'Minha Empresa',
    companyLogoUrl: profile?.companyLogoUrl || '',
    companyWebsite: profile?.companyWebsite || '',
    corporateEmail: profile?.corporateEmail || '',
    phone: profile?.phone || '',
    shortDescription: profile?.shortDescription || '',
    footerText: profile?.footerText || ''
  };

  const documentData = {
    title,
    client,
    project,
    code,
    revision,
    responsible_internal: responsibleInternal,
    deadline: deadline || null,
    description,
    notes_for_client: notesForClient,
    status: requestStatus,
    revision_code: '01',
    publication_code: 'MODELO',
    version: 1
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Preview Mode Banner */}
      {isPreviewMode ? (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-teal-800 text-xs">
            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Modo de Pré-visualização</p>
              <p className="text-slate-500">Esta é a visualização exata do formulário que o cliente receberá para validação.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setIsPreviewMode(false);
              setPreviewStep(1);
            }}
            className="bg-teal-650 hover:bg-teal-750 text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer"
          >
            Voltar para Preparação
          </Button>
        </div>
      ) : (
        /* Normal Header */
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/aprovacoes')}
              className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {id ? 'Preparar Aprovação' : 'Nova Aprovação'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Baseada no modelo: <strong className="text-slate-700">{templateName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Badge */}
            {id && (
              <div className="mr-2">
                {requestStatus === 'draft' && <Badge className="bg-slate-100 text-slate-700">Rascunho</Badge>}
                {requestStatus === 'ready' && <Badge className="bg-teal-50 text-teal-700 border-teal-200">Pronta para publicar</Badge>}
                {requestStatus === 'published' && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Publicada</Badge>}
                {requestStatus === 'validated' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Validada</Badge>}
                {requestStatus === 'revoked' && <Badge className="bg-red-50 text-red-700 border-red-200">Revogada</Badge>}
              </div>
            )}

            {requestStatus === 'published' && (
              <Button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white h-9 px-4 text-xs font-bold rounded-xl cursor-pointer border-0 flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                Registrar Validação Manual
              </Button>
            )}

            {!isReadOnly && (
              <>
                <Button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={saving}
                  className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 h-9 px-5 text-xs font-bold rounded-xl border-0 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[#00F59B]/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publicar Agora
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Integrated Unified Document Renderer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <ApprovalDocumentRenderer
          mode={isPreviewMode ? 'public-validation' : (isReadOnly ? 'read-only-result' : 'approval-preparation')}
          step={isPreviewMode ? previewStep : 1}
          companyBranding={companyBranding}
          documentData={documentData}
          blocks={blocks}
          materials={materials}
          answers={answers}
          respondentName={respondentName}
          respondentRole={respondentRole}
          respondentEmail={respondentEmail}
          onDocumentDataChange={(data: any) => {
            if (data.title !== undefined) setTitle(data.title);
            if (data.client !== undefined) setClient(data.client);
            if (data.project !== undefined) setProject(data.project);
            if (data.code !== undefined) setCode(data.code);
            if (data.revision !== undefined) setRevision(data.revision);
            if (data.responsible_internal !== undefined) setResponsibleInternal(data.responsible_internal);
            if (data.deadline !== undefined) setDeadline(data.deadline);
            if (data.description !== undefined) setDescription(data.description);
            if (data.notes_for_client !== undefined) setNotesForClient(data.notes_for_client);
          }}
          onAnswerChange={handleBlockValueChange}
          onAddMaterial={uploadMaterial}
          onRemoveMaterial={handleRemoveMaterial}
          
          // Conclusion parameters for preparation mode
          onSaveDraft={() => handleSave('draft')}
          onPublish={handlePublish}
          pendingFields={pendingFields}
          submitting={saving}
          
          // Navigation controls inside preview mode
          onGoToReview={() => {
            if (isPreviewMode) {
              setPreviewStep(2);
            } else {
              setIsPreviewMode(true);
              setPreviewStep(1);
            }
          }}
          onGoBack={() => {
            if (isPreviewMode) {
              if (previewStep === 2) setPreviewStep(1);
            } else {
              handleScrollToFirstError();
            }
          }}
          onSubmitResponse={() => {
            if (isPreviewMode) {
              toast.info('Esta é uma pré-visualização offline. Os dados não serão enviados ao servidor.');
            }
          }}
          manualValidation={manualValidation}
        />
      </div>

      {/* REGISTRAR VALIDAÇÃO MANUAL MODAL */}
      <RegistrarValidacaoManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveManualValidation}
        submitting={manualModalSubmitting}
        publicationTitle={title}
        publicationCode={code}
      />
    </div>
  );
}
