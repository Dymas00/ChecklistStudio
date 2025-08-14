import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  templateType: string;
  status: string;
  technician: string;
}

interface ReportData {
  totalChecklists: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  approvalRate: number;
  averageRating: number;
  technicianPerformance: Array<{
    technicianId: string;
    technicianName: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    rating: number;
  }>;
  templateStats: Array<{
    templateType: string;
    templateName: string;
    total: number;
    approved: number;
    approvalRate: number;
  }>;
}

interface ReportExportData {
  filters: ReportFilters;
  reportData: ReportData;
  generatedBy: string;
  generatedAt: string;
}

export class ReportsExporter {
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

  private addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(20);
    
    const tableWidth = this.pdf.internal.pageSize.width - (this.margin * 2);
    const colWidth = tableWidth / headers.length;
    
    // Headers
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    
    headers.forEach((header, i) => {
      this.pdf.text(header, this.margin + (i * colWidth), this.currentY);
    });
    
    this.currentY += this.lineHeight;
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 5;
    
    // Rows
    this.pdf.setFont('helvetica', 'normal');
    rows.forEach(row => {
      this.checkPageBreak(this.lineHeight + 2);
      
      row.forEach((cell, i) => {
        this.pdf.text(cell, this.margin + (i * colWidth), this.currentY);
      });
      
      this.currentY += this.lineHeight;
    });
    
    this.currentY += 5;
  }

  async exportReport(data: ReportExportData): Promise<void> {
    // Header
    this.addTitle('RELATÓRIO DE AVALIAÇÕES TÉCNICAS', 18);
    this.addLine();
    
    // Report Info
    this.addText(`Gerado por: ${data.generatedBy}`, 10);
    this.addText(`Data de geração: ${format(new Date(data.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 10);
    
    // Filters
    this.currentY += 5;
    this.addTitle('FILTROS APLICADOS', 14);
    
    if (data.filters.dateFrom || data.filters.dateTo) {
      const dateFrom = data.filters.dateFrom ? format(data.filters.dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido';
      const dateTo = data.filters.dateTo ? format(data.filters.dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido';
      this.addText(`Período: ${dateFrom} até ${dateTo}`, 10);
    }
    
    if (data.filters.templateType !== 'all') {
      this.addText(`Template: ${data.filters.templateType}`, 10);
    }
    
    if (data.filters.status !== 'all') {
      this.addText(`Status: ${data.filters.status}`, 10);
    }
    
    if (data.filters.technician !== 'all') {
      this.addText(`Técnico: ${data.filters.technician}`, 10);
    }
    
    this.currentY += 10;
    this.addLine();

    // Summary Statistics
    this.addTitle('RESUMO EXECUTIVO', 14);
    this.addText(`Total de Checklists Analisados: ${data.reportData.totalChecklists}`, 11, true);
    this.addText(`Checklists Aprovados: ${data.reportData.approvedCount} (${data.reportData.approvalRate.toFixed(1)}%)`, 10);
    this.addText(`Checklists Rejeitados: ${data.reportData.rejectedCount}`, 10);
    this.addText(`Checklists Pendentes: ${data.reportData.pendingCount}`, 10);
    this.addText(`Avaliação Média: ${data.reportData.averageRating.toFixed(1)}/5.0`, 10, true);
    
    this.currentY += 10;
    this.addLine();

    // Template Performance
    if (data.reportData.templateStats.length > 0) {
      this.addTitle('DESEMPENHO POR TEMPLATE', 14);
      
      const templateHeaders = ['Template', 'Total', 'Aprovados', 'Taxa Aprovação'];
      const templateRows = data.reportData.templateStats.map(template => [
        template.templateName,
        template.total.toString(),
        template.approved.toString(),
        `${template.approvalRate.toFixed(1)}%`
      ]);
      
      this.addTable(templateHeaders, templateRows);
      this.addLine();
    }

    // Technician Performance
    if (data.reportData.technicianPerformance.length > 0) {
      this.addTitle('DESEMPENHO DOS TÉCNICOS', 14);
      
      const techHeaders = ['Técnico', 'Total', 'Aprovados', 'Rejeitados', 'Taxa', 'Avaliação'];
      const techRows = data.reportData.technicianPerformance.map(tech => [
        tech.technicianName,
        tech.total.toString(),
        tech.approved.toString(),
        tech.rejected.toString(),
        tech.total > 0 ? `${((tech.approved / tech.total) * 100).toFixed(1)}%` : '0%',
        tech.rating > 0 ? tech.rating.toFixed(1) : '-'
      ]);
      
      this.addTable(techHeaders, techRows);
    }

    // Analysis and Recommendations
    this.currentY += 10;
    this.addLine();
    this.addTitle('ANÁLISE E RECOMENDAÇÕES', 14);
    
    if (data.reportData.approvalRate >= 90) {
      this.addText('✓ Excelente taxa de aprovação. A equipe técnica está realizando um trabalho de alta qualidade.', 10);
    } else if (data.reportData.approvalRate >= 70) {
      this.addText('⚠ Taxa de aprovação satisfatória, mas há espaço para melhorias no treinamento técnico.', 10);
    } else {
      this.addText('⚠ Taxa de aprovação baixa. Recomenda-se revisão dos processos e treinamento adicional.', 10);
    }
    
    if (data.reportData.averageRating >= 4.0) {
      this.addText('✓ Avaliação média excelente. Os trabalhos estão sendo executados com alta qualidade.', 10);
    } else if (data.reportData.averageRating >= 3.0) {
      this.addText('⚠ Avaliação média satisfatória. Considere identificar pontos de melhoria.', 10);
    } else {
      this.addText('⚠ Avaliação média baixa. Revisar procedimentos e aumentar supervisão.', 10);
    }

    // Footer
    this.currentY += 15;
    this.addText('Este relatório foi gerado automaticamente pelo Sistema de Gerenciamento de Checklists', 8);
    this.addText(`Página gerada em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 8);
  }

  download(filename: string) {
    this.pdf.save(filename);
  }

  getBlob(): Blob {
    return this.pdf.output('blob');
  }
}

export async function exportReportToPDF(data: ReportExportData): Promise<void> {
  const exporter = new ReportsExporter();
  await exporter.exportReport(data);
  
  const filename = `relatorio_avaliacoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  exporter.download(filename);
}