/** Types cho Knowledge Base (Kho tri thức) */

export interface KnowledgeDocument {
  _id: string;
  title: string;
  topic: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  version: number;
}
