import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useFinanceiroInvalidation } from '@/hooks/useFinanceiroInvalidation';
import { isPagamentoCompleto } from '@/lib/calculosFinanceiros';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface DialogRegistrarRecebimentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela?: any;
}

export function DialogRegistrarRecebimento({ open, onOpenChange, parcela }: DialogRegistrarRecebimentoProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();
  const { invalidateAfterRecebimento, invalidateComissoes } = useFinanceiroInvalidation();
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      data_pagamento: format(new Date(), 'yyyy-MM-dd'),
      forma_pagamento_id: ''
    }
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento-ativas', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId
  });

  useEffect(() => {
    if (open) {
      reset({
        data_pagamento: format(new Date(), 'yyyy-MM-dd'),
        forma_pagamento_id: ''
      });
      setArquivo(null);
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Atualizar parcela
      const { error: errorParcela } = await supabase
        .from('parcelas_receber')
        .update({
          status: 'pago',
          data_pagamento: data.data_pagamento,
          forma_pagamento_id: data.forma_pagamento_id || null
        })
        .eq('id', parcela.id);
      
      if (errorParcela) throw errorParcela;

      // 2. Buscar conta a receber com dados do orçamento, contato e vendedor
      const { data: conta, error: errorConta } = await supabase
        .from('contas_receber')
        .select('*, parcelas:parcelas_receber(*), orcamento:orcamentos(id, codigo, cliente_nome, total_geral, total_com_desconto, contato_id, vendedor_id)')
        .eq('id', parcela.conta_receber_id)
        .single();
      
      if (errorConta) throw errorConta;

      // 3. Calcular novo valor pago
      const novoValorPago = conta.parcelas
        .filter((p: any) => p.status === 'pago' || p.id === parcela.id)
        .reduce((acc: number, p: any) => acc + Number(p.valor), 0);

      // 4. Atualizar conta a receber
      const todasPagas = conta.parcelas.every(
        (p: any) => p.status === 'pago' || p.id === parcela.id
      );
      
      // Usar tolerância para considerar pago mesmo com pequenas diferenças (até R$ 5 ou 0.5%)
      const considerarPago = todasPagas || isPagamentoCompleto(Number(conta.valor_total), novoValorPago);

      const { error: errorUpdateConta } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: novoValorPago,
          status: considerarPago ? 'pago' : 'parcial'
        })
        .eq('id', parcela.conta_receber_id);
      
      if (errorUpdateConta) throw errorUpdateConta;

      // Calcular percentual pago para uso em toasts de marcos
      const valorTotalOrcamento = Number(conta.orcamento?.total_com_desconto ?? conta.orcamento?.total_geral ?? conta.valor_total) || 0;
      const percentualPago = valorTotalOrcamento > 0 ? (novoValorPago / valorTotalOrcamento) * 100 : 0;

      // NOTA: A sincronização de status do orçamento é feita automaticamente pelo trigger SQL
      // 'sincronizar_status_orcamento' quando contas_receber é atualizado.
      // A criação de atividades CRM também é feita pelo trigger 'create_atividade_from_orcamento_status'.

      // Apenas mostrar toasts de marco atingido (UI feedback)
      if (conta.orcamento_id) {
        const percentualAnterior = valorTotalOrcamento > 0 
          ? ((novoValorPago - Number(parcela.valor)) / valorTotalOrcamento) * 100 
          : 0;

        const clienteNome = conta.orcamento?.cliente_nome || conta.cliente_nome;
        const codigoOrcamento = conta.orcamento?.codigo || '';
        const TOLERANCIA_PERCENTUAL = 99.5;

        if ((percentualPago >= 100 || percentualPago >= TOLERANCIA_PERCENTUAL) && percentualAnterior < TOLERANCIA_PERCENTUAL) {
          const { showSuccess } = await import('@/lib/toastMessages');
          showSuccess(`🎉 Orçamento ${codigoOrcamento} TOTALMENTE PAGO!`, {
            description: `${clienteNome} - ${formatCurrency(valorTotalOrcamento)}`,
            duration: 8000,
          });
        } else if (percentualPago >= 60 && percentualAnterior < 60) {
          toast.info(`📊 Orçamento ${codigoOrcamento} atingiu 60% de pagamento`, {
            description: `${clienteNome} - Faltam ${formatCurrency(valorTotalOrcamento - novoValorPago)}`,
            duration: 6000,
          });
        } else if (percentualPago >= 40 && percentualAnterior < 40) {
          toast.info(`📊 Orçamento ${codigoOrcamento} atingiu 40% de pagamento`, {
            description: `${clienteNome} - Recebido ${formatCurrency(novoValorPago)}`,
            duration: 6000,
          });
        }
      }

      // 5. Criar lançamento financeiro - com organization_id
      const { data: lancamento, error: errorLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Recebimento parcela ${parcela.numero_parcela} - ${conta.cliente_nome}`,
          tipo: 'entrada',
          valor: parcela.valor,
          data_lancamento: data.data_pagamento,
          parcela_receber_id: parcela.id,
          forma_pagamento_id: data.forma_pagamento_id || null,
          created_by_user_id: user?.id,
          organization_id: organizationId
        })
        .select()
        .single();
      
      if (errorLancamento) throw errorLancamento;

      // 6. Criar comissão automaticamente se houver orçamento vinculado
      if (conta.orcamento_id && conta.orcamento && user) {
        // Buscar vendedor do orçamento e sua configuração de comissão
        const vendedorId = conta.orcamento.vendedor_id;
        let vendedorNome = 'Vendedor Padrão';
        let percentualComissao = 5;

        if (vendedorId) {
          // Buscar configuração de comissão do vendedor - filtrado por organização
          // Usando cast para evitar TS2589
          const configQuery = (supabase.from('configuracoes_comissao') as any)
            .select('vendedor_nome, percentual_padrao')
            .eq('organization_id', organizationId)
            .eq('vendedor_user_id', vendedorId)
            .eq('ativo', true)
            .maybeSingle();
          const { data: configComissao } = await configQuery;
          
          if (configComissao) {
            vendedorNome = configComissao.vendedor_nome;
            percentualComissao = Number(configComissao.percentual_padrao);
          } else {
            // Fallback: buscar email do usuário vendedor
            const { data: userVendedor } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('user_id', vendedorId)
              .maybeSingle();
            
            if (userVendedor) {
              vendedorNome = `Vendedor ${vendedorId.slice(0, 8)}`;
            }
          }
        }

        const valorParcelaRecebida = Number(parcela.valor);
        const valorComissao = (valorParcelaRecebida * percentualComissao) / 100;

        // Verificar se já existe comissão para este orçamento/parcela
        const { data: comissaoExistente } = await supabase
          .from('comissoes')
          .select('id')
          .eq('orcamento_id', conta.orcamento_id)
          .eq('observacoes', `Parcela ${parcela.numero_parcela}`)
          .maybeSingle();

        // Criar comissão apenas se não existir - com organization_id
        if (!comissaoExistente) {
          await supabase
            .from('comissoes')
            .insert({
              orcamento_id: conta.orcamento_id,
              vendedor_nome: vendedorNome,
              vendedor_user_id: vendedorId || null,
              percentual: percentualComissao,
              valor_base: valorParcelaRecebida,
              valor_comissao: valorComissao,
              status: 'pendente',
              observacoes: `Parcela ${parcela.numero_parcela}`,
              created_by_user_id: user.id,
              organization_id: organizationId
            });
        }

        // NOTA: A criação de atividade CRM é feita automaticamente pelo trigger SQL
        // 'create_atividade_from_orcamento_status' quando o status do orçamento muda.
      }

      // 7. Upload de comprovante se houver arquivo
      if (arquivo && user) {
        const fileExt = arquivo.name.split('.').pop();
        const fileName = `${user.id}/${parcela.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(fileName, arquivo);
        
        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          // Não bloqueia o fluxo, apenas loga
        } else {
          // Criar registro do comprovante
          const { data: urlData } = supabase.storage
            .from('comprovantes')
            .getPublicUrl(fileName);
          
          await supabase
            .from('comprovantes_pagamento')
            .insert({
              parcela_receber_id: parcela.id,
              lancamento_id: lancamento?.id,
              nome_arquivo: arquivo.name,
              tipo_arquivo: arquivo.type,
              tamanho_bytes: arquivo.size,
              arquivo_url: urlData.publicUrl,
              uploaded_by_user_id: user.id
            });
        }
      }
    },
    onSuccess: async () => {
      // Invalidação cruzada usando hook centralizado
      invalidateAfterRecebimento();
      invalidateComissoes();
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-crm'] });
      queryClient.invalidateQueries({ queryKey: ['jornada-cliente'] });
      const { ToastMessages } = await import('@/lib/toastMessages');
      ToastMessages.financeiro.recebimentoRegistrado();
      onOpenChange(false);
    },
    onError: async (error) => {
      const { showHandledError } = await import('@/lib/errorHandler');
      showHandledError(error, 'Erro ao registrar recebimento');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        const { showError } = await import('@/lib/toastMessages');
        showError('Arquivo muito grande', {
          description: 'Máximo 10MB',
        });
        return;
      }
      setArquivo(file);
    }
  };

  const removerArquivo = () => {
    setArquivo(null);
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">Parcela {parcela.numero_parcela}</p>
          <p className="text-lg font-bold">{formatCurrency(Number(parcela.valor))}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Data do Pagamento *</Label>
            <Input 
              {...register('data_pagamento', { required: true })} 
              type="date" 
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select 
              value={watch('forma_pagamento_id')} 
              onValueChange={(v) => setValue('forma_pagamento_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.id} value={forma.id}>
                    {forma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload de Comprovante */}
          <div className="space-y-2">
            <Label>Comprovante (opcional)</Label>
            {arquivo ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{arquivo.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={removerArquivo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Imagens ou PDF até 10MB
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}