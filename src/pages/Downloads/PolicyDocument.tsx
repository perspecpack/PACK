import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/context/AppContext';

interface PolicyDocumentProps {
  docType: 'termos' | 'privacidade' | 'licenciamento' | 'responsabilidade';
}

export default function PolicyDocument({ docType }: PolicyDocumentProps) {
  const navigate = useNavigate();
  const { logPageAccess } = useApp();

  const getDocData = () => {
    switch (docType) {
      case 'termos':
        return {
          title: 'Termos de Uso',
          subtitle: 'Condições gerais de uso e navegação na plataforma PERSPECPACK.',
          icon: FileText,
          iconColor: 'text-teal-600',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-100',
          logTitle: 'Termos de Uso',
          content: (
            <div className="space-y-6 text-sm text-slate-650 leading-relaxed">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">1. Aceitação dos Termos</h3>
                <p>
                  Ao acessar e utilizar a plataforma PERSPECPACK, você concorda em cumprir e estar vinculado a estes Termos de Uso. Este serviço é destinado exclusivamente a profissionais e empresas atuantes no setor de embalagens industriais e logística automotiva.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">2. Descrição do Serviço</h3>
                <p>
                  A plataforma funciona como um hub de conformidade técnica, disponibilizando cadernos de encargos, componentes homologados em formato CAD (STEP, DWG), normas técnicas e checklists de validação de projetos. O acesso aos dados de cada organização (OEM) está sujeito às permissões concedidas.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">3. Obrigações do Usuário</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Fornecer dados cadastrais válidos, completos e atualizados no perfil da empresa.</li>
                  <li>Utilizar as informações e arquivos CAD exclusivamente para o desenvolvimento e fabricação de embalagens autorizadas pelas montadoras e parceiros.</li>
                  <li>Manter o sigilo de suas credenciais de acesso, sendo responsável por todas as atividades realizadas sob sua conta.</li>
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">4. Propriedade Intelectual</h3>
                <p>
                  Todo o design, interface, software, códigos e marcas associados à marca PERSPECPACK são de propriedade exclusiva. Os padrões técnicos, logos e arquivos CAD das montadoras pertencem às respectivas organizações parceiras, sendo vedada sua reprodução ou redistribuição comercial sem consentimento expresso por escrito.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">5. Modificações nos Termos</h3>
                <p>
                  A administração da plataforma reserva-se o direito de atualizar estes termos a qualquer momento. Modificações significativas serão notificadas aos usuários cadastrados. O uso contínuo da plataforma após alterações constitui aceitação tácita.
                </p>
              </section>
            </div>
          )
        };
      case 'privacidade':
        return {
          title: 'Política de Privacidade',
          subtitle: 'Como coletamos, processamos e protegemos seus dados cadastrais e de uso.',
          icon: Lock,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          logTitle: 'Política de Privacidade',
          content: (
            <div className="space-y-6 text-sm text-slate-650 leading-relaxed">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">1. Coleta de Informações</h3>
                <p>
                  Coletamos dados fornecidos diretamente por você para o cadastro e completude do perfil corporativo, tais como: nome completo, e-mail corporativo, telefone, WhatsApp de contato, CNPJ, site e o logotipo da sua empresa.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">2. Rastreabilidade e Logs de Acesso</h3>
                <p>
                  Para auditoria técnica e segurança da plataforma e das montadoras parceiras, registramos sistematicamente:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Logs de Downloads: data, arquivo baixado e usuário que executou a ação.</li>
                  <li>Logs de Uploads: documentações técnicas ou evidências enviadas.</li>
                  <li>Histórico de Inspeções: checklists técnicos preenchidos e relatórios emitidos.</li>
                  <li>Logs de Acesso: rastreamento de páginas visitadas.</li>
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">3. Compartilhamento de Dados</h3>
                <p>
                  Os dados das inspeções técnicas e downloads podem ser compartilhados com as respectivas OEMs/montadoras detentoras dos padrões, permitindo que elas auditem o processo de homologação dos seus fornecedores. Não comercializamos dados cadastrais para terceiros em nenhuma hipótese.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">4. Armazenamento e Segurança</h3>
                <p>
                  As informações são armazenadas em infraestrutura de nuvem segura utilizando padrões recomendados pelo setor, com tráfego criptografado (HTTPS) e controle de acesso via chaves de API restritas e Row Level Security (RLS) em nosso banco de dados.
                </p>
              </section>
            </div>
          )
        };
      case 'licenciamento':
        return {
          title: 'Licenciamento de Conteúdo',
          subtitle: 'Regras de licenciamento e uso dos arquivos CAD, normas e diretrizes técnicas.',
          icon: Shield,
          iconColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-100',
          logTitle: 'Licenciamento de Conteúdo',
          content: (
            <div className="space-y-6 text-sm text-slate-650 leading-relaxed">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">1. Escopo da Licença</h3>
                <p>
                  Os arquivos 3D (STEP), desenhos 2D (DWG/PDF), normas de empilhamento, especificações técnicas de AGV e de ergonomia disponibilizados na plataforma são licenciados aos fornecedores cadastrados em regime de uso não exclusivo, temporário e intransferível.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">2. Finalidade Permitida</h3>
                <p>
                  A utilização dos arquivos é estritamente permitida para fins de engenharia, detalhamento técnico, cotação e manufatura de racks metálicos e embalagens dedicadas às montadoras detentoras da propriedade daqueles padrões.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">3. Proibições</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>É terminantemente proibido utilizar os componentes CAD ou desenhos técnicos para desenvolver produtos para fins alheios aos projetos homologados na plataforma.</li>
                  <li>Fica vetado qualquer compartilhamento dos arquivos com terceiros que não integrem a cadeia produtiva direta autorizada.</li>
                  <li>Modificações nos componentes homologados devem seguir os trâmites formais de aprovação de engenharia de cada OEM, não gerando direitos autorais adicionais ao fornecedor.</li>
                </ul>
              </section>
            </div>
          )
        };
      case 'responsabilidade':
        return {
          title: 'Responsabilidade Técnica',
          subtitle: 'Divisão de responsabilidades de engenharia nos projetos desenvolvidos.',
          icon: Scale,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-100',
          logTitle: 'Responsabilidade Técnica',
          content: (
            <div className="space-y-6 text-sm text-slate-650 leading-relaxed">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">1. Responsabilidade do Fornecedor / Fabricante</h3>
                <p>
                  A utilização da plataforma PERSPECPACK, a consulta a normas e o preenchimento de checklists de conformidade técnica não eximem a empresa projetista ou fabricante da embalagem de sua inteira responsabilidade técnica sobre o projeto final.
                </p>
                <p>
                  Cabe ao engenheiro responsável (ART) verificar tolerâncias de fabricação, cálculos estruturais de empilhamento, estabilidade dinâmica no transporte e ensaios físicos práticos.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">2. Isenção de Danos da Plataforma</h3>
                <p>
                  A plataforma atua como ferramenta auxiliar de conformidade. A PERSPECPACK não se responsabiliza por quaisquer falhas físicas em racks metálicos, danos causados a componentes automotivos durante o transporte, retrabalhos de manufatura ou acidentes operacionais decorrentes de erros de dimensionamento, projeto ou montagem física.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">3. Atualização de Padrões</h3>
                <p>
                  Embora a plataforma envide melhores esforços para manter todas as normas e componentes em suas últimas revisões vigentes, os fornecedores devem sempre confirmar as informações com a área de Logística/Engenharia da OEM parceira antes de iniciar produções em larga escala.
                </p>
              </section>
            </div>
          )
        };
    }
  };

  const doc = getDocData();
  const Icon = doc.icon;

  useEffect(() => {
    logPageAccess(`Fornecedor - ${doc.logTitle}`);
  }, [doc.logTitle, logPageAccess]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans animate-in fade-in duration-255">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/ajuda')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-650 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Ajuda</span>
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className={`p-4 rounded-xl ${doc.bgColor} ${doc.borderColor} border shrink-0`}>
          <Icon className={`w-8 h-8 ${doc.iconColor}`} />
        </div>
        <div className="space-y-1">
          <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{doc.title}</h2>
          <p className="text-slate-500 text-sm">{doc.subtitle}</p>
        </div>
      </div>

      {/* Document Body */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#06242c] rounded-t-3xl"></div>
        {doc.content}
        
        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>PERSPECPACK &bull; Documento Oficial</span>
          <span>Vigência: 2026</span>
        </div>
      </div>
    </div>
  );
}
