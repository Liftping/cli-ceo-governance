/**
 * Vibe Kanban Database Reader
 *
 * Read-only integration with vibe-kanban SQLite database.
 * Syncs board state, tasks, and user activity for unified governance.
 *
 * Database location: ~/.config/vibe-kanban/vibe.db
 * Schema: https://github.com/example/vibe-kanban/schema
 */

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface VibeBoard {
  id: number
  name: string
  description: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export interface VibeTask {
  id: number
  board_id: number
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: string | null
  tags: string[] // Parsed from JSON
  due_date: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface VibeStats {
  totalBoards: number
  totalTasks: number
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  completionRate: number
  averageTimeToComplete: number // in hours
}

export class VibeKanbanReader {
  private db: Database.Database

  constructor(dbPath?: string) {
    const path = dbPath || this.getDefaultDbPath()
    this.db = new Database(path, { readonly: true, fileMustExist: true })
  }

  /**
   * Get default vibe-kanban database path
   */
  private getDefaultDbPath(): string {
    const configDir = join(homedir(), '.config', 'vibe-kanban')
    return join(configDir, 'vibe.db')
  }

  /**
   * List all boards
   */
  listBoards(): VibeBoard[] {
    const stmt = this.db.prepare(`
      SELECT id, name, description, color, created_at, updated_at
      FROM boards
      ORDER BY updated_at DESC
    `)
    return stmt.all() as VibeBoard[]
  }

  /**
   * Get board by ID
   */
  getBoard(boardId: number): VibeBoard | null {
    const stmt = this.db.prepare(`
      SELECT id, name, description, color, created_at, updated_at
      FROM boards
      WHERE id = ?
    `)
    return stmt.get(boardId) as VibeBoard | null
  }

  /**
   * List tasks for a board
   */
  listTasks(boardId: number): VibeTask[] {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE board_id = ?
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `)

    const tasks = stmt.all(boardId) as any[]

    // Parse JSON tags field
    return tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    })) as VibeTask[]
  }

  /**
   * Get task by ID
   */
  getTask(taskId: number): VibeTask | null {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE id = ?
    `)

    const task = stmt.get(taskId) as any
    if (!task) return null

    return {
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    } as VibeTask
  }

  /**
   * Search tasks by title or description
   */
  searchTasks(query: string): VibeTask[] {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE title LIKE ? OR description LIKE ?
      ORDER BY updated_at DESC
      LIMIT 50
    `)

    const searchPattern = `%${query}%`
    const tasks = stmt.all(searchPattern, searchPattern) as any[]

    return tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    })) as VibeTask[]
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: VibeTask['status']): VibeTask[] {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE status = ?
      ORDER BY priority, created_at DESC
    `)

    const tasks = stmt.all(status) as any[]

    return tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    })) as VibeTask[]
  }

  /**
   * Get tasks assigned to a user
   */
  getTasksByAssignee(assignee: string): VibeTask[] {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE assignee = ?
      ORDER BY priority, due_date
    `)

    const tasks = stmt.all(assignee) as any[]

    return tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    })) as VibeTask[]
  }

  /**
   * Get overdue tasks
   */
  getOverdueTasks(): VibeTask[] {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE due_date < datetime('now')
        AND status != 'done'
      ORDER BY due_date
    `)

    const tasks = stmt.all() as any[]

    return tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    })) as VibeTask[]
  }

  /**
   * Calculate statistics across all boards
   */
  getStats(): VibeStats {
    // Total counts
    const totalBoards = this.db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number }
    const totalTasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }

    // Tasks by status
    const statusCounts = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `).all() as { status: string; count: number }[]

    const tasksByStatus = statusCounts.reduce((acc, { status, count }) => {
      acc[status] = count
      return acc
    }, {} as Record<string, number>)

    // Tasks by priority
    const priorityCounts = this.db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      GROUP BY priority
    `).all() as { priority: string; count: number }[]

    const tasksByPriority = priorityCounts.reduce((acc, { priority, count }) => {
      acc[priority] = count
      return acc
    }, {} as Record<string, number>)

    // Completion rate
    const doneCount = tasksByStatus.done || 0
    const completionRate = totalTasks.count > 0
      ? (doneCount / totalTasks.count) * 100
      : 0

    // Average time to complete (in hours)
    const avgTime = this.db.prepare(`
      SELECT AVG(
        (julianday(completed_at) - julianday(created_at)) * 24
      ) as avg_hours
      FROM tasks
      WHERE completed_at IS NOT NULL
    `).get() as { avg_hours: number | null }

    const averageTimeToComplete = avgTime.avg_hours || 0

    return {
      totalBoards: totalBoards.count,
      totalTasks: totalTasks.count,
      tasksByStatus,
      tasksByPriority,
      completionRate,
      averageTimeToComplete,
    }
  }

  /**
   * Get recent activity (last 7 days)
   */
  getRecentActivity(days: number = 7): VibeTask[] {
    const stmt = this.db.prepare(`
      SELECT
        id, board_id, title, description, status, priority,
        assignee, tags, due_date, created_at, updated_at, completed_at
      FROM tasks
      WHERE updated_at >= datetime('now', '-${days} days')
      ORDER BY updated_at DESC
      LIMIT 100
    `)

    const tasks = stmt.all() as any[]

    return tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    })) as VibeTask[]
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}

// Example usage
export async function exampleUsage() {
  const reader = new VibeKanbanReader()

  try {
    // List all boards
    const boards = reader.listBoards()
    console.log('Boards:', boards)

    // Get statistics
    const stats = reader.getStats()
    console.log('Stats:', stats)

    // Get overdue tasks
    const overdue = reader.getOverdueTasks()
    console.log('Overdue tasks:', overdue)

    // Search tasks
    const results = reader.searchTasks('implement')
    console.log('Search results:', results)
  } finally {
    reader.close()
  }
}
