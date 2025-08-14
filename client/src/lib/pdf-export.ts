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

  private async addImage(imageData: string, maxWidth: number = 80, maxHeight: number = 60) {
    try {
      this.checkPageBreak(maxHeight + 10);
      
      // Simple approach - try to add the image directly
      try {
        this.pdf.addImage(imageData, 'JPEG', this.margin, this.currentY, maxWidth, maxHeight);
        this.currentY += maxHeight + 10;
        return true;
      } catch (imgError) {
        this.addText('Imagem anexada (não pôde ser exibida)', 8);
        return false;
      }
    } catch (error) {
      this.addText('Erro ao processar imagem', 8);
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
    // Header
    this.addTitle('RELATÓRIO DE CHECKLIST', 18);
    this.addLine();
    
    // Basic Info
    this.addText(`Template: ${data.templateName}`, 12, true);
    this.addText(`Técnico: ${data.technicianName}`, 10);
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

    // Sections and Fields
    for (const section of data.sections) {
      this.addTitle(`SEÇÃO ${section.id} - ${section.title}`, 14);
      
      for (const field of section.fields) {
        const value = data.responses[field.id];
        
        this.addText(`${field.label}${field.required ? ' *' : ''}`, 10, true);
        
        // Handle different field types
        if (field.type === 'evidence' && value) {
          if (Array.isArray(value) && value.length > 0) {
            this.addText(`Evidências: ${value.length} arquivo(s)`, 9);
            for (let i = 0; i < Math.min(value.length, 3); i++) {
              this.addText(`- ${value[i].name || `Arquivo ${i + 1}`}`, 8);
            }
            if (value.length > 3) {
              this.addText(`... e mais ${value.length - 3} arquivo(s)`, 8);
            }
          } else {
            this.addText('Nenhuma evidência', 9);
          }
        } else if (field.type === 'signature' && value) {
          this.addText('✓ Assinatura Digital Capturada', 9);
        } else {
          this.addText(this.formatValue(field, value), 9);
        }
        
        this.currentY += 5;
      }
      
      this.addLine();
    }

    // Footer
    this.currentY += 10;
    this.addText(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 8);
    this.addText('Sistema de Gerenciamento de Checklists', 8);
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
  
  const filename = `checklist_${checklist.templateName.toLowerCase()}_${checklist.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  exporter.download(filename);
}