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

    // Step 1: Clean up existing data - use direct deletes with service_role_key
    console.log('Step 1: Cleaning up existing data...')
    
    // First, try using the truncate function
    console.log('Attempting truncate via RPC...')
    const { error: truncateError } = await supabaseAdmin.rpc('truncate_materials_and_services')
    
    if (truncateError) {
      console.warn('Truncate RPC failed, will use direct deletes:', truncateError)
    } else {
      console.log('Truncate RPC completed')
    }

    // Verify and clean up any remaining data using direct deletes with service_role_key
    console.log('Verifying tables are empty...')
    
    const { count: materiaisCount } = await supabaseAdmin.from('materiais').select('*', { count: 'exact', head: true })
    console.log(`Found ${materiaisCount ?? 0} existing materials`)
    
    if ((materiaisCount ?? 0) > 0) {
      console.log('Deleting existing materials directly...')
      const { error: deleteMatError } = await supabaseAdmin
        .from('materiais')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000') // Match all UUIDs
      
      if (deleteMatError) {
        console.error('Error deleting materials:', deleteMatError)
        throw new Error(`Failed to delete materials: ${deleteMatError.message}`)
      }
      console.log('Materials deleted successfully')
    }

    const { count: confeccaoCount } = await supabaseAdmin.from('servicos_confeccao').select('*', { count: 'exact', head: true })
    console.log(`Found ${confeccaoCount ?? 0} existing confection services`)
    
    if ((confeccaoCount ?? 0) > 0) {
      console.log('Deleting existing confection services directly...')
      const { error: deleteConfError } = await supabaseAdmin
        .from('servicos_confeccao')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000')
      
      if (deleteConfError) {
        console.error('Error deleting confection services:', deleteConfError)
        throw new Error(`Failed to delete confection services: ${deleteConfError.message}`)
      }
      console.log('Confection services deleted successfully')
    }

    const { count: instalacaoCount } = await supabaseAdmin.from('servicos_instalacao').select('*', { count: 'exact', head: true })
    console.log(`Found ${instalacaoCount ?? 0} existing installation services`)
    
    if ((instalacaoCount ?? 0) > 0) {
      console.log('Deleting existing installation services directly...')
      const { error: deleteInstError } = await supabaseAdmin
        .from('servicos_instalacao')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000')
      
      if (deleteInstError) {
        console.error('Error deleting installation services:', deleteInstError)
        throw new Error(`Failed to delete installation services: ${deleteInstError.message}`)
      }
      console.log('Installation services deleted successfully')
    }

    console.log('Cleanup complete - all tables verified empty!')

    // Step 2: Insert materials with UPSERT to handle any remaining duplicates
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
        .upsert(materiaisToInsert, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false
        })
        .select()

      if (insertError) {
        console.error('Error inserting materials:', insertError)
        throw insertError
      }

      insertedMateriais = insertedData?.length || 0
      console.log(`Inserted/Updated ${insertedMateriais} materials`)
    }

    // Step 3: Insert confection services with UPSERT
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
        .upsert(confeccaoToInsert, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false
        })
        .select()

      if (insertError) {
        console.error('Error inserting confection services:', insertError)
        throw insertError
      }

      insertedConfeccao = insertedData?.length || 0
      console.log(`Inserted/Updated ${insertedConfeccao} confection services`)
    }

    // Step 4: Insert installation services with UPSERT
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
        .upsert(instalacaoToInsert, {
          onConflict: 'codigo_item',
          ignoreDuplicates: false
        })
        .select()

      if (insertError) {
        console.error('Error inserting installation services:', insertError)
        throw insertError
      }

      insertedInstalacao = insertedData?.length || 0
      console.log(`Inserted/Updated ${insertedInstalacao} installation services`)
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
    
    // Extract detailed error information
    let errorMessage = 'Unknown error'
    let errorDetails = null
    
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    // Check if it's a Supabase error with additional details
    if (error && typeof error === 'object' && 'code' in error) {
      errorDetails = error
      console.error('Supabase error details:', JSON.stringify(error, null, 2))
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: errorDetails
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
