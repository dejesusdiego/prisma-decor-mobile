import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierApproval {
  id: string;
  user_id: string;
  company_name: string;
  trading_name: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  categories: string[];
  service_regions: string[];
  catalog_url: string | null;
  created_at: string;
  updated_at: string;
  // Dados do usuário
  user_email?: string;
  user_created_at?: string;
}

/**
 * Hook para buscar fornecedores pendentes de aprovação
 */
export function useSuppliersPendingApproval() {
  return useQuery({
    queryKey: ['suppliers-pending-approval'],
    queryFn: async (): Promise<SupplierApproval[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`*, user:user_id (email, created_at)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        user_email: item.user?.email,
        user_created_at: item.user?.created_at,
      })) as SupplierApproval[];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para buscar todos os fornecedores (todos os status)
 */
export function useAllSuppliers() {
  return useQuery({
    queryKey: ['suppliers-all'],
    queryFn: async (): Promise<SupplierApproval[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`*, user:user_id (email, created_at)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        user_email: item.user?.email,
        user_created_at: item.user?.created_at,
      })) as SupplierApproval[];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para aprovar um fornecedor
 */
export function useApproveSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await (supabase as any)
        .rpc('approve_supplier', {
          p_supplier_id: supplierId,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Fornecedor aprovado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['suppliers-pending-approval'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] });
    },
    onError: (error: any) => {
      console.error('Erro ao aprovar fornecedor:', error);
      toast.error('Erro ao aprovar fornecedor: ' + error.message);
    },
  });
}

/**
 * Hook para rejeitar um fornecedor
 */
export function useRejectSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, reason }: { supplierId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          status: 'rejected',
          rejection_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Fornecedor rejeitado');
      queryClient.invalidateQueries({ queryKey: ['suppliers-pending-approval'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] });
    },
    onError: (error: any) => {
      console.error('Erro ao rejeitar fornecedor:', error);
      toast.error('Erro ao rejeitar fornecedor: ' + error.message);
    },
  });
}
