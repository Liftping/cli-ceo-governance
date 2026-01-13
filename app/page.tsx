import Link from 'next/link'

export default function Home() {
  const features = [
    {
      title: 'Cost Intelligence',
      description: 'Real-time tracking of Claude Max, MCP server costs, and multi-model usage',
      href: '/cost',
      icon: '💰',
      stats: ['Per-conversation tracking', 'Budget alerts', 'Cost projections'],
    },
    {
      title: 'Quality Gates',
      description: 'OWASP GenAI Top 10 security scanning for every AI interaction',
      href: '/quality',
      icon: '🛡️',
      stats: ['Prompt injection detection', 'Data leakage prevention', 'Model DoS protection'],
    },
    {
      title: 'Audit Trail',
      description: 'Immutable logging with cryptographic verification for compliance',
      href: '/audit',
      icon: '📋',
      stats: ['SHA-256 chain verification', 'GDPR compliant', 'Tamper-proof logs'],
    },
    {
      title: 'Vibe Integration',
      description: 'Sync with vibe-kanban SQLite database for unified project tracking',
      href: '/vibe',
      icon: '🔄',
      stats: ['Real-time sync', 'Board state tracking', 'Task analytics'],
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">CLI CEO Governance Dashboard</h1>
        <p className="text-xl text-muted-foreground">
          Unified governance layer for AI-powered development operations
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="block p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{feature.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{feature.title}</h2>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <ul className="space-y-1">
                  {feature.stats.map((stat) => (
                    <li key={stat} className="text-sm flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {stat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Configure Environment</h3>
            <p className="text-sm text-muted-foreground">
              Copy <code className="bg-background px-2 py-1 rounded">.env.example</code> to{' '}
              <code className="bg-background px-2 py-1 rounded">.env</code> and configure your
              database and API keys.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Initialize Database</h3>
            <p className="text-sm text-muted-foreground">
              Run the SQL schema in{' '}
              <code className="bg-background px-2 py-1 rounded">
                src/cost-intelligence/schema.sql
              </code>{' '}
              to set up cost tracking tables.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Connect Vibe Kanban</h3>
            <p className="text-sm text-muted-foreground">
              Set <code className="bg-background px-2 py-1 rounded">VIBE_KANBAN_DB_PATH</code> to
              your vibe-kanban SQLite database path for project sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
