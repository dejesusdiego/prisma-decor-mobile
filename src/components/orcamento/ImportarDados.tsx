import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImportStatus {
  materials: 'idle' | 'loading' | 'success' | 'error';
  confeccao: 'idle' | 'loading' | 'success' | 'error';
  instalacao: 'idle' | 'loading' | 'success' | 'error';
}

export function ImportarDados({ onVoltar }: { onVoltar: () => void }) {
  const [materialsFile, setMaterialsFile] = useState<File | null>(null);
  const [confeccaoFile, setConfeccaoFile] = useState<File | null>(null);
  const [instalacaoFile, setInstalacaoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>({
    materials: 'idle',
    confeccao: 'idle',
    instalacao: 'idle',
  });
  const [importing, setImporting] = useState(false);

  const handleImportMaterials = async (data: any[]) => {
    setStatus((prev) => ({ ...prev, materials: 'loading' }));
    
    try {
      for (const item of data) {
        const materialData = {
          codigo_item: item.codigoItem,
          nome: item.nome,
          categoria: item.categoria,
          unidade: item.unidade || 'M',
          largura_metro: item.larguraMetro || null,
          preco_custo: item.precoCusto,
          preco_tabela: item.precoCusto * 1.615, // Margem padrão para preço tabela
          ativo: item.ativo !== false,
        };

        // Tentar atualizar primeiro
        const { error: updateError } = await supabase
          .from('materiais')
          .update(materialData)
          .eq('codigo_item', item.codigoItem);

        // Se não existe, inserir
        if (updateError) {
          const { error: insertError } = await supabase
            .from('materiais')
            .insert(materialData);

          if (insertError) throw insertError;
        }
      }

      setStatus((prev) => ({ ...prev, materials: 'success' }));
      toast({
        title: 'Materiais importados',
        description: `${data.length} materiais foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao importar materiais:', error);
      setStatus((prev) => ({ ...prev, materials: 'error' }));
      toast({
        title: 'Erro ao importar materiais',
        description: 'Verifique o formato do arquivo e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleImportConfeccao = async (data: any[]) => {
    setStatus((prev) => ({ ...prev, confeccao: 'loading' }));
    
    try {
      for (const item of data) {
        const confeccaoData = {
          codigo_item: item.codigoItem,
          nome_modelo: item.nomeModelo,
          unidade: item.unidade || 'mt',
          preco_custo: item.precoCusto,
          preco_tabela: item.precoCusto * 1.55, // Margem padrão para preço tabela
          ativo: item.ativo !== false,
        };

        // Tentar atualizar primeiro
        const { error: updateError } = await supabase
          .from('servicos_confeccao')
          .update(confeccaoData)
          .eq('codigo_item', item.codigoItem);

        // Se não existe, inserir
        if (updateError) {
          const { error: insertError } = await supabase
            .from('servicos_confeccao')
            .insert(confeccaoData);

          if (insertError) throw insertError;
        }
      }

      setStatus((prev) => ({ ...prev, confeccao: 'success' }));
      toast({
        title: 'Serviços de confecção importados',
        description: `${data.length} serviços foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao importar serviços de confecção:', error);
      setStatus((prev) => ({ ...prev, confeccao: 'error' }));
      toast({
        title: 'Erro ao importar serviços de confecção',
        description: 'Verifique o formato do arquivo e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleImportInstalacao = async (data: any[]) => {
    setStatus((prev) => ({ ...prev, instalacao: 'loading' }));
    
    try {
      for (const item of data) {
        const instalacaoData = {
          codigo_item: item.codigoItem,
          nome: item.nome,
          preco_custo_por_ponto: item.precoCustoPorPonto,
          preco_tabela_por_ponto: item.precoCustoPorPonto * 1.615, // Margem padrão para preço tabela
          ativo: item.ativo !== false,
        };

        // Tentar atualizar primeiro
        const { error: updateError } = await supabase
          .from('servicos_instalacao')
          .update(instalacaoData)
          .eq('codigo_item', item.codigoItem);

        // Se não existe, inserir
        if (updateError) {
          const { error: insertError } = await supabase
            .from('servicos_instalacao')
            .insert(instalacaoData);

          if (insertError) throw insertError;
        }
      }

      setStatus((prev) => ({ ...prev, instalacao: 'success' }));
      toast({
        title: 'Serviços de instalação importados',
        description: `${data.length} serviços foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao importar serviços de instalação:', error);
      setStatus((prev) => ({ ...prev, instalacao: 'error' }));
      toast({
        title: 'Erro ao importar serviços de instalação',
        description: 'Verifique o formato do arquivo e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!materialsFile && !confeccaoFile && !instalacaoFile) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione pelo menos um arquivo para importar',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // Importar materiais
      if (materialsFile) {
        const text = await materialsFile.text();
        const data = JSON.parse(text);
        await handleImportMaterials(data);
      }

      // Importar serviços de confecção
      if (confeccaoFile) {
        const text = await confeccaoFile.text();
        const data = JSON.parse(text);
        await handleImportConfeccao(data);
      }

      // Importar serviços de instalação
      if (instalacaoFile) {
        const text = await instalacaoFile.text();
        const data = JSON.parse(text);
        await handleImportInstalacao(data);
      }

      toast({
        title: 'Importação concluída',
        description: 'Todos os dados foram importados com sucesso',
      });
    } catch (error) {
      console.error('Erro durante importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao processar os arquivos',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const getStatusIcon = (fileStatus: 'idle' | 'loading' | 'success' | 'error') => {
    switch (fileStatus) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Importar Base de Dados</h2>
          <p className="text-muted-foreground mt-2">
            Importe os arquivos JSON com materiais e serviços da Prisma Interiores
          </p>
        </div>
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos para Importação</CardTitle>
          <CardDescription>
            Selecione os arquivos JSON correspondentes. Os dados serão atualizados ou criados
            automaticamente baseado no código do item.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="materials">1. Materiais (materials.json)</Label>
              {getStatusIcon(status.materials)}
            </div>
            <Input
              id="materials"
              type="file"
              accept=".json"
              onChange={(e) => setMaterialsFile(e.target.files?.[0] || null)}
              disabled={importing}
            />
            <p className="text-sm text-muted-foreground">
              Tecidos, forros, trilhos, acessórios e papéis de parede
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confeccao">2. Serviços de Confecção (servicos_confeccao.json)</Label>
              {getStatusIcon(status.confeccao)}
            </div>
            <Input
              id="confeccao"
              type="file"
              accept=".json"
              onChange={(e) => setConfeccaoFile(e.target.files?.[0] || null)}
              disabled={importing}
            />
            <p className="text-sm text-muted-foreground">
              Todos os modelos de costura e confecção
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="instalacao">3. Serviços de Instalação (servicos_instalacao.json)</Label>
              {getStatusIcon(status.instalacao)}
            </div>
            <Input
              id="instalacao"
              type="file"
              accept=".json"
              onChange={(e) => setInstalacaoFile(e.target.files?.[0] || null)}
              disabled={importing}
            />
            <p className="text-sm text-muted-foreground">
              Serviços de instalação por ponto
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleImport}
              disabled={importing || (!materialsFile && !confeccaoFile && !instalacaoFile)}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Dados
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Se o item já existe (mesmo código), ele será atualizado com os novos valores</p>
          <p>• Se o item não existe, será criado um novo registro</p>
          <p>• Todos os itens importados ficam ativos automaticamente</p>
          <p>• Os preços de custo são mantidos exatamente como estão nos arquivos JSON</p>
          <p>• Os cálculos dos orçamentos usarão esses dados como base oficial</p>
        </CardContent>
      </Card>
    </div>
  );
}
