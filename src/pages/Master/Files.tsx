import React from 'react';
import { useApp } from '@/src/context/AppContext';
import { ModuleType } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';

interface FileHistoryEntry {
  id: string;
  name: string;
  organizationName: string;
  category: string;
  fileType: string;
  revision: string;
  status: 'published' | 'draft';
  fileUrl: string;
  createdAt: string;
}

export default function Files() {
  const { 
    organizations, 
    organizationModules, 
    components, 
    documents, 
    standards, 
    checklists 
  } = useApp();

  // Helper to check if a module is enabled for an organization/area
  const isModuleEnabledForArea = (orgId: string, technicalAreaId: string | undefined, moduleType: ModuleType) => {
    if (!technicalAreaId) return false;
    const mod = organizationModules.find(
      m => m.organizationId === orgId && m.technicalAreaId === technicalAreaId && m.moduleType === moduleType
    );
    return mod ? mod.enabled : false;
  };

  // Helper to check if an organization exists and is active
  const isOrgActive = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.status === 'active' : false;
  };

  // Helper to get organization name
  const getOrgName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || 'Desconhecido';
  };

  // Helper to check if it's a real file upload (and not a dummy/mock seed file)
  // Real uploads have Supabase URL and do not contain 'example.com'
  const isRealUpload = (url?: string) => {
    return !!(
      url && 
      !url.includes('example.com') && 
      (url.includes('.supabase.co') || url.includes('/storage/v1/object/'))
    );
  };

  // Helper to extract file name from URL
  const getFileNameFromUrl = (url?: string) => {
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      // Strip timestamp prefix: YYYY-MM-DD-HHmmss-
      return lastPart.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, '');
    } catch (e) {
      return url || '';
    }
  };

  // Helper to extract file extension
  const getFileExtension = (url?: string) => {
    if (!url) return '';
    const parts = url.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].split('?')[0].toUpperCase();
    }
    return '';
  };

  const gatheredFiles: FileHistoryEntry[] = [];

  // 1. Components (Module: components)
  components.forEach(comp => {
    if (isOrgActive(comp.organizationId) && isModuleEnabledForArea(comp.organizationId, comp.technicalAreaId, 'components')) {
      if (isRealUpload(comp.stepFileUrl)) {
        gatheredFiles.push({
          id: `${comp.id}-step`,
          name: getFileNameFromUrl(comp.stepFileUrl),
          organizationName: getOrgName(comp.organizationId),
          category: 'Componentes Homologados',
          fileType: 'STEP',
          revision: comp.revision,
          status: comp.status === 'active' ? 'published' : 'draft',
          fileUrl: comp.stepFileUrl!,
          createdAt: comp.createdAt
        });
      }
      if (isRealUpload(comp.pdfFileUrl)) {
        gatheredFiles.push({
          id: `${comp.id}-pdf`,
          name: getFileNameFromUrl(comp.pdfFileUrl),
          organizationName: getOrgName(comp.organizationId),
          category: 'Componentes Homologados',
          fileType: 'PDF',
          revision: comp.revision,
          status: comp.status === 'active' ? 'published' : 'draft',
          fileUrl: comp.pdfFileUrl!,
          createdAt: comp.createdAt
        });
      }
      if (isRealUpload(comp.dwgFileUrl)) {
        gatheredFiles.push({
          id: `${comp.id}-dwg`,
          name: getFileNameFromUrl(comp.dwgFileUrl),
          organizationName: getOrgName(comp.organizationId),
          category: 'Componentes Homologados',
          fileType: 'DWG',
          revision: comp.revision,
          status: comp.status === 'active' ? 'published' : 'draft',
          fileUrl: comp.dwgFileUrl!,
          createdAt: comp.createdAt
        });
      }
    }
  });

  // 2. Documents (Module: documentation)
  documents.forEach(doc => {
    if (isOrgActive(doc.organizationId) && isModuleEnabledForArea(doc.organizationId, doc.technicalAreaId, 'documentation')) {
      if (isRealUpload(doc.fileUrl)) {
        gatheredFiles.push({
          id: doc.id,
          name: doc.fileName || getFileNameFromUrl(doc.fileUrl),
          organizationName: getOrgName(doc.organizationId),
          category: 'Caderno de Encargos',
          fileType: doc.fileType || getFileExtension(doc.fileUrl) || 'PDF',
          revision: doc.revision,
          status: doc.status === 'active' ? 'published' : 'draft',
          fileUrl: doc.fileUrl!,
          createdAt: doc.createdAt
        });
      }
    }
  });

  // 3. Standards (Module: standards)
  standards.forEach(std => {
    if (isOrgActive(std.organizationId) && isModuleEnabledForArea(std.organizationId, std.technicalAreaId, 'standards')) {
      if (isRealUpload(std.fileUrl)) {
        gatheredFiles.push({
          id: std.id,
          name: std.fileName || getFileNameFromUrl(std.fileUrl),
          organizationName: getOrgName(std.organizationId),
          category: 'Documentação Técnica',
          fileType: std.fileType || getFileExtension(std.fileUrl) || 'PDF',
          revision: std.revision,
          status: std.status === 'active' ? 'published' : 'draft',
          fileUrl: std.fileUrl!,
          createdAt: std.createdAt
        });
      }
    }
  });

  // 4. Checklists (Module: checklists)
  checklists.forEach(chk => {
    if (isOrgActive(chk.organizationId) && isModuleEnabledForArea(chk.organizationId, chk.technicalAreaId, 'checklists')) {
      if (isRealUpload(chk.fileUrl)) {
        gatheredFiles.push({
          id: chk.id,
          name: chk.fileName || getFileNameFromUrl(chk.fileUrl),
          organizationName: getOrgName(chk.organizationId),
          category: 'Checklist de Validação',
          fileType: chk.fileType || getFileExtension(chk.fileUrl) || 'XLSX',
          revision: chk.revision,
          status: chk.status === 'active' ? 'published' : 'draft',
          fileUrl: chk.fileUrl!,
          createdAt: chk.createdAt
        });
      }
    }
  });

  // Sort files by createdAt descending and take top 30
  const sortedFiles = gatheredFiles
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 30);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-[26px] font-extrabold tracking-tight">Central de Uploads</h2>
          <p className="text-slate-300 mt-2 text-[14px] max-w-[650px] leading-relaxed">
            Histórico e consulta rápida dos últimos 30 arquivos enviados para os módulos habilitados de cada cliente.
          </p>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome do Arquivo</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Organização</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 hidden md:table-cell">Categoria</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[80px]">Tipo</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[80px]">Rev.</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum arquivo enviado ao sistema.
                </TableCell>
              </TableRow>
            ) : (
              sortedFiles.map((file) => (
                <TableRow key={file.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle font-bold text-[13px] text-slate-900 max-w-[280px] truncate">
                    <a 
                      href={file.fileUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 shrink-0 text-teal-600/70" />
                      {file.name}
                    </a>
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600">
                    {file.organizationName}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600 hidden md:table-cell">
                    {file.category}
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                      {file.fileType}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle text-[13px] font-semibold text-slate-700 font-mono">
                    {file.revision}
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={file.status === 'published' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold'
                    }>
                      {file.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
