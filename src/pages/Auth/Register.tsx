import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import loginImage from '@/Imagem.png';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

export default function Register() {
  const navigate = useNavigate();
  const { signUpWithEmail } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const masterEmail = import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL;
    if (masterEmail && email.trim().toLowerCase() === masterEmail.trim().toLowerCase()) {
      setErrorMsg('Este e-mail está reservado e não pode ser utilizado para cadastro público.');
      return;
    }

    // Validations
    if (!email) {
      setErrorMsg('O e-mail é obrigatório.');
      return;
    }
    if (!password) {
      setErrorMsg('A senha é obrigatória.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpWithEmail(email, password);
      setSuccessMsg('Cadastro realizado com sucesso! Redirecionando para preenchimento de perfil...');
      setTimeout(() => {
        navigate('/completar-perfil');
      }, 2000);
    } catch (err: any) {
      console.error('Error in signup:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao criar a sua conta. Tente novamente.');
      setIsSubmitting(false);
    }
  };

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
              Cadastre-se para obter acesso total aos padrões homologados, baixar modelagens 3D (STEP/DWG) e emitir relatórios de conformidade técnica para as principais montadoras parceiras.
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
        <div className="w-full max-w-[560px] bg-white flex flex-col justify-center py-12 px-12 lg:px-24 border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="w-full space-y-8">
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

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold p-3.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-bold text-gray-800">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: seu-nome@empresa.com" 
                  required 
                  disabled={isSubmitting}
                  className="h-12 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <div className="space-y-2">
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
                    className="h-12 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 pr-10 shadow-sm" 
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[13px] font-bold text-gray-800">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required 
                  disabled={isSubmitting}
                  className="h-12 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 text-[15px] rounded-lg mt-2 transition-colors shadow-md flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
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
