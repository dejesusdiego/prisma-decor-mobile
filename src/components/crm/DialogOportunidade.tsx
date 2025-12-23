import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContatos, useCreateOportunidade, useUpdateOportunidade, Oportunidade } from '@/hooks/useCRMData';
import { Loader2 } from 'lucide-react';

const oportunidadeSchema = z.object({
  titulo: z.string().min(2, 'Título deve ter pelo menos 2 caracteres').max(100),
  contato_id: z.string().optional().or(z.literal('')),
  valor_estimado: z.string().optional(),
  etapa: z.enum(['prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido']),
  temperatura: z.enum(['quente', 'morno', 'frio']),
  origem: z.string().optional().or(z.literal('')),
  data_previsao_fechamento: z.string().optional().or(z.literal('')),
  motivo_perda: z.string().max(255).optional().or(z.literal('')),
  observacoes: z.string().max(500).optional().or(z.literal(''))
});

type OportunidadeFormData = z.infer<typeof oportunidadeSchema>;

const ETAPAS = [
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechado_ganho', label: 'Fechado Ganho' },
  { value: 'fechado_perdido', label: 'Fechado Perdido' }
];

const TEMPERATURAS = [
  { value: 'quente', label: '🔥 Quente' },
  { value: 'morno', label: '🌡️ Morno' },
  { value: 'frio', label: '❄️ Frio' }
];

const ORIGENS = [
  { value: 'site', label: 'Site' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'outro', label: 'Outro' }
];

interface DialogOportunidadeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oportunidade?: Oportunidade | null;
}

export function DialogOportunidade({ open, onOpenChange, oportunidade }: DialogOportunidadeProps) {
  const { data: contatos } = useContatos();
  const createOportunidade = useCreateOportunidade();
  const updateOportunidade = useUpdateOportunidade();
  
  const isEditing = !!oportunidade;
  const isPending = createOportunidade.isPending || updateOportunidade.isPending;

  const form = useForm<OportunidadeFormData>({
    resolver: zodResolver(oportunidadeSchema),
    defaultValues: {
      titulo: '',
      contato_id: '',
      valor_estimado: '',
      etapa: 'prospeccao',
      temperatura: 'morno',
      origem: '',
      data_previsao_fechamento: '',
      motivo_perda: '',
      observacoes: ''
    }
  });

  const etapaAtual = form.watch('etapa');

  useEffect(() => {
    if (oportunidade) {
      form.reset({
        titulo: oportunidade.titulo,
        contato_id: oportunidade.contato_id || '',
        valor_estimado: oportunidade.valor_estimado?.toString() || '',
        etapa: oportunidade.etapa as 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado_ganho' | 'fechado_perdido',
        temperatura: (oportunidade.temperatura as 'quente' | 'morno' | 'frio') || 'morno',
        origem: oportunidade.origem || '',
        data_previsao_fechamento: oportunidade.data_previsao_fechamento || '',
        motivo_perda: oportunidade.motivo_perda || '',
        observacoes: oportunidade.observacoes || ''
      });
    } else {
      form.reset({
        titulo: '',
        contato_id: '',
        valor_estimado: '',
        etapa: 'prospeccao',
        temperatura: 'morno',
        origem: '',
        data_previsao_fechamento: '',
        motivo_perda: '',
        observacoes: ''
      });
    }
  }, [oportunidade, form]);

  const onSubmit = async (data: OportunidadeFormData) => {
    const payload = {
      titulo: data.titulo,
      contato_id: data.contato_id || null,
      valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : null,
      etapa: data.etapa,
      temperatura: data.temperatura,
      origem: data.origem || null,
      data_previsao_fechamento: data.data_previsao_fechamento || null,
      motivo_perda: data.motivo_perda || null,
      observacoes: data.observacoes || null
    };

    try {
      if (isEditing && oportunidade) {
        await updateOportunidade.mutateAsync({ id: oportunidade.id, ...payload });
      } else {
        await createOportunidade.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Oportunidade' : 'Nova Oportunidade'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cortinas sala de estar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contato_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contato..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contatos?.map((contato) => (
                        <SelectItem key={contato.id} value={contato.id}>
                          {contato.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_estimado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Estimado (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0,00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="etapa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ETAPAS.map((etapa) => (
                          <SelectItem key={etapa.value} value={etapa.value}>
                            {etapa.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPERATURAS.map((temp) => (
                          <SelectItem key={temp.value} value={temp.value}>
                            {temp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORIGENS.map((origem) => (
                          <SelectItem key={origem.value} value={origem.value}>
                            {origem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_previsao_fechamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão Fechamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {etapaAtual === 'fechado_perdido' && (
              <FormField
                control={form.control}
                name="motivo_perda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Perda</FormLabel>
                    <FormControl>
                      <Input placeholder="Por que perdemos essa oportunidade?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre a oportunidade..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
