import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Workflow, 
  ArrowLeft, 
  Plus, 
  FilePlus, 
  FileCheck, 
  PackageCheck, 
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';
import { processTemplateRegistry } from '@/src/templates/template-registry';

export default function NovoProcesso() {
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectTemplate = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    
    if (templateId === null) {
      // Create from scratch
      setName('');
      setDescription('');
      setCategory('');
      setOrganization('');
    } else {
      // Create from template
      const template = processTemplateRegistry.get(templateId);
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setCategory(template.category);
        setOrganization('');
      }
    }
    
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome do processo é obrigatório.');
      return;
    }

    setIsLoading(true);

    try {
      // Get blocks to clone
      const clonedBlocks = selectedTemplateId 
        ? processTemplateRegistry.clone(selectedTemplateId).blocks
        : [];

      const template = selectedTemplateId
        ? processTemplateRegistry.get(selectedTemplateId)
        : null;

      if (supabase && user) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('processes')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            category: category.trim() || null,
            organization: organization.trim() || null,
            blocks: clonedBlocks,
            status: 'draft',
            user_id: user.id,
            template_id: selectedTemplateId,
            template_version: template ? template.version : null
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Processo criado com sucesso!');
        navigate(`/app/processos/${data.id}`);
      } else {
        // LocalStorage fallback
        const newProcess = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name: name.trim(),
          description: description.trim(),
          category: category.trim() || undefined,
          organization: organization.trim() || undefined,
          createdAt: new Date().toISOString(),
          blocksCount: clonedBlocks.length,
          blocks: clonedBlocks,
          status: 'draft',
          template_id: selectedTemplateId,
          template_version: template ? template.version : null
        };

        const stored = localStorage.getItem('perspecpack:processos');
        const processes = stored ? JSON.parse(stored) : [];
        
        localStorage.setItem(
          'perspecpack:processos',
          JSON.stringify([newProcess, ...processes])
        );

        toast.success('Processo criado com sucesso!');
        navigate(`/app/processos/${newProcess.id}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao criar o processo de aprovação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => {
          if (step === 2) {
            setStep(1);
          } else {
            navigate('/app/processos');
          }
        }}
        className="flex items-center gap-2 text-slate-450 hover:text-[#0d857a] text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 2 ? 'Voltar para Escolha de Modelo' : 'Voltar para Processos de Aprovação'}
      </button>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* STEP 1: SELECT MODEL */
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs"
          >
            {/* Header Title */}
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                <Workflow className="w-6 h-6 text-[#0d857a]" />
                Criar novo Processo de Aprovação
              </h1>
              <p className="text-sm text-slate-500">
                Escolha como deseja iniciar. Todos os modelos podem ser totalmente editados após a criação.
              </p>
            </div>

            {/* Template Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: CREATE FROM SCRATCH */}
              <div 
                onClick={() => handleSelectTemplate(null)}
                className="group border border-slate-200 hover:border-[#0d857a]/30 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-50/20 hover:shadow-xs transition-all duration-200 cursor-pointer text-left h-[260px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/15 transition-all">
                      <FilePlus className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border border-slate-150 px-2.5 py-0.5 rounded-full">
                      Personalizado
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-[15px] text-slate-850 group-hover:text-[#0d857a] transition-colors leading-tight">
                      Criar do zero
                    </h3>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Comece com um processo completamente vazio e adicione apenas os blocos necessários.
                    </p>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-9 bg-white border-slate-200 text-xs font-semibold text-slate-650 hover:bg-[#0d857a] hover:text-teal-950 hover:border-[#0d857a] transition-all rounded-xl mt-4 cursor-pointer"
                >
                  <span>Criar processo vazio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* CARD 2: PROJECT APPROVAL */}
              <div 
                onClick={() => handleSelectTemplate('approval-project')}
                className="group border border-slate-200 hover:border-[#0d857a]/30 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-50/20 hover:shadow-xs transition-all duration-200 cursor-pointer text-left h-[260px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/15 transition-all">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      Modelo editável
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-[15px] text-slate-850 group-hover:text-[#0d857a] transition-colors leading-tight">
                      Aprovação de Projeto
                    </h3>
                    <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-3">
                      Estrutura inicial para análise de documentação técnica, características do projeto e autorização para fabricação.
                    </p>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-9 bg-white border-slate-200 text-xs font-semibold text-slate-655 hover:bg-[#0d857a] hover:text-teal-950 hover:border-[#0d857a] transition-all rounded-xl mt-4 cursor-pointer"
                >
                  <span>Usar este modelo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* CARD 3: PROTOTYPE APPROVAL */}
              <div 
                onClick={() => handleSelectTemplate('approval-prototype')}
                className="group border border-slate-200 hover:border-[#0d857a]/30 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-50/20 hover:shadow-xs transition-all duration-200 cursor-pointer text-left h-[260px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0d857a]/5 group-hover:text-[#0d857a] group-hover:border-[#0d857a]/15 transition-all">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      Modelo editável
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-[15px] text-slate-850 group-hover:text-[#0d857a] transition-colors leading-tight">
                      Aprovação de Protótipo
                    </h3>
                    <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-3">
                      Estrutura inicial para avaliação de um protótipo físico e autorização para fabricação do lote.
                    </p>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-9 bg-white border-slate-200 text-xs font-semibold text-slate-655 hover:bg-[#0d857a] hover:text-teal-950 hover:border-[#0d857a] transition-all rounded-xl mt-4 cursor-pointer"
                >
                  <span>Usar este modelo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Warning Regulatory Notice */}
            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-slate-500 text-[11px] leading-relaxed">
              <Info className="w-4 h-4 text-[#0d857a] shrink-0 mt-0.5" />
              <p>
                Os modelos são estruturas iniciais editáveis. Revise e adapte o conteúdo às necessidades, requisitos técnicos e responsabilidades da sua empresa.
              </p>
            </div>
          </motion.div>
        ) : (
          /* STEP 2: METADATA FORM */
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs space-y-8"
          >
            {/* Header Title */}
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                <Workflow className="w-6 h-6 text-[#0d857a]" />
                Informações Iniciais do Processo
              </h1>
              <p className="text-sm text-slate-500">
                {selectedTemplateId 
                  ? 'Configure os dados de identificação para a cópia do modelo selecionado.'
                  : 'Configure as informações iniciais para o seu processo personalizado.'
                }
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="process-name" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Nome do Processo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="process-name"
                  type="text"
                  placeholder="Ex: Auditoria de Recebimento de Peças"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-slate-200 text-slate-800 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="process-desc" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Descrição
                </Label>
                <Textarea
                  id="process-desc"
                  placeholder="Descreva o fluxo de aprovação ou detalhes do processo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] border-slate-200 text-slate-800 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 p-2.5 text-xs"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="process-category" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Categoria (opcional)
                  </Label>
                  <Input
                    id="process-category"
                    type="text"
                    placeholder="Ex: Qualidade, Manutenção, Logística"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 border-slate-200 text-slate-800 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-org" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Organização (opcional)
                  </Label>
                  <Input
                    id="process-org"
                    type="text"
                    placeholder="Ex: Planta Sul, Setor de Estamparia"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="h-10 border-slate-200 text-slate-800 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-10 px-4 rounded-xl text-xs font-bold"
                  disabled={isLoading}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-10 px-5 rounded-xl cursor-pointer border-0 shadow-sm text-xs"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando...' : 'Criar Processo'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
