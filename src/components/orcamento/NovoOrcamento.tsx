import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EtapaCliente } from './wizard/EtapaCliente';
import { EtapaProdutos } from './wizard/EtapaProdutos';
import { EtapaResumo } from './wizard/EtapaResumo';
import type { DadosOrcamento, Cortina } from '@/types/orcamento';

interface NovoOrcamentoProps {
  onVoltar: () => void;
  orcamentoId?: string | null;
}

export function NovoOrcamento({ onVoltar, orcamentoId }: NovoOrcamentoProps) {
  const [etapa, setEtapa] = useState(1);
  const [dados, setDados] = useState<DadosOrcamento>({
    clienteNome: '',
    clienteTelefone: '',
    ambiente: '',
    observacoes: '',
  });
  const [cortinas, setCortinas] = useState<Cortina[]>([]);
  const [orcamentoIdAtual, setOrcamentoIdAtual] = useState<string | null>(orcamentoId || null);

  const handleAvancarEtapa1 = (dadosCliente: DadosOrcamento, novoOrcamentoId: string) => {
    setDados(dadosCliente);
    setOrcamentoIdAtual(novoOrcamentoId);
    setEtapa(2);
  };

  const handleAvancarEtapa2 = (novasCortinas: Cortina[]) => {
    setCortinas(novasCortinas);
    setEtapa(3);
  };

  const handleVoltar = () => {
    if (etapa === 1) {
      onVoltar();
    } else {
      setEtapa(etapa - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {etapa === 1 ? 'Voltar ao Início' : 'Voltar'}
        </Button>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                num === etapa
                  ? 'bg-primary text-primary-foreground'
                  : num < etapa
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {etapa === 1 && (
        <EtapaCliente
          dados={dados}
          onAvancar={handleAvancarEtapa1}
          onCancelar={onVoltar}
        />
      )}

        {etapa === 2 && orcamentoIdAtual && (
          <EtapaProdutos
            orcamentoId={orcamentoIdAtual}
            produtosIniciais={cortinas}
            onAvancar={handleAvancarEtapa2}
            onVoltar={() => setEtapa(1)}
          />
        )}

      {etapa === 3 && orcamentoIdAtual && (
        <EtapaResumo
          orcamentoId={orcamentoIdAtual}
          cortinas={cortinas}
          dadosCliente={dados}
          onVoltar={() => setEtapa(2)}
          onFinalizar={onVoltar}
        />
      )}
    </div>
  );
}
