import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import type { DadosOrcamento } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';

interface EtapaClienteProps {
  dados: DadosOrcamento;
  orcamentoId?: string | null;
  onAvancar: (dados: DadosOrcamento, orcamentoId: string) => void;
  onCancelar: () => void;
}

export function EtapaCliente({ dados, orcamentoId, onAvancar, onCancelar }: EtapaClienteProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DadosOrcamento>(dados);
  const [loading, setLoading] = useState(false);

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
          })
          .eq('id', orcamentoId);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Dados do cliente atualizados com sucesso',
        });

        onAvancar(formData, orcamentoId);
      } else {
        // Criar novo orçamento
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
            codigo: '', // Será gerado pelo trigger
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
            <Label htmlFor="clienteTelefone">Telefone / WhatsApp *</Label>
            <Input
              id="clienteTelefone"
              value={formData.clienteTelefone}
              onChange={(e) => setFormData({ ...formData, clienteTelefone: e.target.value })}
              required
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
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
