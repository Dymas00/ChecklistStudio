import { useEffect, useRef } from 'react';

export function useFormPersistence(
  templateId: string | undefined,
  responses: Record<string, any>,
  setResponses: (responses: Record<string, any>) => void,
  isEditing: boolean
) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current || !templateId || isEditing) return;
    
    const savedDraft = localStorage.getItem(`checklist_draft_${templateId}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setResponses(parsed);
      } catch (error) {
        console.error('Error loading draft from localStorage:', error);
      }
    }
    isInitializedRef.current = true;
  }, [templateId, setResponses, isEditing]);

  // Save to localStorage when responses change
  useEffect(() => {
    if (!templateId || !isInitializedRef.current || Object.keys(responses).length === 0) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Create a safe copy for serialization
        const safeResponses = Object.fromEntries(
          Object.entries(responses).map(([key, value]) => [
            key,
            value instanceof File ? { 
              name: value.name, 
              size: value.size, 
              type: value.type,
              _isFile: true 
            } : value
          ])
        );
        localStorage.setItem(`checklist_draft_${templateId}`, JSON.stringify(safeResponses));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [responses, templateId]);

  // Clear localStorage on successful submission
  const clearDraft = () => {
    if (templateId) {
      localStorage.removeItem(`checklist_draft_${templateId}`);
    }
  };

  return { clearDraft };
}