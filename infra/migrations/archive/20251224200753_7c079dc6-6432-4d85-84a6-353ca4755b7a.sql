-- Enable realtime for itens_pedido table to track status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;