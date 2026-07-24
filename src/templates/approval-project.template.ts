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
  version: 1,
  name: 'Aprovação de Projeto',
  description: 'Estrutura inicial para análise de documentação técnica, características do projeto e autorização para fabricação.',
  category: 'Aprovação Técnica',
  blocks: [
    {
      type: 'heading_text',
      title: 'Aprovação de Projeto',
      description: 'Analise as informações e os documentos disponibilizados antes de registrar sua decisão. A aprovação autoriza o avanço do processo conforme a revisão apresentada.',
      required: false
    },
    {
      type: 'short_answer',
      title: 'Nome do projeto',
      description: 'Informe o nome ou identificação principal do projeto.',
      required: true,
      placeholder: 'Ex: Dispositivo de Solda Lateral'
    },
    {
      type: 'short_answer',
      title: 'Código do projeto',
      description: 'Informe o código interno, número do pedido ou referência aplicável.',
      required: true,
      placeholder: 'Ex: PRJ-2026-089'
    },
    {
      type: 'short_answer',
      title: 'Revisão avaliada',
      description: 'Informe a revisão do projeto que está sendo analisada.',
      required: true,
      placeholder: 'Ex: Rev 02'
    },
    {
      type: 'short_answer',
      title: 'Cliente',
      required: true,
      placeholder: 'Ex: Montadora XYZ'
    },
    {
      type: 'short_answer',
      title: 'Responsável pela aprovação',
      required: true,
      placeholder: 'Digite seu nome completo'
    },
    {
      type: 'short_answer',
      title: 'Cargo ou função',
      required: true,
      placeholder: 'Ex: Engenheiro de Processos'
    },
    {
      type: 'date',
      title: 'Data da avaliação',
      required: true,
      allowPastDates: true,
      allowFutureDates: false
    },
    {
      type: 'checkbox',
      title: 'Documentação disponibilizada para análise',
      description: 'Selecione os materiais que foram disponibilizados junto ao processo.',
      required: false,
      options: [
        { id: '1', text: 'Modelo 3D' },
        { id: '2', text: 'Desenho técnico' },
        { id: '3', text: 'Lista de materiais' },
        { id: '4', text: 'Memorial descritivo' },
        { id: '5', text: 'Imagens ou renderizações' },
        { id: '6', text: 'Vídeo demonstrativo' },
        { id: '7', text: 'Outros documentos' }
      ],
      allowOther: true
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
      type: 'checkbox',
      title: 'Declaração de ciência',
      required: true,
      options: [
        { id: '1', text: 'Confirmo que analisei o conteúdo disponibilizado e estou ciente de que a fabricação poderá seguir conforme a revisão aprovada. Alterações posteriores poderão impactar custos, prazos e documentação técnica.' }
      ],
      minSelections: 1,
      maxSelections: 1,
      allowOther: false
    }
  ]
};
