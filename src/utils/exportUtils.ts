import { jsPDF } from 'jspdf';

// 1. Generate Email message
export function generateEmailMessage(
  processName: string,
  organization: string,
  code: string,
  version: number,
  link: string
): string {
  const orgText = organization ? `\nOrganização responsável: ${organization}` : '';
  return `VALIDAÇÃO DE PROCESSO\n
Processo: ${processName}
Publicação: ${code} — Versão ${String(version).padStart(2, '0')}${orgText}\n
O processo está disponível para análise e validação.\n
Acesse o link:
${link}\n
Após a análise, preencha as informações solicitadas e registre sua decisão.\n
Atenciosamente,
${organization || 'PERSPECPACK'}`;
}

// 2. Export TXT file helper
export function exportTXTFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 3. Generate TXT Comprovante content
export function generateTXTComprovante(pub: any, resp: any): string {
  const blocks = pub.snapshot?.blocks || [];
  let blockText = '';
  
  blocks.forEach((block: any, index: number) => {
    blockText += `\n[Bloco ${index + 1}] ${block.title || 'Informativo'}\n`;
    if (block.description) {
      blockText += `Descrição: ${block.description}\n`;
    }
    
    const ans = resp.answers?.find((a: any) => a.blockId === block.id);
    
    if (block.type === 'heading_text') {
      blockText += `Instrução: ${block.description || ''}\n`;
    } else if (block.type === 'acknowledgement') {
      const isConfirmed = ans?.value === true || ans?.value === 'true';
      blockText += `Declaração: ${block.declarationText}\n`;
      blockText += `Confirmação: ${isConfirmed ? 'CONFIRMADO' : 'NÃO CONFIRMADO'}\n`;
    } else if (block.type === 'approval_decision') {
      const decisionText = ans?.value?.text || 'Sem resposta';
      const commentText = ans?.value?.comment ? `\nComentário: ${ans.value.comment}` : '';
      blockText += `Decisão: ${decisionText}${commentText}\n`;
    } else if (block.type === 'file_upload') {
      const files = Array.isArray(ans?.value) ? ans.value : [];
      if (files.length > 0) {
        blockText += `Arquivos enviados:\n`;
        files.forEach((f: any) => {
          blockText += `- ${f.name} (${(f.size / 1024).toFixed(1)} KB)\n`;
        });
      } else {
        blockText += `Resposta: Nenhum arquivo enviado\n`;
      }
    } else {
      blockText += `Resposta: ${ans?.value !== undefined ? String(ans.value) : 'Sem resposta'}\n`;
    }
  });

  return `==================================================
RELATÓRIO DE VALIDAÇÃO DIGITAL - PERSPECPACK
==================================================
Protocolo: ${resp.protocol}
Processo: ${pub.snapshot?.name || pub.name}
Código da Publicação: ${pub.publication_code}
Versão: ${String(pub.version).padStart(2, '0')}
Situação: VALIDADO
Data de Publicação: ${new Date(pub.published_at).toLocaleString('pt-BR')}
Data de Validação: ${new Date(resp.submitted_at).toLocaleString('pt-BR')}

--------------------------------------------------
RESPONSÁVEL PELA VALIDAÇÃO
--------------------------------------------------
Nome: ${resp.respondent_name}
Cargo/Função: ${resp.respondent_role}
E-mail: ${resp.respondent_email || 'Não informado'}
Decisão Final: ${resp.primary_decision?.text || 'Nenhum'}

--------------------------------------------------
RESPOSTAS DOS BLOCOS
--------------------------------------------------
${blockText}
--------------------------------------------------
PERSPECPACK - Validação Segura e Descentralizada
==================================================`;
}

// Helper to draw header on jsPDF
function drawPDFHeader(doc: jsPDF, title: string, code: string, version: number, organization: string) {
  // Primary green theme colors
  const tealColor = [13, 133, 122]; // #0d857a
  
  // Header background line
  doc.setDrawColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.setLineWidth(1.5);
  doc.line(14, 25, 196, 25);
  
  // Header Logo / Institution
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.text('PERSPECPACK', 14, 20);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Validação Digital Segura', 53, 19.5);

  if (organization) {
    doc.setFont('Helvetica', 'bold');
    doc.text(organization.toUpperCase(), 196 - doc.getTextWidth(organization), 20);
  }
  
  // Document Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 38);
  
  // Code and version badge
  const badgeText = `${code} - Versão ${String(version).padStart(2, '0')}`;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(13, 133, 122);
  doc.text(badgeText, 196 - doc.getTextWidth(badgeText), 37);

  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 43, 196, 43);
}

// Helper to draw footer on jsPDF
function drawPDFFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  
  const textLeft = 'PERSPECPACK - Sistema de Validação Digital Imutável';
  const textRight = `Página ${pageNum} de ${totalPages}`;
  
  doc.text(textLeft, 14, 285);
  doc.text(textRight, 196 - doc.getTextWidth(textRight), 285);
}

