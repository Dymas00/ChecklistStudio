import { Template } from '@shared/schema';

export interface TemplateSection {
  id: number;
  title: string;
  icon: string;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'photo' | 'signature' | 'evidence';
  required?: boolean;
  options?: string[];
  conditional?: {
    field: string;
    value?: string;
    notValue?: string;
  };
}

export function getTemplateIcon(type: string): string {
  const icons: Record<string, string> = {
    upgrade: 'fas fa-arrow-up',
    ativacao: 'fas fa-power-off',
    manutencao: 'fas fa-tools',
    migracao: 'fas fa-exchange-alt',
  };
  
  return icons[type] || 'fas fa-clipboard-check';
}

export function getTemplateColor(type: string): string {
  const colors: Record<string, string> = {
    upgrade: 'blue',
    ativacao: 'green',
    manutencao: 'orange',
    migracao: 'purple',
  };
  
  return colors[type] || 'gray';
}

export function validateFormResponses(template: Template, responses: Record<string, any>): string[] {
  const errors: string[] = [];
  const sections = template.sections as TemplateSection[];
  
  sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.required) {
        // Check conditional fields
        if (field.conditional) {
          const conditionField = field.conditional.field;
          const conditionValue = responses[conditionField];
          
          // Handle specific value conditions
          if (field.conditional.value && conditionValue !== field.conditional.value) {
            return; // Skip validation if condition not met
          }
          
          // Handle "not value" conditions
          if (field.conditional.notValue && conditionValue === field.conditional.notValue) {
            return; // Skip validation if condition not met
          }

          // Handle complex link conditions
          if (field.id.includes('link2') && conditionField === 'linksQuantity') {
            if (conditionValue !== '2' && conditionValue !== '3') {
              return;
            }
          }
          
          if (field.id.includes('link3') && conditionField === 'linksQuantity') {
            if (conditionValue !== '3') {
              return;
            }
          }
        }
        
        const value = responses[field.id];
        
        // Special validation for evidence fields
        if (field.type === 'evidence') {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${field.label} - resposta é obrigatória`);
          } else if (value === 'sim') {
            // Check if photo is provided for SIM answers
            const photoField = `${field.id}_photo`;
            if (!responses[photoField]) {
              errors.push(`${field.label} - foto comprobatória é obrigatória para resposta SIM`);
            }
          } else if (value === 'nao') {
            // Check if observation is provided for NÃO answers
            const obsField = `${field.id}_observation`;
            if (!responses[obsField] || responses[obsField].trim() === '') {
              errors.push(`${field.label} - observações são obrigatórias para resposta NÃO`);
            }
          }
        } else {
          // Standard validation for other field types
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${field.label} é obrigatório`);
          }
          
          // Special validation for file fields
          if (field.type === 'photo' && !(value instanceof File)) {
            errors.push(`${field.label} - arquivo de imagem é obrigatório`);
          }
          
          // Special validation for signature fields
          if (field.type === 'signature' && (!value || value === '')) {
            errors.push(`${field.label} é obrigatória`);
          }
        }
      }
    });
  });
  
  return errors;
}

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pendente: 'status-pendente',
    aprovado: 'status-aprovado', 
    reprovado: 'status-reprovado',
    em_analise: 'status-em_analise',
  };
  
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-800'}`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    em_analise: 'Em Análise',
  };
  
  return labels[status] || status;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'há alguns segundos';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  
  return targetDate.toLocaleDateString('pt-BR');
}

// Helper function to check if a field should be visible based on conditions
export function isFieldVisible(field: TemplateField, responses: Record<string, any>): boolean {
  if (!field.conditional) return true;

  const conditionField = field.conditional.field;
  const currentValue = responses[conditionField];

  if (field.conditional.value) {
    return currentValue === field.conditional.value;
  }

  if (field.conditional.notValue) {
    return currentValue !== field.conditional.notValue;
  }

  return true;
}

// Template validation helpers
export function getRequiredFieldsCount(template: Template): number {
  const sections = template.sections as TemplateSection[];
  let count = 0;
  
  sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.required) count++;
    });
  });
  
  return count;
}

export function getCompletedFieldsCount(template: Template, responses: Record<string, any>): number {
  const sections = template.sections as TemplateSection[];
  let count = 0;
  
  sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.required && isFieldVisible(field, responses)) {
        const value = responses[field.id];
        if (value && (typeof value !== 'string' || value.trim() !== '')) {
          count++;
        }
      }
    });
  });
  
  return count;
}

export function getFormProgress(template: Template, responses: Record<string, any>): number {
  const total = getRequiredFieldsCount(template);
  const completed = getCompletedFieldsCount(template, responses);
  
  if (total === 0) return 100;
  return Math.round((completed / total) * 100);
}
