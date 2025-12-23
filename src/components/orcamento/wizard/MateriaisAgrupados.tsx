import { useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Layers, Package, Ruler, Scissors } from 'lucide-react';
import type { Cortina, Material } from '@/types/orcamento';
import { calcularConsumoDetalhado } from '@/lib/calculosOrcamento';

interface MaterialAgrupado {
  codigoItem: string;
  nome: string;
  categoria: 'tecido' | 'forro' | 'trilho';
  totalMetros: number;
  custoUnitario: number;
  custoTotal: number;
  itensOrigem: { nome: string; metros: number; quantidade: number }[];
}

interface MateriaisAgrupadosProps {
  cortinas: Cortina[];
  materiais: Material[];
}

export function agruparMateriaisPorCodigo(
  cortinas: Cortina[],
  materiais: Material[]
): MaterialAgrupado[] {
  const agrupamento: Record<string, MaterialAgrupado> = {};

  for (const cortina of cortinas) {
    if (cortina.tipoProduto !== 'cortina') continue;

    const consumo = calcularConsumoDetalhado(cortina, materiais);

    // Processar tecido
    if (cortina.tecidoId) {
      const tecido = materiais.find(m => m.id === cortina.tecidoId || m.codigo_item === cortina.tecidoId);
      if (tecido) {
        const key = `tecido_${tecido.codigo_item || tecido.id}`;
        if (!agrupamento[key]) {
          agrupamento[key] = {
            codigoItem: tecido.codigo_item || tecido.id,
            nome: tecido.nome,
            categoria: 'tecido',
            totalMetros: 0,
            custoUnitario: tecido.preco_custo,
            custoTotal: 0,
            itensOrigem: [],
          };
        }
        agrupamento[key].totalMetros += consumo.consumoTecido_m;
        agrupamento[key].custoTotal += consumo.consumoTecido_m * tecido.preco_custo;
        agrupamento[key].itensOrigem.push({
          nome: cortina.nomeIdentificacao,
          metros: consumo.consumoTecido_m,
          quantidade: cortina.quantidade,
        });
      }
    }

    // Processar forro
    if (cortina.forroId) {
      const forro = materiais.find(m => m.id === cortina.forroId || m.codigo_item === cortina.forroId);
      if (forro) {
        const key = `forro_${forro.codigo_item || forro.id}`;
        if (!agrupamento[key]) {
          agrupamento[key] = {
            codigoItem: forro.codigo_item || forro.id,
            nome: forro.nome,
            categoria: 'forro',
            totalMetros: 0,
            custoUnitario: forro.preco_custo,
            custoTotal: 0,
            itensOrigem: [],
          };
        }
        agrupamento[key].totalMetros += consumo.consumoForro_m;
        agrupamento[key].custoTotal += consumo.consumoForro_m * forro.preco_custo;
        agrupamento[key].itensOrigem.push({
          nome: cortina.nomeIdentificacao,
          metros: consumo.consumoForro_m,
          quantidade: cortina.quantidade,
        });
      }
    }

    // Processar trilho
    if (cortina.trilhoId) {
      const trilho = materiais.find(m => m.id === cortina.trilhoId || m.codigo_item === cortina.trilhoId);
      if (trilho) {
        const key = `trilho_${trilho.codigo_item || trilho.id}`;
        const comprimentoTrilho = consumo.comprimentoTrilho_m;
        if (!agrupamento[key]) {
          agrupamento[key] = {
            codigoItem: trilho.codigo_item || trilho.id,
            nome: trilho.nome,
            categoria: 'trilho',
            totalMetros: 0,
            custoUnitario: trilho.preco_custo,
            custoTotal: 0,
            itensOrigem: [],
          };
        }
        agrupamento[key].totalMetros += comprimentoTrilho;
        agrupamento[key].custoTotal += comprimentoTrilho * trilho.preco_custo;
        agrupamento[key].itensOrigem.push({
          nome: cortina.nomeIdentificacao,
          metros: comprimentoTrilho,
          quantidade: cortina.quantidade,
        });
      }
    }
  }

  return Object.values(agrupamento).sort((a, b) => {
    const ordem = { tecido: 1, forro: 2, trilho: 3 };
    return ordem[a.categoria] - ordem[b.categoria];
  });
}

