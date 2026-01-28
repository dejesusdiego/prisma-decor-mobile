import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationDetailModal } from './OrganizationDetailModal';
import {
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  users: number;
  orcamentos: number;
  created_at: string;
}

type SortField = 'name' | 'plan' | 'status' | 'users' | 'orcamentos' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 10;

const getPlanBadge = (plan: string) => {
  const styles: Record<string, string> = {
    starter: 'bg-blue-500/10 text-blue-600',
    pro: 'bg-purple-500/10 text-purple-600',
    business: 'bg-orange-500/10 text-orange-600',
    enterprise: 'bg-amber-500/10 text-amber-600',
  };
  return styles[plan] || 'bg-gray-500/10 text-gray-600';
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    trialing: 'bg-blue-500/10 text-blue-600',
    paused: 'bg-yellow-500/10 text-yellow-600',
    canceled: 'bg-red-500/10 text-red-600',
    pending: 'bg-gray-500/10 text-gray-600',
  };
  return styles[status] || 'bg-gray-500/10 text-gray-600';
};

export function OrganizationsList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch organizations with pagination
  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query
      let query = supabase
        .from('organizations')
        .select('*, subscription:subscriptions(status, plan_type)', { count: 'exact' });

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data - simplified without nested counts for now
      const transformedOrgs: Organization[] = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.subscription?.[0]?.plan_type || 'starter',
        status: org.subscription?.[0]?.status || 'trial',
        users: 0, // Will be populated separately
        orcamentos: 0, // Will be populated separately
        created_at: org.created_at,
      }));

      setOrganizations(transformedOrgs);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      toast.error('Erro ao carregar organizações');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, sortField, sortDirection]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const handleViewDetails = (org: Organization) => {
    setSelectedOrg(org);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrg(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organizações</h2>
          <p className="text-muted-foreground">
            Gerencie todos os tenants da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={itemsPerPage.toString()} onValueChange={(v) => {
            setItemsPerPage(Number(v));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt.toString()}>
                  {opt} / página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrganizations}>
            <Filter className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Organização
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('plan')}
                >
                  <div className="flex items-center">
                    Plano
                    {getSortIcon('plan')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('users')}
                >
                  <div className="flex items-center">
                    Usuários
                    {getSortIcon('users')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('orcamentos')}
                >
                  <div className="flex items-center">
                    Orçamentos
                    {getSortIcon('orcamentos')}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma organização encontrada
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">{org.name}</span>
                          <p className="text-xs text-muted-foreground">{org.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadge(org.plan)} variant="secondary">
                        {org.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(org.status)} variant="secondary">
                        {org.status === 'trialing' ? 'trial' : org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{org.users}</TableCell>
                    <TableCell>{org.orcamentos}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(org)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>Editar plano</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount > 0 ? (
            <>Mostrando {startItem} a {endItem} de {totalCount} organizações</>
          ) : (
            'Nenhuma organização'
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => {
              let pageNum: number;
              const maxPages = Math.max(1, totalPages);
              if (maxPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= maxPages - 2) {
                pageNum = maxPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Organization Detail Modal */}
      <OrganizationDetailModal
        organization={selectedOrg}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