// 4. Generate PDF Form (Blank)
export function generatePDFForm(pub: any): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const blocks = pub.snapshot?.blocks || [];
  let y = 52;
  
  drawPDFHeader(doc, 'Formulário para Validação', pub.publication_code, pub.version, pub.organization || '');
  
  // Process name and description
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text('PROCESSO:', 14, y);
  doc.setFont('Helvetica', 'normal');
  doc.text(pub.snapshot?.name || pub.name, 40, y);
  
  y += 6;
  if (pub.snapshot?.description) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(pub.snapshot.description, 182);
    doc.text(splitDesc, 14, y);
    y += (splitDesc.length * 4) + 4;
  } else {
    y += 2;
  }
  
  // Respondent Blank Fields Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 32, 'FD');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('DADOS DO RESPONSÁVEL (PREENCHER À MÃO):', 18, y + 6);
  
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Nome Completo: __________________________________________________________________', 18, y + 14);
  doc.text('Cargo / Função: __________________________________________________________________', 18, y + 21);
  doc.text('Assinatura: _____________________________________   Data: _____ / _____ / _________', 18, y + 27);
  
  y += 40;

  // Blocks Loop
  blocks.forEach((block: any, index: number) => {
    // Check page overflow
    if (y > 255) {
      doc.addPage();
      drawPDFHeader(doc, 'Formulário para Validação', pub.publication_code, pub.version, pub.organization || '');
      y = 50;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    
    const blockTitle = `Questão ${index + 1}: ${block.title || 'Informativo'}`;
    const requiredMarker = block.required ? ' *' : '';
    doc.text(blockTitle + requiredMarker, 14, y);
    y += 5;

    if (block.description) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const descLines = doc.splitTextToSize(block.description, 182);
      doc.text(descLines, 14, y);
      y += (descLines.length * 4.5) + 2;
    }

    // Render empty space based on type
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);

    if (block.type === 'heading_text') {
      // Nothing needed
      y += 1;
    } else if (block.type === 'short_answer') {
      doc.line(14, y + 4, 196, y + 4);
      y += 10;
    } else if (block.type === 'long_answer') {
      doc.rect(14, y, 182, 16);
      y += 22;
    } else if (block.type === 'multiple_choice' || block.type === 'checkbox') {
      const options = block.options || [];
      options.forEach((opt: any) => {
        if (y > 265) {
          doc.addPage();
          drawPDFHeader(doc, 'Formulário para Validação', pub.publication_code, pub.version, pub.organization || '');
          y = 50;
        }
        doc.rect(14, y - 3, 4, 4);
        doc.text(opt.text, 22, y);
        y += 6;
      });
      if (block.allowOther) {
        doc.rect(14, y - 3, 4, 4);
        doc.text('Outro: __________________________________', 22, y);
        y += 6;
      }
      y += 2;
    } else if (block.type === 'dropdown') {
      doc.text('[ ] Selecionar na lista: ____________________________________________________', 14, y);
      y += 8;
    } else if (block.type === 'date') {
      doc.text('Data: _____ / _____ / _________', 14, y);
      y += 8;
    } else if (block.type === 'file_upload') {
      doc.text('[Anexar documento impresso ou digitalizado]', 14, y);
      y += 8;
    } else if (block.type === 'acknowledgement') {
      const declLines = doc.splitTextToSize(block.declarationText, 172);
      doc.rect(14, y - 3, 4, 4);
      doc.text(declLines, 22, y);
      y += (declLines.length * 4.5) + 6;
    } else if (block.type === 'approval_decision') {
      const decisions = block.decisions || [];
      decisions.forEach((dec: any) => {
        if (y > 265) {
          doc.addPage();
          drawPDFHeader(doc, 'Formulário para Validação', pub.publication_code, pub.version, pub.organization || '');
          y = 50;
        }
        doc.rect(14, y - 3, 4, 4);
        doc.text(dec.text + (dec.requireComment ? ' (Exige comentários)' : ''), 22, y);
        y += 6;
      });
      doc.text('Justificativa/Comentários: ____________________________________________________', 14, y + 4);
      y += 14;
    }

    y += 4; // Spacing between blocks
  });

  // Add page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPDFFooter(doc, i, pageCount);
  }

  doc.save(`Formulario-${pub.publication_code}.pdf`);
}