export function MateriaisAgrupados({ cortinas, materiais }: MateriaisAgrupadosProps) {
  const materiaisAgrupados = useMemo(
    () => agruparMateriaisPorCodigo(cortinas, materiais),
    [cortinas, materiais]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMeters = (value: number) => {
    return value.toFixed(2) + 'm';
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'tecido':
        return <Package className="h-4 w-4" />;
      case 'forro':
        return <Scissors className="h-4 w-4" />;
      case 'trilho':
        return <Ruler className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCategoriaBadge = (categoria: string) => {
    const config = {
      tecido: { label: 'Tecido', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      forro: { label: 'Forro', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      trilho: { label: 'Trilho', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    };
    return config[categoria as keyof typeof config] || { label: categoria, className: '' };
  };

  if (materiaisAgrupados.length === 0) return null;

  const tecidos = materiaisAgrupados.filter(m => m.categoria === 'tecido');
  const forros = materiaisAgrupados.filter(m => m.categoria === 'forro');
  const trilhos = materiaisAgrupados.filter(m => m.categoria === 'trilho');

  const totalCusto = materiaisAgrupados.reduce((acc, m) => acc + m.custoTotal, 0);

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between border-dashed hover:bg-primary/5"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="font-semibold">Lista de Compras - Materiais Agrupados</span>
            <Badge variant="secondary" className="ml-2">
              {materiaisAgrupados.length} item(s)
            </Badge>
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="border rounded-lg overflow-hidden">
          {/* Tabela de materiais */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Código</th>
                  <th className="px-4 py-2 text-left font-medium">Material</th>
                  <th className="px-4 py-2 text-center font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Total (m)</th>
                  <th className="px-4 py-2 text-right font-medium">Custo/m</th>
                  <th className="px-4 py-2 text-right font-medium">Custo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {materiaisAgrupados.map((material, idx) => {
                  const badge = getCategoriaBadge(material.categoria);
                  return (
                    <Collapsible key={idx} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <tr className="hover:bg-muted/30 cursor-pointer transition-colors">
                            <td className="px-4 py-2 font-mono text-xs">{material.codigoItem}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {getCategoriaIcon(material.categoria)}
                                <span className="font-medium">{material.nome}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${badge.className}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-semibold">
                              {formatMeters(material.totalMetros)}
                            </td>
                            <td className="px-4 py-2 text-right text-muted-foreground">
                              {formatCurrency(material.custoUnitario)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {formatCurrency(material.custoTotal)}
                            </td>
                          </tr>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <tr className="bg-muted/20">
                            <td colSpan={6} className="px-8 py-2">
                              <div className="text-xs space-y-1">
                                <p className="font-medium text-muted-foreground mb-1">Usado em:</p>
                                {material.itensOrigem.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex justify-between">
                                    <span>
                                      • {item.nome}
                                      {item.quantidade > 1 && (
                                        <span className="text-muted-foreground"> (×{item.quantidade})</span>
                                      )}
                                    </span>
                                    <span className="font-mono">{formatMeters(item.metros)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                })}
              </tbody>
              <tfoot className="bg-primary/5 font-semibold">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Total de Custo de Materiais:</td>
                  <td className="px-4 py-2 text-right text-primary">{formatCurrency(totalCusto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo por categoria */}
          <div className="p-4 border-t bg-muted/30 grid grid-cols-3 gap-4 text-center text-sm">
            {tecidos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Tecidos</p>
                <p className="font-bold">{formatMeters(tecidos.reduce((acc, t) => acc + t.totalMetros, 0))}</p>
                <p className="text-xs text-primary">{formatCurrency(tecidos.reduce((acc, t) => acc + t.custoTotal, 0))}</p>
              </div>
            )}
            {forros.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Forros</p>
                <p className="font-bold">{formatMeters(forros.reduce((acc, f) => acc + f.totalMetros, 0))}</p>
                <p className="text-xs text-primary">{formatCurrency(forros.reduce((acc, f) => acc + f.custoTotal, 0))}</p>
              </div>
            )}
            {trilhos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Trilhos</p>
                <p className="font-bold">{formatMeters(trilhos.reduce((acc, t) => acc + t.totalMetros, 0))}</p>
                <p className="text-xs text-primary">{formatCurrency(trilhos.reduce((acc, t) => acc + t.custoTotal, 0))}</p>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
