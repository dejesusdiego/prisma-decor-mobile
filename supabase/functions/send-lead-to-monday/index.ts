import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  message?: string;
  scheduledDate: string;
  scheduledTime: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData: LeadData = await req.json();
    console.log('Recebendo lead:', leadData);

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN');
    
    if (!mondayApiToken) {
      throw new Error('MONDAY_API_TOKEN não configurado');
    }

    // IMPORTANTE: Você precisa configurar estes valores do seu Monday.com:
    // 1. Vá em https://monday.com/ e acesse seu board
    // 2. O board_id está na URL: https://monday.com/boards/[BOARD_ID]
    // 3. O group_id você encontra clicando nos 3 pontos do grupo e em "Copy group ID"
    // 4. Os IDs das colunas você encontra em: Board Settings > Columns > clique na coluna > o ID aparece na URL
    
    // Substitua os valores abaixo pelos seus:
    const MONDAY_BOARD_ID = "18338210789"; // ⚠️ ALTERAR: seu board_id aqui
    const MONDAY_GROUP_ID = "topics"; // ⚠️ ALTERAR: seu group_id aqui
    
    // Mapeamento de colunas do Monday.com:
    // name = Nome do item (usado no item_name)
    // lead_status = Status (NOVO LEAD já configurado como padrão)
    // lead_email = E-mail
    // lead_phone = Telefone
    // text_mkxchhsz = Cidade
    // date_mkxcyp8r = Data (formato: YYYY-MM-DD)
    // hour_mkxck3dh = Hora (formato: HH:MM)
    // text_mkxcvcxn = Endereço
    // text_mkxcd71p = Mensagem
    
    // Criar item no Monday.com usando GraphQL
    const mutation = `
      mutation {
        create_item (
          board_id: ${MONDAY_BOARD_ID},
          group_id: "${MONDAY_GROUP_ID}",
          item_name: "${leadData.name} - ${leadData.city}",
          column_values: "{\\"lead_email\\":\\"${leadData.email}\\",\\"lead_phone\\":\\"${leadData.phone}\\",\\"text_mkxchhsz\\":\\"${leadData.city}\\",\\"date_mkxcyp8r\\":{\\"date\\":\\"${leadData.scheduledDate}\\"},\\"hour_mkxck3dh\\":{\\"hour\\":\\"${leadData.scheduledTime}\\",\\"minute\\":\\"00\\"},\\"text_mkxcvcxn\\":\\"${leadData.address}\\",\\"text_mkxcd71p\\":\\"${leadData.message || 'Sem mensagem'}\\",\\"lead_status\\":{\\"label\\":\\"Novo Lead\\"}}"
        ) {
          id
          name
        }
      }
    `;

    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation }),
    });

    const mondayData = await mondayResponse.json();
    
    if (mondayData.errors) {
      console.error('Erro do Monday.com:', mondayData.errors);
      throw new Error('Erro ao criar item no Monday.com');
    }

    console.log('Lead enviado ao Monday.com com sucesso:', mondayData);

    // Enviar também para WhatsApp
    const phoneNumber = "5561992696556";
    const whatsappMessage = encodeURIComponent(
      `🎯 *Novo Agendamento*\n\n` +
      `📅 *Data:* ${leadData.scheduledDate}\n` +
      `🕐 *Horário:* ${leadData.scheduledTime}\n\n` +
      `👤 *Nome:* ${leadData.name}\n` +
      `📧 *Email:* ${leadData.email}\n` +
      `📱 *Telefone:* ${leadData.phone}\n` +
      `🏙️ *Cidade:* ${leadData.city}\n` +
      `📍 *Endereço:* ${leadData.address}\n` +
      (leadData.message ? `💬 *Mensagem:* ${leadData.message}` : '')
    );
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        mondayItemId: mondayData.data.create_item.id,
        whatsappUrl 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
