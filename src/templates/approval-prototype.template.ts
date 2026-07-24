import { Block } from '../components/processos/BlockFactory';
import { ProcessTemplate } from './approval-project.template';

export const approvalPrototypeTemplate: ProcessTemplate = {
  id: 'approval-prototype',
  version: 1,
  name: 'Aprovação de Protótipo',
  description: 'Estrutura inicial para avaliação de um protótipo físico e autorização para fabricação do lote.',
  category: 'Validação de Protótipo',
  blocks: [
    {
      type: 'heading_text',
      title: 'Aprovação de Protótipo',
      description: 'Registre a avaliação do protótipo físico apresentado. A aprovação autoriza sua utilização como referência para a fabricação do lote.',
      required: false
    },
    {
      type: 'short_answer',
      title: 'Nome do projeto ou produto',
      required: true,
      placeholder: 'Ex: Rack de Escapamento'
    },
    {
      type: 'short_answer',
      title: 'Código do projeto ou produto',
      required: true,
      placeholder: 'Ex: PROT-554'
    },
    {
      type: 'short_answer',
      title: 'Revisão avaliada',
      required: true,
      placeholder: 'Ex: Rev A'
    },
    {
      type: 'short_answer',
      title: 'Identificação do protótipo',
      description: 'Informe número, etiqueta, código interno ou outra identificação aplicável.',
      required: true,
      placeholder: 'Ex: Protótipo Físico #01'
    },
    {
      type: 'short_answer',
      title: 'Cliente',
      required: true,
      placeholder: 'Ex: Montadora ABC'
    },
    {
      type: 'short_answer',
      title: 'Local da avaliação',
      required: false,
      placeholder: 'Ex: Laboratório de Validação'
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
      placeholder: 'Ex: Analista de Qualidade'
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
      title: 'Evidências disponibilizadas',
      required: false,
      options: [
        { id: '1', text: 'Protótipo físico' },
        { id: '2', text: 'Fotos' },
        { id: '3', text: 'Vídeo' },
        { id: '4', text: 'Desenho técnico' },
        { id: '5', text: 'Modelo 3D' },
        { id: '6', text: 'Relatório dimensional' },
        { id: '7', text: 'Relatório de testes' },
        { id: '8', text: 'Outros documentos' }
      ],
      allowOther: true
    },
    {
      type: 'checkbox',
      title: 'Itens avaliados no protótipo',
      required: true,
      options: [
        { id: '1', text: 'Dimensões' },
        { id: '2', text: 'Encaixes' },
        { id: '3', text: 'Apoios' },
        { id: '4', text: 'Fixações' },
        { id: '5', text: 'Ergonomia' },
        { id: '6', text: 'Operação' },
        { id: '7', text: 'Movimentação' },
        { id: '8', text: 'Estabilidade' },
        { id: '9', text: 'Resistência aparente' },
        { id: '10', text: 'Acabamento' },
        { id: '11', text: 'Identificação' },
        { id: '12', text: 'Compatibilidade com o produto' },
        { id: '13', text: 'Compatibilidade com o processo' },
        { id: '14', text: 'Segurança' },
        { id: '15', text: 'Empilhamento, quando aplicável' }
      ],
      allowOther: false
    },
    {
      type: 'long_answer',
      title: 'Testes realizados e resultados observados',
      description: 'Descreva os testes executados com o protótipo e os resultados identificados.',
      required: false,
      placeholder: 'Descreva os ensaios realizados...'
    },
    {
      type: 'long_answer',
      title: 'Alterações necessárias',
      description: 'Informe qualquer ajuste necessário antes da fabricação do lote.',
      required: false,
      placeholder: 'Informe ajustes se houver...'
    },
    {
      type: 'approval_decision',
      title: 'Decisão sobre o protótipo',
      required: true,
      decisions: [
        { id: '1', text: 'Protótipo aprovado para fabricação do lote', semanticType: 'positive', requireComment: false },
        { id: '2', text: 'Protótipo aprovado com ressalvas', semanticType: 'attention', requireComment: true },
        { id: '3', text: 'Protótipo reprovado', semanticType: 'negative', requireComment: true },
        { id: '4', text: 'Nova avaliação necessária', semanticType: 'neutral', requireComment: true }
      ]
    },
    {
      type: 'checkbox',
      title: 'Declaração de ciência',
      required: true,
      options: [
        { id: '1', text: 'Confirmo que o protótipo apresentado foi avaliado e que a fabricação do lote poderá utilizar esta configuração como referência. Alterações posteriores poderão gerar impactos em custos, prazos, ferramental e documentação.' }
      ],
      minSelections: 1,
      maxSelections: 1,
      allowOther: false
    }
  ]
};
