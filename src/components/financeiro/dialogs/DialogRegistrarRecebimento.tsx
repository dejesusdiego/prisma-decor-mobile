import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

interface DialogRegistrarRecebimentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela?: any;
}

export function DialogRegistrarRecebimento({ open, onOpenChange, parcela }: DialogRegistrarRecebimentoProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      data_pagamento: format(new Date(), 'yyyy-MM-dd'),
      forma_pagamento_id: ''
    }
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
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

      // 2. Buscar conta a receber com dados do orçamento
      const { data: conta, error: errorConta } = await supabase
        .from('contas_receber')
        .select('*, parcelas:parcelas_receber(*), orcamento:orcamentos(id, codigo, cliente_nome, total_geral, total_com_desconto)')
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

      const { error: errorUpdateConta } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: novoValorPago,
          status: todasPagas ? 'pago' : 'parcial'
        })
        .eq('id', parcela.conta_receber_id);
      
      if (errorUpdateConta) throw errorUpdateConta;

      // 5. SINCRONIZAR STATUS DO ORÇAMENTO baseado no percentual pago
      if (conta.orcamento_id) {
        const valorTotalOrcamento = Number(conta.orcamento?.total_com_desconto ?? conta.orcamento?.total_geral ?? conta.valor_total) || 0;
        const percentualPago = valorTotalOrcamento > 0 ? (novoValorPago / valorTotalOrcamento) * 100 : 0;

        let novoStatusOrcamento: string | null = null;
        
        if (percentualPago >= 100) {
          novoStatusOrcamento = 'pago';
        } else if (percentualPago >= 60) {
          novoStatusOrcamento = 'pago_60';
        } else if (percentualPago >= 50) {
          novoStatusOrcamento = 'pago_parcial';
        } else if (percentualPago >= 40) {
          novoStatusOrcamento = 'pago_40';
        }

        if (novoStatusOrcamento) {
          // Não sobrescrever se já está cancelado ou com status mais avançado
          const { error: errorSyncStatus } = await supabase
            .from('orcamentos')
            .update({ status: novoStatusOrcamento })
            .eq('id', conta.orcamento_id)
            .not('status', 'in', '("cancelado","pago")');
          
          if (errorSyncStatus) {
            console.error('Erro ao sincronizar status do orçamento:', errorSyncStatus);
          } else {
            console.log(`Status do orçamento ${conta.orcamento_id} atualizado para: ${novoStatusOrcamento} (${percentualPago.toFixed(1)}%)`);
          }
        }
      }

      // 5. Criar lançamento financeiro
      const { data: lancamento, error: errorLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Recebimento parcela ${parcela.numero_parcela} - ${conta.cliente_nome}`,
          tipo: 'entrada',
          valor: parcela.valor,
          data_lancamento: data.data_pagamento,
          parcela_receber_id: parcela.id,
          forma_pagamento_id: data.forma_pagamento_id || null,
          created_by_user_id: user?.id
        })
        .select()
        .single();
      
      if (errorLancamento) throw errorLancamento;

      // 6. Criar comissão automaticamente se houver orçamento vinculado
      if (conta.orcamento_id && conta.orcamento && user) {
        // Buscar configuração de comissão padrão (5%)
        const percentualComissao = 5;
        const valorParcelaRecebida = Number(parcela.valor);
        const valorComissao = (valorParcelaRecebida * percentualComissao) / 100;

        // Verificar se já existe comissão para este orçamento/parcela
        const { data: comissaoExistente } = await supabase
          .from('comissoes')
          .select('id')
          .eq('orcamento_id', conta.orcamento_id)
          .eq('observacoes', `Parcela ${parcela.numero_parcela}`)
          .maybeSingle();

        // Criar comissão apenas se não existir
        if (!comissaoExistente) {
          await supabase
            .from('comissoes')
            .insert({
              orcamento_id: conta.orcamento_id,
              vendedor_nome: 'Vendedor Padrão', // Pode ser configurado posteriormente
              percentual: percentualComissao,
              valor_base: valorParcelaRecebida,
              valor_comissao: valorComissao,
              status: 'pendente',
              observacoes: `Parcela ${parcela.numero_parcela}`,
              created_by_user_id: user.id
            });
        }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Recebimento registrado com sucesso');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao registrar recebimento');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setArquivo(file);
    }
  };

  const removerArquivo = () => {
    setArquivo(null);
  };

  if (!parcela) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

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