import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User as UserIcon, 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  Paperclip, 
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/src/context/AppContext';
import { uploadFileToStorage } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const COMPANY_TYPES = [
  'Montadora / OEM',
  'Fabricante de Embalagens Metálicas',
  'Fabricante de Componentes Automotivos',
  'Fornecedor Tier 1',
  'Integrador Logístico',
  'Empresa de Engenharia',
  'Consultoria Técnica',
  'Outros'
];

const INTERESTS = [
  { id: 'patterns', label: 'Acessar padrões OEM' },
  { id: 'components', label: 'Baixar componentes homologados' },
  { id: 'docs', label: 'Consultar documentação técnica' },
  { id: 'checklists', label: 'Executar checklists de validação' },
  { id: 'reports', label: 'Gerar relatórios de conformidade' },
  { id: 'publish', label: 'Publicar padrões da minha organização' },
  { id: 'other', label: 'Outro' }
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logPageAccess } = useApp();

  // Form States
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Brasil');

  const [companyType, setCompanyType] = useState('');
  const [companyTypeOther, setCompanyTypeOther] = useState('');

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [mainInterestOther, setMainInterestOther] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    logPageAccess('Fornecedor - Editar Perfil');
  }, [logPageAccess]);

  // Load existing profile details
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setRoleTitle(profile.roleTitle || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setCorporateEmail(profile.corporateEmail || user?.email || '');

      setCompanyName(profile.companyName || '');
      setCnpj(profile.cnpj || '');
      setCompanyWebsite(profile.companyWebsite || '');
      setCompanyLogoUrl(profile.companyLogoUrl || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setCountry(profile.country || 'Brasil');

      setCompanyType(profile.companyType || '');
      setCompanyTypeOther(profile.companyTypeOther || '');

      setSelectedInterests(profile.mainInterests || []);
      setMainInterestOther(profile.mainInterestOther || '');
    } else if (user) {
      // Fallback fallback for master user or empty profiles
      setCorporateEmail(user.email || '');
      setCompanyName(user.companyName || '');
      setCompanyLogoUrl(user.companyLogoUrl || '');
    }
  }, [profile, user]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.substring(0, 14);
    
    // Mask
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
    }
    setCnpj(value);
  };

  const handleInterestToggle = (interestLabel: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestLabel)
        ? prev.filter(i => i !== interestLabel)
        : [...prev, interestLabel]
    );
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    setValidationError(null);
    try {
      const { publicUrl } = await uploadFileToStorage(
        file,
        'company-logos',
        'perfis',
        'logos'
      );
      setCompanyLogoUrl(publicUrl);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setValidationError('Erro ao fazer upload do logotipo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setValidationError(null);

    // Validations (only if profile is expected, master user can bypass or edit directly)
    if (!fullName.trim()) { setValidationError('Nome completo é obrigatório.'); return; }
    if (!roleTitle.trim()) { setValidationError('Cargo / Função é obrigatória.'); return; }
    if (!phone.trim()) { setValidationError('Telefone de contato é obrigatório.'); return; }
    if (!whatsapp.trim()) { setValidationError('WhatsApp de contato é obrigatório.'); return; }
    if (!corporateEmail.trim()) { setValidationError('E-mail corporativo é obrigatório.'); return; }
    if (!companyName.trim()) { setValidationError('Nome da empresa é obrigatório.'); return; }
    if (!cnpj.trim() || cnpj.length < 18) { setValidationError('CNPJ válido é obrigatório.'); return; }
    if (!companyWebsite.trim()) { setValidationError('Site oficial da empresa é obrigatório.'); return; }
    if (!city.trim()) { setValidationError('Cidade é obrigatória.'); return; }
    if (!state.trim()) { setValidationError('Estado é obrigatório.'); return; }
    if (!country.trim()) { setValidationError('País é obrigatório.'); return; }
    if (!companyLogoUrl) { setValidationError('O logotipo da empresa é obrigatório.'); return; }
    if (!companyType) { setValidationError('Selecione o tipo de empresa.'); return; }
    if (companyType === 'Outros' && !companyTypeOther.trim()) {
      setValidationError('Descreva o tipo da empresa.');
      return;
    }
    if (selectedInterests.length === 0) {
      setValidationError('Selecione pelo menos um interesse principal na plataforma.');
      return;
    }
    if (selectedInterests.includes('Outro') && !mainInterestOther.trim()) {
      setValidationError('Descreva seu outro interesse.');
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        corporateEmail: corporateEmail.trim(),
        companyName: companyName.trim(),
        cnpj: cnpj.trim(),
        companyWebsite: companyWebsite.trim(),
        companyLogoUrl: companyLogoUrl,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        companyType: companyType,
        companyTypeOther: companyType === 'Outros' ? companyTypeOther.trim() : undefined,
        mainInterests: selectedInterests,
        mainInterestOther: selectedInterests.includes('Outro') ? mainInterestOther.trim() : undefined,
        profileCompleted: true
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setValidationError('Erro ao salvar as alterações do perfil: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = companyName.trim() || (user?.email ? user.email.split('@')[1].split('.')[0].toUpperCase() : 'FORNECEDOR');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-650 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Downloads</span>
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 text-sm">
          Gerencie suas informações pessoais e os dados cadastrais da sua empresa na plataforma.
        </p>
      </div>

      {validationError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <X className="w-4 h-4 shrink-0 bg-rose-500 text-white rounded-full p-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Form Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
          
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserIcon className="w-4 h-4 text-teal-600" />
              <span>1. Dados Pessoais</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-[12px] font-bold text-slate-700">Nome Completo</Label>
                <Input 
                  id="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roleTitle" className="text-[12px] font-bold text-slate-700">Cargo / Função</Label>
                <Input 
                  id="roleTitle" 
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Ex: Projetista de Racks, Comprador"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[12px] font-bold text-slate-700">Telefone</Label>
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 98888-7777"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-[12px] font-bold text-slate-700">WhatsApp</Label>
                <Input 
                  id="whatsapp" 
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 98888-7777"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="corporateEmail" className="text-[12px] font-bold text-slate-700">E-mail Corporativo</Label>
                <Input 
                  id="corporateEmail" 
                  value={corporateEmail}
                  onChange={(e) => setCorporateEmail(e.target.value)}
                  placeholder="nome@empresa.com"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Company Details */}
          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>2. Dados da Empresa</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-[12px] font-bold text-slate-700">Nome da Empresa</Label>
                <Input 
                  id="companyName" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da sua organização"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-[12px] font-bold text-slate-700">CNPJ da Empresa</Label>
                <Input 
                  id="cnpj" 
                  value={cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyWebsite" className="text-[12px] font-bold text-slate-700">Site Oficial</Label>
                <Input 
                  id="companyWebsite" 
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="www.empresa.com"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-[12px] font-bold text-slate-700">Cidade</Label>
                <Input 
                  id="city" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-[12px] font-bold text-slate-700">Estado</Label>
                <Input 
                  id="state" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Ex: SP"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-[12px] font-bold text-slate-700">País</Label>
              <Input 
                id="country" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ex: Brasil"
                className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* LOGO UPLOAD */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-[12px] font-bold text-slate-700">Logotipo da Empresa</Label>
              <div className="flex items-center gap-6">
                {companyLogoUrl ? (
                  <div className="relative border border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center h-20 w-36 shadow-sm shrink-0 select-none">
                    <img src={companyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setCompanyLogoUrl('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-36 h-20 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-slate-400 shrink-0 select-none">
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
                    Recomendamos arquivos PNG ou JPG com fundo transparente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Company Type */}
          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>3. Tipo de Empresa</span>
            </h3>

            <div className="space-y-3">
              <Label htmlFor="companyType" className="text-[12px] font-bold text-slate-700">Selecione o tipo de organização</Label>
              <select 
                id="companyType"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full h-11 border border-slate-300 rounded-lg px-3 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
              >
                <option value="">Selecione uma opção...</option>
                {COMPANY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {companyType === 'Outros' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="companyTypeOther" className="text-[12px] font-bold text-slate-700">
                  Descreva o tipo da empresa
                </Label>
                <Input 
                  id="companyTypeOther" 
                  value={companyTypeOther}
                  onChange={(e) => setCompanyTypeOther(e.target.value)}
                  placeholder="Atividade principal da empresa"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
          </div>

          {/* Section 4: Main Interests */}
          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-[14px] text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-teal-600" />
              <span>4. Interesse principal na plataforma</span>
            </h3>

            <div className="space-y-3">
              <Label className="text-[12px] font-bold text-slate-700 block">Objetivos principais na plataforma</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INTERESTS.map(item => {
                  const isSelected = selectedInterests.includes(item.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInterestToggle(item.label)}
                      className={cn(
                        "flex items-center gap-2.5 border rounded-xl p-3 text-xs text-left font-medium transition-all shadow-sm",
                        isSelected
                          ? "bg-teal-50 border-teal-400 text-teal-950 font-bold"
                          : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        isSelected 
                          ? "bg-teal-600 border-teal-600 text-white" 
                          : "border-slate-300"
                      )}>
                        {isSelected && <span className="text-[9px] font-black">&#10003;</span>}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedInterests.includes('Outro') && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="mainInterestOther" className="text-[12px] font-bold text-slate-700">
                  Descreva o seu interesse
                </Label>
                <Input 
                  id="mainInterestOther" 
                  value={mainInterestOther}
                  onChange={(e) => setMainInterestOther(e.target.value)}
                  placeholder="Ex: Consultar projetos específicos"
                  className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-5 flex justify-end gap-3">
            <Button 
              variant="outline"
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
        <div className="lg:col-span-4 space-y-4">
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
            <p className="text-[11px] text-slate-650 mt-1 leading-normal">
              Esta visualização ilustra como as informações preenchidas acima aparecem nos relatórios PDF para as montadoras parceiras. Certifique-se de preencher o nome formal de forma clara.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
