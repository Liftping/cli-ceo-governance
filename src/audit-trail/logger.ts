/**
 * Audit Trail: Immutable Logging with Cryptographic Verification
 *
 * Implements tamper-proof audit logging using:
 * - SHA-256 hash chaining (each log entry references previous hash)
 * - HMAC signatures for integrity verification
 * - Append-only file storage
 * - Structured JSON logging
 *
 * Compliance: GDPR Article 30 (Records of processing), SOC 2, ISO 27001
 */

import { createHash, createHmac, randomBytes } from 'crypto'
import { appendFileSync, readFileSync, existsSync } from 'fs'
import { dirname } from 'path'
import { mkdirSync } from 'fs'

export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',

  // AI operations
  LLM_REQUEST = 'llm.request',
  LLM_RESPONSE = 'llm.response',
  TOOL_EXECUTION = 'tool.execution',
  MCP_SERVER_CALL = 'mcp_server.call',

  // Data access
  DATA_READ = 'data.read',
  DATA_WRITE = 'data.write',
  DATA_DELETE = 'data.delete',

  // Security events
  SECURITY_SCAN = 'security.scan',
  SECURITY_VIOLATION = 'security.violation',
  ACCESS_DENIED = 'access.denied',

  // Administrative actions
  CONFIG_CHANGE = 'config.change',
  USER_CREATED = 'user.created',
  USER_DELETED = 'user.deleted',
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_REVOKED = 'permission.revoked',

  // Cost tracking
  BUDGET_ALERT = 'budget.alert',
  COST_THRESHOLD_EXCEEDED = 'cost.threshold_exceeded',
}

export interface AuditEvent {
  // Event identification
  id: string
  timestamp: string
  eventType: AuditEventType

  // Actor information
  userId: string
  userEmail?: string
  workspaceId?: string
  ipAddress?: string
  userAgent?: string

  // Event details
  resource?: string // Resource being accessed
  action?: string // Action being performed
  outcome: 'success' | 'failure' | 'denied'

  // Metadata
  metadata?: Record<string, any>

  // Security context
  sessionId?: string
  requestId?: string

  // Privacy controls
  containsPII?: boolean
  retentionPeriod?: number // days
}

export interface AuditLogEntry {
  event: AuditEvent
  previousHash: string
  hash: string
  signature: string
}

export class AuditLogger {
  private logPath: string
  private signingKey: string
  private lastHash: string

  constructor(logPath: string, signingKey?: string) {
    this.logPath = logPath
    this.signingKey = signingKey || process.env.AUDIT_SIGNING_KEY || this.generateSigningKey()

    // Ensure log directory exists
    const logDir = dirname(logPath)
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }

