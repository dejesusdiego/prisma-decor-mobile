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
    // 
    // 1. BOARD_ID: Está na URL quando você acessa seu board
    //    Exemplo: https://monday.com/boards/1234567890
    //
    // 2. GROUP_ID: Para descobrir, use esta query GraphQL no API Playground do Monday
    //    (https://monday.com/ > Seu Avatar > Developers > API Playground):
    //
    //    query {
    //      boards(ids: [SEU_BOARD_ID]) {
    //        groups {
    //          id
    //          title
    //        }
    //      }
    //    }
    //
    //    Isso retornará todos os grupos com seus IDs. Use o ID do grupo desejado.
    //    Exemplos comuns: "topics", "group_title", "new_group"
    //
    // 3. COLUMN IDs: Use a mesma query acima mas adicione 'columns' para ver os IDs:
    //
    //    query {
    //      boards(ids: [SEU_BOARD_ID]) {
    //        columns {
    //          id
    //          title
    //          type
    //        }
    //      }
    //    }
    
    // Substitua os valores abaixo pelos seus:
    const MONDAY_BOARD_ID = "1234567890"; // ⚠️ ALTERAR: seu board_id aqui
    const MONDAY_GROUP_ID = "topics"; // ⚠️ ALTERAR: seu group_id aqui (use a query GraphQL acima para descobrir)
    
    // Formatar data e hora para exibição
    const scheduledDateTime = `${leadData.scheduledDate} às ${leadData.scheduledTime}`;
    
    // Mapeamento de colunas (altere os IDs conforme suas colunas):
    // text = Nome
    // text9 = Email
    // phone = Telefone
    // text0 = Cidade
    // text1 = Endereço
    // long_text = Mensagem
    // text7 = Data/Hora Agendada
    
    // Criar item no Monday.com usando GraphQL
    const mutation = `
      mutation {
        create_item (
          board_id: ${MONDAY_BOARD_ID},
          group_id: "${MONDAY_GROUP_ID}",
          item_name: "${leadData.name} - ${leadData.city}",
          column_values: "{\\"text\\":\\"${leadData.name}\\",\\"text9\\":\\"${leadData.email}\\",\\"phone\\":\\"${leadData.phone}\\",\\"text0\\":\\"${leadData.city}\\",\\"text1\\":\\"${leadData.address}\\",\\"long_text\\":\\"${leadData.message || 'Sem mensagem'}\\",\\"text7\\":\\"${scheduledDateTime}\\"}"
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