// 5. Generate PDF Report (With Answers)
export function generatePDFReport(pub: any, resp: any): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const blocks = pub.snapshot?.blocks || [];
  let y = 52;
  
  drawPDFHeader(doc, 'Relatório de Validação', pub.publication_code, pub.version, pub.organization || '');
  
  // Meta Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 34, 'FD');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  
  doc.text('PROCESSO:', 18, y + 6);
  doc.text('ORGANIZAÇÃO:', 18, y + 12);
  doc.text('PROTOCOLO:', 18, y + 18);
  doc.text('SITUAÇÃO:', 18, y + 24);
  doc.text('VALIDADO EM:', 18, y + 30);
  
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(pub.snapshot?.name || pub.name, 48, y + 6);
  doc.text(pub.organization || 'PERSPECPACK', 48, y + 12);
  doc.text(resp.protocol, 48, y + 18);
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('VALIDADO', 48, y + 24);
  
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(new Date(resp.submitted_at).toLocaleString('pt-BR'), 48, y + 30);
  
  y += 42;

  // Respondent Info Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 133, 122);
  doc.text('RESPONSÁVEL PELA APROVAÇÃO', 14, y);
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(13, 133, 122);
  doc.line(14, y + 2, 196, y + 2);
  
  y += 8;
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Nome:', 14, y);
  doc.text('Cargo / Função:', 14, y + 6);
  doc.text('E-mail:', 14, y + 12);
  doc.text('Resultado Final:', 14, y + 18);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(resp.respondent_name, 45, y);
  doc.text(resp.respondent_role, 45, y + 6);
  doc.text(resp.respondent_email || 'Não informado', 45, y + 12);
  
  // Highlighting final decision result semantic
  const decisionText = resp.primary_decision?.text || 'Nenhum';
  const semantic = resp.primary_decision?.semanticType || 'neutral';
  
  doc.setFont('Helvetica', 'bold');
  if (semantic === 'positive') doc.setTextColor(16, 185, 129); // green
  else if (semantic === 'attention') doc.setTextColor(245, 158, 11); // amber
  else if (semantic === 'negative') doc.setTextColor(239, 68, 68); // red
  else doc.setTextColor(100, 116, 139); // slate
  
  doc.text(decisionText.toUpperCase(), 45, y + 18);
  
  y += 28;

  // Blocks Loop
  blocks.forEach((block: any, index: number) => {
    // Check page overflow
    if (y > 255) {
      doc.addPage();
      drawPDFHeader(doc, 'Relatório de Validação', pub.publication_code, pub.version, pub.organization || '');
      y = 50;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    
    const blockTitle = `Questão ${index + 1}: ${block.title || 'Informativo'}`;
    doc.text(blockTitle, 14, y);
    y += 5;

    // Fetch respondent answer
    const ans = resp.answers?.find((a: any) => a.blockId === block.id);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    if (block.type === 'heading_text') {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const splitText = doc.splitTextToSize(block.description || '', 182);
      doc.text(splitText, 14, y);
      y += (splitText.length * 4) + 2;
    } else if (block.type === 'short_answer' || block.type === 'long_answer' || block.type === 'dropdown' || block.type === 'date') {
      const val = ans?.value !== undefined ? String(ans.value) : 'Sem resposta';
      const splitVal = doc.splitTextToSize(val, 182);
      doc.text(splitVal, 14, y);
      y += (splitVal.length * 4.5) + 4;
    } else if (block.type === 'multiple_choice' || block.type === 'checkbox') {
      const val = ans?.value;
      let textToShow = '';
      if (Array.isArray(val)) {
        textToShow = val.join(', ');
      } else {
        textToShow = val ? String(val) : 'Sem resposta';
      }
      const splitVal = doc.splitTextToSize(textToShow, 182);
      doc.text(splitVal, 14, y);
      y += (splitVal.length * 4.5) + 4;
    } else if (block.type === 'file_upload') {
      const files = Array.isArray(ans?.value) ? ans.value : [];
      if (files.length > 0) {
        files.forEach((f: any) => {
          doc.text(`Anexo: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, 14, y);
          y += 5;
        });
        y += 2;
      } else {
        doc.text('Nenhum arquivo enviado', 14, y);
        y += 6;
      }
    } else if (block.type === 'acknowledgement') {
      const isConfirmed = ans?.value === true || ans?.value === 'true';
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(isConfirmed ? 16 : 220, isConfirmed ? 185 : 38, isConfirmed ? 129 : 38);
      doc.text(isConfirmed ? '[X] DECLARAÇÃO CONFIRMADA' : '[ ] DECLARAÇÃO NÃO CONFIRMADA', 14, y);
      y += 5;
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const declLines = doc.splitTextToSize(block.declarationText || '', 182);
      doc.text(declLines, 14, y);
      y += (declLines.length * 4.5) + 4;
    } else if (block.type === 'approval_decision') {
      const decisionVal = ans?.value?.text || 'Sem resposta';
      const commentVal = ans?.value?.comment;
      
      doc.setFont('Helvetica', 'bold');
      doc.text(`Decisão Selecionada: ${decisionVal}`, 14, y);
      y += 5;
      
      if (commentVal) {
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const commentLines = doc.splitTextToSize(`Justificativa/Comentários: ${commentVal}`, 182);
        doc.text(commentLines, 14, y);
        y += (commentLines.length * 4.5) + 4;
      } else {
        y += 2;
      }
    }

    y += 2; // spacing between blocks
  });

  // Add page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPDFFooter(doc, i, pageCount);
  }

  doc.save(`Relatorio-${pub.publication_code}.pdf`);
}
