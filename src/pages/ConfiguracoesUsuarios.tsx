import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPermissionsModal } from '@/components/settings/UserPermissionsModal';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Shield,
  UserCog,
  Mail,
  Trash2,
  Loader2,
  UserPlus,
} from 'lucide-react';

interface OrganizationMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'user';
  status: 'active' | 'inactive';
  created_at: string;
  user?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

interface InviteFormData {
  email: string;
  role: 'admin' | 'user';
}

export default function ConfiguracoesUsuarios() {
  const { toast } = useToast();
  const { organization, isOwner, isAdmin } = useOrganizationContext();
  
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: '',
    role: 'user',
  });
  const [isInviting, setIsInviting] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const canManageUsers = isOwner || isAdmin;

  useEffect(() => {
    if (organization?.id) {
      loadMembers();
    }
  }, [organization?.id]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await (supabase as any)
        .from('organization_members')
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.email) {
      toast({
        title: 'Email obrigatório',
        description: 'Informe o email do usuário para convidar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsInviting(true);
      
      // Check if user already exists in organization
      const { data: existingMember } = await (supabase as any)
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization?.id)
        .eq('user:email', inviteForm.email)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: 'Usuário já existe',
          description: 'Este usuário já está na organização.',
          variant: 'destructive',
        });
        return;
      }

      // For now, just show a message that this feature needs backend setup
      // In production, this would use supabase.auth.admin.inviteUserByEmail
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'O convite por email será implementado em breve. Por favor, peça ao usuário para se registrar primeiro.',
      });

      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'user' });
      loadMembers();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Erro ao convidar',
        description: 'Não foi possível enviar o convite. Verifique se o email está correto.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await (supabase as any)
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Função atualizada',
        description: `A função do usuário foi alterada para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}.`,
      });

      loadMembers();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar a função do usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário da organização?')) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido da organização.',
      });

      loadMembers();
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenPermissions = (member: OrganizationMember) => {
    setSelectedMember(member);
    setPermissionsModalOpen(true);
  };

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    const email = member.user?.email?.toLowerCase() || '';
    const name = member.user?.raw_user_meta_data?.full_name?.toLowerCase() || '';
    return email.includes(searchLower) || name.includes(searchLower);
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Proprietário
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            <UserCog className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            Usuário
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600/30">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie os usuários da sua organização e suas permissões
          </p>
        </div>
        
        {canManageUsers && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar usuário
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários da Organização</CardTitle>
              <CardDescription>
                {members.length} usuário{members.length !== 1 ? 's' : ''} na organização
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente ajustar os termos de busca'
                  : 'Adicione usuários à sua organização para começar'}
              </p>
              {!searchTerm && canManageUsers && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro usuário
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.user?.email || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user?.raw_user_meta_data?.full_name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageUsers && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenPermissions(member)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Gerenciar permissões
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleRoleChange(
                                  member.id,
                                  member.role === 'admin' ? 'user' : 'admin'
                                )
                              }
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              {member.role === 'admin'
                                ? 'Mudar para Usuário'
                                : 'Mudar para Administrador'}
                            </DropdownMenuItem>
                            <Separator className="my-1" />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover da organização
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convidar Usuário
            </DialogTitle>
            <DialogDescription>
              Envie um convite para um novo usuário participar da sua organização.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <select
                id="role"
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'user' })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar convite'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      {selectedMember && (
        <UserPermissionsModal
          isOpen={permissionsModalOpen}
          onClose={() => {
            setPermissionsModalOpen(false);
            setSelectedMember(null);
          }}
          userId={selectedMember.user_id}
          userName={selectedMember.user?.raw_user_meta_data?.full_name || 'Usuário'}
          userEmail={selectedMember.user?.email || ''}
        />
      )}
    </div>
  );
}
