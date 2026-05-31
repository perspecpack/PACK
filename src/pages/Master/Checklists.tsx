import React, { useState } from 'react';
import { useApp, ChecklistEntry, ChecklistItem } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, AlertTriangle, PlusCircle, Trash } from 'lucide-react';

const CHECKLIST_CATEGORIES = [
  'Estrutura',
  'Empilhamento',
  'Ergonomia',
  'AGV',
  'Identificação',
  'Logística',
  'Segurança',
  'Documentação',
];

export default function Checklists() {
  const { checklists, oems, addChecklist, updateChecklist, deleteChecklist } = useApp();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistEntry | null>(null);

  // Form states - Checklist Metadata
  const [name, setName] = useState('');
  const [oemId, setOemId] = useState('');
  const [revision, setRevision] = useState('01');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Form states - Dynamic Items
  const [items, setItems] = useState<Omit<ChecklistItem, 'checklistId'>[]>([]);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingChecklist(null);
    setName('');
    setOemId(oems[0]?.id || '');
    setRevision('01');
    setStatus('active');
    setItems([
      { id: '', category: 'Estrutura', description: '', isMandatory: true, techRef: '', order: 1 }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (chk: ChecklistEntry) => {
    setEditingChecklist(chk);
    setName(chk.name);
    setOemId(chk.oemId);
    setRevision(chk.revision);
    setStatus(chk.status);
    setItems(chk.items.map(item => ({ ...item })));
    setIsModalOpen(true);
  };

  // Add Item to dynamic list
  const handleAddItemRow = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) + 1 : 1;
    setItems(prev => [
      ...prev,
      { id: '', category: 'Estrutura', description: '', isMandatory: true, techRef: '', order: nextOrder }
    ]);
  };

  // Remove Item from dynamic list
  const handleRemoveItemRow = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Change Item value in dynamic list
  const handleItemValueChange = (index: number, field: keyof Omit<ChecklistItem, 'id' | 'checklistId'>, value: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oemId) return;

    // Filter out rows without descriptions
    const validItems = items.filter(item => item.description.trim() !== '');

    const checklistData = {
      name,
      oemId,
      revision,
      status,
    };

    if (editingChecklist) {
      updateChecklist(editingChecklist.id, checklistData, validItems);
    } else {
      addChecklist(checklistData, validItems);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteChecklist(id);
    setDeletingId(null);
  };

  const getOEMName = (id: string) => oems.find(o => o.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Modelos de Checklists</h2>
          <p className="text-[13px] text-slate-500 mt-1">Crie e configure checklists e formulários de auditoria técnica para homologação de embalagens.</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-10 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          Novo Checklist
        </Button>
      </div>

      {/* Checklists Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Nome do Checklist</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12">Organização</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[100px]">Revisão</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Qtd. Requisitos</TableHead>
              <TableHead className="text-[12px] font-semibold text-slate-600 uppercase h-12 w-[120px]">Status</TableHead>
              <TableHead className="text-right text-[12px] font-semibold text-slate-600 uppercase h-12 pr-6 w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                  Nenhum checklist cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              checklists.map((chk) => (
                <TableRow key={chk.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="align-middle font-bold text-[13px] text-slate-900">
                    {chk.name}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] text-slate-600">
                    {getOEMName(chk.oemId)}
                  </TableCell>
                  <TableCell className="align-middle text-[13px] font-mono text-slate-700">
                    {chk.revision}
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="bg-teal-50 border border-teal-100 text-teal-700 font-bold px-2.5 py-0.5 rounded text-[11px]">
                      {chk.items.length} itens
                    </span>
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className={chk.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200 font-semibold'
                    }>
                      {chk.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right pr-6 space-x-1.5">
                    <Button 
                      onClick={() => openEditModal(chk)}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setDeletingId(chk.id)}
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-[850px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-[15px]">{editingChecklist ? 'Editar Checklist' : 'Novo Checklist de Organização'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Metadata Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="chk-name" className="text-xs font-bold text-slate-700">Nome do Checklist</Label>
                  <Input 
                    id="chk-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Checklist Geral de Embalagens Metálicas" 
                    required 
                    className="h-10 text-[13px] bg-white rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-oem" className="text-xs font-bold text-slate-700">Organização</Label>
                  <select 
                    id="chk-oem" 
                    value={oemId} 
                    onChange={(e) => setOemId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[13px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    {oems.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 font-mono">
                  <Label htmlFor="chk-rev" className="text-xs font-bold text-slate-700">Revisão</Label>
                  <Input 
                    id="chk-rev" 
                    value={revision} 
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="Ex: 01" 
                    required 
                    className="h-10 text-[13px] bg-white rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-status" className="text-xs font-bold text-slate-700">Status</Label>
                  <select 
                    id="chk-status" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[13px] focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Checklist Dynamic Requirements Area */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Itens e Critérios de Homologação</h4>
                  <Button 
                    type="button" 
                    onClick={handleAddItemRow}
                    variant="outline"
                    className="h-9 px-3 rounded-md text-[13px] text-teal-600 hover:text-teal-700 border-teal-200 hover:bg-teal-50 flex items-center gap-1.5 font-bold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Adicionar Critério
                  </Button>
                </div>

                {/* Items List Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-10 w-[60px]">Ordem</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-10 w-[140px]">Categoria</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-10">Descrição do Requisito</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-10 w-[110px]">Obrigatório?</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-10 w-[150px]">Ref. Técnica</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-600 uppercase h-10 w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-20 text-center text-slate-400 italic text-[13px]">
                            Nenhum critério inserido. Clique em "+ Adicionar Critério" para começar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, idx) => (
                          <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/20">
                            {/* Order */}
                            <TableCell className="align-middle py-2">
                              <Input 
                                type="number" 
                                value={item.order} 
                                onChange={(e) => handleItemValueChange(idx, 'order', parseInt(e.target.value) || 0)}
                                className="h-9 px-1 text-center text-[12px] font-semibold border-slate-200 focus:ring-teal-500 rounded-md"
                              />
                            </TableCell>

                            {/* Category */}
                            <TableCell className="align-middle py-2">
                              <select 
                                value={item.category} 
                                onChange={(e) => handleItemValueChange(idx, 'category', e.target.value)}
                                className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-[12px] focus:ring-teal-500 focus:border-teal-500 text-slate-800 font-medium"
                              >
                                {CHECKLIST_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </TableCell>

                            {/* Description */}
                            <TableCell className="align-middle py-2">
                              <Input 
                                value={item.description} 
                                onChange={(e) => handleItemValueChange(idx, 'description', e.target.value)}
                                placeholder="Descreva claramente o critério..." 
                                required
                                className="h-9 text-[12px] border-slate-200 focus:ring-teal-500 rounded-md"
                              />
                            </TableCell>

                            {/* Mandatory */}
                            <TableCell className="align-middle py-2">
                              <select 
                                value={item.isMandatory ? 'yes' : 'no'} 
                                onChange={(e) => handleItemValueChange(idx, 'isMandatory', e.target.value === 'yes')}
                                className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-[12px] focus:ring-teal-500 focus:border-teal-500 text-slate-800 font-medium"
                              >
                                <option value="yes">Sim</option>
                                <option value="no">Não</option>
                              </select>
                            </TableCell>

                            {/* Tech reference */}
                            <TableCell className="align-middle py-2">
                              <Input 
                                value={item.techRef || ''} 
                                onChange={(e) => handleItemValueChange(idx, 'techRef', e.target.value)}
                                placeholder="Norma / Capítulo" 
                                className="h-9 text-[12px] border-slate-200 focus:ring-teal-500 rounded-md"
                              />
                            </TableCell>

                            {/* Delete Action */}
                            <TableCell className="align-middle py-2 text-center">
                              <Button 
                                type="button" 
                                onClick={() => handleRemoveItemRow(idx)}
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
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
                <h3 className="font-extrabold text-slate-900 text-[16px]">Excluir Checklist?</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Tem certeza que deseja excluir permanentemente este checklist? Todos os critérios salvos nele serão removidos definitivamente.
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
