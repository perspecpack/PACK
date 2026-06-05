import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { 
  Building2, 
  Layers, 
  FileText, 
  ShieldCheck, 
  CheckSquare, 
  ArrowLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  // Keep declarations for typings but hide in standard module management as required
  reference_projects: {
    title: 'Projetos de Referência',
    desc: 'Estruturas homologadas e desenhos 3D para consulta',
    icon: Layers,
    color: 'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-100'
  },
  cad_library: {
    title: 'Biblioteca CAD',
    desc: 'Arquivos brutos em STEP, DWG e modelagens paramétricas',
    icon: Layers,
    color: 'from-teal-500/10 to-emerald-500/10 text-teal-600 border-teal-100'
  },
  procedures: {
    title: 'Procedimentos',
    desc: 'Manuais operacionais de montagem e logística',
    icon: Layers,
    color: 'from-slate-500/10 to-slate-500/10 text-slate-600 border-slate-100'
  }
};

export default function OrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  
  const { 
    organizations, 
    organizationModules, 
    technicalAreas,
    addTechnicalArea,
    updateTechnicalArea,
    deleteTechnicalArea,
    components, 
    documents, 
    standards, 
    checklists 
  } = useApp();

  const org = organizations.find(o => o.id === orgId);

  // Area Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any | null>(null);
  
  // Area Form states
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [areaIcon, setAreaIcon] = useState('📦');
  const [areaStatus, setAreaStatus] = useState<'active' | 'inactive'>('active');
  const [areaIsVisibleToUsers, setAreaIsVisibleToUsers] = useState(true);
  const [areaSortOrder, setAreaSortOrder] = useState(0);
  const [areaModules, setAreaModules] = useState<Record<ModuleType, boolean>>({
    components: true,
    documentation: true,
    standards: true,
    checklists: true,
    reference_projects: true,
    cad_library: false,
    procedures: false
  });

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Get technical areas for this organization
  const orgAreas = technicalAreas
    .filter(area => area.organizationId === orgId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get active modules list (only the four ones specified in requirements)
  const allowedModules: ModuleType[] = ['components', 'documentation', 'standards', 'checklists'];

  // Helper to count records inside a technical area
  const getRecordCount = (techAreaId: string, moduleType: ModuleType) => {
    switch (moduleType) {
      case 'components':
        return components.filter(c => c.organizationId === orgId && c.technicalAreaId === techAreaId).length;
      case 'documentation':
        return documents.filter(d => d.organizationId === orgId && d.technicalAreaId === techAreaId).length;
      case 'standards':
        return standards.filter(s => s.organizationId === orgId && s.technicalAreaId === techAreaId).length;
      case 'checklists':
        return checklists.filter(c => c.organizationId === orgId && c.technicalAreaId === techAreaId).length;
      default:
        return 0;
    }
  };

  const openAddModal = () => {
    setEditingArea(null);
    setAreaName('');
    setAreaDescription('');
    setAreaIcon('📦');
    setAreaStatus('active');
    setAreaIsVisibleToUsers(true);
    setAreaSortOrder(orgAreas.length + 1);
    setAreaModules({
      components: true,
      documentation: true,
      standards: true,
      checklists: true,
      reference_projects: true,
      cad_library: false,
      procedures: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (area: any) => {
    setEditingArea(area);
    setAreaName(area.name);
    setAreaDescription(area.description || '');
    setAreaIcon(area.icon);
    setAreaStatus(area.status);
    setAreaIsVisibleToUsers(area.isVisibleToUsers);
    setAreaSortOrder(area.sortOrder);
    
    // Load modules for this area
    const areaMods = organizationModules.filter(m => m.organizationId === orgId && m.technicalAreaId === area.id);
    const modMap: Record<ModuleType, boolean> = {
      components: false,
      documentation: false,
      standards: false,
      checklists: false,
      reference_projects: false,
      cad_library: false,
      procedures: false
    };
    areaMods.forEach(m => {
      modMap[m.moduleType] = m.enabled;
    });
    setAreaModules(modMap);
    
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    const areaData = {
      organizationId: orgId!,
      name: areaName.trim(),
      description: areaDescription.trim() || undefined,
      icon: areaIcon.trim() || '📂',
      status: areaStatus,
      isDefault: editingArea ? editingArea.isDefault : false,
      isVisibleToUsers: areaIsVisibleToUsers,
      sortOrder: areaSortOrder
    };

    if (editingArea) {
      updateTechnicalArea(editingArea.id, areaData, areaModules);
    } else {
      addTechnicalArea(areaData, areaModules);
    }
    setIsModalOpen(false);
  };

  const handleDeleteArea = (id: string) => {
    deleteTechnicalArea(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Back link */}
      <Link 
        to="/master/content" 
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Organizações
      </Link>

      {/* Org Header Card */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white border border-teal-950 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10 flex items-start md:items-center gap-4">
          <div className="w-28 h-16 bg-white border border-slate-200/10 rounded-xl flex items-center justify-center font-black text-slate-400 shadow-sm text-lg uppercase shrink-0 overflow-hidden p-2">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="max-w-full max-h-full object-contain" />
            ) : (
              org.name.substring(0, 2)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[24px] font-extrabold text-white tracking-tight">{org.name}</h2>
              <Badge className="bg-teal-500/20 text-[#00F59B] border border-teal-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {ORG_TYPE_LABELS[org.organizationType] || org.organizationType}
              </Badge>
            </div>
            <p className="text-slate-300 mt-2 text-[14px] max-w-[700px] leading-relaxed">
              {org.description || 'Nenhuma descrição detalhada informada.'}
            </p>
          </div>
        </div>
        <Button 
          onClick={openAddModal}
          className="relative z-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10 shrink-0 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          Nova Área Técnica
        </Button>
      </div>

      {/* Technical Areas Grid */}
      <div className="space-y-4">
        <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Áreas Técnicas da Organização</h3>
        
        {orgAreas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-medium">
            Nenhuma área técnica criada para esta organização. Clique em "Nova Área Técnica" para começar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orgAreas.map((area) => (
              <div key={area.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                
                {/* Area Header Row */}
                <div className="bg-slate-50/75 border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{area.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-[16px] text-slate-900">{area.name}</h4>
                        {area.isDefault && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">Padrão</span>
                        )}
                        <Badge className={area.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold' 
                          : 'bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold'
                        }>
                          {area.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Badge className={area.isVisibleToUsers
                          ? 'bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold flex items-center gap-1' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold flex items-center gap-1'
                        }>
                          {area.isVisibleToUsers ? (
                            <>
                              <Eye className="w-3 h-3" /> Visível
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Oculta
                            </>
                          )}
                        </Badge>
                      </div>
                      {area.description && (
                        <p className="text-[13px] text-slate-500 mt-1 font-medium leading-relaxed">{area.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions for technical area */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <Button 
                      onClick={() => openEditModal(area)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                      title="Editar Área Técnica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {!area.isDefault && (
                      <Button 
                        onClick={() => setDeletingId(area.id)}
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Excluir Área Técnica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Sub-grid with Content modules */}
                <div className="p-5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Módulos de Conteúdo</div>
                  {(() => {
                    const areaActiveModules = organizationModules.filter(m => m.organizationId === orgId && m.technicalAreaId === area.id && m.enabled && allowedModules.includes(m.moduleType));
                    return areaActiveModules.length === 0 ? (
                      <div className="text-slate-400 text-xs italic py-2">
                        Sem módulos de conteúdo habilitados para esta área técnica.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {areaActiveModules.map((mod) => {
                          const info = MODULE_INFO[mod.moduleType];
                          if (!info) return null;
                          const count = getRecordCount(area.id, mod.moduleType);
                          const Icon = info.icon;
                          
                          return (
                            <div
                              key={mod.id}
                              onClick={() => navigate(`/master/content/${orgId}/${area.id}/${mod.moduleType}`)}
                              className="bg-white border border-slate-200 hover:border-teal-400 p-4 rounded-xl shadow-sm hover:shadow cursor-pointer transition-all group flex flex-col justify-between h-28"
                            >
                              <div className="flex justify-between items-start">
                                <div className={`p-2 bg-gradient-to-br from-white to-slate-50 border rounded-lg shadow-sm ${info.color.split(' ')[2]}`}>
                                  <Icon className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-[20px] font-black text-slate-800 leading-none">
                                  {count}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="font-extrabold text-[13px] text-slate-800 group-hover:text-teal-600 transition-colors">
                                  {info.title}
                                </span>
                                <ChevronRight className="w-4 h-4 text-teal-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tech Area Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingArea ? 'Editar Área Técnica' : 'Nova Área Técnica'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="area-name" className="text-xs font-bold text-slate-700">Nome da Área Técnica</Label>
                <Input 
                  id="area-name" 
                  value={areaName} 
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="Ex: Embalagens Plásticas, Ergonomia" 
                  required 
                  className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area-desc" className="text-xs font-bold text-slate-700">Descrição</Label>
                <Textarea 
                  id="area-desc" 
                  value={areaDescription} 
                  onChange={(e) => setAreaDescription(e.target.value)}
                  placeholder="Descreva as especificidades desta área técnica..." 
                  className="text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 min-h-[70px]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="area-icon" className="text-xs font-bold text-slate-700">Emoji / Ícone</Label>
                  <Input 
                    id="area-icon" 
                    value={areaIcon} 
                    onChange={(e) => setAreaIcon(e.target.value)}
                    placeholder="Ex: 📦" 
                    required
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 text-center" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area-sort" className="text-xs font-bold text-slate-700">Ordem de Exibição</Label>
                  <Input 
                    id="area-sort" 
                    type="number" 
                    value={areaSortOrder} 
                    onChange={(e) => setAreaSortOrder(Number(e.target.value))}
                    required
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area-status" className="text-xs font-bold text-slate-700">Status</Label>
                <select 
                  id="area-status" 
                  value={areaStatus} 
                  onChange={(e) => setAreaStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Módulos Habilitados nesta Área</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5 mb-2">
                  {[
                    { id: 'components', label: 'Componentes Homologados' },
                    { id: 'documentation', label: 'Caderno de Encargos' },
                    { id: 'standards', label: 'Documentação Técnica' },
                    { id: 'checklists', label: 'Checklist de Validação' }
                  ].map((mod) => (
                    <label key={mod.id} className="flex items-center gap-2 text-[13px] font-medium text-slate-600 cursor-pointer select-none bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg hover:bg-slate-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={areaModules[mod.id as ModuleType] || false}
                        onChange={(e) => setAreaModules(prev => ({ ...prev, [mod.id]: e.target.checked }))}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] font-medium text-slate-600 cursor-pointer select-none bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg hover:bg-slate-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={areaIsVisibleToUsers}
                  onChange={(e) => setAreaIsVisibleToUsers(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>Visível para Usuários Finais</span>
              </label>

              <footer className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-lg text-slate-600 border-slate-300 font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg shadow-sm"
                >
                  Salvar
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Area Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Área Técnica?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  A exclusão removerá permanentemente esta área técnica e todos os seus componentes, cadernos de encargos, documentações e checklists. Essa ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 h-10 rounded-lg text-slate-600 border-slate-300 font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleDeleteArea(deletingId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-10 rounded-lg shadow-sm"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
