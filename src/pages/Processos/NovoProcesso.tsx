import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Workflow, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NovoProcesso() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome do processo é obrigatório.');
      return;
    }

    setIsLoading(true);

    try {
      const newProcess = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        organization: organization.trim() || undefined,
        createdAt: new Date().toISOString(),
        blocksCount: 0,
        blocks: []
      };

      // Load existing processes
      const stored = localStorage.getItem('perspecpack:processos');
      const processes = stored ? JSON.parse(stored) : [];
      
      // Save new process
      localStorage.setItem(
        'perspecpack:processos',
        JSON.stringify([newProcess, ...processes])
      );

      toast.success('Processo criado com sucesso!');
      
      // Redirect to visual editor
      navigate(`/app/processos/${newProcess.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar o processo de aprovação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to list */}
      <button
        onClick={() => navigate('/app/processos')}
        className="flex items-center gap-2 text-slate-450 hover:text-[#0d857a] text-xs font-semibold transition-colors cursor-pointer border-0 bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Processos de Aprovação
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs space-y-8"
      >
        {/* Title Block */}
        <div className="space-y-2 border-b border-slate-100 pb-5">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Workflow className="w-5.5 h-5.5 text-[#0d857a]" />
            Novo Processo de Aprovação
          </h1>
          <p className="text-sm text-slate-500">
            Configure as informações iniciais do seu processo.
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
              className="min-h-[100px] border-slate-200 text-slate-800 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/20 p-2.5"
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
              onClick={() => navigate('/app/processos')}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-10 px-4 rounded-xl"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-10 px-5 rounded-xl cursor-pointer border-0 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Processo'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
