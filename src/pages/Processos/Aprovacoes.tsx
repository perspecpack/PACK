import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  Mail, 
  FileDown, 
  Trash2, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2,
  FolderOpen,
  Calendar,
  X,
  Loader2,
  FileText,
  UserCheck,
  History,
  ClipboardCopy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/src/context/AppContext';
import { generateEmailMessage, exportTXTFile, generateTXTComprovante, generatePDFReport, generateEmailHtml, buildApprovalReportData } from '@/src/utils/exportUtils';
import ApprovalDocumentRenderer from '@/src/components/processos/ApprovalDocumentRenderer';

interface Publication {
  id: string;
  process_id: string;
  organization: string;
  publication_code: string;
  version: number;
  public_token: string;
  snapshot: any;
  status: 'awaiting_validation' | 'validated' | 'revoked';
  primary_result: string | null;
  primary_result_type: string | null;
  published_at: string;
  validated_at: string | null;
  revoked_at: string | null;
  response?: any;
}

export default function Aprovacoes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { user } = useApp();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  
  // Drawer / Details Modal
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchPublications = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      // Fetch publications belonging to the user
      const { data, error } = await supabase
        .from('process_publications')
        .select('*')
        .order('published_at', { ascending: false });
        
      if (error) throw error;
      
      // Fetch responses for validated publications
      const pubList: Publication[] = data || [];
      const validatedPubIds = pubList.filter(p => p.status === 'validated').map(p => p.id);
      
      if (validatedPubIds.length > 0) {
        const { data: respData, error: respError } = await supabase
          .from('process_validation_responses')
          .select('*')
          .in('publication_id', validatedPubIds);
          
        if (respError) throw respError;
        
        // Map responses to their publications
        pubList.forEach(pub => {
          if (pub.status === 'validated') {
            const resp = respData?.find(r => r.publication_id === pub.id);
            pub.response = resp;
          }
        });
      }
      
      setPublications(pubList);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar o histórico de aprovações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPublications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleVisibilityAndFocus = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        fetchPublications();
      }
    };

    window.addEventListener('focus', handleVisibilityAndFocus);
    document.addEventListener('visibilitychange', handleVisibilityAndFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityAndFocus);
      document.removeEventListener('visibilitychange', handleVisibilityAndFocus);
    };
  }, [user]);

  // Actions
  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/validar/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link de validação copiado para a área de transferência!');
  };

  const handleCopyEmail = (pub: Publication) => {
    const url = `${window.location.origin}/validar/${pub.public_token}`;
    const emailBody = generateEmailMessage(
      pub.snapshot?.name || 'Processo de Aprovação',
      pub.organization || '',
      pub.publication_code,
      pub.version,
      url
    );
    navigator.clipboard.writeText(emailBody);
    toast.success('Mensagem de e-mail copiada!');
  };

  const handleCopyEmailHtml = async (pub: Publication) => {
    const url = `${window.location.origin}/validar/${pub.public_token}`;
    const companyBranding = {
      companyName: pub.snapshot?.company_name || pub.organization || 'PERSPECPACK',
      tradeName: pub.snapshot?.trade_name || pub.snapshot?.company_name || pub.organization || 'PERSPECPACK',
      companyLogoUrl: pub.snapshot?.company_logo_url || '',
      companyWebsite: pub.snapshot?.company_website || '',
      corporateEmail: pub.snapshot?.corporate_email || '',
      phone: pub.snapshot?.phone || '',
      shortDescription: pub.snapshot?.short_description || '',
      footerText: pub.snapshot?.footer_text || ''
    };

    const emailHtml = generateEmailHtml(pub, companyBranding, url);
    const emailText = generateEmailMessage(
      pub.snapshot?.name || 'Processo de Aprovação',
      pub.organization || '',
      pub.publication_code,
      pub.version,
      url
    );

    try {
      const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
      const textBlob = new Blob([emailText], { type: 'text/plain' });
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      await navigator.clipboard.write([clipboardItem]);
      toast.success('Formulário em HTML copiado para o e-mail (Outlook/Gmail)!');
    } catch (err) {
      console.error(err);
      navigator.clipboard.writeText(emailText);
      toast.warning('Copiado apenas como texto. Use um navegador atualizado para copiar com formatação.');
    }
  };

  const handleRevoke = async (pubId: string) => {
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
      fetchPublications();
      if (selectedPub?.id === pubId) {
        setSelectedPub(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao revogar publicação.');
    }
  };

  const handleDownloadAttachment = async (path: string, originalName: string) => {
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
      toast.success('Download iniciado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao baixar arquivo anexo.');
    }
  };

  const handleDownloadPDFReport = async (pub: Publication) => {
    if (!pub.response) return;
    if (pub.response.pdf_hash && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('validation-attachments')
          .download(`${pub.public_token}/report.pdf`);
        if (error) throw error;

        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Relatorio-Oficial-${pub.publication_code}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Download do PDF oficial concluído!');
      } catch (err) {
        console.error(err);
        toast.warning('Erro ao baixar PDF oficial do servidor. Gerando localmente...');
        generatePDFReport(pub, pub.response);
      }
    } else {
      generatePDFReport(pub, pub.response);
    }
  };

  const handleDownloadTXTReport = (pub: Publication) => {
    if (!pub.response) return;
    const txt = generateTXTComprovante(pub, pub.response);
    exportTXTFile(`Relatorio-${pub.response.protocol}.txt`, txt);
  };

  // Indicators Counts
  const countAwaiting = publications.filter(p => p.status === 'awaiting_validation').length;
  const countValidated = publications.filter(p => p.status === 'validated').length;
  
  const countApproved = publications.filter(p => {
    if (p.status !== 'validated') return false;
    const type = (p as any).primary_result_type || p.response?.primary_decision?.semanticType;
    return type === 'positive';
  }).length;
  
  const countRessalvas = publications.filter(p => {
    if (p.status !== 'validated') return false;
    const type = (p as any).primary_result_type || p.response?.primary_decision?.semanticType;
    return type === 'warning' || type === 'attention';
  }).length;
  
  const countReprovados = publications.filter(p => {
    if (p.status !== 'validated') return false;
    const type = (p as any).primary_result_type || p.response?.primary_decision?.semanticType;
    return type === 'negative';
  }).length;

  // Filter Logic
  const filteredPublications = publications.filter(pub => {
    const matchesSearch = 
      (pub.snapshot?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.publication_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pub.response?.protocol || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pub.response?.respondent_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pub.organization || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || pub.status === statusFilter;
    const matchesOrg = orgFilter === 'all' || pub.organization === orgFilter;
    
    return matchesSearch && matchesStatus && matchesOrg;
  });

  // Get unique organizations for filters
  const uniqueOrgs = Array.from(new Set(publications.map(p => p.organization).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#0d857a] animate-spin" />
        <span className="text-xs font-semibold text-slate-550">Carregando histórico de validações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-[#0d857a]" />
          Histórico de Validações
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe publicações enviadas, respostas recebidas e resultados das validações.
        </p>
      </div>

      {/* KPI Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-1 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Em Validação
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-slate-700">{countAwaiting}</span>
            <Clock className="w-5 h-5 text-amber-500 bg-amber-50 p-1 rounded-lg" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-1 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Concluídos
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-slate-700">{countValidated}</span>
            <CheckCircle2 className="w-5 h-5 text-teal-600 bg-teal-50 p-1 rounded-lg" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-1 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Aprovados
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-600">{countApproved}</span>
            <div className="h-5 w-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-extrabold text-xs">✓</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-1 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Com Ressalvas
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-amber-600">{countRessalvas}</span>
            <div className="h-5 w-5 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-extrabold text-xs">!</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-1 shadow-inner col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Alterações/Reprovados
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-red-500">{countReprovados}</span>
            <div className="h-5 w-5 bg-red-50 rounded-lg flex items-center justify-center text-red-500 font-extrabold text-xs">✗</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input 
            type="text"
            placeholder="Pesquisar por processo, código, protocolo ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9.5 border-slate-250 focus-visible:border-[#0d857a] focus-visible:ring-[#0d857a]/15 text-xs"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 border border-slate-200 rounded-lg px-2 text-xs bg-white text-slate-600 outline-none focus:border-[#0d857a]"
            >
              <option value="all">Todas Situações</option>
              <option value="awaiting_validation">Aguardando Validação</option>
              <option value="validated">Validado</option>
              <option value="revoked">Revogado</option>
            </select>
          </div>

          {uniqueOrgs.length > 0 && (
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="h-9 border border-slate-200 rounded-lg px-2 text-xs bg-white text-slate-600 outline-none focus:border-[#0d857a] max-w-[160px]"
            >
              <option value="all">Todas Empresas</option>
              {uniqueOrgs.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* TABLE LIST */}
      {filteredPublications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-450 text-xs shadow-xs">
          Nenhum registro de aprovação encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Processo</th>
                  <th className="p-4">Código / Versão</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Situação</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">Resultado</th>
                  <th className="p-4">Data Envio</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredPublications.map(pub => (
                  <tr key={pub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-800">{pub.snapshot?.name}</div>
                      {pub.snapshot?.category && (
                        <div className="text-[10px] text-slate-400 font-medium pt-0.5">{pub.snapshot.category}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{pub.publication_code}</div>
                      <div className="text-[9px] text-slate-400 font-medium pt-0.5">Versão {String(pub.version).padStart(2, '0')}</div>
                    </td>
                    <td className="p-4 text-slate-600 truncate max-w-[130px]">{pub.organization || '-'}</td>
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
                      {pub.status === 'validated' && pub.response ? (
                        <div>
                          <div>{pub.response.respondent_name}</div>
                          <div className="text-[9px] text-slate-400 font-medium pt-0.5">{pub.response.respondent_role}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium italic">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {pub.status === 'validated' && pub.primary_result ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg uppercase tracking-wide ${
                          pub.response?.primary_decision?.semanticType === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          pub.response?.primary_decision?.semanticType === 'attention' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                          pub.response?.primary_decision?.semanticType === 'negative' ? 'bg-red-50 text-red-800 border-red-100' :
                          'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {pub.primary_result}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium italic">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-450 font-medium">
                      {pub.status === 'validated' && pub.response ? (
                        new Date(pub.response.submitted_at).toLocaleDateString('pt-BR')
                      ) : (
                        new Date(pub.published_at).toLocaleDateString('pt-BR')
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Action */}
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
                              onClick={() => handleCopyLink(pub.public_token)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0d857a] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                              title="Copiar Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyEmail(pub)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0d857a] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                              title="Copiar E-mail"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyEmailHtml(pub)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0d857a] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                              title="Copiar Form. para E-mail"
                            >
                              <ClipboardCopy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRevoke(pub.id)}
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
                              onClick={() => handleDownloadPDFReport(pub)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                              title="Exportar PDF"
                            >
                              <FileDown className="w-4 h-4 text-[#0d857a]" />
                            </button>
                            <button
                              onClick={() => handleDownloadTXTReport(pub)}
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

      {/* DRAWER / DETAILS SLIDEOVER */}
      <AnimatePresence>
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
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-200 border border-slate-300 px-2 py-0.5 rounded">
                    {selectedPub.publication_code} - Versão {String(selectedPub.version).padStart(2, '0')}
                  </span>
                </div>
                
                <button
                  onClick={() => setSelectedPub(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {(() => {
                  const companyBranding = {
                    companyName: selectedPub.snapshot?.company_name || selectedPub.organization || 'PERSPECPACK',
                    tradeName: selectedPub.snapshot?.trade_name || selectedPub.snapshot?.company_name || selectedPub.organization || 'PERSPECPACK',
                    companyLogoUrl: selectedPub.snapshot?.company_logo_url || '',
                    companyWebsite: selectedPub.snapshot?.company_website || '',
                    corporateEmail: selectedPub.snapshot?.corporate_email || '',
                    phone: selectedPub.snapshot?.phone || '',
                    shortDescription: selectedPub.snapshot?.short_description || '',
                    footerText: selectedPub.snapshot?.footer_text || ''
                  };

                  const documentData = {
                    title: selectedPub.snapshot?.title || selectedPub.snapshot?.name || '',
                    client: selectedPub.snapshot?.client || '',
                    project: selectedPub.snapshot?.project || '',
                    code: selectedPub.snapshot?.code || '',
                    revision: selectedPub.snapshot?.revision || '',
                    responsible_internal: selectedPub.snapshot?.responsible_internal || '',
                    deadline: selectedPub.snapshot?.deadline || null,
                    description: selectedPub.snapshot?.description || '',
                    notes_for_client: selectedPub.snapshot?.notes_for_client || '',
                    status: selectedPub.status,
                    publication_code: selectedPub.publication_code,
                    version: selectedPub.version
                  };

                  const reportData = buildApprovalReportData(selectedPub, selectedPub.response);
                  const formattedAnswers = reportData.rendererAnswers;

                  return (
                    <ApprovalDocumentRenderer
                      mode={selectedPub.status === 'validated' ? 'read-only-result' : 'template-preview'}
                      companyBranding={companyBranding}
                      documentData={documentData}
                      blocks={selectedPub.snapshot?.blocks || []}
                      materials={selectedPub.snapshot?.materials || []}
                      answers={formattedAnswers}
                      respondentName={selectedPub.response?.respondent_name}
                      respondentRole={selectedPub.response?.respondent_role}
                      respondentEmail={selectedPub.response?.respondent_email}
                    />
                  );
                })()}
              </div>
              {/* Drawer Footer Actions */}
              <div className="p-4.5 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50">
                {selectedPub.status === 'awaiting_validation' && (
                  <>
                    <Button
                      onClick={() => handleRevoke(selectedPub.id)}
                      variant="destructive"
                      className="font-bold h-9 px-4 rounded-xl cursor-pointer shadow-xs text-xs"
                    >
                      Revogar Link
                    </Button>
                    <Button
                      onClick={() => handleCopyLink(selectedPub.public_token)}
                      className="bg-[#00F59B] hover:bg-[#00D485] text-slate-900 font-bold h-9 px-4 rounded-xl cursor-pointer border-0 text-xs shadow-xs"
                    >
                      Copiar Link
                    </Button>
                    <Button
                      onClick={() => handleCopyEmailHtml(selectedPub)}
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ClipboardCopy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Form. p/ E-mail</span>
                    </Button>
                  </>
                )}

                {selectedPub.status === 'validated' && (
                  <>
                    <Button
                      onClick={() => handleDownloadTXTReport(selectedPub)}
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Baixar TXT</span>
                    </Button>
                    <Button
                      onClick={() => handleDownloadPDFReport(selectedPub)}
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
