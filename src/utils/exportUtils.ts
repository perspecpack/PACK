import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { BLOCK_METADATA } from '@/src/components/processos/BlockFactory';

// Client-side SHA-256 calculator
export async function calculateSHA256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

function getInitials(name: string): string {
  if (!name) return 'PP';
  return name
    .split(' ')
    .filter(n => n.length > 0)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

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

export function generateEmailHtml(pub: any, branding: any, link: string): string {
  const companyName = branding.tradeName || branding.companyName || pub.snapshot?.company_name || 'PERSPECPACK';
  const logoUrl = branding.companyLogoUrl || pub.snapshot?.company_logo_url;
  
  let logoHtml = '';
  if (logoUrl) {
    logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoUrl}" alt="Logo" style="max-height: 60px; max-width: 200px; object-fit: contain;" /></div>`;
  }
  
  const processName = pub.snapshot?.name || pub.snapshot?.title || 'Processo de Validação';
  const code = pub.publication_code;
  const version = pub.version || 1;
  const project = pub.snapshot?.project || 'N/A';
  const client = pub.snapshot?.client || 'N/A';
  const revision = pub.snapshot?.revision || 'N/A';
  const description = pub.snapshot?.description || 'Sem descrição fornecida.';
  const responsible = pub.snapshot?.responsible_internal || 'N/A';
  const dateStr = new Date(pub.published_at || pub.created_at || Date.now()).toLocaleDateString('pt-BR');

  // Materials
  const materialsList = pub.snapshot?.materials || [];
  let materialsHtml = '';
  if (materialsList.length > 0) {
    materialsHtml = materialsList.map((m: any) => {
      return `<li style="margin-bottom: 6px;"><strong>${m.name}</strong> [${m.category}] ${m.revision ? `(Rev ${m.revision})` : ''} - <em>${m.fileName}</em></li>`;
    }).join('');
  } else {
    materialsHtml = '<li>Nenhum material de análise anexado.</li>';
  }

  // Blocks form
  const blocks = pub.snapshot?.blocks || [];
  let blocksHtml = '';
  
  blocks.forEach((block: any, index: number) => {
    if (block.type === 'heading_text') {
      blocksHtml += `
        <div style="margin-top: 24px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 14px; color: #0d857a; font-weight: bold;">${block.title || 'Informativo'}</h3>
          ${block.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; line-height: 1.4;">${block.description}</p>` : ''}
        </div>
      `;
    } else {
      const displayTitle = (block.title && block.title.trim()) || (BLOCK_METADATA[block.type] as any)?.title || 'Resposta';
      let blockContent = '';
      
      if (block.type === 'short_answer') {
        blockContent = `<div style="border: 1px solid #cbd5e1; border-radius: 6px; height: 32px; margin-top: 6px; background-color: #f8fafc;"></div>`;
      } else if (block.type === 'long_answer') {
        blockContent = `<div style="border: 1px solid #cbd5e1; border-radius: 6px; height: 60px; margin-top: 6px; background-color: #f8fafc;"></div>`;
      } else if (block.type === 'date') {
        blockContent = `<div style="font-size: 12px; color: #475569; margin-top: 6px;">Data: _____ / _____ / _________</div>`;
      } else if (block.type === 'dropdown') {
        blockContent = `<div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; font-size: 11px; color: #64748b; margin-top: 6px; background-color: #f8fafc;">[ Selecionar na lista ]</div>`;
      } else if (block.type === 'checkbox' || block.type === 'multiple_choice') {
        const isCheckbox = block.type === 'checkbox';
        const symbol = isCheckbox ? '[  ]' : '(  )';
        const optionsList = block.options || [];
        blockContent = `<ul style="list-style-type: none; padding-left: 0; margin: 6px 0 0 0;">`;
        optionsList.forEach((opt: any) => {
          blockContent += `<li style="margin-bottom: 6px; font-size: 12px; color: #334155;"><span style="font-family: monospace; font-weight: bold; margin-right: 8px;">${symbol}</span> ${opt.text}</li>`;
        });
        if (block.allowOther) {
          blockContent += `<li style="margin-bottom: 6px; font-size: 12px; color: #334155;"><span style="font-family: monospace; font-weight: bold; margin-right: 8px;">${symbol}</span> Outro: _______________________________</li>`;
        }
        blockContent += `</ul>`;
      } else if (block.type === 'file_upload') {
        blockContent = `<div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; font-size: 11px; color: #64748b; margin-top: 6px; background-color: #f8fafc;">[ Anexar arquivo de resposta ]</div>`;
      } else if (block.type === 'acknowledgement') {
        blockContent = `
          <div style="font-size: 11px; color: #475569; line-height: 1.4; border-left: 3px solid #cbd5e1; padding-left: 10px; margin-top: 6px; font-style: italic;">
            ${block.declarationText || ''}
          </div>
          <div style="margin-top: 8px; font-size: 12px; font-weight: bold; color: #0d857a;">
            <span style="font-family: monospace; margin-right: 8px;">[  ]</span> Aceito e confirmo a declaração acima
          </div>
        `;
      } else if (block.type === 'approval_decision') {
        const decisions = block.decisions || [];
        blockContent = `<ul style="list-style-type: none; padding-left: 0; margin: 6px 0 0 0;">`;
        decisions.forEach((dec: any) => {
          blockContent += `<li style="margin-bottom: 6px; font-size: 12px; font-weight: bold; color: #334155;"><span style="font-family: monospace; margin-right: 8px;">(  )</span> ${dec.text}</li>`;
        });
        blockContent += `</ul>`;
        blockContent += `
          <div style="margin-top: 10px;">
            <label style="font-size: 11px; font-weight: bold; color: #475569; display: block;">Justificativa/Comentários:</label>
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; height: 48px; margin-top: 4px; background-color: #f8fafc;"></div>
          </div>
        `;
      }
      
      blocksHtml += `
        <div style="margin-top: 18px; margin-bottom: 18px; page-break-inside: avoid;">
          <label style="font-size: 12px; font-weight: bold; color: #334155; display: block;">
            Questão ${index + 1}: ${displayTitle} ${block.required ? '<span style="color: #ef4444;">*</span>' : ''}
          </label>
          ${block.description ? `<p style="margin: 2px 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.4;">${block.description}</p>` : ''}
          ${blockContent}
        </div>
      `;
    }
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b; background-color: #ffffff;">
      ${logoHtml}
      
      <div style="text-align: center; border-bottom: 2px solid #0d857a; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px; color: #1e293b;">Solicitação de Aprovação Digital</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Enviado por: <strong>${companyName}</strong></p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 140px;">PROCESSO:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #1e293b;">${processName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">CÓDIGO:</td>
          <td style="padding: 6px 0; color: #334155; font-family: monospace;">${code}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">VERSÃO / REVISÃO:</td>
          <td style="padding: 6px 0; color: #334155;">Versão ${String(version).padStart(2, '0')} ${revision !== 'N/A' ? `(Rev ${revision})` : ''}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">PROJETO:</td>
          <td style="padding: 6px 0; color: #334155;">${project}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">CLIENTE:</td>
          <td style="padding: 6px 0; color: #334155;">${client}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">RESPONSÁVEL INTERNO:</td>
          <td style="padding: 6px 0; color: #334155;">${responsible}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">DATA DE ENVIO:</td>
          <td style="padding: 6px 0; color: #334155;">${dateStr}</td>
        </tr>
        ${description ? `
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">DESCRIÇÃO:</td>
          <td style="padding: 6px 0; color: #475569; line-height: 1.4;">${description}</td>
        </tr>
        ` : ''}
      </table>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #0d857a; font-weight: bold; text-transform: uppercase;">Materiais para Análise</h3>
        <ul style="padding-left: 20px; margin: 0 0 12px 0; font-size: 12px; color: #334155; line-height: 1.5;">
          ${materialsHtml}
        </ul>
        <div style="font-size: 11px; color: #b45309; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
          ⚠️ ATENÇÃO: Os arquivos acima devem ser anexados manualmente a esta mensagem de e-mail ao enviar ao cliente.
        </div>
      </div>
      
      <div style="border: 2px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #1e293b; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          Formulário de Validação
        </h3>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 16px;">
          Por favor, preencha as respostas assinalando as opções e inserindo as informações solicitadas.
        </p>
        ${blocksHtml}
      </div>
      
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 12px; background-color: #f8fafc;">
        <h4 style="margin: 0 0 8px 0; color: #334155; font-weight: bold;">IDENTIFICAÇÃO DO RESPONSÁVEL</h4>
        <div style="margin-bottom: 8px;"><strong>Nome Completo:</strong> ____________________________________________</div>
        <div style="margin-bottom: 8px;"><strong>Cargo ou Função:</strong> __________________________________________</div>
        <div style="margin-bottom: 8px;"><strong>E-mail Profissional:</strong> ________________________________________</div>
        <div style="margin-bottom: 8px;"><strong>Data:</strong> ____ / ____ / ________</div>
        <div><strong>Assinatura:</strong> __________________________________________________</div>
      </div>

      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px; font-size: 11px; color: #94a3b8; font-weight: bold;">
        <span>Se preferir, valide online através do link:</span><br/>
        <a href="${link}" target="_blank" style="color: #0d857a; text-decoration: underline; display: inline-block; margin-top: 6px; font-family: monospace;">${link}</a>
      </div>
    </div>
  `;
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

// Helper to build normalized validation report data (consumed by PDF, TXT, and visual ApprovalDocumentRenderer)
export function buildApprovalReportData(pub: any, resp: any) {
  if (!pub) {
    return {
      publication: {} as any,
      respondent: {} as any,
      result: {} as any,
      companyBranding: {} as any,
      blocks: [] as any[],
      materials: [] as any[],
      attachments: [] as any[],
      rendererAnswers: [] as any[]
    };
  }

  const snapshot = pub.snapshot || {};
  const rawAnswers = resp?.answers || [];
  const rawMaterials = snapshot.materials || pub.materials || [];

  // 1. Respondent
  const respondent = {
    name: resp?.respondent_name || resp?.respondentName || '',
    role: resp?.respondent_role || resp?.respondentRole || '',
    email: resp?.respondent_email || resp?.respondentEmail || 'Não informado'
  };

  // 2. Publication metadata
  const publication = {
    id: pub.id,
    code: pub.publication_code || pub.publicationCode || '',
    version: pub.version || 1,
    processTitle: snapshot.name || snapshot.title || pub.name || '',
    company: pub.organization || 'PERSPECPACK',
    client: snapshot.client || 'N/A',
    project: snapshot.project || 'N/A',
    projectCode: snapshot.code || 'N/A',
    revision: snapshot.revision || 'N/A',
    protocol: resp?.protocol || 'N/A',
    validatedAt: resp?.submitted_at || resp?.validated_at || null,
    status: pub.status
  };

  // 2b. Company Branding
  const companyBranding = {
    companyName: snapshot.company_name || snapshot.companyName || pub.organization || 'PERSPECPACK',
    tradeName: snapshot.trade_name || snapshot.tradeName || snapshot.company_name || snapshot.companyName || pub.organization || 'PERSPECPACK',
    companyLogoUrl: snapshot.company_logo_url || snapshot.companyLogoUrl || '',
    companyWebsite: snapshot.company_website || snapshot.companyWebsite || '',
    corporateEmail: snapshot.corporate_email || snapshot.corporateEmail || '',
    phone: snapshot.phone || snapshot.phone || '',
    shortDescription: snapshot.short_description || snapshot.shortDescription || '',
    footerText: snapshot.footer_text || snapshot.footerText || ''
  };

  // 3. Result (decision)
  let decisionText = resp?.primary_decision?.text || resp?.primaryDecision?.text;
  let decisionSemantic = resp?.primary_decision?.semanticType || resp?.primary_decision?.semantic_type || resp?.primaryDecision?.semanticType;
  let decisionComment = resp?.primary_decision?.comment || resp?.primaryDecision?.comment || '';

  // Fallback to block response if primary_decision is empty
  if (!decisionText && rawAnswers.length > 0) {
    const decAns = rawAnswers.find((a: any) => (a.block_type || a.blockType) === 'approval_decision');
    if (decAns) {
      const decVal = decAns.value || decAns.answer || decAns.decision;
      if (decVal && typeof decVal === 'object') {
        decisionText = decVal.text || decVal.value;
        decisionSemantic = decVal.semanticType || decVal.semantic_type;
        decisionComment = decVal.comment || '';
      } else if (typeof decVal === 'string') {
        decisionText = decVal;
        decisionComment = decAns.comment || '';
      }
    }
  }

  // Secondary fallback to publication fields
  if (!decisionText) {
    decisionText = pub.primary_result || '';
    decisionSemantic = pub.primary_result_type || 'neutral';
  }

  const result = {
    label: decisionText || 'Pendente',
    semanticType: decisionSemantic || 'neutral',
    comment: decisionComment
  };

  // 4. Blocks Loop
  const snapshotBlocks = snapshot.blocks || [];
  const rendererAnswers: any[] = [];
  const attachments: any[] = [];

  const normalizedBlocks = snapshotBlocks.map((block: any) => {
    const ans = rawAnswers.find((a: any) => (a.block_id || a.blockId) === block.id);
    let value: any = undefined;
    let answerText = '';
    let confirmed: boolean | undefined = undefined;
    let decision: any = undefined;
    let files: any[] = [];

    // Helper default
    const rawVal = ans?.value !== undefined ? ans.value : ans?.answer;

    if (block.type === 'heading_text') {
      value = '';
      answerText = block.description || '';
    } else if (block.type === 'request_information') {
      value = '';
      answerText = '';
    } else if (block.type === 'analysis_materials') {
      value = '';
      answerText = '';
    } else if (block.type === 'short_answer' || block.type === 'long_answer' || block.type === 'dropdown') {
      value = rawVal !== undefined ? String(rawVal) : '';
      answerText = value.trim() ? value : 'Não informado';
    } else if (block.type === 'date') {
      value = rawVal !== undefined ? String(rawVal) : '';
      if (value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          answerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const day = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year = d.getUTCFullYear();
            answerText = `${day}/${month}/${year}`;
          } else {
            answerText = value;
          }
        }
      } else {
        answerText = 'Não informado';
      }
    } else if (block.type === 'checkbox') {
      let list: string[] = [];
      let otherSelected = false;
      let otherText = '';

      if (ans) {
        if (ans.selected_option_labels !== undefined) {
          list = (ans.selected_option_labels || []).filter((l: string) => l !== 'Outro');
          otherSelected = (ans.selected_option_labels || []).includes('Outro');
          otherText = ans.other_text || ans.otherText || '';
        } else if (ans.value !== undefined) {
          if (typeof ans.value === 'object' && ans.value !== null) {
            list = ans.value.list || [];
            otherSelected = !!ans.value.otherSelected;
            otherText = ans.value.otherText || ans.value.other_text || '';
          } else if (Array.isArray(ans.value)) {
            list = ans.value.filter((item: any) => item !== 'Outro');
            otherSelected = ans.value.includes('Outro');
          }
        } else if (ans.answer !== undefined) {
          const items = String(ans.answer).split(',').map(s => s.trim());
          list = items.filter(item => item !== 'Outro');
          otherSelected = items.includes('Outro');
          otherText = ans.other_text || ans.otherText || '';
        }
      }

      value = { list, otherSelected, otherText };
      
      const labels = [...list];
      if (otherSelected) {
        labels.push(otherText ? `Outro: ${otherText}` : 'Outro');
      }
      answerText = labels.length > 0 ? labels.join(', ') : 'Não informado';
    } else if (block.type === 'multiple_choice') {
      let radioVal = '';
      let otherSelected = false;
      let otherText = '';

      if (ans) {
        if (ans.selected_option_labels !== undefined) {
          const hasOther = (ans.selected_option_labels || []).includes('Outro');
          if (hasOther) {
            otherSelected = true;
            otherText = ans.other_text || ans.otherText || '';
          } else {
            radioVal = ans.selected_option_labels?.[0] || ans.answer || '';
          }
        } else if (ans.value !== undefined) {
          if (typeof ans.value === 'object' && ans.value !== null) {
            radioVal = ans.value.value || '';
            otherSelected = !!ans.value.otherSelected;
            otherText = ans.value.otherText || ans.value.other_text || '';
          } else if (typeof ans.value === 'string') {
            if (ans.value === 'Outro') {
              otherSelected = true;
              otherText = ans.other_text || ans.otherText || '';
            } else {
              radioVal = ans.value;
            }
          }
        } else if (ans.answer !== undefined) {
          if (String(ans.answer).startsWith('Outro:')) {
            otherSelected = true;
            otherText = String(ans.answer).replace('Outro:', '').trim();
          } else if (ans.answer === 'Outro') {
            otherSelected = true;
          } else {
            radioVal = String(ans.answer);
          }
        }
      }

      value = otherSelected ? { value: '', otherSelected: true, otherText } : radioVal;
      
      if (otherSelected) {
        answerText = otherText ? `Outro: ${otherText}` : 'Outro';
      } else {
        answerText = radioVal || 'Não informado';
      }
    } else if (block.type === 'acknowledgement') {
      confirmed = false;
      if (ans) {
        if (ans.confirmed !== undefined) {
          confirmed = ans.confirmed === true;
        } else if (ans.value !== undefined) {
          confirmed = ans.value === true || ans.value === 'true';
        } else if (ans.answer !== undefined) {
          confirmed = ans.answer === 'Confirmado' || ans.answer === 'true' || ans.answer === true;
        } else if (ans.accepted !== undefined) {
          confirmed = ans.accepted === true;
        }
      }
      value = confirmed;
      answerText = confirmed ? 'Termo aceito e assinado digitalmente' : 'Declaração não confirmada';
    } else if (block.type === 'approval_decision') {
      let decId = '';
      let decText = '';
      let decSemantic = '';
      let decComment = '';

      if (ans) {
        if (ans.selected_option_ids?.[0]) {
          decId = ans.selected_option_ids[0];
          decText = ans.selected_option_labels?.[0] || ans.answer || '';
          decComment = ans.comment || '';
          
          const decOpt = block.decisions?.find((d: any) => d.id === decId);
          decSemantic = decOpt?.semanticType || ans.semantic_type || '';
        } else if (ans.value !== undefined) {
          if (typeof ans.value === 'object' && ans.value !== null) {
            decId = ans.value.id || '';
            decText = ans.value.text || ans.value.value || '';
            decSemantic = ans.value.semanticType || ans.value.semantic_type || '';
            decComment = ans.value.comment || '';
          } else if (typeof ans.value === 'string') {
            decText = ans.value;
            decComment = ans.comment || '';
          }
        } else if (ans.answer !== undefined) {
          decText = String(ans.answer);
          decComment = ans.comment || '';
        }
      }

      decision = { id: decId, text: decText, semanticType: decSemantic, comment: decComment };
      value = decision;
      answerText = decText || 'Não informado';
    } else if (block.type === 'file_upload') {
      let rawFiles: any[] = [];
      if (ans) {
        if (Array.isArray(ans.attached_files)) {
          rawFiles = ans.attached_files;
        } else if (Array.isArray(ans.value)) {
          rawFiles = ans.value;
        } else if (ans.value && typeof ans.value === 'object') {
          rawFiles = [ans.value];
        }
      }

      files = rawFiles.map((f: any) => ({
        name: f.name || f.originalName || f.original_name || f.fileName || 'Arquivo',
        size: f.size || f.size_bytes || 0,
        fileHash: f.fileHash || f.file_hash || f.hash || 'N/A',
        mimeType: f.mimeType || f.mime_type || f.type || 'application/octet-stream'
      }));

      value = files;
      answerText = files.length > 0 ? `${files.length} arquivo(s) enviado(s)` : 'Não informado';
      
      files.forEach(f => attachments.push(f));
    }

    rendererAnswers.push({ blockId: block.id, value });

    return {
      id: block.id,
      type: block.type,
      title: block.title,
      description: block.description,
      required: !!block.required,
      options: block.options,
      decisions: block.decisions,
      declarationText: block.declarationText,
      value,
      answerText,
      confirmed,
      decision,
      files
    };
  });

  return {
    publication,
    respondent,
    result,
    companyBranding,
    blocks: normalizedBlocks,
    materials: rawMaterials,
    attachments,
    rendererAnswers
  };
}

// 3. Generate TXT Comprovante content
export function generateTXTComprovante(pub: any, resp: any): string {
  const reportData = buildApprovalReportData(pub, resp);
  let blockText = '';
  let questionNumber = 0;

  reportData.blocks.forEach((block: any) => {
    const displayTitle = (block.title && block.title.trim()) || (BLOCK_METADATA[block.type as any] as any)?.title || 'Informativo';
    
    let blockTitle = displayTitle;
    const isAnswerable = !['heading_text', 'request_information', 'analysis_materials'].includes(block.type);
    if (isAnswerable) {
      questionNumber++;
      blockTitle = `Questão ${questionNumber}: ${displayTitle}`;
    }

    blockText += `\n[${blockTitle}]\n`;
    if (block.description) {
      blockText += `Descrição: ${block.description}\n`;
    }
    
    if (block.type === 'heading_text') {
      blockText += `Instrução: ${block.description || ''}\n`;
    } else if (block.type === 'acknowledgement') {
      blockText += `Declaração: ${block.declarationText || ''}\n`;
      blockText += `Confirmação: ${block.confirmed ? 'CONFIRMADO E ASSINADO DIGITALMENTE' : 'NÃO CONFIRMADO'}\n`;
    } else if (block.type === 'approval_decision') {
      const decisionText = block.decision?.text || 'Sem resposta';
      const commentText = block.decision?.comment ? `\nComentário: ${block.decision.comment}` : '\nComentário: Não foram registradas observações.';
      blockText += `Decisão: ${decisionText}${commentText}\n`;
    } else if (block.type === 'file_upload') {
      const files = block.files || [];
      if (files.length > 0) {
        blockText += `Arquivos enviados:\n`;
        files.forEach((f: any) => {
          blockText += `- ${f.name} (${(f.size / 1024).toFixed(1)} KB) [Hash: ${f.fileHash}]\n`;
        });
      } else {
        blockText += `Resposta: Nenhum arquivo enviado\n`;
      }
    } else if (block.type === 'checkbox' || block.type === 'multiple_choice') {
      const options = block.options || [];
      const isCheckbox = block.type === 'checkbox';
      if (options.length > 0) {
        options.forEach((opt: any) => {
          let isSelected = false;
          if (isCheckbox) {
            isSelected = block.value?.list?.includes(opt.text) === true;
          } else {
            const radioVal = block.value;
            isSelected = (typeof radioVal === 'string' && radioVal === opt.text) || (radioVal?.value === opt.text);
          }
          blockText += `${isSelected ? '[X]' : '[ ]'} ${opt.text}\n`;
        });
        if (block.allowOther) {
          const otherSelected = !!block.value?.otherSelected;
          const otherText = block.value?.otherText || '';
          const otherTextSuffix = (otherSelected && otherText) ? `: ${otherText}` : '';
          blockText += `${otherSelected ? '[X]' : '[ ]'} Outro${otherTextSuffix}\n`;
        }
      } else {
        blockText += `Resposta: ${block.answerText}\n`;
      }
    } else if (block.type === 'dropdown') {
      blockText += `Resposta selecionada: ${block.answerText}\n`;
    } else {
      blockText += `Resposta: ${block.answerText}\n`;
    }
  });

  return ` ==================================================
RELATÓRIO DE VALIDAÇÃO DIGITAL - PERSPECPACK
 ==================================================
Protocolo: ${reportData.publication.protocol}
Processo: ${reportData.publication.processTitle}
Código da Publicação: ${reportData.publication.code}
Versão: ${String(reportData.publication.version).padStart(2, '0')}
Situação: VALIDADO
Data de Publicação: ${new Date(pub.published_at).toLocaleString('pt-BR')}
Data de Validação: ${reportData.publication.validatedAt ? new Date(reportData.publication.validatedAt).toLocaleString('pt-BR') : 'N/A'}

--------------------------------------------------
RESPONSÁVEL PELA VALIDAÇÃO
--------------------------------------------------
Nome: ${reportData.respondent.name}
Cargo/Função: ${reportData.respondent.role}
E-mail: ${reportData.respondent.email}
Decisão Final: ${reportData.result.label}

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

    const displayTitle = (block.title && block.title.trim()) || (BLOCK_METADATA[block.type as any] as any)?.title || 'Informativo';
    const blockTitle = `Questão ${index + 1}: ${displayTitle}`;
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


function drawInitialsFallback(doc: jsPDF, companyName: string) {
  const initials = getInitials(companyName);
  doc.setFillColor(13, 133, 122); // teal
  doc.roundedRect(14, 12, 10, 10, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(initials, 19 - doc.getTextWidth(initials) / 2, 18.5);
}

function drawOfficialPDFHeader(doc: jsPDF, reportData: any, logoImg: HTMLImageElement | null) {
  let yText = 15;
  const companyName = reportData.companyBranding.companyName;
  const tradeName = reportData.companyBranding.tradeName || companyName;
  
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 14, 12, 35, 10, undefined, 'FAST');
      yText = 27;
    } catch (e) {
      console.error('Error rendering company logo in PDF header:', e);
      drawInitialsFallback(doc, companyName);
      yText = 27;
    }
  } else {
    drawInitialsFallback(doc, companyName);
    yText = 27;
  }

  // Draw tradeName / companyName
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(tradeName, 14, yText);

  // Draw shortDescription
  if (reportData.companyBranding.shortDescription) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(reportData.companyBranding.shortDescription, 95);
    doc.text(descLines, 14, yText + 3.5);
  }

  // LADO DIREITO: Relatório Oficial, Código, Versão, Protocolo, Data
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(13, 133, 122);
  doc.text('Relatório Oficial de Validação', 196, 16, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  
  const pubCodeVersion = `${reportData.publication.code} — Versão ${String(reportData.publication.version).padStart(2, '0')}`;
  doc.text(pubCodeVersion, 196, 21, { align: 'right' });
  doc.text(`Protocolo: ${reportData.publication.protocol}`, 196, 25, { align: 'right' });
  
  const validatedAtStr = reportData.publication.validatedAt
    ? new Date(reportData.publication.validatedAt).toLocaleString('pt-BR')
    : 'N/A';
  doc.text(`Validado em: ${validatedAtStr}`, 196, 29, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, 38, 196, 38);
}

