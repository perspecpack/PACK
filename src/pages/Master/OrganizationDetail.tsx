import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { 
  Building2, 
  Layers, 
  FileText, 
  ShieldCheck, 
  CheckSquare, 
  FolderKanban, 
  ArrowLeft,
  ChevronRight,
  HardDrive,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleType } from '@/src/types';

const ORG_TYPE_LABELS: Record<string, string> = {
  oem: 'Montadora',
  component_manufacturer: 'Fabricante de Componentes Automotivos',
  packaging_supplier: 'Fornecedor de Componentes para Embalagens Metálicas',
  packaging_manufacturer: 'Fabricante de Embalagens Metálicas'
};

const MODULE_INFO: Record<ModuleType, { title: string; desc: string; icon: React.ComponentType<any>; color: string }> = {
  components: {
    title: 'Componentes Homologados',
    desc: 'Biblioteca de partes técnicas e acoplamentos aprovados',
    icon: Layers,
    color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-100'
  },
  documentation: {
    title: 'Caderno de Encargos',
    desc: 'Cadernos de encargos, manuais e anexos da engenharia',
    icon: FileText,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-100'
  },
  standards: {
    title: 'Documentação Técnica',
    desc: 'Normas de empilhamento, skids, AGV e ergonomia',
    icon: ShieldCheck,
    color: 'from-blue-500/10 to-sky-500/10 text-blue-600 border-blue-100'
  },
  checklists: {
    title: 'Checklist de Validação',
    desc: 'Templates de inspeção e conformidade física',
    icon: CheckSquare,
    color: 'from-emerald-500/10 to-green-500/10 text-emerald-600 border-emerald-100'
  },
  reference_projects: {
    title: 'Projetos de Referência',
    desc: 'Estruturas homologadas e desenhos 3D para consulta',
    icon: FolderKanban,
    color: 'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-100'
  },
  cad_library: {
    title: 'Biblioteca CAD',
    desc: 'Arquivos brutos em STEP, DWG e modelagens paramétricas',
    icon: HardDrive,
    color: 'from-teal-500/10 to-emerald-500/10 text-teal-600 border-teal-100'
  },
  procedures: {
    title: 'Procedimentos',
    desc: 'Manuais operacionais de montagem e logística',
    icon: BookOpen,
    color: 'from-slate-500/10 to-slate-500/10 text-slate-600 border-slate-100'
  }
};

export default function OrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  
  const { 
    organizations, 
    organizationModules, 
    components, 
    documents, 
    standards, 
    checklists, 
    referenceProjects 
  } = useApp();

  const org = organizations.find(o => o.id === orgId);

  if (!org) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-[600px] mx-auto space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg">Organização não encontrada</h3>
        <p className="text-slate-500">A organização que você está tentando acessar não existe ou foi excluída.</p>
        <Button onClick={() => navigate('/master/content')} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
          Voltar para Conteúdo
        </Button>
      </div>
    );
  }

  // Get active modules for this organization
  const allowedModules = ['components', 'documentation', 'standards', 'checklists'];
  const activeModules = organizationModules.filter(m => m.organizationId === orgId && m.enabled && allowedModules.includes(m.moduleType));

  // Helper to get real records count per module
  const getRecordCount = (moduleType: ModuleType) => {
    switch (moduleType) {
      case 'components':
        return components.filter(c => c.organizationId === orgId).length;
      case 'documentation':
        return documents.filter(d => d.organizationId === orgId).length;
      case 'standards':
        return standards.filter(s => s.organizationId === orgId).length;
      case 'checklists':
        return checklists.filter(c => c.organizationId === orgId).length;
      case 'reference_projects':
        return referenceProjects.filter(p => p.organizationId === orgId).length;
      default:
        return 0; // fallback for cad_library or procedures mock
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Back to Content list */}
      <Link 
        to="/master/content" 
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Organizações
      </Link>

      {/* Organization Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 shadow-sm text-lg uppercase shrink-0">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-12 h-12 object-contain rounded" />
            ) : (
              org.name.substring(0, 2)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight">{org.name}</h2>
              <Badge className="bg-slate-50 text-slate-600 border border-slate-200/80 text-[11px] font-bold px-2 py-0.5">
                {ORG_TYPE_LABELS[org.organizationType] || org.organizationType}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-500 mt-1 max-w-[700px] leading-relaxed">
              {org.description || 'Nenhuma descrição detalhada informada.'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Modules Cards */}
      <div>
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider mb-4">Módulos Habilitados</h3>
        {activeModules.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-medium">
            Nenhum módulo habilitado para esta organização. Vá na aba "Organizações" para gerenciar os módulos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeModules.map((mod) => {
              const info = MODULE_INFO[mod.moduleType];
              if (!info) return null;
              
              const count = getRecordCount(mod.moduleType);
              const Icon = info.icon;
              
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(`/master/content/${orgId}/${mod.moduleType}`)}
                  className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between h-44"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 bg-gradient-to-br from-white to-slate-50 border rounded-lg shadow-sm ${info.color.split(' ')[2]}`}>
                        <Icon className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[28px] font-black text-slate-800 leading-none">
                        {count}
                      </span>
                    </div>
                    
                    <h4 className="font-extrabold text-[15px] text-slate-900 mt-4 group-hover:text-teal-600 transition-colors">
                      {info.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-normal mt-0.5">
                      {info.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-3 mt-3 border-t border-slate-100/60">
                    <span className="text-[12px] font-bold text-teal-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Gerenciar
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
