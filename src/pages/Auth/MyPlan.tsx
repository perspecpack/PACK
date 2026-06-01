import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/context/AppContext';
import { cn } from '@/lib/utils';

export default function MyPlan() {
  const navigate = useNavigate();
  const { profile, updateProfile, logPageAccess } = useApp();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    logPageAccess('Fornecedor - Meu Plano');
  }, [logPageAccess]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // Simulate upgrade: Set plan to premium valid for 1 year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const premiumUntilStr = oneYearFromNow.toISOString().split('T')[0];

      await updateProfile({
        planType: 'premium',
        premiumUntil: premiumUntilStr
      });
      
      setShowSuccess(true);
    } catch (err) {
      console.error('Upgrade simulation failed:', err);
      alert('Erro ao realizar simulação de upgrade.');
    } finally {
      setIsUpgrading(false);
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

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle className="w-5 h-5 text-[#00F59B]" />
            </div>
            <div>
              <h4 className="text-[15px] font-extrabold text-slate-900">Parabéns! Plano Premium Ativado</h4>
              <p className="text-xs text-slate-650 mt-0.5">Sua conta foi atualizada com sucesso para o plano Premium. Todos os recursos foram desbloqueados!</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowSuccess(false)}
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
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#00F59B]" />
                    <span>Fazer Upgrade para Premium</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5 items-start">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 leading-tight">Assinatura Premium Ativa</h4>
                <p className="text-[11px] text-amber-800 mt-1 leading-normal">
                  Sua licença corporativa está ativa. Aproveite o acesso completo à biblioteca e exportações de relatórios.
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

          <div className="bg-slate-50 border border-slate-200/65 rounded-xl p-4 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Valor Estimado:</span>
            <span className="font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px]">
              Sob Consulta Corporativa
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
