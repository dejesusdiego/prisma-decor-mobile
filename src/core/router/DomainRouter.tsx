import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy load dos routers de cada módulo
const AdminRouter = lazy(() => import('@modules/admin/router'))
const OrgRouter = lazy(() => import('@modules/org/router'))
const SupplierRouter = lazy(() => import('@modules/supplier/router'))
const MarketingRouter = lazy(() => import('@modules/marketing/router'))

// Loading component
function RouterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}

// Extrai slug de organização do hostname
function extractOrgSlug(hostname: string): string | null {
  if (hostname.endsWith('.studioos.pro') || hostname.endsWith('.studioos.com.br')) {
    const subdomain = hostname.split('.')[0]
    const reserved = ['admin', 'fornecedores', 'fornecedor', 'app', 'www', 'api']
    if (reserved.includes(subdomain)) return null
    return subdomain.replace(/-app$/, '')
  }
  return null
}

export function DomainRouter() {
  const hostname = window.location.hostname
  const orgSlug = extractOrgSlug(hostname)

  // Determina qual router carregar baseado no hostname
  const getRouter = () => {
    // Domínios reservados
    if (hostname.startsWith('admin.')) {
      return <AdminRouter />
    }

    if (hostname.startsWith('fornecedores.') || hostname.startsWith('fornecedor.')) {
      return <SupplierRouter />
    }

    // Subdomínio de organização (landing page)
    if (orgSlug) {
      return <MarketingRouter orgSlug={orgSlug} />
    }

    // Domínio principal ou app.studioos.pro
    return <OrgRouter />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<RouterLoading />}>
        {getRouter()}
      </Suspense>
    </BrowserRouter>
  )
}

export { extractOrgSlug }
