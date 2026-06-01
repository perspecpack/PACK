import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  FileText, 
  Info, 
  ChevronRight, 
  CheckCircle2, 
  MessageSquare,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/src/context/AppContext';
import { cn } from '@/lib/utils';

type TabType = 'suporte' | 'termos' | 'sobre';

export default function Help() {
  const { user, profile, addSupportRequest, logPageAccess } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('suporte');

  // Support Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logPageAccess('Fornecedor - Ajuda');
  }, [logPageAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError('Por favor, informe o assunto.');
      return;
    }
    if (!category) {
      setError('Por favor, selecione uma categoria.');
      return;
    }
    if (!message.trim()) {
      setError('Por favor, digite sua mensagem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSupportRequest({
        user_id: user?.id || null,
        subject: subject.trim(),
        category: category,
        message: message.trim()
      });
      setSubmitSuccess(true);
      setSubject('');
      setCategory('');
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting support request:', err);
      setError('Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Central de Ajuda</h2>
        <p className="text-slate-500 text-sm">
          Acesse os documentos institucionais, consulte informações da plataforma ou fale com o suporte técnico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
          <button
            onClick={() => setActiveTab('suporte')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all",
              activeTab === 'suporte'
                ? "bg-[#06242c] text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <HelpCircle className={cn("w-4 h-4 shrink-0", activeTab === 'suporte' ? "text-[#00F59B]" : "text-slate-400")} />
            <span className="flex-1">Suporte Técnico</span>
            <ChevronRight className={cn("w-4 h-4 opacity-50", activeTab === 'suporte' ? "text-[#00F59B]" : "text-slate-400")} />
          </button>

          <button
            onClick={() => setActiveTab('termos')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all",
              activeTab === 'termos'
                ? "bg-[#06242c] text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <FileText className={cn("w-4 h-4 shrink-0", activeTab === 'termos' ? "text-[#00F59B]" : "text-slate-400")} />
            <span className="flex-1">Termos e Políticas</span>
            <ChevronRight className={cn("w-4 h-4 opacity-50", activeTab === 'termos' ? "text-[#00F59B]" : "text-slate-400")} />
          </button>

          <button
            onClick={() => setActiveTab('sobre')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all",
              activeTab === 'sobre'
                ? "bg-[#06242c] text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Info className={cn("w-4 h-4 shrink-0", activeTab === 'sobre' ? "text-[#00F59B]" : "text-slate-400")} />
            <span className="flex-1">Sobre a Plataforma</span>
            <ChevronRight className={cn("w-4 h-4 opacity-50", activeTab === 'sobre' ? "text-[#00F59B]" : "text-slate-400")} />
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm min-h-[350px]">
          
          {/* TAB 1: SUPORTE TÉCNICO */}
          {activeTab === 'suporte' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Suporte Técnico</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  Envie dúvidas, sugestões ou solicitações diretamente para a equipe responsável pela plataforma.
                </p>
              </div>

              {submitSuccess ? (
                <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl text-center space-y-4 py-8 animate-in fade-in duration-200">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="font-extrabold text-[15px] text-slate-800">Solicitação enviada com sucesso!</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Nossa equipe analisará sua solicitação e retornará em breve.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setSubmitSuccess(false)}
                    variant="outline" 
                    className="text-xs font-semibold h-9 px-4 rounded-lg"
                  >
                    Enviar Nova Mensagem
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Assunto</Label>
                    <Input 
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Resumo da sua solicitação"
                      className="h-10 text-xs rounded-lg border-slate-300 focus:ring-[#06242c] focus:border-[#06242c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Categoria</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#06242c] focus:border-[#06242c] shadow-sm"
                    >
                      <option value="">Selecione uma categoria...</option>
                      <option value="Dúvida Operacional">Dúvida Operacional</option>
                      <option value="Problema Técnico">Problema Técnico</option>
                      <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                      <option value="Solicitação Comercial">Solicitação Comercial</option>
                      <option value="Solicitação de Conteúdo">Solicitação de Conteúdo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Mensagem</Label>
                    <textarea
                      id="message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva detalhadamente sua dúvida, sugestão ou problema..."
                      className="w-full border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#06242c] focus:border-[#06242c] shadow-sm font-sans resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#06242c] hover:bg-teal-950 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar Solicitação</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: TERMOS E POLÍTICAS */}
          {activeTab === 'termos' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Termos e Políticas</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  Documentos institucionais e regulatórios da plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/ajuda/termos-de-uso"
                  className="group border border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-50/50 transition-all text-left shadow-sm min-h-[110px]"
                >
                  <span className="font-extrabold text-[14px] text-slate-800 group-hover:text-teal-650 transition-colors block">Termos de Uso</span>
                  <span className="text-slate-450 text-[11px] font-medium leading-relaxed block mt-1">Regras de uso, deveres e obrigações no portal.</span>
                  <span className="text-[10px] font-bold text-teal-600 hover:underline inline-flex items-center gap-0.5 mt-3">
                    Acessar documento &rarr;
                  </span>
                </Link>

                <Link
                  to="/ajuda/politica-de-privacidade"
                  className="group border border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-50/50 transition-all text-left shadow-sm min-h-[110px]"
                >
                  <span className="font-extrabold text-[14px] text-slate-800 group-hover:text-teal-650 transition-colors block">Política de Privacidade</span>
                  <span className="text-slate-450 text-[11px] font-medium leading-relaxed block mt-1">Como cuidamos da sua segurança e logs.</span>
                  <span className="text-[10px] font-bold text-teal-600 hover:underline inline-flex items-center gap-0.5 mt-3">
                    Acessar documento &rarr;
                  </span>
                </Link>

                <Link
                  to="/ajuda/licenciamento-de-conteudo"
                  className="group border border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-50/50 transition-all text-left shadow-sm min-h-[110px]"
                >
                  <span className="font-extrabold text-[14px] text-slate-800 group-hover:text-teal-650 transition-colors block">Licenciamento de Conteúdo</span>
                  <span className="text-slate-450 text-[11px] font-medium leading-relaxed block mt-1">Permissões de uso de arquivos CAD e normas.</span>
                  <span className="text-[10px] font-bold text-teal-600 hover:underline inline-flex items-center gap-0.5 mt-3">
                    Acessar documento &rarr;
                  </span>
                </Link>

                <Link
                  to="/ajuda/responsabilidade-tecnica"
                  className="group border border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-50/50 transition-all text-left shadow-sm min-h-[110px]"
                >
                  <span className="font-extrabold text-[14px] text-slate-800 group-hover:text-teal-650 transition-colors block">Responsabilidade Técnica</span>
                  <span className="text-slate-450 text-[11px] font-medium leading-relaxed block mt-1">Atribuições legais na aprovação de embalagens.</span>
                  <span className="text-[10px] font-bold text-teal-600 hover:underline inline-flex items-center gap-0.5 mt-3">
                    Acessar documento &rarr;
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: SOBRE A PLATAFORMA */}
          {activeTab === 'sobre' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Sobre a Plataforma</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  Visão institucional da ferramenta.
                </p>
              </div>

              <div className="space-y-4">
                <div className="font-sans text-[22px] tracking-wider leading-none select-none text-left border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-650">PERSPEC</span>
                  <span className="font-normal text-teal-500">PACK</span>
                </div>

                <div className="text-sm text-slate-650 leading-relaxed space-y-4">
                  <p>
                    Plataforma de conformidade para embalagens industriais desenvolvida para centralizar cadernos de encargos, componentes homologados, normas técnicas e checklists de validação utilizados no desenvolvimento de embalagens metálicas para a indústria.
                  </p>
                  <p>
                    O sistema permite que empresas consultem padrões técnicos, validem projetos de acordo com requisitos específicos de cada organização e gerem relatórios rastreáveis de conformidade, contribuindo para a redução de retrabalho, padronização de processos e aumento da qualidade dos projetos.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
