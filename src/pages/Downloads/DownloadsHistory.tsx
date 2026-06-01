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
  History
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function DownloadsHistory() {
  const navigate = useNavigate();
  const { user, downloadsLog, organizations, logPageAccess } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    logPageAccess('Fornecedor - Histórico de Downloads');
  }, [logPageAccess]);

  const userLogs = downloadsLog.filter(log => log.user_id === user?.email);

  const filteredLogs = userLogs.filter(log => {
    const filename = log.file_name?.toLowerCase() || '';
    const contentType = log.content_type?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return filename.includes(term) || contentType.includes(term);
  });

  const getOrgName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || 'N/A';
  };

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
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

      {/* Filter and Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Header Filter */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Pesquisar por nome de arquivo ou módulo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl border-slate-300 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            Total de Downloads: {userLogs.length}
          </span>
        </div>

        {/* Table / List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-3 font-medium">
            <div className="w-14 h-14 bg-slate-100 border border-slate-200/80 rounded-full flex items-center justify-center mx-auto shadow-inner text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">Nenhum download encontrado</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-500 whitespace-nowrap">
                      {formatDate(log.download_date)}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800 break-all max-w-xs">
                      {log.file_name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-650 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
                        {getIcon(log.content_type)}
                        <span>{log.content_type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        <Building2 className="w-3 h-3 text-teal-600" />
                        <span>{getOrgName(log.organization_id)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
