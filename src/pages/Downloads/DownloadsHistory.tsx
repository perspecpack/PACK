import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  FileText, 
  Building2, 
  Layers, 
  ShieldCheck, 
  X,
  History,
  Sparkles,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function DownloadsHistory() {
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    downloadsLog, 
    organizations, 
    components, 
    documents, 
    standards, 
    checklists, 
    logPageAccess 
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

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

  const [checklistExecutions, setChecklistExecutions] = useState<any[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  const isPremium = profile?.planType === 'premium' || user?.role === 'master';

  React.useEffect(() => {
    logPageAccess('Fornecedor - Histórico de Downloads');
  }, [logPageAccess]);

  React.useEffect(() => {
    if (isRequestModalOpen && profile) {
      setContactName(profile.fullName || '');
      setCompanyName(profile.companyName || '');
      setPhone(profile.phone || '');
      setEmail(profile.corporateEmail || '');
    }
  }, [profile, isRequestModalOpen]);

  React.useEffect(() => {
    async function fetchChecklistExecutions() {
      if (!supabase || !user?.email) return;
      setLoadingChecklists(true);
      try {
        const { data, error } = await supabase
          .from('checklist_executions')
          .select('*')
          .eq('user_id', user.email)
          .order('generated_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setChecklistExecutions(data);
        }
      } catch (err) {
        console.error('Error fetching checklist executions:', err);
      } finally {
        setLoadingChecklists(false);
      }
    }

    if (isPremium) {
      fetchChecklistExecutions();
    }
  }, [user, isPremium]);

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

  const userLogs = downloadsLog.filter(log => log.user_id === user?.email);

  const getDownloadUrl = (type: string, contentId: string) => {
    const t = type.toLowerCase();
    if (t.includes('component')) {
      const comp = components?.find(c => c.id === contentId);
      if (!comp) return null;
      if (t.includes('step')) return comp.stepFileUrl;
      if (t.includes('pdf')) return comp.pdfFileUrl;
      if (t.includes('dwg')) return comp.dwgFileUrl;
      return null;
    }
    if (t.includes('caderno') || t.includes('encargo')) {
      const doc = documents?.find(d => d.id === contentId);
      return doc?.fileUrl || null;
    }
    if (t.includes('norma') || t.includes('padrão') || t.includes('documentação')) {
      const std = standards?.find(s => s.id === contentId);
      return std?.fileUrl || null;
    }
    return null;
  };

  const unifiedList = [
    ...userLogs.map(log => ({
      id: log.id,
      date: log.download_date,
      name: log.file_name,
      type: log.content_type,
      organizationId: log.organization_id,
      isChecklist: false,
      contentId: log.content_id,
      fileUrl: getDownloadUrl(log.content_type, log.content_id),
    })),
    ...checklistExecutions.map(exec => {
      const checklistName = checklists?.find(c => c.id === exec.checklist_id)?.name || 'Checklist de Validação';
      const fileName = exec.pdf_url ? decodeURIComponent(exec.pdf_url.split('/').pop() || '') : `Relatorio_Conformidade_${checklistName.replace(/\s+/g, '_')}_${exec.validation_code}.pdf`;
      return {
        id: exec.id,
        date: exec.generated_at,
        name: fileName,
        type: `Checklist (${exec.report_status || 'Auditoria'})`,
        organizationId: exec.organization_id,
        isChecklist: true,
        contentId: exec.checklist_id,
        fileUrl: exec.pdf_url,
      };
    })
  ];

  const filteredList = unifiedList.filter(item => {
    const name = item.name?.toLowerCase() || '';
    const type = item.type?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return name.includes(term) || type.includes(term);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getOrgName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || 'N/A';
  };

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('checklist')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (t.includes('step') || t.includes('component')) return <Layers className="w-4 h-4 text-indigo-500" />;
    if (t.includes('norma') || t.includes('padrão')) return <ShieldCheck className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-teal-500" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
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
        <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Histórico de Downloads</h2>
        <p className="text-slate-500 text-sm">
          Acesse a lista completa de arquivos e padrões técnicos baixados por sua conta.
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

      {!isPremium ? (
        /* Paywall View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto space-y-6 my-4">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-550 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <History className="w-8 h-8 text-amber-600" />
          </div>
          
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-extrabold text-slate-900">Histórico de Downloads é um recurso Premium</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Como usuário do plano gratuito, você pode navegar no portal e realizar downloads básicos.
              O histórico completo de downloads e auditoria está disponível exclusivamente no plano Premium.
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 text-left space-y-3.5 max-w-lg mx-auto">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Benefícios do Plano Premium:</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <p className="text-slate-655"><strong className="text-slate-805">Rastreabilidade Completa:</strong> Acesse todas as datas, arquivos e organizações das normas baixadas.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <p className="text-slate-655"><strong className="text-slate-805">Arquivos 3D STEP e Vetoriais:</strong> Habilite downloads ilimitados de componentes e CAD.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <p className="text-slate-655"><strong className="text-slate-805">Checklists e Laudos:</strong> Crie, execute e exporte checklists de validação OEM.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full sm:w-auto bg-teal-650 hover:bg-teal-750 text-white font-bold h-11 px-6 text-xs rounded-xl flex items-center justify-center gap-2 shadow-md animate-none"
            >
              <Sparkles className="w-4 h-4 text-[#00F59B]" />
              <span>Solicitar Plano Premium</span>
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full sm:w-auto bg-white border-slate-255 hover:border-slate-355 text-slate-700 font-bold h-11 px-6 text-xs rounded-xl animate-none"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      ) : (
        /* Normal Table View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-150">
          {/* Header Filter */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Pesquisar por nome de arquivo ou tipo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 shadow-sm animate-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {loadingChecklists ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Atualizando laudos...</span>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Total de Itens: {unifiedList.length}
              </span>
            )}
          </div>

          {/* Table / List */}
          {filteredList.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-3 font-medium">
              <div className="w-14 h-14 bg-slate-100 border border-slate-200/80 rounded-full flex items-center justify-center mx-auto shadow-inner text-slate-400">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Nenhum registro encontrado</p>
                <p className="text-xs text-slate-400">Tente buscar por termos diferentes ou realize downloads no catálogo.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-[10.5px] font-bold text-slate-550 uppercase tracking-wider select-none">
                    <th className="py-4 px-6">Data</th>
                    <th className="py-4 px-6">Arquivo</th>
                    <th className="py-4 px-6">Tipo</th>
                    <th className="py-4 px-6">Organização</th>
                    <th className="py-4 px-6 text-right pr-8">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-500 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800 break-all max-w-xs">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-650 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
                          {getIcon(item.type)}
                          <span>{item.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          <Building2 className="w-3 h-3 text-teal-600" />
                          <span>{getOrgName(item.organizationId)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right pr-8">
                        {item.fileUrl ? (
                          <a 
                            href={item.fileUrl}
                            target="_blank" 
                            rel="noreferrer"
                            download={item.name}
                            className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-600" />
                            <span>Baixar</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            Indisponível
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Request Upgrade Modal */}
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
                    className="h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 animate-none"
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
                    className="h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 animate-none"
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
                      className="h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 animate-none"
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
                      className="h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 animate-none"
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
                    className="h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 animate-none"
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
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm animate-none"
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
                  className="bg-teal-650 hover:bg-teal-750 text-white text-xs font-bold h-10 px-6 rounded-xl flex items-center gap-1.5 shadow-md animate-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin animate-none" />
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

