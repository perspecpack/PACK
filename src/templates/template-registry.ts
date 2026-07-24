import { Block } from '../components/processos/BlockFactory';
import { ProcessTemplate, approvalProjectTemplate } from './approval-project.template';
import { approvalPrototypeTemplate } from './approval-prototype.template';

export const processTemplateRegistry = {
  list(): ProcessTemplate[] {
    return [approvalProjectTemplate, approvalPrototypeTemplate];
  },

  get(id: string): ProcessTemplate | undefined {
    return this.list().find(t => t.id === id);
  },

  clone(templateId: string): { blocks: Block[] } {
    const template = this.get(templateId);
    if (!template) {
      return { blocks: [] };
    }

    const clonedBlocks = template.blocks.map(block => {
      // Generate a new UUID for each block
      const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
      
      // Return fresh block copy with new ID
      return {
        ...block,
        id: newId
      } as Block;
    });

    return { blocks: clonedBlocks };
  }
};
export type { ProcessTemplate };
