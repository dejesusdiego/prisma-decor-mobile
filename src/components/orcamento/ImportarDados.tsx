import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, XCircle, Loader2, AlertCircle, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { parseCSVMateriais, ResultadoParse } from '@/lib/parserCSVMateriais';
import { DialogPreviewImportacao } from './dialogs/DialogPreviewImportacao';

interface ImportarDadosProps {
  onVoltar: () => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

interface CategoryConfig {
  label: string;
  file: File | null;
  status: ImportStatus;
  error?: string;
  categoriaDB: string;
  modeloArquivo: string;
}

interface ServiceConfig {
  label: string;
  file: File | null;
  status: ImportStatus;
  error?: string;
  tipo: 'confeccao' | 'instalacao';
  modeloArquivo: string;
}

const CATEGORIAS: Record<string, CategoryConfig> = {
  tecidos: { label: 'Tecidos e Forros', file: null, status: 'idle', categoriaDB: 'tecido', modeloArquivo: 'modelo-tecidos.csv' },
  trilhos: { label: 'Trilhos', file: null, status: 'idle', categoriaDB: 'trilho', modeloArquivo: 'modelo-trilhos.csv' },
  acessorios: { label: 'Acessórios', file: null, status: 'idle', categoriaDB: 'acessorio', modeloArquivo: 'modelo-acessorios.csv' },
  motorizados: { label: 'Motorizados', file: null, status: 'idle', categoriaDB: 'motorizado', modeloArquivo: 'modelo-motorizados.csv' },
  persianas: { label: 'Persianas', file: null, status: 'idle', categoriaDB: 'persiana', modeloArquivo: 'modelo-persianas.csv' },
  papeis: { label: 'Papéis de Parede', file: null, status: 'idle', categoriaDB: 'papel', modeloArquivo: 'modelo-papeis.csv' },
};

const SERVICOS: Record<string, ServiceConfig> = {
  confeccao: { label: 'Serviços de Confecção', file: null, status: 'idle', tipo: 'confeccao', modeloArquivo: 'modelo-servicos-confeccao.csv' },
  instalacao: { label: 'Serviços de Instalação', file: null, status: 'idle', tipo: 'instalacao', modeloArquivo: 'modelo-servicos-instalacao.csv' },
};

export function ImportarDados({ onVoltar }: ImportarDadosProps) {
  const [fornecedor, setFornecedor] = useState('');
  const [categories, setCategories] = useState<Record<string, CategoryConfig>>(CATEGORIAS);
  const [services, setServices] = useState<Record<string, ServiceConfig>>(SERVICOS);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // Preview dialog state
  const [previewAberto, setPreviewAberto] = useState(false);
  const [previewResultado, setPreviewResultado] = useState<ResultadoParse | null>(null);
  const [previewNomeArquivo, setPreviewNomeArquivo] = useState('');
  const [previewTipo, setPreviewTipo] = useState<'material' | 'confeccao' | 'instalacao'>('material');
  const [previewCategoria, setPreviewCategoria] = useState('');
  const [previewServicoKey, setPreviewServicoKey] = useState('');

  const handleFileChange = async (categoria: string, file: File | null) => {
    if (!file) {
      setCategories(prev => ({
        ...prev,
        [categoria]: { ...prev[categoria], file: null, status: 'idle', error: undefined }
      }));
      return;
    }

    // Valida tipo de arquivo
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isJSON = file.name.toLowerCase().endsWith('.json');
    
    if (!isCSV && !isJSON) {
      toast({
        title: 'Formato inválido',
        description: 'Selecione um arquivo CSV ou JSON',
        variant: 'destructive',
      });
      return;
    }

    setCategories(prev => ({
      ...prev,
      [categoria]: { ...prev[categoria], file, status: 'idle', error: undefined }
    }));

    // Se for CSV, mostra preview
    if (isCSV) {
      try {
        const conteudo = await file.text();
        const config = categories[categoria];
        const resultado = parseCSVMateriais(conteudo, 'material', config.categoriaDB);
        
        setPreviewResultado(resultado);
        setPreviewNomeArquivo(file.name);
        setPreviewTipo('material');
        setPreviewCategoria(categoria);
        setPreviewServicoKey('');
        setPreviewAberto(true);
      } catch (error) {
        console.error('Erro ao fazer parse do CSV:', error);
        toast({
          title: 'Erro ao ler arquivo',
          description: 'Não foi possível processar o arquivo CSV',
          variant: 'destructive',
        });
      }
    }
  };

  const handleServiceFileChange = async (servico: string, file: File | null) => {
    if (!file) {
      setServices(prev => ({
        ...prev,
        [servico]: { ...prev[servico], file: null, status: 'idle', error: undefined }
      }));
      return;
    }

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isJSON = file.name.toLowerCase().endsWith('.json');
    
    if (!isCSV && !isJSON) {
      toast({
        title: 'Formato inválido',
        description: 'Selecione um arquivo CSV ou JSON',
        variant: 'destructive',
      });
      return;
    }

    setServices(prev => ({
      ...prev,
      [servico]: { ...prev[servico], file, status: 'idle', error: undefined }
    }));

    if (isCSV) {
      try {
        const conteudo = await file.text();
        const config = services[servico];
        const resultado = parseCSVMateriais(conteudo, config.tipo);
        
        setPreviewResultado(resultado);
        setPreviewNomeArquivo(file.name);
        setPreviewTipo(config.tipo);
        setPreviewCategoria('');
        setPreviewServicoKey(servico);
        setPreviewAberto(true);
      } catch (error) {
        console.error('Erro ao fazer parse do CSV:', error);
        toast({
          title: 'Erro ao ler arquivo',
          description: 'Não foi possível processar o arquivo CSV',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusIcon = (status: ImportStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleClearDatabase = async () => {
    setClearing(true);
    try {
      const { error } = await supabase.rpc('truncate_materials_and_services');
      
      if (error) throw error;
      
      toast({
        title: 'Base de dados limpa',
        description: 'Todos os materiais e serviços foram removidos',
      });
    } catch (error) {
      console.error('Erro ao limpar base:', error);
      toast({
        title: 'Erro ao limpar base',
        description: 'Não foi possível limpar a base de dados',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  const handlePreviewConfirmar = async (pularErros: boolean) => {
    if (!previewResultado) return;

    setImporting(true);

    try {
      const registrosParaImportar = pularErros 
        ? previewResultado.registros.filter(r => r.valido)
        : previewResultado.registros;

      if (previewTipo === 'material' && previewCategoria) {
        // Importar materiais
        const config = categories[previewCategoria];
        
        const materiaisParaInserir = registrosParaImportar.map(reg => ({
          codigo_item: String(reg.dados.codigo_item || ''),
          nome: String(reg.dados.nome || ''),
          categoria: String(reg.dados.categoria || config.categoriaDB),
          unidade: String(reg.dados.unidade || 'M'),
          largura_metro: reg.dados.largura_metro as number | null,
          preco_custo: reg.dados.preco_custo as number,
          preco_tabela: (reg.dados.preco_custo as number) * 1.615,
          margem_tabela_percent: 61.5,
          ativo: reg.dados.ativo !== false,
          fornecedor: fornecedor.trim() || null,
          linha: reg.dados.linha as string | null,
          cor: reg.dados.cor as string | null,
          tipo: reg.dados.tipo as string | null,
          aplicacao: reg.dados.aplicacao as string | null,
          potencia: reg.dados.potencia as string | null,
          area_min_fat: reg.dados.area_min_fat as number | null,
        }));

        const { data, error } = await supabase
          .from('materiais')
          .upsert(materiaisParaInserir, {
            onConflict: 'codigo_item',
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;

        setCategories(prev => ({
          ...prev,
          [previewCategoria]: { ...prev[previewCategoria], status: 'success', file: null }
        }));

        toast({
          title: 'Importação concluída',
          description: `${data?.length || 0} materiais importados/atualizados com sucesso`,
        });

      } else if (previewTipo === 'confeccao' && previewServicoKey) {
        // Importar serviços de confecção
        const servicosParaInserir = registrosParaImportar.map(reg => ({
          codigo_item: String(reg.dados.codigo_item || ''),
          nome_modelo: String(reg.dados.nome_modelo || ''),
          unidade: String(reg.dados.unidade || 'M'),
          preco_custo: reg.dados.preco_custo as number,
          preco_tabela: (reg.dados.preco_custo as number) * 1.55,
          margem_tabela_percent: 55,
          ativo: reg.dados.ativo !== false,
        }));

        const { data, error } = await supabase
          .from('servicos_confeccao')
          .upsert(servicosParaInserir, {
            onConflict: 'codigo_item',
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;

        setServices(prev => ({
          ...prev,
          [previewServicoKey]: { ...prev[previewServicoKey], status: 'success', file: null }
        }));

        toast({
          title: 'Importação concluída',
          description: `${data?.length || 0} serviços de confecção importados/atualizados`,
        });

      } else if (previewTipo === 'instalacao' && previewServicoKey) {
        // Importar serviços de instalação
        const servicosParaInserir = registrosParaImportar.map(reg => ({
          codigo_item: String(reg.dados.codigo_item || ''),
          nome: String(reg.dados.nome || ''),
          preco_custo_por_ponto: reg.dados.preco_custo_por_ponto as number,
          preco_tabela_por_ponto: (reg.dados.preco_custo_por_ponto as number) * 1.615,
          margem_tabela_percent: 61.5,
          ativo: reg.dados.ativo !== false,
        }));

        const { data, error } = await supabase
          .from('servicos_instalacao')
          .upsert(servicosParaInserir, {
            onConflict: 'codigo_item',
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;

        setServices(prev => ({
          ...prev,
          [previewServicoKey]: { ...prev[previewServicoKey], status: 'success', file: null }
        }));

        toast({
          title: 'Importação concluída',
          description: `${data?.length || 0} serviços de instalação importados/atualizados`,
        });
      }

      setPreviewAberto(false);
      setPreviewResultado(null);

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

  // Handler para importação JSON legacy
  const handleImportJSON = async (categoria: string) => {
    const config = categories[categoria];
    if (!config.file) return;

    if (!fornecedor.trim()) {
      toast({
        title: 'Fornecedor obrigatório',
        description: 'Por favor, informe o fornecedor antes de importar',
        variant: 'destructive',
      });
      return;
    }

    setCategories(prev => ({
      ...prev,
      [categoria]: { ...prev[categoria], status: 'loading' }
    }));

    try {
      const fileContent = await config.file.text();
      const materiais = JSON.parse(fileContent);

      if (!Array.isArray(materiais)) {
        throw new Error('O arquivo deve conter um array de materiais');
      }

      const materiaisParaInserir = materiais.map((mat: Record<string, unknown>) => ({
        codigo_item: mat.codigoItem as string,
        nome: mat.nome as string,
        categoria: mat.categoria as string || config.categoriaDB,
        unidade: (mat.unidade as string) || 'M',
        largura_metro: (mat.larguraMetro as number) || null,
        preco_custo: mat.precoCusto as number,
        preco_tabela: (mat.precoCusto as number) * 1.615,
        margem_tabela_percent: 61.5,
        ativo: mat.ativo !== false,
        fornecedor: fornecedor.trim(),
        linha: (mat.linha as string) || null,
        cor: (mat.cor as string) || null,
        tipo: (mat.tipo as string) || null,
        aplicacao: (mat.aplicacao as string) || null,
        potencia: (mat.potencia as string) || null,
        area_min_fat: (mat.areaMinFat as number) || null,
      }));

      const { data, error } = await supabase
        .from('materiais')
        .upsert(materiaisParaInserir, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      setCategories(prev => ({
        ...prev,
        [categoria]: { ...prev[categoria], status: 'success', file: null }
      }));

      toast({
        title: `${config.label} importados`,
        description: `${data?.length || 0} materiais importados/atualizados`,
      });
    } catch (error) {
      console.error(`Erro ao importar ${config.label}:`, error);
      
      setCategories(prev => ({
        ...prev,
        [categoria]: { 
          ...prev[categoria], 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        }
      }));

      toast({
        title: `Erro ao importar ${config.label}`,
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleImportServiceJSON = async (servicoKey: string) => {
    const config = services[servicoKey];
    if (!config.file) return;

    setServices(prev => ({
      ...prev,
      [servicoKey]: { ...prev[servicoKey], status: 'loading' }
    }));

    try {
      const fileContent = await config.file.text();
      const servicos = JSON.parse(fileContent);

      if (!Array.isArray(servicos)) {
        throw new Error('O arquivo deve conter um array de serviços');
      }

      if (config.tipo === 'confeccao') {
        const servicosParaInserir = servicos.map((serv: Record<string, unknown>) => ({
          codigo_item: serv.codigoItem as string,
          nome_modelo: serv.nomeModelo as string,
          unidade: (serv.unidade as string) || 'M',
          preco_custo: serv.precoCusto as number,
          preco_tabela: (serv.precoCusto as number) * 1.55,
          margem_tabela_percent: 55,
          ativo: serv.ativo !== false,
        }));

        const { data, error } = await supabase
          .from('servicos_confeccao')
          .upsert(servicosParaInserir, {
            onConflict: 'codigo_item',
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;

        toast({
          title: 'Serviços de Confecção importados',
          description: `${data?.length || 0} serviços importados/atualizados`,
        });
      } else {
        const servicosParaInserir = servicos.map((serv: Record<string, unknown>) => ({
          codigo_item: serv.codigoItem as string,
          nome: serv.nome as string,
          preco_custo_por_ponto: serv.precoCustoPorPonto as number,
          preco_tabela_por_ponto: (serv.precoCustoPorPonto as number) * 1.615,
          margem_tabela_percent: 61.5,
          ativo: serv.ativo !== false,
        }));

        const { data, error } = await supabase
          .from('servicos_instalacao')
          .upsert(servicosParaInserir, {
            onConflict: 'codigo_item',
            ignoreDuplicates: false
          })
          .select();

        if (error) throw error;

        toast({
          title: 'Serviços de Instalação importados',
          description: `${data?.length || 0} serviços importados/atualizados`,
        });
      }

      setServices(prev => ({
        ...prev,
        [servicoKey]: { ...prev[servicoKey], status: 'success', file: null }
      }));
    } catch (error) {
      console.error(`Erro ao importar ${config.label}:`, error);
      
      setServices(prev => ({
        ...prev,
        [servicoKey]: { 
          ...prev[servicoKey], 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        }
      }));

      toast({
        title: `Erro ao importar ${config.label}`,
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Importar Dados por Categoria</h2>
          <p className="text-muted-foreground mt-2">
            Importe materiais e serviços via CSV ou JSON
          </p>
        </div>
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
      </div>

      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          <strong>Novidade:</strong> Agora você pode importar via <strong>CSV</strong>! Baixe o modelo, 
          edite no Excel e importe. Arquivos JSON continuam sendo suportados.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>
            Informe o fornecedor antes de selecionar os arquivos de materiais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fornecedor">
              Fornecedor <span className="text-muted-foreground">(opcional para CSV)</span>
            </Label>
            <Input
              id="fornecedor"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Ex: Têxtil ABC, Persianas XYZ"
              className="mt-1"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={clearing}>
                {clearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Base de Dados
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover TODOS os materiais e serviços da base de dados.
                  Esta operação não pode ser desfeita. Tem certeza?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearDatabase}>
                  Confirmar Limpeza
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Tabs defaultValue="tecidos" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tecidos">Tecidos</TabsTrigger>
          <TabsTrigger value="trilhos">Trilhos</TabsTrigger>
          <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
          <TabsTrigger value="motorizados">Motorizados</TabsTrigger>
          <TabsTrigger value="persianas">Persianas</TabsTrigger>
          <TabsTrigger value="papeis">Papéis</TabsTrigger>
        </TabsList>

        {Object.entries(categories).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{config.label}</CardTitle>
                    <CardDescription>
                      Importe via CSV (recomendado) ou JSON
                    </CardDescription>
                  </div>
                  {getStatusIcon(config.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`/modelos-importacao/${config.modeloArquivo}`} download>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Modelo CSV
                    </a>
                  </Button>
                </div>

                <div>
                  <Label htmlFor={`file-${key}`}>Selecionar Arquivo (CSV ou JSON)</Label>
                  <Input
                    id={`file-${key}`}
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {config.file && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-muted-foreground">
                        Arquivo: {config.file.name}
                      </p>
                      {config.file.name.endsWith('.json') && (
                        <Button 
                          size="sm" 
                          onClick={() => handleImportJSON(key)}
                          disabled={importing || !fornecedor.trim()}
                        >
                          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importar JSON'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {config.status === 'error' && config.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{config.error}</AlertDescription>
                  </Alert>
                )}

                {config.status === 'success' && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Importação concluída com sucesso!</AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-1 border-t pt-4">
                  <p><strong>Campos obrigatórios:</strong> codigo_item, nome, categoria, preco_custo</p>
                  <p><strong>Campos opcionais:</strong> unidade, largura_metro, linha, cor, tipo, ativo</p>
                  {key === 'motorizados' && (
                    <p><strong>Campos específicos:</strong> potencia</p>
                  )}
                  {key === 'persianas' && (
                    <p><strong>Campos específicos:</strong> area_min_fat (área mínima de faturamento)</p>
                  )}
                  {key === 'acessorios' && (
                    <p><strong>Campos específicos:</strong> aplicacao</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
          <CardDescription>
            Importe serviços de confecção e instalação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(services).map(([key, config]) => (
            <div key={key} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{config.label}</h4>
                  <p className="text-sm text-muted-foreground">
                    {config.tipo === 'confeccao' 
                      ? 'Campos: codigo_item, nome_modelo, unidade, preco_custo'
                      : 'Campos: codigo_item, nome, preco_custo_por_ponto'}
                  </p>
                </div>
                {getStatusIcon(config.status)}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={`/modelos-importacao/${config.modeloArquivo}`} download>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Modelo CSV
                  </a>
                </Button>
              </div>

              <div>
                <Input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => handleServiceFileChange(key, e.target.files?.[0] || null)}
                />
                {config.file && (
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-muted-foreground">
                      Arquivo: {config.file.name}
                    </p>
                    {config.file.name.endsWith('.json') && (
                      <Button 
                        size="sm" 
                        onClick={() => handleImportServiceJSON(key)}
                        disabled={importing}
                      >
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importar JSON'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {config.status === 'error' && config.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{config.error}</AlertDescription>
                </Alert>
              )}

              {config.status === 'success' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Importação concluída com sucesso!</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Importação via CSV (Recomendado)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Clique em "Baixar Modelo CSV" para obter o template</li>
                <li>Abra no Excel e preencha seus dados</li>
                <li>Salve como CSV (separador ponto-e-vírgula)</li>
                <li>Selecione o arquivo e veja o preview</li>
                <li>Confirme a importação</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">📋 Importação via JSON (Legado)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Prepare o arquivo JSON no formato esperado</li>
                <li>Informe o fornecedor (obrigatório)</li>
                <li>Selecione o arquivo</li>
                <li>Clique em "Importar JSON"</li>
              </ol>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O sistema faz <strong>upsert</strong> por código do item: se o código já existir, 
              os dados serão atualizados. Caso contrário, um novo registro será criado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <DialogPreviewImportacao
        aberto={previewAberto}
        onClose={() => {
          setPreviewAberto(false);
          setPreviewResultado(null);
        }}
        onConfirmar={handlePreviewConfirmar}
        resultado={previewResultado}
        nomeArquivo={previewNomeArquivo}
        tipo={previewTipo}
        importando={importing}
      />
    </div>
  );
}
