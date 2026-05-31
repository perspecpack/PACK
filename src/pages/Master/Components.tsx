import React, { useState } from 'react';
import { useApp, ComponentEntry, TechCategory } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle, FileText, Image, HardDrive } from 'lucide-react';

const TECH_CATEGORIES: { value: TechCategory; label: string }[] = [
  { value: 'porta_etiquetas', label: 'Porta Etiquetas' },
  { value: 'rodizios', label: 'Rodízios' },
  { value: 'travas_canhao', label: 'Travas Canhão' },
  { value: 'engates', label: 'Engates' },
  { value: 'batentes', label: 'Batentes' },
  { value: 'agv', label: 'AGV' },
  { value: 'olhais', label: 'Olhais' },
  { value: 'estruturas', label: 'Estruturas' },
  { value: 'skids', label: 'Skids' },
  { value: 'colunas_empilhamento', label: 'Colunas de Empilhamento' },
];

export default function Components() {
  const { components, oems, addComponent, updateComponent, deleteComponent } = useApp();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentEntry | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [oemId, setOemId] = useState('');
  const [techCategory, setTechCategory] = useState<TechCategory>('rodizios');
  const [description, setDescription] = useState('');
  const [application, setApplication] = useState('');
  const [revision, setRevision] = useState('A');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [imageUrl, setImageUrl] = useState('');
  const [stepUrl, setStepUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [dwgUrl, setDwgUrl] = useState('');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingComponent(null);
    setName('');
    setOemId(oems[0]?.id || '');
    setTechCategory('rodizios');
    setDescription('');
    setApplication('');
    setRevision('A');
    setStatus('active');
    setImageUrl('');
    setStepUrl('');
    setPdfUrl('');
    setDwgUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (comp: ComponentEntry) => {
    setEditingComponent(comp);
    setName(comp.name);
    setOemId(comp.oemId);
    setTechCategory(comp.techCategory);
    setDescription(comp.description || '');
    setApplication(comp.application || '');
    setRevision(comp.revision);
    setStatus(comp.status);
    setImageUrl(comp.imageUrl || '');
    setStepUrl(comp.stepUrl || '');
    setPdfUrl(comp.pdfUrl || '');
    setDwgUrl(comp.dwgUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oemId) return;

    const componentData = {
      name,
      oemId,
      techCategory,
      description: description || undefined,
      application: application || undefined,
      revision,
      status,
      imageUrl: imageUrl || undefined,
      stepUrl: stepUrl || undefined,
      pdfUrl: pdfUrl || undefined,
      dwgUrl: dwgUrl || undefined,
    };

    if (editingComponent) {
      updateComponent(editingComponent.id, componentData);
    } else {
      addComponent(componentData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteComponent(id);
    setDeletingId(null);
  };

  // Helper names
  const getOEMName = (id: string) => oems.find(o => o.id === id)?.name || 'Desconhecido';
  const getTechCatLabel = (val: TechCategory) => TECH_CATEGORIES.find(tc => tc.value === val)?.label || val;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Componentes Homologados</h2>
          <p className="text-[13px] text-slate-500 mt-1">Gerencie a biblioteca de partes técnicas aprovadas para construção de embalagens.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Novo Componente
        </Button>
      </div>

      {/* Components Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[80px]">Imagem</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome / Categoria</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Organização</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 hidden md:table-cell">Revisão</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Arquivos CAD</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum componente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              components.map((comp) => (
                <TableRow key={comp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                      {comp.imageUrl ? (
                        <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                      ) : (
                        <HardDrive className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="font-bold text-[13px] text-slate-900">{comp.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{getTechCatLabel(comp.techCategory)}</div>
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600">
                    {getOEMName(comp.oemId)}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] font-semibold text-slate-700 font-mono hidden md:table-cell">
                    {comp.revision}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex gap-1">
                      {comp.stepUrl && <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded font-bold font-mono">STEP</span>}
                      {comp.pdfUrl && <span className="bg-red-50 border border-red-100 text-red-700 text-[9px] px-1 py-0.5 rounded font-bold font-mono">PDF</span>}
                      {comp.dwgUrl && <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[9px] px-1 py-0.5 rounded font-bold font-mono">DWG</span>}
                      {!comp.stepUrl && !comp.pdfUrl && !comp.dwgUrl && <span className="text-xs text-slate-400 italic">Nenhum</span>}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={comp.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
                    }>
                      {comp.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(comp)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(comp.id)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingComponent ? 'Editar Componente' : 'Novo Componente Homologado'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="comp-name" className="text-xs font-bold text-slate-700">Nome do Componente</Label>
                  <Input 
                    id="comp-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Rodízio Giratório Poliuretano 150mm" 
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-oem" className="text-xs font-bold text-slate-700">Organização</Label>
                  <select 
                    id="comp-oem" 
                    value={oemId} 
                    onChange={(e) => setOemId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    {oems.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-tech" className="text-xs font-bold text-slate-700">Categoria Técnica</Label>
                  <select 
                    id="comp-tech" 
                    value={techCategory} 
                    onChange={(e) => setTechCategory(e.target.value as TechCategory)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  >
                    {TECH_CATEGORIES.map(tc => (
                      <option key={tc.value} value={tc.value}>{tc.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-rev" className="text-xs font-bold text-slate-700">Revisão</Label>
                  <Input 
                    id="comp-rev" 
                    value={revision} 
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="Ex: A, 01, REV02" 
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comp-status" className="text-xs font-bold text-slate-700">Status</Label>
                  <select 
                    id="comp-status" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comp-desc" className="text-xs font-bold text-slate-700">Descrição Técnica</Label>
                <Textarea 
                  id="comp-desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informe as especificações, material, dimensões gerais..." 
                  className="text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 min-h-[60px]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comp-app" className="text-xs font-bold text-slate-700">Aplicação Recomendada</Label>
                <Input 
                  id="comp-app" 
                  value={application} 
                  onChange={(e) => setApplication(e.target.value)}
                  placeholder="Ex: Embalagens metálicas suspensas, racks de motores" 
                  className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-3.5 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Mídias e Arquivos 3D (Links Simulado)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-img" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Link da Imagem
                    </Label>
                    <Input 
                      id="comp-img" 
                      value={imageUrl} 
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="h-9 text-[13px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comp-step" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Arquivo STEP (.step)
                    </Label>
                    <Input 
                      id="comp-step" 
                      value={stepUrl} 
                      onChange={(e) => setStepUrl(e.target.value)}
                      placeholder="https://example.com/file.step" 
                      className="h-9 text-[13px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comp-pdf" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Desenho PDF (.pdf)
                    </Label>
                    <Input 
                      id="comp-pdf" 
                      value={pdfUrl} 
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://example.com/file.pdf" 
                      className="h-9 text-[13px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comp-dwg" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Desenho DWG (.dwg)
                    </Label>
                    <Input 
                      id="comp-dwg" 
                      value={dwgUrl} 
                      onChange={(e) => setDwgUrl(e.target.value)}
                      placeholder="https://example.com/file.dwg" 
                      className="h-9 text-[13px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                    />
                  </div>
                </div>
              </div>

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

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Componente?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Deseja realmente excluir este componente da biblioteca? Ele deixará de constar no catálogo público.
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
                  onClick={() => handleDelete(deletingId)}
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
