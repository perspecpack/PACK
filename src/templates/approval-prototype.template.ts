import { Block } from '../components/processos/BlockFactory';
import { ProcessTemplate } from './approval-project.template';

export const approvalPrototypeTemplate: ProcessTemplate = {
  id: 'approval-prototype',
  version: 2,
  name: 'Aprovação de Protótipo',
  description: 'Estrutura inicial para avaliação de um protótipo físico e autorização para fabricação do lote.',
  category: 'Validação de Protótipo',
  blocks: [
    {
      type: 'request_information',
      title: 'Informações Gerais da Solicitação',
      required: true,
      filledBy: 'company',
      fields: [
        { id: 'f1', key: 'title', label: 'Título da solicitação', placeholder: 'Ex: Aprovação de Protótipo Básico', enabled: true, required: true, visibleToClient: true, position: 1 },
        { id: 'f2', key: 'client', label: 'Cliente', placeholder: 'Ex: Montadora ABC', enabled: true, required: true, visibleToClient: true, position: 2 },
        { id: 'f3', key: 'project', label: 'Projeto', placeholder: 'Ex: Rack de Escapamento', enabled: true, required: true, visibleToClient: true, position: 3 },
        { id: 'f4', key: 'code', label: 'Código do projeto ou produto', placeholder: 'Ex: PROT-554', enabled: true, required: true, visibleToClient: true, position: 4 },
        { id: 'f5', key: 'revision', label: 'Revisão', placeholder: 'Ex: Rev A', enabled: true, required: true, visibleToClient: true, position: 5 },
        { id: 'f6', key: 'responsible_internal', label: 'Responsável interno', placeholder: 'Ex: João da Silva', enabled: true, required: false, visibleToClient: true, position: 6 },
        { id: 'f7', key: 'deadline', label: 'Prazo para resposta', placeholder: '', enabled: true, required: false, visibleToClient: true, position: 7 },
        { id: 'f8', key: 'description', label: 'Descrição do processo', placeholder: 'Registre a avaliação do protótipo físico apresentado...', enabled: true, required: false, visibleToClient: true, position: 8 },
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
      type: 'short_answer',
      title: 'Identificação do protótipo',
      description: 'Informe número, etiqueta, código interno ou outra identificação aplicável.',
      required: true,
      placeholder: 'Ex: Protótipo Físico #01'
    },
    {
      type: 'short_answer',
      title: 'Local da avaliação',
      description: 'Informe o local ou laboratório onde a avaliação foi realizada.',
      required: false,
      placeholder: 'Ex: Laboratório de Validação'
    },
    {
      type: 'checkbox',
      title: 'Itens avaliados no protótipo',
      description: 'Selecione os aspectos que foram verificados durante a avaliação do protótipo.',
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
      description: 'Selecione o resultado final da análise.',
      required: true,
      decisions: [
        { id: '1', text: 'Protótipo aprovado para fabricação do lote', semanticType: 'positive', requireComment: false },
        { id: '2', text: 'Protótipo aprovado com ressalvas', semanticType: 'attention', requireComment: true },
        { id: '3', text: 'Protótipo reprovado', semanticType: 'negative', requireComment: true },
        { id: '4', text: 'Nova avaliação necessária', semanticType: 'neutral', requireComment: true }
      ]
    },
    {
      type: 'acknowledgement',
      title: 'Declaração de ciência',
      description: 'Confirme a declaração de ciência antes de concluir a validação.',
      required: true,
      declarationText: 'Confirmo que o protótipo apresentado foi avaliado e que a fabricação do lote poderá utilizar esta configuração como referência. Alterações posteriores poderão gerar impactos em custos, prazos, ferramental e documentação.'
    }
  ]
};
