import { Suspense, Component, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@core/auth'
import { DomainRouter } from '@core/router/DomainRouter'
import { AlertCircle } from 'lucide-react'
import { Button } from '@core/components/ui/Button'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button onClick={this.handleReset} className="w-full">
              Recarregar página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Global loading fallback
function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Inicializando...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<GlobalLoading />}>
            <DomainRouter />
          </Suspense>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
