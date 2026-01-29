import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Tag,
  Search,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useSuppliersPendingApproval, useAllSuppliers, useApproveSupplier, useRejectSupplier } from '@/hooks/useSuppliersPendingApproval';
import { SupplierStatusBadge } from '@/components/supplier/SupplierStatusBadge';
import { toast } from 'sonner';

interface SupplierDetails {
  id: string;
  user_id: string;
  company_name: string;
  trading_name: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  categories: string[];
  service_regions: string[];
  catalog_url: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_created_at?: string;
}

export function SupplierApprovalList() {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const { data: pendingSuppliers, isLoading: isLoadingPending, refetch: refetchPending } = useSuppliersPendingApproval();
  const { data: allSuppliers, isLoading: isLoadingAll, refetch: refetchAll } = useAllSuppliers();
  const approveMutation = useApproveSupplier();
  const rejectMutation = useRejectSupplier();

  const suppliers = statusFilter === 'pending' ? pendingSuppliers : allSuppliers;
  const isLoading = statusFilter === 'pending' ? isLoadingPending : isLoadingAll;

  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = (
      supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.trading_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj?.includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (supplier: SupplierDetails) => {
    setSelectedSupplier(supplier);
    setIsDetailsOpen(true);
  };

  const handleApprove = async (supplierId: string) => {
    try {
      await approveMutation.mutateAsync(supplierId);
      refetchPending();
      refetchAll();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRejectClick = (supplier: SupplierDetails) => {
    setSelectedSupplier(supplier);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSupplier || !rejectReason.trim()) return;

    try {
      await rejectMutation.mutateAsync({
        supplierId: selectedSupplier.id,
        reason: rejectReason,
      });
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setSelectedSupplier(null);
      refetchPending();
      refetchAll();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCategories = (categories: string[]) => {
    if (!categories || categories.length === 0) return '-';
    return categories.join(', ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Aprovação de Fornecedores</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os fornecedores pendentes de aprovação
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchPending();
                refetchAll();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pendentes
            </Button>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('approved')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aprovados
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitados
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Carregando fornecedores...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.company_name}</p>
                          {supplier.trading_name && (
                            <p className="text-sm text-muted-foreground">{supplier.trading_name}</p>
                          )}
                          {supplier.cnpj && (
                            <p className="text-xs text-muted-foreground">CNPJ: {supplier.cnpj}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.contact_name && (
                          <p className="text-sm">{supplier.contact_name}</p>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="max-w-[200px] truncate text-sm">
                              {formatCategories(supplier.categories)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatCategories(supplier.categories)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(supplier.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SupplierStatusBadge status={supplier.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(supplier)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalhes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {supplier.status === 'pending' && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApprove(supplier.id)}
                                    disabled={approveMutation.isPending}
                                  >
                                    {approveMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aprovar fornecedor</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRejectClick(supplier)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    {rejectMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rejeitar fornecedor</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredSuppliers?.length || 0} fornecedor(es) encontrado(s)
          </span>
          {statusFilter === 'pending' && pendingSuppliers && pendingSuppliers.length > 0 && (
            <span className="text-amber-600">
              {pendingSuppliers.length} aguardando aprovação
            </span>
          )}
        </div>
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalhes do Fornecedor
            </DialogTitle>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedSupplier.company_name}</h3>
                {selectedSupplier.trading_name && (
                  <p className="text-muted-foreground">{selectedSupplier.trading_name}</p>
                )}
                <div className="flex items-center gap-2">
                  <SupplierStatusBadge status={selectedSupplier.status} />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">CNPJ</label>
                  <p>{selectedSupplier.cnpj || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Contato</label>
                  <p>{selectedSupplier.contact_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                  <p>{selectedSupplier.email || selectedSupplier.user_email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Telefone</label>
                  <p>{selectedSupplier.phone || '-'}</p>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Categorias
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.categories?.map((category) => (
                    <Badge key={category} variant="secondary">{category}</Badge>
                  )) || <span className="text-muted-foreground">-</span>}
                </div>
              </div>

              {/* Service Regions */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Regiões de Atuação
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.service_regions?.map((region) => (
                    <Badge key={region} variant="outline">{region}</Badge>
                  )) || <span className="text-muted-foreground">-</span>}
                </div>
              </div>

              {/* Catalog URL */}
              {selectedSupplier.catalog_url && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Catálogo</label>
                  <a
                    href={selectedSupplier.catalog_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    {selectedSupplier.catalog_url}
                  </a>
                </div>
              )}

              {/* User Info */}
              <div className="border-t pt-4 space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Informações do Usuário</label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    {selectedSupplier.user_email || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cadastro: </span>
                    {formatDate(selectedSupplier.user_created_at)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedSupplier.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleRejectClick(selectedSupplier);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(selectedSupplier.id);
                      setIsDetailsOpen(false);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Aprovar
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeitar Fornecedor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>
              Você está rejeitando o cadastro de{' '}
              <strong>{selectedSupplier?.company_name}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da rejeição *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Confirmar Rejeição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
