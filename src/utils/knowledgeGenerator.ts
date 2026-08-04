// ============================================================
// Knowledge JSON Generator
// Extrai texto do PDF, gera o knowledge.json e faz upload
// para o bucket knowledge-primary/{orgSlug}/{unitId}/knowledge.json
// ============================================================

import { supabase } from '@/lib/supabase';
import { extractTextFromPdf } from './pdfExtractor';
import type { KnowledgeStatus } from '@/src/types';

// Estrutura do arquivo knowledge.json armazenado no Storage.
// Este arquivo é o coração da Base de Conhecimento.
// O banco de dados armazena apenas a URL deste arquivo (ponteiro).
export interface KnowledgeJson {
  schema_version: '1.0';
  unit_id: string;
  organization_id: string;
  title: string;
  revision: string;
  document_code?: string;
  reference_norm?: string;
  extracted_at: string;
  extraction_method: string;
  page_count: number;
  language: string;
  full_text: string;
  pages: Array<{
    page: number;
    text: string;
    char_count: number;
  }>;
  // Campo reservado para IA futura — vazio agora.
  // Quando embeddings forem gerados, este campo será preenchido
  // sem necessidade de alterar o banco de dados.
  ai_ready: {
    chunks: any[];
    embeddings_model: string | null;
    embeddings_status: 'not_generated' | 'generating' | 'ready';
    last_generated_at: string | null;
  };
}

export interface GenerationResult {
  knowledgeFileUrl: string;
  status: KnowledgeStatus;
  pageCount: number;
  errorMessage?: string;
}

/**
 * Extrai texto do PDF, monta o knowledge.json e faz upload para o Storage.
 *
 * Retorna:
 * - status 'ready'   → texto extraído com sucesso
 * - status 'skipped' → PDF sem camada de texto (escaneado)
 * - status 'failed'  → erro durante extração ou upload
 */
export async function generateAndUploadKnowledge(params: {
  unitId: string;
  organizationId: string;
  orgSlug: string;
  pdfUrl: string;
  title: string;
  revision: string;
  documentCode?: string;
  referenceNorm?: string;
}): Promise<GenerationResult> {
  const {
    unitId, organizationId, orgSlug, pdfUrl,
    title, revision, documentCode, referenceNorm
  } = params;

  // 1. Extrair texto do PDF
  const extraction = await extractTextFromPdf(pdfUrl);

  if (!extraction.success) {
    return {
      knowledgeFileUrl: '',
      status: 'failed',
      pageCount: 0,
      errorMessage: extraction.errorMessage
    };
  }

  // 2. Determinar status baseado no conteúdo extraído
  // PDFs escaneados terão fullText vazio mas extraction.success = true
  const hasText = extraction.fullText.trim().length > 50;

  // 3. Montar o knowledge.json
  const knowledgeJson: KnowledgeJson = {
    schema_version: '1.0',
    unit_id: unitId,
    organization_id: organizationId,
    title,
    revision,
    document_code: documentCode,
    reference_norm: referenceNorm,
    extracted_at: new Date().toISOString(),
    extraction_method: 'pdfjs-v4-browser',
    page_count: extraction.pageCount,
    language: extraction.language,
    full_text: extraction.fullText,
    pages: extraction.pages.map(p => ({
      page: p.page,
      text: p.text,
      char_count: p.charCount
    })),
    // Campo reservado para IA — preenchido futuramente sem alterar banco
    ai_ready: {
      chunks: [],
      embeddings_model: null,
      embeddings_status: 'not_generated',
      last_generated_at: null
    }
  };

  // 4. Fazer upload do knowledge.json para o Storage
  const jsonBlob = new Blob(
    [JSON.stringify(knowledgeJson, null, 2)],
    { type: 'application/json' }
  );

  const storagePath = `${orgSlug}/${unitId}/knowledge.json`;

  const { error: uploadError } = await supabase.storage
    .from('knowledge-primary')
    .upload(storagePath, jsonBlob, {
      contentType: 'application/json',
      upsert: true
    });

  if (uploadError) {
    console.error('[Knowledge] Falha no upload do knowledge.json:', uploadError.message);
    return {
      knowledgeFileUrl: '',
      status: 'failed',
      pageCount: extraction.pageCount,
      errorMessage: uploadError.message
    };
  }

  // 5. Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('knowledge-primary')
    .getPublicUrl(storagePath);

  return {
    knowledgeFileUrl: publicUrl,
    status: hasText ? 'ready' : 'skipped',
    pageCount: extraction.pageCount
  };
}
