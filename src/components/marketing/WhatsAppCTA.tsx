import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppCTAProps {
  phone?: string;
  message?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppCTA({ 
  phone = '5547992624706', 
  message = 'Olá! Gostaria de saber mais sobre o StudioOS.',
  variant = 'default',
  size = 'default',
  className = '',
  children
}: WhatsAppCTAProps) {
  const handleClick = () => {
    const phoneNumber = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`bg-[#25D366] hover:bg-[#20BA5A] text-white ${className}`}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {children || 'Fale no WhatsApp'}
    </Button>
  );
}