function drawOfficialPDFHeaderCompact(doc: jsPDF, reportData: any, logoImg: HTMLImageElement | null) {
  const companyName = reportData.companyBranding.companyName;
  const tradeName = reportData.companyBranding.tradeName || companyName;

  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 14, 10, 15, 4.3, undefined, 'FAST');
    } catch (e) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(tradeName.toUpperCase(), 14, 13.5);
    }
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(tradeName.toUpperCase(), 14, 13.5);
  }

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const textRight = `Relatório de Validação | ${reportData.publication.code} - Versão ${String(reportData.publication.version).padStart(2, '0')}`;
  doc.text(textRight, 196, 13.5, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, 17, 196, 17);
}

// Helper to construct the official validation PDF document
export function buildPDFDoc(
  pub: any,
  resp: any,
  pdfHashOverride?: string,
  logoImg: HTMLImageElement | null = null
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const reportData = buildApprovalReportData(pub, resp);
  let y = 44;
  
  drawOfficialPDFHeader(doc, reportData, logoImg);
  
  // Meta Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 40, 'FD');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  
  doc.text('PROCESSO:', 18, y + 5);
  doc.text('ORGANIZAÇÃO:', 18, y + 10);
  doc.text('PROJETO:', 18, y + 15);
  doc.text('CLIENTE:', 18, y + 20);
  doc.text('REVISÃO:', 18, y + 25);
  doc.text('PROTOCOLO:', 18, y + 30);
  doc.text('VALIDADO EM:', 18, y + 35);
  
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(reportData.publication.processTitle, 48, y + 5);
  doc.text(reportData.publication.company, 48, y + 10);
  doc.text(reportData.publication.project, 48, y + 15);
  doc.text(reportData.publication.client, 48, y + 20);
  doc.text(reportData.publication.revision, 48, y + 25);
  doc.text(reportData.publication.protocol, 48, y + 30);
  doc.text(
    reportData.publication.validatedAt
      ? new Date(reportData.publication.validatedAt).toLocaleString('pt-BR')
      : 'N/A',
    48,
    y + 35
  );
  
  y += 48;
 
  // Respondent Info Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 133, 122);
  doc.text('RESPONSÁVEL PELA VALIDAÇÃO', 14, y);
  
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
  doc.text(reportData.respondent.name, 45, y);
  doc.text(reportData.respondent.role, 45, y + 6);
  doc.text(reportData.respondent.email, 45, y + 12);
  
  const decisionText = reportData.result.label;
  const semantic = reportData.result.semanticType;
  
  doc.setFont('Helvetica', 'bold');
  if (semantic === 'positive') doc.setTextColor(16, 185, 129);
  else if (semantic === 'attention') doc.setTextColor(245, 158, 11);
  else if (semantic === 'negative') doc.setTextColor(239, 68, 68);
  else doc.setTextColor(100, 116, 139);
  
  doc.text(decisionText.toUpperCase(), 45, y + 18);
  
  y += 28;
 
  let questionNumber = 0;

  // Blocks Loop
  reportData.blocks.forEach((block: any) => {
    if (y > 250) {
      doc.addPage();
      drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
      y = 25;
    }
 
    const displayTitle = (block.title && block.title.trim()) || (BLOCK_METADATA[block.type as any] as any)?.title || 'Informativo';
    
    let blockTitle = displayTitle;
    const isAnswerable = !['heading_text', 'request_information', 'analysis_materials'].includes(block.type);
    if (isAnswerable) {
      questionNumber++;
      blockTitle = `Questão ${questionNumber}: ${displayTitle}`;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(blockTitle, 14, y);
    y += 5;
 
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
 
    if (block.type === 'heading_text') {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const splitText = doc.splitTextToSize(block.description || '', 182);
      doc.text(splitText, 14, y);
      y += (splitText.length * 4) + 2;
    } else if (block.type === 'request_information') {
      const enabledFields = (block.fields || []).filter((f: any) => f.enabled && f.visibleToClient);
      if (enabledFields.length > 0) {
        enabledFields.forEach((field: any) => {
          let val = '';
          if (field.key === 'title') val = reportData.publication.processTitle;
          else if (field.key === 'client') val = reportData.publication.client;
          else if (field.key === 'project') val = reportData.publication.project;
          else if (field.key === 'code') val = reportData.publication.projectCode;
          else if (field.key === 'revision') val = reportData.publication.revision;
          else if (field.key === 'responsible_internal') val = pub.snapshot?.responsible_internal || '';
          else if (field.key === 'deadline') val = pub.snapshot?.deadline ? new Date(pub.snapshot.deadline).toLocaleString('pt-BR') : '';
          else if (field.key === 'description') val = pub.snapshot?.description || '';
          else if (field.key === 'notes_for_client') val = pub.snapshot?.notes_for_client || '';
          
          if (val) {
            if (y > 270) {
              doc.addPage();
              drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
              y = 25;
            }
            doc.setFont('Helvetica', 'bold');
            doc.text(`${field.label}:`, 18, y);
            doc.setFont('Helvetica', 'normal');
            const splitVal = doc.splitTextToSize(val, 140);
            doc.text(splitVal, 52, y);
            y += (splitVal.length * 4.5) + 2;
          }
        });
        y += 2;
      } else {
        doc.text('Nenhuma informação visível ao cliente.', 14, y);
        y += 6;
      }
    } else if (block.type === 'analysis_materials') {
      const materialsList = reportData.materials;
      if (materialsList.length > 0) {
        materialsList.forEach((m: any) => {
          if (y > 270) {
            doc.addPage();
            drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
            y = 25;
          }
          const info = `${m.name} [${m.category}] ${m.revision ? `(Rev ${m.revision})` : ''} - ${m.fileName}`;
          const splitInfo = doc.splitTextToSize(info, 175);
          doc.text(splitInfo, 18, y);
          y += (splitInfo.length * 4.5) + 1;
        });
        y += 2;
      } else {
        doc.text('Nenhum material anexado.', 14, y);
        y += 6;
      }
    } else if (block.type === 'short_answer' || block.type === 'long_answer' || block.type === 'dropdown' || block.type === 'date') {
      let valToShow = block.answerText;
      if (block.type === 'dropdown') {
        valToShow = `Resposta selecionada:\n${block.answerText}`;
      }
      const splitVal = doc.splitTextToSize(valToShow, 182);
      doc.text(splitVal, 14, y);
      y += (splitVal.length * 4.5) + 4;
    } else if (block.type === 'multiple_choice' || block.type === 'checkbox') {
      const options = block.options || [];
      const isCheckbox = block.type === 'checkbox';

      if (options.length > 0) {
        options.forEach((opt: any) => {
          if (y > 270) {
            doc.addPage();
            drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
            y = 25;
          }
          
          let isSelected = false;
          if (isCheckbox) {
            isSelected = block.value?.list?.includes(opt.text) === true;
          } else {
            const radioVal = block.value;
            isSelected = (typeof radioVal === 'string' && radioVal === opt.text) || (radioVal?.value === opt.text);
          }

          doc.text(`${isSelected ? '[X]' : '[ ]'} ${opt.text}`, 14, y);
          y += 6;
        });

        if (block.allowOther) {
          if (y > 270) {
            doc.addPage();
            drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
            y = 25;
          }
          const otherSelected = !!block.value?.otherSelected;
          const otherText = block.value?.otherText || '';
          const otherTextSuffix = (otherSelected && otherText) ? `: ${otherText}` : '';
          doc.text(`${otherSelected ? '[X]' : '[ ]'} Outro${otherTextSuffix}`, 14, y);
          y += 6;
        }
      } else {
        // Fallback for missing options in older validations
        const splitVal = doc.splitTextToSize(block.answerText, 182);
        doc.text(splitVal, 14, y);
        y += (splitVal.length * 4.5) + 4;
      }
      y += 2;
    } else if (block.type === 'file_upload') {
      const files = block.files || [];
      if (files.length > 0) {
        files.forEach((f: any) => {
          if (y > 270) {
            doc.addPage();
            drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
            y = 25;
          }
          doc.text(`Anexo: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, 14, y);
          y += 5;
        });
        y += 2;
      } else {
        doc.text('Nenhum arquivo enviado', 14, y);
        y += 6;
      }
    } else if (block.type === 'acknowledgement') {
      const isConfirmed = !!block.confirmed;
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(isConfirmed ? 16 : 220, isConfirmed ? 185 : 38, isConfirmed ? 129 : 38);
      doc.text(isConfirmed ? '[X] TERMO ACEITO E ASSINADO DIGITALMENTE' : '[ ] DECLARAÇÃO NÃO CONFIRMADA', 14, y);
      doc.setTextColor(30, 41, 59); // Reset
      y += 5;
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const declLines = doc.splitTextToSize(block.declarationText || '', 182);
      doc.text(declLines, 14, y);
      y += (declLines.length * 4.5) + 4;

      if (isConfirmed) {
        doc.setFont('Helvetica', 'oblique');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const signText = `Assinado por ${reportData.respondent.name} (${reportData.respondent.role}) em ${
          reportData.publication.validatedAt ? new Date(reportData.publication.validatedAt).toLocaleString('pt-BR') : 'N/A'
        } - Protocolo: ${reportData.publication.protocol}`;
        doc.text(signText, 14, y);
        y += 6;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
      }
    } else if (block.type === 'approval_decision') {
      const decState = block.decision;
      const decisionVal = decState?.text || 'Sem resposta';
      const commentVal = decState?.comment || '';
      
      doc.setFont('Helvetica', 'bold');
      if (decState?.semanticType === 'positive') doc.setTextColor(16, 185, 129);
      else if (decState?.semanticType === 'attention') doc.setTextColor(245, 158, 11);
      else if (decState?.semanticType === 'negative') doc.setTextColor(239, 68, 68);
      else doc.setTextColor(100, 116, 139);

      doc.text(`Decisão Selecionada: ${decisionVal.toUpperCase()}`, 14, y);
      doc.setTextColor(30, 41, 59); // Reset
      y += 5;
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const commentText = commentVal ? `Justificativa/Comentários: ${commentVal}` : 'Não foram registradas observações.';
      const commentLines = doc.splitTextToSize(commentText, 182);
      doc.text(commentLines, 14, y);
      y += (commentLines.length * 4.5) + 4;
    }
    y += 2;
  });
 
  // Section: RASTREABILIDADE DE ARQUIVOS (SHA-256)
  if (y > 220) {
    doc.addPage();
    drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
    y = 25;
  }
  
  y += 4;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 133, 122);
  doc.text('RASTREABILIDADE DE ARQUIVOS (SHA-256)', 14, y);
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(13, 133, 122);
  doc.line(14, y + 2, 196, y + 2);
  y += 8;
 
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Arquivo', 16, y);
  doc.text('Origem / Tipo', 110, y);
  doc.text('Código Hash SHA-256', 142, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 5;
 
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
 
  let hasArchivedFiles = false;
 
  // List company materials
  const materialsList = reportData.materials;
  materialsList.forEach((m: any) => {
    if (y > 270) {
      doc.addPage();
      drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
      y = 25;
    }
    const nameSplit = doc.splitTextToSize(m.fileName || m.name, 90);
    doc.text(nameSplit, 16, y);
    doc.text(`Empresa [${m.category}]`, 110, y);
    doc.setFont('Courier', 'normal');
    doc.text(m.fileHash || 'N/A', 142, y);
    doc.setFont('Helvetica', 'normal');
    y += (nameSplit.length * 4) + 1;
    hasArchivedFiles = true;
  });
 
  // List client uploads
  reportData.blocks.forEach((block: any) => {
    if (block.type === 'file_upload') {
      const files = block.files || [];
      files.forEach((f: any) => {
        if (y > 270) {
          doc.addPage();
          drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
          y = 25;
        }
        const nameSplit = doc.splitTextToSize(f.name, 90);
        doc.text(nameSplit, 16, y);
        doc.text('Cliente (Upload)', 110, y);
        doc.setFont('Courier', 'normal');
        doc.text(f.fileHash || 'N/A', 142, y);
        doc.setFont('Helvetica', 'normal');
        y += (nameSplit.length * 4) + 1;
        hasArchivedFiles = true;
      });
    }
  });
 
  if (!hasArchivedFiles) {
    doc.text('Nenhum arquivo enviado para análise nesta publicação.', 16, y);
    y += 6;
  }
 
  // Section: ASSINATURA DIGITAL DO RELATÓRIO
  if (y > 240) {
    doc.addPage();
    drawOfficialPDFHeaderCompact(doc, reportData, logoImg);
    y = 25;
  }
 
  y += 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 133, 122);
  doc.text('ASSINATURA DIGITAL DO DOCUMENTO', 14, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(13, 133, 122);
  doc.line(14, y + 2, 196, y + 2);
  y += 8;
 
  const currentPdfHash = pdfHashOverride || resp.pdf_hash;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Hash SHA-256 de Rastreabilidade:', 14, y);
  
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(currentPdfHash || 'PENDENTE DE ASSINATURA', 72, y);
  y += 6;
 
  // Draw Page Number Footers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    
    // Line above footer
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(14, 280, 196, 280);

    const companyText = reportData.companyBranding.tradeName || reportData.companyBranding.companyName;
    const textLeft = `${companyText} • ${reportData.publication.code} • Página ${i} de ${pageCount}`;
    const textRight = 'Validação digital processada pelo PERSPECPACK';
    
    doc.text(textLeft, 14, 285);
    doc.text(textRight, 196 - doc.getTextWidth(textRight), 285);
  }
 
  return doc;
}

// 5. Generate PDF Report (With Answers)
export async function generatePDFReport(pub: any, resp: any): Promise<void> {
  const reportData = buildApprovalReportData(pub, resp);
  const logoUrl = reportData.companyBranding.companyLogoUrl;
  let logoImg: HTMLImageElement | null = null;
  if (logoUrl) {
    try {
      logoImg = await loadImage(logoUrl);
    } catch (e) {
      console.error('Failed to load logo image:', e);
    }
  }

  // First pass: build without final self-referential hash
  const docFirst = buildPDFDoc(pub, resp, undefined, logoImg);
  
  // Calculate SHA-256 hash of this PDF structure
  const arrayBuffer = docFirst.output('arraybuffer');
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const pdfHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Second pass: draw the hash on the final PDF
    const docFinal = buildPDFDoc(pub, resp, pdfHash, logoImg);
    docFinal.save(`Relatorio-${pub.publication_code}.pdf`);
  } catch (err) {
    console.error('Error generating PDF hash, saving unhashed version:', err);
    docFirst.save(`Relatorio-${pub.publication_code}.pdf`);
  }
}

// Generate PDF Report Blob and Hash
export async function generatePDFReportBlobAndHash(pub: any, resp: any): Promise<{ blob: Blob, hash: string }> {
  const reportData = buildApprovalReportData(pub, resp);
  const logoUrl = reportData.companyBranding.companyLogoUrl;
  let logoImg: HTMLImageElement | null = null;
  if (logoUrl) {
    try {
      logoImg = await loadImage(logoUrl);
    } catch (e) {
      console.error('Failed to load logo image:', e);
    }
  }

  // First pass
  const docFirst = buildPDFDoc(pub, resp, undefined, logoImg);
  const arrayBuffer = docFirst.output('arraybuffer');
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const pdfHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Second pass
  const docFinal = buildPDFDoc(pub, resp, pdfHash, logoImg);
  const finalBlob = docFinal.output('blob');
  return { blob: finalBlob, hash: pdfHash };
}
