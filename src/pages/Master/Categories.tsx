import React, { useState } from 'react';
import { useApp, Category } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle, Box, FileText, ShieldCheck, CheckSquare, FolderKanban } from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'Box', label: 'Box (Componentes)', icon: Box },
  { value: 'FileText', label: 'FileText (Documentos)', icon: FileText },
  { value: 'ShieldCheck', label: 'ShieldCheck (Normas)', icon: ShieldCheck },
  { value: 'CheckSquare', label: 'CheckSquare (Checklists)', icon: CheckSquare },
  { value: 'FolderKanban', label: 'FolderKanban (Projetos)', icon: FolderKanban },
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Box');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Box');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon);
    setStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
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

    const catData = {
      name,
      slug,
      description: description || undefined,
      icon,
      status,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, catData);
    } else {
      addCategory(catData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    setDeletingId(null);
  };

  // Helper to render icon component dynamically
  const renderIcon = (iconName: string) => {
    const matched = ICON_OPTIONS.find(o => o.value === iconName);
    if (matched) {
      const IconComponent = matched.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <Box className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Listagem de Categorias</h2>
          <p className="text-[13px] text-slate-500 mt-1">Defina as classificações estruturais para arquivos e recursos da plataforma.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[80px]">Ícone</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome / Slug</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 hidden md:table-cell">Descrição</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                      {renderIcon(cat.icon)}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="font-bold text-[14px] text-slate-900">{cat.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{cat.slug}</div>
                  </TableCell>
                  <TableCell className="align-middle hidden md:table-cell max-w-[400px] truncate text-[13px] text-slate-600">
                    {cat.description || <span className="text-slate-400 italic">Sem descrição disponível</span>}
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={cat.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
                    }>
                      {cat.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(cat)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(cat.id)}
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
              <h3 className="font-bold text-slate-900 text-[15px]">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name" className="text-xs font-bold text-slate-700">Nome da Categoria</Label>
                <Input 
                  id="cat-name" 
                  value={name} 
                  onChange={handleNameChange}
                  placeholder="Ex: Documentação Técnica" 
                  required 
                  className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-slug" className="text-xs font-bold text-slate-700">Slug (Gerado Automaticamente)</Label>
                <Input 
                  id="cat-slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="documentacao-tecnica" 
                  required 
                  className="h-10 text-[14px] font-mono rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-icon" className="text-xs font-bold text-slate-700">Ícone Representativo</Label>
                <select 
                  id="cat-icon" 
                  value={icon} 
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc" className="text-xs font-bold text-slate-700">Descrição</Label>
                <Textarea 
                  id="cat-desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a finalidade ou tipo de arquivos agrupados nesta categoria..." 
                  className="text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 min-h-[80px]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-status" className="text-xs font-bold text-slate-700">Status</Label>
                <select 
                  id="cat-status" 
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
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Categoria?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Tem certeza que deseja excluir esta categoria? Todos os arquivos e downloads vinculados a ela serão desvinculados ou removidos.
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
