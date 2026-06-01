import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/src/context/AppContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function MyPlan() {
  const navigate = useNavigate();
  const { user, profile, logPageAccess } = useApp();
  
  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [estimatedUsers, setEstimatedUsers] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    logPageAccess('Fornecedor - Meu Plano');
  }, [logPageAccess]);

  useEffect(() => {
    if (isRequestModalOpen && profile) {
      setContactName(profile.fullName || '');
      setCompanyName(profile.companyName || '');
      setPhone(profile.phone || '');
      setEmail(profile.corporateEmail || '');
    }
  }, [profile, isRequestModalOpen]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !companyName.trim() || !email.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized.');
      
      const { error } = await supabase
        .from('upgrade_requests')
        .insert({
          user_id: profile?.userId || user?.id,
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          estimated_users: estimatedUsers === '' ? null : Number(estimatedUsers),
          notes: notes.trim(),
          status: 'novo'
        });

      if (error) throw error;

      setIsRequestModalOpen(false);
      setShowRequestSuccess(true);
      
      // Reset non-prefilled fields
      setEstimatedUsers('');
      setNotes('');
    } catch (err: any) {
      console.error('Error submitting upgrade request:', err);
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      // Split YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  const isPremium = profile?.planType === 'premium';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* Breadcrumb & Navigation */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-650 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Downloads</span>
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Meu Plano</h2>
        <p className="text-slate-500 text-sm">
          Gerencie e visualize os detalhes da sua assinatura e permissões na plataforma PERSPECPACK.
        </p>
      </div>

      {showRequestSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-inner shrink-0">
              <CheckCircle className="w-5 h-5 text-[#00F59B]" />
            </div>
            <div>
              <h4 className="text-[15px] font-extrabold text-slate-900">Solicitação enviada com sucesso.</h4>
              <p className="text-xs text-slate-650 mt-0.5">Nossa equipe analisará sua solicitação e retornará em breve.</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowRequestSuccess(false)}
            className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl shrink-0"
          >
            Entendido
          </Button>
        </div>
      )}

      {/* Main card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side - Current Status Details */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status Atual</span>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm border",
                  isPremium 
                    ? "bg-amber-50 border-amber-200 text-amber-600" 
                    : "bg-slate-100 border-slate-200 text-slate-600"
                )}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase leading-none">Plano Atual</h3>
                  <p className={cn(
                    "text-2xl font-black mt-1",
                    isPremium ? "text-amber-600" : "text-slate-700"
                  )}>
                    {isPremium ? 'PREMIUM' : 'FREE'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-550">Status da Conta:</span>
                <span className="font-bold text-emerald-650 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  ATIVO
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-550">Período de Validade:</span>
                <span className="font-bold text-slate-800">
                  {isPremium ? `Até ${formatDate(profile?.premiumUntil)}` : 'Vitalício (Gratuito)'}
                </span>
              </div>
            </div>
          </div>

          {!isPremium ? (
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl text-left flex gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-normal font-medium">
                  Você está navegando no plano básico. Componentes 3D e checklists requerem upgrade.
                </p>
              </div>
              <Button 
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full bg-teal-650 hover:bg-teal-750 text-white font-bold h-11 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-[#00F59B]" />
                <span>Solicitar Plano Premium</span>
              </Button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5 items-start">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 leading-tight">Assinatura Premium Ativa</h4>
                <p className="text-[11px] text-amber-800 mt-1 leading-normal">
                  Sua licença corporativa está active. Aproveite o acesso completo à biblioteca e exportações de relatórios.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Comparison Benefits List */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Benefícios e Comparativo</span>
            
            <h3 className="font-extrabold text-[15px] text-slate-900">Por que migrar para o Plano Premium?</h3>
            
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">&#10003;</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Modelagens 3D e Vetoriais Homologadas</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Download irrestrito de componentes originais em formatos 3D STEP, DWG e PDF técnico.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">&#10003;</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Checklists de Validação Técnica</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Execução completa de listas de verificação OEM para liberação geométrica e ergonômica.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">&#10003;</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Laudos e Relatórios com Assinatura Digital</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Geração instantânea de relatórios de conformidade em PDF com código de autenticidade rastreável.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">&#10003;</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Histórico e Auditoria Completa</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Acesso centralizado a todo histórico de downloads e checklists gerados por sua empresa.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/65 rounded-xl p-4 text-center text-xs">
            <span className="font-bold text-slate-700">
              Plano Premium disponível mediante proposta comercial.
            </span>
          </div>
        </div>

      </div>

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            
            {/* Header */}
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00F59B]" />
                <span>Solicitação de Upgrade para Plano Premium</span>
              </h3>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body / Form */}
            <form onSubmit={handleSubmitRequest} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              <p className="text-xs text-slate-550 leading-relaxed bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                O Plano Premium oferece acesso completo aos componentes homologados, arquivos 3D, checklists de validação, relatórios de conformidade e recursos avançados da plataforma.
                <br /><br />
                Nossa equipe analisará sua solicitação e entrará em contato caso necessário.
              </p>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="contactName" className="text-[11px] font-bold text-slate-750">Responsável pelo Contato *</Label>
                  <Input 
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-10 text-xs rounded-xl border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="companyName" className="text-[11px] font-bold text-slate-750">Empresa *</Label>
                  <Input 
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-10 text-xs rounded-xl border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-[11px] font-bold text-slate-750">Telefone</Label>
                    <Input 
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 text-xs rounded-xl border-slate-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[11px] font-bold text-slate-750">E-mail *</Label>
                    <Input 
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 text-xs rounded-xl border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="estimatedUsers" className="text-[11px] font-bold text-slate-750">Quantidade Estimada de Usuários</Label>
                  <Input 
                    id="estimatedUsers"
                    type="number"
                    min="1"
                    value={estimatedUsers}
                    onChange={(e) => setEstimatedUsers(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 5"
                    className="h-10 text-xs rounded-xl border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-[11px] font-bold text-slate-750">Observações</Label>
                  <textarea 
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Alguma observação ou necessidade específica..."
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Footer Buttons inside the Form */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="bg-white border-slate-250 text-slate-700 text-xs font-semibold h-10 px-5 rounded-xl animate-none"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-teal-650 hover:bg-teal-750 text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Solicitação</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
