import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Building2, ChevronRight, Layers, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ORG_TYPE_LABELS: Record<string, string> = {
  oem: 'Montadora',
  component_manufacturer: 'Fabricante de Componentes Automotivos',
  packaging_supplier: 'Fornecedor de Componentes para Embalagens Metálicas',
  packaging_manufacturer: 'Fabricante de Embalagens Metálicas'
};

export default function Content() {
  const { organizations, organizationModules } = useApp();
  const navigate = useNavigate();

  // Filter active organizations
  const activeOrgs = organizations.filter(o => o.status === 'active');

  const getEnabledModulesCount = (orgId: string) => {
    const allowedModules = ['components', 'documentation', 'standards', 'checklists'];
    return organizationModules.filter(m => m.organizationId === orgId && m.enabled && allowedModules.includes(m.moduleType)).length;
  };

  const handleOrgClick = (id: string) => {
    navigate(`/master/content/${id}`);
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Page Header banner */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-[26px] font-extrabold tracking-tight">Gestão de Conteúdo</h2>
          <p className="text-slate-300 mt-2 text-[14px] max-w-[650px] leading-relaxed">
            Selecione uma organização abaixo para visualizar e gerenciar suas bibliotecas específicas de componentes, especificações técnicas, checklists e modelagens.
          </p>
        </div>
      </div>

      {/* Grid listing organizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrgs.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-medium">
            Nenhuma organização ativa disponível para gestão de conteúdo. Cadastre uma organização na aba "Organizações".
          </div>
        ) : (
          activeOrgs.map((org) => {
            const modulesCount = getEnabledModulesCount(org.id);
            return (
              <div
                key={org.id}
                onClick={() => handleOrgClick(org.id)}
                className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="w-20 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-400 shadow-sm text-sm uppercase overflow-hidden p-1.5 shrink-0">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt={org.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        org.name.substring(0, 2)
                      )}
                    </div>
                    <Badge className="bg-slate-50 text-slate-600 border border-slate-200/80 text-[11px] font-bold px-2 py-0.5">
                      {ORG_TYPE_LABELS[org.organizationType] || org.organizationType}
                    </Badge>
                  </div>
                  
                  <h3 className="font-extrabold text-[16px] text-slate-900 mt-4 group-hover:text-teal-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {org.description || 'Nenhuma descrição informada.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                  <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
                    {modulesCount} módulo(s) ativo(s)
                  </span>
                  <span className="text-[12px] font-extrabold text-teal-600 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Acessar
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
