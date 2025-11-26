import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { Material } from '@/types/orcamento';

interface MaterialSelectorProps {
  categoria: 'tecido' | 'forro' | 'trilho' | 'acessorio';
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroLinha, setFiltroLinha] = useState<string | null>(null);
  const [filtroCor, setFiltroCor] = useState<string | null>(null);

  const selectedMaterial = materiais.find((m) => m.id === value);

  // Extrair valores únicos para os filtros
  const tiposUnicos = Array.from(new Set(materiais.filter(m => m.tipo).map(m => m.tipo))).sort();
  const linhasUnicas = Array.from(new Set(materiais.filter(m => m.linha).map(m => m.linha))).sort();
  const coresUnicas = Array.from(new Set(materiais.filter(m => m.cor).map(m => m.cor))).sort();

  // Aplicar filtros
  const materiaisFiltrados = materiais.filter((material) => {
    const matchSearch = 
      search === '' ||
      material.nome.toLowerCase().includes(search.toLowerCase()) ||
      material.codigo_item?.toLowerCase().includes(search.toLowerCase());
    
    const matchTipo = !filtroTipo || material.tipo === filtroTipo;
    const matchLinha = !filtroLinha || material.linha === filtroLinha;
    const matchCor = !filtroCor || material.cor === filtroCor;

    return matchSearch && matchTipo && matchLinha && matchCor;
  });

  // Agrupar por linha se houver linhas
  const materiaisAgrupados = linhasUnicas.length > 0
    ? linhasUnicas.reduce((acc, linha) => {
        const materiaisDaLinha = materiaisFiltrados.filter(m => m.linha === linha);
        if (materiaisDaLinha.length > 0) {
          acc[linha] = materiaisDaLinha;
        }
        return acc;
      }, {} as Record<string, Material[]>)
    : { 'Todos': materiaisFiltrados };

  const limparFiltros = () => {
    setFiltroTipo(null);
    setFiltroLinha(null);
    setFiltroCor(null);
    setSearch('');
  };

  const temFiltrosAtivos = filtroTipo || filtroLinha || filtroCor || search;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedMaterial ? (
              <span className="truncate">{selectedMaterial.codigo_item} - {selectedMaterial.nome}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar por nome ou código..."
              value={search}
              onValueChange={setSearch}
            />
            
            {/* Filtros */}
            <div className="border-b px-3 py-2 space-y-2">
              {tiposUnicos.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tipo:</p>
                  <div className="flex flex-wrap gap-1">
                    {tiposUnicos.map((tipo) => {
                      const count = materiais.filter(m => m.tipo === tipo).length;
                      return (
                        <Badge
                          key={tipo}
                          variant={filtroTipo === tipo ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setFiltroTipo(filtroTipo === tipo ? null : tipo)}
                        >
                          {tipo} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {linhasUnicas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Linha:</p>
                  <div className="flex flex-wrap gap-1">
                    {linhasUnicas.map((linha) => {
                      const count = materiais.filter(m => m.linha === linha).length;
                      return (
                        <Badge
                          key={linha}
                          variant={filtroLinha === linha ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setFiltroLinha(filtroLinha === linha ? null : linha)}
                        >
                          {linha} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {coresUnicas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cor:</p>
                  <div className="flex flex-wrap gap-1">
                    {coresUnicas.map((cor) => {
                      const count = materiais.filter(m => m.cor === cor).length;
                      return (
                        <Badge
                          key={cor}
                          variant={filtroCor === cor ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setFiltroCor(filtroCor === cor ? null : cor)}
                        >
                          {cor} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {temFiltrosAtivos && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={limparFiltros}
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>

            <CommandList>
              <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
              
              {optional && (
                <CommandGroup heading="Opções">
                  <CommandItem
                    value="none"
                    onSelect={() => {
                      onSelect(undefined);
                      setOpen(false);
                      limparFiltros();
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Sem {categoria}
                  </CommandItem>
                </CommandGroup>
              )}

              {Object.entries(materiaisAgrupados).map(([grupo, materiais]) => (
                <CommandGroup key={grupo} heading={grupo !== 'Todos' ? grupo : undefined}>
                  {materiais.map((material) => (
                    <CommandItem
                      key={material.id}
                      value={`${material.codigo_item} ${material.nome}`}
                      onSelect={() => {
                        onSelect(material.id);
                        setOpen(false);
                        limparFiltros();
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === material.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{material.codigo_item}</div>
                        <div className="text-xs text-muted-foreground">{material.nome}</div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        R$ {material.preco_custo.toFixed(2)}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Preview do material selecionado */}
      {selectedMaterial && (
        <div className="text-sm p-2 bg-muted rounded border border-border space-y-1">
          <p className="font-medium">{selectedMaterial.nome}</p>
          <div className="grid grid-cols-2 gap-x-4 text-muted-foreground">
            <p><strong>Código:</strong> {selectedMaterial.codigo_item}</p>
            <p><strong>Custo:</strong> R$ {selectedMaterial.preco_custo.toFixed(2)}/{selectedMaterial.unidade}</p>
            {selectedMaterial.largura_metro && (
              <p><strong>Largura:</strong> {selectedMaterial.largura_metro}m</p>
            )}
            {selectedMaterial.tipo && (
              <p><strong>Tipo:</strong> {selectedMaterial.tipo}</p>
            )}
            {selectedMaterial.linha && (
              <p className="col-span-2"><strong>Linha:</strong> {selectedMaterial.linha}</p>
            )}
            {selectedMaterial.cor && (
              <p><strong>Cor:</strong> {selectedMaterial.cor}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
