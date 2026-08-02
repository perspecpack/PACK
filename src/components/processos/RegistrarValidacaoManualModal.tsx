import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Mail, ShieldAlert, CheckCircle, FileText, Briefcase, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RegistrarValidacaoManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    result: 'Aprovado' | 'Aprovado com Ressalvas' | 'Reprovado';
    respondentName: string;
    respondentRole: string;
    responseDate: string;
    validationMethod: string;
    emailSubject: string;
    notes: string;
    declared: boolean;
  }) => Promise<void>;
  submitting: boolean;
  publicationTitle: string;
  publicationCode?: string;
}

const VALIDATION_METHODS = [
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Portal', label: 'Portal' },
  { value: 'Reunião', label: 'Reunião' },
  { value: 'Documento Assinado', label: 'Documento Assinado' },
  { value: 'Telefone', label: 'Telefone' },
  { value: 'Outro', label: 'Outro' }
];

export default function RegistrarValidacaoManualModal({
  isOpen,
  onClose,
  onSave,
  submitting,
  publicationTitle,
  publicationCode
}: RegistrarValidacaoManualModalProps) {
  const [result, setResult] = useState<'Aprovado' | 'Aprovado com Ressalvas' | 'Reprovado'>('Aprovado');
  const [respondentName, setRespondentName] = useState('');
  const [respondentRole, setRespondentRole] = useState('');
  const [responseDate, setResponseDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [validationMethod, setValidationMethod] = useState('E-mail');
  const [emailSubject, setEmailSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [declared, setDeclared] = useState(false);

  // Reset fields when opened
  useEffect(() => {
    if (isOpen) {
      setResult('Aprovado');
      setRespondentName('');
      setRespondentRole('');
      setResponseDate(new Date().toISOString().substring(0, 10));
      setValidationMethod('E-mail');
      setEmailSubject('');
      setNotes('');
      setDeclared(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (respondentName.trim().length < 3) {
      toast.error('O nome do responsável deve conter pelo menos 3 caracteres.');
      return;
    }

    if (respondentRole.trim().length < 2) {
      toast.error('O cargo ou função deve conter pelo menos 2 caracteres.');
      return;
    }

    if (!declared) {
      toast.error('Você precisa confirmar a declaração de fidelidade para salvar.');
      return;
    }

    try {
      await onSave({
        result,
        respondentName: respondentName.trim(),
        respondentRole: respondentRole.trim(),
        responseDate,
        validationMethod,
        emailSubject: emailSubject.trim(),
        notes: notes.trim(),
        declared
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao registrar validação manual.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-[15px] flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-[#0d857a]" />
              Registrar Validação Manual
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Processo: <span className="font-semibold text-slate-700">{publicationTitle}</span> 
              {publicationCode && ` (${publicationCode})`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-all border-0 bg-transparent cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Resultado Decision Grid */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Resultado da Validação
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResult('Aprovado')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  result === 'Aprovado'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Aprovado
              </button>
              <button
                type="button"
                onClick={() => setResult('Aprovado com Ressalvas')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  result === 'Aprovado com Ressalvas'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Com Ressalvas
              </button>
              <button
                type="button"
                onClick={() => setResult('Reprovado')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  result === 'Reprovado'
                    ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Reprovado
              </button>
            </div>
          </div>

          {/* Respondent name and role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="resp-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Respondido por (Nome) *
              </Label>
              <Input
                id="resp-name"
                required
                type="text"
                placeholder="Ex: João Silva"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resp-role" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cargo / Função *
              </Label>
              <Input
                id="resp-role"
                required
                type="text"
                placeholder="Ex: Gerente de Qualidade"
                value={respondentRole}
                onChange={(e) => setRespondentRole(e.target.value)}
                className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/10 rounded-xl"
              />
            </div>
          </div>

          {/* Date and Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="resp-date" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Data da Resposta *
              </Label>
              <div className="relative">
                <Input
                  id="resp-date"
                  required
                  type="date"
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                  className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/10 rounded-xl pl-9"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="validation-method" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Meio de Validação *
              </Label>
              <div className="relative">
                <select
                  id="validation-method"
                  value={validationMethod}
                  onChange={(e) => setValidationMethod(e.target.value)}
                  className="w-full h-9.5 text-xs border border-slate-200 rounded-xl px-3 bg-white text-slate-700 focus:border-[#0d857a] focus:ring-1 focus:ring-[#0d857a]/15 outline-none appearance-none cursor-pointer"
                >
                  {VALIDATION_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Email subject (only shown if Method is E-mail, or optional context) */}
          <div className="space-y-1.5">
            <Label htmlFor="email-subject" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assunto do E-mail {validationMethod === 'E-mail' && '*'}
            </Label>
            <Input
              id="email-subject"
              required={validationMethod === 'E-mail'}
              type="text"
              placeholder="Ex: RES: Solicitação de validação do processo VW"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="h-9.5 text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/10 rounded-xl"
            />
          </div>

          {/* Observations */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Observações / Notas
            </Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Descreva detalhes ou transcreva trechos da resposta do cliente para fins de auditoria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs border-slate-200 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/10 rounded-xl resize-none"
            />
          </div>

          {/* Declaration Checkbox */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <input
              id="declared"
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              className="mt-1 h-4 w-4 rounded-md border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <Label
              htmlFor="declared"
              className="text-xs text-amber-900 leading-normal font-semibold select-none cursor-pointer"
            >
              Confirmo que este registro corresponde fielmente à resposta recebida do cliente através do e-mail corporativo.
            </Label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4.5 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="border-slate-200 text-slate-650 hover:bg-slate-100 cursor-pointer h-9.5 px-4 rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting || !declared}
            onClick={handleSubmit}
            className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9.5 px-5 rounded-xl cursor-pointer border-0 text-xs shadow-xs disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {submitting ? 'Salvando...' : 'Salvar Registro'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
