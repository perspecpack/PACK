import React, { useState } from 'react';
import { useApp, ProjectEntry } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle, Image, Paperclip } from 'lucide-react';

export default function Projects() {
  const { projects, oems, files, addProject, updateProject, deleteProject } = useApp();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectEntry | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [oemId, setOemId] = useState('');
  const [packagingType, setPackagingType] = useState('Rack Metálico');
  const [description, setDescription] = useState('');
  const [application, setApplication] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [linkedDocIds, setLinkedDocIds] = useState<string[]>([]);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingProject(null);
    setName('');
    setOemId(oems[0]?.id || '');
    setPackagingType('Rack Metálico');
    setDescription('');
    setApplication('');
    setImageUrl('');
    setStatus('active');
    setLinkedDocIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (proj: ProjectEntry) => {
    setEditingProject(proj);
    setName(proj.name);
    setOemId(proj.oemId);
    setPackagingType(proj.packagingType);
    setDescription(proj.description || '');
    setApplication(proj.application || '');
    setImageUrl(proj.imageUrl || '');
    setStatus(proj.status);
    setLinkedDocIds(proj.linkedDocIds || []);
    setIsModalOpen(true);
  };

  const handleToggleDocLink = (docId: string) => {
    setLinkedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oemId) return;

    const projectData = {
      name,
      oemId,
      packagingType,
      description: description || undefined,
      application: application || undefined,
      imageUrl: imageUrl || undefined,
      linkedDocIds,
      status,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeletingId(null);
  };

  // Helpers
  const getOEMName = (id: string) => oems.find(o => o.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Projetos de Referência</h2>
          <p className="text-[13px] text-slate-500 mt-1">Gerencie modelagens, desenhos e especificações de embalagens homologadas de referência.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[80px]">Imagem</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome / Tipo</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Organização</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 hidden md:table-cell">Doc. Vinculados</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum projeto de referência cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((proj) => (
                <TableRow key={proj.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                      {proj.imageUrl ? (
                        <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="font-bold text-[13px] text-slate-900">{proj.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{proj.packagingType}</div>
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600">
                    {getOEMName(proj.oemId)}
                  </TableCell>
                  <TableCell className="align-middle hidden md:table-cell">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5 w-max">
                      <Paperclip className="w-3.5 h-3.5" />
                      {proj.linkedDocIds?.length || 0} arquivos
                    </span>
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={proj.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
                    }>
                      {proj.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(proj)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(proj.id)}
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[650px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingProject ? 'Editar Projeto de Referência' : 'Novo Projeto de Referência'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="proj-name" className="text-xs font-bold text-slate-700">Nome do Projeto de Referência</Label>
                  <Input 
                    id="proj-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Rack Metálico Taos Parachoque" 
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-oem" className="text-xs font-bold text-slate-700">Organização</Label>
                  <select 
                    id="proj-oem" 
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
                  <Label htmlFor="proj-type" className="text-xs font-bold text-slate-700">Tipo de Embalagem</Label>
                  <Input 
                    id="proj-type" 
                    value={packagingType} 
                    onChange={(e) => setPackagingType(e.target.value)}
                    placeholder="Ex: Rack Metálico, Caixas KLT, Palete" 
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-img" className="text-xs font-bold text-slate-700">Imagem do Projeto (URL)</Label>
                  <Input 
                    id="proj-img" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..." 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-status" className="text-xs font-bold text-slate-700">Status</Label>
                  <select 
                    id="proj-status" 
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
                <Label htmlFor="proj-desc" className="text-xs font-bold text-slate-700">Descrição</Label>
                <Textarea 
                  id="proj-desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informe os requisitos específicos desta embalagem, sua capacidade de carga..." 
                  className="text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 min-h-[60px]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-app" className="text-xs font-bold text-slate-700">Aplicação Recomendada</Label>
                <Input 
                  id="proj-app" 
                  value={application} 
                  onChange={(e) => setApplication(e.target.value)}
                  placeholder="Ex: Armazenamento interno de parachoques dianteiros" 
                  className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                />
              </div>

              {/* Linked Documents Multi-select */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Vincular Documentos Existentes</Label>
                <p className="text-[11px] text-slate-500 leading-tight">Escolha os cadernos de encargos, normas ou modelagens 3D que fazem parte deste projeto.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto border border-slate-200 p-3 rounded-lg bg-slate-50">
                  {files.length === 0 ? (
                    <span className="text-xs text-slate-400 italic col-span-2">Nenhum arquivo cadastrado para vinculação.</span>
                  ) : (
                    files.map(file => (
                      <label 
                        key={file.id} 
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium cursor-pointer hover:bg-slate-50"
                      >
                        <input 
                          type="checkbox" 
                          checked={linkedDocIds.includes(file.id)}
                          onChange={() => handleToggleDocLink(file.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span className="truncate flex-1" title={file.name}>{file.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono font-bold uppercase">{file.fileType}</span>
                      </label>
                    ))
                  )}
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
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Projeto de Referência?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Tem certeza de que deseja excluir este projeto de referência? Esta ação é irreversível.
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
