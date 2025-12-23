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
import { Contato, useCreateContato, useUpdateContato } from '@/hooks/useCRMData';
import { Loader2 } from 'lucide-react';

const contatoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20).optional().or(z.literal('')),
  telefone_secundario: z.string().max(20).optional().or(z.literal('')),
  cidade: z.string().max(100).optional().or(z.literal('')),
  endereco: z.string().max(255).optional().or(z.literal('')),
  tipo: z.enum(['lead', 'cliente', 'inativo']),
  origem: z.string().max(50).optional().or(z.literal('')),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
  tags: z.string().optional() // comma-separated
});

type ContatoFormData = z.infer<typeof contatoSchema>;

const TIPOS_CONTATO = [
  { value: 'lead', label: 'Lead' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'inativo', label: 'Inativo' }
];

const ORIGENS = [
  { value: 'site', label: 'Site' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'importado_orcamento', label: 'Importado de Orçamento' },
  { value: 'outro', label: 'Outro' }
];

interface DialogContatoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato?: Contato | null;
}

export function DialogContato({ open, onOpenChange, contato }: DialogContatoProps) {
  const createContato = useCreateContato();
  const updateContato = useUpdateContato();
  
  const isEditing = !!contato;
  const isPending = createContato.isPending || updateContato.isPending;

  const form = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      telefone_secundario: '',
      cidade: '',
      endereco: '',
      tipo: 'lead',
      origem: '',
      observacoes: '',
      tags: ''
    }
  });

  useEffect(() => {
    if (contato) {
      form.reset({
        nome: contato.nome,
        email: contato.email || '',
        telefone: contato.telefone || '',
        telefone_secundario: contato.telefone_secundario || '',
        cidade: contato.cidade || '',
        endereco: contato.endereco || '',
        tipo: contato.tipo as 'lead' | 'cliente' | 'inativo',
        origem: contato.origem || '',
        observacoes: contato.observacoes || '',
        tags: contato.tags?.join(', ') || ''
      });
    } else {
      form.reset({
        nome: '',
        email: '',
        telefone: '',
        telefone_secundario: '',
        cidade: '',
        endereco: '',
        tipo: 'lead',
        origem: '',
        observacoes: '',
        tags: ''
      });
    }
  }, [contato, form]);

  const onSubmit = async (data: ContatoFormData) => {
    const tagsArray = data.tags
      ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const payload = {
      nome: data.nome,
      email: data.email || null,
      telefone: data.telefone || null,
      telefone_secundario: data.telefone_secundario || null,
      cidade: data.cidade || null,
      endereco: data.endereco || null,
      tipo: data.tipo,
      origem: data.origem || null,
      observacoes: data.observacoes || null,
      tags: tagsArray.length > 0 ? tagsArray : null
    };

    try {
      if (isEditing && contato) {
        await updateContato.mutateAsync({ id: contato.id, ...payload });
      } else {
        await createContato.mutateAsync(payload);
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
            {isEditing ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(47) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone_secundario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone Secundário</FormLabel>
                    <FormControl>
                      <Input placeholder="(47) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        {TIPOS_CONTATO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
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
            </div>

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Separe por vírgulas: VIP, Prioridade, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o contato..." 
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
