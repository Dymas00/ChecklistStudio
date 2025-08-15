import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  templateType: string;
  status: string;
  technician: string;
  storeNumber: string;
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
  storeStats: Array<{
    storeNumber: string;
    storeName: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
    averageRating: number;
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

  private addTable(headers: string[], rows: string[][], colWidths?: number[]) {
    this.checkPageBreak(25);
    
    const tableWidth = this.pdf.internal.pageSize.width - (this.margin * 2);
    const defaultColWidth = tableWidth / headers.length;
    
    // Use custom column widths if provided, otherwise equal distribution
    const columnWidths = colWidths || headers.map(() => defaultColWidth);
    
    // Header background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, this.currentY - 5, tableWidth, 12, 'F');
    
    // Headers
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(0, 0, 0);
    
    let currentX = this.margin;
    headers.forEach((header, i) => {
      // Center text in column
      const textWidth = this.pdf.getStringUnitWidth(header) * this.pdf.getFontSize() / this.pdf.internal.scaleFactor;
      const centeredX = currentX + (columnWidths[i] - textWidth) / 2;
      this.pdf.text(header, centeredX, this.currentY + 2);
      currentX += columnWidths[i];
    });
    
    this.currentY += 12;
    
    // Header border
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 3;
    
    // Rows
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(this.lineHeight + 3);
      
      // Alternating row colors
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(248, 249, 250);
        this.pdf.rect(this.margin, this.currentY - 2, tableWidth, this.lineHeight + 2, 'F');
      }
      
      currentX = this.margin;
      row.forEach((cell, i) => {
        // Center text in column
        const textWidth = this.pdf.getStringUnitWidth(cell) * this.pdf.getFontSize() / this.pdf.internal.scaleFactor;
        const centeredX = currentX + (columnWidths[i] - textWidth) / 2;
        this.pdf.text(cell, centeredX, this.currentY + 2);
        currentX += columnWidths[i];
      });
      
      this.currentY += this.lineHeight + 1;
    });
    
    // Bottom border
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 8;
  }

  async exportReport(data: ReportExportData): Promise<void> {
    // Header with logo area (placeholder for company branding)
    this.pdf.setFillColor(41, 128, 185); // Blue header
    this.pdf.rect(0, 0, this.pdf.internal.pageSize.width, 35, 'F');
    
    this.pdf.setTextColor(255, 255, 255); // White text
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(20);
    this.pdf.text('RELATÓRIO DE AVALIAÇÕES TÉCNICAS', this.margin, 22);
    
    this.pdf.setTextColor(200, 200, 200); // Light gray text
    this.pdf.setFontSize(10);
    this.pdf.text('Sistema de Gerenciamento de Checklists - Claro Empresas', this.margin, 30);
    
    this.currentY = 45;
    this.pdf.setTextColor(0, 0, 0); // Reset to black
    
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
    
    if (data.filters.storeNumber !== 'all') {
      this.addText(`Loja: ${data.filters.storeNumber}`, 10);
    }
    
    this.currentY += 10;
    this.addLine();

    // Summary Statistics with visual enhancements
    this.addTitle('📊 RESUMO EXECUTIVO', 14);
    
    // Key metrics in boxes
    const metricsY = this.currentY;
    const boxWidth = 45;
    const boxHeight = 25;
    
    // Total Checklists box
    this.pdf.setFillColor(52, 152, 219);
    this.pdf.rect(this.margin, metricsY, boxWidth, boxHeight, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.text(data.reportData.totalChecklists.toString(), this.margin + boxWidth/2 - 5, metricsY + 12);
    this.pdf.setFontSize(8);
    this.pdf.text('TOTAL', this.margin + boxWidth/2 - 8, metricsY + 20);
    
    // Approval Rate box
    this.pdf.setFillColor(46, 204, 113);
    this.pdf.rect(this.margin + boxWidth + 5, metricsY, boxWidth, boxHeight, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.text(`${data.reportData.approvalRate.toFixed(1)}%`, this.margin + boxWidth + 5 + boxWidth/2 - 8, metricsY + 12);
    this.pdf.setFontSize(8);
    this.pdf.text('APROVAÇÃO', this.margin + boxWidth + 5 + boxWidth/2 - 12, metricsY + 20);
    
    // Average Rating box
    this.pdf.setFillColor(241, 196, 15);
    this.pdf.rect(this.margin + (boxWidth + 5) * 2, metricsY, boxWidth, boxHeight, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.text(`${data.reportData.averageRating.toFixed(1)}`, this.margin + (boxWidth + 5) * 2 + boxWidth/2 - 5, metricsY + 12);
    this.pdf.setFontSize(8);
    this.pdf.text('NOTA MÉDIA', this.margin + (boxWidth + 5) * 2 + boxWidth/2 - 12, metricsY + 20);
    
    this.currentY += boxHeight + 15;
    this.pdf.setTextColor(0, 0, 0); // Reset to black
    
    // Detailed breakdown
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.addText(`✓ Checklists Aprovados: ${data.reportData.approvedCount}`, 10);
    this.addText(`✗ Checklists Rejeitados: ${data.reportData.rejectedCount}`, 10);
    this.addText(`⏳ Checklists Pendentes: ${data.reportData.pendingCount}`, 10);
    
    this.currentY += 10;
    this.addLine();

    // Template Performance
    if (data.reportData.templateStats.length > 0) {
      this.addTitle('📋 DESEMPENHO POR TEMPLATE', 14);
      
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
      this.addTitle('👷 DESEMPENHO DOS TÉCNICOS', 14);
      
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
      this.addLine();
    }

    // Store Performance
    if (data.reportData.storeStats.length > 0) {
      this.addTitle('📊 DESEMPENHO POR LOJA', 14);
      
      const storeHeaders = ['Loja', 'Total', 'Aprovados', 'Rejeitados', 'Pendentes', 'Taxa %', 'Nota'];
      const storeRows = data.reportData.storeStats.slice(0, 12).map(store => [
        store.storeName,
        store.total.toString(),
        store.approved.toString(),
        store.rejected.toString(),
        store.pending.toString(),
        `${store.approvalRate.toFixed(1)}%`,
        store.averageRating > 0 ? store.averageRating.toFixed(1) : '-'
      ]);
      
      // Custom column widths for better layout
      const tableWidth = this.pdf.internal.pageSize.width - (this.margin * 2);
      const storeColWidths = [
        tableWidth * 0.25, // Loja - wider
        tableWidth * 0.12, // Total
        tableWidth * 0.12, // Aprovados
        tableWidth * 0.12, // Rejeitados
        tableWidth * 0.12, // Pendentes
        tableWidth * 0.12, // Taxa %
        tableWidth * 0.15  // Nota
      ];
      
      this.addTable(storeHeaders, storeRows, storeColWidths);
      
      if (data.reportData.storeStats.length > 12) {
        this.addText(`📈 Exibindo top 12 lojas com maior volume (${data.reportData.storeStats.length} lojas no total)`, 8);
      }
      
      this.currentY += 5;
      this.addLine();
    }

    // Analysis and Recommendations
    this.currentY += 10;
    this.addLine();
    this.addTitle('💡 ANÁLISE E RECOMENDAÇÕES', 14);
    
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

    // Footer with enhanced styling
    this.currentY += 15;
    
    // Footer line
    this.pdf.setLineWidth(1);
    this.pdf.setDrawColor(41, 128, 185);
    this.pdf.line(this.margin, this.currentY, this.pdf.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.setFont('helvetica', 'normal');
    this.addText('📄 Este relatório foi gerado automaticamente pelo Sistema de Gerenciamento de Checklists', 8);
    this.addText(`🕒 Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 8);
    this.addText('🏢 Claro Empresas - Gestão de Qualidade Operacional', 8);
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