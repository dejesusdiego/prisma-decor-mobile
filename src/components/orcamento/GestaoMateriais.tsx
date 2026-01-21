import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { ListaMateriais } from './gestao/ListaMateriais';
import { ListaMateriaisFornecedores } from './gestao/ListaMateriaisFornecedores';
import { ListaServicosConfeccao } from './gestao/ListaServicosConfeccao';
import { ListaServicosInstalacao } from './gestao/ListaServicosInstalacao';
import { ImportarDados } from './ImportarDados';
import { useState } from 'react';

interface GestaoMateriaisProps {
  onVoltar: () => void;
}

export function GestaoMateriais({ onVoltar }: GestaoMateriaisProps) {
  const [abaAtiva, setAbaAtiva] = useState('materiais');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestão de Materiais e Serviços</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie materiais, serviços de confecção e instalação
          </p>
        </div>
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="confeccao">Serviços de Confecção</TabsTrigger>
          <TabsTrigger value="instalacao">Serviços de Instalação</TabsTrigger>
          <TabsTrigger value="importar">Importar Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="mt-6">
          <ListaMateriais />
        </TabsContent>

        <TabsContent value="fornecedores" className="mt-6">
          <ListaMateriaisFornecedores />
        </TabsContent>

        <TabsContent value="confeccao" className="mt-6">
          <ListaServicosConfeccao />
        </TabsContent>

        <TabsContent value="instalacao" className="mt-6">
          <ListaServicosInstalacao />
        </TabsContent>

        <TabsContent value="importar" className="mt-6">
          <ImportarDados onVoltar={() => setAbaAtiva('materiais')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
