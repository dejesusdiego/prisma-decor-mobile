import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MetricsResult {
  mrr: number;
  arr: number;
  totalTenants: number;
  activeTenants: number;
  churnRate: number;
  ltv: number;
  newThisMonth: number;
  canceledThisMonth: number;
  growthRate: number;
  mrrHistory: { month: string; value: number }[];
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

    // Calculate current date ranges
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
    const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayLastMonth = new Date(currentYear, currentMonth, 0);

    // Fetch all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing']);

    if (subError) throw subError;

    // Fetch subscription events for history
    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .gte('created_at', new Date(currentYear - 1, currentMonth, 1).toISOString())
      .order('created_at', { ascending: true });

    if (eventsError) throw eventsError;

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    subscriptions?.forEach((sub) => {
      if (sub.plan_type === 'annual') {
        mrr += Math.round(sub.price_cents / 12);
      } else {
        mrr += sub.price_cents;
      }
    });

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Count unique organizations (tenants)
    const tenantIds = new Set(subscriptions?.map(s => s.organization_id) || []);
    const totalTenants = tenantIds.size;
    const activeTenants = subscriptions?.filter(s => s.status === 'active').length || 0;

    // Calculate new and canceled this month
    const newThisMonth = events?.filter(e => 
      e.event_type === 'subscription_created' && 
      new Date(e.created_at) >= firstDayCurrentMonth
    ).length || 0;

    const canceledThisMonth = events?.filter(e => 
      e.event_type === 'subscription_canceled' && 
      new Date(e.created_at) >= firstDayCurrentMonth
    ).length || 0;

    // Calculate churn rate
    const canceledLastMonth = events?.filter(e => 
      e.event_type === 'subscription_canceled' && 
      new Date(e.created_at) >= firstDayLastMonth &&
      new Date(e.created_at) <= lastDayLastMonth
    ).length || 0;

    const activeLastMonth = activeTenants + canceledThisMonth;
    const churnRate = activeLastMonth > 0 ? (canceledLastMonth / activeLastMonth) * 100 : 0;

    // Calculate LTV (Lifetime Value)
    const avgRevenuePerUser = totalTenants > 0 ? mrr / totalTenants : 0;
    const monthlyChurnRate = churnRate / 100;
    const ltv = monthlyChurnRate > 0 ? avgRevenuePerUser / monthlyChurnRate : avgRevenuePerUser * 24;

    // Calculate MRR history for the last 12 months
    const mrrHistory: { month: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM
      
      let monthMrr = 0;
      subscriptions?.forEach((sub) => {
        const subCreated = new Date(sub.created_at);
        if (subCreated <= monthDate && sub.status === 'active') {
          const canceledDate = sub.canceled_at ? new Date(sub.canceled_at) : null;
          if (!canceledDate || canceledDate > monthDate) {
            if (sub.plan_type === 'annual') {
              monthMrr += Math.round(sub.price_cents / 12);
            } else {
              monthMrr += sub.price_cents;
            }
          }
        }
      });

      mrrHistory.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        value: monthMrr
      });
    }

    // Calculate growth rate (comparing with last month)
    const lastMonthMrr = mrrHistory[mrrHistory.length - 2]?.value || 0;
    const growthRate = lastMonthMrr > 0 ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 : 0;

    const result: MetricsResult = {
      mrr,
      arr,
      totalTenants,
      activeTenants,
      churnRate: Math.round(churnRate * 100) / 100,
      ltv: Math.round(ltv),
      newThisMonth,
      canceledThisMonth,
      growthRate: Math.round(growthRate * 100) / 100,
      mrrHistory
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating MRR:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
