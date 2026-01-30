-- Migration: Add RPC function for platform metrics
-- This provides a database function alternative to the Edge Function

-- Function to get platform-wide metrics for super admin dashboard
CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS TABLE (
  mrr BIGINT,
  arr BIGINT,
  total_tenants BIGINT,
  active_tenants BIGINT,
  churn_rate NUMERIC,
  avg_ltv NUMERIC,
  new_this_month BIGINT,
  canceled_this_month BIGINT,
  growth_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_mrr BIGINT;
  v_total_tenants BIGINT;
  v_active_tenants BIGINT;
  v_new_this_month BIGINT;
  v_canceled_this_month BIGINT;
  v_canceled_last_month BIGINT;
  v_active_last_month BIGINT;
  v_churn_rate NUMERIC;
  v_avg_ltv NUMERIC;
  v_growth_rate NUMERIC;
  v_last_month_mrr BIGINT;
BEGIN
  -- Check if user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  -- Calculate current MRR from active/trialing subscriptions
  SELECT COALESCE(SUM(
    CASE 
      WHEN s.plan_type = 'annual' THEN ROUND(s.price_cents / 12.0)
      ELSE s.price_cents
    END
  ), 0)
  INTO v_current_mrr
  FROM subscriptions s
  WHERE s.status IN ('active', 'trialing');

  -- Count total unique organizations (tenants)
  SELECT COUNT(DISTINCT organization_id)
  INTO v_total_tenants
  FROM subscriptions
  WHERE status IN ('active', 'trialing', 'canceled');

  -- Count active tenants
  SELECT COUNT(DISTINCT organization_id)
  INTO v_active_tenants
  FROM subscriptions
  WHERE status = 'active';

  -- New subscriptions this month
  SELECT COUNT(*)
  INTO v_new_this_month
  FROM subscription_events
  WHERE event_type = 'subscription_created'
    AND created_at >= DATE_TRUNC('month', NOW());

  -- Canceled subscriptions this month
  SELECT COUNT(*)
  INTO v_canceled_this_month
  FROM subscription_events
  WHERE event_type = 'subscription_canceled'
    AND created_at >= DATE_TRUNC('month', NOW());

  -- Canceled last month (for churn calculation)
  SELECT COUNT(*)
  INTO v_canceled_last_month
  FROM subscription_events
  WHERE event_type = 'subscription_canceled'
    AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', NOW());

  -- Active tenants last month
  v_active_last_month := v_active_tenants + v_canceled_this_month;

  -- Calculate churn rate
  IF v_active_last_month > 0 THEN
    v_churn_rate := ROUND((v_canceled_last_month::NUMERIC / v_active_last_month) * 100, 2);
  ELSE
    v_churn_rate := 0;
  END IF;

  -- Calculate average LTV
  IF v_total_tenants > 0 AND v_churn_rate > 0 THEN
    v_avg_ltv := ROUND((v_current_mrr::NUMERIC / v_total_tenants) / (v_churn_rate / 100), 2);
  ELSE
    v_avg_ltv := COALESCE(v_current_mrr::NUMERIC / NULLIF(v_total_tenants, 0) * 24, 0);
  END IF;

  -- Calculate MRR for last month (simplified)
  SELECT COALESCE(SUM(
    CASE 
      WHEN s.plan_type = 'annual' THEN ROUND(s.price_cents / 12.0)
      ELSE s.price_cents
    END
  ), 0)
  INTO v_last_month_mrr
  FROM subscriptions s
  WHERE s.status = 'active'
    AND s.created_at < DATE_TRUNC('month', NOW())
    AND (s.canceled_at IS NULL OR s.canceled_at >= DATE_TRUNC('month', NOW()));

  -- Calculate growth rate
  IF v_last_month_mrr > 0 THEN
    v_growth_rate := ROUND(((v_current_mrr - v_last_month_mrr)::NUMERIC / v_last_month_mrr) * 100, 2);
  ELSE
    v_growth_rate := 0;
  END IF;

  RETURN QUERY SELECT 
    v_current_mrr,
    v_current_mrr * 12,
    v_total_tenants,
    v_active_tenants,
    v_churn_rate,
    v_avg_ltv,
    v_new_this_month,
    v_canceled_this_month,
    v_growth_rate;
END;
$$;

-- Grant execute permission to authenticated users
-- (RLS check inside function ensures only super_admin can access)
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_metrics() TO service_role;

-- Function to get MRR history over time
CREATE OR REPLACE FUNCTION get_mrr_history(months_count INTEGER DEFAULT 12)
RETURNS TABLE (
  month_label TEXT,
  month_date DATE,
  mrr_value BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
  target_date DATE;
  month_mrr BIGINT;
BEGIN
  -- Check if user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  FOR i IN 0..(months_count - 1) LOOP
    target_date := DATE_TRUNC('month', NOW() - (i || ' months')::INTERVAL)::DATE;
    
    -- Calculate MRR for this month
    SELECT COALESCE(SUM(
      CASE 
        WHEN s.plan_type = 'annual' THEN ROUND(s.price_cents / 12.0)
        ELSE s.price_cents
      END
    ), 0)
    INTO month_mrr
    FROM subscriptions s
    WHERE s.status = 'active'
      AND s.created_at <= (target_date + INTERVAL '1 month' - INTERVAL '1 day')
      AND (s.canceled_at IS NULL OR s.canceled_at > target_date);

    month_label := TO_CHAR(target_date, 'Mon YY');
    month_date := target_date;
    mrr_value := month_mrr;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mrr_history(INTEGER) TO service_role;

-- Function to get recent subscriptions with organization details
CREATE OR REPLACE FUNCTION get_recent_subscriptions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  subscription_id UUID,
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  plan_type TEXT,
  status TEXT,
  price_cents INTEGER,
  created_at TIMESTAMPTZ,
  event_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin required';
  END IF;

  RETURN QUERY
  SELECT 
    s.id AS subscription_id,
    s.organization_id,
    o.name AS organization_name,
    o.slug AS organization_slug,
    s.plan_type,
    s.status,
    s.price_cents,
    s.created_at,
    se.event_type
  FROM subscriptions s
  JOIN organizations o ON o.id = s.organization_id
  LEFT JOIN LATERAL (
    SELECT event_type 
    FROM subscription_events 
    WHERE subscription_id = s.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) se ON true
  ORDER BY s.created_at DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_subscriptions(INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_platform_metrics() IS 'Returns platform-wide SaaS metrics (MRR, ARR, churn, LTV) for super admin dashboard. Requires super_admin role.';
COMMENT ON FUNCTION get_mrr_history(INTEGER) IS 'Returns MRR history for the last N months. Requires super_admin role.';
COMMENT ON FUNCTION get_recent_subscriptions(INTEGER) IS 'Returns recent subscriptions with organization details. Requires super_admin role.';
