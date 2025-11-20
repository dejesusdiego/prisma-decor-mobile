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
      // Importar materials.json
      const materialsResponse = await fetch('/data/materials.json');
      const materialsData = await materialsResponse.json();
      
      console.log(`Importando ${materialsData.length} materiais...`);
      
      let countMateriais = 0;
      for (const item of materialsData) {
        const materialData = {
          codigo_item: item.codigoItem,
          nome: item.nome,
          categoria: item.categoria,
          unidade: item.unidade || 'M',
          largura_metro: item.larguraMetro || null,
          preco_custo: item.precoCusto,
          preco_tabela: item.precoCusto * 1.615,
          ativo: item.ativo !== false,
        };

        const { error } = await supabase
          .from('materiais')
          .upsert(materialData, { onConflict: 'codigo_item' });

        if (error) {
          console.error('Erro ao inserir material:', item.codigoItem, error);
        } else {
          countMateriais++;
        }
      }

      // Importar servicos_confeccao.json
      const confeccaoResponse = await fetch('/data/servicos_confeccao.json');
      const confeccaoData = await confeccaoResponse.json();
      
      console.log(`Importando ${confeccaoData.length} serviços de confecção...`);
      
      let countConfeccao = 0;
      for (const item of confeccaoData) {
        const confeccaoDataObj = {
          codigo_item: item.codigoItem,
          nome_modelo: item.nomeModelo,
          unidade: item.unidade || 'mt',
          preco_custo: item.precoCusto,
          preco_tabela: item.precoCusto * 1.55,
          ativo: item.ativo !== false,
        };

        const { error } = await supabase
          .from('servicos_confeccao')
          .upsert(confeccaoDataObj, { onConflict: 'codigo_item' });

        if (error) {
          console.error('Erro ao inserir serviço:', item.codigoItem, error);
        } else {
          countConfeccao++;
        }
      }

      // Importar servicos_instalacao.json
      const instalacaoResponse = await fetch('/data/servicos_instalacao.json');
      const instalacaoData = await instalacaoResponse.json();
      
      console.log(`Importando ${instalacaoData.length} serviços de instalação...`);
      
      let countInstalacao = 0;
      for (const item of instalacaoData) {
        const instalacaoDataObj = {
          codigo_item: item.codigoItem,
          nome: item.nome,
          preco_custo_por_ponto: item.precoCustoPorPonto,
          preco_tabela_por_ponto: item.precoCustoPorPonto * 1.615,
          ativo: item.ativo !== false,
        };

        const { error } = await supabase
          .from('servicos_instalacao')
          .upsert(instalacaoDataObj, { onConflict: 'codigo_item' });

        if (error) {
          console.error('Erro ao inserir instalação:', item.codigoItem, error);
        } else {
          countInstalacao++;
        }
      }

      toast({
        title: 'Importação concluída com sucesso!',
        description: `${countMateriais} materiais, ${countConfeccao} serviços de confecção e ${countInstalacao} serviços de instalação importados.`,
      });

      setTimeout(() => onVoltar(), 2000);
    } catch (error) {
      console.error('Erro durante importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar os dados. Verifique o console.',
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
