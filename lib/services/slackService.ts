import { WeeklyDigest } from '@/lib/types/reflection'
import { logger } from '@/lib/utils/logger'

/**
 * Slack Service for Prompt & Pause
 * 
 * Sends notifications to Slack using incoming webhooks.
 * Users can configure their Slack webhook URL in settings.
 */

/**
 * Send daily prompt to Slack
 * 
 * @param webhookUrl - User's Slack webhook URL
 * @param prompt - Daily reflection prompt text
 * @param userName - User's name for personalization
 * @returns Promise with success status
 */
export async function sendDailyPromptToSlack(
  webhookUrl: string,
  prompt: string,
  userName: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return { success: false, error: 'Invalid Slack webhook URL' }
    }

    const name = userName || 'there'
    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✨ Your Daily Reflection Prompt',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Good day, *${name}*! 👋`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 ${today}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `💭 *Today's Prompt:*\n\n_"${prompt}"_`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Take a moment to pause and reflect on this question. Set aside a few minutes today to explore your thoughts.',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Write Reflection',
                emoji: true,
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'}/dashboard`,
              style: 'primary',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Prompt & Pause • Mental Wellness_',
            },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('slack_api_error', { status: response.status, errorText })
      return { success: false, error: `Slack API error: ${response.status}` }
    }
    return { success: true }

  } catch (error) {
    logger.error('slack_send_prompt_error', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send weekly digest to Slack
 * 
 * @param webhookUrl - User's Slack webhook URL
 * @param userName - User's name for personalization
 * @param digest - Weekly digest data
 * @returns Promise with success status
 */
export async function sendWeeklyDigestToSlack(
  webhookUrl: string,
  userName: string | null,
  digest: WeeklyDigest
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return { success: false, error: 'Invalid Slack webhook URL' }
    }

    const name = userName || 'there'
    const weekStart = new Date(digest.weekStart).toLocaleDateString('en-GB')
    const weekEnd = new Date(digest.weekEnd).toLocaleDateString('en-GB')

    // Build top tags text
    const topTagsText = digest.topTags.length > 0
      ? digest.topTags.map(({ tag, count }) => `• ${tag} (${count})`).join('\n')
      : '_No tags this week_'

    // Build mood distribution text
    const moodText = digest.moodDistribution.length > 0
      ? digest.moodDistribution.map(({ mood, count }) => `${mood} ${count}x`).join(' • ')
      : '_No moods tracked_'

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Your Weekly Reflection Summary',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hi *${name}*! Here's your reflection journey this week.`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 ${weekStart} - ${weekEnd}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Reflections Completed*\n${digest.totalReflections}`,
            },
            {
              type: 'mrkdwn',
              text: `*Current Streak*\n${digest.currentStreak} days 🔥`,
            },
            {
              type: 'mrkdwn',
              text: `*Average Words*\n${digest.averageWordCount}`,
            },
            {
              type: 'mrkdwn',
              text: `*Total Entries*\n${digest.reflectionSummaries.length}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📌 Top Themes This Week*\n${topTagsText}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*😊 Your Moods*\n${moodText}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Full Archive',
                emoji: true,
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'}/dashboard/archive`,
              style: 'primary',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Keep up the great work! 🌟_',
            },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('slack_api_error', { status: response.status, errorText })
      return { success: false, error: `Slack API error: ${response.status}` }
    }
    return { success: true }

  } catch (error) {
    logger.error('slack_send_digest_error', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test Slack webhook connection
 * 
 * @param webhookUrl - Slack webhook URL to test
 * @returns Promise with success status
 */
export async function testSlackWebhook(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return { success: false, error: 'Invalid Slack webhook URL' }
    }

    const message = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ *Slack connection successful!*\n\nYou\'ll now receive your daily prompts and weekly digests here.',
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Prompt & Pause • Test Message_',
            },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      return { success: false, error: `Slack returned status ${response.status}` }
    }

    return { success: true }

  } catch (error) {
    logger.error('slack_webhook_test_error', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validate Slack webhook URL format
 * 
 * @param url - URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidSlackWebhookUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    return (
      urlObj.protocol === 'https:' &&
      urlObj.hostname === 'hooks.slack.com' &&
      urlObj.pathname.startsWith('/services/')
    )
  } catch {
    return false
  }
}
