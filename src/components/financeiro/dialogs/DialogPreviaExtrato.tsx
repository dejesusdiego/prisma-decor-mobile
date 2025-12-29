import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, XCircle, FileText, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DadosExtrato } from '../utils/parserOFX';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface DialogPreviaExtratoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dados: DadosExtrato | null;
  nomeArquivo: string;
  onConfirmar: () => void;
  isLoading?: boolean;
}

export function DialogPreviaExtrato({
  open,
  onOpenChange,
  dados,
  nomeArquivo,
  onConfirmar,
  isLoading = false
}: DialogPreviaExtratoProps) {
  if (!dados) return null;

  const movimentacoesValidas = dados.movimentacoes.filter(m => 
    m.data_movimentacao && Number.isFinite(m.valor)
  );
  const movimentacoesInvalidas = dados.movimentacoes.length - movimentacoesValidas.length;

  const totalCreditos = movimentacoesValidas
    .filter(m => m.tipo === 'credito')
    .reduce((acc, m) => acc + m.valor, 0);
  
  const totalDebitos = movimentacoesValidas
    .filter(m => m.tipo === 'debito')
    .reduce((acc, m) => acc + m.valor, 0);

  const saldo = totalCreditos - totalDebitos;

  const primeiras20 = movimentacoesValidas.slice(0, 20);
  const temMais = movimentacoesValidas.length > 20;

  const isValido = movimentacoesValidas.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prévia do Extrato
          </DialogTitle>
          <DialogDescription>
            Revise os dados antes de confirmar a importação
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Info do arquivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Arquivo:</span>
              <p className="font-medium truncate">{nomeArquivo}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Banco:</span>
              <p className="font-medium">{dados.banco || 'Não identificado'}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Conta:</span>
              <p className="font-medium">{dados.conta || 'Não identificado'}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Período:</span>
              <p className="font-medium">
                {dados.data_inicio && dados.data_fim 
                  ? `${format(new Date(dados.data_inicio), "dd/MM/yy")} - ${format(new Date(dados.data_fim), "dd/MM/yy")}`
                  : 'Não identificado'
                }
              </p>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Movimentações</p>
                    <p className="text-lg font-bold">{movimentacoesValidas.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Créditos</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(totalCreditos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Débitos</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(totalDebitos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  {saldo >= 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className={`text-lg font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(saldo)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validação */}
          <div className="flex flex-wrap gap-2">
            {isValido ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Arquivo válido
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Arquivo inválido
              </Badge>
            )}
            
            {movimentacoesInvalidas > 0 && (
              <Badge variant="secondary" className="text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {movimentacoesInvalidas} linha(s) ignorada(s)
              </Badge>
            )}
          </div>

          {/* Tabela de prévia */}
          <ScrollArea className="h-[250px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {primeiras20.map((mov, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">
                      {mov.data_movimentacao 
                        ? format(new Date(mov.data_movimentacao), "dd/MM/yyyy")
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm">
                      {mov.descricao}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${mov.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'credito' ? '+' : '-'} {formatCurrency(mov.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {mov.tipo === 'credito' ? 'Crédito' : 'Débito'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {temMais && (
              <div className="text-center py-2 text-sm text-muted-foreground border-t">
                ... e mais {movimentacoesValidas.length - 20} movimentações
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirmar} 
            disabled={!isValido || isLoading}
          >
            {isLoading ? 'Importando...' : `Confirmar Importação (${movimentacoesValidas.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
