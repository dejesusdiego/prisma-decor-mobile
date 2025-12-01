import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Material } from '@/types/orcamento';

interface MaterialSelectorProps {
  categoria: 'tecido' | 'forro' | 'trilho' | 'acessorio' | 'persiana';
  materiais: Material[];
  value?: string;
  onSelect: (materialId: string | undefined) => void;
  placeholder?: string;
  optional?: boolean;
}

export function MaterialSelector({
  categoria,
  materiais,
  value,
  onSelect,
  placeholder = 'Selecionar material',
  optional = true,
}: MaterialSelectorProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroLinha, setFiltroLinha] = useState<string>('');
  const [filtroCor, setFiltroCor] = useState<string>('');

  const selectedMaterial = materiais.find((m) => m.id === value);

  // Quando o material já está selecionado, preencher os filtros automaticamente
  useEffect(() => {
    if (selectedMaterial) {
      if (selectedMaterial.tipo) setFiltroTipo(selectedMaterial.tipo);
      if (selectedMaterial.linha) setFiltroLinha(selectedMaterial.linha);
      if (selectedMaterial.cor) setFiltroCor(selectedMaterial.cor);
    }
  }, [selectedMaterial]);

  // Extrair valores únicos para cada filtro
  const tiposUnicos = Array.from(new Set(materiais.filter(m => m.tipo).map(m => m.tipo!))).sort();
  
  const linhasDisponiveis = Array.from(
    new Set(
      materiais
        .filter(m => m.linha && (!filtroTipo || m.tipo === filtroTipo))
        .map(m => m.linha!)
    )
  ).sort();
  
  const coresDisponiveis = Array.from(
    new Set(
      materiais
        .filter(m => 
          m.cor && 
          (!filtroTipo || m.tipo === filtroTipo) &&
          (!filtroLinha || m.linha === filtroLinha)
        )
        .map(m => m.cor!)
    )
  ).sort();

  // Materiais filtrados progressivamente
  const materiaisFiltrados = materiais.filter((material) => {
    const matchTipo = !filtroTipo || material.tipo === filtroTipo;
    const matchLinha = !filtroLinha || material.linha === filtroLinha;
    const matchCor = !filtroCor || material.cor === filtroCor;
    return matchTipo && matchLinha && matchCor;
  });

  // Ao mudar tipo, resetar linha e cor
  const handleTipoChange = (tipo: string) => {
    setFiltroTipo(tipo);
    setFiltroLinha('');
    setFiltroCor('');
    onSelect(undefined);
  };

  // Ao mudar linha, resetar cor
  const handleLinhaChange = (linha: string) => {
    setFiltroLinha(linha);
    setFiltroCor('');
    onSelect(undefined);
  };

  // Ao mudar cor, resetar seleção
  const handleCorChange = (cor: string) => {
    setFiltroCor(cor);
    onSelect(undefined);
  };

  const temFiltros = tiposUnicos.length > 0 || linhasDisponiveis.length > 0 || coresDisponiveis.length > 0;

  return (
    <div className="space-y-3">
      {/* Filtros Cascateados */}
      {temFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg border border-border">
          {/* Filtro Tipo */}
          {tiposUnicos.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">1. Tipo</Label>
              <Select value={filtroTipo} onValueChange={handleTipoChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_todos">Todos os tipos</SelectItem>
                  {tiposUnicos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro Linha */}
          {linhasDisponiveis.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">2. Linha</Label>
              <Select 
                value={filtroLinha} 
                onValueChange={handleLinhaChange}
                disabled={!filtroTipo || filtroTipo === '_todos'}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a linha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_todos">Todas as linhas</SelectItem>
                  {linhasDisponiveis.map((linha) => (
                    <SelectItem key={linha} value={linha}>
                      {linha}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro Cor */}
          {coresDisponiveis.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">3. Cor</Label>
              <Select 
                value={filtroCor} 
                onValueChange={handleCorChange}
                disabled={!filtroLinha || filtroLinha === '_todos'}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_todos">Todas as cores</SelectItem>
                  {coresDisponiveis.map((cor) => (
                    <SelectItem key={cor} value={cor}>
                      {cor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Seleção do Material */}
      <div className="space-y-1.5">
        <Label>
          {temFiltros ? '4. ' : ''}{placeholder}
          {materiaisFiltrados.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({materiaisFiltrados.length} {materiaisFiltrados.length === 1 ? 'opção' : 'opções'})
            </span>
          )}
        </Label>
        <Select
          value={value || 'none'}
          onValueChange={(val) => onSelect(val === 'none' ? undefined : val)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {optional && <SelectItem value="none">Sem {categoria}</SelectItem>}
            
            {materiaisFiltrados.length === 0 ? (
              <SelectItem value="_empty" disabled>
                {temFiltros && (filtroTipo || filtroLinha || filtroCor) 
                  ? 'Nenhum material encontrado com esses filtros'
                  : 'Nenhum material disponível'
                }
              </SelectItem>
            ) : (
              materiaisFiltrados.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.codigo_item} - {material.nome}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Preview do Material Selecionado */}
      {selectedMaterial && (
        <div className="text-sm p-3 bg-muted rounded-lg border border-border space-y-1">
          <p className="font-medium text-foreground">{selectedMaterial.nome}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div>
              <strong className="text-foreground">Código:</strong> {selectedMaterial.codigo_item}
            </div>
            <div>
              <strong className="text-foreground">Custo:</strong> R$ {selectedMaterial.preco_custo.toFixed(2)}/{selectedMaterial.unidade}
            </div>
            {selectedMaterial.largura_metro && (
              <div>
                <strong className="text-foreground">Largura:</strong> {selectedMaterial.largura_metro}m
              </div>
            )}
            {selectedMaterial.area_min_fat && (
              <div>
                <strong className="text-foreground">Área mín. fat.:</strong> {selectedMaterial.area_min_fat} m²
              </div>
            )}
            {selectedMaterial.tipo && (
              <div>
                <strong className="text-foreground">Tipo:</strong> {selectedMaterial.tipo}
              </div>
            )}
            {selectedMaterial.linha && (
              <div className="col-span-2">
                <strong className="text-foreground">Linha:</strong> {selectedMaterial.linha}
              </div>
            )}
            {selectedMaterial.cor && (
              <div>
                <strong className="text-foreground">Cor:</strong> {selectedMaterial.cor}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
