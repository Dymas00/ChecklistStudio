import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, User, Phone, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ApprovalDialog from './approval-dialog';

interface ChecklistDetailsDialogProps {
  checklist: any;
  isOpen: boolean;
  onClose: () => void;
  technicanName?: string;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800';
    case 'rejeitado':
      return 'bg-red-100 text-red-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'aprovado':
      return 'Aprovado';
    case 'rejeitado':
      return 'Rejeitado';
    case 'pendente':
      return 'Pendente';
    default:
      return status;
  }
}

export default function ChecklistDetailsDialog({ 
  checklist, 
  isOpen, 
  onClose, 
  technicanName 
}: ChecklistDetailsDialogProps) {
  const { user } = useAuth();
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);

  const canApprove = user && ['analista', 'coordenador', 'administrador'].includes(user.role);
  const isPending = checklist?.status === 'pendente';

  const handleApprovalAction = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
  };

  const closeApprovalDialog = () => {
    setApprovalAction(null);
  };

  if (!checklist) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Checklist</span>
              <Badge className={getStatusBadgeClass(checklist.status)}>
                {getStatusLabel(checklist.status)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Template</p>
                    <p className="text-sm text-gray-900">{checklist.templateId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Código da Loja</p>
                    <p className="text-sm text-gray-900">{checklist.storeCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Gerente</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {checklist.storeManager}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Técnico</p>
                    <p className="text-sm text-gray-900">{technicanName || 'Não identificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Telefone</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {checklist.storePhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Data de Criação</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {format(new Date(checklist.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Information */}
              {checklist.status !== 'pendente' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Informações da {checklist.status === 'aprovado' ? 'Aprovação' : 'Reprovação'}
                  </h4>
                  
                  {checklist.approvalComment && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <div className="flex items-start">
                        <MessageSquare className="w-4 h-4 text-gray-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Comentário:</p>
                          <p className="text-sm text-gray-900 mt-1">{checklist.approvalComment}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {checklist.status === 'aprovado' && checklist.rating && (
                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Avaliação do Técnico:</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (parseInt(checklist.rating) || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">{checklist.rating}/5</span>
                        </div>
                      </div>
                      
                      {checklist.feedback && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Comentário:</p>
                          <p className="text-sm text-gray-900">{checklist.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {checklist.approvedAt && (
                    <p className="text-xs text-gray-500">
                      {checklist.status === 'aprovado' ? 'Aprovado' : 'Reprovado'} em {' '}
                      {format(new Date(checklist.approvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}

              {/* Form Responses */}
              {checklist.responses && Object.keys(checklist.responses).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Respostas do Formulário</h4>
                  <div className="space-y-3">
                    {Object.entries(checklist.responses).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 capitalize">{key}:</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Code */}
              {checklist.validationCode && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Código de Validação</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-mono text-blue-900">{checklist.validationCode}</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="border-t pt-4">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              
              {canApprove && isPending && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleApprovalAction('reject')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reprovar
                  </Button>
                  <Button
                    onClick={() => handleApprovalAction('approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      {approvalAction && (
        <ApprovalDialog
          checklist={checklist}
          isOpen={!!approvalAction}
          onClose={closeApprovalDialog}
          action={approvalAction}
        />
      )}
    </>
  );
}