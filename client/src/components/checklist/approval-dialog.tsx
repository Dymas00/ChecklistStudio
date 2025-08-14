import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ApprovalDialogProps {
  checklist: any;
  isOpen: boolean;
  onClose: () => void;
  action: 'approve' | 'reject';
}

export default function ApprovalDialog({ checklist, isOpen, onClose, action }: ApprovalDialogProps) {
  const [approvalComment, setApprovalComment] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveChecklistMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/checklists/${checklist.id}/approve`, data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: action === 'approve' 
          ? 'Checklist aprovado com sucesso!'
          : 'Checklist rejeitado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/checklists'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar a solicitação',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!approvalComment.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, adicione um comentário sobre a aprovação/reprovação.',
        variant: 'destructive',
      });
      return;
    }

    if (action === 'approve' && rating === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, avalie o técnico (1-5 estrelas).',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      action,
      approvalComment: approvalComment.trim(),
      ...(action === 'approve' && {
        rating,
        feedback: feedback.trim() || undefined,
      }),
    };

    approveChecklistMutation.mutate(data);
  };

  const resetForm = () => {
    setApprovalComment('');
    setRating(0);
    setFeedback('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Aprovar Checklist
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                Reprovar Checklist
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Checklist Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Checklist:</p>
            <p className="font-medium">{checklist.templateId} - Loja {checklist.storeCode}</p>
            <p className="text-sm text-gray-600">Gerente: {checklist.storeManager}</p>
          </div>

          {/* Approval Comment */}
          <div className="space-y-2">
            <Label htmlFor="approvalComment">
              Comentário da {action === 'approve' ? 'Aprovação' : 'Reprovação'} *
            </Label>
            <Textarea
              id="approvalComment"
              placeholder={
                action === 'approve'
                  ? 'Descreva os pontos positivos do atendimento...'
                  : 'Explique os motivos da reprovação...'
              }
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Rating (only for approval) */}
          {action === 'approve' && (
            <div className="space-y-2">
              <Label>Avaliação do Técnico *</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>
          )}

          {/* Feedback (only for approval) */}
          {action === 'approve' && (
            <div className="space-y-2">
              <Label htmlFor="feedback">
                Comentário sobre o Atendimento
                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              </Label>
              <Textarea
                id="feedback"
                placeholder="Comentários adicionais sobre o técnico ou atendimento..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={approveChecklistMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={approveChecklistMutation.isPending}
              className={`flex-1 ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {approveChecklistMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                action === 'approve' ? 'Aprovar' : 'Reprovar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}