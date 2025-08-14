import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
          <DialogDescription>
            Revise os dados preenchidos pelo técnico e {action === 'approve' ? 'aprove' : 'rejeite'} o checklist
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Filled Form View */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-red-600">SEÇÃO 1 | Dados do Analista</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Nome do Analista <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.responses?.analystName || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    E-mail do Analista <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.responses?.analystEmail || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Eu aceito que meus dados sensíveis serão armazenados. <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                        checklist.responses?.analystConsent === 'SIM' 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`} />
                      <Label className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                        checklist.responses?.analystConsent === 'NÃO' 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`} />
                      <Label className="text-sm">NÃO</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-red-600">SEÇÃO 2 | Dados do Técnico</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Eu aceito que meus dados sensíveis serão armazenados. <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                        checklist.responses?.techConsent === 'SIM' 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`} />
                      <Label className="text-sm">SIM</Label>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                        checklist.responses?.techConsent === 'NÃO' 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`} />
                      <Label className="text-sm">NÃO</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Nome do Técnico <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.responses?.techName || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.responses?.techPhone || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.responses?.techCPF || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Empresa Terceirizada <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.responses?.contractor || 'Não informado'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-red-600">SEÇÃO 3 | Dados da Loja</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Código da Loja</Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.storeCode || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Gerente da Loja</Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.storeManager || 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Telefone da Loja</Label>
                  <div className="mt-1 p-3 bg-white border rounded-md">
                    {checklist.storePhone || 'Não informado'}
                  </div>
                </div>

                {checklist.responses?.connectivityType && (
                  <div>
                    <Label className="text-sm font-medium">Tipo de Conectividade</Label>
                    <div className="mt-1 p-3 bg-white border rounded-md">
                      {checklist.responses.connectivityType}
                    </div>
                  </div>
                )}

                {checklist.responses?.speedTest && (
                  <div>
                    <Label className="text-sm font-medium">Teste de Velocidade (Mbps)</Label>
                    <div className="mt-1 p-3 bg-white border rounded-md">
                      {checklist.responses.speedTest}
                    </div>
                  </div>
                )}

                {/* Images Section */}
                {checklist.files && checklist.files.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Fotos Anexadas</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {checklist.files.map((file: any, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={`/uploads/${file.filename}`}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => window.open(`/uploads/${file.filename}`, '_blank')}
                          />
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Foto {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional fields from responses that might contain image references */}
                {Object.entries(checklist.responses || {}).map(([key, value]) => {
                  if (key.toLowerCase().includes('foto') || key.toLowerCase().includes('image')) {
                    return (
                      <div key={key}>
                        <Label className="text-sm font-medium">{key}</Label>
                        <div className="mt-1 p-3 bg-white border rounded-md">
                          {typeof value === 'string' && value.includes('/uploads/') ? (
                            <img
                              src={value}
                              alt={key}
                              className="max-w-full h-32 object-cover rounded cursor-pointer"
                              onClick={() => window.open(value, '_blank')}
                            />
                          ) : typeof value === 'object' && value !== null ? (
                            JSON.stringify(value)
                          ) : (
                            String(value || '')
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {/* Right side - Approval Actions */}
          <div className="space-y-4">
            {/* Checklist Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Checklist:</p>
              <p className="font-medium">Loja {checklist.storeCode}</p>
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={approveChecklistMutation.isPending}
                className={
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {approveChecklistMutation.isPending
                  ? 'Processando...'
                  : action === 'approve'
                  ? 'Confirmar Aprovação'
                  : 'Confirmar Reprovação'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={approveChecklistMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}