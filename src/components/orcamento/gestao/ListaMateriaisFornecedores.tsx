import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SupplierMaterial {
  id: string;
  supplier_id: string;
  supplier_name: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  price: number;
  active: boolean;
}

export function ListaMateriaisFornecedores() {
  const { organizationId } = useOrganizationContext();
  const [materials, setMaterials] = useState<SupplierMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState<string>('todos');
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (organizationId) {
      fetchSuppliers();
    }
  }, [organizationId]);

  useEffect(() => {
    if (suppliers.length > 0 && organizationId) {
      fetchMaterials();
    }
  }, [suppliers, filterSupplier, organizationId]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_organizations')
        .select(`
          supplier_id,
          suppliers (
            id,
            name
          )
        `)
        .eq('organization_id', organizationId)
        .eq('active', true);

      if (error) throw error;

      const suppliersList = (data || [])
        .map((item: any) => item.suppliers)
        .filter((s: any) => s !== null)
        .map((s: any) => ({ id: s.id, name: s.name }));

      setSuppliers(suppliersList);
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const fetchMaterials = async () => {
    if (!organizationId || suppliers.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const supplierIds = suppliers.map(s => s.id);
      
      const { data, error } = await supabase
        .from('supplier_materials')
        .select(`
          id,
          supplier_id,
          sku,
          name,
          description,
          unit,
          price,
          active,
          suppliers (
            id,
            name
          )
        `)
        .eq('active', true)
        .in('supplier_id', supplierIds)
        .order('name', { ascending: true });

      if (error) throw error;

      const materialsList = (data || []).map((item: any) => ({
        id: item.id,
        supplier_id: item.supplier_id,
        supplier_name: item.suppliers?.name || 'Fornecedor',
        sku: item.sku,
        name: item.name,
        description: item.description,
        unit: item.unit,
        price: item.price,
        active: item.active,
      }));

      setMaterials(materialsList);
    } catch (error: any) {
      console.error('Erro ao carregar materiais de fornecedores:', error);
      toast.error(error.message || 'Erro ao carregar materiais de fornecedores');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.sku && m.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSupplier = filterSupplier === 'todos' || m.supplier_id === filterSupplier;
    
    return matchesSearch && matchesSupplier;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Materiais de Fornecedores
                <Badge variant="outline" className="ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  Somente leitura
                </Badge>
              </CardTitle>
              <CardDescription>
                Catálogo de materiais dos fornecedores vinculados à sua organização.
                Estes materiais são controlados pelos fornecedores e não podem ser editados aqui.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os fornecedores</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suppliers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum fornecedor vinculado à sua organização.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Vá em Administração → Fornecedores para vincular fornecedores.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum material encontrado.</p>
              {searchTerm && (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca.</p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <Badge variant="secondary">{material.supplier_name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.sku || '-'}</TableCell>
                      <TableCell>{material.unit || '-'}</TableCell>
                      <TableCell>
                        R$ {material.price.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={material.active ? 'default' : 'secondary'}>
                          {material.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredMaterials.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>
                  <strong>Importante:</strong> Estes materiais são controlados pelos fornecedores.
                  Para alterar preços ou informações, entre em contato com o fornecedor ou use o Portal de Fornecedores.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
