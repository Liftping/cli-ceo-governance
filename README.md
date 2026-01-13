# cli.ceo - Governance Plane for AI Coding Agents

**Prevent the 40% AI project failure rate through cost control, quality gates, and compliance infrastructure.**

> "vibe-kanban automates code. cli.ceo governs costs, quality, and compliance."

## Market Opportunity

- **Market Size**: $1-1.5B (2026) → $3-5B (2030) at 30-40% CAGR
- **Target**: Engineering Managers & CTOs preventing cost explosions, security vulnerabilities, and compliance failures
- **Problem**: 62% of AI-generated code contains vulnerabilities, 5-10x hidden cost multiplier, <20% disclose safety policies

## Value Propositions

### 1. Cost Intelligence (Primary)
- Real-time API cost tracking (OpenAI, Anthropic, Google)
- Budget alerts prevent $47-in-10-minutes scenarios
- Per-repo/team budget caps with automatic enforcement
- Model cost optimization (route to cheapest capable model)

### 2. Quality Gates (Security)
- OWASP GenAI Top 10 security checks
- Block 62% vulnerable code before PR creation
- Test coverage requirements (80% minimum)
- Architectural compliance validation

### 3. Audit Trail & Compliance
- Decision provenance: "Why did the agent make this choice?"
- Immutable audit logs (7-year retention)
- Agent drift detection (12 dimensions)
- GDPR, HIPAA, EU AI Act compliance

### 4. Intent Canvas Dashboard
- Real-time visibility across repos
- Multi-repo orchestration
- Team collaboration features
- vibe-kanban integration

## Architecture

```
┌─────────────────────────────────────────────┐
│   cli.ceo Governance Plane (SaaS)           │
│   - Cost Intelligence & Budget Enforcement   │
│   - Quality Gates (OWASP GenAI Top 10)      │
│   - Intent Canvas Dashboard & Audit Trails  │
│   - Multi-Repo Orchestration                │
│   - Compliance (GDPR, HIPAA, EU AI Act)     │
└──────────────┬───────────────────────────────┘
               │ governance API
┌──────────────▼───────────────────────────────┐
│   vibe-kanban (Free OSS Execution Layer)     │
│   - Git worktrees                            │
│   - Agent execution                          │
│   - PR generation                            │
│   - Real-time monitoring                     │
└──────────────────────────────────────────────┘
```

## Quick Start

### Phase 0: Beta Validation (Weeks 1-4)

**Goal**: Validate governance plane value with 3-5 beta users

1. **Install vibe-kanban**
   ```bash
   npx vibe-kanban
   # Test with recurring maintenance tasks
   ```

2. **Build Cost Tracking MVP**
   ```bash
   cd packages/cli-ceo-governance
   npm install
   npm run dev
   # Dashboard: http://localhost:3000
   ```

3. **Recruit beta users**
   - Target: vibe-kanban community (5.7k stars), Linear MCP users
   - Goal: Document 30-50% cost reduction

## Linear Issues

### Phase 0 (Beta Validation)
- [CLI-13](https://linear.app/liftping/issue/CLI-13): Install vibe-kanban and test recurring maintenance (16 hrs)
- [CLI-14](https://linear.app/liftping/issue/CLI-14): Build Cost Tracking MVP (24 hrs)
- [CLI-15](https://linear.app/liftping/issue/CLI-15): Recruit 3-5 beta users (16 hrs)
- [CLI-16](https://linear.app/liftping/issue/CLI-16): Document cost savings & validate needs (20 hrs)

### Phase 1 (MVP Launch)
- [CLI-9](https://linear.app/liftping/issue/CLI-9): Build Cost Intelligence Dashboard (8-10 hrs)
- [CLI-10](https://linear.app/liftping/issue/CLI-10): Build Quality Gates (10-12 hrs)
- [CLI-11](https://linear.app/liftping/issue/CLI-11): Build Audit Trail & Compliance (8-10 hrs)
- [CLI-12](https://linear.app/liftping/issue/CLI-12): Build Intent Canvas Dashboard & Launch (10-12 hrs)

## Pricing

**Free Tier**: $0/month
- Single repo
- Cost tracking only
- Community support

**Team Tier**: $299/month (10 developers)
- Unlimited repos
- Full quality gates (OWASP GenAI)
- Budget enforcement
- Email support

**Enterprise**: Custom (50+ developers)
- Compliance (GDPR, HIPAA, SOC 2)
- Audit trails (7-year retention)
- Agent drift detection
- Dedicated support

## Tech Stack

- **Backend**: Node.js, TypeScript, Supabase (PostgreSQL + Edge Functions)
- **Frontend**: Next.js 15, React, Tailwind CSS, shadcn/ui
- **Cost Tracking**: better-sqlite3 (vibe-kanban DB reader), provider SDKs
- **Quality Gates**: ESLint, custom rules, semantic analysis
- **Compliance**: PostgreSQL WORM storage, audit log retention

## Documentation

- **Market Opportunity**: [CLI_CEO_MARKET_OPPORTUNITY_2026.md](https://github.com/liftping/repochief-docs)
- **Linear Issues**: https://linear.app/liftping/team/CLI/active

## License

Proprietary (for now)

---

**Built with ❤️ to prevent the 40% AI project failure rate**
