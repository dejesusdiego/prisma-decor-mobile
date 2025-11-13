// Google Analytics helper functions
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
    window.gtag('event', eventName, eventParams);
    console.log('GA Event:', eventName, eventParams);
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
