import { Block } from '../components/processos/BlockFactory';

export interface ProcessTemplate {
  id: string;
  version: number;
  name: string;
  description: string;
  category: string;
  blocks: Omit<Block, 'id'>[];
}

export const approvalProjectTemplate: ProcessTemplate = {
  id: 'approval-project',
  version: 2,
  name: 'Aprovação de Projeto',
  description: 'Estrutura inicial para análise de documentação técnica, características do projeto e autorização para fabricação.',
  category: 'Aprovação Técnica',
  blocks: [
    {
      type: 'request_information',
      title: 'Informações Gerais da Solicitação',
      required: true,
      filledBy: 'company',
      fields: [
        { id: 'f1', key: 'title', label: 'Título da solicitação', placeholder: 'Ex: Aprovação de Projeto ABC', enabled: true, required: true, visibleToClient: true, position: 1 },
        { id: 'f2', key: 'client', label: 'Cliente', placeholder: 'Ex: Montadora XYZ', enabled: true, required: true, visibleToClient: true, position: 2 },
        { id: 'f3', key: 'project', label: 'Projeto', placeholder: 'Ex: Dispositivo de Solda Lateral', enabled: true, required: true, visibleToClient: true, position: 3 },
        { id: 'f4', key: 'code', label: 'Código do projeto', placeholder: 'Ex: PRJ-2026-089', enabled: true, required: true, visibleToClient: true, position: 4 },
        { id: 'f5', key: 'revision', label: 'Revisão', placeholder: 'Ex: Rev 02', enabled: true, required: true, visibleToClient: true, position: 5 },
        { id: 'f6', key: 'responsible_internal', label: 'Responsável interno', placeholder: 'Ex: João da Silva', enabled: true, required: false, visibleToClient: true, position: 6 },
        { id: 'f7', key: 'deadline', label: 'Prazo para resposta', placeholder: '', enabled: true, required: false, visibleToClient: true, position: 7 },
        { id: 'f8', key: 'description', label: 'Descrição do processo', placeholder: 'Analise as informações e os documentos disponibilizados antes de registrar sua decisão...', enabled: true, required: false, visibleToClient: true, position: 8 },
        { id: 'f9', key: 'notes_for_client', label: 'Observações ao cliente', placeholder: 'Notas visíveis apenas para o cliente...', enabled: true, required: false, visibleToClient: true, position: 9 }
      ]
    },
    {
      type: 'analysis_materials',
      title: 'Materiais para Análise',
      required: false,
      filledBy: 'company',
      minFiles: 0,
      maxFiles: 10,
      maxSizeMB: 50,
      allowExternalLinks: true,
      allowDownload: true,
      requireDescription: false,
      requireCategory: false,
      requireRevision: false,
      allowedFileTypes: ['pdf', 'images', 'videos', 'documents', 'spreadsheets', 'cad_step', 'cad_stl', 'cad_dwg', 'cad_dxf', 'zip', 'others']
    },
    {
      type: 'checkbox',
      title: 'Itens avaliados',
      description: 'Selecione os aspectos analisados durante a validação do projeto.',
      required: true,
      options: [
        { id: '1', text: 'Dimensões gerais' },
        { id: '2', text: 'Geometria e configuração' },
        { id: '3', text: 'Pontos de apoio' },
        { id: '4', text: 'Fixações' },
        { id: '5', text: 'Componentes utilizados' },
        { id: '6', text: 'Ergonomia' },
        { id: '7', text: 'Movimentação' },
        { id: '8', text: 'Empilhamento' },
        { id: '9', text: 'Identificação' },
        { id: '10', text: 'Acabamento' },
        { id: '11', text: 'Aplicação e funcionamento' },
        { id: '12', text: 'Requisitos de segurança' }
      ],
      allowOther: false
    },
    {
      type: 'long_answer',
      title: 'Observações, ressalvas ou alterações necessárias',
      description: 'Registre informações complementares sobre a análise realizada.',
      required: false,
      placeholder: 'Digite observações detalhadas se houver...'
    },
    {
      type: 'approval_decision',
      title: 'Decisão sobre o projeto',
      description: 'Selecione a decisão correspondente à análise realizada.',
      required: true,
      decisions: [
        { id: '1', text: 'Aprovado', semanticType: 'positive', requireComment: false },
        { id: '2', text: 'Aprovado com ressalvas', semanticType: 'attention', requireComment: true },
        { id: '3', text: 'Solicitar alterações', semanticType: 'negative', requireComment: true }
      ]
    },
    {
      type: 'acknowledgement',
      title: 'Declaração de ciência',
      required: true,
      declarationText: 'Confirmo que analisei o conteúdo disponibilizado e estou ciente de que a fabricação poderá seguir conforme a revisão aprovada. Alterações posteriores poderão impactar custos, prazos e documentação técnica.'
    }
  ]
};
