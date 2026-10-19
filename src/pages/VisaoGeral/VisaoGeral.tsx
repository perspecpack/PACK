import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  ArrowRight, 
  Search, 
  FileText, 
  ShieldCheck, 
  Plus, 
  Library, 
  History, 
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  HelpCircle,
  Calendar,
  User,
  FolderOpen,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp } from '@/src/context/AppContext';
import { supabase } from '@/lib/supabase';
import { findKnowledgeThumbnail } from '@/src/utils/pdfThumbnail';
import { DocumentEntry, StandardEntry, Organization } from '@/src/types';

interface AwaitingRequest {
  id: string;
  process_id: string;
  title: string;
  client: string;
  project: string;
  code: string;
  revision: string;
  responsible_internal: string;
  deadline: string | null;
  status: string;
  publication_code?: string;
  public_token?: string;
  publication_id?: string;
  published_at: string;
  days_elapsed: number;
}

interface RecentValidation {
  id: string;
  publication_code: string;
  title: string;
  client: string;
  project: string;
  validated_at: string;
  result_text: string;
  result_semantic: 'positive' | 'attention' | 'negative';
  responder_name?: string;
  protocol?: string;
}

export default function VisaoGeral() {
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    organizationUsage,
    refreshOrganizationUsage,
    organizations, 
    technicalAreas, 
    documents, 
    standards, 
    components, 
    knowledgeUnits, 
    logPageAccess 
  } = useApp();

  // Local state for approval statistics & lists
  const [loadingValidations, setLoadingValidations] = useState(true);
  const [awaitingRequests, setAwaitingRequests] = useState<AwaitingRequest[]>([]);
  const [recentValidations, setRecentValidations] = useState<RecentValidation[]>([]);
  const [averageResponseDays, setAverageResponseDays] = useState<number | null>(null);
  const [totalAwaitingCount, setTotalAwaitingCount] = useState<number>(0);
  const [countOver7Days, setCountOver7Days] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Log page access on mount
  useEffect(() => {
    logPageAccess('Fornecedor - Visão Geral');
  }, [logPageAccess]);

  // Current organization name for header
  const currentOrgName = useMemo(() => {
    if (user?.role === 'master') {
      return profile?.tradeName || profile?.companyName || 'Master Admin (PERSPECPACK)';
    }
    return profile?.tradeName || profile?.companyName || user?.companyName || 'Minha Organização';
  }, [user, profile]);

  // Commercial plan & emission usage calculations
  const isPremium = (organizationUsage?.plan === 'premium') || (profile?.planType === 'premium');
  const currentUsage = organizationUsage?.currentUsage ?? 0;
  const monthlyLimit = organizationUsage?.monthlyLimit ?? 20;
  const remaining = organizationUsage?.remaining ?? Math.max(0, monthlyLimit - currentUsage);
  const usagePercent = monthlyLimit > 0 ? Math.min(100, Math.round((currentUsage / monthlyLimit) * 100)) : 0;

  // Faixas de consumo do Plano Free
  const isLimitReached = !isPremium && (organizationUsage?.limitReached || currentUsage >= monthlyLimit);
  const isNearLimit = !isPremium && !isLimitReached && currentUsage >= 16;

  // Data de renovação mensal (1º dia do próximo mês no horário de Brasília)
  const renewalDateFormatted = useMemo(() => {
    if (organizationUsage?.periodEnd) {
      try {
        const d = new Date(organizationUsage.periodEnd);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            timeZone: 'America/Sao_Paulo' 
          });
        }
      } catch {
        // fallback
      }
    }
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }, [organizationUsage?.periodEnd]);

  // Fetch real validation data
  useEffect(() => {
    let isMounted = true;

    async function loadValidationData() {
      if (!supabase || !user) {
        if (isMounted) setLoadingValidations(false);
        return;
      }

      setLoadingValidations(true);

      try {
        // 1. Fetch published requests and their publications
        const { data: reqData, error: reqErr } = await supabase
          .from('process_requests')
          .select('*, processes(name), process_publications(id, public_token, status, publication_code, version, published_at, validated_at, snapshot)')
          .order('updated_at', { ascending: false });

        if (reqErr) throw reqErr;

        const now = Date.now();
        const pendingList: AwaitingRequest[] = [];

        (reqData || []).forEach((r: any) => {
          const pubs: any[] = Array.isArray(r.process_publications) ? r.process_publications : (r.process_publications ? [r.process_publications] : []);
          const activePub = pubs.find(p => p.status === 'awaiting_validation');

          if (activePub) {
            const pubDateStr = activePub.published_at || r.created_at;
            const pubDate = new Date(pubDateStr).getTime();
            const daysElapsed = Math.max(0, Math.floor((now - pubDate) / (1000 * 60 * 60 * 24)));

            pendingList.push({
              id: r.id,
              process_id: r.process_id,
              title: r.title || r.processes?.name || 'Solicitação de Validação',
              client: r.client || activePub.snapshot?.client || 'Cliente não informado',
              project: r.project || activePub.snapshot?.project || 'Projeto padrão',
              code: r.code || activePub.publication_code || 'S/N',
              revision: r.revision || '1.0',
              responsible_internal: r.responsible_internal || 'Engenharia',
              deadline: r.deadline,
              status: activePub.status,
              publication_code: activePub.publication_code,
              public_token: activePub.public_token,
              publication_id: activePub.id,
              published_at: pubDateStr,
              days_elapsed: daysElapsed
            });
          }
        });

        // Sort awaiting by longest elapsed time (prioridade para maior tempo decorrido)
        pendingList.sort((a, b) => b.days_elapsed - a.days_elapsed);

        // Count requests awaiting over 7 days
        const over7 = pendingList.filter(item => item.days_elapsed > 7).length;

        // 2. Fetch completed/validated publications for response time calculation & recent returns
        const { data: pubData, error: pubErr } = await supabase
          .from('process_publications')
          .select('*')
          .eq('status', 'validated')
          .order('validated_at', { ascending: false })
          .limit(30);

        if (pubErr) throw pubErr;

        const validPubs: any[] = pubData || [];
        
        // Calculate average response time (published_at -> validated_at)
        const validDeltas: number[] = [];
        validPubs.forEach(p => {
          if (p.published_at && p.validated_at) {
            const start = new Date(p.published_at).getTime();
            const end = new Date(p.validated_at).getTime();
            if (!isNaN(start) && !isNaN(end) && end >= start) {
              const days = (end - start) / (1000 * 60 * 60 * 24);
              validDeltas.push(days);
            }
          }
        });

        const avgDays = validDeltas.length > 0 
          ? (validDeltas.reduce((acc, curr) => acc + curr, 0) / validDeltas.length) 
          : null;

        // Fetch validation records for top 3 validated items
        const top3Pubs = validPubs.slice(0, 3);
        let recentMapped: RecentValidation[] = [];

        if (top3Pubs.length > 0) {
          const pubIds = top3Pubs.map(p => p.id);
          const { data: recordsData } = await supabase
            .from('validation_records')
            .select('*')
            .in('publication_id', pubIds);

          recentMapped = top3Pubs.map(p => {
            const rec = recordsData?.find((r: any) => r.publication_id === p.id);
            const resultStr = rec?.final_result || p.primary_result || 'Validado';
            
            let semantic: 'positive' | 'attention' | 'negative' = 'positive';
            if (resultStr.toLowerCase().includes('ressalva')) {
              semantic = 'attention';
            } else if (resultStr.toLowerCase().includes('reprovado') || resultStr.toLowerCase().includes('recusado')) {
              semantic = 'negative';
            }

            return {
              id: p.id,
              publication_code: p.publication_code,
              title: p.snapshot?.title || p.snapshot?.processes?.name || 'Validação de Processo',
              client: p.snapshot?.client || 'Cliente',
              project: p.snapshot?.project || 'Geral',
              validated_at: p.validated_at || rec?.responded_at || p.published_at,
              result_text: resultStr,
              result_semantic: semantic,
              responder_name: rec?.responder_name,
              protocol: rec?.protocol
            };
          });
        }

        if (isMounted) {
          setAwaitingRequests(pendingList.slice(0, 5));
          setTotalAwaitingCount(pendingList.length);
          setCountOver7Days(over7);
          setAverageResponseDays(avgDays);
          setRecentValidations(recentMapped);
          setLoadingValidations(false);
        }
      } catch (err: any) {
        console.error('[Visão Geral] Erro ao carregar validações:', err);
        if (isMounted) {
          setLoadingValidations(false);
        }
      }
    }

    loadValidationData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Combine and sort recent technical documents & standards (up to 5)
  const recentTechnicalDocuments = useMemo(() => {
    const combined: Array<{
      id: string;
      title: string;
      organizationId: string;
      technicalAreaId?: string;
      type: string;
      revision: string;
      date: string;
      isPublishedDate: boolean;
      fileUrl?: string;
      fileHash?: string;
      fileName?: string;
      thumbnailUrl?: string;
      category: 'document' | 'standard';
    }> = [];

    // Documents (Cadernos de Encargos, Manuais, etc.)
    documents
      .filter(d => d.status === 'active' || d.status === 'vigente')
      .forEach(d => {
        combined.push({
          id: d.id,
          title: d.title,
          organizationId: d.organizationId,
          technicalAreaId: d.technicalAreaId,
          type: d.documentType,
          revision: d.revision,
          date: d.publishedAt || d.updatedAt || d.createdAt,
          isPublishedDate: Boolean(d.publishedAt),
          fileUrl: d.fileUrl,
          fileHash: d.fileHash,
          fileName: d.fileName,
          thumbnailUrl: (d as any).thumbnailUrl,
          category: 'document'
        });
      });

    // Standards (Normas, Diretrizes Técnicas)
    standards
      .filter(s => s.status === 'active' || s.status === 'vigente')
      .forEach(s => {
        combined.push({
          id: s.id,
          title: s.title,
          organizationId: s.organizationId,
          technicalAreaId: s.technicalAreaId,
          type: s.standardType || 'Norma',
          revision: s.revision,
          date: s.publishedAt || s.updatedAt || s.createdAt,
          isPublishedDate: Boolean(s.publishedAt),
          fileUrl: s.fileUrl,
          fileHash: s.fileHash,
          fileName: s.fileName,
          thumbnailUrl: (s as any).thumbnailUrl,
          category: 'standard'
        });
      });

    // Sort by most recent date
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combined.slice(0, 5);
  }, [documents, standards]);

  // Active organizations list with counts
  const availableOrganizations = useMemo(() => {
    return organizations
      .filter(o => o.status === 'active')
      .map(org => {
        const docCount = documents.filter(d => d.organizationId === org.id && (d.status === 'active' || d.status === 'vigente')).length;
        const stdCount = standards.filter(s => s.organizationId === org.id && (s.status === 'active' || s.status === 'vigente')).length;
        const compCount = components.filter(c => c.organizationId === org.id && (c.status === 'active' || c.status === 'vigente')).length;
        return {
          ...org,
          totalStandards: docCount + stdCount + compCount,
          docCount,
          stdCount,
          compCount
        };
      })
      .sort((a, b) => b.totalStandards - a.totalStandards);
  }, [organizations, documents, standards, components]);

  // Handle Quick Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/app/padroes', { state: { initialSearch: searchQuery.trim() } });
    } else {
      navigate('/app/padroes');
    }
  };

  // Helper formatting dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-full pb-16 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ============================================================ */}
        {/* BLOCO A — CABEÇALHO */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Visão Geral
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-700">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Painel Operacional
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                Acompanhe suas validações e acesse as referências técnicas da sua organização.
              </p>
            </div>

            {/* Discreet Organization Pill */}
            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                <div className="w-7 h-7 rounded-lg bg-teal-600/10 border border-teal-600/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Organização Ativa
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[190px] mt-0.5">
                    {currentOrgName}
                  </span>
                </div>
                {profile?.planType && (
                  <span className="ml-1 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase bg-white border border-slate-200 text-slate-600">
                    {profile.planType}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Access Bar (Seção 6 - Acessos Rápidos) */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Acessos rápidos:
            </span>
            <Button
              onClick={() => navigate('/app/aprovacoes')}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-700 text-xs font-bold rounded-xl h-8 gap-1.5 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Nova Aprovação</span>
            </Button>
            <Button
              onClick={() => navigate('/app/modelos')}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl h-8 gap-1.5 shadow-2xs transition-all"
            >
              <Library className="w-3.5 h-3.5 text-slate-500" />
              <span>Biblioteca de Modelos</span>
            </Button>
            <Button
              onClick={() => navigate('/app/validacoes')}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl h-8 gap-1.5 shadow-2xs transition-all"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Histórico de Validações</span>
            </Button>
            <Button
              onClick={() => navigate('/app/padroes')}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl h-8 gap-1.5 shadow-2xs transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Padrões das Organizações</span>
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BLOCO B — GESTÃO DE VALIDAÇÕES */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" />
                <span>Validações de Projetos e Produtos</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Acompanhe solicitações enviadas, identifique pendências e consulte os retornos dos clientes.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/validacoes')}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-teal-650 hover:text-teal-750 self-start sm:self-auto gap-1 px-2.5"
            >
              <span>Ver Histórico Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* ============================================================ */}
          {/* BLOCO COMERCIAL-INFORMATIVO DE DESTAQUE — PLANO & CONSUMO     */}
          {/* ============================================================ */}
          {!isPremium ? (
            <div 
              className={cn(
                "w-full rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all shadow-xs relative overflow-hidden",
                isLimitReached 
                  ? "bg-gradient-to-br from-red-50/80 via-white to-red-50/30 border-red-200/90 hover:border-red-300" 
                  : isNearLimit 
                  ? "bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-200/90 hover:border-amber-300" 
                  : "bg-gradient-to-br from-slate-50/80 via-white to-teal-50/40 border-slate-200/90 hover:border-teal-300/80"
              )}
            >
              {/* Sutil brilho decorativo de fundo */}
              <div 
                className={cn(
                  "absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40",
                  isLimitReached ? "bg-red-200" : isNearLimit ? "bg-amber-200" : "bg-teal-200"
                )} 
              />

              <div className="relative z-10 flex flex-col gap-5">
                {/* Cabeçalho do Bloco: Badge do Plano + Título + Ações */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100/90">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "px-2.5 py-1 text-xs font-black tracking-wide uppercase rounded-lg border shadow-2xs",
                        isLimitReached
                          ? "bg-red-100 text-red-800 border-red-300"
                          : isNearLimit
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-teal-50 text-teal-800 border-teal-200"
                      )}
                    >
                      Plano Free
                    </Badge>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <span>Emissões neste mês</span>
                      <span className="text-xs font-medium text-slate-400">
                        (Limite de 20 por mês)
                      </span>
                    </h3>
                  </div>

                  {/* Ações discretas e elegantes */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <Button
                      onClick={() => navigate('/app/meu-plano')}
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-slate-600 hover:text-teal-700 hover:bg-white/90 border border-slate-200/80 px-3 py-1.5 rounded-xl h-8 gap-1.5 transition-all shadow-2xs"
                    >
                      <span>Ver detalhes do plano</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      onClick={() => navigate('/app/meu-plano')}
                      size="sm"
                      className={cn(
                        "text-xs font-bold px-3.5 py-1.5 rounded-xl h-8 gap-1.5 transition-all shadow-xs",
                        isLimitReached
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : isNearLimit
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isLimitReached ? 'Ativar Premium' : 'Conhecer Premium'}</span>
                    </Button>
                  </div>
                </div>

                {/* Conteúdo Central: Indicador numérico em destaque + Barra de progresso */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  
                  {/* Lado Esquerdo (6 colunas): Métrica Principal e Mensagem Contextual */}
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {currentUsage} de {monthlyLimit}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-500">
                        emissões utilizadas
                      </span>
                      <span 
                        className={cn(
                          "text-xs font-extrabold px-2 py-0.5 rounded-md border",
                          isLimitReached
                            ? "bg-red-100 text-red-800 border-red-200"
                            : isNearLimit
                            ? "bg-amber-100 text-amber-900 border-amber-200"
                            : "bg-teal-50 text-teal-800 border-teal-200"
                        )}
                      >
                        {usagePercent}%
                      </span>
                    </div>

                    {/* Mensagem educativa e sem tom agressivo */}
                    {isLimitReached ? (
                      <div className="flex items-start gap-2 pt-1 text-xs sm:text-sm text-red-700 font-semibold leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                        <span>
                          Você utilizou as 20 emissões gratuitas deste mês. Novas publicações estarão disponíveis no próximo período ou com a ativação do Premium.
                        </span>
                      </div>
                    ) : isNearLimit ? (
                      <div className="flex items-start gap-2 pt-1 text-xs sm:text-sm text-amber-800 font-semibold leading-relaxed">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>
                          Atenção: sua organização está próxima do limite mensal. Restam apenas <strong>{remaining} {remaining === 1 ? 'emissão' : 'emissões'}</strong> neste mês.
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Sua organização pode publicar até <strong className="text-slate-800 font-bold">20 formulários por mês</strong> no Plano Free.
                        {' '}Você já utilizou <strong className="text-slate-800 font-bold">{currentUsage} de {monthlyLimit} emissões</strong> neste período.
                        {' '}Restam <strong className="text-teal-700 font-bold">{remaining} {remaining === 1 ? 'emissão' : 'emissões'}</strong> até a renovação no próximo mês.
                      </p>
                    )}
                  </div>

                  {/* Lado Direito (6 colunas): Barra de Progresso + Metadados de Renovação */}
                  <div className="lg:col-span-6 space-y-3 bg-white/80 border border-slate-200/80 rounded-xl p-4 sm:p-4.5 shadow-2xs backdrop-blur-2xs">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Consumo da Franquia Mensal</span>
                      <span 
                        className={cn(
                          "font-extrabold",
                          isLimitReached ? "text-red-600" : isNearLimit ? "text-amber-700" : "text-teal-700"
                        )}
                      >
                        {currentUsage} / {monthlyLimit} ({usagePercent}%)
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80 p-0.5">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700 shadow-2xs",
                          isLimitReached 
                            ? "bg-red-500" 
                            : isNearLimit 
                            ? "bg-amber-500" 
                            : "bg-teal-600"
                        )}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>

                    {/* Metadados Complementares: Restante e Data de Renovação */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span 
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isLimitReached ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-teal-500"
                          )} 
                        />
                        {isLimitReached ? (
                          <strong className="text-red-700 font-bold">0 emissões restantes</strong>
                        ) : (
                          <>Restam <strong className="text-slate-800 font-bold">{remaining} {remaining === 1 ? 'emissão' : 'emissões'}</strong> neste mês</>
                        )}
                      </span>

                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Renovação em {renewalDateFormatted}, horário de Brasília
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* BLOCO DO PLANO PREMIUM — SIMPLIFICADO E ELEGANTE             */
            /* ============================================================ */
            <div className="w-full rounded-2xl sm:rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 bg-emerald-200" />
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className="bg-emerald-100 text-emerald-900 border-emerald-300 px-2.5 py-0.5 text-xs font-black tracking-wide uppercase rounded-lg shadow-2xs"
                      >
                        Plano Premium
                      </Badge>
                      <span className="text-xs font-bold text-slate-400">• Emissões neste mês</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                        Emissões ilimitadas
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Sua organização possui plano Premium ativo. Franquia corporativa liberada para publicação contínua de formulários.
                    </p>
                  </div>
                </div>

                <div className="self-start sm:self-auto shrink-0">
                  <Button
                    onClick={() => navigate('/app/meu-plano')}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white hover:bg-emerald-50/60 border-emerald-300 px-3.5 py-2 rounded-xl h-9 gap-1.5 shadow-2xs transition-all"
                  >
                    <span>Ver detalhes do plano</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Metric Cards (Operacionais — 3 Colunas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* 4.1 Total Aguardando */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">
                    Total em validação
                  </span>
                  <div className="flex items-baseline gap-2">
                    {loadingValidations ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
                    ) : (
                      <span className="text-3xl font-black text-slate-800">
                        {totalAwaitingCount}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">ativas</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-650">
                  Solicitações publicadas atualmente.
                </p>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Disponíveis para conferência e assinatura de clientes.
                </span>
              </div>
            </div>

            {/* 4.2 Indicador — Aguardando acompanhamento (> 7 dias) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">
                    Aguardando há mais de 7 dias
                  </span>
                  <div className="flex items-baseline gap-2">
                    {loadingValidations ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
                    ) : (
                      <span className={`text-3xl font-black ${countOver7Days > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {countOver7Days}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">solicitações</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-650">
                  Solicitações sem retorno recente.
                </p>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Critério de atenção operacional (mais de 7 dias de envio).
                </span>
              </div>
            </div>

            {/* 4.3 Indicador — Tempo médio de resposta */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">
                    Tempo médio de resposta
                  </span>
                  <div className="flex items-baseline gap-2">
                    {loadingValidations ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
                    ) : averageResponseDays !== null ? (
                      <span className="text-3xl font-black text-teal-700">
                        {averageResponseDays.toFixed(1)}
                        <span className="text-sm font-bold text-teal-600 ml-1">dias</span>
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-slate-400 mt-1">
                        Indisponível
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-650">
                  {averageResponseDays !== null 
                    ? 'Intervalo entre envio e primeira resposta.' 
                    : 'Aguardando validações com datas registradas.'}
                </p>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Média calculada sobre retornos formalmente concluídos.
                </span>
              </div>
            </div>

          </div>

          {/* Lists Grid (Solicitações que precisam de acompanhamento + Últimos retornos) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* 4.3 Solicitações que precisam de acompanhamento (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Solicitações que precisam de acompanhamento</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Priorizadas pelo maior tempo decorrido desde o envio.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/app/aprovacoes')}
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 h-8"
                  >
                    Ver todas ({totalAwaitingCount})
                  </Button>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100 mt-2">
                  {loadingValidations ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      <span className="text-xs font-semibold">Carregando solicitações...</span>
                    </div>
                  ) : awaitingRequests.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        Nenhuma solicitação pendente no momento.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Todas as solicitações enviadas já foram respondidas ou estão salvas em rascunho.
                      </p>
                    </div>
                  ) : (
                    awaitingRequests.map(item => (
                      <div 
                        key={item.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2.5 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => navigate('/app/aprovacoes')}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-850 group-hover:text-teal-600 transition-colors truncate max-w-sm">
                              {item.title}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {item.publication_code || item.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-450 flex-wrap">
                            <span className="flex items-center gap-1 truncate max-w-[160px]">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-600 font-semibold">{item.client}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                              <Calendar className="w-3 h-3" />
                              Enviado: {formatDate(item.published_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                          <Badge className={
                            item.days_elapsed > 7
                              ? 'bg-amber-50 text-amber-700 border-amber-300 font-mono text-[10px]'
                              : 'bg-slate-100 text-slate-650 border-slate-200 font-mono text-[10px]'
                          }>
                            {item.days_elapsed === 0 
                              ? 'Enviado hoje' 
                              : `${item.days_elapsed} ${item.days_elapsed === 1 ? 'dia' : 'dias'}`}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-teal-600 hover:text-teal-750 hover:bg-teal-50 text-xs font-bold gap-1 rounded-lg"
                          >
                            <span>Acompanhar</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {awaitingRequests.length > 0 && (
                <div className="pt-3 border-t border-slate-100 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Exibindo até 5 solicitações com maior tempo sem resposta.</span>
                  <span className="font-semibold text-slate-500">Total: {totalAwaitingCount}</span>
                </div>
              )}
            </div>

            {/* 4.4 Últimos retornos recebidos (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Últimos retornos recebidos</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Validações recentemente respondidas pelos clientes.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {loadingValidations ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      <span className="text-xs font-semibold">Carregando retornos...</span>
                    </div>
                  ) : recentValidations.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <History className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        Nenhum retorno recebido recentemente.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Quando um cliente responder a um formulário público, o resultado aparecerá aqui.
                      </p>
                    </div>
                  ) : (
                    recentValidations.map(val => (
                      <div 
                        key={val.id}
                        className="py-3.5 space-y-2 hover:bg-slate-50/60 p-2.5 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => navigate(`/app/validacoes?search=${encodeURIComponent(val.publication_code || val.title)}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-slate-850 group-hover:text-teal-600 transition-colors line-clamp-1">
                            {val.title}
                          </h4>
                          <Badge className={
                            val.result_semantic === 'positive'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 font-bold text-[10px] shrink-0'
                              : val.result_semantic === 'attention'
                              ? 'bg-amber-50 text-amber-700 border-amber-250 font-bold text-[10px] shrink-0'
                              : 'bg-rose-50 text-rose-700 border-rose-250 font-bold text-[10px] shrink-0'
                          }>
                            {val.result_text}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-450 pt-0.5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                              {val.client}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {val.publication_code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatDate(val.validated_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3">
                <Button
                  onClick={() => navigate('/app/validacoes')}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-bold text-slate-650 hover:text-teal-700 hover:bg-teal-50/50 hover:border-teal-200 rounded-xl gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Consultar Histórico Completo</span>
                </Button>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* BLOCO C — DOCUMENTAÇÃO E REFERÊNCIAS TÉCNICAS */}
        {/* ============================================================ */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span>Documentação e Referências Técnicas</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Encontre normas, componentes e documentos utilizados como referência no desenvolvimento de projetos e produtos.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/padroes')}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-teal-650 hover:text-teal-750 self-start sm:self-auto gap-1 px-2.5"
            >
              <span>Explorar Todos os Padrões</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* 5.1 Pesquisa Técnica Rápida */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-[#06242c] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#00F59B_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="max-w-3xl space-y-4 relative z-10">
              <div className="space-y-1">
                <span className="text-[10.5px] font-mono uppercase tracking-widest text-emerald-400 font-extrabold">
                  PESQUISA DIRETA NO ACERVO
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Localize diretrizes, cadernos e normas homologadas
                </h3>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar normas, documentos, componentes ou referências técnicas..."
                    className="w-full pl-10 pr-4 h-11 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-300 focus:placeholder:text-slate-400 border-white/20 focus:border-teal-400 rounded-2xl text-xs sm:text-sm font-medium transition-all"
                  />
                </div>
                <Button 
                  type="submit"
                  className="h-11 px-6 bg-[#00F59B] hover:bg-[#00D485] text-teal-950 font-black rounded-2xl text-xs tracking-wide transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  <span>Pesquisar</span>
                </Button>
              </form>

              {/* Quick Suggestions / Filter tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-300 text-[11px] font-semibold">Sugestões rápidas:</span>
                {[
                  'Caderno de Encargos',
                  'Norma de Empilhamento',
                  'Diretriz de AGV',
                  'Ergonomia',
                  'Skid'
                ].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate('/app/padroes', { state: { initialSearch: tag } })}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-[11px] font-medium transition-colors border border-white/10 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid: 5.2 Documentos Recentes + 5.3 Organizações com Referências */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 5.2 Documentos Recentes (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Documentos e Padrões Recentes</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Últimos documentos técnicos disponibilizados ou atualizados.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/app/padroes')}
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 h-8"
                  >
                    Ver acervo
                  </Button>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {recentTechnicalDocuments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        Nenhum documento disponível no momento.
                      </p>
                    </div>
                  ) : (
                    recentTechnicalDocuments.map(doc => {
                      const orgName = organizations.find(o => o.id === doc.organizationId)?.name || 'Organização';
                      const areaName = technicalAreas.find(a => a.id === doc.technicalAreaId)?.name || 'Geral';
                      const thumb = findKnowledgeThumbnail(doc, knowledgeUnits);

                      return (
                        <div
                          key={doc.id}
                          onClick={() => navigate('/app/padroes', { state: { selectedOrgId: doc.organizationId, initialSearch: doc.title } })}
                          className="py-3.5 flex items-center gap-4 hover:bg-slate-50/70 p-2.5 rounded-2xl transition-all cursor-pointer group"
                        >
                          {/* Real WebP Thumbnail Preview with Fallback */}
                          <div className="w-12 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={doc.title}
                                loading="lazy"
                                className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.thumb-fallback') as HTMLElement | null;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`thumb-fallback ${thumb ? 'hidden' : 'flex'} w-full h-full items-center justify-center ${doc.category === 'standard' ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-600'}`}>
                              {doc.category === 'standard' ? (
                                <ShieldCheck className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs text-slate-850 group-hover:text-teal-600 transition-colors truncate">
                                {doc.title}
                              </h4>
                              <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-650 border border-slate-200 shrink-0">
                                REV {doc.revision}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-450 flex-wrap">
                              <span className="font-semibold text-slate-700">{orgName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">{areaName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {doc.isPublishedDate ? 'Publicado em' : 'Atualizado em'} {formatDate(doc.date)}
                              </span>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 rounded-xl transition-all"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Padrões indexados na base técnica oficial.</span>
                <span className="font-bold text-teal-650 hover:underline cursor-pointer" onClick={() => navigate('/app/padroes')}>
                  Acessar Acervo Completo →
                </span>
              </div>
            </div>

            {/* 5.3 Organizações com referências disponíveis (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>Organizações Disponíveis</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Padrões técnicos e diretrizes que você possui autorização para consultar.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {availableOrganizations.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      Nenhuma organização disponível para consulta.
                    </div>
                  ) : (
                    availableOrganizations.map(org => {
                      // Initials
                      const initials = org.name.substring(0, 2).toUpperCase();
                      return (
                        <div
                          key={org.id}
                          onClick={() => navigate('/app/padroes', { state: { selectedOrgId: org.id } })}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2.5 rounded-2xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shadow-2xs group-hover:border-teal-400 group-hover:text-teal-700 transition-colors shrink-0">
                              {initials}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="font-bold text-xs text-slate-850 group-hover:text-teal-600 transition-colors truncate">
                                {org.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                {org.organizationType === 'oem' ? 'Montadora OEM' : 'Fabricante de Componentes'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[10px] font-bold">
                              {org.totalStandards} {org.totalStandards === 1 ? 'padrão' : 'padrões'}
                            </Badge>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-350 group-hover:text-teal-600 transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 text-[10px] text-slate-400">
                Clique sobre uma organização para abrir suas normas e diretrizes.
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
