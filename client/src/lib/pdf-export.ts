import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import claroLogo from '@/assets/claro-empresas-logo-final.png';

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

  // Centralized method to clean text for PDF generation
  private cleanTextForPDF(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      // Step 1: Remove non-printable ASCII and problematic chars
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, '')
      .replace(/[^\x20-\x7E]/g, '') // Keep only standard printable ASCII
      
      // Step 2: Remove specific problematic sequences
      .replace(/%Ï/g, '') // Remove %Ï completely
      .replace(/%Ë/g, '') // Remove %Ë completely  
      .replace(/Ï/g, '')  // Remove lone Ï
      .replace(/Ë/g, '')  // Remove lone Ë
      .replace(/%/g, '')  // Remove % symbols
      .replace(/Ã/g, 'A') // Replace Ã with A
      
      // Step 3: Replace accented characters with base letters
      .replace(/[àáâãäåæ]/gi, 'A')
      .replace(/[èéêë]/gi, 'E')
      .replace(/[ìíîï]/gi, 'I')
      .replace(/[òóôõöø]/gi, 'O')
      .replace(/[ùúûü]/gi, 'U')
      .replace(/[ñ]/gi, 'N')
      .replace(/[ç]/gi, 'C')
      .replace(/[ý]/gi, 'Y')
      
      // Step 4: Specific Portuguese replacements
      .replace(/NÃO/gi, 'NAO')
      .replace(/São/gi, 'SAO')
      .replace(/não/gi, 'nao')
      
      // Step 5: Clean up and normalize
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .trim();
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
    
    // Clean title from encoding issues
    const cleanTitle = this.cleanTextForPDF(text);
      
    this.pdf.text(cleanTitle, this.margin, this.currentY);
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

  private translateSectionName(sectionName: string): string {
    const translations: Record<string, string> = {
      'equipment_info': 'INFORMACOES DO EQUIPAMENTO',
      'site_info': 'INFORMACOES DO SITE',
      'installation': 'INSTALACAO',
      'configuration': 'CONFIGURACAO',
      'testing': 'TESTES',
      'documentation': 'DOCUMENTACAO',
      'completion': 'FINALIZACAO',
      'verification': 'VERIFICACAO',
      'maintenance': 'MANUTENCAO',
      'upgrade': 'UPGRADE',
      'migration': 'MIGRACAO',
      'activation': 'ATIVACAO',
      'quality_check': 'VERIFICACAO DE QUALIDADE',
      'safety_check': 'VERIFICACAO DE SEGURANCA',
      'network_config': 'CONFIGURACAO DE REDE',
      'power_check': 'VERIFICACAO DE ENERGIA',
      'signal_test': 'TESTE DE SINAL',
      'performance_test': 'TESTE DE PERFORMANCE',
      'final_check': 'VERIFICACAO FINAL',
      'Dados do Analista': 'DADOS DO ANALISTA',
      'Dados do Técnico': 'DADOS DO TECNICO',
      'Dados da Loja': 'DADOS DA LOJA',
      'Testes e Evidências de Entrega': 'TESTES E EVIDENCIAS DE ENTREGA',
      'Produto a ser instalado': 'PRODUTO A SER INSTALADO',
      'Evidências': 'EVIDENCIAS',
      'Código de Validação': 'CODIGO DE VALIDACAO'
    };

    // Se encontrar tradução exata, use ela
    if (translations[sectionName]) {
      return translations[sectionName];
    }

    // Remover caracteres especiais e formatar - mais agressivo
    return sectionName
      .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII first
      .replace(/[àáâãäåæ]/gi, 'A')
      .replace(/[èéêë]/gi, 'E')
      .replace(/[ìíîï]/gi, 'I')
      .replace(/[òóôõö]/gi, 'O')
      .replace(/[ùúûü]/gi, 'U')
      .replace(/[ñ]/gi, 'N')
      .replace(/[ç]/gi, 'C')
      .replace(/[ý]/gi, 'Y')
      .replace(/Ã/g, 'A')   // Common encoding issues
      .replace(/Ï/g, '')    // Remove problematic Ï
      .replace(/%/g, '')    // Remove % symbols  
      .replace(/_/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove remaining special chars
      .toUpperCase()
      .trim();
  }

  async exportChecklist(data: ChecklistData): Promise<void> {
    console.log('[PDF-EXPORT] Dados recebidos:', {
      templateName: data.templateName,
      sectionsCount: data.sections?.length || 0,
      hasSignature: !!data.signature,
      responsesKeys: Object.keys(data.responses || {})
    });

    // Enhanced header with Claro branding
    await this.addTemplateHeader(data);
    
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

  // Enhanced header with Claro branding - white header with red text
  private async addTemplateHeader(data: ChecklistData): Promise<void> {
    try {
      // White header bar
      this.pdf.setFillColor(255, 255, 255); // White background
      this.pdf.rect(0, 0, this.pdf.internal.pageSize.width, 30, 'F');
      
      // Add subtle border at bottom of white header
      this.pdf.setDrawColor(232, 17, 35); // Red border
      this.pdf.setLineWidth(2);
      this.pdf.line(0, 30, this.pdf.internal.pageSize.width, 30);
      
      // Add Claro logo
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = claroLogo;
        });
        
        // Add logo on white background
        this.pdf.addImage(img, 'PNG', this.margin, 8, 60, 14);
        
        // Subtitle in red text on white background, positioned after logo
        this.pdf.setTextColor(232, 17, 35);
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text('Checklist Virtual - Sistema de Gestao Operacional', this.margin + 70, 18);
        
      } catch (error) {
        console.warn('Could not load Claro logo, using text fallback:', error);
        // Fallback to text-only header
        this.pdf.setTextColor(232, 17, 35); // Red text
        this.pdf.setFontSize(18);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('CLARO EMPRESAS', this.margin, 18);
        
        // Subtitle in red on white background
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text('Checklist Virtual - Sistema de Gestao Operacional', this.margin, 25);
      }
      
      // Reset position after header
      this.currentY = 40;
    } catch (headerError) {
      console.error('Error in header creation:', headerError);
      this.currentY = 50;
    }
    
    // Document title box
    this.pdf.setFillColor(248, 249, 250); // Very light gray background
    this.pdf.setDrawColor(232, 17, 35); // Red border
    this.pdf.setLineWidth(2);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 25, 'FD');
    
    this.currentY += 8;
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`CHECKLIST - ${data.templateName.toUpperCase()}`, this.margin + 10, this.currentY);
    
    this.currentY += 8;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Documento ID: ${data.id}`, this.margin + 10, this.currentY);
    
    this.currentY += 15;
    
    // Status badge with colors
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'aprovado': return { label: 'APROVADO', color: [34, 197, 94] }; // Green
        case 'rejeitado': return { label: 'REJEITADO', color: [239, 68, 68] }; // Red
        case 'pendente': return { label: 'PENDENTE', color: [251, 191, 36] }; // Yellow
        case 'em_analise': return { label: 'EM ANÁLISE', color: [59, 130, 246] }; // Blue
        default: return { label: status.toUpperCase(), color: [107, 114, 128] }; // Gray
      }
    };

    const statusInfo = getStatusInfo(data.status);
    
    // Professional information cards layout
    this.currentY += 10;
    
    // First row - Basic info
    this.addInfoCard('INFORMACOES BASICAS', [
      { label: 'Tecnico Responsavel', value: data.technicianName },
      { label: 'Data de Criacao', value: new Date(data.createdAt).toLocaleString('pt-BR') },
      { label: 'Ultima Modificacao', value: data.completedAt ? new Date(data.completedAt).toLocaleString('pt-BR') : 'Em andamento' }
    ]);
    
    // Status badge
    this.currentY += 5;
    this.pdf.setFillColor(statusInfo.color[0], statusInfo.color[1], statusInfo.color[2]);
    this.pdf.roundedRect(this.margin, this.currentY, 60, 12, 3, 3, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(statusInfo.label, this.margin + 8, this.currentY + 8);
    this.pdf.setTextColor(0, 0, 0);
    
    this.currentY += 20;
  }

  // Professional footer with approval information
  private addTemplateFooter(data: ChecklistData): void {
    this.currentY += 15;
    
    if (data.approvedAt && data.approvedBy) {
      this.addInfoCard('INFORMACOES DE APROVACAO', [
        { label: 'Aprovado em', value: new Date(data.approvedAt).toLocaleString('pt-BR') },
        { label: 'Aprovado por', value: data.approvedBy }
      ]);
    }

    // Professional footer
    this.currentY = this.pageHeight - 30;
    this.pdf.setDrawColor(232, 17, 35);
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    
    this.currentY += 8;
    this.pdf.setFillColor(248, 249, 250);
    this.pdf.rect(0, this.currentY, this.pdf.internal.pageSize.width, 20, 'F');
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, this.margin, this.currentY + 8);
    this.pdf.text('Checklist Virtual - Claro Empresas © 2025', this.pdf.internal.pageSize.width - this.margin - 80, this.currentY + 8);
    
    // Page number
    this.pdf.text(`Página ${this.pdf.getCurrentPageInfo().pageNumber}`, this.pdf.internal.pageSize.width - this.margin - 20, this.currentY + 15);
  }

  // Professional info card design
  private addInfoCard(title: string, items: Array<{label: string, value: string}>): void {
    this.checkPageBreak(35 + (items.length * 8));
    
    // Card shadow effect
    this.pdf.setFillColor(235, 235, 235);
    this.pdf.rect(this.margin + 2, this.currentY + 2, this.pdf.internal.pageSize.width - (2 * this.margin), 15 + (items.length * 8), 'F');
    
    // Card background
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 15 + (items.length * 8), 'F');
    
    // Card border
    this.pdf.setDrawColor(232, 17, 35); // Claro red
    this.pdf.setLineWidth(1);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 15 + (items.length * 8));
    
    // Title bar
    this.pdf.setFillColor(232, 17, 35);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 15, 'F');
    
    this.currentY += 5;
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin + 8, this.currentY + 6);
    
    this.currentY += 10;
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    
    items.forEach(item => {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${item.label}:`, this.margin + 8, this.currentY + 5);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(item.value, this.margin + 8 + this.pdf.getTextWidth(`${item.label}: `), this.currentY + 5);
      this.currentY += 8;
    });
    
    this.currentY += 5;
  }

  // Enhanced method to render sections matching template layout
  private async renderTemplateSections(sections: any[], responses: Record<string, any>): Promise<void> {
    for (const section of sections) {
      this.currentY += 8; // Reduced space between sections
      
      // Professional section header with gradient-like effect
      this.checkPageBreak(30);
      
      // Section shadow
      this.pdf.setFillColor(220, 220, 220);
      this.pdf.rect(this.margin + 1, this.currentY + 1, this.pdf.internal.pageSize.width - (2 * this.margin), 22, 'F');
      
      // Section background with Claro branding
      this.pdf.setFillColor(232, 17, 35); // Claro red
      this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), 20, 'F');
      
      // White text on red background
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(11); // Reduced font size
      this.pdf.setFont('helvetica', 'bold');
      
      // Use translated section name with icon - clean encoding
      const translatedTitle = this.translateSectionName(section.title || 'SECAO');
      // Remove any remaining special characters that might cause encoding issues
      const cleanTitle = translatedTitle
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
        .replace(/[àáâãäåæ]/gi, 'A')
        .replace(/[èéêë]/gi, 'E') 
        .replace(/[ìíîï]/gi, 'I')
        .replace(/[òóôõö]/gi, 'O')
        .replace(/[ùúûü]/gi, 'U')
        .replace(/[ñ]/gi, 'N')
        .replace(/[ç]/gi, 'C')
        .trim();
      this.pdf.text(`${cleanTitle}`, this.margin + 8, this.currentY + 13);
      
      this.currentY += 18; // Reduced section header height
      this.pdf.setTextColor(0, 0, 0); // Reset to black
      
      if (section.fields && Array.isArray(section.fields)) {
        // Render fields maintaining template order and structure
        for (const field of section.fields) {
          await this.renderTemplateField(field, responses);
        }
      } else {
        this.addText('Seção sem campos configurados', 10);
      }
      
      this.currentY += 3; // Reduced space after section
    }
  }

  // Enhanced field rendering with template-like styling
  private async renderTemplateField(field: any, responses: Record<string, any>): Promise<void> {
    const fieldId = field.id;
    const response = responses[fieldId];
    const photoResponse = responses[`${fieldId}_photo`] || responses[`${fieldId}Photo`];
    
    // Professional field container
    this.checkPageBreak(25);
    
    // Field container with shadow and border
    const fieldHeight = this.calculateFieldHeight(field, response, photoResponse, responses);
    
    // Shadow effect
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin + 1, this.currentY + 1, this.pdf.internal.pageSize.width - (2 * this.margin), fieldHeight, 'F');
    
    // Field background
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), fieldHeight, 'F');
    
    // Field border
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin, this.currentY, this.pdf.internal.pageSize.width - (2 * this.margin), fieldHeight);
    
    this.currentY += 5;
    
    // Field label with required indicator and professional styling
    this.pdf.setFontSize(9); // Reduced font size
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(80, 80, 80);
    
    // Clean field label of special characters completely
    const cleanLabel = field.label
      .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII first
      .replace(/[àáâãäåæ]/gi, 'a')
      .replace(/[èéêë]/gi, 'e')
      .replace(/[ìíîï]/gi, 'i')
      .replace(/[òóôõö]/gi, 'o')
      .replace(/[ùúûü]/gi, 'u')
      .replace(/[ñ]/gi, 'n')
      .replace(/[ç]/gi, 'c')
      .replace(/[ý]/gi, 'y')
      .replace(/Ã/g, 'A')  // Common encoding issue
      .replace(/Ï/g, '')   // Remove problematic characters
      .replace(/%/g, '')   // Remove % symbols
      .trim();
      
    const labelText = `${cleanLabel}${field.required ? ' *' : ''}`;
    this.pdf.text(labelText, this.margin + 8, this.currentY);
    
    // Required asterisk in red if present
    if (field.required) {
      this.pdf.setTextColor(232, 17, 35);
      this.pdf.text(' *', this.margin + 8 + this.pdf.getTextWidth(cleanLabel), this.currentY);
    }
    
    this.currentY += 8;
    this.pdf.setTextColor(0, 0, 0); // Reset to black
    
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
    this.pdf.setFontSize(9); // Reduced font size
    
    if (response) {
      // Professional text field styling - smaller height
      this.pdf.setFillColor(248, 249, 250);
      this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 8, 'F'); // Reduced height
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.5);
      this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 8);
      
      this.pdf.setTextColor(50, 50, 50);
      
      // Clean response text from encoding issues
      const cleanResponse = this.cleanTextForPDF(String(response));
      
      this.pdf.text(cleanResponse, this.margin + 12, this.currentY + 3); // Adjusted position
    } else {
      this.pdf.setFillColor(252, 252, 252);
      this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 8, 'F'); // Reduced height
      this.pdf.setDrawColor(220, 220, 220);
      this.pdf.setLineWidth(0.5);
      this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 8);
      
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('Nao preenchido', this.margin + 12, this.currentY + 3); // Adjusted position
      this.pdf.setFont('helvetica', 'normal');
    }
    
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += 10; // Reduced spacing
  }

  private renderRadioFieldValue(field: any, response: any): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9); // Smaller font size
    
    if (field.options && Array.isArray(field.options)) {
      // Professional radio option layout - smaller
      field.options.forEach((option: string, index: number) => {
        const isSelected = option === response;
        
        // Option background
        const bgColor = isSelected ? [232, 17, 35] : [250, 250, 250];
        const textColor = isSelected ? [255, 255, 255] : [80, 80, 80];
        
        this.pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        this.pdf.roundedRect(this.margin + 12, this.currentY - 2, 80, 8, 2, 2, 'F'); // Smaller height
        
        // Option border
        this.pdf.setDrawColor(isSelected ? 232 : 200, isSelected ? 17 : 200, isSelected ? 35 : 200);
        this.pdf.setLineWidth(0.5);
        this.pdf.roundedRect(this.margin + 12, this.currentY - 2, 80, 8, 2, 2, 'D'); // Smaller height
        
        // Radio symbol and text - clean option text
        this.pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        this.pdf.setFont('helvetica', isSelected ? 'bold' : 'normal');
        const radioSymbol = isSelected ? '●' : '○';
        
        // Clean option text from encoding issues - aggressive cleaning
        const cleanOption = this.cleanTextForPDF(option);
        
        this.pdf.text(`${radioSymbol} ${cleanOption}`, this.margin + 15, this.currentY + 3);
        
        this.currentY += 8; // More compact spacing
      });
    } else if (response) {
      // Single selected option - smaller
      this.pdf.setFillColor(232, 17, 35);
      this.pdf.roundedRect(this.margin + 12, this.currentY - 2, 100, 8, 2, 2, 'F'); // Smaller size
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFont('helvetica', 'bold');
      // Clean single response option
      const cleanSingleResponse = this.cleanTextForPDF(response);
      this.pdf.text(`● ${cleanSingleResponse}`, this.margin + 15, this.currentY + 3);
      this.currentY += 8;
    }
    
    if (!response && (!field.options || field.options.length === 0)) {
      this.pdf.setFillColor(252, 252, 252);
      this.pdf.roundedRect(this.margin + 12, this.currentY - 2, 130, 8, 2, 2, 'F'); // Smaller size
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('○ Nenhuma opcao selecionada', this.margin + 15, this.currentY + 3);
      this.currentY += 8;
    }
    
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');
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
        // Professional evidence header
        this.pdf.setFillColor(240, 248, 255); // Light blue background
        this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12, 'F');
        this.pdf.setDrawColor(59, 130, 246); // Blue border
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12);
        
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(59, 130, 246);
        this.pdf.text('EVIDENCIA FOTOGRAFICA ANEXADA', this.margin + 12, this.currentY + 4);
        this.currentY += 15;
        
        // Add image with border
        const cleanFilename = photoFilename.replace(/^uploads\//, '');
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(1);
        this.pdf.rect(this.margin + 10, this.currentY, 140, 105); // Border around image area
        await this.addImage(`/uploads/${cleanFilename}`, 135, 100);
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
      // Professional signature box
      this.pdf.setFillColor(252, 252, 252); // Very light gray background
      this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12, 'F');
      this.pdf.setDrawColor(232, 17, 35); // Claro red border
      this.pdf.setLineWidth(1);
      this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12);
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(232, 17, 35);
      this.pdf.text('ASSINATURA DIGITAL DO TECNICO', this.margin + 12, this.currentY + 4);
      this.currentY += 15;
      
      // Signature border
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(1);
      this.pdf.rect(this.margin + 10, this.currentY, 160, 80); // Border around signature area
      
      if (signatureToRender.startsWith('data:image/')) {
        // Handle base64 signature
        await this.addBase64Image(signatureToRender, 155, 75);
      } else {
        // Handle file path signature
        const cleanPath = signatureToRender.replace(/^uploads\//, '');
        await this.addImage(`/uploads/${cleanPath}`, 155, 75);
      }
      
      // Signature validation line
      this.currentY += 10;
      this.pdf.setDrawColor(150, 150, 150);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(this.margin + 15, this.currentY, this.margin + 165, this.currentY);
      this.currentY += 8;
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text('Assinatura Digital Valida - Checklist Virtual Claro Empresas', this.margin + 15, this.currentY);
      
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
        this.margin + 12, // Adjusted position for professional layout
        this.currentY,
        width,
        height
      );
      
      this.currentY += height + 5;
    } catch (error) {
      console.log('[PDF-DEBUG] Erro ao processar assinatura base64:', error);
      this.pdf.setTextColor(239, 68, 68);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('Erro ao processar assinatura digital', this.margin + 12, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'normal');
      this.currentY += 10;
    }
  }

  private renderNoEvidenceMessage(): void {
    // Professional "no evidence" box
    this.pdf.setFillColor(255, 250, 250); // Very light red background
    this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12, 'F');
    this.pdf.setDrawColor(239, 68, 68); // Light red border
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12);
    
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(239, 68, 68);
    this.pdf.text('NENHUMA EVIDENCIA ANEXADA', this.margin + 12, this.currentY + 4);
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += 15;
  }

  private renderNoSignatureMessage(): void {
    // Professional "no signature" box
    this.pdf.setFillColor(255, 250, 250); // Very light red background
    this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12, 'F');
    this.pdf.setDrawColor(239, 68, 68); // Light red border
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin + 10, this.currentY - 2, this.pdf.internal.pageSize.width - (2 * this.margin) - 20, 12);
    
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(239, 68, 68);
    this.pdf.text('ASSINATURA NAO FORNECIDA', this.margin + 12, this.currentY + 4);
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += 15;
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