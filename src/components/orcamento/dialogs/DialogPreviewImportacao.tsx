import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { ResultadoParse } from '@/lib/parserCSVMateriais';
import { useState } from 'react';

interface DialogPreviewImportacaoProps {
  aberto: boolean;
  onClose: () => void;
  onConfirmar: (pularErros: boolean) => void;
  resultado: ResultadoParse | null;
  nomeArquivo: string;
  tipo: string;
  importando: boolean;
}

export function DialogPreviewImportacao({
  aberto,
  onClose,
  onConfirmar,
  resultado,
  nomeArquivo,
  tipo,
  importando,
}: DialogPreviewImportacaoProps) {
  const [pularErros, setPularErros] = useState(true);

  if (!resultado) return null;

  const { registros, cabecalhosMapeados, separador, totalValidos, totalErros } = resultado;
  
  // Mostrar apenas as primeiras 20 linhas no preview
  const registrosPreview = registros.slice(0, 20);
  const temMais = registros.length > 20;

  // Colunas principais para exibição
  const colunasVisiveis = cabecalhosMapeados.filter(c => 
    ['codigo_item', 'nome', 'nome_modelo', 'categoria', 'preco_custo', 'preco_custo_por_ponto', 'unidade'].includes(c)
  ).slice(0, 6);

  return (
    <Dialog open={aberto} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Preview da Importação
          </DialogTitle>
          <DialogDescription>
            Arquivo: {nomeArquivo} • Separador detectado: "{separador === '\t' ? 'TAB' : separador}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              <strong>{totalValidos}</strong> registros válidos
            </span>
          </div>
          {totalErros > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">
                <strong>{totalErros}</strong> com erros
              </span>
            </div>
          )}
          <Badge variant="outline">{tipo}</Badge>
        </div>

        {totalErros > 0 && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {totalErros} registro(s) possuem erros. Você pode pular esses registros e importar apenas os válidos.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 border rounded-lg max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Linha</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                {colunasVisiveis.map((col, idx) => (
                  <TableHead key={idx} className="min-w-[100px]">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrosPreview.map((registro, idx) => (
                <TableRow 
                  key={idx}
                  className={!registro.valido ? 'bg-red-50 dark:bg-red-950/20' : ''}
                >
                  <TableCell className="font-mono text-xs">{registro.linha}</TableCell>
                  <TableCell>
                    {registro.valido ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="flex items-center gap-1" title={registro.erros.join(', ')}>
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </TableCell>
                  {colunasVisiveis.map((col, colIdx) => (
                    <TableCell key={colIdx} className="text-sm max-w-[150px] truncate">
                      {registro.dados[col] !== null && registro.dados[col] !== undefined 
                        ? String(registro.dados[col]) 
                        : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {temMais && (
          <p className="text-sm text-muted-foreground text-center">
            Mostrando 20 de {registros.length} registros...
          </p>
        )}

        {totalErros > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="pular-erros"
              checked={pularErros}
              onCheckedChange={(checked) => setPularErros(!!checked)}
            />
            <Label htmlFor="pular-erros" className="text-sm">
              Pular registros com erros e importar apenas os válidos
            </Label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importando}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onConfirmar(pularErros)}
            disabled={importando || (totalValidos === 0)}
          >
            {importando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                Importar {pularErros ? totalValidos : registros.length} registro(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
