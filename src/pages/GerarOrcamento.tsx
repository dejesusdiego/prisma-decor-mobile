import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GerarOrcamento() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Orçamentos</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/gerenciarusuarios')}
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bem-vindo ao Sistema de Orçamentos</h2>
          <p className="text-gray-600">
            Esta é a página principal do sistema de orçamentos. Aqui você poderá criar e gerenciar orçamentos de cortinas.
          </p>
        </div>
      </main>
    </div>
  );
}
