import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Edit, Loader2, Search, X, CheckCircle2, AlertCircle, Plus, Power, PowerOff, Download, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupplierMaterials, useInvalidateSupplierMaterials } from '@/hooks/useSupplierMaterials';
import { toast } from 'sonner';

interface SupplierMaterial {
  id: string;
  supplier_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierCatalogProps {
  supplierId: string;
}

export function SupplierCatalog({ supplierId }: SupplierCatalogProps) {
  const { data: materials = [], isLoading, refetch } = useSupplierMaterials(supplierId);
  const invalidateMaterials = useInvalidateSupplierMaterials();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<SupplierMaterial | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<any[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormSku('');
    setFormDescription('');
    setFormUnit('');
    setFormPrice('');
    setFormActive(true);
  };

  const handleNewMaterial = () => {
    setEditingMaterial(null);
    resetForm();
    setEditDialogOpen(true);
  };

  const handleToggleActive = async (material: SupplierMaterial) => {
    try {
      const { error } = await supabase
        .from('supplier_materials')
        .update({ active: !material.active })
        .eq('id', material.id);

      if (error) throw error;
      
      toast.success(`Material ${!material.active ? 'ativado' : 'desativado'} com sucesso`);
      invalidateMaterials(supplierId);
      refetch();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  const handleEditMaterial = (material: SupplierMaterial) => {
    setEditingMaterial(material);
    setFormName(material.name);
    setFormSku(material.sku || '');
    setFormDescription(material.description || '');
    setFormUnit(material.unit || '');
    setFormPrice(material.price.toString());
    setFormActive(material.active);
    setEditDialogOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!formName.trim() || !formPrice) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }

    const price = parseFloat(formPrice.replace(',', '.'));
    if (isNaN(price) || price < 0) {
      toast.error('Preço inválido');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMaterial) {
        // Update
        const { error } = await supabase
          .from('supplier_materials')
          .update({
            name: formName.trim(),
            sku: formSku.trim() || null,
            description: formDescription.trim() || null,
            unit: formUnit.trim() || null,
            price: price,
            active: formActive,
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success('Material atualizado com sucesso!');
      } else {
        // Create (não usado no V1, mas preparado)
        const { error } = await supabase
          .from('supplier_materials')
          .insert({
            supplier_id: supplierId,
            name: formName.trim(),
            sku: formSku.trim() || null,
            description: formDescription.trim() || null,
            unit: formUnit.trim() || null,
            price: price,
            active: formActive,
          });

        if (error) throw error;
        toast.success('Material criado com sucesso!');
      }

      setEditDialogOpen(false);
      resetForm();
      setEditingMaterial(null);
      invalidateMaterials(supplierId);
      refetch();
    } catch (error: any) {
      console.error('Erro ao salvar material:', error);
      toast.error(error.message || 'Erro ao salvar material');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCsvFileChange = async (file: File | null) => {
    if (!file) {
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    setCsvFile(file);

    try {
      const content = await file.text();
      const lines = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter(l => l.trim() !== '');

      if (lines.length < 2) {
        toast.error('CSV deve ter pelo menos um cabeçalho e uma linha de dados');
        return;
      }

      // Detectar separador
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

      // Validar colunas obrigatórias
      const requiredCols = ['name', 'nome', 'price', 'preco', 'preço'];
      const hasName = headers.some(h => requiredCols.includes(h) && (h === 'name' || h === 'nome'));
      const hasPrice = headers.some(h => requiredCols.includes(h) && (h === 'price' || h === 'preco' || h === 'preço'));

      if (!hasName || !hasPrice) {
        toast.error('CSV deve conter colunas: name/nome (obrigatório) e price/preco/preço (obrigatório)');
        return;
      }

      // Parse linhas
      const preview: any[] = [];
      const errors: any[] = [];

      for (let i = 1; i < Math.min(lines.length, 11); i++) { // Preview das primeiras 10 linhas
        const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = { linha: i + 1, dados: {} };
        const rowErrors: string[] = [];

        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          
          if (header === 'name' || header === 'nome') {
            row.dados.name = value;
            if (!value) rowErrors.push('Nome é obrigatório');
          } else if (header === 'price' || header === 'preco' || header === 'preço') {
            // Normalizar preço: remover espaços, substituir vírgula por ponto
            const priceStr = value.replace(/\s/g, '').replace(',', '.');
            const price = parseFloat(priceStr);
            row.dados.price = isNaN(price) ? null : price;
            if (isNaN(price) || price < 0) rowErrors.push('Preço inválido (deve ser um número positivo)');
          } else if (header === 'sku' || header === 'codigo' || header === 'código') {
            row.dados.sku = value || null;
          } else if (header === 'unit' || header === 'unidade') {
            row.dados.unit = value || null;
          } else if (header === 'description' || header === 'descricao' || header === 'descrição') {
            row.dados.description = value || null;
          } else if (header === 'active' || header === 'ativo') {
            const lower = value.toLowerCase();
            row.dados.active = lower === 'true' || lower === 'sim' || lower === 'yes' || lower === '1' || lower === 's';
          }
        });

        row.valido = rowErrors.length === 0;
        row.erros = rowErrors;

        if (row.valido) {
          preview.push(row);
        } else {
          errors.push({ ...row, erros: rowErrors });
        }
      }

      setCsvPreview(preview);
      setCsvErrors(errors);

      if (errors.length > 0) {
        toast.warning(`${errors.length} linha(s) com erro encontrada(s)`);
      }
    } catch (error: any) {
      console.error('Erro ao processar CSV:', error);
      toast.error('Erro ao processar arquivo CSV');
    }
  };

  const handleApplyImport = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    try {
      const content = await csvFile.text();
      const lines = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter(l => l.trim() !== '');

      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

      let inserted = 0;
      let updated = 0;
      const errors: any[] = [];

      // Criar registro de import
      const { data: importRecord, error: importError } = await supabase
        .from('supplier_material_imports')
        .insert({
          supplier_id: supplierId,
          filename: csvFile.name,
          status: 'validated',
          total_rows: lines.length - 1,
        })
        .select('id')
        .single();

      if (importError) throw importError;

      // Processar cada linha
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
        const dados: any = { supplier_id: supplierId };

        headers.forEach((header, idx) => {
          const value = (values[idx] || '').trim(); // Remover espaços
          
          if (header === 'name' || header === 'nome') {
            dados.name = value;
          } else if (header === 'price' || header === 'preco' || header === 'preço') {
            // Normalizar preço: remover espaços, substituir vírgula por ponto
            const priceStr = value.replace(/\s/g, '').replace(',', '.');
            const price = parseFloat(priceStr);
            dados.price = isNaN(price) ? null : price;
          } else if (header === 'sku' || header === 'codigo' || header === 'código') {
            // Normalizar SKU: string vazia vira null (evita duplicados)
            dados.sku = value ? value : null;
          } else if (header === 'unit' || header === 'unidade') {
            dados.unit = value || null;
          } else if (header === 'description' || header === 'descricao' || header === 'descrição') {
            dados.description = value || null;
          } else if (header === 'active' || header === 'ativo') {
            const lower = value.toLowerCase();
            dados.active = lower === 'true' || lower === 'sim' || lower === 'yes' || lower === '1' || lower === 's';
          }
        });

        // Validação rigorosa de preço
        if (!dados.name || dados.price === null || isNaN(dados.price) || dados.price < 0) {
          errors.push({ 
            linha: i + 1, 
            erro: dados.name ? 'Preço inválido (deve ser um número positivo)' : 'Nome é obrigatório' 
          });
          continue;
        }

        // Upsert: por sku se existir e não for vazio, senão por name
        // Normalizar SKU vazio para null (evita duplicados com constraint UNIQUE NULLS NOT DISTINCT)
        const skuNormalized = dados.sku && dados.sku.trim() !== '' ? dados.sku.trim() : null;
        const matchKey = skuNormalized 
          ? { supplier_id: supplierId, sku: skuNormalized } 
          : { supplier_id: supplierId, name: dados.name };
        
        const { data: existing } = await supabase
          .from('supplier_materials')
          .select('id')
          .match(matchKey)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabase
            .from('supplier_materials')
            .update({
              name: dados.name,
              price: dados.price,
              unit: dados.unit || null,
              description: dados.description || null,
              sku: skuNormalized, // Usar SKU normalizado (null se vazio)
              active: dados.active !== undefined ? dados.active : true,
            })
            .eq('id', existing.id);

          if (updateError) {
            errors.push({ linha: i + 1, erro: updateError.message });
          } else {
            updated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('supplier_materials')
            .insert({
              supplier_id: supplierId,
              name: dados.name,
              sku: skuNormalized, // Usar SKU normalizado (null se vazio)
              price: dados.price,
              unit: dados.unit || null,
              description: dados.description || null,
              active: dados.active !== undefined ? dados.active : true,
            });

          if (insertError) {
            errors.push({ linha: i + 1, erro: insertError.message });
          } else {
            inserted++;
          }
        }
      }

      // Atualizar registro de import
      // Garantir que errors seja sempre um array válido (não pode ser undefined ou null)
      const errorsArray = Array.isArray(errors) ? errors : [];
      
      await supabase
        .from('supplier_material_imports')
        .update({
          status: errorsArray.length > 0 ? 'failed' : 'applied',
          inserted,
          updated,
          errors: errorsArray, // Sempre array válido
        })
        .eq('id', importRecord.id);

      const ignored = lines.length - 1 - inserted - updated - errorsArray.length;
      setImportSummary({ inserted, updated, ignored });
      
      toast.success(`Importação concluída! ${inserted} inseridos, ${updated} atualizados${errorsArray.length > 0 ? `, ${errorsArray.length} erros` : ''}`);
      
      // Não fechar dialog imediatamente - mostrar resumo
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      invalidateMaterials(supplierId);
      refetch();
    } catch (error: any) {
      console.error('Erro ao importar CSV:', error);
      toast.error(error.message || 'Erro ao importar CSV');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtrar e ordenar materiais
  const filteredMaterials = materials
    .filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.sku && m.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || m.unit === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Categorias únicas para filtro
  const categories = Array.from(new Set(materials.map(m => m.unit).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Catálogo de Materiais</h2>
          <p className="text-muted-foreground">
            Gerencie o catálogo de materiais do seu fornecedor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={handleNewMaterial}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Materiais ({filteredMaterials.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [by, order] = value.split('-') as ['name' | 'price' | 'updated', 'asc' | 'desc'];
                setSortBy(by);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Preço (menor)</SelectItem>
                  <SelectItem value="price-desc">Preço (maior)</SelectItem>
                  <SelectItem value="updated-desc">Mais recente</SelectItem>
                  <SelectItem value="updated-asc">Mais antigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum material cadastrado ainda.</p>
              <p className="text-sm mt-2">Use "Importar CSV" para adicionar materiais em lote.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMaterial(material)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(material)}
                          title={material.active ? 'Desativar' : 'Ativar'}
                        >
                          {material.active ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Editar Material */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Material' : 'Novo Material'}</DialogTitle>
            <DialogDescription>
              {editingMaterial ? 'Atualize as informações do material' : 'Adicione um novo material ao catálogo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="form-name">Nome *</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="form-sku">SKU</Label>
              <Input
                id="form-sku"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="Código do fornecedor"
              />
            </div>

            <div>
              <Label htmlFor="form-unit">Unidade</Label>
              <Input
                id="form-unit"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="Ex: m, un, rolo"
              />
            </div>

            <div>
              <Label htmlFor="form-price">Preço *</Label>
              <Input
                id="form-price"
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="form-description">Descrição</Label>
              <Input
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="form-active"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="form-active">Material ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMaterial} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Importar CSV */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Catálogo via CSV</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV com os materiais do catálogo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Arquivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => handleCsvFileChange(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Colunas obrigatórias: name/nome, price/preco/preço. Opcionais: sku, unit/unidade, description/descricao, active/ativo
              </p>
            </div>

            {csvPreview.length > 0 && (
              <div>
                <Label>Preview (primeiras 10 linhas válidas)</Label>
                <div className="border rounded-lg mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Unidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.linha}</TableCell>
                          <TableCell>{row.dados.name}</TableCell>
                          <TableCell>{row.dados.sku || '-'}</TableCell>
                          <TableCell>R$ {row.dados.price?.toFixed(2).replace('.', ',')}</TableCell>
                          <TableCell>{row.dados.unit || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {csvErrors.length > 0 && (
              <div>
                <Label className="text-destructive">Erros encontrados</Label>
                <div className="border rounded-lg mt-2 p-4 max-h-48 overflow-y-auto">
                  {csvErrors.map((error, idx) => (
                    <div key={idx} className="text-sm text-destructive mb-2">
                      Linha {error.linha}: {error.erros?.join(', ') || error.erro}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialogOpen(false);
              setImportSummary(null);
            }}>
              {importSummary ? 'Fechar' : 'Cancelar'}
            </Button>
            {!importSummary && (
              <Button
                onClick={handleApplyImport}
                disabled={!csvFile || isImporting || csvPreview.length === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Aplicar Importação
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
