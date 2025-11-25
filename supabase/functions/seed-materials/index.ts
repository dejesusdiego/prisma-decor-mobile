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

    // Step 1: Deduplicate and upsert materials
    console.log('Step 1: Processing materials...')
    let insertedMateriais = 0

    if (materiais && Array.isArray(materiais)) {
      // Deduplicate by codigo_item - keep last occurrence
      const materiaisMap = new Map<string, Material>()
      materiais.forEach(m => {
        materiaisMap.set(m.codigoItem, m)
      })
      
      const uniqueMateriais = Array.from(materiaisMap.values())
      console.log(`Deduplicated materials: ${materiais.length} -> ${uniqueMateriais.length}`)
      
      const materiaisToInsert = uniqueMateriais.map((m: Material) => ({
        codigo_item: m.codigoItem,
        nome: m.nome,
        categoria: m.categoria,
        unidade: m.unidade,
        largura_metro: m.larguraMetro || null,
        preco_custo: m.precoCusto / 100, // Convert from centavos to reais
        preco_tabela: (m.precoCusto / 100) * 1.615,
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
        console.error('Error upserting materials:', insertError)
        throw insertError
      }

      insertedMateriais = insertedData?.length || 0
      console.log(`Upserted ${insertedMateriais} materials`)
    }

    // Step 2: Deduplicate and upsert confection services
    console.log('Step 2: Processing confection services...')
    let insertedConfeccao = 0

    if (servicosConfeccao && Array.isArray(servicosConfeccao)) {
      const confeccaoMap = new Map<string, ServicoConfeccao>()
      servicosConfeccao.forEach(s => {
        confeccaoMap.set(s.codigoItem, s)
      })
      
      const uniqueConfeccao = Array.from(confeccaoMap.values())
      console.log(`Deduplicated confection services: ${servicosConfeccao.length} -> ${uniqueConfeccao.length}`)
      
      const confeccaoToInsert = uniqueConfeccao.map((s: ServicoConfeccao) => ({
        codigo_item: s.codigoItem,
        nome_modelo: s.nomeModelo,
        unidade: s.unidade,
        preco_custo: s.precoCusto / 100, // Convert from centavos to reais
        preco_tabela: (s.precoCusto / 100) * 1.55,
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
        console.error('Error upserting confection services:', insertError)
        throw insertError
      }

      insertedConfeccao = insertedData?.length || 0
      console.log(`Upserted ${insertedConfeccao} confection services`)
    }

    // Step 3: Deduplicate and upsert installation services
    console.log('Step 3: Processing installation services...')
    let insertedInstalacao = 0

    if (servicosInstalacao && Array.isArray(servicosInstalacao)) {
      const instalacaoMap = new Map<string, ServicoInstalacao>()
      servicosInstalacao.forEach(s => {
        instalacaoMap.set(s.codigoItem, s)
      })
      
      const uniqueInstalacao = Array.from(instalacaoMap.values())
      console.log(`Deduplicated installation services: ${servicosInstalacao.length} -> ${uniqueInstalacao.length}`)
      
      const instalacaoToInsert = uniqueInstalacao.map((s: ServicoInstalacao) => ({
        codigo_item: s.codigoItem,
        nome: s.nome,
        preco_custo_por_ponto: s.precoCustoPorPonto, // Already in reais, no conversion needed
        preco_tabela_por_ponto: s.precoCustoPorPonto * 1.615,
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
        console.error('Error upserting installation services:', insertError)
        throw insertError
      }

      insertedInstalacao = insertedData?.length || 0
      console.log(`Upserted ${insertedInstalacao} installation services`)
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
