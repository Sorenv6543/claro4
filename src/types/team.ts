/**
 * Cleaner Team Type Definitions
 * Types for managing cleaner teams and group assignments
 */

export interface CleanerTeam {
  id: string
  name: string
  member_ids: string[]
  active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type CleanerTeamFormData = Omit<CleanerTeam, 'id' | 'created_at' | 'updated_at'>

export type CleanerTeamMap = Map<string, CleanerTeam>

export function isCleanerTeam (obj: unknown): obj is CleanerTeam {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  const team = obj as Record<string, unknown>
  return (
    typeof team.id === 'string'
    && typeof team.name === 'string'
    && Array.isArray(team.member_ids)
    && team.member_ids.every((id: unknown) => typeof id === 'string')
    && typeof team.active === 'boolean'
  )
}
