import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Label } from './label';
import { uploadFileToStorage, deleteFileFromStorage } from '@/lib/supabase';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  File, 
  Image as ImageIcon 
} from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  acceptedTypes: string;
  bucket: string;
  currentFileUrl?: string;
  onUploadComplete: (url: string, fileName: string, fileType: string) => void;
  onRemove: () => void;
  orgSlug: string;
  moduleType: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  acceptedTypes,
  bucket,
  currentFileUrl,
  onUploadComplete,
  onRemove,
  orgSlug,
  moduleType
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileNameFromUrl = (url?: string) => {
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      // Strip timestamp prefix from visual filename: YYYY-MM-DD-HHmmss-
      return lastPart.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, '');
    } catch (e) {
      return url;
    }
  };

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const { publicUrl } = await uploadFileToStorage(
        selectedFile,
        bucket,
        orgSlug || 'global',
        moduleType
      );

      const fileExtension = getFileExtension(selectedFile.name);
      onUploadComplete(publicUrl, selectedFile.name, fileExtension);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Erro ao realizar upload do arquivo. Verifique sua conexão e tente novamente.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveClick = async () => {
    if (currentFileUrl) {
      // Opt-out from blocking since this is local mockup or raw bucket deletion
      try {
        await deleteFileFromStorage(bucket, currentFileUrl);
      } catch (err) {
        console.error('Failed to delete file from storage:', err);
      }
    }
    setError(null);
    onRemove();
  };

  const isImage = acceptedTypes.includes('image') || 
                  (currentFileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(currentFileUrl));

  const fileName = getFileNameFromUrl(currentFileUrl);

  return (
    <div className="space-y-1.5 flex flex-col w-full">
      <Label className="text-xs font-bold text-slate-700">{label}</Label>
      
      <div className="relative border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-4 min-h-[58px]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedTypes}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex items-center gap-2 text-slate-500 text-[13px] font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Fazendo upload do arquivo...</span>
          </div>
        ) : currentFileUrl ? (
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className="p-2 bg-teal-50 border border-teal-100 text-teal-600 rounded-md shrink-0">
              {isImage ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <File className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col text-left overflow-hidden flex-1">
              <span className="text-[13px] font-bold text-slate-800 truncate" title={fileName}>
                {fileName}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-extrabold mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Upload concluído
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-slate-400 text-[13px] font-medium italic">
            <FileUp className="w-4 h-4 text-slate-400" />
            <span>Nenhum arquivo selecionado</span>
          </div>
        )}

        {!isUploading && (
          <div>
            {currentFileUrl ? (
              <Button
                type="button"
                onClick={handleRemoveClick}
                variant="ghost"
                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md flex items-center gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSelectClick}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold h-8.5 px-3.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
              >
                <FileUp className="w-3.5 h-3.5" />
                Selecionar arquivo
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 border border-red-100 px-3 py-2 rounded-lg mt-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
