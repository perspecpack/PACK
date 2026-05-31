import React, { useState } from 'react';
import { useApp, FileEntry, FileType } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle, FileUp } from 'lucide-react';

const FILE_TYPES: FileType[] = ['STEP', 'PDF', 'DWG', 'XLSX', 'DOCX', 'PNG', 'JPG'];

export default function Files() {
  const { files, oems, categories, addFile, updateFile, deleteFile } = useApp();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileEntry | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [oemId, setOemId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fileType, setFileType] = useState<FileType>('PDF');
  const [revision, setRevision] = useState('01');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [fileUrl, setFileUrl] = useState('');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingFile(null);
    setName('');
    // Pick first active OEM and category by default
    setOemId(oems[0]?.id || '');
    setCategoryId(categories[0]?.id || '');
    setFileType('PDF');
    setRevision('01');
    setDescription('');
    setStatus('published');
    setFileUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (file: FileEntry) => {
    setEditingFile(file);
    setName(file.name);
    setOemId(file.oemId);
    setCategoryId(file.categoryId);
    setFileType(file.fileType);
    setRevision(file.revision);
    setDescription(file.description || '');
    setStatus(file.status);
    setFileUrl(file.fileUrl);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oemId || !categoryId) return;

    const fileData = {
      name,
      oemId,
      categoryId,
      fileType,
      revision,
      description: description || undefined,
      status,
      fileUrl: fileUrl || `https://example.com/files/${name.toLowerCase().replace(/\s+/g, '_')}`,
    };

    if (editingFile) {
      updateFile(editingFile.id, fileData);
    } else {
      addFile(fileData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteFile(id);
    setDeletingId(null);
  };

  // Helper names
  const getOEMName = (id: string) => oems.find(o => o.id === id)?.name || 'Desconhecido';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Listagem de Arquivos</h2>
          <p className="text-[13px] text-slate-500 mt-1">Gerencie normas, modelagens 3D (CAD), cadernos de encargos e checklists técnicos.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Arquivo
        </Button>
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
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum arquivo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle font-bold text-[13px] text-slate-900 max-w-[280px] truncate">
                    {file.name}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600">
                    {getOEMName(file.oemId)}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600 hidden md:table-cell">
                    {getCategoryName(file.categoryId)}
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
                      : 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold'
                    }>
                      {file.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(file)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(file.id)}
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[550px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingFile ? 'Editar Arquivo' : 'Cadastrar Novo Arquivo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="file-name" className="text-xs font-bold text-slate-700">Nome do Arquivo</Label>
                  <Input 
                    id="file-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Suporte_Porta_Etiqueta_REV03.step" 
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="file-oem" className="text-xs font-bold text-slate-700">Organização Vinculada</Label>
                  <select 
                    id="file-oem" 
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
                  <Label htmlFor="file-cat" className="text-xs font-bold text-slate-700">Categoria Vinculada</Label>
                  <select 
                    id="file-cat" 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="file-type" className="text-xs font-bold text-slate-700">Tipo de Arquivo</Label>
                  <select 
                    id="file-type" 
                    value={fileType} 
                    onChange={(e) => setFileType(e.target.value as FileType)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  >
                    {FILE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="file-rev" className="text-xs font-bold text-slate-700">Revisão</Label>
                  <Input 
                    id="file-rev" 
                    value={revision} 
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="Ex: 01, A, 2026" 
                    required 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="file-desc" className="text-xs font-bold text-slate-700">Descrição</Label>
                <Textarea 
                  id="file-desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escreva brevemente sobre a utilidade deste documento ou arquivo técnico..." 
                  className="text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 min-h-[70px]" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="file-upload" className="text-xs font-bold text-slate-700">URL de Download / Anexo (Simulação)</Label>
                <div className="relative">
                  <Input 
                    id="file-upload" 
                    value={fileUrl} 
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://example.com/files/documento.pdf" 
                    className="h-10 text-[14px] rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 pl-10" 
                  />
                  <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="file-status" className="text-xs font-bold text-slate-700">Status de Publicação</Label>
                <select 
                  id="file-status" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                >
                  <option value="published">Publicado (Visível para Usuário Final)</option>
                  <option value="draft">Rascunho (Privado na Área Master)</option>
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
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Arquivo?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Tem certeza de que deseja excluir este arquivo técnico? Esta ação é irreversível e o arquivo ficará indisponível para download.
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
