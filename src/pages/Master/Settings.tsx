import React from 'react';
import { useApp } from '@/src/context/AppContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, HardDrive, Shield } from 'lucide-react';

const cleanEnvVar = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

export default function Settings() {
  const { user } = useApp();

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja redefinir o banco de dados local para os dados padrão do seed? Todas as suas alterações serão perdidas.')) {
      localStorage.removeItem('pp_oems');
      localStorage.removeItem('pp_categories');
      localStorage.removeItem('pp_files');
      localStorage.removeItem('pp_components');
      localStorage.removeItem('pp_checklists');
      localStorage.removeItem('pp_projects');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      {/* Header section */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-[26px] font-extrabold tracking-tight">Configurações do Master</h2>
          <p className="text-slate-300 mt-2 text-[14px] max-w-[650px] leading-relaxed">
            Gerencie credenciais administrativas e manutenção do banco de dados local.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Perfil Administrativo
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs max-w-md bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-500 font-medium">E-mail:</span>
              <p className="font-bold text-slate-800 mt-0.5">{user?.email || cleanEnvVar(import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL) || 'perspec03d@gmail.com'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Permissões:</span>
              <p className="font-bold text-teal-600 mt-0.5">Acesso Total (Master)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-teal-600" />
            Banco de Dados e Armazenamento
          </h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Atualmente, para fins de demonstração local e rapidez de desenvolvimento, todos os cadastros estão salvos no <strong>LocalStorage</strong> do seu navegador. 
            A estrutura está 100% mapeada para espelhar as tabelas relacionais do <strong>Supabase (PostgreSQL)</strong>.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-left">
              <h4 className="text-[13px] font-bold text-amber-900">Restaurar Banco de Dados original (Seed)</h4>
              <p className="text-[12px] text-amber-700 leading-relaxed">
                Esta ação apagará todas as organizações, arquivos, componentes, checklists e projetos que você cadastrou localmente, redefinindo o banco com os dados padrões originais do arquivo `seed.sql`.
              </p>
              <Button 
                onClick={handleResetData}
                type="button" 
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold h-9 px-4 rounded-lg flex items-center gap-2 transition-colors mt-2 text-xs shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resetar para o Seed Padrão
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
