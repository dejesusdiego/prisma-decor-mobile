import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, Key, Loader2, RefreshCw, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  deleted_at?: string | null;
  status?: 'active' | 'inactive';
}

export default function GerenciarUsuarios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Create user form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Users list state
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Password change dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  // Delete/Restore dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Marcar status baseado no deleted_at
      const usersWithStatus = (data.users || []).map((u: UserData) => ({
        ...u,
        status: u.deleted_at ? 'inactive' : 'active'
      }));
      
      setUsers(usersWithStatus);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error(error.message || 'Erro ao carregar lista de usuários');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/gerarorcamento`
        }
      });

      if (signUpError) throw signUpError;

      if (!newUser.user) {
        throw new Error('Erro ao criar usuário');
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role
        });

      if (roleError) throw roleError;

      toast.success(`Usuário criado com sucesso! Role: ${role}`);
      setEmail('');
      setPassword('');
      setRole('user');
      
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPasswordDialog = (userData: UserData) => {
    setSelectedUser(userData);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: selectedUser.id,
          newPassword: newPassword,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Senha alterada com sucesso!');
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Soft delete handlers
  const handleOpenDeleteDialog = (userData: UserData) => {
    setSelectedUser(userData);
    setDeleteDialogOpen(true);
  };

  const handleOpenRestoreDialog = (userData: UserData) => {
    setSelectedUser(userData);
    setRestoreDialogOpen(true);
  };

  const handleSoftDelete = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await (supabase.rpc as any)('soft_delete_user', {
        p_user_id: selectedUser.id
      });

      if (error) throw error;

      toast.success('Usuário desativado com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      toast.error(error.message || 'Erro ao desativar usuário');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await (supabase.rpc as any)('restore_user', {
        p_user_id: selectedUser.id
      });

      if (error) throw error;

      toast.success('Usuário restaurado com sucesso!');
      setRestoreDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao restaurar usuário:', error);
      toast.error(error.message || 'Erro ao restaurar usuário');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter users by status
  const activeUsers = users.filter(u => !u.deleted_at);
  const inactiveUsers = users.filter(u => u.deleted_at);

  const renderUserTable = (userList: UserData[], isInactive: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Permissão</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.map((userData) => (
          <TableRow key={userData.id} className={isInactive ? 'opacity-60' : ''}>
            <TableCell className="font-medium">
              {userData.email}
              {isInactive && (
                <Badge variant="outline" className="ml-2 text-muted-foreground">
                  Inativo
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                {userData.role === 'admin' ? 'Admin' : 'Usuário'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(userData.created_at).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {!isInactive && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPasswordDialog(userData)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Senha
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleOpenDeleteDialog(userData)}
                      disabled={userData.id === user?.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desativar
                    </Button>
                  </>
                )}
                {isInactive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:bg-green-50"
                    onClick={() => handleOpenRestoreDialog(userData)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/gerarorcamento')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Create User Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Criar Novo Usuário
              </CardTitle>
              <CardDescription>
                Adicione um novo membro à equipe interna
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Permissão</Label>
                  <Select value={role} onValueChange={(value: 'admin' | 'user') => setRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário (apenas orçamentos)</SelectItem>
                      <SelectItem value="admin">Admin (acesso total)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Usuários podem criar orçamentos. Admins podem gerenciar preços e usuários.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>
                Sobre o gerenciamento de usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Tipos de Permissão</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>Usuário:</strong> Pode criar e gerenciar seus próprios orçamentos</li>
                  <li><strong>Admin:</strong> Acesso completo ao sistema, incluindo gerenciamento de preços e usuários</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Desativação de Usuários</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Usuários desativados não podem fazer login</li>
                  <li>• Orçamentos existentes são preservados</li>
                  <li>• Usuários podem ser reativados posteriormente</li>
                  <li>• Você não pode desativar seu próprio usuário</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Usuário logado:</strong> {user?.email}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List Section with Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuários Existentes</CardTitle>
                <CardDescription>
                  Gerencie usuários ativos e inativos
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoadingUsers}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'inactive')}>
              <TabsList className="mb-4">
                <TabsTrigger value="active">
                  Ativos ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Inativos ({inactiveUsers.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
                  </div>
                ) : activeUsers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum usuário ativo encontrado
                  </p>
                ) : (
                  renderUserTable(activeUsers, false)
                )}
              </TabsContent>
              
              <TabsContent value="inactive">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
                  </div>
                ) : inactiveUsers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum usuário inativo
                  </p>
                ) : (
                  renderUserTable(inactiveUsers, true)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Definir nova senha para: <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={isChangingPassword}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || newPassword.length < 6}
            >
              {isChangingPassword ? (
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Desativar Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar o usuário <strong>{selectedUser?.email}</strong>?
              <br /><br />
              O usuário não poderá mais fazer login, mas todos os seus orçamentos serão preservados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSoftDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Desativar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <RotateCcw className="h-5 w-5" />
              Restaurar Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar o usuário <strong>{selectedUser?.email}</strong>?
              <br /><br />
              O usuário poderá fazer login novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleRestore}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
