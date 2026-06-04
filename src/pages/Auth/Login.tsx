import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck, User, X, Loader2, CheckCircle, AlertTriangle, FileText, HelpCircle, Download } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import loginImage from '@/Imagem.png';
import logoImage from '@/logo.png';
import brandTextImg from '@/PERSPECPACK.png';

const cleanEnvVar = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithEmail } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingStatusMsg, setPendingStatusMsg] = useState<'pending' | 'rejected' | 'expired_reset' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    if (statusParam === 'pending' || statusParam === 'rejected' || statusParam === 'expired_reset') {
      setPendingStatusMsg(statusParam as any);
    }
  }, []);

  // Validation State
  const { validationCode } = useParams<{ validationCode?: string }>();
  const [validationCodeInput, setValidationCodeInput] = useState('');
  const [isValidatingReport, setIsValidatingReport] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPreferredContact, setResetPreferredContact] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Publish Standards Info State
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handleResetPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetSubmitting(true);
    setResetError(null);
    setResetSuccessMessage(null);

    try {
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado.');
      }
      
      // 1. Verify if user email exists in user_profiles
      const { data: profData, error: profErr } = await supabase
        .from('user_profiles')
        .select('user_id, corporate_email')
        .eq('corporate_email', resetEmail.trim().toLowerCase())
        .maybeSingle();

      if (profErr) throw profErr;

      if (!profData) {
        throw new Error('Este e-mail não está cadastrado na plataforma.');
      }

      // 2. Insert request in password_reset_requests
      const { error: insertErr } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: profData.user_id,
          email: resetEmail.trim().toLowerCase(),
          preferred_contact: resetPreferredContact,
          status: 'pending'
        });

      if (insertErr) throw insertErr;

      setResetSuccessMessage(
        'Solicitação recebida com sucesso. Nossa equipe analisará sua solicitação e enviará uma senha temporária para o canal informado.'
      );
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setResetError(err.message || 'Erro ao enviar solicitação de recuperação de acesso.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleValidateReport = async (codeToValidate?: string) => {
    const code = (codeToValidate || validationCodeInput).trim().toUpperCase();
    if (!code) return;

    setIsValidatingReport(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized.');
      }

      // Query the database for the validation_code
      const { data, error } = await supabase
        .from('checklist_executions')
        .select(`
          *,
          organization:organizations(name),
          checklist:checklist_templates(name, revision)
        `)
        .eq('validation_code', code)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setValidationError('Código não encontrado ou relatório inválido.');
        setShowValidationModal(true);
      } else {
        setValidationResult(data);
        setShowValidationModal(true);
      }
    } catch (err: any) {
      console.error('Error validating report:', err);
      setValidationError('Erro ao conectar ao servidor. Tente novamente.');
      setShowValidationModal(true);
    } finally {
      setIsValidatingReport(false);
    }
  };

  useEffect(() => {
    if (validationCode) {
      setValidationCodeInput(validationCode);
      handleValidateReport(validationCode);
    }
  }, [validationCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setLoginError(null);
    setPendingStatusMsg(null);

    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');

      const masterEmail = cleanEnvVar(import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL || 'perspec03d@gmail.com').toLowerCase();
      const isMaster = masterEmail && email.toLowerCase() === masterEmail;

      if (isMaster) {
        await loginWithEmail(email, password);
        navigate('/master');
        return;
      }

      // 1. Sign in via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;
      const authUser = authData?.user;
      if (!authUser) throw new Error('Credenciais inválidas.');

      // 2. Fetch profile user_status
      const { data: profData, error: profErr } = await supabase
        .from('user_profiles')
        .select('user_status')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profErr) throw profErr;

      const status = profData?.user_status || 'pending';
      if (status === 'pending') {
        await supabase.auth.signOut();
        setPendingStatusMsg('pending');
        setIsSubmitting(false);
        return;
      } else if (status === 'rejected') {
        await supabase.auth.signOut();
        setPendingStatusMsg('rejected');
        setIsSubmitting(false);
        return;
      }

      // 3. Login succeeded & user is active -> set session in AppContext
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Error logging in:', err);
      setLoginError(err.message || 'E-mail ou senha incorretos.');
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
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="block text-slate-950"
              >
                Reduza retrabalhos.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="block text-[#0c3944]"
              >
                Acelere aprovações.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="block text-[#0d9488]"
              >
                Padronize projetos.
              </motion.span>
            </h1>
            
            <p className="text-[16px] text-gray-600 leading-relaxed mb-2">
              Acesse padrões, componentes homologados, documentação técnica e critérios de validação das principais <strong className="font-bold text-[#0c3944]">organizações industriais</strong> do país.
            </p>

            {/* Conceptual image */}
            <div className="relative w-full h-[480px] flex items-start justify-center mt-4">
              <img 
                src={loginImage} 
                alt="Industrial Rack" 
                className="w-full h-full object-contain object-top mix-blend-multiply scale-125 origin-top"
              />
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-[560px] bg-white flex flex-col justify-center py-12 px-12 lg:px-24 border-l border-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="w-full space-y-8">
            <div>
              <h2 className="text-[22px] font-extrabold text-gray-900">Entrar na plataforma</h2>
              <p className="text-[13px] text-gray-500 mt-1">Insira suas credenciais para acessar a plataforma.</p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            {pendingStatusMsg === 'pending' && (
              <div className="bg-amber-50 border border-amber-250 text-amber-900 text-xs font-semibold p-4 rounded-xl space-y-3.5 animate-in fade-in duration-200 text-left">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span className="font-extrabold text-[13px]">Solicitação em Análise</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  Sua solicitação ainda está em análise. Aguarde a aprovação da equipe PERSPECPACK.
                </p>
                <div className="pt-2.5 border-t border-amber-200/55 space-y-1 text-slate-600 font-medium">
                  <span className="block font-bold text-slate-750 text-[11px]">Dúvidas sobre sua solicitação?</span>
                  <span className="block">
                    WhatsApp: <a href="https://wa.me/5514998892017" target="_blank" rel="noreferrer" className="text-teal-700 font-bold hover:underline font-mono">(14) 99889-2017</a>
                  </span>
                  <span className="block">
                    E-mail: <a href="mailto:perspecpack@gmail.com" className="text-teal-700 font-bold hover:underline font-mono">perspecpack@gmail.com</a>
                  </span>
                </div>
              </div>
            )}

            {pendingStatusMsg === 'rejected' && (
              <div className="bg-rose-50 border border-rose-250 text-rose-900 text-xs font-semibold p-4 rounded-xl space-y-3.5 animate-in fade-in duration-200 text-left">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span className="font-extrabold text-[13px]">Solicitação não Aprovada</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  Sua solicitação de acesso não foi aprovada pela equipe PERSPECPACK.
                </p>
                <div className="pt-2.5 border-t border-rose-200/55 space-y-1 text-slate-600 font-medium">
                  <span className="block font-bold text-slate-750 text-[11px]">Dúvidas sobre sua solicitação?</span>
                  <span className="block">
                    WhatsApp: <a href="https://wa.me/5514998892017" target="_blank" rel="noreferrer" className="text-teal-700 font-bold hover:underline font-mono">(14) 99889-2017</a>
                  </span>
                  <span className="block">
                    E-mail: <a href="mailto:perspecpack@gmail.com" className="text-teal-700 font-bold hover:underline font-mono">perspecpack@gmail.com</a>
                  </span>
                </div>
              </div>
            )}

            {pendingStatusMsg === 'expired_reset' && (
              <div className="bg-rose-50 border border-rose-250 text-rose-900 text-xs font-semibold p-4 rounded-xl space-y-3.5 animate-in fade-in duration-200 text-left">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span className="font-extrabold text-[13px]">Senha Temporária Expirada</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  Sua senha temporária expirou (validade de 24 horas). Solicite uma nova recuperação de acesso.
                </p>
                <div className="pt-2.5 border-t border-rose-200/55 space-y-1 text-slate-600 font-medium">
                  <span className="block font-bold text-slate-750 text-[11px]">Dúvidas sobre seu acesso?</span>
                  <span className="block">
                    WhatsApp: <a href="https://wa.me/5514998892017" target="_blank" rel="noreferrer" className="text-teal-700 font-bold hover:underline font-mono">(14) 99889-2017</a>
                  </span>
                  <span className="block">
                    E-mail: <a href="mailto:perspecpack@gmail.com" className="text-teal-700 font-bold hover:underline font-mono">perspecpack@gmail.com</a>
                  </span>
                </div>
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
                <button 
                  type="button" 
                  onClick={() => {
                    setResetEmail('');
                    setResetPreferredContact('whatsapp');
                    setResetError(null);
                    setResetSuccessMessage(null);
                    setShowResetModal(true);
                  }}
                  className="text-[13px] font-semibold text-teal-650 hover:text-teal-700 cursor-pointer bg-transparent border-0 outline-none"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-12 text-[15px] rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </Button>
              </div>
            </form>

            {/* Validar Relatório Box */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Validar Código do Relatório
              </span>
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3 shadow-inner">
                <div className="flex gap-2">
                  <Input 
                    type="text"
                    placeholder="Digite o código de validação"
                    value={validationCodeInput}
                    onChange={(e) => setValidationCodeInput(e.target.value)}
                    className="h-10 text-xs flex-1 placeholder:text-[10.5px] rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500"
                  />
                  <Button
                    type="button"
                    onClick={() => handleValidateReport()}
                    className="bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-10 px-3 text-xs rounded-lg shrink-0 transition-colors shadow-md"
                    disabled={isValidatingReport}
                  >
                    {isValidatingReport ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Validar Relatório'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center text-[13px] text-gray-500">
              Não tem uma conta? <Link to="/cadastro" className="font-semibold text-teal-600 hover:text-teal-700">Criar conta</Link>
            </p>

            <div className="pt-5 border-t border-slate-150 mt-1">
              <button 
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="w-full py-3 px-4 bg-[#0d9488] hover:bg-[#0f766e] text-white text-[13px] font-bold transition-all flex items-center justify-center gap-2 shadow-md rounded-xl cursor-pointer"
              >
                <HelpCircle className="w-4.5 h-4.5 text-teal-100 shrink-0" />
                <span>Como publicar padrões da minha organização?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="py-6 bg-[#FAFBFA] text-center text-[12px] text-gray-500 font-medium border-t border-gray-100">
        © 2026 PERSPECPACK. Todos os direitos reservados.
      </footer>

      {/* VALIDATION MODAL */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00F59B]" />
                <span>Autenticação de Relatório</span>
              </h3>
              <button 
                onClick={() => setShowValidationModal(false)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {validationError ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-md font-extrabold text-slate-900">Falha na Autenticação</h4>
                    <p className="text-xs text-rose-600 bg-rose-50/50 border border-rose-100 px-3 py-1.5 rounded-lg font-semibold max-w-sm mx-auto">
                      {validationError}
                    </p>
                  </div>
                </div>
              ) : (
                validationResult && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit mx-auto uppercase">
                        Relatório Válido
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Relatório válido e gerado pela plataforma PERSPECPACK.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 gap-4">
                        <span className="font-semibold text-slate-505">Checklist Executado:</span>
                        <span className="font-bold text-slate-800 text-right">
                          {validationResult.checklist?.name || 'Checklist de Validação'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-505">Revisão do Checklist:</span>
                        <span className="font-mono text-slate-800 font-bold">
                          REV {validationResult.checklist?.revision || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-505">Organização OEM:</span>
                        <span className="font-bold text-slate-800">
                          {validationResult.organization?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-505">Validador / Emissor:</span>
                        <span className="font-mono text-slate-700 font-bold">{validationResult.user_id}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-505">Data de Emissão:</span>
                        <span className="font-bold text-slate-800">
                          {new Date(validationResult.generated_at || validationResult.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-550">Código de Validação:</span>
                        <span className="font-mono text-[#06242c] font-black">{validationResult.validation_code}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-550">Código de Rastreabilidade:</span>
                        <span className="font-mono text-slate-700 font-bold">{validationResult.verification_code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-550">Resultado Geral:</span>
                        <span className={cn(
                          "font-bold px-2 py-0.5 rounded text-[10px] uppercase border",
                          validationResult.report_status === 'APROVADO'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                            : validationResult.report_status === 'APROVADO COM RESSALVAS'
                            ? "bg-amber-50 text-amber-700 border-amber-250"
                            : "bg-rose-50 text-rose-700 border-rose-250"
                        )}>
                          {validationResult.report_status || 'N/A'}
                        </span>
                      </div>

                      {/* Display project header_data if available */}
                      {validationResult.header_data && Object.keys(validationResult.header_data).length > 0 && (
                        <div className="pt-2.5 mt-2.5 border-t border-slate-200 space-y-2 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Informações do Projeto</span>
                          {Object.entries(validationResult.header_data).map(([label, val]: any) => (
                            <div key={label} className="flex justify-between items-center border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                              <span className="font-semibold text-slate-550">{label}:</span>
                              <span className="font-bold text-slate-800 text-right">{String(val || 'N/A')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {validationResult.pdf_url && (
                      <a 
                        href={validationResult.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 px-4 text-xs rounded-xl shadow-sm transition-colors text-center animate-in fade-in"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Visualizar PDF do Relatório</span>
                      </a>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 shrink-0">
              <Button
                onClick={() => setShowValidationModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-10 text-xs rounded-xl"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* PASSWORD RESET REQUEST MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[450px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00F59B]" />
                <span>Recuperação de Acesso</span>
              </h3>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-slate-350 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors cursor-pointer"
                disabled={isResetSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccessMessage ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-[15px] text-slate-800">Solicitação Enviada</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {resetSuccessMessage}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetSuccessMessage(null);
                  }}
                  className="bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-10 px-6 rounded-lg w-full text-xs"
                >
                  Ok, entendi
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordRequest}>
                <div className="p-6 space-y-4 text-left">
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-bold text-slate-800">Recuperação de Acesso</h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                      Informe o e-mail cadastrado na plataforma.<br />
                      Após a validação dos dados cadastrais, nossa equipe enviará uma senha temporária para o WhatsApp ou e-mail informado no seu cadastro.<br />
                      No primeiro acesso será obrigatório definir uma nova senha.
                    </p>
                  </div>

                  {resetError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="resetEmail" className="text-xs font-bold text-gray-800">E-mail</Label>
                    <Input 
                      id="resetEmail" 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="seu-email@empresa.com" 
                      required 
                      className="h-10 text-xs rounded-lg border-slate-350 shadow-inner focus:ring-teal-500 focus:border-teal-500" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-800 block">Canal Preferencial</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredContact"
                          value="whatsapp"
                          checked={resetPreferredContact === 'whatsapp'}
                          onChange={() => setResetPreferredContact('whatsapp')}
                          className="text-teal-650 focus:ring-teal-500"
                        />
                        <span>WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredContact"
                          value="email"
                          checked={resetPreferredContact === 'email'}
                          onChange={() => setResetPreferredContact('email')}
                          className="text-teal-650 focus:ring-teal-500"
                        />
                        <span>E-mail</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/2 text-xs font-semibold h-10 rounded-xl"
                    disabled={isResetSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="w-1/2 bg-[#0c3944] hover:bg-[#124d5b] text-white text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                    disabled={isResetSubmitting || !resetEmail.trim()}
                  >
                    {isResetSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Solicitar Recuperação</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* PUBLISH MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[620px] max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-[#06242c] text-white p-5 border-b border-teal-950 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00F59B]" />
                <span>Como publicar padrões da minha organização?</span>
              </h3>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="text-slate-300 hover:text-white hover:bg-teal-950/50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-650 text-xs leading-relaxed">
              <div className="space-y-3">
                <h4 className="text-[14px] font-bold text-slate-800 leading-snug">
                  Deseja disponibilizar normas, cadernos de encargos, componentes homologados e critérios de validação da sua empresa na PERSPECPACK?
                </h4>
                <p className="text-[12px] text-slate-650 leading-relaxed">
                  A PERSPECPACK foi desenvolvida para centralizar e distribuir informações técnicas de engenharia para montadoras, sistemistas e fabricantes de componentes automotivos.
                </p>
                <p className="text-[12px] text-slate-650 leading-relaxed font-semibold">
                  Nossa equipe realiza toda a implantação, estruturação e manutenção do ambiente da sua organização, garantindo que fornecedores e parceiros tenham acesso apenas às informações corretas e atualizadas.
                </p>
              </div>

              {/* Flow Timeline */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h5 className="text-[11px] font-bold text-teal-850 uppercase tracking-wider block">
                  Como funciona o processo de implantação
                </h5>
                <div className="relative border-l-2 border-teal-100/75 ml-3 pl-6 space-y-6">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[37px] top-0.5 bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-sm">
                      01
                    </div>
                    <div className="space-y-1">
                      <h6 className="text-[13px] font-extrabold text-slate-800">Diagnóstico Técnico</h6>
                      <p className="text-[11.5px] text-slate-650 leading-relaxed">
                        Nossa equipe realiza reuniões de levantamento para compreender a estrutura de normas, cadernos de encargos, componentes homologados, critérios de validação e processos internos da organização.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[37px] top-0.5 bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-sm">
                      02
                    </div>
                    <div className="space-y-2">
                      <h6 className="text-[13px] font-extrabold text-slate-800">Estruturação da Plataforma</h6>
                      <p className="text-[11.5px] text-slate-650 leading-relaxed">
                        A equipe <strong className="font-bold text-slate-900">PERSPEC3D</strong> organiza e publica todo o conteúdo técnico dentro da PERSPECPACK, criando uma biblioteca padronizada e controlada.
                      </p>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Conteúdos publicados pela nossa equipe:
                        </span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-700 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0"></span>
                            <span>Cadernos de Encargos</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0"></span>
                            <span>Normas Técnicas</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0"></span>
                            <span>Critérios de Conformidade</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0"></span>
                            <span>Componentes Homologados</span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0"></span>
                            <span>Checklists de Validação</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="absolute -left-[37px] top-0.5 bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-sm">
                      03
                    </div>
                    <div className="space-y-1">
                      <h6 className="text-[13px] font-extrabold text-slate-800">Atualização Contínua</h6>
                      <p className="text-[11.5px] text-slate-650 leading-relaxed">
                        A equipe <strong className="font-bold text-slate-900">PERSPEC3D</strong> permanece responsável pelo suporte, manutenção e atualização das informações publicadas, garantindo que toda a cadeia de fornecedores trabalhe sempre com a versão oficial dos documentos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h5 className="text-[11px] font-bold text-teal-850 uppercase tracking-wider block">
                  Benefícios
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px] text-slate-700 font-semibold">
                  <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Redução de retrabalho</span>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Padronização de requisitos</span>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Controle de versões</span>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Maior velocidade nas aprovações</span>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Rastreabilidade de conformidade</span>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Distribuição centralizada de informações técnicas</span>
                  </div>
                </div>
              </div>

              {/* Contact Footer */}
              <div className="space-y-4 pt-5 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                  Entre em contato para uma avaliação da sua organização
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-slate-700 text-center font-bold">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-teal-300 transition-colors">
                    <span className="block text-slate-400 text-[10px] uppercase mb-1">E-mail</span>
                    <a href="mailto:perspecpack@gmail.com" className="text-teal-700 hover:text-teal-800 break-all font-semibold font-mono text-[11px]">
                      perspecpack@gmail.com
                    </a>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-teal-300 transition-colors">
                    <span className="block text-slate-400 text-[10px] uppercase mb-1">WhatsApp</span>
                    <a href="https://wa.me/5514998892017" target="_blank" rel="noreferrer" className="text-teal-700 hover:text-teal-800 font-semibold font-mono text-[11px]">
                      (14) 99889-2017
                    </a>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-teal-300 transition-colors">
                    <span className="block text-slate-400 text-[10px] uppercase mb-1">Website</span>
                    <a href="https://www.perspec3d.com" target="_blank" rel="noreferrer" className="text-teal-700 hover:text-teal-800 font-semibold font-mono text-[11px]">
                      www.perspec3d.com
                    </a>
                  </div>
                </div>

                <div className="text-center pt-1.5 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#0c3944] bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full shadow-inner">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    Solicite uma apresentação personalizada
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 shrink-0">
              <Button
                onClick={() => setShowPublishModal(false)}
                className="w-full bg-[#0c3944] hover:bg-[#124d5b] text-white font-bold h-10 text-xs rounded-xl"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

