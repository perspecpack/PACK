// ============================================================
// PDF Text Extractor — usando PDF.js (Mozilla pdfjs-dist)
// Carregado dinamicamente para não impactar o bundle principal.
// Funciona com PDFs que possuem camada de texto digital.
// PDFs escaneados (sem texto digital) retornam fullText vazio.
// ============================================================

export interface ExtractedPage {
  page: number;
  text: string;
  charCount: number;
}

export interface ExtractionResult {
  success: boolean;
  pageCount: number;
  fullText: string;
  pages: ExtractedPage[];
  language: string;
  errorMessage?: string;
}

/**
 * Extrai texto de um PDF a partir de sua URL pública.
 * Carrega PDF.js via dynamic import (code splitting automático).
 *
 * @param pdfUrl URL pública do arquivo PDF no Supabase Storage
 * @returns ExtractionResult com texto por página e texto completo
 */
export async function extractTextFromPdf(pdfUrl: string): Promise<ExtractionResult> {
  try {
    // Dynamic import — pdfjs-dist só entra no bundle quando chamado
    const pdfjsLib = await import('pdfjs-dist');

    // Worker necessário para PDF.js funcionar no browser
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false,
      // Não bloqueia em PDFs protegidos por senha — falha graciosamente
      password: ''
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pages: ExtractedPage[] = [];
    let fullText = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Concatena itens de texto preservando espaçamento natural
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({
        page: pageNum,
        text: pageText,
        charCount: pageText.length
      });

      if (pageText) {
        fullText += (fullText ? '\n' : '') + pageText;
      }
    }

    return {
      success: true,
      pageCount,
      fullText,
      pages,
      language: 'pt'
    };
  } catch (err: any) {
    // Captura erros de PDF protegido por senha, corrompido, etc.
    return {
      success: false,
      pageCount: 0,
      fullText: '',
      pages: [],
      language: 'pt',
      errorMessage: err?.message || 'Falha desconhecida na extração de texto'
    };
  }
}
