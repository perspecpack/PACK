import React from 'react';
import { useApp } from '@/src/context/AppContext';
import { Shield } from 'lucide-react';

const cleanEnvVar = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

export default function Settings() {
  const { user } = useApp();

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      {/* Header section */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-[26px] font-extrabold tracking-tight">Configurações do Master</h2>
          <p className="text-slate-300 mt-2 text-[14px] max-w-[650px] leading-relaxed">
            Gerencie credenciais administrativas e informações do seu perfil master.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">

        <div className="space-y-4">
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

      </div>
    </div>
  );
}
