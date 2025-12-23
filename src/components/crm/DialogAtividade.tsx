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
import { Checkbox } from '@/components/ui/checkbox';
import { useContatos, useCreateAtividade, Atividade } from '@/hooks/useCRMData';
import { Loader2, Phone, Mail, Calendar, Users, MessageSquare, FileText } from 'lucide-react';

const atividadeSchema = z.object({
  tipo: z.enum(['ligacao', 'email', 'reuniao', 'visita', 'whatsapp', 'outro']),
  titulo: z.string().min(2, 'Título deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500).optional().or(z.literal('')),
  contato_id: z.string().optional().or(z.literal('')),
  data_atividade: z.string(),
  data_lembrete: z.string().optional().or(z.literal('')),
  concluida: z.boolean()
});

type AtividadeFormData = z.infer<typeof atividadeSchema>;

const TIPOS_ATIVIDADE = [
  { value: 'ligacao', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'reuniao', label: 'Reunião', icon: Calendar },
  { value: 'visita', label: 'Visita', icon: Users },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'outro', label: 'Outro', icon: FileText }
];

interface DialogAtividadeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contatoIdInicial?: string | null;
}

export function DialogAtividade({ open, onOpenChange, contatoIdInicial }: DialogAtividadeProps) {
  const { data: contatos } = useContatos();
  const createAtividade = useCreateAtividade();

  const form = useForm<AtividadeFormData>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      tipo: 'ligacao',
      titulo: '',
      descricao: '',
      contato_id: contatoIdInicial || '',
      data_atividade: new Date().toISOString().slice(0, 16),
      data_lembrete: '',
      concluida: false
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: 'ligacao',
        titulo: '',
        descricao: '',
        contato_id: contatoIdInicial || '',
        data_atividade: new Date().toISOString().slice(0, 16),
        data_lembrete: '',
        concluida: false
      });
    }
  }, [open, contatoIdInicial, form]);

  const onSubmit = async (data: AtividadeFormData) => {
    const payload = {
      tipo: data.tipo,
      titulo: data.titulo,
      descricao: data.descricao || null,
      contato_id: data.contato_id || null,
      data_atividade: data.data_atividade,
      data_lembrete: data.data_lembrete || null,
      concluida: data.concluida
    };

    try {
      await createAtividade.mutateAsync(payload);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_ATIVIDADE.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <tipo.icon className="h-4 w-4" />
                            {tipo.label}
                          </div>
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
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição breve da atividade" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_atividade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data/Hora *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_lembrete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lembrete</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes da atividade..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concluida"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Marcar como concluída
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAtividade.isPending}>
                {createAtividade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
