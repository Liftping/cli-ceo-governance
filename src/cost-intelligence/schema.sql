-- Cost Intelligence Database Schema
-- PostgreSQL 15+

-- Track individual API requests and their costs
CREATE TABLE IF NOT EXISTS api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Request identification
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    workspace_id TEXT,

    -- Model information
    model_id TEXT NOT NULL,
    model_version TEXT,

    -- Token usage
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cache_creation_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,

    -- Cost breakdown (in USD)
    input_cost DECIMAL(10, 6) NOT NULL,
    output_cost DECIMAL(10, 6) NOT NULL,
    cache_creation_cost DECIMAL(10, 6) DEFAULT 0,
    cache_read_cost DECIMAL(10, 6) DEFAULT 0,
    total_cost DECIMAL(10, 6) NOT NULL,

    -- Request metadata
    request_type TEXT, -- 'chat', 'completion', 'tool_use', etc.
    tool_name TEXT, -- MCP tool name if applicable

    -- Performance metrics
    latency_ms INTEGER,
    cache_hit_rate DECIMAL(5, 2),

    -- Indexes for common queries
    CONSTRAINT valid_tokens CHECK (
        input_tokens >= 0 AND
        output_tokens >= 0 AND
        cache_creation_tokens >= 0 AND
        cache_read_tokens >= 0
    ),
    CONSTRAINT valid_costs CHECK (
        input_cost >= 0 AND
        output_cost >= 0 AND
        cache_creation_cost >= 0 AND
        cache_read_cost >= 0 AND
        total_cost >= 0
    )
);

-- Indexes for performance
CREATE INDEX idx_requests_timestamp ON api_requests(timestamp DESC);
CREATE INDEX idx_requests_conversation ON api_requests(conversation_id);
CREATE INDEX idx_requests_user ON api_requests(user_id);
CREATE INDEX idx_requests_workspace ON api_requests(workspace_id);
CREATE INDEX idx_requests_model ON api_requests(model_id);

-- Daily cost aggregation for dashboards
CREATE TABLE IF NOT EXISTS daily_cost_summary (
    date DATE PRIMARY KEY,

    -- User/workspace aggregation
    user_id TEXT NOT NULL,
    workspace_id TEXT,

    -- Total metrics
    total_requests INTEGER NOT NULL,
    total_input_tokens BIGINT NOT NULL,
    total_output_tokens BIGINT NOT NULL,
    total_cache_creation_tokens BIGINT DEFAULT 0,
    total_cache_read_tokens BIGINT DEFAULT 0,

    -- Cost totals (in USD)
    total_input_cost DECIMAL(10, 2) NOT NULL,
    total_output_cost DECIMAL(10, 2) NOT NULL,
    total_cache_creation_cost DECIMAL(10, 2) DEFAULT 0,
    total_cache_read_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(10, 2) NOT NULL,

    -- Model breakdown (JSONB for flexibility)
    model_breakdown JSONB,

    -- Cache performance
    avg_cache_hit_rate DECIMAL(5, 2),
    cache_savings DECIMAL(10, 2),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_summary_date ON daily_cost_summary(date DESC);
CREATE INDEX idx_daily_summary_user ON daily_cost_summary(user_id);

-- Budget alerts configuration
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Alert scope
    user_id TEXT NOT NULL,
    workspace_id TEXT,

    -- Budget limits
    daily_limit_usd DECIMAL(10, 2),
    weekly_limit_usd DECIMAL(10, 2),
    monthly_limit_usd DECIMAL(10, 2),

    -- Alert thresholds (percentage of limit)
    warning_threshold DECIMAL(5, 2) DEFAULT 80.00,
    critical_threshold DECIMAL(5, 2) DEFAULT 95.00,

    -- Notification settings
    alert_email TEXT,
    alert_slack_webhook TEXT,

    -- State
    enabled BOOLEAN DEFAULT TRUE,
    last_alert_sent TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_alerts_user ON budget_alerts(user_id) WHERE enabled = TRUE;

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    budget_alert_id UUID REFERENCES budget_alerts(id),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Alert details
    alert_type TEXT NOT NULL, -- 'warning', 'critical', 'budget_exceeded'
    period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'

    -- Spending info
    current_spend DECIMAL(10, 2) NOT NULL,
    budget_limit DECIMAL(10, 2) NOT NULL,
    percentage_used DECIMAL(5, 2) NOT NULL,

    -- Notification status
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_method TEXT, -- 'email', 'slack', etc.

    CONSTRAINT valid_alert_type CHECK (alert_type IN ('warning', 'critical', 'budget_exceeded')),
    CONSTRAINT valid_period CHECK (period IN ('daily', 'weekly', 'monthly'))
);

