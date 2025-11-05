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
    
    // Mapeamento de colunas do Monday.com conforme documentação oficial:
    // lead_email = E-mail - Formato JSON: {"email":"email@example.com", "text":"Nome ou label"}
    // lead_phone = Telefone - Formato JSON: {"phone":"+5561...", "countryShortName":"BR"}
    // text_mkxchhsz = Cidade - String simples
    // date_mkxcyp8r = Data - Formato JSON: {"date":"YYYY-MM-DD"}
    // text_mkxczgf3 = Hora - String simples (texto com o range, ex: "14:00 - 15:00")
    // text_mkxcvcxn = Endereço - String simples
    // text_mkxcd71p = Mensagem - String simples
    // lead_status = Status - Formato JSON: {"label":"NOVO LEAD"}
    
    console.log('Preparando dados para Monday.com...');
    
    // Converter data para formato YYYY-MM-DD
    const dateParts = leadData.scheduledDate.split('/');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    // Formatar telefone com + e código do país BR
    const formattedPhone = leadData.phone.startsWith('+') ? leadData.phone : `+55${leadData.phone}`;
    
    // Construir column_values conforme documentação oficial do Monday.com
    // Status não é enviado - Monday.com adiciona automaticamente
    const columnValues = {
      lead_email: {
        email: leadData.email,
        text: leadData.email  // Email como texto de exibição
      },
      lead_phone: {
        phone: formattedPhone,
        countryShortName: "BR"  // Código do país em maiúsculas
      },
      text_mkxchhsz: leadData.city,
      date_mkxcyp8r: {
        date: formattedDate
      },
      text_mkxczgf3: leadData.scheduledTime,  // Hora como texto (range)
      text_mkxcvcxn: leadData.address,
      text_mkxcd71p: leadData.message || 'Sem mensagem'
    };
    
    console.log('Column values:', JSON.stringify(columnValues, null, 2));
    
    // Criar mutation - column_values precisa ser JSON stringify
    const mutation = `
      mutation {
        create_item (
          board_id: ${MONDAY_BOARD_ID},
          group_id: "${MONDAY_GROUP_ID}",
          item_name: "${leadData.name}",
          column_values: ${JSON.stringify(JSON.stringify(columnValues))}
        ) {
          id
          name
        }
      }
    `;
    
    console.log('Enviando mutation para Monday.com...');

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