    // Initialize chain with genesis hash
    this.lastHash = this.getLastHash()
  }

  /**
   * Generate a random signing key (store securely in production!)
   */
  private generateSigningKey(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Get the hash of the last log entry
   */
  private getLastHash(): string {
    if (!existsSync(this.logPath)) {
      // Genesis block
      return createHash('sha256').update('GENESIS').digest('hex')
    }

    const logs = readFileSync(this.logPath, 'utf-8').trim().split('\n')
    if (logs.length === 0 || logs[0] === '') {
      return createHash('sha256').update('GENESIS').digest('hex')
    }

    const lastLog = logs[logs.length - 1]
    const lastEntry: AuditLogEntry = JSON.parse(lastLog)
    return lastEntry.hash
  }

  /**
   * Hash an audit log entry
   */
  private hashEntry(entry: AuditLogEntry): string {
    const data = JSON.stringify({
      event: entry.event,
      previousHash: entry.previousHash,
    })
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Sign an audit log entry
   */
  private signEntry(hash: string): string {
    return createHmac('sha256', this.signingKey)
      .update(hash)
      .digest('hex')
  }

  /**
   * Log an audit event (immutable, append-only)
   */
  log(event: AuditEvent): AuditLogEntry {
    // Create log entry with chain reference
    const entry: AuditLogEntry = {
      event: {
        ...event,
        id: event.id || this.generateEventId(),
        timestamp: event.timestamp || new Date().toISOString(),
      },
      previousHash: this.lastHash,
      hash: '', // Computed below
      signature: '', // Computed below
    }

    // Compute hash and signature
    entry.hash = this.hashEntry(entry)
    entry.signature = this.signEntry(entry.hash)

    // Update chain state
    this.lastHash = entry.hash

    // Append to log file (immutable)
    const logLine = JSON.stringify(entry) + '\n'
    appendFileSync(this.logPath, logLine, 'utf-8')

    return entry
  }

  /**
   * Verify the integrity of the entire audit log
   */
  verify(): { valid: boolean; errors: string[] } {
    if (!existsSync(this.logPath)) {
      return { valid: true, errors: [] }
    }

    const logs = readFileSync(this.logPath, 'utf-8').trim().split('\n')
    if (logs.length === 0 || logs[0] === '') {
      return { valid: true, errors: [] }
    }

    const errors: string[] = []
    let expectedPreviousHash = createHash('sha256').update('GENESIS').digest('hex')

    for (let i = 0; i < logs.length; i++) {
      const entry: AuditLogEntry = JSON.parse(logs[i])

      // Verify chain integrity
      if (entry.previousHash !== expectedPreviousHash) {
        errors.push(
          `Entry ${i} (${entry.event.id}): Chain broken. Expected previous hash ${expectedPreviousHash}, got ${entry.previousHash}`
        )
      }

      // Verify hash
      const computedHash = this.hashEntry(entry)
      if (entry.hash !== computedHash) {
        errors.push(
          `Entry ${i} (${entry.event.id}): Hash mismatch. Expected ${computedHash}, got ${entry.hash}`
        )
      }

      // Verify signature
      const computedSignature = this.signEntry(entry.hash)
      if (entry.signature !== computedSignature) {
        errors.push(
          `Entry ${i} (${entry.event.id}): Signature invalid. Expected ${computedSignature}, got ${entry.signature}`
        )
      }

      expectedPreviousHash = entry.hash
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Query audit logs by criteria
   */
  query(criteria: {
    userId?: string
    eventType?: AuditEventType
    startTime?: Date
    endTime?: Date
    outcome?: AuditEvent['outcome']
  }): AuditLogEntry[] {
    if (!existsSync(this.logPath)) {
      return []
    }

    const logs = readFileSync(this.logPath, 'utf-8').trim().split('\n')
    if (logs.length === 0 || logs[0] === '') {
      return []
    }

    return logs
      .map(line => JSON.parse(line) as AuditLogEntry)
      .filter(entry => {
        if (criteria.userId && entry.event.userId !== criteria.userId) {
          return false
        }
        if (criteria.eventType && entry.event.eventType !== criteria.eventType) {
          return false
        }
        if (criteria.outcome && entry.event.outcome !== criteria.outcome) {
          return false
        }
        if (criteria.startTime) {
          const eventTime = new Date(entry.event.timestamp)
          if (eventTime < criteria.startTime) {
            return false
          }
        }
        if (criteria.endTime) {
          const eventTime = new Date(entry.event.timestamp)
          if (eventTime > criteria.endTime) {
            return false
          }
        }
        return true
      })
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  /**
   * Export audit logs for compliance reporting
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (!existsSync(this.logPath)) {
      return format === 'json' ? '[]' : ''
    }

    const logs = readFileSync(this.logPath, 'utf-8').trim().split('\n')
    if (logs.length === 0 || logs[0] === '') {
      return format === 'json' ? '[]' : ''
    }

    const entries = logs.map(line => JSON.parse(line) as AuditLogEntry)

    if (format === 'json') {
      return JSON.stringify(entries, null, 2)
    } else {
      // CSV export
      const header = 'Timestamp,Event Type,User ID,Resource,Action,Outcome,Hash\n'
      const rows = entries.map(entry => {
        const e = entry.event
        return `${e.timestamp},${e.eventType},${e.userId},${e.resource || ''},${e.action || ''},${e.outcome},${entry.hash}`
      }).join('\n')
      return header + rows
    }
  }
}

// Example usage
export async function exampleUsage() {
  const logger = new AuditLogger('/var/log/cli-ceo-governance/audit.log')

  // Log an LLM request
  logger.log({
    id: '',
    timestamp: '',
    eventType: AuditEventType.LLM_REQUEST,
    userId: 'user-001',
    userEmail: 'developer@example.com',
    workspaceId: 'workspace-001',
    resource: 'claude-sonnet-4-5',
    action: 'chat.completion',
    outcome: 'success',
    metadata: {
      inputTokens: 1000,
      outputTokens: 500,
      cost: 0.0245,
    },
  })

  // Log a security violation
  logger.log({
    id: '',
    timestamp: '',
    eventType: AuditEventType.SECURITY_VIOLATION,
    userId: 'user-002',
    resource: 'prompt',
    action: 'injection_attempt',
    outcome: 'denied',
    metadata: {
      violationType: 'prompt_injection',
      riskLevel: 'critical',
      affectedText: 'ignore previous instructions...',
    },
  })

  // Verify log integrity
  const verification = logger.verify()
  console.log('Audit log integrity:', verification)

  // Query logs
  const recentLogs = logger.query({
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    eventType: AuditEventType.LLM_REQUEST,
  })
  console.log('Recent LLM requests:', recentLogs.length)

  // Export for compliance
  const jsonExport = logger.exportLogs('json')
  console.log('Exported logs:', jsonExport)
}
