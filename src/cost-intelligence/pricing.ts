/**
 * Cost Intelligence Module
 *
 * Real-time cost tracking for Claude API usage with support for:
 * - Claude Max: $20/month unlimited (pro-rated daily)
 * - Pay-as-you-go: Per-token pricing with prompt caching
 * - MCP servers: External API costs (Perplexity, OpenAI, etc.)
 *
 * Pricing source: https://anthropic.com/pricing
 * Last updated: 2025-01-13
 */

export interface ModelPricing {
  modelId: string
  inputPricePerMTok: number  // Price per million input tokens
  outputPricePerMTok: number // Price per million output tokens
  cacheCreationPricePerMTok: number // Price per million cache write tokens
  cacheReadPricePerMTok: number // Price per million cache read tokens
}

export interface ModelUsage {
  modelId: string
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
}

export interface CostBreakdown {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
  total: number
}

// Anthropic pricing table (as of 2025-01-13)
export const ANTHROPIC_PRICING: Record<string, ModelPricing> = {
  // Claude Opus 4.5
  'claude-opus-4-5-20251101': {
    modelId: 'claude-opus-4-5-20251101',
    inputPricePerMTok: 15.00,
    outputPricePerMTok: 75.00,
    cacheCreationPricePerMTok: 18.75,
    cacheReadPricePerMTok: 1.50,
  },

  // Claude Sonnet 4.5 (latest)
  'claude-sonnet-4-5-20250929': {
    modelId: 'claude-sonnet-4-5-20250929',
    inputPricePerMTok: 3.00,
    outputPricePerMTok: 15.00,
    cacheCreationPricePerMTok: 3.75,
    cacheReadPricePerMTok: 0.30,
  },

  // Claude Sonnet 3.5 (legacy)
  'claude-3-5-sonnet-20241022': {
    modelId: 'claude-3-5-sonnet-20241022',
    inputPricePerMTok: 3.00,
    outputPricePerMTok: 15.00,
    cacheCreationPricePerMTok: 3.75,
    cacheReadPricePerMTok: 0.30,
  },

  // Claude Haiku 3.5
  'claude-3-5-haiku-20241022': {
    modelId: 'claude-3-5-haiku-20241022',
    inputPricePerMTok: 0.25,
    outputPricePerMTok: 1.25,
    cacheCreationPricePerMTok: 0.30,
    cacheReadPricePerMTok: 0.03,
  },
}

/**
 * Calculate cost for a single API request
 */
export function calculateCost(usage: ModelUsage): CostBreakdown {
  const pricing = ANTHROPIC_PRICING[usage.modelId]

  if (!pricing) {
    throw new Error(`Unknown model ID: ${usage.modelId}`)
  }

  const input = (usage.inputTokens / 1_000_000) * pricing.inputPricePerMTok
  const output = (usage.outputTokens / 1_000_000) * pricing.outputPricePerMTok
  const cacheCreation = ((usage.cacheCreationTokens || 0) / 1_000_000) * pricing.cacheCreationPricePerMTok
  const cacheRead = ((usage.cacheReadTokens || 0) / 1_000_000) * pricing.cacheReadPricePerMTok

  return {
    input,
    output,
    cacheCreation,
    cacheRead,
    total: input + output + cacheCreation + cacheRead,
  }
}

/**
 * Calculate daily pro-rated cost for Claude Max subscription
 * $20/month = ~$0.67/day
 */
export function calculateClaudeMaxDailyCost(): number {
  return 20 / 30 // $0.67 per day
}

/**
 * Estimate monthly cost based on current daily usage
 */
export function projectMonthlyCost(dailyCost: number): number {
  return dailyCost * 30
}

/**
 * Calculate cost savings from using prompt caching
 */
export function calculateCacheSavings(
  originalInputTokens: number,
  cachedTokens: number,
  modelId: string
): number {
  const pricing = ANTHROPIC_PRICING[modelId]
  if (!pricing) return 0

  const originalCost = (originalInputTokens / 1_000_000) * pricing.inputPricePerMTok
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cacheReadPricePerMTok

  return originalCost - cachedCost
}

/**
 * Compare costs across different models
 */
export function compareCosts(
  inputTokens: number,
  outputTokens: number
): Record<string, number> {
  const results: Record<string, number> = {}

  for (const [modelId, pricing] of Object.entries(ANTHROPIC_PRICING)) {
    const cost = calculateCost({
      modelId,
      inputTokens,
      outputTokens,
    })
    results[modelId] = cost.total
  }

  return results
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`
  } else {
    return `$${cost.toFixed(2)}`
  }
}
