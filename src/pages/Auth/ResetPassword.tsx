import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Check URL/Session on mount
  useEffect(() => {
    if (!supabase) {
      setInitError('Cliente Supabase não inicializado.');
      return;
    }

    // Verify if we are in recovery flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hash = window.location.hash || '';
      const isRecovery = hash.includes('type=recovery') || hash.includes('access_token');
      if (!session && !isRecovery) {
        setInitError('Acesso inválido. Esta página deve ser acessada através do link de redefinição de senha enviado por e-mail.');
      }
    });

    // Handle listener for hash login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Recovery session established.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Validation checks
  const isMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isFormValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('A senha não atende a todos os requisitos exigidos.');
      return;
    }

    setIsSaving(true);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password
      });

      if (updateErr) throw updateErr;

      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Erro ao atualizar a senha. O token do link pode ter expirado.');
    } finally {
      setIsSaving(false);
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-[#FAFBFA] flex flex-col justify-center items-center p-6 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg max-w-[420px] text-center space-y-5">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[18px] font-extrabold text-slate-900">Link Inválido</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              {initError}
            </p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-10 text-xs rounded-xl transition-colors"
          >
            Voltar para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFA] flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 font-sans relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-[460px] mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-10 z-10 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#06242c]"></div>

        <div className="flex items-center gap-3.5 mb-8 justify-center">
          <img src={logoImage} alt="Perspecpack Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          <img src={brandTextImg} alt="PERSPECPACK" className="h-5 w-auto object-contain mix-blend-multiply" />
        </div>

        {saveSuccess ? (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[18px] font-extrabold text-slate-900">Senha atualizada com sucesso.</h3>
              <p className="text-slate-500 text-xs">
                Sua senha foi redefinida com segurança. Use a nova credencial para acessar a plataforma.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-11 text-xs rounded-xl shadow-md transition-all"
            >
              Ir para Login
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-[20px] font-extrabold text-slate-900">Redefinir Senha</h2>
              <p className="text-xs text-slate-500">Crie uma nova senha segura para sua conta.</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Nova Senha</Label>
                <div className="relative">
                  <Input 
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="h-11 text-xs rounded-lg border-gray-300 pr-10 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">Confirmar Nova Senha</Label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="h-11 text-xs rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                />
              </div>

              {/* Password strength checklist */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-[11px] text-slate-600 space-y-2.5 shadow-inner">
                <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px] block">Requisitos de Segurança</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    {isMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    )}
                    <span className={cn(isMinLength ? "text-emerald-700 font-semibold" : "text-slate-500")}>Min. 8 caracteres</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasUpper ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    )}
                    <span className={cn(hasUpper ? "text-emerald-700 font-semibold" : "text-slate-500")}>1 letra maiúscula</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasLower ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    )}
                    <span className={cn(hasLower ? "text-emerald-700 font-semibold" : "text-slate-500")}>1 letra minúscula</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    )}
                    <span className={cn(hasNumber ? "text-emerald-700 font-semibold" : "text-slate-500")}>1 número</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    )}
                    <span className={cn(hasSpecial ? "text-emerald-700 font-semibold" : "text-slate-500")}>1 caractere especial</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                    )}
                    <span className={cn(passwordsMatch ? "text-emerald-700 font-semibold" : "text-slate-500")}>Senhas coincidem</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving || !isFormValid}
                className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-11 text-xs rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Salvando Nova Senha...</span>
                  </>
                ) : (
                  <span>Salvar Nova Senha</span>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
