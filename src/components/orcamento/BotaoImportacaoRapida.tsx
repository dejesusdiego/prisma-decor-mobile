import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileJson } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export function BotaoImportacaoRapida({ onVoltar }: { onVoltar: () => void }) {
  const [importing, setImporting] = useState(false);

  const importarTodosArquivos = async () => {
    setImporting(true);
    try {
      // 1. Carregar arquivos JSON de seed
      const materialsRes = await fetch('/data/seed-materials.json');
      const confeccaoRes = await fetch('/data/seed-servicos-confeccao.json');
      const instalacaoRes = await fetch('/data/seed-servicos-instalacao.json');

      if (!materialsRes.ok || !confeccaoRes.ok || !instalacaoRes.ok) {
        throw new Error('Erro ao carregar arquivos de dados');
      }

      const materialsData = await materialsRes.json();
      const confeccaoData = await confeccaoRes.json();
      const instalacaoData = await instalacaoRes.json();

      toast({
        title: 'Iniciando importação',
        description: `${materialsData.length} materiais, ${confeccaoData.length} serviços de confecção, ${instalacaoData.length} serviços de instalação`,
      });

      let materiaisImportados = 0;
      let confeccaoImportados = 0;
      let instalacaoImportados = 0;

      // 2. Importar Materiais em lotes de 50
      const batchSize = 50;
      for (let i = 0; i < materialsData.length; i += batchSize) {
        const batch = materialsData.slice(i, i + batchSize);
        const materialToInsert = batch.map((item: any) => {
          const precoCusto = Number(item.precoCusto) / 100;
          const precoTabela = precoCusto * 1.615;
          
          return {
            codigo_item: item.codigoItem,
            nome: item.nome,
            categoria: item.categoria,
            unidade: item.unidade || 'M',
            largura_metro: item.larguraMetro || null,
            preco_custo: precoCusto,
            preco_tabela: precoTabela,
            margem_tabela_percent: 61.5,
            perda_percent: 10,
            ativo: item.ativo !== false,
          };
        });

        const { error } = await supabase
          .from('materiais')
          .upsert(materialToInsert, {
            onConflict: 'codigo_item',
            ignoreDuplicates: false,
          });

        if (error) throw error;
        materiaisImportados += batch.length;
        
        console.log(`Materiais: ${materiaisImportados}/${materialsData.length}`);
        
        if (materiaisImportados % 500 === 0 || materiaisImportados === materialsData.length) {
          toast({
            title: 'Importando materiais...',
            description: `${materiaisImportados}/${materialsData.length} materiais`,
          });
        }
      }

      // 3. Importar Serviços de Confecção
      const confeccaoToInsert = confeccaoData.map((item: any) => {
        const precoCusto = Number(item.precoCusto) / 100;
        const precoTabela = precoCusto * 1.55;
        
        return {
          codigo_item: item.codigoItem,
          nome_modelo: item.nomeModelo,
          unidade: item.unidade || 'mt',
          preco_custo: precoCusto,
          preco_tabela: precoTabela,
          margem_tabela_percent: 55,
          ativo: item.ativo !== false,
        };
      });

      const { error: confeccaoError } = await supabase
        .from('servicos_confeccao')
        .upsert(confeccaoToInsert, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false,
        });

      if (confeccaoError) throw confeccaoError;
      confeccaoImportados = confeccaoData.length;

      // 4. Importar Serviços de Instalação
      const instalacaoToInsert = instalacaoData.map((item: any) => {
        const precoCustoPorPonto = Number(item.precoCustoPorPonto);
        const precoTabelaPorPonto = precoCustoPorPonto * 1.615;
        
        return {
          codigo_item: item.codigoItem,
          nome: item.nome,
          preco_custo_por_ponto: precoCustoPorPonto,
          preco_tabela_por_ponto: precoTabelaPorPonto,
          margem_tabela_percent: 61.5,
          ativo: item.ativo !== false,
        };
      });

      const { error: instalacaoError } = await supabase
        .from('servicos_instalacao')
        .upsert(instalacaoToInsert, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false,
        });

      if (instalacaoError) throw instalacaoError;
      instalacaoImportados = instalacaoData.length;

      toast({
        title: 'Importação Concluída!',
        description: `✓ ${materiaisImportados} materiais\n✓ ${confeccaoImportados} serviços de confecção\n✓ ${instalacaoImportados} serviços de instalação`,
        duration: 5000,
      });

      setTimeout(() => {
        onVoltar();
      }, 2000);
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Importar Base de Dados da Prisma</h2>
          <p className="text-muted-foreground mt-2">
            Importe todos os materiais e serviços da Prisma Interiores com um clique
          </p>
        </div>
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Importação Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">O que será importado:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• <strong>Materials.json</strong>: ~2.700 tecidos, forros, trilhos, acessórios e papéis</li>
              <li>• <strong>Servicos_confeccao.json</strong>: ~233 modelos de costura e confecção</li>
              <li>• <strong>Servicos_instalacao.json</strong>: 1 serviço de instalação</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100">⚠️ Atenção</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Este processo pode levar alguns minutos. Os dados serão inseridos ou atualizados no banco de dados.
              Se um item já existir (mesmo código), ele será atualizado com os novos valores.
            </p>
          </div>

          <Button
            onClick={importarTodosArquivos}
            disabled={importing}
            size="lg"
            className="w-full"
          >
            {importing ? (
              <>
                <Download className="mr-2 h-5 w-5 animate-bounce" />
                Importando... Aguarde
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Importar Todos os Dados Agora
              </>
            )}
          </Button>

          {importing && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Importando dados... Não feche esta página.</p>
              <p className="mt-1">Acompanhe o progresso no console do navegador.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Os arquivos JSON estão incluídos no projeto e serão carregados automaticamente</p>
          <p>• Cada item é identificado pelo seu código único (codigoItem)</p>
          <p>• Se o item já existe, seus dados serão atualizados</p>
          <p>• Se o item não existe, será criado um novo registro</p>
          <p>• Os preços de custo são mantidos exatamente como nos arquivos originais</p>
          <p>• Os preços de tabela são calculados automaticamente com margem padrão</p>
        </CardContent>
      </Card>
    </div>
  );
}
