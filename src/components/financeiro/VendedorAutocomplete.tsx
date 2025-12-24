import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendedorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

interface Usuario {
  id: string;
  email: string;
}

export function VendedorAutocomplete({
  value,
  onChange,
  label = 'Vendedor',
  placeholder = 'Digite o nome ou email do vendedor...',
  className
}: VendedorAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Buscar usuários do sistema
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios-vendedores'],
    queryFn: async () => {
      // Buscar vendedores únicos das comissões existentes
      const { data: comissoes } = await supabase
        .from('comissoes')
        .select('vendedor_nome')
        .order('vendedor_nome');
      
      const vendedoresExistentes = Array.from(
        new Set(comissoes?.map(c => c.vendedor_nome).filter(Boolean) || [])
      );

      return vendedoresExistentes.map(nome => ({
        id: nome,
        email: nome
      }));
    }
  });

  // Filtrar usuários baseado na busca
  const filteredUsuarios = usuarios.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sincronizar valor externo
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (email: string) => {
    setInputValue(email);
    onChange(email);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && <Label>{label} *</Label>}
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {/* Dropdown */}
        {isOpen && (filteredUsuarios.length > 0 || searchTerm) && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
            {filteredUsuarios.length > 0 ? (
              filteredUsuarios.map(usuario => (
                <button
                  key={usuario.id}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 transition-colors",
                    inputValue === usuario.email && "bg-accent"
                  )}
                  onClick={() => handleSelect(usuario.email)}
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{usuario.email}</span>
                  {inputValue === usuario.email && (
                    <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                  )}
                </button>
              ))
            ) : searchTerm ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum vendedor encontrado. O nome digitado será usado.
              </div>
            ) : null}
            
            {/* Opção para usar o valor digitado */}
            {searchTerm && !filteredUsuarios.some(u => u.email.toLowerCase() === searchTerm.toLowerCase()) && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent border-t border-border flex items-center gap-2"
                onClick={() => handleSelect(searchTerm)}
              >
                <span className="text-primary">+</span>
                <span>Usar "{searchTerm}"</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
