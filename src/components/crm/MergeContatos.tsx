import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Merge, 
  Phone, 
  Mail, 
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useContatos, Contato } from '@/hooks/useCRMData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface DuplicateGroup {
  key: string;
  type: 'telefone' | 'email';
  contatos: Contato[];
}

export function MergeContatos() {
  const { data: contatos, isLoading, refetch } = useContatos();
  const { organizationId } = useOrganizationContext();
  
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Identificar contatos duplicados
  const duplicateGroups = useMemo(() => {
    if (!contatos) return [];
    
    const groups: DuplicateGroup[] = [];
    const phoneMap = new Map<string, Contato[]>();
    const emailMap = new Map<string, Contato[]>();

    contatos.forEach(contato => {
      // Agrupar por telefone
      if (contato.telefone) {
        const phoneKey = contato.telefone.replace(/\D/g, '');
        if (phoneKey.length >= 10) {
          if (!phoneMap.has(phoneKey)) {
            phoneMap.set(phoneKey, []);
          }
          phoneMap.get(phoneKey)!.push(contato);
        }
      }

      // Agrupar por email
      if (contato.email && contato.email.includes('@')) {
        const emailKey = contato.email.toLowerCase().trim();
        if (!emailMap.has(emailKey)) {
          emailMap.set(emailKey, []);
        }
        emailMap.get(emailKey)!.push(contato);
      }
    });

    // Adicionar grupos com mais de 1 contato
    phoneMap.forEach((contacts, key) => {
      if (contacts.length > 1) {
        groups.push({ key, type: 'telefone', contatos: contacts });
      }
    });

    emailMap.forEach((contacts, key) => {
      if (contacts.length > 1) {
        // Verificar se não é duplicata do grupo de telefone
        const exists = groups.some(g => 
          g.contatos.length === contacts.length &&
          g.contatos.every(c => contacts.find(c2 => c2.id === c.id))
        );
        if (!exists) {
          groups.push({ key, type: 'email', contatos: contacts });
        }
      }
    });

    return groups;
  }, [contatos]);

  const handleMerge = async () => {
    if (!selectedGroup || !selectedPrimary) return;
    
    setMerging(true);
    try {
      const primaryContact = selectedGroup.contatos.find(c => c.id === selectedPrimary);
      const secondaryIds = selectedGroup.contatos
        .filter(c => c.id !== selectedPrimary)
        .map(c => c.id);

      if (!primaryContact) throw new Error('Contato principal não encontrado');

      // Transferir oportunidades
      await supabase
        .from('oportunidades')
        .update({ contato_id: selectedPrimary })
        .eq('organization_id', organizationId)
        .in('contato_id', secondaryIds);

      // Transferir atividades
      await supabase
        .from('atividades_crm')
        .update({ contato_id: selectedPrimary })
        .eq('organization_id', organizationId)
        .in('contato_id', secondaryIds);

      // Transferir orçamentos
      await supabase
        .from('orcamentos')
        .update({ contato_id: selectedPrimary })
        .eq('organization_id', organizationId)
        .in('contato_id', secondaryIds);

      // Somar valor_total_gasto
      const totalGasto = selectedGroup.contatos.reduce(
        (sum, c) => sum + (c.valor_total_gasto || 0), 0
      );
      await supabase
        .from('contatos')
        .update({ valor_total_gasto: totalGasto })
        .eq('id', selectedPrimary)
        .eq('organization_id', organizationId);

      // Deletar contatos secundários
      for (const id of secondaryIds) {
        await supabase.from('contatos').delete().eq('id', id).eq('organization_id', organizationId);
      }

      const { ToastMessages } = await import('@/lib/toastMessages');
      ToastMessages.contato.mesclado();
      setSelectedGroup(null);
      setSelectedPrimary(null);
      setConfirmDialogOpen(false);
      refetch();
    } catch (error) {
      const { showHandledError } = await import('@/lib/errorHandler');
      showHandledError(error, 'Erro ao mesclar contatos');
    } finally {
      setMerging(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Merge de Contatos Duplicados
            {duplicateGroups.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {duplicateGroups.length} grupo(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Nenhum contato duplicado encontrado!</p>
              <p className="text-muted-foreground">
                Todos os contatos são únicos por telefone e email.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm">
                  Foram encontrados <strong>{duplicateGroups.length}</strong> grupo(s) de contatos 
                  que podem ser duplicados. Revise e mescle se necessário.
                </p>
              </div>

              {duplicateGroups.map((group) => (
                <Card key={group.key} className="border-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {group.type === 'telefone' ? (
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {group.type === 'telefone' ? 'Mesmo telefone' : 'Mesmo email'}:
                        </span>
                        <Badge variant="outline">{group.key}</Badge>
                      </div>
                      <Badge variant="secondary">
                        {group.contatos.length} contatos
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedGroup?.key === group.key ? (
                      <div className="space-y-4">
                        <p className="text-sm font-medium">
                          Selecione o contato PRINCIPAL (os outros serão mesclados neste):
                        </p>
                        <RadioGroup 
                          value={selectedPrimary || ''} 
                          onValueChange={setSelectedPrimary}
                        >
                          {group.contatos.map((contato) => (
                            <div 
                              key={contato.id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                            >
                              <RadioGroupItem value={contato.id} id={contato.id} className="mt-1" />
                              <Label htmlFor={contato.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{contato.nome}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                      {contato.telefone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {contato.telefone}
                                        </span>
                                      )}
                                      {contato.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {contato.email}
                                        </span>
                                      )}
                                      {contato.cidade && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {contato.cidade}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant={contato.tipo === 'cliente' ? 'default' : 'secondary'}>
                                    {contato.tipo}
                                  </Badge>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedGroup(null);
                              setSelectedPrimary(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={() => setConfirmDialogOpen(true)}
                            disabled={!selectedPrimary}
                          >
                            <Merge className="h-4 w-4 mr-2" />
                            Mesclar Contatos
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {group.contatos.map((contato) => (
                          <div 
                            key={contato.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{contato.nome}</span>
                              <Badge variant="outline" className="text-xs">
                                {contato.tipo}
                              </Badge>
                            </div>
                            {contato.valor_total_gasto && contato.valor_total_gasto > 0 && (
                              <span className="text-sm text-muted-foreground">
                                R$ {contato.valor_total_gasto.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <Merge className="h-4 w-4 mr-2" />
                          Selecionar para Mesclar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar mesclagem de contatos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Manter o contato selecionado como principal</li>
                <li>Transferir todas as oportunidades, atividades e orçamentos</li>
                <li>Somar os valores gastos</li>
                <li>Excluir os contatos duplicados</li>
              </ul>
              <p className="mt-2 font-medium text-destructive">
                Esta ação não pode ser desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={merging}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMerge} disabled={merging}>
              {merging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Mesclagem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
