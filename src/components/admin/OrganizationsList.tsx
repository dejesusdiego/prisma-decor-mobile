import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
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

export function OrganizationsList() {
  // Mock data
  const organizations = [
    { id: 1, name: 'Studio OS Principal', plan: 'enterprise', status: 'active', users: 15, orcamentos: 234 },
    { id: 2, name: 'Cortinas Silva', plan: 'pro', status: 'active', users: 5, orcamentos: 89 },
    { id: 3, name: 'Persianas Premium', plan: 'starter', status: 'trial', users: 2, orcamentos: 12 },
  ];

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
      trial: 'bg-blue-500/10 text-blue-600',
      paused: 'bg-yellow-500/10 text-yellow-600',
      cancelled: 'bg-red-500/10 text-red-600',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600';
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
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome..." 
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Orçamentos</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanBadge(org.plan)} variant="secondary">
                      {org.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(org.status)} variant="secondary">
                      {org.status}
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
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar plano</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Suspender
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando 3 de 12 organizações
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}