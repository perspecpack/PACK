import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Workflow, 
  ArrowLeft, 
  Loader2, 
  Save, 
  CloudCheck, 
  CloudLightning, 
  RefreshCw, 
  AlertTriangle,
  Eye,
  FileDown,
  Share2,
  CheckCircle2,
  X,
  Copy,
  Mail,
  FileText,
  Trash2,
  Building2,
  FolderOpen,
  Calendar,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import processes sub-components
import EditorLayout from '@/src/components/processos/EditorLayout';
import ProcessHeader from '@/src/components/processos/ProcessHeader';
import ProcessCanvas from '@/src/components/processos/ProcessCanvas';
import BlockSidebar from '@/src/components/processos/BlockSidebar';
import DeleteBlockDialog from '@/src/components/processos/DeleteBlockDialog';
import { Block, BlockFactory, migrateLegacyBlocks, BLOCK_METADATA, validateBlock } from '@/src/components/processos/BlockFactory';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';
import { generateEmailMessage, generatePDFForm, generatePDFReport, exportTXTFile, generateTXTComprovante } from '@/src/utils/exportUtils';

// dnd-kit vertical dragging imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Processo {
  id: string;
  name: string;
  description: string;
  category?: string;
  organization?: string;
  createdAt: string;
  blocks: Block[];
  status: string;
  user_id?: string;
}

type SaveStatusType = 'saved' | 'saving' | 'unsaved' | 'error';

interface ValidationErrorListItem {
  blockId?: string;
  blockName: string;
  position: number;
  message: string;
}

