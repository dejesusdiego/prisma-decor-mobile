// Google Analytics & Google Ads helper functions
// Events are automatically sent to both GA4 (G-4SZLQTGPF9) and Google Ads (AW-17709164266)
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Envia para GA4 e Google Ads automaticamente
    window.gtag('event', eventName, eventParams);
    console.log('Event tracked (GA4 + Google Ads):', eventName, eventParams);
  }
};

// Função específica para rastrear conversões no Google Ads
export const trackConversion = (
  conversionLabel?: string,
  value?: number,
  currency: string = 'BRL'
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const params: Record<string, any> = {
      send_to: conversionLabel ? `AW-17709164266/${conversionLabel}` : 'AW-17709164266',
    };
    
    if (value) {
      params.value = value;
      params.currency = currency;
    }
    
    window.gtag('event', 'conversion', params);
    console.log('Google Ads Conversion:', params);
  }
};

// Eventos pré-definidos
export const analytics = {
  // WhatsApp
  clickWhatsApp: (location: 'hero' | 'floating_button') => {
    trackEvent('click_whatsapp', {
      location,
      event_category: 'engagement',
      event_label: 'WhatsApp Contact',
    });
  },

  // Agendamento
  openBookingDialog: (source: 'hero' | 'contact_form') => {
    trackEvent('open_booking_dialog', {
      source,
      event_category: 'lead_generation',
      event_label: 'Booking Dialog Opened',
    });
  },

  submitBooking: (data: {
    hasMessage: boolean;
    city: string;
  }) => {
    trackEvent('submit_booking', {
      ...data,
      event_category: 'lead_generation',
      event_label: 'Booking Form Submitted',
    });
    
    // Rastreia como conversão no Google Ads também
    trackConversion();
  },

  // Navegação
  clickProduct: (productName: string) => {
    trackEvent('click_product', {
      product_name: productName,
      event_category: 'engagement',
      event_label: 'Product Clicked',
    });
  },

  // Contato
  clickPhone: () => {
    trackEvent('click_phone', {
      event_category: 'engagement',
      event_label: 'Phone Contact',
    });
  },

  clickEmail: () => {
    trackEvent('click_email', {
      event_category: 'engagement',
      event_label: 'Email Contact',
    });
  },
};
