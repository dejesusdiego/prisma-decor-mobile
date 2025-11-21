import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
}

export function Dashboard({ onNovoOrcamento, onMeusOrcamentos }: DashboardProps) {
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    checkAndSeedDatabase();
  }, []);

  const checkAndSeedDatabase = async () => {
    try {
      // Verificar se já tem dados
      const { count } = await supabase
        .from('materiais')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      
      // Se tiver menos de 100 materiais, popular automaticamente
      if (!count || count < 100) {
        setSeeding(true);
        
        // Carregar arquivos JSON de seed
        const materialsRes = await fetch('/data/seed-materials.json');
        const confeccaoRes = await fetch('/data/seed-servicos-confeccao.json');
        const instalacaoRes = await fetch('/data/seed-servicos-instalacao.json');

        if (!materialsRes.ok || !confeccaoRes.ok || !instalacaoRes.ok) {
          throw new Error('Erro ao carregar arquivos de dados');
        }

        const materialsData = await materialsRes.json();
        const confeccaoData = await confeccaoRes.json();
        const instalacaoData = await instalacaoRes.json();

        console.log(`Iniciando importação: ${materialsData.length} materiais, ${confeccaoData.length} serviços`);

        // Importar Materiais em lotes de 50
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
          console.log(`Materiais: ${i + batch.length}/${materialsData.length}`);
        }

        // Importar Serviços de Confecção
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

        // Importar Serviços de Instalação
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

        console.log('Base de dados populada com sucesso!');
        setSeeding(false);
      }
    } catch (error) {
      console.error('Erro ao popular base de dados:', error);
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      {seeding && (
        <div className="flex flex-col items-center gap-4 p-8 bg-muted/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Carregando base de dados...</p>
          <p className="text-sm text-muted-foreground">Importando 2700+ materiais e serviços. Isso levará alguns minutos.</p>
        </div>
      )}

      {!seeding && (
        <>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Sistema de Orçamentos
            </h1>
            <p className="text-muted-foreground text-lg">
              Prisma Interiores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onNovoOrcamento}>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <Button size="lg" className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              Novo Orçamento
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onMeusOrcamentos}>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-secondary-foreground" />
            </div>
            <Button variant="secondary" size="lg" className="w-full">
              <FileText className="mr-2 h-5 w-5" />
              Meus Orçamentos
            </Button>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
