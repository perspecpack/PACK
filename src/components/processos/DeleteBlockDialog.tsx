import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteBlockDialog({ isOpen, onClose, onConfirm }: DeleteBlockDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-slate-200">
        <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-[15px] font-bold text-slate-800 tracking-tight">
              Deseja excluir este bloco?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Essa ação não poderá ser desfeita após o salvamento.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-9 px-4 text-xs rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="h-9 px-4 text-xs rounded-xl font-semibold cursor-pointer shadow-xs"
          >
            Excluir Bloco
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
