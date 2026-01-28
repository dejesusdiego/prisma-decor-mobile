import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImportRecord {
  id: string;
  supplier_id: string;
  filename: string;
  status: 'validated' | 'applied' | 'failed';
  total_rows: number;
  inserted: number;
  updated: number;
  deactivated: number;
  errors: any[];
  created_at: string;
}

interface ImportHistoryProps {
  supplierId: string;
}

export function ImportHistory({ supplierId }: ImportHistoryProps) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchImports();
  }, [supplierId]);

  const fetchImports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_material_imports')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setImports((data || []) as ImportRecord[]);
    } catch (error: any) {
      console.error('Erro ao carregar histórico de importações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'validated':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge variant="default" className="bg-green-500">Aplicado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'validated':
        return <Badge variant="outline">Validado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Importações</CardTitle>
        <CardDescription>
          Rastreabilidade das importações de catálogo via CSV
        </CardDescription>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma importação realizada ainda.</p>
            <p className="text-sm mt-2">As importações aparecerão aqui após serem processadas.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Inseridos</TableHead>
                <TableHead>Atualizados</TableHead>
                <TableHead>Erros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importRecord) => (
                <TableRow key={importRecord.id}>
                  <TableCell>
                    {format(new Date(importRecord.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{importRecord.filename}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(importRecord.status)}
                      {getStatusBadge(importRecord.status)}
                    </div>
                  </TableCell>
                  <TableCell>{importRecord.total_rows}</TableCell>
                  <TableCell className="text-green-600">{importRecord.inserted || 0}</TableCell>
                  <TableCell className="text-blue-600">{importRecord.updated || 0}</TableCell>
                  <TableCell>
                    {Array.isArray(importRecord.errors) && importRecord.errors.length > 0 ? (
                      <Badge variant="destructive">{importRecord.errors.length}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
