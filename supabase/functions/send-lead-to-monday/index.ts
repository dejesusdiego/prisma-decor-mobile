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
    
    // Formatar data e hora para exibição
    const scheduledDateTime = `${leadData.scheduledDate} às ${leadData.scheduledTime}`;
    
    // Mapeamento de colunas (altere os IDs conforme suas colunas):
    // Para descobrir os IDs, use a query no API Playground:
    // query { boards(ids: 18338210789) { columns { id title type } } }
    //
    // EXEMPLO DE MAPEAMENTO:
    // text = Nome (tipo: text)
    // text9 = Email (tipo: email)  
    // phone = Telefone (tipo: phone)
    // text0 = Cidade (tipo: text)
    // text1 = Endereço (tipo: text)
    // long_text = Mensagem (tipo: long_text)
    // text7 = Data/Hora Agendada (tipo: text)
    // status = Status/Tag (tipo: status) - use {"label": "Novo Lead"}
    //
    // ⚠️ IMPORTANTE: Substitua os IDs abaixo pelos IDs reais das suas colunas!
    
    // Criar item no Monday.com usando GraphQL
    // ⚠️ ATENÇÃO: Substitua os IDs das colunas abaixo pelos IDs corretos do seu board
    // Para adicionar uma tag/status, adicione: \\"status\\":{\\"label\\":\\"Novo Lead\\"}
    const mutation = `
      mutation {
        create_item (
          board_id: ${MONDAY_BOARD_ID},
          group_id: "${MONDAY_GROUP_ID}",
          item_name: "${leadData.name} - ${leadData.city}",
          column_values: "{\\"text\\":\\"${leadData.name}\\",\\"text9\\":\\"${leadData.email}\\",\\"phone\\":\\"${leadData.phone}\\",\\"text0\\":\\"${leadData.city}\\",\\"text1\\":\\"${leadData.address}\\",\\"long_text\\":\\"${leadData.message || 'Sem mensagem'}\\",\\"text7\\":\\"${scheduledDateTime}\\",\\"status\\":{\\"label\\":\\"Novo Lead\\"}}"
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
