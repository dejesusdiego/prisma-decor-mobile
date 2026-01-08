import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnly, formatDateOnly, startOfToday } from '@/lib/dateOnly';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  TrendingUp,
  ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { DialogDevolucaoEmprestimo } from './dialogs/DialogDevolucaoEmprestimo';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

interface EmprestimoCompleto {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  contaReceber?: {
    id: string;
    valor_total: number;
    valor_pago: number;
    status: string;
    data_vencimento: string;
    parcelas?: Array<{
      id: string;
      valor: number;
      status: string;
    }>;
  };
}

export function RelatorioEmprestimos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState<EmprestimoCompleto | null>(null);
  const { organizationId } = useOrganizationContext();

  // Buscar lançamentos de empréstimo com suas contas a receber
  const { data: emprestimos = [], isLoading } = useQuery({
    queryKey: ['emprestimos-pendentes', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // 1. Buscar lançamentos do tipo empréstimo (filtrado por organização)
      const { data: lancamentos, error: errLanc } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(nome)
        `)
        .eq('organization_id', organizationId)
        .eq('tipo', 'emprestimo')
        .order('data_lancamento', { ascending: false });

      if (errLanc) throw errLanc;

      // 2. Para cada lançamento, buscar a conta a receber vinculada
      const emprestimosComContas = await Promise.all(
        (lancamentos || []).map(async (lanc) => {
          const { data: contaReceber } = await supabase
            .from('contas_receber')
            .select('*, parcelas:parcelas_receber(*)')
            .eq('lancamento_origem_id', lanc.id)
            .single();

          return {
            ...lanc,
            contaReceber: contaReceber || undefined,
          };
        })
      );

      return emprestimosComContas as EmprestimoCompleto[];
    },
    enabled: !!organizationId
  });

  // Calcular métricas por beneficiário (extraindo do texto da descrição)
  const metricasPorBeneficiario = (() => {
    const beneficiarios: Record<string, { emprestado: number; devolvido: number; pendente: number }> = {};

    emprestimos.forEach((emp) => {
      // Tentar extrair o nome do beneficiário da descrição
      // Padrão esperado: "Empréstimo para [Nome]" ou similar
      const match = emp.descricao.match(/(?:para|pra|à|a)\s+(\w+)/i);
      const nome = match ? match[1] : 'Outros';

      if (!beneficiarios[nome]) {
        beneficiarios[nome] = { emprestado: 0, devolvido: 0, pendente: 0 };
      }

      const valorTotal = Number(emp.valor);
      const valorPago = emp.contaReceber ? Number(emp.contaReceber.valor_pago) : 0;

      beneficiarios[nome].emprestado += valorTotal;
      beneficiarios[nome].devolvido += valorPago;
      beneficiarios[nome].pendente += valorTotal - valorPago;
    });

    return Object.entries(beneficiarios).map(([nome, dados]) => ({
      nome,
      ...dados,
    }));
  })();

  // Alertas de vencimento
  const alertas = (() => {
    const hoje = startOfToday();
    const em7Dias = addDays(hoje, 7);

    const vencendoProximosDias = emprestimos.filter((emp) => {
      if (!emp.contaReceber || emp.contaReceber.status === 'pago') return false;
      const venc = parseDateOnly(emp.contaReceber.data_vencimento);
      return venc && venc >= hoje && venc <= em7Dias;
    });

    const vencidos = emprestimos.filter((emp) => {
      if (!emp.contaReceber || emp.contaReceber.status === 'pago') return false;
      const venc = parseDateOnly(emp.contaReceber.data_vencimento);
      return venc && venc < hoje;
    });

    return {
      vencendoProximosDias,
      vencidos,
      totalVencendoValor: vencendoProximosDias.reduce(
        (acc, e) => acc + (Number(e.contaReceber?.valor_total || 0) - Number(e.contaReceber?.valor_pago || 0)),
        0
      ),
      totalVencidoValor: vencidos.reduce(
        (acc, e) => acc + (Number(e.contaReceber?.valor_total || 0) - Number(e.contaReceber?.valor_pago || 0)),
        0
      ),
    };
  })();

  // Totais gerais
  const totais = (() => {
    const emprestado = emprestimos.reduce((acc, e) => acc + Number(e.valor), 0);
    const devolvido = emprestimos.reduce((acc, e) => acc + Number(e.contaReceber?.valor_pago || 0), 0);
    const pendente = emprestado - devolvido;

    return { emprestado, devolvido, pendente };
  })();

  // Dados para gráfico de pizza
  const dadosPizza = metricasPorBeneficiario.map((b) => ({
    name: b.nome,
    value: b.pendente,
  })).filter(d => d.value > 0);

  // Dados para gráfico de linha (evolução mensal)
  const evolucaoMensal = (() => {
    const meses: Record<string, { emprestado: number; devolvido: number }> = {};

    emprestimos.forEach((emp) => {
      const mes = format(new Date(emp.data_lancamento), 'MMM/yy', { locale: ptBR });
      if (!meses[mes]) {
        meses[mes] = { emprestado: 0, devolvido: 0 };
      }
      meses[mes].emprestado += Number(emp.valor);
    });

    // Adicionar devoluções (lançamentos de entrada que são devoluções)
    // Isso seria uma query separada, mas por simplicidade usamos os valores pagos

    return Object.entries(meses).map(([mes, dados]) => ({
      mes,
      emprestado: dados.emprestado,
    }));
  })();

  const handleDevolucao = (emprestimo: EmprestimoCompleto) => {
    setEmprestimoSelecionado(emprestimo);
    setDialogOpen(true);
  };

  const getStatusBadge = (emp: EmprestimoCompleto) => {
    if (!emp.contaReceber) {
      return <Badge variant="outline">Sem conta vinculada</Badge>;
    }

    const status = emp.contaReceber.status;
    const venc = parseDateOnly(emp.contaReceber.data_vencimento);
    const hoje = startOfToday();
    const diasRestantes = venc ? differenceInDays(venc, hoje) : 0;

    if (status === 'pago') {
      return <Badge className="bg-green-500/10 text-green-600">Devolvido</Badge>;
    }
    if (venc && venc < hoje) {
      return (
        <Badge variant="destructive">
          Atrasado ({Math.abs(diasRestantes)} dias)
        </Badge>
      );
    }
    if (diasRestantes <= 7) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600">
          Vence em {diasRestantes} dias
        </Badge>
      );
    }
    if (status === 'parcial') {
      return <Badge className="bg-blue-500/10 text-blue-600">Parcial</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-violet-600" />
              Total Emprestado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">{formatCurrency(totais.emprestado)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Total Devolvido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.devolvido)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa Devolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totais.emprestado > 0 ? ((totais.devolvido / totais.emprestado) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(alertas.vencidos.length > 0 || alertas.vencendoProximosDias.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertas.vencidos.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Empréstimos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{alertas.vencidos.length}</p>
                <p className="text-sm text-muted-foreground">
                  Total pendente: {formatCurrency(alertas.totalVencidoValor)}
                </p>
              </CardContent>
            </Card>
          )}

          {alertas.vencendoProximosDias.length > 0 && (
            <Card className="border-amber-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  Vencendo em 7 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{alertas.vencendoProximosDias.length}</p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(alertas.totalVencendoValor)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cards por Beneficiário */}
      {metricasPorBeneficiario.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricasPorBeneficiario.map((beneficiario, index) => (
            <Card key={beneficiario.nome}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                  {beneficiario.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Emprestado:</span>
                  <span className="text-violet-600">{formatCurrency(beneficiario.emprestado)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Devolvido:</span>
                  <span className="text-green-600">{formatCurrency(beneficiario.devolvido)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Pendente:</span>
                  <span className={beneficiario.pendente > 0 ? 'text-destructive' : 'text-green-600'}>
                    {formatCurrency(beneficiario.pendente)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dadosPizza.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Beneficiário</CardTitle>
              <CardDescription>Valores pendentes de devolução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {dadosPizza.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {evolucaoMensal.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Empréstimos</CardTitle>
              <CardDescription>Valores emprestados por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucaoMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="emprestado"
                      name="Emprestado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Empréstimos Detalhados</CardTitle>
          <CardDescription>Lista completa de empréstimos e status de devolução</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Devolvido</TableHead>
                <TableHead>Pendente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emprestimos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum empréstimo registrado
                  </TableCell>
                </TableRow>
              ) : (
                emprestimos.map((emp) => {
                  const valorPendente = Number(emp.valor) - Number(emp.contaReceber?.valor_pago || 0);
                  const isPago = emp.contaReceber?.status === 'pago';

                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        {formatDateOnly(emp.data_lancamento)}
                      </TableCell>
                      <TableCell className="font-medium">{emp.descricao}</TableCell>
                      <TableCell className="text-violet-600">
                        {formatCurrency(Number(emp.valor))}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(Number(emp.contaReceber?.valor_pago || 0))}
                      </TableCell>
                      <TableCell className={valorPendente > 0 ? 'text-destructive' : 'text-green-600'}>
                        {formatCurrency(valorPendente)}
                      </TableCell>
                      <TableCell>
                        {emp.contaReceber ? (
                          formatDateOnly(emp.contaReceber.data_vencimento)
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(emp)}</TableCell>
                      <TableCell className="text-right">
                        {!isPago && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDevolucao(emp)}
                            className="gap-1"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            Devolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DialogDevolucaoEmprestimo
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        emprestimo={emprestimoSelecionado}
      />
    </div>
  );
}
