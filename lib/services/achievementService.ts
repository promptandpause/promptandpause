/**
 * Achievement Service
 * Handles badge checking, awarding, and tracking
 */

import { getSupabaseClient } from "@/lib/supabase/client"
import {
  Badge,
  UserAchievement,
  BADGES,
  checkStreakBadges,
  checkReflectionCountBadges,
  checkTagBadges,
  getBadgeById
} from "@/lib/types/achievements"

export class AchievementService {
  private supabase = getSupabaseClient()

  /**
   * Get all achievements for a user
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('Error fetching user achievements:', error)
      return []
    }

    return data || []
  }

  /**
   * Check if user has a specific badge
   */
  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single()

    return !error && !!data
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badgeId: string): Promise<UserAchievement | null> {
    // Check if already has badge
    const hasIt = await this.hasBadge(userId, badgeId)
    if (hasIt) return null

    const { data, error } = await this.supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        viewed: false,
        earned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error awarding badge:', error)
      return null
    }

    return data
  }

  /**
   * Mark badge as viewed
   */
  async markBadgeAsViewed(achievementId: string): Promise<void> {
    await this.supabase
      .from('user_achievements')
      .update({ viewed: true })
      .eq('id', achievementId)
  }

  /**
   * Get unviewed badge achievements
   */
  async getUnviewedBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('badge_id')
      .eq('user_id', userId)
      .eq('viewed', false)

    if (error || !data) return []

    return data
      .map(achievement => getBadgeById(achievement.badge_id))
      .filter(badge => badge !== undefined) as Badge[]
  }

  /**
   * Check for new badges after saving a reflection
   */
  async checkReflectionBadges(
    userId: string,
    reflectionCount: number,
    currentStreak: number,
    tags: string[]
  ): Promise<Badge[]> {
    const newBadges: Badge[] = []

    // Check first reflection milestone
    if (reflectionCount === 1) {
      const firstSaveBadge = getBadgeById('milestone_first_save')
      if (firstSaveBadge) {
        const awarded = await this.awardBadge(userId, firstSaveBadge.id)
        if (awarded) newBadges.push(firstSaveBadge)
      }

      const firstStepsBadge = getBadgeById('reflection_1')
      if (firstStepsBadge) {
        const awarded = await this.awardBadge(userId, firstStepsBadge.id)
        if (awarded) newBadges.push(firstStepsBadge)
      }
    }

    // Check reflection count badges
    const reflectionBadges = checkReflectionCountBadges(reflectionCount)
    for (const badge of reflectionBadges) {
      const awarded = await this.awardBadge(userId, badge.id)
      if (awarded) newBadges.push(badge)
    }

    // Check streak badges
    const streakBadges = checkStreakBadges(currentStreak)
    for (const badge of streakBadges) {
      const awarded = await this.awardBadge(userId, badge.id)
      if (awarded) newBadges.push(badge)
    }

    // Check tag badges (first time using a tag)
    for (const tag of tags) {
      const isFirstTime = await this.isFirstTimeUsingTag(userId, tag)
      const tagBadges = checkTagBadges(tag, isFirstTime)
      for (const badge of tagBadges) {
        const awarded = await this.awardBadge(userId, badge.id)
        if (awarded) newBadges.push(badge)
      }
    }

    // Check time-based badges
    await this.checkTimeBadges(userId, newBadges)

    return newBadges
  }

  /**
   * Check if this is the first time user has used a specific tag
   */
  private async isFirstTimeUsingTag(userId: string, tag: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('reflections')
      .select('id')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .limit(1)

    // If we got exactly 1 result, this might be the first time
    // We need to check if the current reflection is that one
    return !error && (!data || data.length === 0)
  }

  /**
   * Check time-based badges (Early Bird, Night Owl, Weekend Warrior)
   */
  private async checkTimeBadges(userId: string, newBadges: Badge[]): Promise<void> {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday

    // Early Bird (before 8am)
    if (hour < 8) {
      const earlyBirdBadge = getBadgeById('milestone_early_bird')
      if (earlyBirdBadge) {
        const awarded = await this.awardBadge(userId, earlyBirdBadge.id)
        if (awarded) newBadges.push(earlyBirdBadge)
      }
    }

    // Night Owl (after 10pm)
    if (hour >= 22) {
      const nightOwlBadge = getBadgeById('milestone_night_owl')
      if (nightOwlBadge) {
        const awarded = await this.awardBadge(userId, nightOwlBadge.id)
        if (awarded) newBadges.push(nightOwlBadge)
      }
    }

    // Weekend Warrior (Saturday or Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const weekendBadge = getBadgeById('milestone_weekend_warrior')
      if (weekendBadge) {
        const hasWeekendReflections = await this.hasReflectedOnBothWeekendDays(userId)
        if (hasWeekendReflections) {
          const awarded = await this.awardBadge(userId, weekendBadge.id)
          if (awarded) newBadges.push(weekendBadge)
        }
      }
    }
  }

  /**
   * Check if user has reflected on both Saturday and Sunday
   */
  private async hasReflectedOnBothWeekendDays(userId: string): Promise<boolean> {
    // Get reflections from the last 7 days
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data, error } = await this.supabase
      .from('reflections')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())

    if (error || !data) return false

    let hasSaturday = false
    let hasSunday = false

    for (const reflection of data) {
      const date = new Date(reflection.created_at)
      const day = date.getDay()
      if (day === 0) hasSunday = true
      if (day === 6) hasSaturday = true
    }

    return hasSaturday && hasSunday
  }

  /**
   * Get total reflection count for user
   */
  async getTotalReflectionCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('reflections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error getting reflection count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Get achievement progress for all badges
   */
  async getAchievementProgress(userId: string): Promise<Map<string, { unlocked: boolean, earnedAt?: string }>> {
    const achievements = await this.getUserAchievements(userId)
    const progressMap = new Map()

    for (const achievement of achievements) {
      progressMap.set(achievement.badge_id, {
        unlocked: true,
        earnedAt: achievement.earned_at
      })
    }

    return progressMap
  }
}

// Export singleton instance
export const achievementService = new AchievementService()
