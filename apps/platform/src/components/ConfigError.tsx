export function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Erro de Configuração</h1>
        <p className="text-gray-600 mb-4">
          As variáveis de ambiente do Supabase não estão configuradas corretamente.
        </p>
        <div className="bg-gray-100 rounded p-3 text-left text-sm">
          <p className="font-semibold mb-2">Verifique se estas variáveis estão definidas:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><code>VITE_SUPABASE_URL</code></li>
            <li><code>VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Configure no dashboard da Vercel em Settings → Environment Variables
        </p>
      </div>
    </div>
  )
}
