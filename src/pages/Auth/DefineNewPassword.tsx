import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { supabase } from '@/lib/supabase';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

export default function DefineNewPassword() {
  const navigate = useNavigate();
  const { user, resetRequiredRequestId, setResetRequiredRequestId } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validations
    if (!password || !confirmPassword) {
      setErrorMsg('Senha é obrigatória.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado.');
      }

      // 1. Update the password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) throw authError;

      // 2. Mark request as completed
      const activeResetId = resetRequiredRequestId;
      if (activeResetId) {
        const { error: updateErr } = await supabase
          .from('password_reset_requests')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', activeResetId);

        if (updateErr) console.error('Error completing request:', updateErr);
      } else if (user?.id) {
        // Fallback using user ID
        const { error: updateErr } = await supabase
          .from('password_reset_requests')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('status', 'approved');

        if (updateErr) console.error('Error completing request fallback:', updateErr);
      }

      // 3. Clear resetRequiredRequestId state
      setResetRequiredRequestId(null);

      setSuccessMsg('Senha atualizada com sucesso. Seu acesso foi restaurado.');

      // 4. Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Error redefining password:', err);
      setErrorMsg(err.message || 'Erro ao redefinir a senha.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="flex-1 flex">
        {/* Left side - Content */}
        <div className="flex-1 flex flex-col justify-center py-12 px-12 sm:px-24 lg:px-32 bg-[#FAFBFA] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-[640px] z-10 relative">
            <div className="flex items-center gap-3.5 mb-8">
              <img src={logoImage} alt="Perspecpack Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
              <img src={brandTextImg} alt="PERSPECPACK" className="h-5.5 w-auto object-contain mix-blend-multiply" />
            </div>
            
            <h1 className="text-[36px] font-extrabold text-gray-900 leading-[1.15] tracking-tight mb-3 flex flex-col gap-1 select-none">
              <span className="block text-slate-950">Acesso Restrito.</span>
              <span className="block text-[#0c3944]">Defina sua senha.</span>
              <span className="block text-[#0d9488]">Acesse a plataforma.</span>
            </h1>
            
            <p className="text-[15px] text-gray-550 leading-relaxed max-w-[480px] font-medium pt-3 select-none">
              Uma nova perspectiva para padrões industriais. Por motivos de segurança corporativa, todas as senhas temporárias exigem redefinição no primeiro acesso.
            </p>
          </div>
        </div>

        {/* Right side - Reset Password Form */}
        <div className="w-full max-w-[560px] bg-white flex flex-col justify-center py-12 px-12 lg:px-24 border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="w-full space-y-8">
            <div>
              <div className="inline-flex p-3 bg-teal-50 text-teal-650 rounded-xl mb-4 border border-teal-100/50 shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-[22px] font-extrabold text-gray-900">Definir Nova Senha</h2>
              <p className="text-[13px] text-gray-500 mt-1">Por motivos de segurança, defina uma nova senha para continuar utilizando a plataforma.</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {!successMsg && (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[13px] font-bold text-gray-800">Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
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
                  <Label htmlFor="confirmPassword" className="text-[13px] font-bold text-gray-800">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      required 
                      disabled={isSubmitting}
                      className="h-12 text-[14px] rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400 pr-10 shadow-sm" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-12 text-[15px] rounded-lg mt-2 transition-colors shadow-md flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Nova Senha</span>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
      
      <footer className="py-6 bg-[#FAFBFA] text-center text-[12px] text-gray-500 font-medium border-t border-gray-100">
        © 2026 PERSPECPACK. Todos os direitos reservados.
      </footer>
    </div>
  );
}
