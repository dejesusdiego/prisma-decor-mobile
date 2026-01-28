import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UpdateFeatureFlagRequest {
  organizationId: string;
  flagName: string;
  value: boolean;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and check super_admin role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super_admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Super Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: UpdateFeatureFlagRequest = await req.json();
    const { organizationId, flagName, value, reason } = body;

    if (!organizationId || !flagName || value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organizationId, flagName, value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get feature flag ID
    const { data: flagData, error: flagError } = await supabase
      .from('feature_flags')
      .select('id')
      .eq('name', flagName)
      .single();

    if (flagError || !flagData) {
      return new Response(
        JSON.stringify({ error: 'Feature flag not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if override already exists
    const { data: existingOverride } = await supabase
      .from('organization_feature_overrides')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('feature_flag_id', flagData.id)
      .single();

    let result;

    if (existingOverride) {
      // Update existing override
      const { data, error } = await supabase
        .from('organization_feature_overrides')
        .update({
          value,
          reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOverride.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new override
      const { data, error } = await supabase
        .from('organization_feature_overrides')
        .insert({
          organization_id: organizationId,
          feature_flag_id: flagData.id,
          value,
          reason: reason || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Feature flag ${flagName} updated for organization`,
        override: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating feature flag:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
