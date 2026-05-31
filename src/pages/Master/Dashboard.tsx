import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  Layers, 
  CheckSquare, 
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';

export default function Dashboard() {
  const { oems, files, components, checklists, projects } = useApp();

  const cards = [
    {
      title: 'Organizações cadastradas',
      count: oems.length,
      icon: Building2,
      link: '/master/oems',
      color: 'from-blue-500/10 to-teal-500/10',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-100',
      desc: 'Organizações e padrões gerenciados na plataforma'
    },
    {
      title: 'Arquivos cadastrados',
      count: files.length,
      icon: FileText,
      link: '/master/files',
      color: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100',
      desc: 'Normas, cadernos de encargos e anexos técnicos'
    },
    {
      title: 'Componentes cadastrados',
      count: components.length,
      icon: Layers,
      link: '/master/components',
      color: 'from-purple-500/10 to-indigo-500/10',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
      desc: 'Componentes homologados por organizações'
    },
    {
      title: 'Checklists cadastrados',
      count: checklists.length,
      icon: CheckSquare,
      link: '/master/checklists',
      color: 'from-emerald-500/10 to-green-500/10',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
      desc: 'Templates de inspeções técnicas e conformidade'
    }
  ];

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-[28px] font-extrabold tracking-tight">Área Master &mdash; Painel de Controle</h2>
          <p className="text-slate-300 mt-2 text-[15px] max-w-[650px] leading-relaxed">
            Bem-vindo à área administrativa do PERSPECPACK. Aqui você pode gerenciar organizações, categorias, normas, arquivos técnicos, componentes e checklists de conformidade.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-[#00F59B] text-xs font-bold rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-[#00F59B] rounded-full animate-pulse"></span>
              Sessão Local Ativa (Simulada)
            </span>
            <span className="text-slate-400 text-xs font-medium">Os dados cadastrados serão salvos no seu navegador.</span>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className={`bg-white border ${card.borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-gradient-to-br ${card.color} rounded-lg ${card.iconColor}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-[36px] font-extrabold text-slate-800 leading-none">{card.count}</span>
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-1">{card.title}</h3>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{card.desc}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link 
                to={card.link} 
                className="text-[13px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                Gerenciar
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Info & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Systems Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>Atividades do Administrador</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-md shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Alimentação Técnica</h4>
                <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                  Cadastre as organizações parceiras, crie suas categorias de arquivos e organize as bibliotecas para que os fornecedores possam fazer o download dos arquivos STEP, DWG ou PDFs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Engenharia de Checklists</h4>
                <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                  Configure os checklists técnicos dinâmicos de cada organização. Esses critérios serão usados por fornecedores para validar se as embalagens estão em conformidade com as normas vigentes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - System Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 mb-4">Informações da Plataforma</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Projetos de Referência:</span>
                <span className="font-bold text-slate-800">{projects.length}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Ambiente de Execução:</span>
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono font-bold">Localhost</span>
              </div>
              <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Armazenamento:</span>
                <span className="text-slate-800 font-semibold">LocalStorage (Navegador)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-teal-950 text-[#00F59B] p-4 rounded-lg flex items-center justify-between border border-teal-800">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="text-[12px] font-extrabold uppercase tracking-wide">Visão Geral Completa</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Simule a visualização final do usuário</p>
              </div>
            </div>
            <Link to="/" className="p-1 bg-[#00F59B] text-teal-950 rounded hover:opacity-90 transition-opacity">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
