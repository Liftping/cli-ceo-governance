import { calculateCost, ModelUsage } from '@/cost-intelligence/pricing'

export default function CostDashboard() {
  // Example usage data (in production, fetch from database)
  const exampleUsage: ModelUsage = {
    modelId: 'claude-sonnet-4-5-20250929',
    inputTokens: 50000,
    outputTokens: 15000,
    cacheCreationTokens: 10000,
    cacheReadTokens: 25000,
  }

  const cost = calculateCost(exampleUsage)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cost Intelligence Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">Today's Spend</div>
          <div className="text-3xl font-bold">${cost.total.toFixed(4)}</div>
          <div className="text-sm text-green-600 mt-2">↓ 12% from yesterday</div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">Monthly Projection</div>
          <div className="text-3xl font-bold">$847.50</div>
          <div className="text-sm text-muted-foreground mt-2">Based on current rate</div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">Budget Remaining</div>
          <div className="text-3xl font-bold">$152.50</div>
          <div className="text-sm text-orange-600 mt-2">85% of monthly budget used</div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border mb-8">
        <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Input Tokens (50K)</span>
            <span className="font-mono">${cost.input.toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Output Tokens (15K)</span>
            <span className="font-mono">${cost.output.toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cache Creation (10K)</span>
            <span className="font-mono">${cost.cacheCreation.toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cache Read (25K)</span>
            <span className="font-mono">${cost.cacheRead.toFixed(4)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center font-bold">
            <span>Total</span>
            <span className="font-mono">${cost.total.toFixed(4)}</span>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border mb-8">
        <h2 className="text-xl font-semibold mb-4">Model Usage</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-secondary rounded">
            <div>
              <div className="font-semibold">Claude Sonnet 4.5</div>
              <div className="text-sm text-muted-foreground">
                claude-sonnet-4-5-20250929
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono">${cost.total.toFixed(4)}</div>
              <div className="text-sm text-muted-foreground">100K tokens</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Cost Optimization Tips</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">💡</span>
            <span>
              Use prompt caching for repeated context (90% cost reduction on cached reads)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">💡</span>
            <span>
              Switch to Claude Haiku for simple tasks (20x cheaper than Sonnet)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">💡</span>
            <span>
              Batch requests when possible to maximize cache hit rates
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">💡</span>
            <span>
              Set up budget alerts to prevent unexpected overages
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
