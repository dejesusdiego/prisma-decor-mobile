import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, XCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ImportarDadosProps {
  onVoltar: () => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

interface CategoryConfig {
  label: string;
  file: File | null;
  status: ImportStatus;
  error?: string;
  dividirPrecoPor100: boolean;
}

interface ServiceConfig {
  label: string;
  file: File | null;
  status: ImportStatus;
  error?: string;
}

const CATEGORIAS: Record<string, CategoryConfig> = {
  tecidos: { label: 'Tecidos e Forros', file: null, status: 'idle', dividirPrecoPor100: false },
  trilhos: { label: 'Trilhos', file: null, status: 'idle', dividirPrecoPor100: false },
  acessorios: { label: 'Acessórios', file: null, status: 'idle', dividirPrecoPor100: false },
  motorizados: { label: 'Motorizados', file: null, status: 'idle', dividirPrecoPor100: false },
  persianas: { label: 'Persianas', file: null, status: 'idle', dividirPrecoPor100: false },
  papeis: { label: 'Papéis de Parede', file: null, status: 'idle', dividirPrecoPor100: false },
};

const SERVICOS: Record<string, ServiceConfig> = {
  confeccao: { label: 'Serviços de Confecção', file: null, status: 'idle' },
  instalacao: { label: 'Serviços de Instalação', file: null, status: 'idle' },
};

export function ImportarDados({ onVoltar }: ImportarDadosProps) {
  const [fornecedor, setFornecedor] = useState('');
  const [categories, setCategories] = useState<Record<string, CategoryConfig>>(CATEGORIAS);
  const [services, setServices] = useState<Record<string, ServiceConfig>>(SERVICOS);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleFileChange = (categoria: string, file: File | null) => {
    setCategories(prev => ({
      ...prev,
      [categoria]: { ...prev[categoria], file, status: 'idle', error: undefined }
    }));
  };

  const handleServiceFileChange = (servico: string, file: File | null) => {
    setServices(prev => ({
      ...prev,
      [servico]: { ...prev[servico], file, status: 'idle', error: undefined }
    }));
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

  const handleImport = async () => {
    if (!fornecedor.trim()) {
      toast({
        title: 'Fornecedor obrigatório',
        description: 'Por favor, informe o fornecedor antes de importar',
        variant: 'destructive',
      });
      return;
    }

    const filesToImport = Object.entries(categories).filter(([_, config]) => config.file !== null);
    
    if (filesToImport.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione pelo menos um arquivo para importar',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    for (const [categoria, config] of filesToImport) {
      if (!config.file) continue;

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

        // Preparar dados para upsert
        const materiaisParaInserir = materiais.map((mat: any) => {
          const precoCusto = config.dividirPrecoPor100 ? mat.precoCusto / 100 : mat.precoCusto;
          
          // Para motorizados, o campo "largura" vem como string (ex: "1M", "2M")
          // Para outros materiais, usar larguraMetro se existir
          const larguraMetro = mat.larguraMetro || null;
          
          return {
            codigo_item: mat.codigoItem,
            nome: mat.nome,
            categoria: mat.categoria,
            unidade: mat.unidade || 'M',
            largura_metro: larguraMetro,
            preco_custo: precoCusto,
            preco_tabela: precoCusto * 1.615, // margem padrão 61.5%
            margem_tabela_percent: 61.5,
            ativo: mat.ativo !== false,
            fornecedor: fornecedor.trim(),
            // Campos específicos
            linha: mat.linha || null,
            cor: mat.cor || null,
            tipo: mat.tipo || null,
            aplicacao: mat.aplicacao || null,
            potencia: mat.potencia || null,
            area_min_fat: mat.areaMinFat || null,
          };
        });

        const { data, error } = await supabase
          .from('materiais')
          .upsert(materiaisParaInserir, {
            onConflict: 'codigo_item',
            ignoreDuplicates: true
          })
          .select();

        if (error) throw error;

        const novosAdicionados = data?.length || 0;
        const jaExistiam = materiais.length - novosAdicionados;

        setCategories(prev => ({
          ...prev,
          [categoria]: { ...prev[categoria], status: 'success' }
        }));

        toast({
          title: `${config.label} importados`,
          description: `${novosAdicionados} novos adicionados, ${jaExistiam} já existiam`,
        });
      } catch (error) {
        console.error(`Erro ao importar ${config.label}:`, error);
        
        let errorMsg = 'Erro desconhecido';
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMsg = JSON.stringify(error);
        }
        
        setCategories(prev => ({
          ...prev,
          [categoria]: { ...prev[categoria], status: 'error', error: errorMsg }
        }));

        toast({
          title: `Erro ao importar ${config.label}`,
          description: errorMsg,
          variant: 'destructive',
        });
      }
    }

    setImporting(false);
  };

  const handleImportServices = async () => {
    const filesToImport = Object.entries(services).filter(([_, config]) => config.file !== null);
    
    if (filesToImport.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione pelo menos um arquivo de serviço para importar',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    for (const [tipo, config] of filesToImport) {
      if (!config.file) continue;

      setServices(prev => ({
        ...prev,
        [tipo]: { ...prev[tipo], status: 'loading' }
      }));

      try {
        const fileContent = await config.file.text();
        const servicos = JSON.parse(fileContent);

        if (!Array.isArray(servicos)) {
          throw new Error('O arquivo deve conter um array de serviços');
        }

        if (tipo === 'confeccao') {
          // Importar serviços de confecção
          const servicosParaInserir = servicos.map((serv: any) => ({
            codigo_item: serv.codigoItem,
            nome_modelo: serv.nomeModelo,
            unidade: serv.unidade || 'mt',
            preco_custo: serv.precoCusto,
            preco_tabela: serv.precoCusto * 1.55, // margem padrão 55%
            margem_tabela_percent: 55,
            ativo: serv.ativo !== false,
          }));

          const { data, error } = await supabase
            .from('servicos_confeccao')
            .upsert(servicosParaInserir, {
              onConflict: 'codigo_item',
              ignoreDuplicates: true
            })
            .select();

          if (error) throw error;

          const novosAdicionados = data?.length || 0;
          const jaExistiam = servicos.length - novosAdicionados;

          toast({
            title: 'Serviços de Confecção importados',
            description: `${novosAdicionados} novos adicionados, ${jaExistiam} já existiam`,
          });
        } else if (tipo === 'instalacao') {
          // Importar serviços de instalação
          const servicosParaInserir = servicos.map((serv: any) => ({
            codigo_item: serv.codigoItem,
            nome: serv.nome,
            preco_custo_por_ponto: serv.precoCustoPorPonto,
            preco_tabela_por_ponto: serv.precoCustoPorPonto * 1.615, // margem padrão 61.5%
            margem_tabela_percent: 61.5,
            ativo: serv.ativo !== false,
          }));

          const { data, error } = await supabase
            .from('servicos_instalacao')
            .upsert(servicosParaInserir, {
              onConflict: 'codigo_item',
              ignoreDuplicates: true
            })
            .select();

          if (error) throw error;

          const novosAdicionados = data?.length || 0;
          const jaExistiam = servicos.length - novosAdicionados;

          toast({
            title: 'Serviços de Instalação importados',
            description: `${novosAdicionados} novos adicionados, ${jaExistiam} já existiam`,
          });
        }

        setServices(prev => ({
          ...prev,
          [tipo]: { ...prev[tipo], status: 'success' }
        }));
      } catch (error) {
        console.error(`Erro ao importar ${config.label}:`, error);
        
        let errorMsg = 'Erro desconhecido';
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMsg = JSON.stringify(error);
        }
        
        setServices(prev => ({
          ...prev,
          [tipo]: { ...prev[tipo], status: 'error', error: errorMsg }
        }));

        toast({
          title: `Erro ao importar ${config.label}`,
          description: errorMsg,
          variant: 'destructive',
        });
      }
    }

    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Importar Dados por Categoria</h2>
          <p className="text-muted-foreground mt-2">
            Importe materiais organizados por categoria com seus campos específicos
          </p>
        </div>
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Cada categoria possui campos específicos. Os materiais serão
          adicionados à base mantendo os existentes (upsert por código do item). Use "Limpar Base"
          para começar do zero.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>
            Informe o fornecedor antes de selecionar os arquivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fornecedor">
              Fornecedor <span className="text-destructive">*</span>
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
                      Arquivo JSON com {config.dividirPrecoPor100 ? 'preços em centavos' : 'preços em reais'}
                    </CardDescription>
                  </div>
                  {getStatusIcon(config.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`file-${key}`}>Selecionar Arquivo JSON</Label>
                  <Input
                    id={`file-${key}`}
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {config.file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Arquivo: {config.file.name}
                    </p>
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

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Campos obrigatórios:</strong> codigoItem, nome, categoria, precoCusto</p>
                  <p><strong>Campos opcionais:</strong> unidade, larguraMetro, ativo</p>
                  {key === 'tecidos' && (
                    <p><strong>Campos específicos:</strong> linha, cor, tipo</p>
                  )}
                  {key === 'trilhos' && (
                    <p><strong>Campos específicos:</strong> tipo, linha, cor</p>
                  )}
                  {key === 'acessorios' && (
                    <p><strong>Campos específicos:</strong> tipo, linha, aplicacao</p>
                  )}
                  {key === 'motorizados' && (
                    <p><strong>Campos específicos:</strong> tipo, linha, largura, potencia</p>
                  )}
                  {key === 'persianas' && (
                    <p><strong>Campos específicos:</strong> tipo, areaMinFat</p>
                  )}
                  {key === 'papeis' && (
                    <p><strong>Campos específicos:</strong> tipo, linha, cor</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleImport}
            disabled={importing || !fornecedor.trim()}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Selecionados
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-2xl font-bold mb-4">Importar Serviços</h3>
        <p className="text-muted-foreground mb-6">
          Importe serviços de confecção e instalação (não requer fornecedor)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {Object.entries(services).map(([key, config]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{config.label}</CardTitle>
                    <CardDescription>
                      Arquivo JSON com serviços
                    </CardDescription>
                  </div>
                  {getStatusIcon(config.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`service-file-${key}`}>Selecionar Arquivo JSON</Label>
                  <Input
                    id={`service-file-${key}`}
                    type="file"
                    accept=".json"
                    onChange={(e) => handleServiceFileChange(key, e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {config.file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Arquivo: {config.file.name}
                    </p>
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

                <div className="text-sm text-muted-foreground space-y-1">
                  {key === 'confeccao' && (
                    <>
                      <p><strong>Campos obrigatórios:</strong> codigoItem, nomeModelo, precoCusto</p>
                      <p><strong>Campos opcionais:</strong> unidade, ativo</p>
                    </>
                  )}
                  {key === 'instalacao' && (
                    <>
                      <p><strong>Campos obrigatórios:</strong> codigoItem, nome, precoCustoPorPonto</p>
                      <p><strong>Campos opcionais:</strong> ativo</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleImportServices}
              disabled={importing}
              className="w-full"
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando Serviços...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Serviços Selecionados
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong>1. Organização por Categoria:</strong>
            <p>Cada categoria possui campos específicos próprios além dos campos base.</p>
          </div>
          <div>
            <strong>2. Formato de Preços:</strong>
            <p>Todas as categorias: preços em <strong>reais</strong> (não serão convertidos/divididos por 100)</p>
          </div>
          <div>
            <strong>3. Atualização Não-Destrutiva:</strong>
            <p>Materiais com mesmo código são mantidos. Apenas novos são adicionados.</p>
          </div>
          <div>
            <strong>4. Fornecedor Obrigatório:</strong>
            <p>Permite rastrear a origem de cada lote de materiais importados.</p>
          </div>
          <div>
            <strong>5. Importação de Serviços:</strong>
            <p>Serviços de confecção e instalação não requerem fornecedor e podem ser importados separadamente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
