import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Check, Building2, Package, DollarSign, Ruler } from 'lucide-react';
import { useSupplierMaterialsForOrganization, type SupplierMaterialOrg } from '@/hooks/useSupplierMaterialsForOrganization';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface SupplierMaterialSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: 'tecido' | 'forro' | 'trilho' | 'persiana' | 'acessorio' | 'papel' | 'motorizado';
  onSelect: (material: SupplierMaterialOrg & { supplierSnapshot: any }) => void;
  currentMaterialId?: string;
}

export function SupplierMaterialSelector({
  open,
  onOpenChange,
  category,
  onSelect,
  currentMaterialId,
}: SupplierMaterialSelectorProps) {
  const { organization } = useOrganizationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const { data: materials, isLoading } = useSupplierMaterialsForOrganization(
    organization?.id || null
  );

  // Filter materials by category
  const categoryMaterials = useMemo(() => {
    if (!materials) return [];

    const categoryMap: Record<string, string[]> = {
      'tecido': ['Tecido', 'Tecidos'],
      'forro': ['Forro', 'Forros'],
      'trilho': ['Trilho', 'Trilhos', 'Trilho Suiço', 'Trilhos Suiços'],
      'persiana': ['Persiana', 'Persianas'],
      'acessorio': ['Acessório', 'Acessórios', 'Acessorio', 'Acessorios'],
      'papel': ['Papel', 'Papeis'],
      'motorizado': ['Motor', 'Motorizado', 'Motores', 'Motorização'],
    };

    const validCategories = categoryMap[category] || [category];
    return materials.filter(m =>
      validCategories.some(c =>
        m.category.toLowerCase() === c.toLowerCase()
      )
    );
  }, [materials, category]);

  // Get unique suppliers
  const suppliers = useMemo(() => {
    const supplierMap = new Map<string, string>();
    categoryMaterials.forEach(m => {
      supplierMap.set(m.supplier_id, m.supplier_name);
    });
    return Array.from(supplierMap.entries()).map(([id, name]) => ({ id, name }));
  }, [categoryMaterials]);

  // Filter by search and supplier
  const filteredMaterials = useMemo(() => {
    return categoryMaterials.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.line && m.line.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.color && m.color.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSupplier = selectedSupplier === 'all' || m.supplier_id === selectedSupplier;

      return matchesSearch && matchesSupplier;
    });
  }, [categoryMaterials, searchTerm, selectedSupplier]);

  // Group by supplier for display
  const groupedBySupplier = useMemo(() => {
    const grouped = filteredMaterials.reduce((acc, material) => {
      if (!acc[material.supplier_id]) {
        acc[material.supplier_id] = {
          supplier_name: material.supplier_name,
          materials: [],
        };
      }
      acc[material.supplier_id].materials.push(material);
      return acc;
    }, {} as Record<string, { supplier_name: string; materials: SupplierMaterialOrg[] }>);

    return Object.entries(grouped).map(([supplier_id, data]) => ({
      supplier_id,
      ...data,
    }));
  }, [filteredMaterials]);

  const handleSelect = (material: SupplierMaterialOrg) => {
    const supplierSnapshot = {
      supplier_id: material.supplier_id,
      supplier_name: material.supplier_name,
      material_id: material.id,
      material_name: material.name,
      price: material.price,
      unit: material.unit,
      selected_at: new Date().toISOString(),
    };

    onSelect({
      ...material,
      supplierSnapshot,
    });

    toast.success(`${material.name} selecionado`, {
      description: `Fornecedor: ${material.supplier_name}`,
    });

    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selecionar Material do Fornecedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredMaterials.length} material(is) encontrado(s)
          </div>

          {/* Materials list */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando materiais...
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum material encontrado para esta categoria
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedBySupplier.map((group) =>
                    group.materials.map((material, idx) => (
                      <TableRow
                        key={material.id}
                        className={material.id === currentMaterialId ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          {idx === 0 && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{group.supplier_name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{material.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {material.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {material.line && (
                              <p>Linha: {material.line}</p>
                            )}
                            {material.color && (
                              <p>Cor: {material.color}</p>
                            )}
                            {material.width_meters && (
                              <div className="flex items-center gap-1">
                                <Ruler className="h-3 w-3" />
                                {material.width_meters}m largura
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="flex items-center justify-end gap-1 text-lg font-semibold">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(material.price)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              /{material.unit}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={material.id === currentMaterialId ? 'secondary' : 'default'}
                                  onClick={() => handleSelect(material)}
                                  disabled={material.id === currentMaterialId}
                                >
                                  {material.id === currentMaterialId ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    'Selecionar'
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {material.id === currentMaterialId
                                  ? 'Material já selecionado'
                                  : 'Selecionar este material'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
