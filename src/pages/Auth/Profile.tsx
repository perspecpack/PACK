import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Building2, 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  Paperclip, 
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/src/context/AppContext';
import { uploadFileToStorage } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logPageAccess } = useApp();

  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    logPageAccess('Fornecedor - Editar Perfil');
  }, [logPageAccess]);

  // Load existing profile details
  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || '');
      setCompanyLogoUrl(user.companyLogoUrl || null);
    }
  }, [user]);

  // Auto-initialize company name from email domain if empty
  const handleAutoFill = () => {
    if (user?.email) {
      const domain = user.email.split('@')[1];
      if (domain && domain !== 'perspecpack.com') {
        setCompanyName(domain.split('.')[0].toUpperCase());
      } else {
        setCompanyName('FORNECEDOR');
      }
    }
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const { publicUrl } = await uploadFileToStorage(
        file,
        'checklist-evidencias',
        'perfis',
        'logos'
      );
      setCompanyLogoUrl(publicUrl);
    } catch (error: any) {
      console.error('Error uploading profile logo:', error);
      alert('Erro ao fazer upload do logotipo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!user) return;
    setIsSaving(true);

    try {
      updateUser({
        companyName: companyName.trim(),
        companyLogoUrl: companyLogoUrl || undefined
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error updating user profile:', err);
      alert('Erro ao salvar as alterações do perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const emailDomain = user?.email ? user.email.split('@')[1].split('.')[0].toUpperCase() : 'FORNECEDOR';
  const displayName = companyName.trim() || emailDomain;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-2.5 z-50 animate-in slide-in-from-top-4 duration-300 font-medium text-xs">
          <CheckCircle className="w-5 h-5 text-[#00F59B]" />
          <span>Perfil atualizado com sucesso!</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Downloads</span>
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Configurações do Perfil</h2>
        <p className="text-slate-500 text-sm">
          Gerencie os dados cadastrais da sua empresa. Essas informações são aplicadas formalmente no cabeçalho e rodapé dos relatórios de conformidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Form Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Dados da Empresa</span>
            </h3>
          </div>

          <div className="p-6 space-y-5">
            {/* Read-only User metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">E-mail de Login</span>
                <span className="font-mono text-slate-700 font-bold">{user?.email || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Perfil / Permissão</span>
                <span className="font-bold text-slate-800 capitalize">{user?.role === 'master' ? 'Master Administrador' : 'Fornecedor Credenciado'}</span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="companyName" className="text-[12px] font-bold text-gray-800">
                    Nome da Empresa / Emitter
                  </Label>
                  <button 
                    type="button" 
                    onClick={handleAutoFill}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline"
                  >
                    Preencher automático
                  </button>
                </div>
                <Input 
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Empresa Industrial Ltda"
                  className="h-11 text-xs rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Logo Upload widgets */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-bold text-gray-800">Logotipo da Empresa</Label>
                
                <div className="flex items-center gap-6">
                  {companyLogoUrl ? (
                    <div className="relative border border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center h-20 w-36 shadow-sm shrink-0">
                      <img src={companyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setCompanyLogoUrl(null)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-36 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-slate-350 shrink-0">
                      <Building2 className="w-6 h-6" />
                      <span className="text-[9px] font-bold mt-1 uppercase">Sem Logo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className={cn(
                      "flex items-center justify-center gap-2 border border-dashed rounded-xl p-4 text-xs font-semibold cursor-pointer transition-all min-h-[46px]",
                      isUploading
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "border-slate-300 hover:border-teal-400 hover:bg-slate-50/50 text-slate-600"
                    )}>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                          <span>Enviando imagem...</span>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span>Fazer Upload do Logo</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                      Recomendamos arquivos PNG ou JPG com fundo transparente e proporção horizontal (Ex: 300x100px).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <Button 
              onClick={() => navigate('/')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold h-10 px-5 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-10 px-6 rounded-lg flex items-center gap-1.5 justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Configurações</span>
              )}
            </Button>
          </div>
        </div>

        {/* PDF Mockup Preview Widget */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">Pré-Visualização no PDF</span>
          
          <div className="bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-700 text-left space-y-4">
            
            {/* Header simulation */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Cabeçalho do Relatório (Simulação A4)</span>
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 gap-2">
                  {/* Left Logo/Company name */}
                  <div className="h-7 flex items-center justify-start max-w-[150px]">
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt="Logo Emissor" className="max-h-full object-contain" />
                    ) : (
                      <span className="font-bold text-slate-800 text-[10px] leading-tight truncate">{displayName}</span>
                    )}
                  </div>

                  {/* Right Header title */}
                  <div className="text-right">
                    <span className="text-[6.5px] font-bold text-slate-400 block leading-tight">RELATÓRIO DE CONFORMIDADE TÉCNICA</span>
                    <span className="text-[5px] text-slate-400 block leading-tight">Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Content body sample */}
                <div className="space-y-2">
                  <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-1.5 bg-slate-100 rounded w-full"></div>
                  <div className="h-1.5 bg-slate-100 rounded w-5/6"></div>
                </div>
              </div>
            </div>

            {/* Footer simulation */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Rodapé do Relatório (Simulação A4)</span>
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 relative overflow-hidden">
                {/* Content body sample */}
                <div className="space-y-1.5 pb-2 border-b border-slate-100">
                  <div className="h-1.5 bg-slate-100 rounded w-1/2"></div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  {/* Footer Left */}
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-10 bg-slate-200 rounded flex items-center justify-center text-[5px] font-black text-slate-500 scale-90">
                      PERSPECPACK
                    </div>
                    <span className="text-[5.5px] text-slate-400 font-medium"> — Plataforma de Conformidade para Embalagens</span>
                  </div>

                  {/* Footer Right */}
                  <span className="text-[6px] text-slate-400 font-bold">Página 1 de 2</span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-teal-950/20 border border-teal-900/30 p-4 rounded-xl text-left">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Nota Importante</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-normal">
              Esta visualização ilustra como as informações preenchidas acima aparecem nos relatórios PDF para as montadoras parceiras. Certifique-se de preencher o nome formal de forma clara.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
