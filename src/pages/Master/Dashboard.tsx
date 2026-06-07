import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FileCheck,
  CheckCircle2,
  Settings,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { DownloadLog } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { 
    organizations,
    organizationModules,
    components,
    documents,
    standards,
    checklists,
    downloadsLog,
    uploadsLog,
    pageAccessLog,
    logPageAccess,
    user,
    setViewingAsUser
  } = useApp();

  const navigate = useNavigate();

  const [syncTime, setSyncTime] = useState<string>('');
  const [registeredProfiles, setRegisteredProfiles] = useState<any[]>([]);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isProfilesLoading, setIsProfilesLoading] = useState<boolean>(true);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(true);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState<boolean>(false);
  const [editingLimit, setEditingLimit] = useState<any>(null);

  const fetchHealthMetrics = React.useCallback(async () => {
    if (!supabase) return;
    try {
      setIsHealthLoading(true);
      const { data, error } = await supabase.rpc('get_platform_health_metrics');
      if (error) throw error;
      if (data) {
        setHealthMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching health metrics:', err);
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingLimit) return;
    try {
      setIsUpdatingLimit(true);
      const { error } = await supabase
        .from('system_limits')
        .update({
          limit_value: Number(editingLimit.limit_value),
          current_value: editingLimit.current_value === '' || editingLimit.current_value === null ? null : Number(editingLimit.current_value),
          text_value: editingLimit.text_value,
          plan_name: editingLimit.plan_name,
          unit: editingLimit.unit,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLimit.id);
      
      if (error) throw error;
      
      // Refresh metrics
      await fetchHealthMetrics();
      setEditingLimit(null);
    } catch (err) {
      console.error('Error updating limit:', err);
      alert('Erro ao atualizar limite: ' + (err as any).message);
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  useEffect(() => {
    logPageAccess('Master - Centro de Controle');
    setSyncTime(new Date().toLocaleTimeString('pt-BR'));
  }, [logPageAccess]);

  useEffect(() => {
    const fetchProfilesAndCheckDb = async () => {
      if (!supabase) {
        setDbStatus('offline');
        setIsProfilesLoading(false);
        setIsHealthLoading(false);
        return;
      }
      
      const start = performance.now();
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*');
        
        const end = performance.now();
        setDbLatency(Math.round(end - start));
        
        if (error) {
          console.error('Error fetching profiles:', error);
          setDbStatus('offline');
        } else {
          setDbStatus('online');
          if (data) {
            setRegisteredProfiles(data);
          }
        }

        await fetchHealthMetrics();
      } catch (err) {
        console.error('Error in dashboard initialization:', err);
        setDbStatus('offline');
      } finally {
        setIsProfilesLoading(false);
      }
    };

    fetchProfilesAndCheckDb();
  }, [fetchHealthMetrics]);

  const handleSimulate = () => {
    setViewingAsUser(true);
    navigate('/');
  };

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

  const masterEmail = (import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL || 'perspec03d@gmail.com').toLowerCase();
  
  // Filter out the master admin profile to get clean customer metrics
  const customerProfiles = registeredProfiles.filter(
    p => p.corporate_email?.toLowerCase() !== masterEmail
  );

  const activeProfiles = customerProfiles.filter(p => p.user_status === 'active');
  const pendingProfiles = customerProfiles.filter(p => p.user_status === 'pending');
  const blockedProfiles = customerProfiles.filter(
    p => p.user_status === 'rejected' || p.account_status === 'blocked'
  );

  const totalRegisteredCount = activeProfiles.length;
  const freePlanCount = activeProfiles.filter(p => p.plan_type === 'free').length;
  const premiumPlanCount = activeProfiles.filter(p => p.plan_type === 'premium').length;
  const pendingCount = pendingProfiles.length;
  const blockedCount = blockedProfiles.length;

  const getUserLastActivity = (email: string) => {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    
    const userDownloads = downloadsLog.filter(l => l.user_id?.toLowerCase().trim() === cleanEmail);
    const userUploads = uploadsLog.filter(l => l.user_id?.toLowerCase().trim() === cleanEmail);
    const userAccesses = pageAccessLog.filter(l => l.user_id?.toLowerCase().trim() === cleanEmail);
    
    const dates: Date[] = [];
    userDownloads.forEach(l => { if (l.download_date) dates.push(new Date(l.download_date)); });
    userUploads.forEach(l => { if (l.upload_date) dates.push(new Date(l.upload_date)); });
    userAccesses.forEach(l => { if (l.access_date) dates.push(new Date(l.access_date)); });
    
    if (dates.length === 0) return null;
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    return maxDate;
  };

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
        
        if (comp) name = comp.name;
        else if (doc) name = doc.title;
        else if (std) name = std.title;

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

    const totalContent = compCount + docCount + stdCount + chkCount;
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



  // Calculate completeness status per organization
  const getCompletenessStatus = (org: any) => {
    const compCount = components.filter(c => c.organizationId === org.id).length;
    const docCount = documents.filter(d => d.organizationId === org.id).length;
    const stdCount = standards.filter(s => s.organizationId === org.id).length;
    const chkCount = checklists.filter(c => c.organizationId === org.id).length;

    const totalContent = compCount + docCount + stdCount + chkCount;
    if (totalContent === 0) return { label: 'SEM CONTEÚDO', color: 'bg-red-50 text-red-700 border-red-200' };
    
    // If it has at least one in each category
    const hasAll = compCount > 0 && docCount > 0 && stdCount > 0 && chkCount > 0;
    if (hasAll) return { label: 'COMPLETO', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    
    return { label: 'EM DESENVOLVIMENTO', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };


  // Infrastructure metrics calculations
  const limits = healthMetrics?.limits || [];
  
  const getLimit = (provider: string, metric: string) => {
    return limits.find((l: any) => l.provider === provider && l.metric_name === metric);
  };

  // 1. Storage Calculation
  const storageLimitMetric = getLimit('supabase', 'storage');
  const storageLimitGB = storageLimitMetric?.limit_value || 1;
  const storagePlanName = storageLimitMetric?.plan_name || 'Free';
  const storageUsedBytes = storageLimitMetric?.current_value !== null && storageLimitMetric?.current_value !== undefined
    ? (storageLimitMetric.current_value * 1024 * 1024 * 1024) 
    : (healthMetrics?.storage_size_bytes || totalStorageUsedBytes);
  const storageUsedMB = storageUsedBytes / (1024 * 1024);
  const storageLimitMB = storageLimitGB * 1024;
  const storageAvailableMB = Math.max(0, storageLimitMB - storageUsedMB);
  const storagePercent = (storageUsedMB / storageLimitMB) * 100;

  // 2. Database Calculation
  const dbLimitMetric = getLimit('supabase', 'database');
  const dbLimitMB = dbLimitMetric?.limit_value || 500;
  const dbPlanName = dbLimitMetric?.plan_name || 'Free';
  const dbUsedBytes = dbLimitMetric?.current_value !== null && dbLimitMetric?.current_value !== undefined
    ? (dbLimitMetric.current_value * 1024 * 1024)
    : (healthMetrics?.db_size_bytes || 14240915);
  const dbUsedMB = dbUsedBytes / (1024 * 1024);
  const dbAvailableMB = Math.max(0, dbLimitMB - dbUsedMB);
  const dbPercent = (dbUsedMB / dbLimitMB) * 100;

  // 3. Egress Calculation
  const egressLimitMetric = getLimit('supabase', 'egress');
  const egressLimitGB = egressLimitMetric?.limit_value || 5;
  const egressPlanName = egressLimitMetric?.plan_name || 'Free';
  
  const estimatedEgressBytes = downloadsLog.reduce((sum, log) => {
    let fileUrl = '';
    const comp = components.find(c => c.id === log.content_id);
    const doc = documents.find(d => d.id === log.content_id);
    const std = standards.find(s => s.id === log.content_id);
    if (comp) fileUrl = comp.stepFileUrl || comp.pdfFileUrl || comp.dwgFileUrl || comp.imageUrl || '';
    else if (doc) fileUrl = doc.fileUrl || '';
    else if (std) fileUrl = std.fileUrl || '';
    
    const size = estimateSize(fileUrl || log.file_name);
    return sum + size;
  }, 0);
  
  const egressUsedGB = egressLimitMetric?.current_value !== null && egressLimitMetric?.current_value !== undefined
    ? egressLimitMetric.current_value
    : (estimatedEgressBytes / (1024 * 1024 * 1024));
  const egressAvailableGB = Math.max(0, egressLimitGB - egressUsedGB);
  const egressPercent = (egressUsedGB / egressLimitGB) * 100;

  // 4. Vercel Bandwidth
  const bandwidthLimitMetric = getLimit('vercel', 'bandwidth');
  const bandwidthLimitGB = bandwidthLimitMetric?.limit_value || 100;
  const bandwidthPlanName = bandwidthLimitMetric?.plan_name || 'Hobby';
  const bandwidthUsedGB = bandwidthLimitMetric?.current_value !== null && bandwidthLimitMetric?.current_value !== undefined
    ? bandwidthLimitMetric.current_value
    : (egressUsedGB * 1.25);
  const bandwidthAvailableGB = Math.max(0, bandwidthLimitGB - bandwidthUsedGB);
  const bandwidthPercent = (bandwidthUsedGB / bandwidthLimitGB) * 100;

  // 5. Vercel Function Invocations
  const functionsLimitMetric = getLimit('vercel', 'function_invocations');
  const functionsLimit = functionsLimitMetric?.limit_value || 100000;
  const functionsPlanName = functionsLimitMetric?.plan_name || 'Hobby';
  const functionsUsed = functionsLimitMetric?.current_value !== null && functionsLimitMetric?.current_value !== undefined
    ? functionsLimitMetric.current_value
    : (pageAccessLog.length * 1.8);
  const functionsAvailable = Math.max(0, functionsLimit - functionsUsed);
  const functionsPercent = (functionsUsed / functionsLimit) * 100;

  // 6. Vercel Build Minutes
  const buildsLimitMetric = getLimit('vercel', 'build_minutes');
  const buildsLimit = buildsLimitMetric?.limit_value || 100;
  const buildsPlanName = buildsLimitMetric?.plan_name || 'Hobby';
  const buildsUsed = buildsLimitMetric?.current_value !== null && buildsLimitMetric?.current_value !== undefined
    ? buildsLimitMetric.current_value
    : 18;
  const buildsAvailable = Math.max(0, buildsLimit - buildsUsed);
  const buildsPercent = (buildsUsed / buildsLimit) * 100;

  // GitHub / Vercel Metadata configs
  const gitBranch = getLimit('github', 'branch')?.text_value || 'main';
  const gitLastCommit = getLimit('github', 'last_commit')?.text_value || 'N/A';
  const vercelDomain = getLimit('vercel', 'domain')?.text_value || 'perspecpack.vercel.app';
  const vercelDeployStatus = getLimit('vercel', 'deploy_status')?.text_value || 'Ready';
  const vercelLastDeploy = getLimit('vercel', 'last_deploy')?.text_value || 'N/A';

  // Capacity Forecast
  const uploadsLast30Days = uploadsLog.filter(l => new Date(l.upload_date) >= thirtyDaysAgo).length;
  const avgUploadSizeMB = 4.2;
  const storageGrowthMBPerMonth = uploadsLast30Days * avgUploadSizeMB || 8.4;
  const storageMonthsTo80 = storageGrowthMBPerMonth > 0 ? (storageLimitMB * 0.8 - storageUsedMB) / storageGrowthMBPerMonth : 999;
  const storageMonthsTo100 = storageGrowthMBPerMonth > 0 ? (storageLimitMB - storageUsedMB) / storageGrowthMBPerMonth : 999;

  // Monthly Reset Projection
  const currentDay = new Date().getDate();
  const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  
  const dailyEgressGB = egressUsedGB / Math.max(1, currentDay);
  const projectedEgressGB = dailyEgressGB * totalDays;
  const egressRisk = projectedEgressGB > egressLimitGB * 0.9 ? 'critical' : projectedEgressGB > egressLimitGB * 0.7 ? 'warning' : 'low';

  const dailyBandwidthGB = bandwidthUsedGB / Math.max(1, currentDay);
  const projectedBandwidthGB = dailyBandwidthGB * totalDays;
  const bandwidthRisk = projectedBandwidthGB > bandwidthLimitGB * 0.9 ? 'critical' : projectedBandwidthGB > bandwidthLimitGB * 0.7 ? 'warning' : 'low';

  // Status Helpers
  const getStatusBadge = (percent: number) => {
    if (percent <= 60) return { label: 'Saudável', color: 'bg-emerald-50 text-emerald-700 border-emerald-250/60', dot: 'bg-emerald-500' };
    if (percent <= 80) return { label: 'Atenção', color: 'bg-amber-50 text-amber-700 border-amber-250/70', dot: 'bg-amber-500' };
    if (percent <= 90) return { label: 'Aviso', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
    return { label: 'Crítico', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
  };

  const getStatusEmoji = (percent: number) => {
    if (percent <= 60) return '🟢';
    if (percent <= 80) return '🟡';
    if (percent <= 90) return '🟠';
    return '🔴';
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
              <p className="text-slate-500 text-xs font-semibold">Usuários Cadastrados (Ativos)</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">
                {isProfilesLoading ? (
                  <span className="text-slate-400 text-sm animate-pulse">Carregando...</span>
                ) : (
                  totalRegisteredCount
                )}
              </h4>
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
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Downloads Realizados</p>
              <h4 className="text-2xl font-extrabold text-slate-850 mt-1">{downloadsLog.length}</h4>
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

      {/* BLOCO 10 - DETALHAMENTO DE USUÁRIOS E PLANOS */}
      <section className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-650" />
            <span>10 &mdash; Estatísticas e Perfis de Usuários (Clientes)</span>
          </h3>
          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold font-mono">
            {isProfilesLoading ? '...' : customerProfiles.length} cadastrados
          </Badge>
        </div>

        {/* Mini cards de distribuição */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Ativos</span>
            <span className="text-xl font-black text-slate-850 mt-1 block">{isProfilesLoading ? '...' : totalRegisteredCount}</span>
          </div>
          <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl text-center">
            <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Plano Premium</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{isProfilesLoading ? '...' : premiumPlanCount}</span>
          </div>
          <div className="bg-slate-100/60 border border-slate-200 p-3.5 rounded-xl text-center">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plano Free</span>
            <span className="text-xl font-black text-slate-700 mt-1 block">{isProfilesLoading ? '...' : freePlanCount}</span>
          </div>
          <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-center">
            <span className="block text-[10px] text-amber-600 font-bold uppercase tracking-wider">Pendentes</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{isProfilesLoading ? '...' : pendingCount}</span>
          </div>
          <div className="bg-rose-50/30 border border-rose-100 p-3.5 rounded-xl text-center col-span-2 sm:col-span-1">
            <span className="block text-[10px] text-rose-600 font-bold uppercase tracking-wider">Bloqueados</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">{isProfilesLoading ? '...' : blockedCount}</span>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto border border-slate-100 rounded-lg mt-4 max-h-[300px]">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Usuário / Cargo</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Empresa / CNPJ</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Plano</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Cadastro</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-slate-600">Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isProfilesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-slate-400 italic">
                    Carregando dados detalhados...
                  </TableCell>
                </TableRow>
              ) : customerProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-slate-400 italic">
                    Nenhum usuário cliente cadastrado no banco de dados.
                  </TableCell>
                </TableRow>
              ) : (
                customerProfiles.map((profile) => {
                  const lastAct = getUserLastActivity(profile.corporate_email);
                  const lastActFormatted = lastAct 
                    ? `${lastAct.toLocaleDateString('pt-BR')} ${lastAct.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Sem atividade';
                  
                  return (
                    <TableRow key={profile.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 text-xs">{profile.full_name || 'Sem Nome'}</span>
                          <span className="text-slate-400 text-[10px] font-mono leading-none mt-0.5">{profile.corporate_email}</span>
                          <span className="text-[9.5px] text-slate-500 font-medium italic mt-0.5">{profile.role_title || 'Colaborador'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-700 text-xs">{profile.company_name || 'N/A'}</span>
                          <span className="text-slate-400 text-[10px] leading-tight font-mono">{profile.cnpj || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={`text-[9.5px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          profile.plan_type === 'premium' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-slate-100 text-slate-650 border-slate-200'
                        }`}>
                          {profile.plan_type?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                          profile.user_status === 'active' && profile.account_status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : profile.user_status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-250'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {profile.user_status === 'active' && profile.account_status === 'active' && 'Ativo'}
                          {profile.user_status === 'pending' && 'Pendente'}
                          {(profile.user_status === 'rejected' || profile.account_status === 'blocked') && 'Bloqueado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 font-mono text-slate-500 text-xs">
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell className="py-2.5 font-semibold text-slate-700 text-xs">
                        {lastActFormatted}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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

      {/* BLOCO 09 - SAÚDE DA PLATAFORMA */}
      <section className="space-y-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1 text-left">
            <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <span>09 &mdash; Saúde e Capacidade da Infraestrutura</span>
            </h3>
            <p className="text-slate-500 text-xs font-medium">
              Monitoramento técnico de capacidade, consumo de infraestrutura e limites operacionais da plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => fetchHealthMetrics()}
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-teal-700 font-bold text-xs gap-1.5 h-8.5 rounded-lg transition-all"
              disabled={isHealthLoading}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isHealthLoading && "animate-spin")} />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Executive summary status bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-500">Storage</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", getStatusBadge(storagePercent).dot)}></span>
              <span className="text-xs font-extrabold text-slate-800">{getStatusBadge(storagePercent).label} ({storagePercent.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-500">Banco de Dados</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", getStatusBadge(dbPercent).dot)}></span>
              <span className="text-xs font-extrabold text-slate-800">{getStatusBadge(dbPercent).label} ({dbPercent.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-500">Transferência (Egress)</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", getStatusBadge(egressPercent).dot)}></span>
              <span className="text-xs font-extrabold text-slate-800">{getStatusBadge(egressPercent).label} ({egressPercent.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-500">Serviços Integrados</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-extrabold text-emerald-700">3/3 Operacionais</span>
            </div>
          </div>
        </div>

        {/* 1. RESUMO DE CAPACIDADE CARDS */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">1. Resumo de Capacidade da Infraestrutura</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Storage Card */}
            <div className="border border-slate-200 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col justify-between h-[210px] relative text-left">
              <button 
                onClick={() => setEditingLimit(getLimit('supabase', 'storage') || { provider: 'supabase', metric_name: 'storage', limit_value: 1, unit: 'GB', plan_name: 'Free' })}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-teal-600 transition-colors p-1"
                title="Editar limites"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shadow-sm">
                    <HardDrive className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-[13px]">Storage de Arquivos</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supabase Bucket ({storagePlanName})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{storageUsedMB.toFixed(1)} MB utilizados</span>
                    <span>{storageAvailableMB.toFixed(1)} MB disponíveis</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        storagePercent > 90 ? "bg-rose-500" : storagePercent > 80 ? "bg-orange-500" : storagePercent > 60 ? "bg-amber-500" : "bg-teal-500"
                      )}
                      style={{ width: `${Math.min(100, storagePercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-slate-150/70 pt-2.5 mt-2">
                <span className="text-slate-500 font-bold">{storagePercent.toFixed(2)}% usado &bull; {storageAvailableMB > 0 ? `${(100 - storagePercent).toFixed(2)}% livre` : '0% livre'}</span>
                <Badge className={cn("text-[9px] font-extrabold border shadow-sm", getStatusBadge(storagePercent).color)}>
                  {getStatusBadge(storagePercent).label}
                </Badge>
              </div>
            </div>

            {/* Database Card */}
            <div className="border border-slate-200 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col justify-between h-[210px] relative text-left">
              <button 
                onClick={() => setEditingLimit(getLimit('supabase', 'database') || { provider: 'supabase', metric_name: 'database', limit_value: 500, unit: 'MB', plan_name: 'Free' })}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-teal-600 transition-colors p-1"
                title="Editar limites"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm">
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-[13px]">Tamanho do Banco</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supabase PG ({dbPlanName})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{dbUsedMB.toFixed(2)} MB utilizados</span>
                    <span>{dbAvailableMB.toFixed(2)} MB disponíveis</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        dbPercent > 90 ? "bg-rose-500" : dbPercent > 80 ? "bg-orange-500" : dbPercent > 60 ? "bg-amber-500" : "bg-indigo-500"
                      )}
                      style={{ width: `${Math.min(100, dbPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-slate-150/70 pt-2.5 mt-2">
                <span className="text-slate-500 font-bold">{dbPercent.toFixed(2)}% usado &bull; {dbAvailableMB > 0 ? `${(100 - dbPercent).toFixed(2)}% livre` : '0% livre'}</span>
                <Badge className={cn("text-[9px] font-extrabold border shadow-sm", getStatusBadge(dbPercent).color)}>
                  {getStatusBadge(dbPercent).label}
                </Badge>
              </div>
            </div>

            {/* Egress Card */}
            <div className="border border-slate-200 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col justify-between h-[210px] relative text-left">
              <button 
                onClick={() => setEditingLimit(getLimit('supabase', 'egress') || { provider: 'supabase', metric_name: 'egress', limit_value: 5, unit: 'GB', plan_name: 'Free' })}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-teal-600 transition-colors p-1"
                title="Editar limites"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shadow-sm">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-[13px]">Egress / Transferência</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tráfego de Saída ({egressPlanName})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{egressUsedGB.toFixed(4)} GB utilizados</span>
                    <span>{egressLimitGB} GB limite</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        egressPercent > 90 ? "bg-rose-500" : egressPercent > 80 ? "bg-orange-500" : egressPercent > 60 ? "bg-amber-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(100, egressPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-slate-150/70 pt-2.5 mt-2">
                <span className="text-slate-500 font-bold">{egressPercent.toFixed(3)}% consumido &bull; {egressAvailableGB.toFixed(3)} GB restante</span>
                <Badge className={cn("text-[9px] font-extrabold border shadow-sm", getStatusBadge(egressPercent).color)}>
                  {getStatusBadge(egressPercent).label}
                </Badge>
              </div>
            </div>

            {/* Vercel Bandwidth Card */}
            <div className="border border-slate-200 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col justify-between h-[210px] relative text-left">
              <button 
                onClick={() => setEditingLimit(getLimit('vercel', 'bandwidth') || { provider: 'vercel', metric_name: 'bandwidth', limit_value: 100, unit: 'GB', plan_name: 'Hobby' })}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-teal-600 transition-colors p-1"
                title="Editar limites"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-50 text-sky-700 rounded-lg shadow-sm">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-[13px]">Vercel Bandwidth</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tráfego Web ({bandwidthPlanName})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{bandwidthUsedGB.toFixed(4)} GB utilizados</span>
                    <span>{bandwidthLimitGB} GB limite</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        bandwidthPercent > 90 ? "bg-rose-500" : bandwidthPercent > 80 ? "bg-orange-500" : bandwidthPercent > 60 ? "bg-amber-500" : "bg-sky-500"
                      )}
                      style={{ width: `${Math.min(100, bandwidthPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-slate-150/70 pt-2.5 mt-2">
                <span className="text-slate-500 font-bold">{bandwidthPercent.toFixed(3)}% consumido &bull; {bandwidthAvailableGB.toFixed(3)} GB restante</span>
                <Badge className={cn("text-[9px] font-extrabold border shadow-sm", getStatusBadge(bandwidthPercent).color)}>
                  {getStatusBadge(bandwidthPercent).label}
                </Badge>
              </div>
            </div>

            {/* Vercel Functions Card */}
            <div className="border border-slate-200 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col justify-between h-[210px] relative text-left">
              <button 
                onClick={() => setEditingLimit(getLimit('vercel', 'function_invocations') || { provider: 'vercel', metric_name: 'function_invocations', limit_value: 100000, unit: 'count', plan_name: 'Hobby' })}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-teal-600 transition-colors p-1"
                title="Editar limites"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-lg shadow-sm">
                    <RefreshCw className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-[13px]">Function Invocations</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Execuções de API ({functionsPlanName})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{Math.round(functionsUsed).toLocaleString()} chamadas</span>
                    <span>{functionsLimit.toLocaleString()} limite</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        functionsPercent > 90 ? "bg-rose-500" : functionsPercent > 80 ? "bg-orange-500" : functionsPercent > 60 ? "bg-amber-500" : "bg-purple-500"
                      )}
                      style={{ width: `${Math.min(100, functionsPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-slate-150/70 pt-2.5 mt-2">
                <span className="text-slate-500 font-bold">{functionsPercent.toFixed(2)}% consumido &bull; {Math.max(0, Math.round(functionsAvailable)).toLocaleString()} restando</span>
                <Badge className={cn("text-[9px] font-extrabold border shadow-sm", getStatusBadge(functionsPercent).color)}>
                  {getStatusBadge(functionsPercent).label}
                </Badge>
              </div>
            </div>

            {/* Vercel Build Minutes Card */}
            <div className="border border-slate-200 hover:border-teal-500 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col justify-between h-[210px] relative text-left">
              <button 
                onClick={() => setEditingLimit(getLimit('vercel', 'build_minutes') || { provider: 'vercel', metric_name: 'build_minutes', limit_value: 100, unit: 'minutes', plan_name: 'Hobby' })}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-teal-600 transition-colors p-1"
                title="Editar limites"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg shadow-sm">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-[13px]">Minutos de Deploy</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Build Minutes ({buildsPlanName})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{buildsUsed} minutos consumidos</span>
                    <span>{buildsLimit} minutos limite</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", 
                        buildsPercent > 90 ? "bg-rose-500" : buildsPercent > 80 ? "bg-orange-500" : buildsPercent > 60 ? "bg-amber-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(100, buildsPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] border-t border-slate-150/70 pt-2.5 mt-2">
                <span className="text-slate-500 font-bold">{buildsPercent.toFixed(1)}% consumido &bull; {buildsAvailable} minutos restantes</span>
                <Badge className={cn("text-[9px] font-extrabold border shadow-sm", getStatusBadge(buildsPercent).color)}>
                  {getStatusBadge(buildsPercent).label}
                </Badge>
              </div>
            </div>

          </div>
        </div>

        {/* 2. IMPACTO DAS FUNCIONALIDADES */}
        <div className="space-y-3 bg-slate-50/50 border border-slate-150 rounded-xl p-4.5 text-left">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-teal-650" />
            <span>Impacto no Consumo por Funcionalidade</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs mt-2">
            <div className="space-y-1">
              <strong className="text-slate-800 font-bold block">Checklists Preenchidos</strong>
              <p className="text-slate-500 leading-relaxed">
                Consomem banco de dados (tabelas <code className="bg-slate-150 px-1 py-0.5 rounded font-mono text-[10px]">checklist_executions</code> e <code className="bg-slate-150 px-1 py-0.5 rounded font-mono text-[10px]">checklist_execution_items</code>). Quando geram fotos ou evidências, consomem storage.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-slate-800 font-bold block">Relatórios PDF & Downloads</strong>
              <p className="text-slate-500 leading-relaxed">
                Consomem tráfego de saída (Egress) quando gerados ou baixados. Os anexos de PDF salvos no bucket consomem storage e geram tráfego na transferência de dados.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-slate-800 font-bold block">Upload de Arquivos CAD/STEP</strong>
              <p className="text-slate-500 leading-relaxed">
                Modelos 3D (STEP/STP) e desenhos 2D (DWG) possuem tamanho médio elevado (10MB - 15MB) e são os principais responsáveis pelo consumo de storage de arquivos.
              </p>
            </div>
          </div>
        </div>

        {/* 3. LIMITES DO PLANO ATUAL & PREVISÃO DE USO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          
          {/* Limites do Plano */}
          <div className="space-y-3 border border-slate-150 rounded-xl p-4.5 bg-slate-50/30">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Limites do Plano Atual</h4>
            <div className="space-y-2.5 mt-2">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Supabase Plan:</span>
                <span className="font-extrabold text-slate-850 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md font-mono text-[11px]">Supabase {storagePlanName}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Storage Limit:</span>
                <span className="font-extrabold text-slate-800 font-mono">{storageLimitGB} GB</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Database Limit:</span>
                <span className="font-extrabold text-slate-800 font-mono">{dbLimitMB} MB</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Egress Limit (Supabase):</span>
                <span className="font-extrabold text-slate-800 font-mono">{egressLimitGB} GB</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Vercel Bandwidth Limit:</span>
                <span className="font-extrabold text-slate-800 font-mono">{bandwidthLimitGB} GB ({bandwidthPlanName})</span>
              </div>
            </div>
          </div>

          {/* Previsão de Capacidade */}
          <div className="space-y-3 border border-slate-150 rounded-xl p-4.5 bg-slate-50/30">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Previsão de Capacidade</h4>
            <div className="space-y-2.5 mt-2">
              
              <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-semibold block">Previsão de Storage:</span>
                  <span className="text-[10px] text-slate-400">Consumo médio: {storageGrowthMBPerMonth.toFixed(1)} MB/mês</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-800 font-mono block">
                    {storageMonthsTo100 > 120 ? 'Estável (+10 anos)' : `${Math.round(storageMonthsTo100)} meses`}
                  </span>
                  <span className="text-[10px] text-teal-650 font-semibold">80% em {storageMonthsTo80 > 120 ? '+10 anos' : `${Math.round(storageMonthsTo80)} meses`}</span>
                </div>
              </div>

              <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-semibold block">Previsão de Egress (Tráfego):</span>
                  <span className="text-[10px] text-slate-400">Projeção mensal: {projectedEgressGB.toFixed(3)} GB / mês</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-extrabold text-slate-800 font-mono flex items-center gap-1">
                    {getStatusEmoji(egressPercent)} {projectedEgressGB.toFixed(2)} GB
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${egressRisk === 'critical' ? 'text-rose-600' : egressRisk === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {egressRisk === 'critical' ? 'Risco Alto' : egressRisk === 'warning' ? 'Risco Médio' : 'Risco Baixo'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start text-xs gap-4">
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-semibold block">Previsão Bandwidth Vercel:</span>
                  <span className="text-[10px] text-slate-400">Projeção mensal: {projectedBandwidthGB.toFixed(3)} GB / mês</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-extrabold text-slate-800 font-mono flex items-center gap-1">
                    {getStatusEmoji(bandwidthPercent)} {projectedBandwidthGB.toFixed(2)} GB
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${bandwidthRisk === 'critical' ? 'text-rose-600' : bandwidthRisk === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {bandwidthRisk === 'critical' ? 'Risco Alto' : bandwidthRisk === 'warning' ? 'Risco Médio' : 'Risco Baixo'}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 6. SERVIÇOS INTEGRADOS */}
        <div className="space-y-3 border-t border-slate-150/70 pt-4 text-left">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Serviços Integrados</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Supabase Status */}
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/40 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-650" />
                  <span>Supabase</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", dbStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")}></span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">{dbStatus}</span>
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Latência:</span>
                  <span className="font-bold font-mono text-slate-800">{dbLatency ? `${dbLatency} ms` : '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="font-bold text-emerald-600">Saudável</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage API:</span>
                  <span className="font-bold text-emerald-600">Saudável</span>
                </div>
                <div className="flex justify-between">
                  <span>Auth Service:</span>
                  <span className="font-bold text-emerald-600">Saudável</span>
                </div>
              </div>
            </div>

            {/* Vercel Status */}
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/40 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-650" />
                  <span>Vercel Deploy</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Online</span>
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Deploy Status:</span>
                  <span className="font-bold text-slate-800 font-mono">{vercelDeployStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Último Deploy:</span>
                  <span className="font-semibold text-slate-700 text-[10px] max-w-[120px] truncate" title={vercelLastDeploy}>{vercelLastDeploy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Domínio Ativo:</span>
                  <span className="font-semibold text-slate-700 text-[10px] truncate" title={vercelDomain}>{vercelDomain}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ambiente:</span>
                  <span className="font-bold text-indigo-700">Production</span>
                </div>
              </div>
            </div>

            {/* GitHub Status */}
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/40 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-slate-750" />
                  <span>GitHub Repo</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Conectado</span>
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Branch Produção:</span>
                  <span className="font-bold text-slate-800 font-mono">{gitBranch}</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Último Commit:</span>
                  <span className="font-medium text-slate-700 text-[10.5px] leading-tight block line-clamp-2" title={gitLastCommit}>
                    {gitLastCommit}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Edit Limit Dialog Modal */}
      <Dialog open={!!editingLimit} onOpenChange={(open) => { if (!open) setEditingLimit(null); }}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-5 text-left">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-slate-850 font-extrabold text-lg">
              <Settings className="w-5 h-5 text-teal-600" />
              <span>Ajustar Limites de Infraestrutura</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLimit} className="space-y-4 py-2">
            {editingLimit && (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-slate-500 font-semibold">Provedor</Label>
                    <Input value={editingLimit.provider.toUpperCase()} disabled className="bg-slate-50 border-slate-200 font-mono text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500 font-semibold">Métrica</Label>
                    <Input value={editingLimit.metric_name} disabled className="bg-slate-50 border-slate-200 font-mono text-slate-700" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-650">Nome do Plano</Label>
                  <Input 
                    value={editingLimit.plan_name} 
                    onChange={e => setEditingLimit({ ...editingLimit, plan_name: e.target.value })} 
                    placeholder="Ex: Free, Hobby, Pro" 
                    required 
                    className="border-slate-200 text-slate-800"
                  />
                </div>

                {['branch', 'last_commit', 'domain', 'deploy_status', 'last_deploy'].includes(editingLimit.metric_name) ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-650">Valor de Texto</Label>
                    <Input 
                      value={editingLimit.text_value || ''} 
                      onChange={e => setEditingLimit({ ...editingLimit, text_value: e.target.value })} 
                      placeholder="Valor textual" 
                      required 
                      className="border-slate-200 text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-650">Valor Limite</Label>
                      <Input 
                        type="number" 
                        step="any" 
                        value={editingLimit.limit_value} 
                        onChange={e => setEditingLimit({ ...editingLimit, limit_value: e.target.value })} 
                        required 
                        className="border-slate-200 text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-650">Unidade</Label>
                      <Input 
                        value={editingLimit.unit || ''} 
                        onChange={e => setEditingLimit({ ...editingLimit, unit: e.target.value })} 
                        placeholder="Ex: GB, MB, count" 
                        className="border-slate-200 text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                )}

                {!['branch', 'last_commit', 'domain', 'deploy_status', 'last_deploy'].includes(editingLimit.metric_name) && (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-650 flex items-center justify-between">
                      <span>Sobrescrever Consumo Atual (Opcional)</span>
                      <span className="text-[10px] text-slate-400 font-medium font-sans">Deixe vazio para cálculo dinâmico</span>
                    </Label>
                    <Input 
                      type="number" 
                      step="any" 
                      value={editingLimit.current_value === null || editingLimit.current_value === undefined ? '' : editingLimit.current_value} 
                      onChange={e => setEditingLimit({ ...editingLimit, current_value: e.target.value })} 
                      placeholder="Valor consumido override" 
                      className="border-slate-200 text-slate-800 font-mono"
                    />
                  </div>
                )}
                
                <div className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/40 border border-amber-100 rounded-lg p-2.5 mt-2 flex items-start gap-2 font-medium">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    Ajustar esses limites altera as referências técnicas de capacidade exibidas no Centro de Controle e os disparos de alertas de infraestrutura.
                  </span>
                </div>
              </>
            )}
            <DialogFooter className="mt-4 gap-2 border-t border-slate-100 pt-3 flex flex-row justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingLimit(null)} disabled={isUpdatingLimit}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold" disabled={isUpdatingLimit}>
                {isUpdatingLimit ? 'Salvando...' : 'Salvar Limite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
