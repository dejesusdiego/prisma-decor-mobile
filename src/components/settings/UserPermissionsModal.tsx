import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  usePermissions,
  useUpdatePermissions,
  useMemberPermissions,
  type UserPermissions,
} from '@/hooks/usePermissions';
import {
  FileText,
  Package,
  Factory,
  DollarSign,
  Users,
  Warehouse,
  Settings,
  Truck,
  BarChart3,
  Loader2,
} from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

interface PermissionGroup {
  title: string;
  icon: React.ReactNode;
  permissions: {
    key: keyof UserPermissions;
    label: string;
    description?: string;
  }[];
}

const permissionGroups: PermissionGroup[] = [
  {
    title: 'Orçamentos',
    icon: <FileText className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_orcamentos', label: 'Acessar orçamentos', description: 'Visualizar lista de orçamentos' },
      { key: 'can_create_orcamentos', label: 'Criar orçamentos', description: 'Criar novos orçamentos' },
      { key: 'can_edit_orcamentos', label: 'Editar orçamentos', description: 'Modificar orçamentos existentes' },
      { key: 'can_delete_orcamentos', label: 'Excluir orçamentos', description: 'Remover orçamentos permanentemente' },
    ],
  },
  {
    title: 'Pedidos',
    icon: <Package className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_pedidos', label: 'Acessar pedidos', description: 'Visualizar lista de pedidos' },
      { key: 'can_create_pedidos', label: 'Criar pedidos', description: 'Criar novos pedidos' },
      { key: 'can_edit_pedidos', label: 'Editar pedidos', description: 'Modificar pedidos existentes' },
      { key: 'can_delete_pedidos', label: 'Excluir pedidos', description: 'Remover pedidos permanentemente' },
    ],
  },
  {
    title: 'Produção',
    icon: <Factory className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_producao', label: 'Acessar produção', description: 'Visualizar painel de produção' },
      { key: 'can_edit_producao', label: 'Editar produção', description: 'Atualizar status de produção' },
      { key: 'can_manage_producao', label: 'Gerenciar produção', description: 'Controle completo da produção' },
    ],
  },
  {
    title: 'Financeiro',
    icon: <DollarSign className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_financeiro', label: 'Acessar financeiro', description: 'Visualizar dados financeiros' },
      { key: 'can_edit_financeiro', label: 'Editar financeiro', description: 'Lançar transações' },
      { key: 'can_view_all_financeiro', label: 'Ver tudo', description: 'Acesso a todas as informações financeiras' },
    ],
  },
  {
    title: 'CRM',
    icon: <Users className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_crm', label: 'Acessar CRM', description: 'Visualizar contatos e pipeline' },
      { key: 'can_edit_crm', label: 'Editar CRM', description: 'Criar e editar contatos' },
      { key: 'can_delete_crm', label: 'Excluir CRM', description: 'Remover contatos' },
    ],
  },
  {
    title: 'Estoque',
    icon: <Warehouse className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_estoque', label: 'Acessar estoque', description: 'Visualizar estoque' },
      { key: 'can_edit_estoque', label: 'Editar estoque', description: 'Atualizar quantidades' },
      { key: 'can_manage_estoque', label: 'Gerenciar estoque', description: 'Controle completo do estoque' },
    ],
  },
  {
    title: 'Fornecedores',
    icon: <Truck className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_fornecedores', label: 'Acessar fornecedores', description: 'Visualizar catálogo de fornecedores' },
      { key: 'can_edit_fornecedores', label: 'Editar fornecedores', description: 'Gerenciar fornecedores' },
    ],
  },
  {
    title: 'Relatórios',
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_relatorios', label: 'Acessar relatórios', description: 'Visualizar relatórios' },
      { key: 'can_export_relatorios', label: 'Exportar relatórios', description: 'Exportar dados em PDF/Excel' },
    ],
  },
  {
    title: 'Configurações',
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      { key: 'can_access_configuracoes', label: 'Acessar configurações', description: 'Visualizar configurações' },
      { key: 'can_manage_users', label: 'Gerenciar usuários', description: 'Criar e editar usuários' },
      { key: 'can_manage_organization', label: 'Gerenciar organização', description: 'Alterar configurações da organização' },
    ],
  },
];

const defaultPermissions: UserPermissions = {
  can_access_orcamentos: true,
  can_create_orcamentos: true,
  can_edit_orcamentos: true,
  can_delete_orcamentos: false,
  can_access_pedidos: true,
  can_create_pedidos: true,
  can_edit_pedidos: true,
  can_delete_pedidos: false,
  can_access_producao: true,
  can_edit_producao: true,
  can_manage_producao: false,
  can_access_financeiro: true,
  can_edit_financeiro: false,
  can_view_all_financeiro: false,
  can_access_crm: true,
  can_edit_crm: true,
  can_delete_crm: false,
  can_access_estoque: true,
  can_edit_estoque: false,
  can_manage_estoque: false,
  can_access_configuracoes: false,
  can_manage_users: false,
  can_manage_organization: false,
  can_access_fornecedores: true,
  can_edit_fornecedores: false,
  can_access_relatorios: true,
  can_export_relatorios: false,
};

export function UserPermissionsModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}: UserPermissionsModalProps) {
  const { toast } = useToast();
  const { data: existingPermissions } = useMemberPermissions(userId);
  const updatePermissions = useUpdatePermissions();
  
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [activeTab, setActiveTab] = useState<string>(permissionGroups[0].title);

  useEffect(() => {
    if (existingPermissions) {
      setPermissions(existingPermissions);
    }
  }, [existingPermissions]);

  const handlePermissionChange = (key: keyof UserPermissions, checked: boolean) => {
    setPermissions((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = async () => {
    try {
      await updatePermissions.mutateAsync({
        userId,
        permissions,
      });
      
      toast({
        title: 'Permissões atualizadas',
        description: `As permissões de ${userName} foram atualizadas com sucesso.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar as permissões. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    const allEnabled: UserPermissions = Object.keys(defaultPermissions).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as UserPermissions
    );
    setPermissions(allEnabled);
  };

  const handleDeselectAll = () => {
    const allDisabled: UserPermissions = Object.keys(defaultPermissions).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as UserPermissions
    );
    setPermissions(allDisabled);
  };

  const activeGroup = permissionGroups.find((g) => g.title === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissões do Usuário
          </DialogTitle>
          <DialogDescription>
            Configure as permissões de acesso para <strong>{userName}</strong> ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-56 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {permissionGroups.map((group) => (
                  <button
                    key={group.title}
                    onClick={() => setActiveTab(group.title)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === group.title
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {group.icon}
                    {group.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {activeGroup && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {activeGroup.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{activeGroup.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure as permissões para {activeGroup.title.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {activeGroup.permissions.map((permission) => (
                      <div
                        key={permission.key}
                        className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={permission.key}
                          checked={permissions[permission.key]}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(permission.key, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={permission.key}
                            className="font-medium cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                          {permission.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Quick Actions */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Selecionar tudo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Desmarcar tudo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPermissions(defaultPermissions)}
                >
                  Restaurar padrão
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updatePermissions.isPending}
          >
            {updatePermissions.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar permissões'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