export default function EditorProcesso() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  // Deletion state
  const [blockToDeleteId, setBlockToDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<SaveStatusType>('saved');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Publications state
  const [hasPublications, setHasPublications] = useState(false);
  const [existingActivePub, setExistingActivePub] = useState<any>(null);

  // Validations & Tabs state
  const [activeTab, setActiveTab] = useState<'editor' | 'responses'>('editor');
  const [validationsList, setValidationsList] = useState<any[]>([]);
  const [selectedPub, setSelectedPub] = useState<any | null>(null);

  // Modals state
  const [isValidationErrorOpen, setIsValidationErrorOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorListItem[]>([]);
  
  const [isConfirmPublishOpen, setIsConfirmPublishOpen] = useState(false);
  const [isRevokeChoiceRequired, setIsRevokeChoiceRequired] = useState(false);
  const [revokePrevious, setRevokePrevious] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [isPublishSuccessOpen, setIsPublishSuccessOpen] = useState(false);
  const [publishedData, setPublishedData] = useState<any>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Configure sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load process & publications
  const loadProcessAndPubs = async () => {
    setLoading(true);
    try {
      if (supabase && user) {
        // Load process
        const { data, error } = await supabase
          .from('processes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        const migratedBlocks = migrateLegacyBlocks(Array.isArray(data.blocks) ? data.blocks : []);

        setProcesso({
          id: data.id,
          name: data.name,
          description: data.description || '',
          category: data.category || '',
          organization: data.organization || '',
          createdAt: data.created_at,
          blocks: migratedBlocks,
          status: data.status || 'draft',
          user_id: data.user_id
        });

        // Load publications status
        const { data: pubData, error: pubErr } = await supabase
          .from('process_publications')
          .select('*')
          .eq('process_id', id)
          .order('version', { ascending: false });
          
        if (!pubErr && pubData) {
          setHasPublications(pubData.length > 0);
          const active = pubData.find(p => p.status === 'awaiting_validation');
          setExistingActivePub(active || null);

          // Fetch responses for these publications
          const pubIds = pubData.map(p => p.id);
          if (pubIds.length > 0) {
            const { data: respData, error: respErr } = await supabase
              .from('process_validation_responses')
              .select('*')
              .in('publication_id', pubIds);
              
            if (!respErr && respData) {
              const mapped = pubData.map(pub => {
                const resp = respData.find(r => r.publication_id === pub.id);
                return {
                  ...pub,
                  response: resp || null
                };
              });
              setValidationsList(mapped);
            } else {
              setValidationsList(pubData.map(pub => ({ ...pub, response: null })));
            }
          } else {
            setValidationsList([]);
          }
        }
      } else {
        // LocalStorage fallback
        const stored = localStorage.getItem('perspecpack:processos');
        if (stored) {
          const list: Processo[] = JSON.parse(stored);
          const found = list.find(p => p.id === id);
          if (found) {
            const migratedBlocks = migrateLegacyBlocks(Array.isArray(found.blocks) ? found.blocks : []);
            setProcesso({
              ...found,
              blocks: migratedBlocks
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading process in editor', e);
      toast.error('Erro ao carregar o processo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcessAndPubs();
  }, [id, user]);

  // Unsaved changes beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = 'Você possui alterações não salvas neste processo. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveStatus]);

  // Save implementation
  const saveProcess = async (currentProcesso: Processo) => {
    setSaveStatus('saving');
    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('processes')
          .update({
            name: currentProcesso.name,
            description: currentProcesso.description || null,
            category: currentProcesso.category || null,
            organization: currentProcesso.organization || null,
            blocks: currentProcesso.blocks,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProcesso.id);

        if (error) throw error;
      }

      // LocalStorage update
      const stored = localStorage.getItem('perspecpack:processos');
      if (stored) {
        const list: Processo[] = JSON.parse(stored);
        const updatedList = list.map(p => p.id === currentProcesso.id ? {
          ...currentProcesso,
          blocksCount: currentProcesso.blocks.length
        } : p);
        localStorage.setItem('perspecpack:processos', JSON.stringify(updatedList));
      }

      setSaveStatus('saved');
    } catch (e) {
      console.error('Error saving process', e);
      setSaveStatus('error');
      toast.error('Erro ao salvar as alterações automaticamente.');
    }
  };

  // Trigger debounced autosave
  const triggerAutosave = (updatedProcess: Processo) => {
    setSaveStatus('unsaved');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveProcess(updatedProcess);
    }, 1000);
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (!processo) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    saveProcess(processo);
    toast.success('Alterações salvas com sucesso.');
  };

  // Add block handler
  const handleAddBlock = (type: any) => {
    if (!processo) return;
    
    const newBlock = BlockFactory.createBlock(type);
    const updatedBlocks = [...processo.blocks, newBlock];
    const updatedProcess = { ...processo, blocks: updatedBlocks };
    
    setProcesso(updatedProcess);
    setActiveBlockId(newBlock.id);
    setIsSidebarOpen(false);
    triggerAutosave(updatedProcess);

    toast.success(`Bloco de "${BLOCK_METADATA[newBlock.type].title}" adicionado`);

    setTimeout(() => {
      const el = document.getElementById(`block-card-${newBlock.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleDeleteBlockClick = (blockId: string) => {
    setBlockToDeleteId(blockId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!processo || !blockToDeleteId) return;

    const updatedBlocks = processo.blocks.filter(b => b.id !== blockToDeleteId);
    const updatedProcess = { ...processo, blocks: updatedBlocks };

    setProcesso(updatedProcess);
    if (activeBlockId === blockToDeleteId) {
      setActiveBlockId(null);
    }
    setBlockToDeleteId(null);
    triggerAutosave(updatedProcess);
    toast.success('Bloco excluído');
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!processo) return;

    const index = processo.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === processo.blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedBlocks = [...processo.blocks];
    
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[targetIndex];
    updatedBlocks[targetIndex] = temp;

    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    triggerAutosave(updatedProcess);
    
    setTimeout(() => {
      const el = document.getElementById(`block-card-${blockId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const handleDuplicateBlock = (blockId: string) => {
    if (!processo) return;

    const index = processo.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const original = processo.blocks[index];
    const duplicated: Block = {
      ...original,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      title: `${original.title} (Cópia)`
    };

    const updatedBlocks = [...processo.blocks];
    updatedBlocks.splice(index + 1, 0, duplicated);

    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    setActiveBlockId(duplicated.id);
    triggerAutosave(updatedProcess);

    toast.success('Bloco duplicado');

    setTimeout(() => {
      const el = document.getElementById(`block-card-${duplicated.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleUpdateBlock = (blockId: string, updatedBlock: Block) => {
    if (!processo) return;

    const updatedBlocks = processo.blocks.map(b => b.id === blockId ? updatedBlock : b);
    const updatedProcess = { ...processo, blocks: updatedBlocks };
    setProcesso(updatedProcess);
    triggerAutosave(updatedProcess);
  };

  const handleSelectBlock = (blockId: string) => {
    setActiveBlockId(blockId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      if (!processo) return;
      
      const oldIndex = metroIndex(active.id);
      const newIndex = metroIndex(over.id);
      
      const updatedBlocks = arrayMove(processo.blocks, oldIndex, newIndex);
      const updatedProcess = { ...processo, blocks: updatedBlocks };
      
      setProcesso(updatedProcess);
      triggerAutosave(updatedProcess);
      toast.success('Posição do bloco atualizada');
    }
  };

  const metroIndex = (blockId: any) => {
    return processo?.blocks.findIndex(b => b.id === blockId) ?? -1;
  };

  // Publish Logic validation
  const handlePublishClick = () => {
    if (!processo) return;

    const errorsList: ValidationErrorListItem[] = [];

    if (!processo.blocks || processo.blocks.length === 0) {
      errorsList.push({
        blockName: 'Estrutura do Processo',
        position: 0,
        message: 'O processo deve conter pelo menos um bloco para poder ser publicado.'
      });
    } else {
      processo.blocks.forEach((block, idx) => {
        const blockErrors = validateBlock(block);
        if (blockErrors.length > 0) {
          errorsList.push({
            blockId: block.id,
            blockName: block.title || BLOCK_METADATA[block.type].title,
            position: idx + 1,
            message: blockErrors[0].message
          });
        }
      });
    }

    if (errorsList.push.length > 1) { // errorsList has items
      setValidationErrors(errorsList);
      setIsValidationErrorOpen(true);
    } else {
      // Valid! Open confirm publish dialog
      setIsRevokeChoiceRequired(!!existingActivePub);
      setRevokePrevious(true);
      setIsConfirmPublishOpen(true);
    }
  };

  const handleGoToErrorBlock = (blockId?: string) => {
    setIsValidationErrorOpen(false);
    if (blockId) {
      setActiveBlockId(blockId);
      setTimeout(() => {
        const el = document.getElementById(`block-card-${blockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Publish finalization calling secure RPC
  const handleFinalizePublish = async () => {
    if (!processo || !supabase) return;
    setPublishing(true);
    try {
      const { data, error } = await supabase.rpc('publish_process', {
        p_process_id: processo.id,
        p_organization: processo.organization || '',
        p_snapshot: processo,
        p_revoke_previous: revokePrevious
      });

      if (error) throw error;

      setPublishedData(data);
      setIsConfirmPublishOpen(false);
      setIsPublishSuccessOpen(true);
      toast.success('Publicação concluída com sucesso!');
      
      // Refresh publications state
      loadProcessAndPubs();
      
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao publicar o processo.');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (!publishedData) return;
    const url = `${window.location.origin}/validar/${publishedData.public_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleCopyEmail = () => {
    if (!processo || !publishedData) return;
    const url = `${window.location.origin}/validar/${publishedData.public_token}`;
    const emailMsg = generateEmailMessage(
      processo.name,
      processo.organization || '',
      publishedData.publication_code,
      publishedData.version,
      url
    );
    navigator.clipboard.writeText(emailMsg);
    toast.success('Mensagem de e-mail copiada!');
  };

  const handleDownloadBlankPDF = () => {
    if (!processo) return;
    const pubMock = {
      publication_code: publishedData?.publication_code || 'PUB-MOCK',
      version: publishedData?.version || 1,
      organization: processo.organization,
      snapshot: processo
    };
    generatePDFForm(pubMock);
  };

  // Validation response helpers for "Respostas Recebidas" Tab
  const handleCopyValidationLink = (token: string) => {
    const url = `${window.location.origin}/validar/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleCopyValidationEmail = (pub: any) => {
    if (!processo) return;
    const url = `${window.location.origin}/validar/${pub.public_token}`;
    const emailMsg = generateEmailMessage(
      processo.name,
      processo.organization || '',
      pub.publication_code,
      pub.version,
      url
    );
    navigator.clipboard.writeText(emailMsg);
    toast.success('E-mail copiado!');
  };

  const handleRevokeValidationPub = async (pubId: string) => {
    const confirm = window.confirm('Deseja realmente revogar este link de validação? O cliente não poderá mais enviar respostas.');
    if (!confirm || !supabase) return;

    try {
      const { error } = await supabase
        .from('process_publications')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('id', pubId);

      if (error) throw error;
      
      toast.success('Link de validação revogado.');
      loadProcessAndPubs();
      if (selectedPub?.id === pubId) {
        setSelectedPub(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao revogar publicação.');
    }
  };

  const handleDownloadPubAttachment = async (path: string, originalName: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.storage
        .from('validation-attachments')
        .download(path);
      
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download concluído');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao baixar anexo.');
    }
  };

  const handleDownloadPubPDFReport = (pub: any) => {
    if (!pub.response) return;
    generatePDFReport(pub, pub.response);
  };

  const handleDownloadPubTXTReport = (pub: any) => {
    if (!pub.response) return;
    const txt = generateTXTComprovante(pub, pub.response);
    exportTXTFile(`Relatorio-${pub.response.protocol}.txt`, txt);
  };

  // Render Save Status Label
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
            <CloudCheck className="w-3.5 h-3.5" />
            <span>Salvo</span>
          </span>
        );
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Salvando...</span>
          </span>
        );
      case 'unsaved':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Alterações não salvas</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Erro ao salvar</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md mx-auto space-y-6 shadow-xs">
        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <Workflow className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">Modelo não encontrado</h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            O modelo de aprovação que você tentou acessar não existe ou foi excluído.
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/modelos')}
          className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer border-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Voltar para Biblioteca de Modelos
        </Button>
      </div>
    );
  }

  const handleBackNavigation = () => {
    if (saveStatus === 'unsaved') {
      const confirmLeave = window.confirm('Você possui alterações não salvas neste modelo. Deseja realmente sair?');
      if (!confirmLeave) return;
    }
    navigate('/app/modelos');
  };

  return (
    <div className="w-full">
      {/* Editor Status Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 bg-transparent -mt-2 mb-2 max-w-6xl mx-auto px-1 gap-3">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-slate-450 hover:text-[#0d857a] text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Biblioteca de Modelos
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {renderSaveStatus()}
          
          <Button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0d857a] border border-slate-200 h-8.5 px-3 text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </Button>

          <Button
            onClick={() => setIsPreviewOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-8.5 px-3 text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-450" />
            Visualizar
          </Button>

          <Button
            onClick={handleDownloadBlankPDF}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-8.5 px-3 text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-450" />
            Exportar PDF
          </Button>

          <Button
            onClick={handlePublishClick}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-8.5 px-4 text-[11px] rounded-xl cursor-pointer border-0 shadow-sm flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-900 stroke-[2.5px]" />
            {hasPublications ? 'Publicar nova versão' : 'Publicar para validação'}
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-5 max-w-6xl mx-auto px-1">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'editor' 
              ? 'border-[#0d857a] text-[#0d857a]' 
              : 'border-transparent text-slate-450 hover:text-[#0d857a]'
          }`}
        >
          Construtor Visual
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer relative ${
            activeTab === 'responses' 
              ? 'border-[#0d857a] text-[#0d857a]' 
              : 'border-transparent text-slate-450 hover:text-[#0d857a]'
          }`}
        >
          Respostas Recebidas
          {validationsList.length > 0 && (
            <span className="ml-1.5 bg-[#0d857a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              {validationsList.length}
            </span>
          )}
        </button>
      </div>

      <EditorLayout
        header={
          <ProcessHeader
            name={processo.name}
            description={processo.description}
            category={processo.category}
            organization={processo.organization}
          />
        }
        canvas={
          activeTab === 'editor' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <ProcessCanvas
                blocks={processo.blocks || []}
                activeBlockId={activeBlockId}
                onSelectBlock={handleSelectBlock}
                onUpdateBlock={handleUpdateBlock}
                onAddBlockClick={() => setIsSidebarOpen(true)}
                onDeleteBlockClick={handleDeleteBlockClick}
                onMoveBlock={handleMoveBlock}
                onDuplicateBlock={handleDuplicateBlock}
              />
            </DndContext>
          ) : (
            /* Tab: Respostas Recebidas (List of publications for this process) */
            <div className="space-y-6 max-w-6xl mx-auto">
              {validationsList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-450 text-xs shadow-xs">
                  Nenhuma publicação ou validação foi registrada para este processo ainda.
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4 pl-6">Versão / Código</th>
                          <th className="p-4">Situação</th>
                          <th className="p-4">Resultado</th>
                          <th className="p-4">Responsável</th>
                          <th className="p-4">Cargo / Função</th>
                          <th className="p-4">Data Validação</th>
                          <th className="p-4">Protocolo</th>
                          <th className="p-4 pr-6 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {validationsList.map(pub => (
                          <tr key={pub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="font-bold text-slate-800">Versão {String(pub.version).padStart(2, '0')}</div>
                              <div className="text-[10px] text-slate-400 font-medium pt-0.5">{pub.publication_code}</div>
                            </td>
                            <td className="p-4">
                              {pub.status === 'awaiting_validation' && (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] rounded-lg">Aguardando</Badge>
                              )}
                              {pub.status === 'validated' && (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] rounded-lg">Validado</Badge>
                              )}
                              {pub.status === 'revoked' && (
                                <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] rounded-lg">Revogado</Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {pub.status === 'validated' && pub.primary_result ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg uppercase tracking-wide ${
                                  pub.response?.primary_decision?.semanticType === 'positive' || pub.primary_result_type === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                  pub.response?.primary_decision?.semanticType === 'attention' || pub.response?.primary_decision?.semanticType === 'warning' || pub.primary_result_type === 'warning' || pub.primary_result_type === 'attention' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                                  pub.response?.primary_decision?.semanticType === 'negative' || pub.primary_result_type === 'negative' ? 'bg-red-50 text-red-800 border-red-100' :
                                  'bg-slate-100 text-slate-800 border-slate-200'
                                }`}>
                                  {pub.primary_result}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium italic">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              {pub.status === 'validated' && pub.response ? (
                                <div>{pub.response.respondent_name}</div>
                              ) : (
                                <span className="text-slate-400 font-medium italic">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              {pub.status === 'validated' && pub.response ? (
                                <div>{pub.response.respondent_role}</div>
                              ) : (
                                <span className="text-slate-400 font-medium italic">-</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-450 font-medium">
                              {pub.status === 'validated' && pub.response ? (
                                new Date(pub.response.submitted_at).toLocaleDateString('pt-BR')
                              ) : (
                                <span className="text-slate-400 font-medium italic">-</span>
                              )}
                            </td>
                            <td className="p-4 font-mono font-bold text-[#0d857a]">
                              {pub.response?.protocol || '-'}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedPub(pub)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0d857a] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                  title="Visualizar Detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {pub.status === 'awaiting_validation' && (
                                  <>
                                    <button
                                      onClick={() => handleCopyValidationLink(pub.public_token)}
                                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0d857a] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                      title="Copiar Link"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCopyValidationEmail(pub)}
                                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0d857a] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                      title="Copiar E-mail"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRevokeValidationPub(pub.id)}
                                      className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                      title="Revogar Link"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {pub.status === 'validated' && (
                                  <>
                                    <button
                                      onClick={() => handleDownloadPubPDFReport(pub)}
                                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                      title="Exportar PDF"
                                    >
                                      <FileDown className="w-4 h-4 text-[#0d857a]" />
                                    </button>
                                    <button
                                      onClick={() => handleDownloadPubTXTReport(pub)}
                                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                      title="Exportar TXT"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        }
        sidebar={
          activeTab === 'editor' ? (
            <BlockSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onAddBlock={handleAddBlock}
            />
          ) : <div className="hidden" />
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteBlockDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* MODALS SECTION */}
      <AnimatePresence>
        {/* 1. VALIDATION ERRORS MODAL */}
        {isValidationErrorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setIsValidationErrorOpen(false)} className="absolute inset-0 bg-black" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="h-10 w-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Itens pendentes de correção</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  O processo possui blocos mal configurados ou vazios que precisam ser corrigidos antes da publicação.
                </p>
              </div>

              <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-150 rounded-xl">
                {validationErrors.map((err, i) => (
                  <div key={i} className="p-3 text-xs flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-700 block">
                        {err.position > 0 ? `Questão ${err.position}: ` : ''}{err.blockName}
                      </span>
                      <span className="text-slate-450 font-medium leading-relaxed">{err.message}</span>
                    </div>
                    {err.blockId && (
                      <Button
                        variant="outline"
                        onClick={() => handleGoToErrorBlock(err.blockId)}
                        className="h-7 px-2.5 text-[10px] font-bold border-slate-200 text-[#0d857a] hover:bg-[#0d857a]/5 rounded-lg shrink-0 cursor-pointer"
                      >
                        Ir para o bloco
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setIsValidationErrorOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold h-9 px-4 rounded-xl cursor-pointer text-xs"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. CONFIRM PUBLISH MODAL */}
        {isConfirmPublishOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmPublishOpen(false)} className="absolute inset-0 bg-black" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="h-10 w-10 bg-emerald-50 text-[#0d857a] rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Publicar processo para validação?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Será criada uma versão congelada do processo. O conteúdo desta versão não poderá ser alterado enquanto estiver disponível para validação.
                </p>
              </div>

              {/* Summary table */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-2 font-semibold text-slate-650">
                <div>Processo: <span className="text-slate-800 font-bold">{processo.name}</span></div>
                <div>Componentes: <span className="text-slate-800 font-bold">{processo.blocks.length} blocos</span></div>
                {processo.organization && (
                  <div>Organização: <span className="text-slate-800 font-bold">{processo.organization}</span></div>
                )}
                <div>Data de Publicação: <span className="text-slate-800 font-bold">{new Date().toLocaleDateString('pt-BR')}</span></div>
              </div>

              {/* Revoke Option check */}
              {isRevokeChoiceRequired && (
                <div className="space-y-3.5 bg-amber-50/40 border border-amber-200/60 p-4.5 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 leading-normal font-semibold">
                      Já existe uma versão aguardando validação ativa. Como deseja proceder?
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                      <input 
                        type="radio" 
                        name="revokeChoice" 
                        checked={revokePrevious === true} 
                        onChange={() => setRevokePrevious(true)} 
                        className="accent-[#0d857a]"
                      />
                      <span>Revogar link anterior e publicar nova versão</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                      <input 
                        type="radio" 
                        name="revokeChoice" 
                        checked={revokePrevious === false} 
                        onChange={() => setRevokePrevious(false)} 
                        className="accent-[#0d857a]"
                      />
                      <span>Manter versão anterior ativa</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={() => setIsConfirmPublishOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold h-9 px-4 rounded-xl cursor-pointer text-xs border-0"
                  disabled={publishing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalizePublish}
                  className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs"
                  disabled={publishing}
                >
                  {publishing ? 'Publicando...' : 'Publicar agora'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. PUBLISH SUCCESS MODAL */}
        {isPublishSuccessOpen && publishedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setIsPublishSuccessOpen(false)} className="absolute inset-0 bg-black" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 shadow-xl space-y-6 text-center">
              <div className="space-y-3 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner mb-2 animate-bounce">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Processo publicado com sucesso</h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Código: {publishedData.publication_code} — Versão {String(publishedData.version).padStart(2, '0')}
                </span>
                <p className="text-[11px] text-slate-500 max-w-sm pt-2 leading-relaxed">
                  Copie o link público ou a mensagem de e-mail personalizada para enviar ao seu cliente externo.
                </p>
              </div>

              {/* Link Box */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-left max-w-md mx-auto">
                <span className="text-[11px] font-semibold text-slate-500 truncate flex-1 pl-1">
                  {`${window.location.origin}/validar/${publishedData.public_token}`}
                </span>
                <Button
                  onClick={handleCopyLink}
                  className="bg-white hover:bg-slate-100 text-slate-655 border border-slate-200 hover:text-[#0d857a] h-8 px-3 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar Link
                </Button>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-2 border-t border-slate-100">
                <Button
                  onClick={handleCopyEmail}
                  variant="outline"
                  className="border-slate-200 text-slate-655 hover:bg-slate-100 h-9 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Copiar E-mail
                </Button>
                
                <Button
                  onClick={handleDownloadBlankPDF}
                  variant="outline"
                  className="border-slate-200 text-slate-655 hover:bg-slate-100 h-9 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#0d857a]" />
                  <span>Baixar PDF</span>
                </Button>

                <Button
                  onClick={() => {
                    setIsPublishSuccessOpen(false);
                    const win = window.open(`/validar/${publishedData.public_token}`, '_blank');
                    if (win) win.focus();
                  }}
                  variant="outline"
                  className="border-slate-200 text-slate-655 hover:bg-slate-100 h-9 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Cliente
                </Button>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setIsPublishSuccessOpen(false)}
                  className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-6 rounded-xl cursor-pointer border-0 text-xs shadow-xs"
                >
                  Concluir
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. PREVIEW DRAWER */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)} className="absolute inset-0 bg-black" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                <div className="space-y-1">
                  <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-[#0d857a]" />
                    Visualização do Formulário
                  </h2>
                  <span className="text-[9px] text-slate-400 font-medium">Modo de pré-visualização de preenchimento</span>
                </div>
                <button onClick={() => setIsPreviewOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors border-0 bg-transparent">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold text-slate-700">
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <h1 className="text-base font-bold text-slate-850">{processo.name}</h1>
                  {processo.description && <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{processo.description}</p>}
                </div>
                
                {/* Respondent Identification (Static Mock) */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3.5">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identificação do Responsável</h3>
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-450 font-medium">
                    <div className="space-y-1"><span className="block text-[9px] font-bold uppercase">Nome Completo *</span><div className="h-8 border border-slate-200 bg-white rounded-lg px-2 flex items-center">João da Silva</div></div>
                    <div className="space-y-1"><span className="block text-[9px] font-bold uppercase">Cargo ou Função *</span><div className="h-8 border border-slate-200 bg-white rounded-lg px-2 flex items-center">Analista de Qualidade</div></div>
                  </div>
                </div>

                {/* Render Process Blocks (Simulation) */}
                <div className="space-y-6 pt-2">
                  {processo.blocks.map((block, i) => (
                    <div key={block.id} className="space-y-2 pb-4 border-b border-slate-100 last:border-0">
                      {block.type !== 'heading_text' && (
                        <h4 className="font-bold text-slate-800 text-[12.5px] leading-tight">
                          {i + 1}. {block.title}
                          {block.required && <span className="text-red-500 font-bold ml-1">*</span>}
                        </h4>
                      )}
                      
                      {block.description && block.type !== 'heading_text' && (
                        <p className="text-[10.5px] text-slate-450 leading-relaxed font-medium pb-1">{block.description}</p>
                      )}

                      {/* Input Types */}
                      {block.type === 'heading_text' && (
                        <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-1">
                          <h4 className="font-bold text-slate-800 text-xs">{block.title}</h4>
                          <p className="text-[11px] text-slate-550 leading-normal font-medium">{block.description}</p>
                        </div>
                      )}

                      {block.type === 'short_answer' && (
                        <div className="h-9 border border-slate-200 rounded-lg bg-slate-50/30 text-slate-400 flex items-center px-3 text-xs select-none">
                          {block.placeholder || 'Resposta curta...'}
                        </div>
                      )}

                      {block.type === 'long_answer' && (
                        <div className="h-16 border border-slate-200 rounded-lg bg-slate-50/30 text-slate-400 p-2.5 text-xs select-none">
                          {block.placeholder || 'Resposta detalhada...'}
                        </div>
                      )}

                      {block.type === 'multiple_choice' && (
                        <div className="space-y-1.5 pt-0.5">
                          {(block.options || []).map(o => (
                            <div key={o.id} className="flex items-center gap-2">
                              <div className="h-4 w-4 border border-slate-300 rounded-full" />
                              <span className="text-[11.5px] text-slate-650 font-medium">{o.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {block.type === 'checkbox' && (
                        <div className="space-y-1.5 pt-0.5">
                          {(block.options || []).map(o => (
                            <div key={o.id} className="flex items-center gap-2">
                              <div className="h-4 w-4 border border-slate-300 rounded" />
                              <span className="text-[11.5px] text-slate-650 font-medium">{o.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {block.type === 'dropdown' && (
                        <div className="h-9 max-w-xs border border-slate-200 rounded-lg bg-white px-2.5 flex items-center justify-between text-slate-400 text-xs select-none">
                          <span>Selecione uma opção...</span>
                          <span className="text-slate-400">▼</span>
                        </div>
                      )}

                      {block.type === 'date' && (
                        <div className="h-9 max-w-xs border border-slate-200 rounded-lg bg-white px-2.5 flex items-center justify-between text-slate-400 text-xs select-none">
                          <span>DD/MM/AAAA</span>
                          <span className="text-slate-400">📅</span>
                        </div>
                      )}

                      {block.type === 'file_upload' && (
                        <div className="h-20 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 space-y-1 select-none">
                          <span className="text-xs font-semibold text-slate-500">Clique para enviar arquivos</span>
                          <span className="text-[9px]">Tamanho máximo: {block.maxSizeMB || 10}MB</span>
                        </div>
                      )}

                      {block.type === 'acknowledgement' && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl select-none">
                          <div className="h-4.5 w-4.5 border border-slate-300 rounded shrink-0 mt-0.5" />
                          <span className="text-[11px] text-slate-650 leading-relaxed font-medium">{block.declarationText}</span>
                        </div>
                      )}

                      {block.type === 'approval_decision' && (
                        <div className="space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {(block.decisions || []).map(dec => (
                              <div key={dec.id} className="text-[9px] px-2.5 py-1 border border-slate-200 text-slate-450 font-bold uppercase tracking-wider rounded-lg">
                                {dec.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Footer */}
              <div className="p-4.5 border-t border-slate-100 flex items-center justify-end shrink-0 bg-slate-50">
                <Button onClick={() => setIsPreviewOpen(false)} className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. VALIDATION DETAILS DRAWER */}
        {selectedPub && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPub(null)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Drawer Box */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                <div className="space-y-1">
                  <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#0d857a]" />
                    {selectedPub.snapshot?.name}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider bg-slate-200 border border-slate-300 px-2 py-0.5 rounded">
                    {selectedPub.publication_code} - Versão {String(selectedPub.version).padStart(2, '0')}
                  </span>
                </div>
                
                <button
                  onClick={() => setSelectedPub(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors border-0 bg-transparent"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 text-xs font-semibold text-slate-700">
                {/* Identification */}
                <div className="space-y-4 bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Metadados da Validação
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Situação:</span>
                      {selectedPub.status === 'awaiting_validation' && <span className="text-amber-600 font-bold">Aguardando Validação</span>}
                      {selectedPub.status === 'validated' && <span className="text-emerald-600 font-bold">Validado</span>}
                      {selectedPub.status === 'revoked' && <span className="text-red-500 font-bold">Revogado</span>}
                    </div>
                    {selectedPub.status === 'validated' && selectedPub.response && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Protocolo:</span>
                        <span className="text-teal-700 font-bold">{selectedPub.response.protocol}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Publicado em:</span>
                      {new Date(selectedPub.published_at).toLocaleString('pt-BR')}
                    </div>
                    {selectedPub.status === 'validated' && selectedPub.response && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Validado em:</span>
                        {new Date(selectedPub.response.submitted_at).toLocaleString('pt-BR')}
                      </div>
                    )}
                    {selectedPub.status === 'revoked' && selectedPub.revoked_at && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Revogado em:</span>
                        {new Date(selectedPub.revoked_at).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Respondent Profile */}
                {selectedPub.status === 'validated' && selectedPub.response && (
                  <div className="space-y-4 bg-teal-50/20 border border-teal-100 p-4.5 rounded-2xl">
                    <h3 className="text-[11px] font-bold text-[#0d857a] uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#0d857a]" />
                      Responsável Externo
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-455 block font-medium">Nome completo:</span>
                        {selectedPub.response.respondent_name}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-455 block font-medium">Cargo ou Função:</span>
                        {selectedPub.response.respondent_role}
                      </div>
                      {selectedPub.response.respondent_email && (
                        <div className="col-span-full">
                          <span className="text-[10px] text-slate-455 block font-medium">E-mail:</span>
                          {selectedPub.response.respondent_email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Answers details */}
                <div className="space-y-5">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">
                    Respostas dos Blocos
                  </h3>
                  
                  {(selectedPub.snapshot?.blocks || []).map((block: any, index: number) => {
                    const ans = selectedPub.response?.answers?.find((a: any) => (a.block_id || a.blockId) === block.id);
                    
                    if (block.type === 'heading_text') {
                      return (
                        <div key={block.id} className="bg-slate-50 border border-slate-155 p-3 rounded-lg space-y-1 font-medium">
                          <span className="font-semibold text-slate-700 block">{block.title}</span>
                          <span className="text-[10px] text-slate-450 whitespace-pre-line leading-relaxed">{block.description}</span>
                        </div>
                      );
                    }

                    if (selectedPub.status === 'awaiting_validation') {
                      return (
                        <div key={block.id} className="space-y-1 bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
                          <span className="text-slate-455 text-[10px] block font-medium">Questão {index + 1}: {block.title}</span>
                          <span className="text-slate-400 font-medium italic block pt-1">Link awaiting validation...</span>
                        </div>
                      );
                    }

                    if (selectedPub.status === 'revoked') {
                      return (
                        <div key={block.id} className="space-y-1 bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
                          <span className="text-slate-455 text-[10px] block font-medium">Questão {index + 1}: {block.title}</span>
                          <span className="text-slate-400 font-medium italic block pt-1">Link revogado antes de responder.</span>
                        </div>
                      );
                    }

                    if (!ans) {
                      return (
                        <div key={block.id} className="space-y-1 bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
                          <span className="text-slate-455 text-[10px] block font-medium">Questão {index + 1}: {block.title}</span>
                          <span className="text-red-400 font-medium italic block pt-1">Sem resposta disponível.</span>
                        </div>
                      );
                    }

                    // Extract values supporting both formats
                    const ansVal = ans.value !== undefined ? ans.value : ans.answer;
                    const commentVal = ans.comment;
                    const confirmedVal = ans.confirmed !== undefined ? ans.confirmed : (ans.value === true || ans.value === 'true');
                    const attachedFiles = ans.attached_files || (Array.isArray(ans.value) ? ans.value : []);
                    const selectedLabels = ans.selected_option_labels || [];

                    return (
                      <div key={block.id} className="space-y-1 bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
                        <span className="text-slate-455 text-[10px] block font-medium">Questão {index + 1}: {block.title}</span>
                        
                        <div className="pt-1.5 font-bold text-slate-750">
                          {/* Acknowledgement */}
                          {block.type === 'acknowledgement' && (
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg ${
                                confirmedVal === true ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {confirmedVal === true ? 'DECLARAÇÃO CONFIRMADA' : 'NÃO ACEITO'}
                              </span>
                            </div>
                          )}

                          {/* File Upload */}
                          {block.type === 'file_upload' && (
                            <div className="space-y-1.5">
                              {attachedFiles.length > 0 ? (
                                attachedFiles.map((file: any) => (
                                  <div 
                                    key={file.path} 
                                    onClick={() => handleDownloadPubAttachment(file.path, file.name)}
                                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg max-w-sm hover:border-[#0d857a] hover:bg-[#0d857a]/5 cursor-pointer transition-all"
                                  >
                                    <span className="text-slate-655 font-semibold truncate max-w-[200px] flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      {file.name}
                                    </span>
                                    <span className="text-[9px] text-[#0d857a] font-bold uppercase tracking-wider">Baixar</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 italic font-medium">Nenhum arquivo enviado</span>
                              )}
                            </div>
                          )}

                          {/* Approval Decision */}
                          {block.type === 'approval_decision' && (
                            <div className="space-y-2">
                              <span className={`text-[10px] font-bold px-3 py-1 border rounded-xl uppercase tracking-wider inline-block ${
                                ansVal?.semanticType === 'positive' || ans.primary_decision?.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                ansVal?.semanticType === 'attention' || ansVal?.semanticType === 'warning' || ans.primary_decision?.semanticType === 'attention' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                ansVal?.semanticType === 'negative' || ans.primary_decision?.semanticType === 'negative' ? 'bg-red-50 text-red-800 border-red-200' :
                                'bg-slate-550 text-slate-800 border-slate-300'
                              }`}>
                                {typeof ansVal === 'object' ? ansVal?.text : String(ansVal)}
                              </span>
                              {commentVal && (
                                <div className="text-xs font-medium text-slate-500 leading-relaxed bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg">
                                  <span className="font-bold text-slate-600 block mb-0.5">Comentário/Justificativa:</span>
                                  {commentVal}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Choice Option / Checkboxes */}
                          {block.type === 'checkbox' && (
                            <span className="text-xs text-slate-700 block leading-relaxed">
                              {selectedLabels.length > 0 ? selectedLabels.join(', ') : Array.isArray(ansVal) ? ansVal.join(', ') : String(ansVal)}
                            </span>
                          )}

                          {/* Multiple Choice */}
                          {block.type === 'multiple_choice' && (
                            <span className="text-xs text-slate-700 block">
                              {selectedLabels.length > 0 ? selectedLabels[0] : typeof ansVal === 'object' ? ansVal?.text : String(ansVal)}
                            </span>
                          )}

                          {/* Basic Text inputs */}
                          {block.type !== 'acknowledgement' && block.type !== 'file_upload' && block.type !== 'approval_decision' && block.type !== 'checkbox' && block.type !== 'multiple_choice' && (
                            <span className="text-xs text-slate-700 block leading-relaxed">{String(ansVal)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4.5 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50">
                {selectedPub.status === 'awaiting_validation' && (
                  <>
                    <Button
                      onClick={() => handleRevokeValidationPub(selectedPub.id)}
                      className="bg-red-500 hover:bg-red-650 text-white font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs"
                    >
                      Revogar Link
                    </Button>
                    <Button
                      onClick={() => handleCopyValidationLink(selectedPub.public_token)}
                      className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs"
                    >
                      Copiar Link
                    </Button>
                  </>
                )}

                {selectedPub.status === 'validated' && (
                  <>
                    <Button
                      onClick={() => handleDownloadPubTXTReport(selectedPub)}
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-450" />
                      <span>Baixar TXT</span>
                    </Button>
                    <Button
                      onClick={() => handleDownloadPubPDFReport(selectedPub)}
                      className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs flex items-center gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-900 stroke-[2.5px]" />
                      <span>Baixar PDF</span>
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={() => setSelectedPub(null)}
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
