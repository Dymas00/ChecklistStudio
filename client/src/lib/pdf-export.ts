import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ChecklistData {
  id: string;
  templateName: string;
  technicianName: string;
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  status: string;
  responses: Record<string, any>;
  sections: Array<{
    id: string;
    title: string;
    icon: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      value?: any;
    }>;
  }>;
}

export class PDFExporter {
  private pdf: jsPDF;
  private pageHeight: number;
  private currentY: number;
  private margin: number = 20;
  private lineHeight: number = 7;

  constructor() {
    this.pdf = new jsPDF();
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.currentY = this.margin;
  }

  private checkPageBreak(neededHeight: number = 15) {
    if (this.currentY + neededHeight > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  private addTitle(text: string, size: number = 16) {
    this.checkPageBreak(size + 5);
    this.pdf.setFontSize(size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(text, this.margin, this.currentY);
    this.currentY += size + 5;
  }

  private addText(text: string, size: number = 10, isBold: boolean = false) {
    this.checkPageBreak(this.lineHeight);
    this.pdf.setFontSize(size);
    this.pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    // Handle long text by splitting into lines
    const splitText = this.pdf.splitTextToSize(text, this.pdf.internal.pageSize.width - (this.margin * 2));
    
    for (let i = 0; i < splitText.length; i++) {
      if (i > 0) this.checkPageBreak(this.lineHeight);
      this.pdf.text(splitText[i], this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private addLine() {
    this.checkPageBreak(5);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 10;
  }

  private async addImage(imageUrl: string, maxWidth: number = 80, maxHeight: number = 60) {
    try {
      this.checkPageBreak(maxHeight + 10);
      
      console.log(`[PDF-DEBUG] Tentando carregar imagem: ${imageUrl}`);
      
      // Fetch image and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.log(`[PDF-DEBUG] Imagem não encontrada (${response.status}): ${imageUrl}`);
        this.addText(`Imagem não encontrada: ${imageUrl}`, 8);
        return false;
      }
      
      const blob = await response.blob();
      console.log(`[PDF-DEBUG] Imagem carregada com sucesso, tamanho: ${blob.size} bytes`);
      
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      try {
        // Detect image format from blob type
        const format = blob.type.includes('png') ? 'PNG' : 'JPEG';
        this.pdf.addImage(base64, format, this.margin, this.currentY, maxWidth, maxHeight);
        this.currentY += maxHeight + 10;
        console.log(`[PDF-DEBUG] Imagem adicionada ao PDF com sucesso: ${imageUrl}`);
        return true;
      } catch (imgError) {
        console.log(`[PDF-DEBUG] Erro ao adicionar imagem ao PDF:`, imgError);
        this.addText('Imagem anexada (não pôde ser exibida)', 8);
        return false;
      }
    } catch (error) {
      console.log(`[PDF-DEBUG] Erro geral ao processar imagem:`, error);
      this.addText(`Erro ao processar imagem: ${imageUrl}`, 8);
      return false;
    }
  }

  private formatValue(field: any, value: any): string {
    if (!value && value !== 0) return 'Não preenchido';
    
    switch (field.type) {
      case 'radio':
        return value;
      case 'textarea':
        return value;
      case 'text':
        return value;
      case 'evidence':
        return value.length > 0 ? `${value.length} arquivo(s) anexado(s)` : 'Nenhuma evidência';
      case 'signature':
        return value ? 'Assinatura capturada' : 'Não assinado';
      default:
        return String(value);
    }
  }

  async exportChecklist(data: ChecklistData): Promise<void> {
    // Header with template layout styling
    this.addTitle(`CHECKLIST - ${data.templateName.toUpperCase()}`, 18);
    this.addLine();
    
    // Basic Info in template style
    this.addText(`Técnico: ${data.technicianName}`, 12, true);
    this.addText(`Template: ${data.templateName}`, 10);
    this.addText(`Criado em: ${new Date(data.createdAt).toLocaleString('pt-BR')}`, 10);
    
    if (data.completedAt) {
      this.addText(`Concluído em: ${new Date(data.completedAt).toLocaleString('pt-BR')}`, 10);
    }
    
    if (data.approvedAt && data.approvedBy) {
      this.addText(`Aprovado em: ${new Date(data.approvedAt).toLocaleString('pt-BR')}`, 10);
      this.addText(`Aprovado por: ${data.approvedBy}`, 10);
    }
    
    this.addText(`Status: ${data.status.toUpperCase()}`, 10, true);
    this.currentY += 10;
    this.addLine();

    // Template-based sections rendering
    if (data.sections && Array.isArray(data.sections)) {
      await this.renderTemplateSections(data.sections, data.responses);
    } else {
      // Fallback to original method if sections are not available
      await this.renderLegacySections(data);
    }

    // Footer
    this.currentY += 10;
    this.addText(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 8);
    this.addText('Checklist Virtual - Claro Empresas', 8);
  }

  // New method to render sections following template structure
  private async renderTemplateSections(sections: any[], responses: Record<string, any>): Promise<void> {
    for (const section of sections) {
      // Add section title with icon styling similar to the template
      this.addTitle(`${section.title.toUpperCase()}`, 14);
      
      if (section.fields && Array.isArray(section.fields)) {
        // Render each field in the section
        for (const field of section.fields) {
          await this.renderTemplateField(field, responses);
        }
      }
      
      this.addLine();
    }
  }

  // New method to render individual fields maintaining template layout
  private async renderTemplateField(field: any, responses: Record<string, any>): Promise<void> {
    const fieldId = field.id;
    const response = responses[fieldId];
    const photoResponse = responses[`${fieldId}_photo`] || responses[`${fieldId}Photo`];
    
    // Field label in bold (similar to template)
    this.addText(`${field.label}${field.required ? ' *' : ''}:`, 11, true);
    
    // Handle different field types
    switch (field.type) {
      case 'text':
      case 'textarea':
        if (response) {
          this.addText(response, 10);
        } else {
          this.addText('Não preenchido', 10);
        }
        break;
        
      case 'radio':
        if (response) {
          this.addText(`☑ ${response}`, 10);
        } else {
          this.addText('Nenhuma opção selecionada', 10);
        }
        
        // Show options for context (similar to template)
        if (field.options && Array.isArray(field.options)) {
          field.options.forEach((option: string) => {
            if (option !== response) {
              this.addText(`☐ ${option}`, 9);
            }
          });
        }
        break;
        
      case 'evidence':
      case 'photo':
        if (photoResponse || response) {
          let photoFilename = null;
          const photoData = photoResponse || response;
          
          if (typeof photoData === 'string') {
            photoFilename = photoData;
          } else if (photoData && photoData.filename) {
            photoFilename = photoData.filename;
          } else if (photoData && photoData.path) {
            photoFilename = photoData.path.replace('uploads/', '');
          }
          
          if (photoFilename) {
            this.addText('Evidência anexada:', 9, true);
            const cleanFilename = photoFilename.replace(/^uploads\//, '');
            await this.addImage(`/uploads/${cleanFilename}`, 100, 75);
          } else {
            this.addText('Nenhuma evidência anexada', 10);
          }
        } else {
          this.addText('Nenhuma evidência anexada', 10);
        }
        break;
        
      case 'signature':
        if (response || photoResponse) {
          this.addText('Assinatura capturada:', 9, true);
          let signatureFilename = null;
          const signatureData = photoResponse || response;
          
          if (typeof signatureData === 'string') {
            signatureFilename = signatureData;
          } else if (signatureData && signatureData.filename) {
            signatureFilename = signatureData.filename;
          }
          
          if (signatureFilename) {
            const cleanFilename = signatureFilename.replace(/^uploads\//, '');
            await this.addImage(`/uploads/${cleanFilename}`, 120, 60);
          }
        } else {
          this.addText('Não assinado', 10);
        }
        break;
        
      default:
        if (response) {
          this.addText(String(response), 10);
        } else {
          this.addText('Não preenchido', 10);
        }
        break;
    }
    
    // Add some spacing between fields
    this.currentY += 3;
  }

  // Legacy method for backward compatibility
  private async renderLegacySections(data: ChecklistData): Promise<void> {

    // Technical Information Section  
    this.addTitle('INFORMAÇÕES TÉCNICAS', 14);
    const techFields = ['techName', 'techPhone', 'techCPF', 'connectivityType', 'designation'];
    techFields.forEach(fieldId => {
      const value = data.responses[fieldId];
      if (value) {
        const label = this.getFieldLabel(fieldId);
        this.addText(`${label}: ${value}`, 10);
      }
    });
    
    // Add technical data photos if available - Enhanced search
    const techPhotoFields = [
      'techName_photo', 'techNamePhoto', 'tech-name-photo',
      'techPhone_photo', 'techPhonePhoto', 'tech-phone-photo', 
      'techCPF_photo', 'techCPFPhoto', 'tech-cpf-photo',
      'connectivityType_photo', 'connectivityTypePhoto', 'connectivity-type-photo',
      'designation_photo', 'designationPhoto', 'designation-photo'
    ];
    
    const processedPhotos = new Set();
    
    for (const photoFieldId of techPhotoFields) {
      const photoResponse = data.responses[photoFieldId];
      if (photoResponse && !processedPhotos.has(photoFieldId.toLowerCase().replace(/[-_]/g, ''))) {
        const baseFieldId = photoFieldId.replace(/_photo$|Photo$|-photo$/i, '');
        const label = this.getFieldLabel(baseFieldId);
        this.addText(`Evidência - ${label}:`, 10, true);
        
        let photoFilename = null;
        if (typeof photoResponse === 'string') {
          photoFilename = photoResponse;
        } else if (photoResponse.filename) {
          photoFilename = photoResponse.filename;
        } else if (photoResponse.path) {
          photoFilename = photoResponse.path.replace('uploads/', '');
        }
        
        if (photoFilename) {
          const cleanFilename = photoFilename.replace(/^uploads\//, '');
          console.log(`[PDF-DEBUG] Tech photo (${baseFieldId}): ${cleanFilename}`);
          await this.addImage(`/uploads/${cleanFilename}`, 80, 60);
          processedPhotos.add(photoFieldId.toLowerCase().replace(/[-_]/g, ''));
        }
      }
    }
    
    // Also check for any other technical photos that might be stored differently
    Object.keys(data.responses).forEach(key => {
      if (key.toLowerCase().includes('photo') && key.toLowerCase().includes('tech') && !processedPhotos.has(key.toLowerCase())) {
        const photoData = data.responses[key];
        if (photoData) {
          this.addText(`Evidência Técnica - ${key}:`, 10, true);
          let photoFilename = null;
          
          if (typeof photoData === 'string') {
            photoFilename = photoData;
          } else if (photoData.filename) {
            photoFilename = photoData.filename;
          } else if (photoData.path) {
            photoFilename = photoData.path.replace('uploads/', '');
          }
          
          if (photoFilename) {
            const cleanFilename = photoFilename.replace(/^uploads\//, '');
            console.log(`[PDF-DEBUG] Additional tech photo (${key}): ${cleanFilename}`);
            this.addImage(`/uploads/${cleanFilename}`, 80, 60);
          }
        }
      }
    });
    this.addLine();

    // Speed Test Section
    if (data.responses.speedTest) {
      this.addTitle('TESTE DE VELOCIDADE', 14);
      this.addText(`Velocidade medida: ${data.responses.speedTest} Mbps`, 10);
      
      // Speed test photo - check multiple possible locations
      const speedTestPhotoSources = [
        data.responses.speedTest_photo,
        data.responses.speedTestPhoto,
        data.responses['speed-test-photo']
      ];
      
      let speedTestPhoto = null;
      for (const source of speedTestPhotoSources) {
        if (source) {
          speedTestPhoto = source;
          break;
        }
      }
      
      if (speedTestPhoto) {
        this.addText('Evidência do teste de velocidade:', 10, true);
        let photoFilename = null;
        
        if (typeof speedTestPhoto === 'string') {
          photoFilename = speedTestPhoto;
        } else if (speedTestPhoto.filename) {
          photoFilename = speedTestPhoto.filename;
        } else if (speedTestPhoto.path) {
          photoFilename = speedTestPhoto.path.replace('uploads/', '');
        }
        
        if (photoFilename) {
          const cleanFilename = photoFilename.replace(/^uploads\//, '');
          console.log(`[PDF-DEBUG] Speed test photo: ${cleanFilename}`);
          await this.addImage(`/uploads/${cleanFilename}`, 80, 60);
        }
      } else {
        console.log(`[PDF-DEBUG] Nenhuma foto de speed test encontrada nos responses:`, Object.keys(data.responses));
      }
      this.addLine();
    }

    // Evidence Sections
    this.addTitle('EVIDÊNCIAS DE CONFIGURAÇÃO', 14);
    const evidenceFields = ['ipWan', 'vpn', 'aps', 'naming', 'notes'];
    
    for (const fieldId of evidenceFields) {
      const response = data.responses[fieldId];
      const photoResponse = data.responses[`${fieldId}_photo`];
      
      if (response || photoResponse) {
        const label = this.getFieldLabel(fieldId);
        this.addText(`${label}:`, 11, true);
        
        // Show answer
        if (typeof response === 'object' && response.answer) {
          this.addText(`Resposta: ${response.answer}`, 10);
        } else if (typeof response === 'string') {
          this.addText(`Resposta: ${response}`, 10);
        }
        
        // Show evidence photo - Enhanced logic to handle multiple photo formats
        let photoFilename = null;
        
        console.log(`[PDF-DEBUG] Processando evidência ${fieldId}: response=`, typeof response, response);
        console.log(`[PDF-DEBUG] PhotoResponse ${fieldId}_photo:`, typeof photoResponse, photoResponse);
        
        // Check if response is an object with photo property
        if (typeof response === 'object' && response && response.photo) {
          photoFilename = typeof response.photo === 'string' ? response.photo : response.photo.filename;
        }
        // Check separate photo response field
        else if (photoResponse) {
          if (typeof photoResponse === 'string') {
            photoFilename = photoResponse;
          } else if (photoResponse.filename) {
            photoFilename = photoResponse.filename;
          } else if (photoResponse.path) {
            // Extract filename from path if needed
            photoFilename = photoResponse.path.replace('uploads/', '');
          }
        }
        
        if (photoFilename) {
          this.addText('Evidência fotográfica:', 9, true);
          // Ensure clean filename without path prefixes
          const cleanFilename = photoFilename.replace(/^uploads\//, '');
          console.log(`[PDF-DEBUG] Evidence photo (${fieldId}): ${cleanFilename}`);
          await this.addImage(`/uploads/${cleanFilename}`, 80, 60);
        } else {
          console.log(`[PDF-DEBUG] Nenhuma foto encontrada para ${fieldId}`);
          this.addText('Nenhuma evidência fotográfica anexada', 9);
        }
        
        this.currentY += 5;
      }
    }
    
    this.addLine();

    // Validation and Signatures
    this.addTitle('VALIDAÇÃO E ASSINATURAS', 14);
    
    if (data.responses.validationCode) {
      this.addText(`Código de validação: ${data.responses.validationCode}`, 10);
    }
    
    // Add technician selfie - Enhanced search
    const selfieSources = [
      data.responses.techSelfie,
      data.responses.technician_selfie,
      data.responses.selfie,
      data.responses.technicianSelfie,
      data.responses.tech_selfie,
      data.responses['tech-selfie']
    ];
    
    let selfiePhoto = null;
    for (const source of selfieSources) {
      if (source) {
        selfiePhoto = source;
        break;
      }
    }
    
    if (selfiePhoto) {
      this.addText('Selfie do Técnico:', 10, true);
      let photoFilename = null;
      
      if (typeof selfiePhoto === 'string') {
        photoFilename = selfiePhoto;
      } else if (selfiePhoto.filename) {
        photoFilename = selfiePhoto.filename;
      } else if (selfiePhoto.path) {
        photoFilename = selfiePhoto.path.replace('uploads/', '');
      }
      
      if (photoFilename) {
        const cleanFilename = photoFilename.replace(/^uploads\//, '');
        console.log(`[PDF-DEBUG] Technician selfie: ${cleanFilename}`);
        await this.addImage(`/uploads/${cleanFilename}`, 80, 60);
      }
    } else {
      console.log(`[PDF-DEBUG] Nenhuma selfie encontrada nos responses:`, Object.keys(data.responses).filter(key => key.toLowerCase().includes('selfie')));
    }
    
    // Add signature - Enhanced search
    const signatureSources = [
      data.responses.signature,
      data.responses.techSignature,
      data.responses.signaturePhoto,
      data.responses.signature_photo,
      data.responses['signature-photo'],
      data.responses.tech_signature
    ];
    
    let signaturePhoto = null;
    for (const source of signatureSources) {
      if (source) {
        signaturePhoto = source;
        break;
      }
    }
    
    if (signaturePhoto) {
      this.addText('Assinatura do Técnico:', 10, true);
      let photoFilename = null;
      
      if (typeof signaturePhoto === 'string') {
        photoFilename = signaturePhoto;
      } else if (signaturePhoto.filename) {
        photoFilename = signaturePhoto.filename;
      } else if (signaturePhoto.path) {
        photoFilename = signaturePhoto.path.replace('uploads/', '');
      }
      
      if (photoFilename) {
        const cleanFilename = photoFilename.replace(/^uploads\//, '');
        console.log(`[PDF-DEBUG] Technician signature: ${cleanFilename}`);
        await this.addImage(`/uploads/${cleanFilename}`, 120, 60);
      }
    } else {
      console.log(`[PDF-DEBUG] Nenhuma assinatura encontrada nos responses:`, Object.keys(data.responses).filter(key => key.toLowerCase().includes('signature')));
    }
    
    if (data.responses.analystName) {
      this.addText(`Analista responsável: ${data.responses.analystName}`, 10);
    }
    
    this.addLine();
  }

  private getFieldLabel(fieldId: string): string {
    const labels: Record<string, string> = {
      storeCode: 'Código da Loja',
      storeManager: 'Gerente da Loja', 
      storePhone: 'Telefone da Loja',
      contractor: 'Contratada',
      techName: 'Nome do Técnico',
      techPhone: 'Telefone do Técnico',
      techCPF: 'CPF do Técnico',
      connectivityType: 'Tipo de Conectividade',
      designation: 'Designação',
      speedTest: 'Teste de Velocidade',
      ipWan: 'Configuração IP WAN',
      vpn: 'Configuração VPN',
      aps: 'Configuração APs',
      naming: 'Nomenclatura de Equipamentos',
      notes: 'Anotações e Observações',
      validationCode: 'Código de Validação'
    };
    
    return labels[fieldId] || fieldId;
  }

  download(filename: string) {
    this.pdf.save(filename);
  }

  getBlob(): Blob {
    return this.pdf.output('blob');
  }
}

export async function exportChecklistToPDF(checklist: ChecklistData): Promise<void> {
  const exporter = new PDFExporter();
  await exporter.exportChecklist(checklist);
  
  const filename = `checklist_${checklist.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  exporter.download(filename);
}