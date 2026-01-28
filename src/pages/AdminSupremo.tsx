import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Building2, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Shield,
  LogOut,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { OrganizationsList } from '@/components/admin/OrganizationsList';
import { FeatureFlagsManager } from '@/components/admin/FeatureFlagsManager';
import { SuperAdminSettings } from '@/components/admin/SuperAdminSettings';

type TabValue = 'dashboard' | 'organizations' | 'feature-flags' | 'settings';

export default function AdminSupremo() {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">
          Carregando Painel Admin...
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/gerarorcamento" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SuperAdminDashboard />;
      case 'organizations':
        return <OrganizationsList />;
      case 'feature-flags':
        return <FeatureFlagsManager />;
      case 'settings':
        return <SuperAdminSettings />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/gerarorcamento')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao App
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Painel Admin Supremo</h1>
                <p className="text-xs text-muted-foreground">Controle total da plataforma</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Super Admin
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] hidden lg:block">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'organizations' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab('organizations')}
            >
              <Building2 className="h-4 w-4" />
              Organizações
            </Button>
            <Button
              variant={activeTab === 'feature-flags' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab('feature-flags')}
            >
              <Settings className="h-4 w-4" />
              Feature Flags
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab('settings')}
            >
              <Shield className="h-4 w-4" />
              Configurações
            </Button>
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden w-full px-4 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="organizations">
                <Building2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="feature-flags">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Shield className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}