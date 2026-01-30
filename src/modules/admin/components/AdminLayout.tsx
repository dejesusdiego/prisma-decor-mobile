import { Outlet, Link, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, Building2, Users, Truck, CreditCard, LogOut } from 'lucide-react'
import { Button } from '@core/components/ui'
import { useAuth } from '@core/auth'
import { cn } from '@core/lib/utils'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/organizations', icon: Building2, label: 'Organizações' },
  { path: '/users', icon: Users, label: 'Usuários' },
  { path: '/suppliers', icon: Truck, label: 'Fornecedores' },
  { path: '/plans', icon: CreditCard, label: 'Planos' },
]

export function AdminLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card min-h-screen flex flex-col">
        {/* Branding */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Portal</h1>
              <p className="text-xs text-muted-foreground">StudioOS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email || 'Administrador'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'super_admin'}</p>
            </div>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
