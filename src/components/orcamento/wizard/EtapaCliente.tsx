import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from '@/hooks/use-toast';
import type { DadosOrcamento } from '@/types/orcamento';
import { useContatoByTelefone } from '@/hooks/useCRMData';
import { User, Loader2, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { TipBanner } from '@/components/ui/TipBanner';
import { useQuery } from '@tanstack/react-query';

interface EtapaClienteProps {
  dados: DadosOrcamento;
  orcamentoId?: string | null;
  onAvancar: (dados: DadosOrcamento, orcamentoId: string) => void;
  onCancelar: () => void;
}

export function EtapaCliente({ dados, orcamentoId, onAvancar, onCancelar }: EtapaClienteProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [formData, setFormData] = useState<DadosOrcamento>(dados);
  const [loading, setLoading] = useState(false);
  const [telefoneDebounced, setTelefoneDebounced] = useState('');
  const [contatoVinculadoId, setContatoVinculadoId] = useState<string | null>(null);
  
  // Hook para buscar contato pelo telefone
  const { data: contatoEncontrado, isLoading: buscandoContato } = useContatoByTelefone(telefoneDebounced);

  // Buscar lista de vendedores (usuários do sistema)
  const { data: vendedores = [] } = useQuery({
    queryKey: ['vendedores-lista'],
    queryFn: async () => {
      // Buscar configurações de comissão para listar vendedores cadastrados
      const { data: configComissao } = await supabase
        .from('configuracoes_comissao')
        .select('vendedor_user_id, vendedor_nome')
        .eq('ativo', true);
      
      if (configComissao && configComissao.length > 0) {
        return configComissao;
      }
      
      // Fallback: buscar vendedores únicos das comissões existentes
      const { data: comissoes } = await supabase
        .from('comissoes')
        .select('vendedor_nome, vendedor_user_id')
        .order('vendedor_nome');
      
      const vendedoresUnicos = new Map<string, { vendedor_user_id: string | null; vendedor_nome: string }>();
      comissoes?.forEach(c => {
        if (c.vendedor_nome && !vendedoresUnicos.has(c.vendedor_nome)) {
          vendedoresUnicos.set(c.vendedor_nome, {
            vendedor_user_id: c.vendedor_user_id,
            vendedor_nome: c.vendedor_nome
          });
        }
      });
      
      return Array.from(vendedoresUnicos.values());
    }
  });

  // Debounce do telefone para não fazer muitas requisições
  useEffect(() => {
    const timer = setTimeout(() => {
      const telefoneLimpo = formData.clienteTelefone.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setTelefoneDebounced(formData.clienteTelefone);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.clienteTelefone]);

  // Auto-preencher dados quando encontrar contato
  useEffect(() => {
    if (contatoEncontrado && !contatoVinculadoId) {
      setFormData(prev => ({
        ...prev,
        clienteNome: contatoEncontrado.nome || prev.clienteNome,
        cidade: contatoEncontrado.cidade || prev.cidade,
        endereco: contatoEncontrado.endereco || prev.endereco,
      }));
      setContatoVinculadoId(contatoEncontrado.id);
      toast({
        title: 'Contato encontrado!',
        description: `Dados de ${contatoEncontrado.nome} preenchidos automaticamente.`,
      });
    }
  }, [contatoEncontrado]);

  // Limpar vínculo se telefone mudar significativamente
  useEffect(() => {
    if (contatoVinculadoId && contatoEncontrado && contatoEncontrado.telefone !== formData.clienteTelefone) {
      setContatoVinculadoId(null);
    }
  }, [formData.clienteTelefone]);

  // Função para criar ou obter contato vinculado (com proteção contra duplicatas)
  const obterOuCriarContato = async (): Promise<string | null> => {
    // Se já temos um contato vinculado encontrado pela busca, usar ele
    if (contatoVinculadoId) {
      return contatoVinculadoId;
    }
    
    // Tentar buscar contato existente pelo telefone E organization_id
    const { data: contatoExistente } = await supabase
      .from('contatos')
      .select('id')
      .eq('telefone', formData.clienteTelefone)
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (contatoExistente) {
      return contatoExistente.id;
    }
    
    // Criar novo contato se não existe (com tratamento de conflito)
    const { data: novoContato, error: erroContato } = await supabase
      .from('contatos')
      .insert({
        nome: formData.clienteNome,
        telefone: formData.clienteTelefone,
        cidade: formData.cidade,
        endereco: formData.endereco,
        tipo: 'lead',
        origem: 'orcamento',
        created_by_user_id: user!.id,
        organization_id: organizationId,
      })
      .select()
      .single();
    
    if (erroContato) {
      // Se erro de duplicata (23505), buscar o existente
      if (erroContato.code === '23505') {
        const { data: existente } = await supabase
          .from('contatos')
          .select('id')
          .eq('telefone', formData.clienteTelefone)
          .eq('organization_id', organizationId)
          .single();
        return existente?.id || null;
      }
      console.error('Erro ao criar contato:', erroContato);
      return null;
    }
    
    toast({
      title: 'Contato criado',
      description: `${formData.clienteNome} foi adicionado ao CRM automaticamente.`,
    });
    
    return novoContato.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Obter ou criar contato vinculado
      const contatoId = await obterOuCriarContato();
      
      if (orcamentoId) {
        // Atualizar orçamento existente
        const { error } = await supabase
          .from('orcamentos')
          .update({
            cliente_nome: formData.clienteNome,
            cliente_telefone: formData.clienteTelefone,
            cidade: formData.cidade,
            endereco: formData.endereco,
            observacoes: formData.observacoes || null,
            contato_id: contatoId,
            vendedor_id: formData.vendedorId || null,
          })
          .eq('id', orcamentoId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Dados do cliente atualizados com sucesso',
        });

        onAvancar(formData, orcamentoId);
      } else {
        // Criar novo orçamento com contato vinculado
        const { data, error } = await supabase
          .from('orcamentos')
          .insert({
            cliente_nome: formData.clienteNome,
            cliente_telefone: formData.clienteTelefone,
            cidade: formData.cidade,
            endereco: formData.endereco,
            observacoes: formData.observacoes || null,
            margem_tipo: 'padrao',
            margem_percent: 61.5,
            status: 'rascunho',
            created_by_user_id: user.id,
            codigo: '',
            contato_id: contatoId,
            vendedor_id: formData.vendedorId || null,
            organization_id: organizationId,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Dados do cliente salvos com sucesso',
        });

        onAvancar(formData, data.id);
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os dados do cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapa 1 - Dados do Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Dica */}
        <TipBanner id="orcamento-etapa-cliente-dica" variant="info" className="mb-4">
          O telefone é usado para <strong>vincular automaticamente</strong> ao CRM. 
          Se o contato já existir, os dados serão preenchidos automaticamente!
        </TipBanner>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clienteNome">Nome do Cliente *</Label>
            <Input
              id="clienteNome"
              value={formData.clienteNome}
              onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
              required
              placeholder="Digite o nome do cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clienteTelefone" className="flex items-center gap-1">
              Telefone / WhatsApp *
              <HelpTooltip content="Um contato será criado ou vinculado automaticamente no CRM usando este telefone" side="right" />
            </Label>
            <div className="relative">
              <Input
                id="clienteTelefone"
                value={formData.clienteTelefone}
                onChange={(e) => {
                  setFormData({ ...formData, clienteTelefone: e.target.value });
                  setContatoVinculadoId(null); // Reset ao digitar novo telefone
                }}
                required
                placeholder="(00) 00000-0000"
                className={contatoEncontrado ? 'pr-10 border-green-500' : ''}
              />
              {buscandoContato && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {contatoEncontrado && !buscandoContato && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <User className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {contatoEncontrado && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  Contato existente: {contatoEncontrado.nome}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (dados preenchidos automaticamente)
                </span>
              </div>
            )}
            {!contatoEncontrado && !buscandoContato && telefoneDebounced && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Novo contato será criado no CRM
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade" className="flex items-center gap-1">
              Cidade *
              <HelpTooltip content="Usado para cálculos de deslocamento e relatórios por região" side="right" />
            </Label>
            <Select
              value={formData.cidade}
              onValueChange={(value) => setFormData({ ...formData, cidade: value })}
              required
            >
              <SelectTrigger id="cidade">
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="Balneário Camboriú">Balneário Camboriú</SelectItem>
                <SelectItem value="Camboriú">Camboriú</SelectItem>
                <SelectItem value="Itajaí">Itajaí</SelectItem>
                <SelectItem value="Itapema">Itapema</SelectItem>
                <SelectItem value="Porto Belo">Porto Belo</SelectItem>
                <SelectItem value="Bombinhas">Bombinhas</SelectItem>
                <SelectItem value="Navegantes">Navegantes</SelectItem>
                <SelectItem value="Penha">Penha</SelectItem>
                <SelectItem value="Piçarras">Piçarras</SelectItem>
                <SelectItem value="Ilhota">Ilhota</SelectItem>
                <SelectItem value="Luiz Alves">Luiz Alves</SelectItem>
                <SelectItem value="Brusque">Brusque</SelectItem>
                <SelectItem value="Canelinha">Canelinha</SelectItem>
                <SelectItem value="Tijucas">Tijucas</SelectItem>
                <SelectItem value="São João Batista">São João Batista</SelectItem>
                <SelectItem value="Nova Trento">Nova Trento</SelectItem>
                <SelectItem value="Gaspar">Gaspar</SelectItem>
                <SelectItem value="Blumenau">Blumenau</SelectItem>
                <SelectItem value="Guabiruba">Guabiruba</SelectItem>
                <SelectItem value="Botuverá">Botuverá</SelectItem>
                <SelectItem value="Itapoá">Itapoá</SelectItem>
                <SelectItem value="Barra Velha">Barra Velha</SelectItem>
                <SelectItem value="Massaranduba">Massaranduba</SelectItem>
                <SelectItem value="Schroeder">Schroeder</SelectItem>
                <SelectItem value="Jaraguá do Sul">Jaraguá do Sul</SelectItem>
                <SelectItem value="Corupá">Corupá</SelectItem>
                <SelectItem value="São Bento do Sul">São Bento do Sul</SelectItem>
                <SelectItem value="Campo Alegre">Campo Alegre</SelectItem>
                <SelectItem value="Joinville">Joinville</SelectItem>
                <SelectItem value="Araquari">Araquari</SelectItem>
                <SelectItem value="São Francisco do Sul">São Francisco do Sul</SelectItem>
                <SelectItem value="Garuva">Garuva</SelectItem>
                <SelectItem value="Florianópolis">Florianópolis</SelectItem>
                <SelectItem value="Palhoça">Palhoça</SelectItem>
                <SelectItem value="São José">São José</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              required
              placeholder="Digite o endereço completo"
            />
          </div>

          {/* Seletor de Vendedor */}
          <div className="space-y-2">
            <Label htmlFor="vendedor" className="flex items-center gap-1">
              Vendedor Responsável
              <HelpTooltip content="Selecione o vendedor para cálculo automático de comissão" side="right" />
            </Label>
            <Select
              value={formData.vendedorId || 'none'}
              onValueChange={(value) => {
                const vendedor = vendedores.find(v => v.vendedor_user_id === value);
                setFormData({ 
                  ...formData, 
                  vendedorId: value === 'none' ? undefined : value,
                  vendedorNome: vendedor?.vendedor_nome || undefined
                });
              }}
            >
              <SelectTrigger id="vendedor">
                <SelectValue placeholder="Selecione o vendedor (opcional)">
                  {formData.vendedorNome || 'Selecione o vendedor (opcional)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum vendedor</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v.vendedor_user_id || v.vendedor_nome} value={v.vendedor_user_id || v.vendedor_nome}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{v.vendedor_nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.vendedorNome && (
              <p className="text-xs text-muted-foreground">
                Comissão será calculada automaticamente para {formData.vendedorNome}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o projeto"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancelar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Avançar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
