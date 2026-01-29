import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { organization } = useOrganizationContext();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', organization?.id, user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id || !organization?.id) return [];

      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('organization_id', organization.id)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!organization?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', organization?.id, user?.id],
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('organization_id', organization?.id)
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', organization?.id, user?.id],
      });
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return {
    notifications: notifications || [],
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

// Hook para mostrar toast notifications em tempo real
export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organization } = useOrganizationContext();
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !organization?.id) return;

    // Subscribe to new notifications
    const subscription = (supabase as any)
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload: { new: Notification }) => {
          const notification = payload.new;
          
          // Verificar se a notificação é para este usuário ou é geral
          if (notification.user_id && notification.user_id !== user.id) {
            return;
          }

          // Evitar mostrar a mesma notificação múltiplas vezes
          if (notification.id === lastNotificationId) return;
          setLastNotificationId(notification.id);

          // Mostrar toast baseado no tipo
          switch (notification.type) {
            case 'pedido_pronto':
              toast({
                title: '🎉 ' + notification.title,
                description: notification.message || 'Um pedido está pronto para instalação',
                variant: 'default',
                duration: 8000,
              });
              break;
            case 'instalacao_agendada':
              toast({
                title: '📅 ' + notification.title,
                description: notification.message || 'Instalação agendada',
                duration: 6000,
              });
              break;
            case 'instalacao_concluida':
              toast({
                title: '✅ ' + notification.title,
                description: notification.message || 'Instalação concluída com sucesso',
                duration: 6000,
              });
              break;
            default:
              toast({
                title: notification.title,
                description: notification.message || '',
                duration: 5000,
              });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, organization?.id, toast, lastNotificationId]);
}

// Hook para obter notificações não lidas apenas
export function useUnreadNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return {
    notifications: unreadNotifications,
    count: unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
