import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import loginImage from '@/Imagem.png';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Direct auto-detection: if it's admin/master email, log in as master
    if (email.toLowerCase().includes('master') || email.toLowerCase().includes('admin')) {
      login(email, 'master');
      navigate('/master');
    } else {
      login(email, 'user');
      navigate('/');
    }
  };

  const handleQuickLogin = (role: 'master' | 'user') => {
    if (role === 'master') {
      login('master@perspecpack.com', 'master');
      navigate('/master');
    } else {
      login('fornecedor@perspecpack.com', 'user');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
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
              Reduza retrabalho. Acelere aprovações. Padronize projetos.
            </h1>
            
            <p className="text-[16px] text-gray-600 leading-relaxed mb-2">
              Acesse padrões, componentes homologados, normas técnicas e critérios de validação para o desenvolvimento de <strong className="font-bold text-[#0c3944]">embalagens metálicas</strong> das principais montadoras do país.
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

        {/* Right side - Login Form */}
        <div className="w-full max-w-[560px] bg-white flex flex-col justify-center py-12 px-12 lg:px-24 border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="w-full space-y-8">
            <div>
              <h2 className="text-[22px] font-extrabold text-gray-900">Entrar na plataforma</h2>
              <p className="text-[13px] text-gray-500 mt-1">Insira suas credenciais ou utilize os atalhos rápidos abaixo.</p>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-bold text-gray-800">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail" 
                  required 
                  className="h-12 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 shadow-sm" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-bold text-gray-800">Senha</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required 
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

              <div className="flex justify-end pt-1">
                <Link to="#" className="text-[13px] font-semibold text-teal-600 hover:text-teal-700">
                  Esqueceu sua senha?
                </Link>
              </div>

              <Button type="submit" className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-12 text-[15px] rounded-lg mt-2 transition-colors shadow-md">
                Entrar
              </Button>
            </form>

            {/* Quick Access / Shortcuts */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">Acesso Rápido para Testes</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('master')}
                  className="flex items-center justify-center gap-2 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 py-3 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Perfil Master
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('user')}
                  className="flex items-center justify-center gap-2 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-700 py-3 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <User className="w-4 h-4 shrink-0" />
                  Fornecedor
                </button>
              </div>
            </div>

            <p className="text-center text-[13px] text-gray-500">
              Não tem uma conta? <Link to="#" className="font-semibold text-teal-600 hover:text-teal-700">Fale com o administrador.</Link>
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

