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
  signature?: string; // Add signature field
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
      options?: string[];
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
    console.log('[PDF-EXPORT] Dados recebidos:', {
      templateName: data.templateName,
      sectionsCount: data.sections?.length || 0,
      hasSignature: !!data.signature,
      responsesKeys: Object.keys(data.responses || {})
    });

    // Header matching template design
    this.addTemplateHeader(data);
    
    // Template-based sections rendering with exact layout
    if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
      await this.renderTemplateSections(data.sections, data.responses);
    } else {
      // Fallback to original method if sections are not available
      await this.renderLegacySections(data);
    }

    // Add signature section if present anywhere in the data
    const signatureFound = data.signature || 
      Object.keys(data.responses).find(key => key.includes('signature') || key.includes('Signature'));
    
    if (signatureFound) {
      this.currentY += 15;
      this.addTitle('ASSINATURA DO TÉCNICO', 12);
      this.currentY += 5;
      
      const signatureData = data.signature || data.responses[signatureFound] || signatureFound;
      await this.renderSignatureFieldValue(signatureData);
    }

    // Footer with approval info
    this.addTemplateFooter(data);
  }

  // Template-style header matching the original form
  private addTemplateHeader(data: ChecklistData): void {
    // Main title with Claro branding style
    this.pdf.setFillColor(220, 220, 220); // Light gray background
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 25, 'F');
    
    this.currentY += 8;
    this.pdf.setTextColor(0, 0, 0); // Ensure black text
    this.addTitle(`CHECKLIST - ${data.templateName.toUpperCase()}`, 16);
    this.pdf.setTextColor(60, 60, 60); // Dark gray for subtitle
    this.addText(`Checklist Virtual - Claro Empresas`, 10);
    this.pdf.setTextColor(0, 0, 0); // Reset to black
    this.currentY += 5;
    
    // Helper function to translate status to Portuguese
    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'aprovado': return 'APROVADO';
        case 'rejeitado': return 'REJEITADO';
        case 'pendente': return 'PENDENTE';
        case 'em_analise': return 'EM ANÁLISE';
        default: return status.toUpperCase();
      }
    };

    // Info box similar to template header
    const infoItems: string[] = [
      `Técnico: ${data.technicianName}`,
      `Criado em: ${new Date(data.createdAt).toLocaleString('pt-BR')}`,
      `Status: ${getStatusLabel(data.status)}`
    ];
    
    if (data.completedAt) {
      infoItems.splice(2, 0, `Concluído em: ${new Date(data.completedAt).toLocaleString('pt-BR')}`);
    }
    
    this.addSectionBox('INFORMAÇÕES DO CHECKLIST', infoItems);
  }

  // Template footer with approval information  
  private addTemplateFooter(data: ChecklistData): void {
    this.currentY += 15;
    
    if (data.approvedAt && data.approvedBy) {
      this.addSectionBox('INFORMAÇÕES DE APROVAÇÃO', [
        `Aprovado em: ${new Date(data.approvedAt).toLocaleString('pt-BR')}`,
        `Aprovado por: ${data.approvedBy}`
      ]);
    }

    this.currentY += 10;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    this.addText(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 8);
    this.addText('Checklist Virtual - Claro Empresas', 8);
  }

  // Helper method to create boxed sections like in the template
  private addSectionBox(title: string, items: string[]): void {
    this.checkPageBreak(30 + (items.length * 7));
    
    // Box background
    this.pdf.setFillColor(248, 249, 250); // Very light gray
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 8 + (items.length * 7), 'F');
    
    // Box border
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 8 + (items.length * 7));
    
    this.currentY += 5;
    this.addText(title, 10, true);
    
    items.forEach(item => {
      this.addText(`  ${item}`, 9);
    });
    
    this.currentY += 5;
  }

  // Enhanced method to render sections matching template layout
  private async renderTemplateSections(sections: any[], responses: Record<string, any>): Promise<void> {
    for (const section of sections) {
      this.currentY += 8; // Extra space between sections
      
      // Section header with background (like in template)
      this.checkPageBreak(25);
      this.pdf.setFillColor(240, 244, 248); // Light blue background
      this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 18, 'F');
      
      this.currentY += 6;
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`📋 ${section.title.toUpperCase()}`, this.margin + 5, this.currentY);
      this.currentY += 12;
      
      if (section.fields && Array.isArray(section.fields)) {
        // Render fields maintaining template order and structure
        for (const field of section.fields) {
          await this.renderTemplateField(field, responses);
        }
      } else {
        this.addText('Seção sem campos configurados', 10);
      }
      
      this.currentY += 5; // Space after section
    }
  }

  // Enhanced field rendering with template-like styling
  private async renderTemplateField(field: any, responses: Record<string, any>): Promise<void> {
    const fieldId = field.id;
    const response = responses[fieldId];
    const photoResponse = responses[`${fieldId}_photo`] || responses[`${fieldId}Photo`];
    
    // Field container with subtle border (like form fields)
    this.checkPageBreak(20);
    
    // Field background for better readability
    this.pdf.setFillColor(252, 252, 252);
    const fieldHeight = this.calculateFieldHeight(field, response, photoResponse, responses);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), fieldHeight, 'F');
    
    this.currentY += 3;
    
    // Field label with required indicator
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    const labelText = `${field.label}${field.required ? ' *' : ''}`;
    this.pdf.text(labelText, this.margin + 5, this.currentY);
    this.currentY += 8;
    
    // Handle different field types with template styling
    switch (field.type) {
      case 'text':
      case 'textarea':
        this.renderTextFieldValue(response);
        break;
        
      case 'radio':
        this.renderRadioFieldValue(field, response);
        break;
        
      case 'evidence':
      case 'photo':
        await this.renderEvidenceFieldValue(photoResponse || response);
        break;
        
      case 'signature':
        // Check multiple possible signature data sources
        const signatureData = photoResponse || response || responses[`${field.id}_signature`] || responses[field.id + 'Signature'];
        await this.renderSignatureFieldValue(signatureData);
        break;
        
      default:
        this.renderTextFieldValue(response);
        break;
    }
    
    this.currentY += 5; // Space after field
  }

  // Helper methods for field rendering
  private calculateFieldHeight(field: any, response: any, photoResponse: any, responses?: Record<string, any>): number {
    let height = 15; // Base height for label and padding
    
    if (field.type === 'radio' && field.options) {
      height += field.options.length * 6; // Space for radio options
    }
    
    if (field.type === 'evidence' || field.type === 'photo') {
      if (photoResponse || response) {
        height += 80; // Space for image
      }
    }
    
    if (field.type === 'signature') {
      const signatureData = photoResponse || response || 
        (responses && (responses[`${field.id}_signature`] || responses[field.id + 'Signature']));
      if (signatureData) {
        height += 85; // More space for signature with label
      }
    }
    
    return height;
  }

  private renderTextFieldValue(response: any): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    if (response) {
      // Text field with border (like input field)
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(this.margin + 5, this.currentY - 3, this.pdf.internal.pageSize.width - (2 * this.margin) - 10, 8);
      this.pdf.text(String(response), this.margin + 8, this.currentY + 2);
    } else {
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('Não preenchido', this.margin + 8, this.currentY + 2);
      this.pdf.setTextColor(0, 0, 0);
    }
    
    this.currentY += 10;
  }

  private renderRadioFieldValue(field: any, response: any): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    if (field.options && Array.isArray(field.options)) {
      field.options.forEach((option: string) => {
        const isSelected = option === response;
        const radioSymbol = isSelected ? '●' : '○';
        
        // Radio button styling
        this.pdf.setFont('helvetica', isSelected ? 'bold' : 'normal');
        this.pdf.text(`${radioSymbol} ${option}`, this.margin + 8, this.currentY);
        this.currentY += 6;
      });
    } else if (response) {
      this.pdf.text(`● ${response}`, this.margin + 8, this.currentY);
      this.currentY += 6;
    }
    
    if (!response && (!field.options || field.options.length === 0)) {
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('Nenhuma opção selecionada', this.margin + 8, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += 6;
    }
  }

  private async renderEvidenceFieldValue(photoData: any): Promise<void> {
    if (photoData) {
      let photoFilename = null;
      
      if (typeof photoData === 'string') {
        photoFilename = photoData;
      } else if (photoData && photoData.filename) {
        photoFilename = photoData.filename;
      } else if (photoData && photoData.path) {
        photoFilename = photoData.path.replace('uploads/', '');
      }
      
      if (photoFilename) {
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setFontSize(9);
        this.pdf.text('📷 Evidência fotográfica:', this.margin + 8, this.currentY);
        this.currentY += 8;
        
        const cleanFilename = photoFilename.replace(/^uploads\//, '');
        await this.addImage(`/uploads/${cleanFilename}`, 120, 90);
      } else {
        this.renderNoEvidenceMessage();
      }
    } else {
      this.renderNoEvidenceMessage();
    }
  }

  private async renderSignatureFieldValue(signatureData: any): Promise<void> {
    // Try different ways to get signature data
    let signatureToRender = null;
    
    if (signatureData) {
      if (typeof signatureData === 'string') {
        if (signatureData.startsWith('data:image/')) {
          // Base64 image data
          signatureToRender = signatureData;
        } else if (signatureData.includes('/uploads/')) {
          // File path
          signatureToRender = signatureData;
        } else {
          // Filename only
          signatureToRender = `/uploads/${signatureData}`;
        }
      } else if (signatureData && signatureData.filename) {
        signatureToRender = `/uploads/${signatureData.filename.replace(/^uploads\//, '')}`;
      } else if (signatureData && signatureData.path) {
        signatureToRender = signatureData.path;
      }
    }
    
    if (signatureToRender) {
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setFontSize(9);
      this.pdf.text('✍️ Assinatura digital:', this.margin + 8, this.currentY);
      this.currentY += 8;
      
      if (signatureToRender.startsWith('data:image/')) {
        // Handle base64 signature
        await this.addBase64Image(signatureToRender, 140, 70);
      } else {
        // Handle file path signature
        const cleanPath = signatureToRender.replace(/^uploads\//, '');
        await this.addImage(`/uploads/${cleanPath}`, 140, 70);
      }
    } else {
      this.renderNoSignatureMessage();
    }
  }

  private async addBase64Image(base64Data: string, width: number, height: number): Promise<void> {
    try {
      this.checkPageBreak(height + 10);
      
      // Extract the image type and data
      const imageType = base64Data.match(/data:image\/([^;]+)/)?.[1] || 'png';
      
      this.pdf.addImage(
        base64Data,
        imageType.toUpperCase(),
        this.margin + 8,
        this.currentY,
        width,
        height
      );
      
      this.currentY += height + 5;
    } catch (error) {
      console.log('[PDF-DEBUG] Erro ao processar assinatura base64:', error);
      this.addText('Erro ao processar assinatura', 8);
      this.currentY += 10;
    }
  }

  private renderNoEvidenceMessage(): void {
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text('📷 Nenhuma evidência anexada', this.margin + 8, this.currentY);
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += 8;
  }

  private renderNoSignatureMessage(): void {
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text('✍️ Não assinado', this.margin + 8, this.currentY);
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += 8;
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