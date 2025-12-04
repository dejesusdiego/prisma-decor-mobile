import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisitRequestData {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  endereco?: string;
  complemento?: string;
  mensagem?: string;
  data_agendada: string;
  horario_agendado: string;
}

// Rate limiting simples
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length < 2) {
    errors.push('Nome inválido');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }
  
  if (!data.telefone || typeof data.telefone !== 'string' || data.telefone.length < 10) {
    errors.push('Telefone inválido');
  }
  
  if (!data.cidade || typeof data.cidade !== 'string') {
    errors.push('Cidade inválida');
  }
  
  if (!data.data_agendada || typeof data.data_agendada !== 'string') {
    errors.push('Data inválida');
  }
  
  if (!data.horario_agendado || typeof data.horario_agendado !== 'string') {
    errors.push('Horário inválido');
  }
  
  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Muitas requisições. Tente novamente em 1 minuto.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: VisitRequestData = await req.json();
    console.log('Received visit request data:', { ...data, email: '***' });

    // Validação
    const validation = validateData(data);
    if (!validation.valid) {
      console.log('Validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ success: false, error: validation.errors.join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Inserir no banco
    const { data: insertedData, error } = await supabase
      .from('solicitacoes_visita')
      .insert({
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        telefone: data.telefone.trim(),
        cidade: data.cidade.trim(),
        endereco: data.endereco?.trim() || null,
        complemento: data.complemento?.trim() || null,
        mensagem: data.mensagem?.trim() || null,
        data_agendada: data.data_agendada,
        horario_agendado: data.horario_agendado,
        status: 'pendente',
        visualizada: false
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar solicitação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Visit request saved successfully:', insertedData.id);

    // Gerar link do WhatsApp para follow-up
    const phoneNumber = '5547999999999'; // Número da empresa
    const whatsappMessage = `Olá ${data.nome}! Recebemos sua solicitação de visita para ${data.data_agendada} no horário ${data.horario_agendado}. Em breve entraremos em contato para confirmar.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: insertedData.id,
        whatsappUrl 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
