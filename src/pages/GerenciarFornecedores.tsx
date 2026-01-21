import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Search, Loader2, RefreshCw, Unlink, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Lista de UFs do Brasil
const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface SupplierData {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  active: boolean;
  service_states: string[];
  created_at: string;
}

export default function GerenciarFornecedores() {
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();
  const navigate = useNavigate();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [serviceStates, setServiceStates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit supplier dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);
  const [editServiceStates, setEditServiceStates] = useState<string[]>([]);
  
  // Filter by state
  const [filterState, setFilterState] = useState<string>('todos');
  
  // Suppliers list state
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  
  // Link existing supplier dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SupplierData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Generate slug from name
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const fetchSuppliers = async () => {
    if (!organizationId) {
      setIsLoadingSuppliers(false);
      return;
    }

    setIsLoadingSuppliers(true);
    try {
      const { data, error } = await supabase
        .from('supplier_organizations')
        .select(`
          supplier_id,
          active,
          suppliers (
            id,
            name,
            slug,
            email,
            phone,
            cnpj,
            active,
            service_states,
            created_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('active', true);

      if (error) throw error;

      const suppliersList = (data || [])
        .map((item: any) => item.suppliers)
        .filter((s: SupplierData | null) => s !== null && s.active)
        .map((s: SupplierData) => ({
          ...s,
          id: s.id,
          service_states: s.service_states || [],
        }));

      // Aplicar filtro por UF
      let filtered = suppliersList;
      if (filterState !== 'todos') {
        filtered = suppliersList.filter((s: SupplierData) =>
          s.service_states?.includes(filterState)
        );
      }

      setSuppliers(filtered);
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error(error.message || 'Erro ao carregar lista de fornecedores');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchSuppliers();
    }
  }, [organizationId, filterState]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    if (!organizationId) {
      toast.error('Organização não encontrada');
      return;
    }

    setIsSubmitting(true);

    try {
      const slug = generateSlug(name);

      // Verificar se slug já existe
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      let supplierId: string;

      if (existingSupplier) {
        // Usar fornecedor existente
        supplierId = existingSupplier.id;
        toast.info('Fornecedor já existe. Vinculando à sua organização...');
      } else {
        // Criar novo fornecedor
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: name.trim(),
            slug,
            email: email.trim() || null,
            phone: phone.trim() || null,
            cnpj: cnpj.trim() || null,
            service_states: serviceStates,
            active: true,
          })
          .select('id')
          .single();

        if (supplierError) throw supplierError;
        if (!newSupplier) throw new Error('Erro ao criar fornecedor');

        supplierId = newSupplier.id;
      }

      // Vincular fornecedor à organização
      const { error: linkError } = await supabase
        .from('supplier_organizations')
        .insert({
          supplier_id: supplierId,
          organization_id: organizationId,
          active: true,
        });

      if (linkError) {
        // Se já existe vínculo, apenas ativar
        if (linkError.code === '23505') {
          const { error: updateError } = await supabase
            .from('supplier_organizations')
            .update({ active: true })
            .eq('supplier_id', supplierId)
            .eq('organization_id', organizationId);

          if (updateError) throw updateError;
        } else {
          throw linkError;
        }
      }

      toast.success('Fornecedor cadastrado e vinculado com sucesso!');
      setName('');
      setEmail('');
      setPhone('');
      setCnpj('');
      setServiceStates([]);
      
      fetchSuppliers();
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      toast.error(error.message || 'Erro ao criar fornecedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchSuppliers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, slug, email, phone, cnpj, active, service_states, created_at')
        .or(`name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('active', true)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error);
      toast.error(error.message || 'Erro ao buscar fornecedores');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkSupplier = async (supplierId: string) => {
    if (!organizationId) {
      toast.error('Organização não encontrada');
      return;
    }

    try {
      const { error: linkError } = await supabase
        .from('supplier_organizations')
        .insert({
          supplier_id: supplierId,
          organization_id: organizationId,
          active: true,
        });

      if (linkError) {
        // Se já existe vínculo, apenas ativar
        if (linkError.code === '23505') {
          const { error: updateError } = await supabase
            .from('supplier_organizations')
            .update({ active: true })
            .eq('supplier_id', supplierId)
            .eq('organization_id', organizationId);

          if (updateError) throw updateError;
          toast.success('Fornecedor vinculado com sucesso!');
        } else {
          throw linkError;
        }
      } else {
        toast.success('Fornecedor vinculado com sucesso!');
      }

      setLinkDialogOpen(false);
      setSearchTerm('');
      setSearchResults([]);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Erro ao vincular fornecedor:', error);
      toast.error(error.message || 'Erro ao vincular fornecedor');
    }
  };

  const handleEditSupplier = (supplier: SupplierData) => {
    setEditingSupplier(supplier);
    setEditServiceStates(supplier.service_states || []);
    setEditDialogOpen(true);
  };

  const handleSaveEditSupplier = async () => {
    if (!editingSupplier) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          service_states: editServiceStates,
        })
        .eq('id', editingSupplier.id);

      if (error) throw error;

      toast.success('Regiões atendidas atualizadas com sucesso!');
      setEditDialogOpen(false);
      setEditingSupplier(null);
      setEditServiceStates([]);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast.error(error.message || 'Erro ao atualizar fornecedor');
    }
  };

  const handleUnlinkSupplier = async (supplierId: string) => {
    if (!organizationId) {
      toast.error('Organização não encontrada');
      return;
    }

    if (!confirm('Tem certeza que deseja desvincular este fornecedor?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('supplier_organizations')
        .update({ active: false })
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      toast.success('Fornecedor desvinculado com sucesso');
      fetchSuppliers();
    } catch (error: any) {
      console.error('Erro ao desvincular fornecedor:', error);
      toast.error(error.message || 'Erro ao desvincular fornecedor');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/gerarorcamento')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Fornecedores</h1>
          <p className="text-muted-foreground mt-2">
            Cadastre e gerencie os fornecedores da sua organização
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Cadastro */}
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Fornecedor</CardTitle>
              <CardDescription>
                Crie um novo fornecedor e vincule à sua organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Fornecedor *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Tecidos ABC Ltda"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@fornecedor.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <Label>Regiões Atendidas (UFs)</Label>
                  <div className="mt-2 border rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {BRAZILIAN_STATES.map((uf) => (
                        <div key={uf} className="flex items-center space-x-2">
                          <Checkbox
                            id={`state-${uf}`}
                            checked={serviceStates.includes(uf)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setServiceStates([...serviceStates, uf]);
                              } else {
                                setServiceStates(serviceStates.filter(s => s !== uf));
                              }
                            }}
                          />
                          <label
                            htmlFor={`state-${uf}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {uf}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione os estados onde o fornecedor atende
                  </p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Fornecedor
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setLinkDialogOpen(true)}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Vincular Fornecedor Existente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Fornecedores */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fornecedores Vinculados</CardTitle>
                  <CardDescription>
                    {suppliers.length} fornecedor(es) vinculado(s)
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchSuppliers}
                  disabled={isLoadingSuppliers}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingSuppliers ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="mt-4">
                <Label htmlFor="filter-state">Filtrar por UF</Label>
                <select
                  id="filter-state"
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">Todos os estados</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSuppliers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum fornecedor vinculado ainda.</p>
                  <p className="text-sm mt-2">Cadastre ou vincule um fornecedor para começar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground space-x-2">
                          {supplier.email && <span>{supplier.email}</span>}
                          {supplier.phone && <span>• {supplier.phone}</span>}
                          {supplier.cnpj && <span>• {supplier.cnpj}</span>}
                        </div>
                        {supplier.service_states && supplier.service_states.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {supplier.service_states.map((uf) => (
                              <Badge key={uf} variant="secondary" className="text-xs">
                                {uf}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSupplier(supplier)}
                          title="Editar regiões atendidas"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnlinkSupplier(supplier.id)}
                          title="Desvincular fornecedor"
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Vincular Fornecedor Existente */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular Fornecedor Existente</DialogTitle>
            <DialogDescription>
              Busque e vincule um fornecedor que já existe no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome, CNPJ ou e-mail..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim()) {
                    handleSearchSuppliers();
                  } else {
                    setSearchResults([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSuppliers();
                  }
                }}
              />
              <Button
                onClick={handleSearchSuppliers}
                disabled={isSearching || !searchTerm.trim()}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.cnpj || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleLinkSupplier(supplier.id)}
                          >
                            Vincular
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum fornecedor encontrado
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Regiões Atendidas */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Regiões Atendidas</DialogTitle>
            <DialogDescription>
              {editingSupplier?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label>Selecione os estados onde o fornecedor atende</Label>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {BRAZILIAN_STATES.map((uf) => (
                  <div key={uf} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-state-${uf}`}
                      checked={editServiceStates.includes(uf)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditServiceStates([...editServiceStates, uf]);
                        } else {
                          setEditServiceStates(editServiceStates.filter(s => s !== uf));
                        }
                      }}
                    />
                    <label
                      htmlFor={`edit-state-${uf}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {uf}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditSupplier}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
