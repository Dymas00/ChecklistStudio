import React from 'react';
import { TemplateField } from '@/lib/templates';

interface ConditionalFieldProps {
  field: TemplateField;
  responses: Record<string, any>;
  children: React.ReactNode;
  className?: string;
}

export default function ConditionalField({ 
  field, 
  responses, 
  children, 
  className 
}: ConditionalFieldProps) {
  // Check if field should be shown based on conditional logic
  const shouldShow = () => {
    if (!field.conditional) {
      return true; // No condition, always show
    }

    const conditionField = field.conditional.field;
    const currentValue = responses[conditionField];

    // Check for specific value condition
    if (field.conditional.value) {
      return currentValue === field.conditional.value;
    }

    // Check for "not value" condition  
    if (field.conditional.notValue) {
      return currentValue !== field.conditional.notValue;
    }

    return true;
  };

  // Additional logic for complex conditions like multiple links
  const shouldShowAdvanced = () => {
    if (!field.conditional) return true;

    const conditionField = field.conditional.field;
    const currentValue = responses[conditionField];

    // Handle special cases for links section
    if (field.id.includes('link2') && conditionField === 'linksQuantity') {
      return currentValue === '2' || currentValue === '3';
    }
    
    if (field.id.includes('link3') && conditionField === 'linksQuantity') {
      return currentValue === '3';
    }

    // Handle conditional fields based on other field types
    if (field.conditional.field === 'link2Type' || field.conditional.field === 'link3Type') {
      const linkTypeValue = responses[field.conditional.field];
      if (field.conditional.notValue) {
        return linkTypeValue !== field.conditional.notValue;
      }
      if (field.conditional.value) {
        return linkTypeValue === field.conditional.value;
      }
    }

    return shouldShow();
  };

  if (!shouldShowAdvanced()) {
    return null;
  }

  return (
    <div className={`conditional-field ${className || ''}`}>
      {children}
    </div>
  );
}
