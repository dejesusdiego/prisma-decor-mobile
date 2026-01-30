import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, FileText, Plus, LogOut, Building2 } from 'lucide-react'
import { Button } from '@core/components/ui'
import { useAuth } from '@core/auth'
import { cn } from '@core/lib/utils'

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/orcamentos', icon: FileText, label: 'Orçamentos' },
  { path: '/orcamentos/novo', icon: Plus, label: 'Novo Orçamento' },
]

export function OrgLayout() {
  const location = useLocation()
  const { user, signOut, organizationId } = useAuth()

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
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">StudioOS</h1>
              <p className="text-xs text-muted-foreground">Core ERP</p>
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

        {/* User Info & Logout */}
        <div className="p-4 border-t space-y-3">
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user?.email || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || 'org_user'}
            </p>
          </div>
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
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
