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
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp, SupportRequest } from '@/src/context/AppContext';
import { cn } from '@/lib/utils';

type TabType = 'suporte' | 'termos' | 'sobre';
type SupportSubTabType = 'novo' | 'acompanhar';

export default function Help() {
  const { user, profile, addSupportRequest, logPageAccess, supportRequests } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('suporte');
  const [supportSubTab, setSupportSubTab] = useState<SupportSubTabType>('novo');

  // Support Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded ticket ID state
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

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
      // Automatically switch to Acompanhar Chamados after 3 seconds or keep form but show success
      setTimeout(() => {
        setSubmitSuccess(false);
        setSupportSubTab('acompanhar');
      }, 3500);
    } catch (err: any) {
      console.error('Error submitting support request:', err);
      setError('Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requests to show only current user's tickets
  const myTickets = supportRequests.filter(r => r.user_id === user?.id);

  const getStatusBadge = (status: SupportRequest['status']) => {
    switch (status) {
      case 'novo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 border border-blue-200 text-blue-700">
            <Clock className="w-3 h-3" />
            <span>Pendente</span>
          </span>
        );
      case 'em_analise':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 border border-amber-200 text-amber-700">
            <AlertCircle className="w-3 h-3" />
            <span>Em Análise</span>
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 border border-purple-200 text-purple-700">
            <MessageSquare className="w-3 h-3" />
            <span>Respondido</span>
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            <span>Concluído</span>
          </span>
        );
      case 'arquivado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-600">
            <span>Arquivado</span>
          </span>
        );
    }
  };

  const toggleExpandTicket = (ticketId: string) => {
    setExpandedTicketId(prev => prev === ticketId ? null : ticketId);
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
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Header */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Suporte Técnico</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  Envie dúvidas, sugestões ou solicitações diretamente para a equipe responsável pela plataforma.
                </p>
              </div>

              {/* Sub Tabs */}
              <div className="flex border-b border-slate-100 pb-3 gap-6">
                <button
                  onClick={() => {
                    setSupportSubTab('novo');
                    setSubmitSuccess(false);
                    setError(null);
                  }}
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-1 transition-all border-b-2",
                    supportSubTab === 'novo'
                      ? "border-teal-650 text-teal-950"
                      : "border-transparent text-slate-400 hover:text-slate-650"
                  )}
                >
                  Novo Chamado
                </button>
                <button
                  onClick={() => {
                    setSupportSubTab('acompanhar');
                    setSubmitSuccess(false);
                    setError(null);
                  }}
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-1 transition-all border-b-2 flex items-center gap-1.5",
                    supportSubTab === 'acompanhar'
                      ? "border-teal-650 text-teal-950"
                      : "border-transparent text-slate-400 hover:text-slate-650"
                  )}
                >
                  <span>Acompanhar Chamados</span>
                  {myTickets.length > 0 && (
                    <span className="bg-teal-50 text-teal-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-teal-200">
                      {myTickets.length}
                    </span>
                  )}
                </button>
              </div>

              {/* SUB TAB: NOVO CHAMADO */}
              {supportSubTab === 'novo' && (
                <div className="space-y-4">
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
                      <span className="text-[10px] text-slate-400 font-semibold block animate-pulse">Redirecionando para acompanhamento...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
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
                        className="w-full bg-[#06242c] hover:bg-teal-950 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors animate-in fade-in"
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

              {/* SUB TAB: ACOMPANHAR CHAMADOS */}
              {supportSubTab === 'acompanhar' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {myTickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 italic text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Você ainda não abriu nenhuma solicitação de suporte técnico.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {myTickets.map(t => {
                        const isExpanded = expandedTicketId === t.id;
                        return (
                          <div 
                            key={t.id} 
                            className={cn(
                              "border rounded-2xl overflow-hidden transition-all shadow-sm bg-white",
                              isExpanded ? "border-teal-300 ring-1 ring-teal-300/30" : "border-slate-200 hover:border-slate-300"
                            )}
                          >
                            {/* Card Header (clickable to expand) */}
                            <div 
                              onClick={() => toggleExpandTicket(t.id)}
                              className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-teal-650 font-bold uppercase tracking-wider bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                                    {t.category}
                                  </span>
                                  {getStatusBadge(t.status)}
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 truncate pr-4">
                                  {t.subject}
                                </h4>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right hidden sm:block text-[10px] text-slate-400">
                                  <div className="font-bold flex items-center gap-1 justify-end">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                            </div>

                            {/* Card Body (Expanded view) */}
                            {isExpanded && (
                              <div className="p-4 border-t border-slate-100 bg-white space-y-4 text-xs animate-in slide-in-from-top-1 duration-150">
                                
                                {/* Original request */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-100 pb-1">
                                    <span className="font-bold uppercase">Minha Mensagem</span>
                                    <span>Enviado em: {new Date(t.created_at).toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {t.message}
                                  </div>
                                </div>

                                {/* Support reply */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <div className="flex justify-between items-center text-[10px] uppercase border-b border-slate-100 pb-1">
                                    <span className="font-bold text-teal-650">Equipe de Suporte PERSPECPACK</span>
                                    {t.responded_at && (
                                      <span className="text-slate-400">Respondido em: {new Date(t.responded_at).toLocaleString('pt-BR')}</span>
                                    )}
                                  </div>

                                  {t.response ? (
                                    <div className="bg-teal-50/20 border border-teal-100 p-4 rounded-xl text-teal-950 whitespace-pre-wrap leading-relaxed shadow-sm">
                                      {t.response}
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50/50 border border-dashed border-slate-200 p-4 rounded-xl text-slate-450 italic flex items-center justify-center gap-1.5 py-6">
                                      <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
                                      <span>Solicitação recebida. Aguardando retorno técnico.</span>
                                    </div>
                                  )}
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
