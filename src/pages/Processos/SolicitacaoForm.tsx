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
  const { user } = useApp();
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

  // Material upload sub-form state
  const [matName, setMatName] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matCat, setMatCat] = useState('Desenho Técnico');
  const [matRev, setMatRev] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
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
        navigate('/app/processos');
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
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matFile) {
      toast.error('Por favor, selecione um arquivo.');
      return;
    }
    if (!matName.trim()) {
      toast.error('Informe o nome do material.');
      return;
    }

    setUploadingMaterial(true);
    try {
      const cleanFileName = matFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
      const storagePath = `materials/${reqId}/${uniqueId}-${cleanFileName}`;

      const { error } = await supabase.storage
        .from('request-materials')
        .upload(storagePath, matFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const newMaterial: Material = {
        id: uniqueId,
        name: matName,
        description: matDesc,
        category: matCat,
        revision: matRev || undefined,
        fileName: matFile.name,
        filePath: storagePath,
        fileSize: matFile.size,
        mimeType: matFile.type
      };

      setMaterials(prev => [...prev, newMaterial]);
      setMatName('');
      setMatDesc('');
      setMatRev('');
      setMatFile(null);
      // Reset input element
      const fileInput = document.getElementById('material-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success('Material adicionado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar material.');
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

    // If marking as ready, validate that all required company fields and blocks are filled
    if (targetStatus === 'ready') {
      let missingFields = [];
      if (!client.trim()) missingFields.push('Cliente');
      if (!project.trim()) missingFields.push('Projeto');

      // Check required company blocks
      for (const block of blocks) {
        if (block.required && (block.filledBy === 'company' || block.filledBy === 'both')) {
          if (block.value === undefined || block.value === null || String(block.value).trim() === '') {
            missingFields.push(`Bloco obrigatório: "${block.title}"`);
          }
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
        navigate('/app/processos');
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

        navigate('/app/processos');
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/processos')}
            className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {id ? 'Editar Solicitação' : 'Nova Solicitação'}
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
                disabled={saving}
                onClick={() => handleSave('draft')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Salvar Rascunho
              </Button>
              <Button
                disabled={saving}
                onClick={() => handleSave('ready')}
                className="bg-teal-50 hover:bg-[#0d857a]/10 text-[#0d857a] border border-[#0d857a]/30 text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Pronto para Publicar
              </Button>
              <Button
                disabled={saving}
                onClick={handlePublish}
                className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl border-0 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Publicar Agora
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
          Informações Gerais da Solicitação
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="req-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Título da Solicitação *
            </Label>
            <Input
              id="req-title"
              disabled={isReadOnly}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aprovação Rack Hyundai BC4B"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-client" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cliente *
            </Label>
            <Input
              id="req-client"
              disabled={isReadOnly}
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ex: Volkswagen do Brasil"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-project" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Projeto *
            </Label>
            <Input
              id="req-project"
              disabled={isReadOnly}
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Ex: Rack Hyundai BC4B"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-code" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Código do Projeto
            </Label>
            <Input
              id="req-code"
              disabled={isReadOnly}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: 407-034368-26"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-rev" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Revisão
            </Label>
            <Input
              id="req-rev"
              disabled={isReadOnly}
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="Ex: 03"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-resp" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Responsável Interno
            </Label>
            <Input
              id="req-resp"
              disabled={isReadOnly}
              value={responsibleInternal}
              onChange={(e) => setResponsibleInternal(e.target.value)}
              placeholder="Ex: Airon Denis Otaviano"
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-deadline" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Prazo Limite para Resposta
            </Label>
            <Input
              id="req-deadline"
              type="datetime-local"
              disabled={isReadOnly}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="req-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Descrição do Processo
            </Label>
            <Textarea
              id="req-desc"
              disabled={isReadOnly}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição geral sobre o que deve ser validado neste fluxo..."
              className="min-h-[80px] text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="req-notes" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Observações / Instruções para o Cliente
            </Label>
            <Textarea
              id="req-notes"
              disabled={isReadOnly}
              value={notesForClient}
              onChange={(e) => setNotesForClient(e.target.value)}
              placeholder="Ex: Por favor, analise o desenho técnico e registre o checklist abaixo."
              className="min-h-[80px] text-xs"
            />
          </div>
        </div>
      </div>

      {/* Materials for Analysis (Anexos da Empresa) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800">
            Materiais para Análise (Anexos da Empresa)
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Arquivos disponibilizados pela empresa (desenhos técnicos, modelos 3D CAD, etc) para a tomada de decisão do cliente.
          </p>
        </div>

        {/* Upload Form */}
        {!isReadOnly && (
          <form onSubmit={handleAddMaterial} className="bg-slate-50/55 border border-slate-200 rounded-xl p-4.5 space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Adicionar Material de Análise</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400">Nome do Material *</Label>
                <Input
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="Ex: Desenho Técnico Geral"
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400">Categoria</Label>
                <select
                  value={matCat}
                  onChange={(e) => setMatCat(e.target.value)}
                  className="w-full h-8.5 border border-slate-200 bg-white rounded-lg text-xs px-2.5"
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
                <Label className="text-[10px] font-bold text-slate-400">Revisão (opcional)</Label>
                <Input
                  value={matRev}
                  onChange={(e) => setMatRev(e.target.value)}
                  placeholder="Ex: Rev A"
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[10px] font-bold text-slate-400">Arquivo * (PDF, STEP, DWG, ZIP, Imagens, etc)</Label>
                <Input
                  id="material-file-input"
                  type="file"
                  onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                  className="h-8.5 text-xs bg-white py-1"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={uploadingMaterial}
                  className="w-full h-8.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer border-0 flex items-center justify-center gap-1"
                >
                  {uploadingMaterial ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Adicionar Anexo
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Materials List */}
        {materials.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum material de análise adicionado ainda.</p>
        ) : (
          <div className="border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {materials.map(mat => (
              <div key={mat.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{mat.name}</span>
                      <Badge className="bg-slate-100 text-slate-655 text-[9px] px-1.5 py-0 border-0">
                        {mat.category}
                      </Badge>
                      {mat.revision && (
                        <span className="text-[10px] text-slate-400 font-mono">({mat.revision})</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{mat.fileName} • {(mat.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadMaterial(mat)}
                    className="p-1.5 text-slate-450 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    title="Baixar arquivo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(mat.id, mat.filePath)}
                      className="p-1.5 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title="Excluir arquivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocks Configuration & Prefill */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-800">
          Formulário e Respostas
        </h3>
        
        {blocks.filter(b => b.type !== 'heading_text').length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-450 text-xs italic">
            Este modelo não possui blocos interativos.
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map(block => {
              if (block.type === 'heading_text') return null;

              const isCompanyField = block.filledBy === 'company' || block.filledBy === 'both';
              
              return (
                <div 
                  key={block.id} 
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isCompanyField 
                      ? 'border-[#0d857a]/20 shadow-teal-50/5 bg-[#0d857a]/[0.01]' 
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100/60 pb-2">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                        {block.title}
                        {block.required && <span className="text-red-500 font-bold">*</span>}
                      </h4>
                      {block.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{block.description}</p>
                      )}
                    </div>

                    <Badge className={`text-[9px] border-0 px-2 py-0.5 font-bold uppercase ${
                      block.filledBy === 'company' 
                        ? 'bg-teal-50 text-teal-700'
                        : block.filledBy === 'both'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-655'
                    }`}>
                      Preenchimento: {block.filledBy === 'company' ? 'Empresa' : block.filledBy === 'both' ? 'Ambos' : 'Cliente'}
                    </Badge>
                  </div>

                  {/* Render Prefill Field for Company */}
                  {isCompanyField ? (
                    <div className="space-y-2 max-w-md">
                      {block.type === 'short_answer' && (
                        <Input
                          disabled={isReadOnly}
                          value={block.value || ''}
                          onChange={(e) => handleBlockValueChange(block.id, e.target.value)}
                          placeholder={block.placeholder || 'Preencha o valor inicial...'}
                          className="h-9 text-xs"
                        />
                      )}
                      
                      {block.type === 'long_answer' && (
                        <Textarea
                          disabled={isReadOnly}
                          value={block.value || ''}
                          onChange={(e) => handleBlockValueChange(block.id, e.target.value)}
                          placeholder={block.placeholder || 'Preencha o comentário ou texto longo...'}
                          className="min-h-[70px] text-xs"
                        />
                      )}

                      {block.type === 'date' && (
                        <Input
                          type="date"
                          disabled={isReadOnly}
                          value={block.value || ''}
                          onChange={(e) => handleBlockValueChange(block.id, e.target.value)}
                          className="h-9 text-xs"
                        />
                      )}

                      {(block.type === 'multiple_choice' || block.type === 'dropdown') && (
                        <select
                          disabled={isReadOnly}
                          value={block.value || ''}
                          onChange={(e) => handleBlockValueChange(block.id, e.target.value)}
                          className="h-9 border border-slate-200 rounded-lg text-xs px-2.5 w-full bg-white"
                        >
                          <option value="">Selecione uma opção padrão...</option>
                          {block.options?.map(opt => (
                            <option key={opt.id} value={opt.text}>{opt.text}</option>
                          ))}
                        </select>
                      )}

                      {block.type === 'checkbox' && (
                        <div className="space-y-1.5">
                          {block.options?.map(opt => {
                            const currentList = Array.isArray(block.value) ? block.value : [];
                            const isChecked = currentList.includes(opt.text);
                            
                            return (
                              <label key={opt.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  disabled={isReadOnly}
                                  checked={isChecked}
                                  onChange={() => {
                                    const nextList = isChecked
                                      ? currentList.filter(t => t !== opt.text)
                                      : [...currentList, opt.text];
                                    handleBlockValueChange(block.id, nextList);
                                  }}
                                  className="rounded border-slate-300 text-[#0d857a] w-4 h-4 cursor-pointer"
                                />
                                {opt.text}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {block.type === 'acknowledgement' && (
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={block.value === true}
                            onChange={(e) => handleBlockValueChange(block.id, e.target.checked)}
                            className="rounded border-slate-300 text-[#0d857a] w-4 h-4 cursor-pointer"
                          />
                          Confirmar termo padrão
                        </label>
                      )}

                      {block.type === 'approval_decision' && (
                        <select
                          disabled={isReadOnly}
                          value={block.value || ''}
                          onChange={(e) => handleBlockValueChange(block.id, e.target.value)}
                          className="h-9 border border-slate-200 rounded-lg text-xs px-2.5 w-full bg-white"
                        >
                          <option value="">Selecione a decisão padrão...</option>
                          {block.decisions?.map(dec => (
                            <option key={dec.id} value={dec.text}>{dec.text}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1.5 select-none">
                      <Info className="w-3.5 h-3.5 text-slate-350" />
                      <span>Este campo é reservado para preenchimento direto do cliente no link de validação.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
