import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { supabase } from '@/lib/supabase';
import loginImage from '@/Imagem.png';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

const cleanEnvVar = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

export default function Register() {
  const navigate = useNavigate();
  const { signUpWithEmail, logout } = useApp();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [declaredTrue, setDeclaredTrue] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const masterEmail = cleanEnvVar(import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL || 'perspec03d@gmail.com').toLowerCase();
    if (masterEmail && email.trim().toLowerCase() === masterEmail) {
      setErrorMsg('Este e-mail está reservado e não pode ser utilizado para cadastro público.');
      return;
    }

    // Validations
    if (!fullName.trim()) return setErrorMsg('O nome completo é obrigatório.');
    if (!companyName.trim()) return setErrorMsg('A empresa é obrigatória.');
    if (!roleTitle.trim()) return setErrorMsg('O cargo é obrigatório.');
    if (!email.trim()) return setErrorMsg('O e-mail é obrigatório.');
    if (!phone.trim()) return setErrorMsg('O telefone / WhatsApp é obrigatório.');
    if (!password) return setErrorMsg('A senha é obrigatória.');
    if (password.length < 6) return setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
    if (password !== confirmPassword) return setErrorMsg('As senhas não coincidem.');
    if (!declaredTrue) return setErrorMsg('Você deve declarar que as informações são verdadeiras.');

    setIsSubmitting(true);

    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');

      // 1. Sign up auth account
      const authData = await signUpWithEmail(email.trim(), password);
      const authUser = authData?.user;
      if (!authUser) throw new Error('Erro ao criar conta no sistema.');

      // 2. Update automatically created profile record
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          role_title: roleTitle.trim(),
          phone: phone.trim(),
          whatsapp: phone.trim(),
          profile_completed: true,
          account_status: 'pending',
          user_status: 'pending'
        })
        .eq('user_id', authUser.id);

      if (profileError) throw profileError;

      // 3. Clear session
      await logout();

      // 4. Show success screen
      setSuccessState(true);
    } catch (err: any) {
      console.error('Error in registration flow:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao criar a sua conta. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  if (successState) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans animate-in fade-in duration-200">
        <div className="flex-1 flex">
          {/* Left side - Content */}
          <div className="flex-1 flex flex-col justify-center py-12 px-12 sm:px-24 lg:px-32 bg-[#FAFBFA] relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
            
            <div className="max-w-[580px] z-10 relative">
              <div className="flex items-center gap-3.5 mb-8">
                <img src={logoImage} alt="Perspecpack Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
                <img src={brandTextImg} alt="PERSPECPACK" className="h-5.5 w-auto object-contain mix-blend-multiply" />
              </div>
              
              <h1 className="text-[36px] font-extrabold text-gray-900 leading-[1.15] tracking-tight mb-6">
                Faça parte da maior rede de embalagens industriais do país.
              </h1>
              
              <p className="text-[16px] text-gray-600 leading-relaxed">
                Acesse padrões, componentes homologados, documentação técnica e critérios de validação das principais organizações industriais do país.
              </p>
            </div>
          </div>

          {/* Right side - Success Message */}
          <div className="w-full max-w-[560px] bg-white flex flex-col justify-center py-12 px-12 lg:px-24 border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
            <div className="w-full space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-[22px] font-black text-gray-900">Solicitação Recebida</h2>
                <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 py-1.5 px-3 rounded-full w-fit mx-auto uppercase text-xs">
                  Status atual: Aguardando Aprovação
                </p>
              </div>

              <div className="text-left bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3.5 text-xs text-slate-650 leading-relaxed shadow-sm">
                <p className="font-bold text-slate-800 text-[13px]">
                  Sua solicitação de acesso foi enviada com sucesso.
                </p>
                <p>
                  Nossa equipe realizará a validação dos dados informados antes da liberação do acesso à plataforma.
                </p>
                <p>
                  Você será informado assim que sua conta for aprovada.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-12 text-[15px] rounded-lg transition-colors shadow-md"
                >
                  Voltar para o Login
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="py-6 bg-[#FAFBFA] text-center text-[12px] text-gray-500 font-medium border-t border-gray-100">
          © 2026 PERSPECPACK. Todos os direitos reservados.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans animate-in fade-in duration-200">
      <div className="flex-1 flex">
        {/* Left side - Content */}
        <div className="flex-1 flex flex-col justify-center py-12 px-12 sm:px-24 lg:px-32 bg-[#FAFBFA] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-[580px] z-10 relative">
            <div className="flex items-center gap-3.5 mb-8">
              <img src={logoImage} alt="Perspecpack Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
              <img src={brandTextImg} alt="PERSPECPACK" className="h-5.5 w-auto object-contain mix-blend-multiply" />
            </div>
            
            <h1 className="text-[36px] font-extrabold text-gray-900 leading-[1.15] tracking-tight mb-6">
              Faça parte da maior rede de embalagens industriais do país.
            </h1>
            
            <p className="text-[16px] text-gray-600 leading-relaxed mb-2">
              Acesse padrões, componentes homologados, documentação técnica e critérios de validação das principais organizações industriais do país.
            </p>

            {/* Conceptual image */}
            <div className="relative w-full h-[520px] flex items-center justify-center -mt-10">
              <img 
                src={loginImage} 
                alt="Industrial Rack" 
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className="w-full max-w-[560px] bg-white flex flex-col justify-center py-8 px-12 lg:px-20 border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="w-full space-y-6">
            <div>
              <h2 className="text-[22px] font-extrabold text-gray-900">Criar uma conta</h2>
              <p className="text-[13px] text-gray-500 mt-1">Preencha os campos abaixo para cadastrar-se na plataforma.</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-[13px] font-bold text-gray-800">Nome Completo</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo" 
                  required 
                  disabled={isSubmitting}
                  className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-[13px] font-bold text-gray-800">Empresa</Label>
                  <Input 
                    id="companyName" 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da empresa" 
                    required 
                    disabled={isSubmitting}
                    className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="roleTitle" className="text-[13px] font-bold text-gray-800">Cargo</Label>
                  <Input 
                    id="roleTitle" 
                    type="text" 
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Seu cargo/função" 
                    required 
                    disabled={isSubmitting}
                    className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-bold text-gray-800">E-mail Corporativo</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: seu-nome@empresa.com" 
                  required 
                  disabled={isSubmitting}
                  className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[13px] font-bold text-gray-800">Telefone / WhatsApp</Label>
                <Input 
                  id="phone" 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (14) 99889-2017" 
                  required 
                  disabled={isSubmitting}
                  className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-bold text-gray-800">Senha (mínimo 6 caracteres)</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defina sua senha"
                    required 
                    disabled={isSubmitting}
                    className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 pr-10 shadow-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[13px] font-bold text-gray-800">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required 
                  disabled={isSubmitting}
                  className="h-11 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input 
                  id="declaredTrue" 
                  type="checkbox" 
                  checked={declaredTrue}
                  onChange={(e) => setDeclaredTrue(e.target.checked)}
                  required
                  disabled={isSubmitting}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mt-0.5 cursor-pointer"
                />
                <Label htmlFor="declaredTrue" className="text-[12px] font-medium text-gray-600 leading-snug cursor-pointer select-none">
                  Declaro que as informações fornecidas são verdadeiras.
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold h-11 text-[15px] rounded-lg mt-3 transition-colors shadow-md flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando solicitação...</span>
                  </>
                ) : (
                  <span>Criar Conta</span>
                )}
              </Button>
            </form>

            <p className="text-center text-[13px] text-gray-500 pt-2">
              Já tem uma conta? <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">Entrar na plataforma</Link>
            </p>
          </div>
        </div>
      </div>
      
      <footer className="py-6 bg-[#FAFBFA] text-center text-[12px] text-gray-500 font-medium border-t border-gray-100">
        © 2026 PERSPECPACK. Todos os direitos reservados.
      </footer>
    </div>
  );
}
