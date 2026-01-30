import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Plus } from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/orcamentos', icon: FileText, label: 'Orçamentos' },
  { path: '/orcamentos/novo', icon: Plus, label: 'Novo Orçamento' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 border-r bg-card min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">StudioOS</h1>
        <p className="text-sm text-muted-foreground">Core ERP</p>
      </div>
      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
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
    </aside>
  )
}