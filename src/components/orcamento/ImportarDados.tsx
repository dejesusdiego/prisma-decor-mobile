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
  const [fornecedor, setFornecedor] = useState('');
  const [status, setStatus] = useState<ImportStatus>({
    materials: 'idle',
    confeccao: 'idle',
    instalacao: 'idle',
  });
  const [importing, setImporting] = useState(false);

  const handleImportMaterials = async (data: any[]) => {
    setStatus((prev) => ({ ...prev, materials: 'loading' }));
    
    try {
      const materiaisData = data.map((item) => ({
        codigo_item: item.codigoItem,
        nome: item.nome,
        categoria: item.categoria,
        unidade: item.unidade || 'M',
        largura_metro: item.larguraMetro || null,
        preco_custo: item.precoCusto,
        preco_tabela: item.precoCusto * 1.615,
        ativo: item.ativo !== false,
        fornecedor: fornecedor,
      }));

      const { data: inserted, error } = await supabase
        .from('materiais')
        .upsert(materiaisData, {
          onConflict: 'codigo_item',
          ignoreDuplicates: true,
        })
        .select();

      if (error) throw error;

      const numInseridos = inserted?.length || 0;
      const numIgnorados = data.length - numInseridos;

      setStatus((prev) => ({ ...prev, materials: 'success' }));
      toast({
        title: 'Materiais importados',
        description: `${numInseridos} novos adicionados, ${numIgnorados} já existiam (ignorados)`,
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
      const confeccaoData = data.map((item) => ({
        codigo_item: item.codigoItem,
        nome_modelo: item.nomeModelo,
        unidade: item.unidade || 'mt',
        preco_custo: item.precoCusto,
        preco_tabela: item.precoCusto * 1.55,
        ativo: item.ativo !== false,
      }));

      const { data: inserted, error } = await supabase
        .from('servicos_confeccao')
        .upsert(confeccaoData, {
          onConflict: 'codigo_item',
          ignoreDuplicates: true,
        })
        .select();

      if (error) throw error;

      const numInseridos = inserted?.length || 0;
      const numIgnorados = data.length - numInseridos;

      setStatus((prev) => ({ ...prev, confeccao: 'success' }));
      toast({
        title: 'Serviços de confecção importados',
        description: `${numInseridos} novos adicionados, ${numIgnorados} já existiam (ignorados)`,
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
      const instalacaoData = data.map((item) => ({
        codigo_item: item.codigoItem,
        nome: item.nome,
        preco_custo_por_ponto: item.precoCustoPorPonto,
        preco_tabela_por_ponto: item.precoCustoPorPonto * 1.615,
        ativo: item.ativo !== false,
      }));

      const { data: inserted, error } = await supabase
        .from('servicos_instalacao')
        .upsert(instalacaoData, {
          onConflict: 'codigo_item',
          ignoreDuplicates: true,
        })
        .select();

      if (error) throw error;

      const numInseridos = inserted?.length || 0;
      const numIgnorados = data.length - numInseridos;

      setStatus((prev) => ({ ...prev, instalacao: 'success' }));
      toast({
        title: 'Serviços de instalação importados',
        description: `${numInseridos} novos adicionados, ${numIgnorados} já existiam (ignorados)`,
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

    if (materialsFile && !fornecedor.trim()) {
      toast({
        title: 'Fornecedor obrigatório',
        description: 'Informe o fornecedor para importar materiais',
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
            <div className="space-y-3">
              <div>
                <Label htmlFor="fornecedor" className="text-sm font-medium">
                  Fornecedor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fornecedor"
                  placeholder="Ex: Têxtil ABC, Casa dos Tecidos..."
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  disabled={importing}
                  className="mt-1.5"
                />
              </div>
              <Input
                id="materials"
                type="file"
                accept=".json"
                onChange={(e) => setMaterialsFile(e.target.files?.[0] || null)}
                disabled={importing}
              />
            </div>
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
          <p>• <strong>Proteção de dados:</strong> Materiais existentes NÃO são alterados</p>
          <p>• <strong>Apenas novos itens:</strong> Se o código já existe, o material é ignorado</p>
          <p>• <strong>Rastreamento:</strong> Materiais novos são marcados com o fornecedor especificado</p>
          <p>• <strong>Ativação automática:</strong> Todos os novos itens ficam ativos</p>
          <p>• <strong>Preços preservados:</strong> Os valores do JSON são mantidos exatamente como estão</p>
        </CardContent>
      </Card>
    </div>
  );
}
