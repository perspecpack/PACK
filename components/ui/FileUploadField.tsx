import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Label } from './label';
import { uploadFileToStorage, deleteFileFromStorage, supabase } from '@/lib/supabase';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  File, 
  Image as ImageIcon,
  Copy,
  X
} from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  acceptedTypes: string;
  bucket: string;
  currentFileUrl?: string;
  onUploadComplete: (
    url: string, 
    fileName: string, 
    fileType: string, 
    metadata?: { hash: string; size: number; mimeType: string; path: string }
  ) => void;
  onRemove: () => void;
  orgSlug: string;
  moduleType: string;
  revision?: string;
}

const UPLOAD_LIMITS: Record<string, { size: number; label: string }> = {
  pdf: { size: 20 * 1024 * 1024, label: '20 MB' },
  step: { size: 50 * 1024 * 1024, label: '50 MB' },
  stp: { size: 50 * 1024 * 1024, label: '50 MB' },
  image: { size: 5 * 1024 * 1024, label: '5 MB' },
  other: { size: 10 * 1024 * 1024, label: '10 MB' }
};

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  acceptedTypes,
  bucket,
  currentFileUrl,
  onUploadComplete,
  onRemove,
  orgSlug,
  moduleType,
  revision
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de duplicidade
  const [duplicateInfo, setDuplicateInfo] = useState<{
    org: string;
    title: string;
    code: string;
    revision: string;
    date: string;
    url: string;
    path: string;
    hash: string;
    size: number;
    mimeType: string;
    fileName: string;
  } | null>(null);

  // Determinar limite de tamanho antes do upload
  const getLimitInfo = () => {
    if (acceptedTypes.includes('application/pdf')) {
      return UPLOAD_LIMITS.pdf;
    } else if (acceptedTypes.includes('.step') || acceptedTypes.includes('.stp')) {
      return UPLOAD_LIMITS.step;
    } else if (acceptedTypes.includes('image')) {
      return UPLOAD_LIMITS.image;
    }
    return UPLOAD_LIMITS.other;
  };

  const limitInfo = getLimitInfo();

  const getFileNameFromUrl = (url?: string) => {
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      // Strip timestamp prefix or uuid prefix:
      return lastPart.replace(/^\d{4}-\d{2}-\d{2}-\d{6}-/, '').replace(/^[a-f0-9-]{36}\./, 'uuid.');
    } catch (e) {
      return url;
    }
  };

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  // Cálculo do hash SHA-256 do arquivo local
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Checar duplicidade no banco
  const checkDuplicateFileInDb = async (hash: string) => {
    if (!supabase) return null;
    
    // Buscar em documentos
    const { data: docData } = await supabase
      .from('documents')
      .select('id, title, revision, created_at, file_url, file_name, file_size, mime_type, org:organizations(name)')
      .eq('file_hash', hash)
      .limit(1);
      
    if (docData && docData.length > 0) {
      const doc = docData[0];
      return {
        org: (doc.org as any)?.name || 'Desconhecida',
        title: doc.title,
        code: doc.id.substring(0, 8),
        revision: doc.revision,
        date: doc.created_at,
        url: doc.file_url,
        fileName: doc.file_name,
        size: Number(doc.file_size || 0),
        mimeType: doc.mime_type || 'application/octet-stream'
      };
    }
    
    // Buscar em normas
    const { data: stdData } = await supabase
      .from('standards')
      .select('id, title, revision, created_at, file_url, file_name, file_size, mime_type, org:organizations(name)')
      .eq('file_hash', hash)
      .limit(1);
      
    if (stdData && stdData.length > 0) {
      const std = stdData[0];
      return {
        org: (std.org as any)?.name || 'Desconhecida',
        title: std.title,
        code: std.id.substring(0, 8),
        revision: std.revision,
        date: std.created_at,
        url: std.file_url,
        fileName: std.file_name,
        size: Number(std.file_size || 0),
        mimeType: std.mime_type || 'application/octet-stream'
      };
    }
    
    // Buscar em componentes (verificar step, pdf, dwg ou imagem)
    const { data: compData } = await supabase
      .from('components')
      .select('id, name, revision, created_at, step_file_url, pdf_file_url, dwg_file_url, image_url, file_size, mime_type, org:organizations(name)')
      .eq('file_hash', hash)
      .limit(1);
      
    if (compData && compData.length > 0) {
      const comp = compData[0];
      return {
        org: (comp.org as any)?.name || 'Desconhecida',
        title: comp.name,
        code: comp.id.substring(0, 8),
        revision: comp.revision,
        date: comp.created_at,
        url: comp.step_file_url || comp.pdf_file_url || comp.dwg_file_url || comp.image_url,
        fileName: comp.name,
        size: Number(comp.file_size || 0),
        mimeType: comp.mime_type || 'application/octet-stream'
      };
    }
    
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tamanho contra limites
    if (selectedFile.size > limitInfo.size) {
      setError(`O arquivo excede o limite estabelecido de ${limitInfo.label}.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const hash = await calculateFileHash(selectedFile);
      const mimeType = selectedFile.type || 'application/octet-stream';
      const size = selectedFile.size;
      const fileExtension = getFileExtension(selectedFile.name);

      // Verificar duplicidade
      const duplicate = await checkDuplicateFileInDb(hash);
      if (duplicate) {
        setDuplicateInfo({
          ...duplicate,
          hash,
          size,
          mimeType,
          path: duplicate.url ? duplicate.url.split('/public/')[1] || '' : ''
        });
        setIsUploading(false);
        return;
      }

      // Prosseguir com upload
      const { publicUrl, path } = await uploadFileToStorage(
        selectedFile,
        bucket,
        orgSlug || 'global',
        moduleType,
        revision
      );

      onUploadComplete(publicUrl, selectedFile.name, fileExtension, {
        hash,
        size,
        mimeType,
        path
      });
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
      try {
        await deleteFileFromStorage(bucket, currentFileUrl);
      } catch (err) {
        console.error('Failed to delete file from storage:', err);
      }
    }
    setError(null);
    onRemove();
  };

  const useExistingReference = () => {
    if (!duplicateInfo) return;
    const fileExtension = getFileExtension(duplicateInfo.fileName);
    onUploadComplete(duplicateInfo.url, duplicateInfo.fileName, fileExtension, {
      hash: duplicateInfo.hash,
      size: duplicateInfo.size,
      mimeType: duplicateInfo.mimeType,
      path: duplicateInfo.path
    });
    setDuplicateInfo(null);
  };

  const isImage = acceptedTypes.includes('image') || 
                  (currentFileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(currentFileUrl));

  const fileName = getFileNameFromUrl(currentFileUrl);

  return (
    <div className="space-y-1.5 flex flex-col w-full text-left">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-bold text-slate-700">{label}</Label>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">
          Limite: {limitInfo.label}
        </span>
      </div>
      
      <div className="relative border border-slate-200 rounded-lg p-3 bg-slate-55 flex items-center justify-between gap-4 min-h-[58px]">
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
            <span>Processando arquivo e calculando hash...</span>
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
                className="h-8 px-2 text-red-500 hover:text-red-650 hover:bg-red-50 rounded-md flex items-center gap-1.5 text-xs font-semibold"
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
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 border border-red-100 px-3 py-2 rounded-lg mt-1 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modal / Dialog de Duplicidade */}
      {duplicateInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-left">
            <div className="flex justify-between items-start">
              <h3 className="font-extrabold text-amber-600 text-lg flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Arquivo já Cadastrado
              </h3>
              <button 
                onClick={() => {
                  setDuplicateInfo(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-slate-600 text-[13px] leading-relaxed">
              O arquivo que você selecionou é binariamente idêntico a um documento já armazenado na plataforma.
            </p>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block">Organização</span>
                <span className="font-bold text-slate-800">{duplicateInfo.org}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block">Título / Nome do Item</span>
                <span className="font-bold text-slate-800">{duplicateInfo.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block">Código</span>
                  <span className="font-mono font-bold text-slate-800">{duplicateInfo.code}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block">Revisão</span>
                  <span className="font-mono font-bold text-slate-800">{duplicateInfo.revision}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] font-extrabold tracking-wider block">Upload Realizado Em</span>
                <span className="font-bold text-slate-800">
                  {new Date(duplicateInfo.date).toLocaleDateString()} às {new Date(duplicateInfo.date).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                onClick={useExistingReference}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Usar referência existente (Recomendado)
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setDuplicateInfo(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                variant="outline"
                className="w-full h-10 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 rounded-lg"
              >
                Cancelar envio
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
