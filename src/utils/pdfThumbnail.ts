// ============================================================
// PDF Thumbnail Generator
// Renderiza a primeira página do PDF como WebP e faz upload.
// Não é bloqueante — falha silenciosamente se o PDF não cooperar.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { KnowledgeUnit } from '@/src/types';

/**
 * Renderiza a primeira página do PDF em um canvas HTML,
 * exporta como WebP e faz upload para o bucket knowledge-thumbnails.
 *
 * @returns URL pública do thumbnail, ou null em caso de falha
 */
export async function generateAndUploadThumbnail(params: {
  pdfUrl: string;
  unitId: string;
  orgSlug: string;
}): Promise<string | null> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const pdf = await pdfjsLib.getDocument({
      url: params.pdfUrl,
      withCredentials: false
    }).promise;

    const page = await pdf.getPage(1);

    // Escala para largura aproximada de 360px (faixa de 300px a 400px recomendada)
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 360;
    const scale = unscaledViewport.width > 0 ? targetWidth / unscaledViewport.width : 0.8;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    // Exportar como WebP otimizado (~20KB-30KB)
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob retornou null'))),
        'image/webp',
        0.80
      );
    });

    const storagePath = `${params.orgSlug}/${params.unitId}/thumbnail.webp`;

    const { error } = await supabase.storage
      .from('knowledge-thumbnails')
      .upload(storagePath, blob, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.warn('[Thumbnail] Upload falhou:', error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('knowledge-thumbnails')
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (err: any) {
    // Thumbnail é opcional — nunca bloqueia o fluxo principal
    console.warn('[Thumbnail] Geração falhou silenciosamente:', err?.message);
    return null;
  }
}

/**
 * Localiza a URL da miniatura de um documento ou norma na base de conhecimento (knowledgeUnits)
 * utilizando correspondência por hash, URL, nome de arquivo ou metadados (título e revisão).
 */
export function findKnowledgeThumbnail(
  item: any,
  knowledgeUnits?: KnowledgeUnit[]
): string | undefined {
  if (item?.thumbnailUrl) return item.thumbnailUrl;
  if (!item || !knowledgeUnits?.length) return undefined;

  // 1. Match por hash do arquivo principal
  if (item.fileHash) {
    const match = knowledgeUnits.find(
      k => k.organizationId === item.organizationId && k.primaryFileHash === item.fileHash
    );
    if (match?.thumbnailUrl) return match.thumbnailUrl;
  }

  // 2. Match por URL do arquivo principal
  if (item.fileUrl) {
    const match = knowledgeUnits.find(
      k => k.primaryFileUrl === item.fileUrl
    );
    if (match?.thumbnailUrl) return match.thumbnailUrl;
  }

  // 3. Match por nome do arquivo
  if (item.fileName) {
    const match = knowledgeUnits.find(
      k => k.organizationId === item.organizationId && k.primaryFileName === item.fileName
    );
    if (match?.thumbnailUrl) return match.thumbnailUrl;
  }

  // 4. Match por título, revisão e organização
  if (item.title && item.organizationId) {
    const match = knowledgeUnits.find(
      k => k.organizationId === item.organizationId &&
           k.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
           String(k.revision) === String(item.revision)
    );
    if (match?.thumbnailUrl) return match.thumbnailUrl;
  }

  return undefined;
}

