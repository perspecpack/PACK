import React, { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';
import { migrateLegacyBlocks, Block } from '@/src/components/processos/BlockFactory';
import ApprovalDocumentRenderer from '@/src/components/processos/ApprovalDocumentRenderer';

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
}

export default function SolicitacaoForm() {
  const { templateId, id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'draft' | 'ready' | 'published' | 'validated' | 'revoked'>('draft');

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
  const [processId, setProcessId] = useState('');

  // Blocks & Materials
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const isReadOnly = requestStatus === 'published' || requestStatus === 'validated' || requestStatus === 'revoked';

  // Load template or request data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (id) {
          // Editing existing request
          if (supabase) {
            const { data, error } = await supabase
              .from('process_requests')
              .select('*, processes(name)')
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
              setBlocks(migrateLegacyBlocks(data.blocks || []));
              setMaterials(data.materials || []);
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

    loadData();
  }, [id, templateId]);

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
        mimeType: file.type
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
      {/* Header */}
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

      {/* Integrated Unified Document Renderer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <ApprovalDocumentRenderer
          mode={isReadOnly ? 'read-only-result' : 'approval-preparation'}
          companyBranding={companyBranding}
          documentData={documentData}
          blocks={blocks}
          materials={materials}
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
        />
      </div>
    </div>
  );
}
