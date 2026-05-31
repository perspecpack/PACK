import React, { useState } from 'react';
import { useApp, OEM, OrganizationType } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

const ORG_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: 'oem', label: 'Montadora / OEM' },
  { value: 'tier1', label: 'Fornecedor Tier 1' },
  { value: 'component_manufacturer', label: 'Fabricante de componentes' },
  { value: 'industrial_client', label: 'Cliente industrial' },
  { value: 'internal_standard', label: 'Padrão interno PERSPECPACK' }
];

const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  oem: 'Montadora / OEM',
  tier1: 'Fornecedor Tier 1',
  component_manufacturer: 'Fabricante de componentes',
  industrial_client: 'Cliente industrial',
  internal_standard: 'Padrão interno PERSPECPACK'
};

export default function Organizations() {
  const { oems, addOEM, updateOEM, deleteOEM } = useApp();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOEM, setEditingOEM] = useState<OEM | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('oem');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingOEM(null);
    setName('');
    setSlug('');
    setOrganizationType('oem');
    setLogoUrl('');
    setDescription('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (oem: OEM) => {
    setEditingOEM(oem);
    setName(oem.name);
    setSlug(oem.slug);
    setOrganizationType(oem.organizationType || 'oem');
    setLogoUrl(oem.logoUrl || '');
    setDescription(oem.description || '');
    setStatus(oem.status);
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto slugify
    setSlug(val.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const oemData = {
      name,
      slug,
      organizationType,
      logoUrl: logoUrl || undefined,
      description: description || undefined,
      status,
    };

    if (editingOEM) {
      updateOEM(editingOEM.id, oemData);
    } else {
      addOEM(oemData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteOEM(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Listagem de Organizações</h2>
          <p className="text-[13px] text-slate-500 mt-1">Gerencie as fabricantes, parceiros e organizações do ecossistema.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Nova Organização
        </Button>
      </div>

      {/* Organizations Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[80px]">Logo</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome / Slug</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Tipo</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 hidden md:table-cell">Descrição</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {oems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                  Nenhuma organização cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              oems.map((oem) => (
                <TableRow key={oem.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle">
                    <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 shadow-sm text-sm uppercase">
                      {oem.logoUrl ? (
                        <img src={oem.logoUrl} alt={oem.name} className="w-8 h-8 object-contain rounded" />
                      ) : (
                        oem.name.substring(0, 2)
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="font-bold text-[14px] text-slate-900">{oem.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{oem.slug}</div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                      {ORG_TYPE_LABELS[oem.organizationType] || oem.organizationType}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle hidden md:table-cell max-w-[400px] truncate text-[13px] text-slate-600">
                    {oem.description || <span className="text-slate-400 italic">Sem descrição disponível</span>}
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={oem.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
                    }>
                      {oem.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(oem)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(oem.id)}
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingOEM ? 'Editar Organização' : 'Nova Organização'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name" className="text-xs font-bold text-slate-700">Nome da Organização</Label>
                <Input 
                  id="org-name" 
                  value={name} 
                  onChange={handleNameChange}
                  placeholder="Ex: Volkswagen, Gestamp" 
                  required 
                  className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-slug" className="text-xs font-bold text-slate-700">Slug (Gerado Automaticamente)</Label>
                <Input 
                  id="org-slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ex-volkswagen" 
                  required 
                  className="h-10 text-[14px] font-mono rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-type" className="text-xs font-bold text-slate-700">Tipo de Organização</Label>
                <select 
                  id="org-type" 
                  value={organizationType} 
                  onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  required
                >
                  {ORG_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-logo" className="text-xs font-bold text-slate-700">URL do Logo (Opcional)</Label>
                <Input 
                  id="org-logo" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png" 
                  className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-desc" className="text-xs font-bold text-slate-700">Descrição</Label>
                <Textarea 
                  id="org-desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escreva brevemente as diretrizes gerais de embalagem desta organização..." 
                  className="text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 min-h-[80px]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-status" className="text-xs font-bold text-slate-700">Status</Label>
                <select 
                  id="org-status" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
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
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Organização?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  A exclusão removerá permanentemente esta organização e todos os arquivos, componentes e checklists associados. Essa ação não pode ser desfeita.
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
