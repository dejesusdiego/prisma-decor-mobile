import { useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, Bug, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { Cortina, Material, ServicoConfeccao, ServicoInstalacao } from '@/types/orcamento';
import { calcularConsumoDetalhado, calcularCustosCortina } from '@/lib/calculosOrcamento';
import { useUserRole } from '@/hooks/useUserRole';

interface ValidacaoItem {
  campo: string;
  valorEsperado: number;
  valorAtual: number;
  diferencaPercent: number;
  status: 'ok' | 'alerta' | 'erro';
}

interface ValidacaoCortina {
  nome: string;
  quantidade: number;
  validacoes: ValidacaoItem[];
  temErros: boolean;
  temAlertas: boolean;
}

interface DebugCalculosProps {
  cortinas: Cortina[];
  materiais: Material[];
  servicoConfeccao?: ServicoConfeccao | null;
  servicoInstalacao?: ServicoInstalacao | null;
}

export function DebugCalculos({ 
  cortinas, 
  materiais, 
  servicoConfeccao, 
  servicoInstalacao 
}: DebugCalculosProps) {
  const { isAdmin } = useUserRole();

  const validacoes = useMemo(() => {
    if (!servicoConfeccao) return [];

    return cortinas.map((cortina): ValidacaoCortina => {
      const validacoesItem: ValidacaoItem[] = [];

      if (cortina.tipoProduto === 'cortina') {
        try {
          // Calcular valores esperados
          const custos = calcularCustosCortina(
            cortina,
            materiais,
            servicoConfeccao,
            servicoInstalacao
          );
          const consumo = calcularConsumoDetalhado(cortina, materiais);

          // Função para criar validação
          const criarValidacao = (
            campo: string,
            esperado: number,
            atual: number
          ): ValidacaoItem => {
            const tolerancia = 0.01; // 1% de tolerância
            const diferenca = esperado > 0 ? Math.abs(esperado - atual) / esperado : (atual > 0 ? 1 : 0);
            const diferencaPercent = diferenca * 100;
            
            let status: 'ok' | 'alerta' | 'erro';
            if (diferenca <= tolerancia) {
              status = 'ok';
            } else if (diferenca <= 0.05) {
              status = 'alerta';
            } else {
              status = 'erro';
            }

            return { campo, valorEsperado: esperado, valorAtual: atual, diferencaPercent, status };
          };

          // Validar custo do tecido
          if (cortina.tecidoId) {
            validacoesItem.push(criarValidacao('Custo Tecido', custos.custoTecido, cortina.custoTecido || 0));
          }

          // Validar custo do forro
          if (cortina.forroId) {
            validacoesItem.push(criarValidacao('Custo Forro', custos.custoForro, cortina.custoForro || 0));
          }

          // Validar custo do trilho
          if (cortina.trilhoId) {
            validacoesItem.push(criarValidacao('Custo Trilho', custos.custoTrilho, cortina.custoTrilho || 0));
          }

          // Validar custo da costura
          validacoesItem.push(criarValidacao('Custo Costura', custos.custoCostura, cortina.custoCostura || 0));

          // Validar custo da instalação
          if (cortina.precisaInstalacao) {
            validacoesItem.push(criarValidacao('Custo Instalação', custos.custoInstalacao, cortina.custoInstalacao || 0));
          }

          // Validar custo total
          validacoesItem.push(criarValidacao('Custo Total', custos.custoTotal, cortina.custoTotal || 0));

        } catch (error) {
          console.error('Erro ao validar cálculos:', error);
        }
      }

      return {
        nome: cortina.nomeIdentificacao,
        quantidade: cortina.quantidade,
        validacoes: validacoesItem,
        temErros: validacoesItem.some(v => v.status === 'erro'),
        temAlertas: validacoesItem.some(v => v.status === 'alerta'),
      };
    });
  }, [cortinas, materiais, servicoConfeccao, servicoInstalacao]);

  // Só mostrar para admins
  if (!isAdmin) return null;

  const totalErros = validacoes.filter(v => v.temErros).length;
  const totalAlertas = validacoes.filter(v => v.temAlertas && !v.temErros).length;
  const totalOk = validacoes.filter(v => !v.temErros && !v.temAlertas).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusIcon = (status: 'ok' | 'alerta' | 'erro') => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'alerta':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (validacao: ValidacaoCortina) => {
    if (validacao.temErros) {
      return <Badge variant="destructive" className="text-xs">Erro</Badge>;
    }
    if (validacao.temAlertas) {
      return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">Alerta</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-green-500 text-green-600">OK</Badge>;
  };

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between border-dashed bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <span className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              Validação de Cálculos (Admin)
            </span>
          </span>
          <div className="flex items-center gap-2">
            {totalErros > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalErros} erro(s)
              </Badge>
            )}
            {totalAlertas > 0 && (
              <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                {totalAlertas} alerta(s)
              </Badge>
            )}
            {totalOk > 0 && totalErros === 0 && totalAlertas === 0 && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                Todos OK
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 transition-transform" />
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3">
        {totalErros > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Foram encontradas {totalErros} divergência(s) nos cálculos. Verifique os itens marcados em vermelho.
            </AlertDescription>
          </Alert>
        )}

        {validacoes.map((validacao, idx) => (
          <div 
            key={idx} 
            className={`border rounded-lg p-3 ${
              validacao.temErros 
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20' 
                : validacao.temAlertas 
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20' 
                  : 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{validacao.nome}</span>
                {validacao.quantidade > 1 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">×{validacao.quantidade}</span>
                )}
              </div>
              {getStatusBadge(validacao)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {validacao.validacoes.map((v, vIdx) => (
                <div 
                  key={vIdx} 
                  className={`flex items-center gap-2 p-2 rounded ${
                    v.status === 'erro' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : v.status === 'alerta' 
                        ? 'bg-amber-100 dark:bg-amber-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                  }`}
                >
                  {getStatusIcon(v.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{v.campo}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs">
                        {formatCurrency(v.valorAtual)}
                      </span>
                      {v.status !== 'ok' && (
                        <span className="text-xs text-muted-foreground">
                          (esperado: {formatCurrency(v.valorEsperado)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          <p><strong>Legenda:</strong></p>
          <p>• <span className="text-green-600">OK</span>: Diferença ≤ 1%</p>
          <p>• <span className="text-amber-600">Alerta</span>: Diferença entre 1% e 5%</p>
          <p>• <span className="text-red-600">Erro</span>: Diferença &gt; 5%</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
