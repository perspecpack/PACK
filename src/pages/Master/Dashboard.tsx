import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  Layers, 
  CheckSquare, 
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Download,
  Upload,
  Activity,
  Database,
  HardDrive,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  RefreshCw,
  FolderKanban,
  FileCheck
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { DownloadLog } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const { 
    organizations,
    organizationModules,
    components,
    documents,
    standards,
    checklists,
    referenceProjects,
    downloadsLog,
    uploadsLog,
    pageAccessLog,
    logPageAccess,
    user
  } = useApp();

  const [syncTime, setSyncTime] = useState<string>('');

  useEffect(() => {
    logPageAccess('Master - Centro de Controle');
    setSyncTime(new Date().toLocaleTimeString('pt-BR'));
  }, [logPageAccess]);

  // Storage Estimator
  const getFilesList = () => {
    const urls: string[] = [];
    components.forEach(c => {
      if (c.stepFileUrl) urls.push(c.stepFileUrl);
      if (c.pdfFileUrl) urls.push(c.pdfFileUrl);
      if (c.dwgFileUrl) urls.push(c.dwgFileUrl);
      if (c.imageUrl) urls.push(c.imageUrl);
    });
    documents.forEach(d => {
      if (d.fileUrl) urls.push(d.fileUrl);
    });
    standards.forEach(s => {
      if (s.fileUrl) urls.push(s.fileUrl);
    });
    referenceProjects.forEach(p => {
      if (p.imageUrl) urls.push(p.imageUrl);
      if (p.attachmentUrl) urls.push(p.attachmentUrl);
    });
    return urls;
  };

  const fileUrls = getFilesList();
  const totalFiles = fileUrls.length;

  const estimateSize = (url: string) => {
    const cleanUrl = url.toLowerCase().split('?')[0];
    if (cleanUrl.endsWith('.step') || cleanUrl.endsWith('.stp')) return 12.4 * 1024 * 1024;
    if (cleanUrl.endsWith('.dwg')) return 4.8 * 1024 * 1024;
    if (cleanUrl.endsWith('.pdf')) return 1.5 * 1024 * 1024;
    if (cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp')) return 2.2 * 1024 * 1024;
    if (cleanUrl.endsWith('.xlsx') || cleanUrl.endsWith('.xls') || cleanUrl.endsWith('.csv')) return 1.1 * 1024 * 1024;
    if (cleanUrl.endsWith('.docx') || cleanUrl.endsWith('.doc')) return 0.7 * 1024 * 1024;
    return 1.0 * 1024 * 1024;
  };

  const totalStorageUsedBytes = fileUrls.reduce((sum, url) => sum + estimateSize(url), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Unique Users Calculation
  const uniqueUsers = Array.from(new Set([
    ...(user ? [user.email] : []),
    ...downloadsLog.map(l => l.user_id),
    ...uploadsLog.map(l => l.user_id),
    ...pageAccessLog.map(l => l.user_id)
  ])).filter(Boolean);

  const totalUsers = uniqueUsers.length;
  const storageUsedFormatted = formatBytes(totalStorageUsedBytes);

  // 30 Days ago filter helper
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const getRecentCount = (list: { createdAt?: string; upload_date?: string; download_date?: string; access_date?: string; date?: string }[]) => {
    return list.filter(item => {
      const dateStr = item.createdAt || item.upload_date || item.download_date || item.access_date || (item as any).created_at;
      if (!dateStr) return false;
      return new Date(dateStr) >= thirtyDaysAgo;
    }).length;
  };

  // Recent counts
  const recentDownloads = getRecentCount(downloadsLog);
  const recentOrganizations = getRecentCount(organizations);
  const recentDocuments = getRecentCount(documents);
  const recentComponents = getRecentCount(components);
  const recentChecklists = getRecentCount(checklists);

  // Count active users in last 30 days
  const recentUsers = pageAccessLog.filter(l => new Date(l.access_date) >= thirtyDaysAgo).map(l => l.user_id);
  const recentDownloadsUsers = downloadsLog.filter(l => new Date(l.download_date) >= thirtyDaysAgo).map(l => l.user_id);
  const recentUploadsUsers = uploadsLog.filter(l => new Date(l.upload_date) >= thirtyDaysAgo).map(l => l.user_id);
  const activeRecentUsersCount = Array.from(new Set([...recentUsers, ...recentDownloadsUsers, ...recentUploadsUsers])).filter(Boolean).length;

  // Organization statistics ranking
  const orgRanking = organizations.map(org => {
    // accesses count = page accesses mentioning organization + downloads + uploads
    const orgDownloads = downloadsLog.filter(l => l.organization_id === org.id).length;
    const orgUploads = uploadsLog.filter(l => l.organization_id === org.id).length;
    
    // search name in page access log description
    const orgAccesses = pageAccessLog.filter(l => {
      const p = l.page.toLowerCase();
      return p.includes(org.name.toLowerCase()) || p.includes(org.slug.toLowerCase());
    }).length;

    const totalActions = orgAccesses + orgDownloads + orgUploads;

    return {
      id: org.id,
      name: org.name,
      type: org.organizationType === 'oem' ? 'Montadora (OEM)' 
          : org.organizationType === 'component_manufacturer' ? 'Sistemista/Componentes'
          : org.organizationType === 'packaging_supplier' ? 'Desenvolvedor Embalagem'
          : 'Fabricante Embalagem',
      accesses: totalActions || 0,
      downloads: orgDownloads,
      documentsCount: documents.filter(d => d.organizationId === org.id).length,
      componentsCount: components.filter(c => c.organizationId === org.id).length,
      checklistsCount: checklists.filter(c => c.organizationId === org.id).length,
      projectsCount: referenceProjects.filter(p => p.organizationId === org.id).length,
    };
  }).sort((a, b) => b.accesses - a.accesses);

  // Top downloads compilers
  const getTopDownloads = (filterFn: (l: DownloadLog) => boolean, limit = 5) => {
    const counts: Record<string, { count: number; lastDownload: string; item: DownloadLog }> = {};
    downloadsLog.filter(filterFn).forEach(log => {
      if (!counts[log.content_id]) {
        counts[log.content_id] = { count: 0, lastDownload: log.download_date, item: log };
      }
      counts[log.content_id].count += 1;
      if (new Date(log.download_date) > new Date(counts[log.content_id].lastDownload)) {
        counts[log.content_id].lastDownload = log.download_date;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(entry => {
        let name = entry.item.file_name || 'Arquivo';
        let orgName = 'N/A';
        const org = organizations.find(o => o.id === entry.item.organization_id);
        if (org) orgName = org.name;

        const comp = components.find(c => c.id === entry.item.content_id);
        const doc = documents.find(d => d.id === entry.item.content_id);
        const std = standards.find(s => s.id === entry.item.content_id);
        const proj = referenceProjects.find(p => p.id === entry.item.content_id);
        
        if (comp) name = comp.name;
        else if (doc) name = doc.title;
        else if (std) name = std.title;
        else if (proj) name = proj.name;

        return {
          name,
          organization: orgName,
          downloads: entry.count,
          lastDownload: new Date(entry.lastDownload).toLocaleDateString('pt-BR')
        };
      });
  };

  const topDocuments = getTopDownloads(l => ['Documentação Técnica', 'Normas e Padrões'].includes(l.content_type));
  const topComponents = getTopDownloads(l => l.content_type.startsWith('Componente'));
  const topProjects = getTopDownloads(l => l.content_type === 'Projeto de Referência');

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getCompanyFromEmail = (email: string) => {
    if (!email) return 'N/A';
    const domain = email.split('@')[1];
    if (!domain) return 'Fornecedor';
    if (domain === 'perspecpack.com') return 'PERSPECPACK Master';
    return domain.split('.')[0].toUpperCase();
  };

  // Systems alerts scanner
  const systemAlerts: { type: 'warning' | 'info' | 'error'; message: string; module: string }[] = [];
  
  organizations.forEach(org => {
    const compCount = components.filter(c => c.organizationId === org.id).length;
    const docCount = documents.filter(d => d.organizationId === org.id).length;
    const stdCount = standards.filter(s => s.organizationId === org.id).length;
    const chkCount = checklists.filter(c => c.organizationId === org.id).length;
    const projCount = referenceProjects.filter(p => p.organizationId === org.id).length;

    const totalContent = compCount + docCount + stdCount + chkCount + projCount;
    if (totalContent === 0) {
      systemAlerts.push({ type: 'error', message: `A Organização "${org.name}" não possui nenhum conteúdo cadastrado.`, module: 'Organizações' });
    } else if (docCount === 0) {
      systemAlerts.push({ type: 'warning', message: `Organização "${org.name}" sem documentos ou cadernos de encargos.`, module: 'Documentação' });
    }
  });

  checklists.forEach(chk => {
    const totalCriteria = chk.sections?.reduce((sum, s) => sum + (s.criteria?.length || 0), 0) || 0;
    if (totalCriteria === 0) {
      systemAlerts.push({ type: 'error', message: `Checklist "${chk.name}" não possui critérios ou regras de inspeção cadastrados.`, module: 'Checklists' });
    }
  });

  components.forEach(comp => {
    if (!comp.stepFileUrl) {
      const orgName = organizations.find(o => o.id === comp.organizationId)?.name || 'N/A';
      systemAlerts.push({ type: 'warning', message: `Componente "${comp.name}" (${orgName}) está sem arquivo STEP anexado.`, module: 'Componentes' });
    }
  });

  standards.forEach(std => {
    if (!std.revision || std.revision.trim() === '') {
      const orgName = organizations.find(o => o.id === std.organizationId)?.name || 'N/A';
      systemAlerts.push({ type: 'info', message: `Norma "${std.title}" (${orgName}) está sem revisão definida.`, module: 'Normas' });
    }
    if (!std.fileUrl) {
      const orgName = organizations.find(o => o.id === std.organizationId)?.name || 'N/A';
      systemAlerts.push({ type: 'warning', message: `Norma "${std.title}" (${orgName}) não possui anexo técnico.`, module: 'Normas' });
    }
  });

  documents.forEach(doc => {
    if (!doc.fileUrl) {
      const orgName = organizations.find(o => o.id === doc.organizationId)?.name || 'N/A';
      systemAlerts.push({ type: 'warning', message: `Documento "${doc.title}" (${orgName}) está sem anexo de arquivo.`, module: 'Documentos' });
    }
  });

  referenceProjects.forEach(proj => {
    if (!proj.imageUrl) {
      const orgName = organizations.find(o => o.id === proj.organizationId)?.name || 'N/A';
      systemAlerts.push({ type: 'info', message: `Projeto de referência "${proj.name}" (${orgName}) está sem imagem cadastrada.`, module: 'Projetos' });
    }
  });

  // Calculate completeness status per organization
  const getCompletenessStatus = (org: any) => {
    const compCount = components.filter(c => c.organizationId === org.id).length;
    const docCount = documents.filter(d => d.organizationId === org.id).length;
    const stdCount = standards.filter(s => s.organizationId === org.id).length;
    const chkCount = checklists.filter(c => c.organizationId === org.id).length;
    const projCount = referenceProjects.filter(p => p.organizationId === org.id).length;

    const totalContent = compCount + docCount + stdCount + chkCount + projCount;
    if (totalContent === 0) return { label: 'SEM CONTEÚDO', color: 'bg-red-50 text-red-700 border-red-200' };
    
    // If it has at least one in each category
    const hasAll = compCount > 0 && docCount > 0 && stdCount > 0 && chkCount > 0 && projCount > 0;
    if (hasAll) return { label: 'COMPLETO', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    
    return { label: 'EM DESENVOLVIMENTO', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };


  return (
    <div className="space-y-8 max-w-[1280px] mx-auto font-sans pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="bg-teal-500/20 text-[#00F59B] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
            Usuário Master Administrador
          </span>
          <h2 className="text-[28px] font-extrabold tracking-tight">Centro de Controle Administrativo</h2>
          <p className="text-slate-300 text-[14px] max-w-[650px] leading-relaxed">
            Monitore o crescimento da plataforma, o engajamento dos fornecedores, a conformidade de dados cadastrados e a saúde técnica do sistema em tempo real.
          </p>
        </div>
        <div className="relative z-10 shrink-0 self-start md:self-center flex flex-col items-end gap-2 bg-[#06242c]/50 border border-teal-900/60 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Sincronizado: {syncTime || 'Sincronizando...'}</span>
          </div>
          <span className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectado ao Supabase Realtime
          </span>
        </div>
      </div>

      {/* BLOCO 01 - RESUMO GERAL */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">01 &mdash; Resumo Geral</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Organizações Cadastradas</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{organizations.length}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Usuários Cadastrados</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{totalUsers}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Documentos Publicados</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{documents.length}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Componentes Homologados</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{components.length}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Normas e Padrões</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{standards.length}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Checklists Cadastrados</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{checklists.length}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Projetos de Referência</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{referenceProjects.length}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Storage (Arquivos / Uso)</p>
              <h4 className="text-[13px] font-extrabold text-slate-800 mt-1.5 leading-none">
                {totalFiles} files &bull; {storageUsedFormatted}
              </h4>
            </div>
          </div>

        </div>
      </section>

      {/* BLOCO 02 - ATIVIDADE DA PLATAFORMA (LAST 30 DAYS) */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">02 &mdash; Atividade da Plataforma (Últimos 30 Dias)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Downloads</p>
            <h4 className="text-3xl font-black text-teal-600 mt-1">{recentDownloads}</h4>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Novos Usuários</p>
            <h4 className="text-3xl font-black text-indigo-600 mt-1">{activeRecentUsersCount}</h4>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Novas Orgs</p>
            <h4 className="text-3xl font-black text-amber-600 mt-1">{recentOrganizations}</h4>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Novos Docs</p>
            <h4 className="text-3xl font-black text-blue-600 mt-1">{recentDocuments}</h4>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Novos Componentes</p>
            <h4 className="text-3xl font-black text-rose-600 mt-1">{recentComponents}</h4>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Novos Checklists</p>
            <h4 className="text-3xl font-black text-emerald-600 mt-1">{recentChecklists}</h4>
          </div>

        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOCO 03 - ORGANIZAÇÕES MAIS ACESSADAS */}
        <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>03 &mdash; Ranking de Organizações</span>
          </h3>
          <div className="overflow-x-auto max-h-[350px]">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-[11px] font-bold uppercase text-slate-600">Organização</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-slate-600">Tipo</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-slate-600 text-center">Acessos</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-slate-600 text-center">Downloads</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-slate-600 text-center">Conteúdo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgRanking.map((ranking, idx) => (
                  <TableRow key={ranking.id} className="border-b border-slate-100">
                    <TableCell className="font-bold text-[13px] text-slate-900">{ranking.name}</TableCell>
                    <TableCell className="text-[11px] text-slate-500 font-semibold">{ranking.type}</TableCell>
                    <TableCell className="text-[13px] font-bold text-teal-600 text-center bg-teal-50/20">{ranking.accesses}</TableCell>
                    <TableCell className="text-[13px] font-bold text-slate-800 text-center">{ranking.downloads}</TableCell>
                    <TableCell className="text-[11px] text-slate-500 text-center font-mono">
                      C:{ranking.componentsCount} | D:{ranking.documentsCount} | N:{ranking.checklistsCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* BLOCO 04 - CONTEÚDO MAIS ACESSADO */}
        <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">04 &mdash; Conteúdos mais Baixados</h3>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            
            <div>
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Manuais e Documentos</Label>
              {topDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 italic mt-1">Nenhum download registrado.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {topDocuments.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="truncate pr-3">
                        <span className="font-bold font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded mr-1.5">{idx + 1}</span>
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({doc.organization})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-teal-700">{doc.downloads} downloads</span>
                        <span className="block text-[9px] text-slate-400 font-medium">Último: {doc.lastDownload}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Componentes (CAD/STEP)</Label>
              {topComponents.length === 0 ? (
                <p className="text-xs text-slate-400 italic mt-1">Nenhum download registrado.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {topComponents.map((comp, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="truncate pr-3">
                        <span className="font-bold font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mr-1.5">{idx + 1}</span>
                        <span className="font-semibold text-slate-800">{comp.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({comp.organization})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-indigo-700">{comp.downloads} downloads</span>
                        <span className="block text-[9px] text-slate-400 font-medium">Último: {comp.lastDownload}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Projetos de Referência</Label>
              {topProjects.length === 0 ? (
                <p className="text-xs text-slate-400 italic mt-1">Nenhum download registrado.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {topProjects.map((proj, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="truncate pr-3">
                        <span className="font-bold font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mr-1.5">{idx + 1}</span>
                        <span className="font-semibold text-slate-800">{proj.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({proj.organization})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-amber-700">{proj.downloads} downloads</span>
                        <span className="block text-[9px] text-slate-400 font-medium">Último: {proj.lastDownload}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

      </div>

      {/* BLOCO 05 - ÚLTIMOS DOWNLOADS */}
      <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-600" />
            <span>05 &mdash; Auditoria de Downloads em Tempo Real (Últimos 50)</span>
          </h3>
          <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold font-mono">
            {downloadsLog.length} logs
          </Badge>
        </div>
        <div className="overflow-y-auto max-h-[350px] border border-slate-100 rounded-lg">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Data / Hora</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Usuário</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Empresa (Origem)</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Organização</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Categoria</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Arquivo</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">IP (Audit)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloadsLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-slate-400 italic">
                    Nenhum download registrado no banco de dados.
                  </TableCell>
                </TableRow>
              ) : (
                downloadsLog.slice(0, 50).map((log) => {
                  const org = organizations.find(o => o.id === log.organization_id);
                  return (
                    <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-slate-600 text-xs">{formatDate(log.download_date)}</TableCell>
                      <TableCell className="font-semibold text-slate-700 text-xs">{log.user_id}</TableCell>
                      <TableCell className="text-slate-500 font-bold text-xs uppercase">{getCompanyFromEmail(log.user_id)}</TableCell>
                      <TableCell className="font-semibold text-slate-800 text-xs">{org ? org.name : 'N/A'}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] font-bold font-mono border-slate-200">
                          {log.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-mono font-bold max-w-[200px] truncate" title={log.file_name}>
                        {log.file_name}
                      </TableCell>
                      <TableCell className="text-slate-400 font-bold font-mono text-[10px]">127.0.0.1 (Local)</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* BLOCO 06 - ÚLTIMOS UPLOADS */}
      <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>06 &mdash; Histórico de Uploads e Publicações (Últimos 50)</span>
          </h3>
          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold font-mono">
            {uploadsLog.length} logs
          </Badge>
        </div>
        <div className="overflow-y-auto max-h-[350px] border border-slate-100 rounded-lg">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Data / Hora</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Usuário</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Organização Destino</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Módulo</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Arquivo</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadsLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-slate-400 italic">
                    Nenhum upload registrado no banco de dados.
                  </TableCell>
                </TableRow>
              ) : (
                uploadsLog.slice(0, 50).map((log) => {
                  const org = organizations.find(o => o.id === log.organization_id);
                  return (
                    <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-slate-600 text-xs">{formatDate(log.upload_date)}</TableCell>
                      <TableCell className="font-semibold text-slate-700 text-xs">{log.user_id}</TableCell>
                      <TableCell className="font-semibold text-slate-800 text-xs">{org ? org.name : 'N/A'}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-500">{log.content_type}</TableCell>
                      <TableCell className="text-slate-600 text-xs font-mono font-bold max-w-[250px] truncate" title={log.file_name}>
                        {log.file_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold font-mono">
                          Concluído
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BLOCO 07 - STATUS DAS ORGANIZAÇÕES */}
        <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            07 &mdash; Diagnóstico e Integridade das Organizações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
            {organizations.map(org => {
              const compCount = components.filter(c => c.organizationId === org.id).length;
              const docCount = documents.filter(d => d.organizationId === org.id).length;
              const stdCount = standards.filter(s => s.organizationId === org.id).length;
              const chkCount = checklists.filter(c => c.organizationId === org.id).length;
              const projCount = referenceProjects.filter(p => p.organizationId === org.id).length;
              const statusObj = getCompletenessStatus(org);

              return (
                <div key={org.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white transition-colors flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-slate-800 text-[14px]">{org.name}</h4>
                      <Badge className={`${statusObj.color} text-[9px] font-extrabold border shadow-sm`}>
                        {statusObj.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                      <div className="bg-white border border-slate-100 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Comp</span>
                        <span className="text-[13px] font-extrabold text-slate-700">{compCount}</span>
                      </div>
                      <div className="bg-white border border-slate-100 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Docs</span>
                        <span className="text-[13px] font-extrabold text-slate-700">{docCount}</span>
                      </div>
                      <div className="bg-white border border-slate-100 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Norm</span>
                        <span className="text-[13px] font-extrabold text-slate-700">{stdCount}</span>
                      </div>
                      <div className="bg-white border border-slate-100 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Check</span>
                        <span className="text-[13px] font-extrabold text-slate-700">{chkCount}</span>
                      </div>
                      <div className="bg-white border border-slate-100 p-2 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Proj</span>
                        <span className="text-[13px] font-extrabold text-slate-700">{projCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-medium">
                    Total de Itens: {compCount + docCount + stdCount + chkCount + projCount}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BLOCO 09 - SAÚDE DA PLATAFORMA */}
        <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>09 &mdash; Saúde da Plataforma</span>
            </h3>
            <div className="space-y-4 mt-4">
              
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                <span className="text-slate-500 font-bold">Banco de Dados:</span>
                <span className="font-extrabold text-slate-800 font-mono">PostgreSQL (Supabase)</span>
              </div>


              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                <span className="text-slate-500 font-bold">Storage Utilizado:</span>
                <span className="font-extrabold text-teal-600 font-mono">{storageUsedFormatted}</span>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                <span className="text-slate-500 font-bold">Quantidade de arquivos:</span>
                <span className="font-extrabold text-slate-800 font-mono">{totalFiles} arquivos</span>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                <span className="text-slate-500 font-bold">Espaço disponível:</span>
                <span className="font-extrabold text-slate-700 font-mono">
                  {formatBytes(Math.max(0, 1024 * 1024 * 1024 - totalStorageUsedBytes))} / 1.00 GB (Free)
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                <span className="text-slate-500 font-bold">Último Backup:</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" /> Automático Diário (Ok)
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-slate-500 font-bold">Última Sincronização:</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Hoje, {syncTime}</span>
              </div>

            </div>
          </div>

          <div className="mt-4 bg-[#06242c] text-[#00F59B] p-4 rounded-xl flex items-center justify-between border border-teal-950">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="text-[12px] font-extrabold uppercase tracking-wider text-white">Modo Simulação</p>
                <p className="text-[10px] text-slate-300">Simule a área do fornecedor.</p>
              </div>
            </div>
            <Link to="/" className="p-1 bg-[#00F59B] text-teal-950 rounded-lg hover:opacity-90 transition-opacity">
              <ChevronRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        </section>

      </div>

      {/* BLOCO 08 - ALERTAS DO SISTEMA */}
      <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
          <span>08 &mdash; Alertas de Conformidade e Diagnóstico Automático</span>
        </h3>
        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
          {systemAlerts.length === 0 ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-xl">
              <FileCheck className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="text-xs font-semibold">Tudo limpo! Nenhum alerta de inconformidade nos arquivos ou estruturas foi detectado.</span>
            </div>
          ) : (
            systemAlerts.map((alert, idx) => {
              const bg = alert.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-100'
                       : alert.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100'
                       : 'bg-blue-50 text-blue-800 border-blue-100';
              const Icon = alert.type === 'error' ? AlertCircle
                         : alert.type === 'warning' ? AlertTriangle
                         : Info;
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 border rounded-xl ${bg} text-xs font-medium`}>
                  <Icon className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded bg-white/65 mr-2">
                      {alert.module}
                    </span>
                    <span className="leading-relaxed">{alert.message}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}