CREATE INDEX idx_alert_history_budget ON alert_history(budget_alert_id);
CREATE INDEX idx_alert_history_triggered ON alert_history(triggered_at DESC);

-- MCP server cost tracking (external API costs)
CREATE TABLE IF NOT EXISTS mcp_server_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- MCP server info
    server_name TEXT NOT NULL,
    tool_name TEXT NOT NULL,

    -- Request details
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    -- External API costs
    external_api TEXT NOT NULL, -- 'perplexity', 'openai', 'github', etc.
    external_model TEXT,
    external_cost DECIMAL(10, 6) NOT NULL,

    -- Request metadata
    request_metadata JSONB,

    CONSTRAINT valid_external_cost CHECK (external_cost >= 0)
);

CREATE INDEX idx_mcp_costs_timestamp ON mcp_server_costs(timestamp DESC);
CREATE INDEX idx_mcp_costs_server ON mcp_server_costs(server_name);
CREATE INDEX idx_mcp_costs_conversation ON mcp_server_costs(conversation_id);

-- View: Current month spending by user
CREATE OR REPLACE VIEW current_month_spending AS
SELECT
    user_id,
    workspace_id,
    DATE_TRUNC('month', date) AS month,
    SUM(total_cost) AS month_to_date_spend,
    SUM(total_requests) AS total_requests,
    SUM(total_input_tokens + total_output_tokens) AS total_tokens,
    AVG(avg_cache_hit_rate) AS avg_cache_hit_rate,
    SUM(cache_savings) AS total_cache_savings
FROM daily_cost_summary
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY user_id, workspace_id, DATE_TRUNC('month', date);

-- View: Cost by model (current month)
CREATE OR REPLACE VIEW current_month_cost_by_model AS
SELECT
    model_id,
    COUNT(*) AS request_count,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(total_cost) AS total_cost,
    AVG(latency_ms) AS avg_latency_ms,
    AVG(cache_hit_rate) AS avg_cache_hit_rate
FROM api_requests
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY model_id
ORDER BY total_cost DESC;

-- Function: Update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_cost_summary (
        date,
        user_id,
        workspace_id,
        total_requests,
        total_input_tokens,
        total_output_tokens,
        total_cache_creation_tokens,
        total_cache_read_tokens,
        total_input_cost,
        total_output_cost,
        total_cache_creation_cost,
        total_cache_read_cost,
        total_cost,
        avg_cache_hit_rate
    )
    SELECT
        DATE(NEW.timestamp),
        NEW.user_id,
        NEW.workspace_id,
        1,
        NEW.input_tokens,
        NEW.output_tokens,
        NEW.cache_creation_tokens,
        NEW.cache_read_tokens,
        NEW.input_cost,
        NEW.output_cost,
        NEW.cache_creation_cost,
        NEW.cache_read_cost,
        NEW.total_cost,
        NEW.cache_hit_rate
    ON CONFLICT (date, user_id, workspace_id)
    DO UPDATE SET
        total_requests = daily_cost_summary.total_requests + 1,
        total_input_tokens = daily_cost_summary.total_input_tokens + NEW.input_tokens,
        total_output_tokens = daily_cost_summary.total_output_tokens + NEW.output_tokens,
        total_cache_creation_tokens = daily_cost_summary.total_cache_creation_tokens + NEW.cache_creation_tokens,
        total_cache_read_tokens = daily_cost_summary.total_cache_read_tokens + NEW.cache_read_tokens,
        total_input_cost = daily_cost_summary.total_input_cost + NEW.input_cost,
        total_output_cost = daily_cost_summary.total_output_cost + NEW.output_cost,
        total_cache_creation_cost = daily_cost_summary.total_cache_creation_cost + NEW.cache_creation_cost,
        total_cache_read_cost = daily_cost_summary.total_cache_read_cost + NEW.cache_read_cost,
        total_cost = daily_cost_summary.total_cost + NEW.total_cost,
        avg_cache_hit_rate = (daily_cost_summary.avg_cache_hit_rate * daily_cost_summary.total_requests + NEW.cache_hit_rate) / (daily_cost_summary.total_requests + 1),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update daily summary
CREATE TRIGGER trigger_update_daily_summary
AFTER INSERT ON api_requests
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Sample data (for testing)
INSERT INTO budget_alerts (
    user_id,
    workspace_id,
    daily_limit_usd,
    weekly_limit_usd,
    monthly_limit_usd,
    alert_email
) VALUES (
    'user-001',
    'workspace-001',
    50.00,
    300.00,
    1000.00,
    'ceo@example.com'
);
