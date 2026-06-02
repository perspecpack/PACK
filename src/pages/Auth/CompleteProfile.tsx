import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  User as UserIcon, 
  ChevronRight, 
  ChevronLeft,
  Loader2, 
  Paperclip, 
  X, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { uploadFileToStorage } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

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

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logout } = useApp();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill corporate email on load if empty
  useEffect(() => {
    if (user?.email && !corporateEmail) {
      setCorporateEmail(user.email);
    }
  }, [user]);

  // Mask for CNPJ: 00.000.000/0000-00
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

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
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
      setErrorMessage('Erro ao fazer upload do logotipo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInterestToggle = (interestLabel: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestLabel)
        ? prev.filter(i => i !== interestLabel)
        : [...prev, interestLabel]
    );
  };

  const validateStep = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (!fullName.trim()) return 'Por favor, informe seu nome completo.';
    }
    if (step === 2) {
      if (!companyName.trim()) return 'Por favor, informe o nome da empresa.';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      setErrorMessage(error);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    const error = validateStep();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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
        companyLogoUrl: companyLogoUrl || '',
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        companyType: companyType,
        companyTypeOther: companyType === 'Outros' ? companyTypeOther.trim() : undefined,
        mainInterests: selectedInterests,
        mainInterestOther: selectedInterests.includes('Outro') ? mainInterestOther.trim() : undefined,
        profileCompleted: true,
        accountStatus: 'active',
        planType: 'free'
      });

      // Navigate to homepage
      navigate('/');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage('Erro ao salvar as configurações de perfil: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-in fade-in duration-200">
      
      {/* Top minimalistic header */}
      <header className="bg-[#06242c] text-white border-b border-teal-950/80 h-16 flex items-center justify-between px-6 lg:px-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Perspecpack Logo" className="h-9 w-auto object-contain" />
          <div className="flex flex-col text-left">
            <div className="font-sans text-[16px] tracking-wider leading-none select-none">
              <span className="font-bold text-[#c0c0c0]">PERSPEC</span>
              <span className="font-normal text-[#00ff00]">PACK</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-colors border border-slate-700"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Conta</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Progress Indicator */}
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-650" />
              <h1 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Completar Perfil</h1>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <span className={cn("px-2 py-1 rounded-md", step === 1 ? "bg-teal-600 text-white" : "bg-slate-200")}>1</span>
              <span className="text-slate-350">&bull;</span>
              <span className={cn("px-2 py-1 rounded-md", step === 2 ? "bg-teal-600 text-white" : "bg-slate-200")}>2</span>
              <span className="text-slate-350">&bull;</span>
              <span className={cn("px-2 py-1 rounded-md", step === 3 ? "bg-teal-600 text-white" : "bg-slate-200")}>3</span>
              <span className="text-slate-350">&bull;</span>
              <span className={cn("px-2 py-1 rounded-md", step === 4 ? "bg-teal-600 text-white" : "bg-slate-200")}>4</span>
            </div>
          </div>

          <div className="flex-1 p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">Passo {step} de 4</span>
              <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight">
                {step === 1 && 'Dados Pessoais'}
                {step === 2 && 'Dados da Empresa'}
                {step === 3 && 'Tipo de Empresa'}
                {step === 4 && 'Interesse Principal'}
              </h2>
              <p className="text-slate-500 text-xs">
                {step === 1 && 'Preencha suas informações para contato e identificação técnica.'}
                {step === 2 && 'Informe os dados formais e o logotipo oficial da sua organização.'}
                {step === 3 && 'Selecione a categoria operacional que melhor descreve seu negócio.'}
                {step === 4 && 'Informe o que você busca na plataforma para direcionarmos seu acesso.'}
              </p>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                <X className="w-4 h-4 shrink-0 bg-rose-500 text-white rounded-full p-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: PERSONAL DETAILS */}
            {step === 1 && (
              <div className="space-y-4">
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
                    <Label htmlFor="roleTitle" className="text-[12px] font-bold text-slate-700">Cargo / Função (Opcional)</Label>
                    <Input 
                      id="roleTitle" 
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="Ex: Projetista de Racks, Comprador"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[12px] font-bold text-slate-700">Telefone para Contato (Opcional)</Label>
                    <Input 
                      id="phone" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (11) 98888-7777"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp" className="text-[12px] font-bold text-slate-700">WhatsApp (Opcional)</Label>
                    <Input 
                      id="whatsapp" 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Se diferente do telefone"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="corporateEmail" className="text-[12px] font-bold text-slate-700">E-mail Corporativo (Opcional)</Label>
                  <Input 
                    id="corporateEmail" 
                    type="email"
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: COMPANY DETAILS */}
            {step === 2 && (
              <div className="space-y-4">
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
                    <Label htmlFor="cnpj" className="text-[12px] font-bold text-slate-700">CNPJ da Empresa (Opcional)</Label>
                    <Input 
                      id="cnpj" 
                      value={cnpj}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0000-00"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyWebsite" className="text-[12px] font-bold text-slate-700">Site Oficial (Opcional)</Label>
                    <Input 
                      id="companyWebsite" 
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="www.suaempresa.com"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-[12px] font-bold text-slate-700">Cidade (Opcional)</Label>
                    <Input 
                      id="city" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Curitiba"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-[12px] font-bold text-slate-700">Estado / Província (Opcional)</Label>
                    <Input 
                      id="state" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Ex: Paraná (ou PR)"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="text-[12px] font-bold text-slate-700">País (Opcional)</Label>
                    <Input 
                      id="country" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ex: Brasil"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* LOGO UPLOAD */}
                <div className="space-y-1.5 pt-2">
                  <Label className="text-[12px] font-bold text-slate-700">Logotipo da Empresa (Opcional)</Label>
                  <div className="flex items-center gap-6">
                    {companyLogoUrl ? (
                      <div className="relative border border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center h-20 w-36 shadow-sm shrink-0 select-none">
                        <img src={companyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setCompanyLogoUrl('')}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-36 h-20 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-slate-400 shrink-0 select-none">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <span className="text-[9px] font-bold mt-1.5 uppercase tracking-wider">Sem Logo</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <label className={cn(
                        "flex items-center justify-center gap-2 border border-dashed rounded-xl p-3 text-xs font-semibold cursor-pointer transition-all min-h-[46px]",
                        isUploading
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "border-slate-300 hover:border-teal-400 hover:bg-slate-50/50 text-slate-600"
                      )}>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Paperclip className="w-4 h-4 text-slate-400" />
                            <span>Selecionar Logotipo</span>
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
                        Formatos aceitos: PNG, JPG, JPEG, WEBP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: COMPANY TYPE */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyType" className="text-[12px] font-bold text-slate-700">Selecione o Tipo de Organização (Opcional)</Label>
                  <select 
                    id="companyType"
                    value={companyType}
                    onChange={(e) => {
                      setCompanyType(e.target.value);
                      setErrorMessage(null);
                    }}
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
                      placeholder="Descreva a atividade da empresa"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: MAIN INTEREST */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <Label className="text-[12px] font-bold text-slate-700 block">
                    Quais são seus principais objetivos na plataforma? (Opcional)
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                    {INTERESTS.map(item => {
                      const isSelected = selectedInterests.includes(item.label);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInterestToggle(item.label)}
                          className={cn(
                            "flex items-center gap-2.5 border rounded-xl p-3.5 text-xs text-left font-medium transition-all shadow-sm",
                            isSelected
                              ? "bg-teal-50 border-teal-400 text-teal-950 font-bold"
                              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50/50"
                          )}
                        >
                          <div className={cn(
                            "w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0",
                            isSelected 
                              ? "bg-teal-600 border-teal-600 text-white" 
                              : "border-slate-300"
                          )}>
                            {isSelected && <span className="text-[10px] font-black">&#10003;</span>}
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
                      Descreva seu interesse principal
                    </Label>
                    <Input 
                      id="mainInterestOther" 
                      value={mainInterestOther}
                      onChange={(e) => setMainInterestOther(e.target.value)}
                      placeholder="Ex: Consultar projetos específicos da fábrica"
                      className="h-11 text-xs rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex justify-between gap-3 shrink-0">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-white hover:bg-slate-50 border-slate-250 text-slate-700 text-xs font-semibold h-10 px-5 rounded-lg flex items-center gap-1 transition-colors"
                disabled={isSubmitting || isUploading}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
            ) : (
              <div /> // Spacer
            )}

            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-teal-650 hover:bg-teal-700 text-white text-xs font-bold h-10 px-6 rounded-lg flex items-center gap-1 justify-center shadow-md transition-colors"
                disabled={isUploading}
              >
                <span>Avançar</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-teal-650 hover:bg-teal-700 text-white text-xs font-bold h-10 px-6 rounded-lg flex items-center gap-1.5 justify-center shadow-md transition-colors"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Perfil</span>
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      </main>

      <footer className="py-6 bg-[#FAFBFA] text-center text-[12px] text-gray-500 font-medium border-t border-gray-100 shrink-0">
        © 2026 PERSPECPACK. Todos os direitos reservados.
      </footer>

    </div>
  );
}
