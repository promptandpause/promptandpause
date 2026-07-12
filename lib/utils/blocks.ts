import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the set of user ids that should be excluded from `userId`'s view --
 * everyone they've blocked, and everyone who has blocked them (blocking is
 * mutual in effect, even though only one side initiated it).
 */
export async function getExcludedUserIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

  const excluded = new Set<string>()
  data?.forEach((row: any) => {
    if (row.blocker_id === userId) excluded.add(row.blocked_id)
    if (row.blocked_id === userId) excluded.add(row.blocker_id)
  })

  return [...excluded]
}
