import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Material {
  codigoItem: string
  nome: string
  categoria: string
  unidade: string
  larguraMetro?: number
  precoCusto: number
  ativo: boolean
}

interface ServicoConfeccao {
  codigoItem: string
  nomeModelo: string
  unidade: string
  precoCusto: number
  ativo: boolean
}

interface ServicoInstalacao {
  codigoItem: string
  nome: string
  precoCustoPorPonto: number
  ativo: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Starting seed-materials edge function ===')
    
    // Create Supabase client with service_role_key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get data from request body
    const { materiais, servicosConfeccao, servicosInstalacao } = await req.json()

    console.log(`Received: ${materiais?.length || 0} materials, ${servicosConfeccao?.length || 0} confection services, ${servicosInstalacao?.length || 0} installation services`)

    // Step 1: Clean up existing data using the truncate function
    console.log('Step 1: Cleaning up existing data...')
    
    // Call the truncate function to clear all data
    const { error: truncateError } = await supabaseAdmin.rpc('truncate_materials_and_services')

    if (truncateError) {
      console.error('Error truncating tables:', truncateError)
      throw new Error(`Failed to clean tables: ${truncateError.message}`)
    }

    console.log('Cleanup complete!')

    // Step 2: Insert materials
    console.log('Step 2: Inserting materials...')
    let insertedMateriais = 0

    if (materiais && Array.isArray(materiais)) {
      const materiaisToInsert = materiais.map((m: Material) => ({
        codigo_item: m.codigoItem,
        nome: m.nome,
        categoria: m.categoria,
        unidade: m.unidade,
        largura_metro: m.larguraMetro || null,
        preco_custo: m.precoCusto,
        preco_tabela: m.precoCusto * 1.615, // Default 61.5% margin
        margem_tabela_percent: 61.5,
        ativo: m.ativo ?? true
      }))

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('materiais')
        .insert(materiaisToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting materials:', insertError)
        throw insertError
      }

      insertedMateriais = insertedData?.length || 0
      console.log(`Inserted ${insertedMateriais} materials`)
    }

    // Step 3: Insert confection services
    console.log('Step 3: Inserting confection services...')
    let insertedConfeccao = 0

    if (servicosConfeccao && Array.isArray(servicosConfeccao)) {
      const confeccaoToInsert = servicosConfeccao.map((s: ServicoConfeccao) => ({
        codigo_item: s.codigoItem,
        nome_modelo: s.nomeModelo,
        unidade: s.unidade,
        preco_custo: s.precoCusto,
        preco_tabela: s.precoCusto * 1.55, // Default 55% margin
        margem_tabela_percent: 55,
        ativo: s.ativo ?? true
      }))

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('servicos_confeccao')
        .insert(confeccaoToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting confection services:', insertError)
        throw insertError
      }

      insertedConfeccao = insertedData?.length || 0
      console.log(`Inserted ${insertedConfeccao} confection services`)
    }

    // Step 4: Insert installation services
    console.log('Step 4: Inserting installation services...')
    let insertedInstalacao = 0

    if (servicosInstalacao && Array.isArray(servicosInstalacao)) {
      const instalacaoToInsert = servicosInstalacao.map((s: ServicoInstalacao) => ({
        codigo_item: s.codigoItem,
        nome: s.nome,
        preco_custo_por_ponto: s.precoCustoPorPonto,
        preco_tabela_por_ponto: s.precoCustoPorPonto * 1.615, // Default 61.5% margin
        margem_tabela_percent: 61.5,
        ativo: s.ativo ?? true
      }))

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('servicos_instalacao')
        .insert(instalacaoToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting installation services:', insertError)
        throw insertError
      }

      insertedInstalacao = insertedData?.length || 0
      console.log(`Inserted ${insertedInstalacao} installation services`)
    }

    console.log('=== Seed complete! ===')

    return new Response(
      JSON.stringify({
        success: true,
        counts: {
          materiais: insertedMateriais,
          servicosConfeccao: insertedConfeccao,
          servicosInstalacao: insertedInstalacao
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in seed-materials function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
