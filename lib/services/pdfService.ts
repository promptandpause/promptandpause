import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'

interface UserDataExport {
  profile: any
  reflections: any[]
  preferences: any
  exportDate: string
  email: string
  userId: string
}

/**
 * Generate a PDF document containing all user data
 * @param userData - Complete user data package
 * @returns Promise<Buffer> - PDF file as buffer
 */
export async function generateUserDataPDF(userData: UserDataExport): Promise<Buffer> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Embed logo
    let logoImage = null
    try {
      // Use dynamic import for server-only modules
      const fs = await import('fs')
      const path = await import('path')
      const logoPath = path.join(process.cwd(), 'public', 'prompt&pause-png.png')
      const logoBytes = fs.readFileSync(logoPath)
      logoImage = await pdfDoc.embedPng(logoBytes)
    } catch (error) {
      // Continue without logo if file not found
    }
    
    // Generate content
    await generateContent(pdfDoc, userData, font, boldFont, logoImage)
    
    // Serialize to bytes
    const pdfBytes = await pdfDoc.save()
    
    return Buffer.from(pdfBytes)
  } catch (error) {
    throw error
  }
}

async function generateContent(
  pdfDoc: PDFDocument,
  userData: UserDataExport,
  font: PDFFont,
  boldFont: PDFFont,
  logoImage: any
) {
  const { profile, reflections, preferences, exportDate } = userData
  
  // Clean, minimalist color scheme
  const primaryColor = rgb(0, 0, 0) // Black for text
  const darkGray = rgb(0.2, 0.2, 0.2) // #333333
  const textColor = rgb(0.3, 0.3, 0.3) // Body text
  const lightGray = rgb(0.6, 0.6, 0.6) // Secondary text
  const borderColor = rgb(0.9, 0.9, 0.9) // Light borders
  const accentColor = rgb(0.15, 0.15, 0.15) // Accents
  
  let page = pdfDoc.addPage([595, 842]) // A4 size
  const pageWidth = 595
  const pageHeight = 842
  let y = 780
  
  // Clean header - centered logo, no background
  if (logoImage) {
    const logoHeight = 60
    const logoAspectRatio = logoImage.width / logoImage.height
    const logoWidth = logoHeight * logoAspectRatio
    
    // Center the logo
    const logoX = (pageWidth - logoWidth) / 2
    
    page.drawImage(logoImage, {
      x: logoX,
      y: pageHeight - 90,
      width: logoWidth,
      height: logoHeight,
    })
    
    y = pageHeight - 110
  } else {
    // Fallback: centered text
    const companyText = 'PROMPT & PAUSE'
    page.drawText(companyText, {
      x: (pageWidth - 200) / 2,
      y: pageHeight - 60,
      size: 24,
      font: boldFont,
      color: primaryColor,
    })
    y = pageHeight - 90
  }
  
  // Thin separator line
  page.drawLine({
    start: { x: 100, y: y },
    end: { x: pageWidth - 100, y: y },
    thickness: 0.5,
    color: borderColor,
  })
  
  y -= 40
  
  // Title - centered and clean
  const titleText = 'Personal Data Export'
  page.drawText(titleText, {
    x: (pageWidth - 280) / 2,
    y,
    size: 28,
    font: boldFont,
    color: primaryColor,
  })
  
  y -= 50
  
  // Clean metadata section (no box, just text)
  const exportDateFormatted = new Date(exportDate).toLocaleString('en-GB', { 
    dateStyle: 'long', 
    timeStyle: 'short' 
  })
  
  page.drawText('Export Date', {
    x: 50,
    y,
    size: 9,
    font: boldFont,
    color: lightGray,
  })
  
  page.drawText(exportDateFormatted, {
    x: 150,
    y,
    size: 10,
    font,
    color: textColor,
  })
  
  y -= 20
  
  page.drawText('Document ID', {
    x: 50,
    y,
    size: 9,
    font: boldFont,
    color: lightGray,
  })
  
  page.drawText(userData.userId.substring(0, 18) + '...', {
    x: 150,
    y,
    size: 9,
    font,
    color: textColor,
  })
  
  y -= 60
  
  // Profile Information Section
  y = addCleanSection(page, 'PROFILE INFORMATION', y, boldFont, primaryColor, pageWidth)
  y -= 5
  
  y = addCleanKeyValue(page, 'Full Name', sanitizeText(profile?.full_name || 'Not set'), y, font, boldFont, textColor, lightGray, pageWidth)
  y = addCleanKeyValue(page, 'Email Address', sanitizeText(userData.email), y, font, boldFont, textColor, lightGray, pageWidth)
  
  // Full User ID with wrapping if needed
  const fullUserId = userData.userId
  if (fullUserId.length > 45) {
    const line1 = fullUserId.substring(0, 45)
    const line2 = fullUserId.substring(45)
    y = addCleanKeyValue(page, 'User ID', line1, y, font, boldFont, textColor, lightGray, pageWidth)
    page.drawText(line2, {
      x: 200,
      y: y + 15,
      size: 9,
      font,
      color: textColor,
    })
  } else {
    y = addCleanKeyValue(page, 'User ID', fullUserId, y, font, boldFont, textColor, lightGray, pageWidth)
  }
  
  const subscriptionStatus = sanitizeText(profile?.subscription_status || 'free')
  y = addCleanKeyValue(page, 'Subscription', subscriptionStatus.toUpperCase(), y, font, boldFont, textColor, lightGray, pageWidth)
  y = addCleanKeyValue(page, 'Timezone', sanitizeText(profile?.timezone || 'Not set'), y, font, boldFont, textColor, lightGray, pageWidth)
  y = addCleanKeyValue(page, 'Member Since', profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' }) : 'Unknown', y, font, boldFont, textColor, lightGray, pageWidth)
  
  y -= 25
  
  // Preferences
  if (preferences) {
    y = addCleanSection(page, 'PREFERENCES', y, boldFont, primaryColor, pageWidth)
    y -= 5
    y = addCleanKeyValue(page, 'Language', (preferences.language || 'en').toUpperCase(), y, font, boldFont, textColor, lightGray, pageWidth)
    y = addCleanKeyValue(page, 'Notifications', preferences.notifications_enabled ? 'Enabled' : 'Disabled', y, font, boldFont, textColor, lightGray, pageWidth)
    y = addCleanKeyValue(page, 'Daily Reminders', preferences.daily_reminders ? 'Enabled' : 'Disabled', y, font, boldFont, textColor, lightGray, pageWidth)
    y = addCleanKeyValue(page, 'Weekly Digest', preferences.weekly_digest ? 'Enabled' : 'Disabled', y, font, boldFont, textColor, lightGray, pageWidth)
    y = addCleanKeyValue(page, 'Reminder Time', preferences.reminder_time || 'Not set', y, font, boldFont, textColor, lightGray, pageWidth)
    y = addCleanKeyValue(page, 'Privacy Mode', preferences.privacy_mode ? 'Enabled' : 'Disabled', y, font, boldFont, textColor, lightGray, pageWidth)
    
    y -= 25
  }
  
  // Statistics with clean cards
  y = addCleanSection(page, 'STATISTICS', y, boldFont, primaryColor, pageWidth)
  y -= 10
  
  const moods = reflections.map(r => r.mood).filter(Boolean)
  const uniqueMoods = new Set(moods)
  const totalWords = reflections.reduce((sum, r) => {
    return sum + (r.reflection_text?.split(/\s+/).length || 0)
  }, 0)
  const avgWords = reflections.length > 0 ? Math.round(totalWords / reflections.length) : 0
  
  // Stats cards in row
  const cardWidth = 150
  const cardHeight = 70
  const cardGap = 15
  const startX = 50
  
  // Card 1: Total Reflections
  page.drawRectangle({
    x: startX,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    borderColor: borderColor,
    borderWidth: 1,
  })
  page.drawText(reflections.length.toString(), {
    x: startX + 15,
    y: y - 30,
    size: 28,
    font: boldFont,
    color: primaryColor,
  })
  page.drawText('Total Reflections', {
    x: startX + 15,
    y: y - 55,
    size: 8,
    font,
    color: lightGray,
  })
  
  // Card 2: Unique Moods
  page.drawRectangle({
    x: startX + cardWidth + cardGap,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    borderColor: borderColor,
    borderWidth: 1,
  })
  page.drawText(uniqueMoods.size.toString(), {
    x: startX + cardWidth + cardGap + 15,
    y: y - 30,
    size: 28,
    font: boldFont,
    color: primaryColor,
  })
  page.drawText('Unique Moods', {
    x: startX + cardWidth + cardGap + 15,
    y: y - 55,
    size: 8,
    font,
    color: lightGray,
  })
  
  // Card 3: Avg Words
  page.drawRectangle({
    x: startX + (cardWidth + cardGap) * 2,
    y: y - cardHeight,
    width: cardWidth,
    height: cardHeight,
    borderColor: borderColor,
    borderWidth: 1,
  })
  page.drawText(avgWords.toString(), {
    x: startX + (cardWidth + cardGap) * 2 + 15,
    y: y - 30,
    size: 28,
    font: boldFont,
    color: primaryColor,
  })
  page.drawText('Avg Words/Entry', {
    x: startX + (cardWidth + cardGap) * 2 + 15,
    y: y - 55,
    size: 8,
    font,
    color: lightGray,
  })
  
  y -= cardHeight + 10
  
  // Reflections
  if (reflections.length > 0) {
    page = pdfDoc.addPage([595, 842])
    y = 780
    
    y = addCleanSection(page, 'REFLECTIONS', y, boldFont, primaryColor, pageWidth)
    page.drawText(`${reflections.length} entries total${reflections.length > 20 ? ' • Showing first 20' : ''}`, {
      x: 50,
      y: y - 5,
      size: 8,
      font,
      color: lightGray,
    })
    
    y -= 35
    
    for (let i = 0; i < Math.min(reflections.length, 20); i++) { // Limit to first 20 for PDF size
      const reflection = reflections[i]
      
      // Check if we need a new page
      if (y < 120) {
        page = pdfDoc.addPage([595, 842])
        y = 780
      }
      
      // Entry number (clean, no badge)
      page.drawText(`${i + 1}.`, {
        x: 50,
        y: y - 12,
        size: 11,
        font: boldFont,
        color: primaryColor,
      })
      
      // Reflection title
      const title = sanitizeText((reflection.prompt_text || 'Untitled').substring(0, 60))
      page.drawText(title, {
        x: 70,
        y: y - 12,
        size: 11,
        font: boldFont,
        color: primaryColor,
      })
      
      y -= 25
      
      // Date and mood on same line
      const dateStr = new Date(reflection.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })
      page.drawText(`${dateStr}`, {
        x: 50,
        y,
        size: 9,
        font,
        color: lightGray,
      })
      
      if (reflection.mood) {
        const moodText = sanitizeText(reflection.mood)
        page.drawText(`• ${moodText}`, {
          x: 150,
          y,
          size: 9,
          font,
          color: textColor,
        })
      }
      
      y -= 22
      
      // Reflection text (truncated) with background
      let rawText = reflection.reflection_text || 'No reflection text'
      try {
        const { decryptIfEncrypted } = await import('@/lib/utils/crypto')
        const dec = decryptIfEncrypted(rawText)
        if (dec) rawText = dec
      } catch {}
      const text = sanitizeText(rawText.substring(0, 250))
      const lines = wrapText(text, 75) // Wrap at 75 characters
      const maxLines = Math.min(lines.length, 3)
      
      // Subtle background box for text
      page.drawRectangle({
        x: 50,
        y: y - (maxLines * 14) - 5,
        width: pageWidth - 100,
        height: (maxLines * 14) + 10,
        borderColor: borderColor,
        borderWidth: 0.5,
      })
      
      for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
        page.drawText(lines[lineIdx], {
          x: 60,
          y: y - (lineIdx * 14),
          size: 9,
          font,
          color: textColor,
        })
      }
      
      y -= (maxLines * 14) + 10
      
      if (text.length > 250 || lines.length > 3) {
        page.drawText('...', {
          x: 60,
          y,
          size: 9,
          font,
          color: lightGray,
        })
        y -= 10
      }
      
      // Tags as simple text
      if (reflection.tags && reflection.tags.length > 0) {
        y -= 10
        const tagsText = reflection.tags.slice(0, 5).map(t => sanitizeText(t)).join(' • ')
        page.drawText(tagsText.substring(0, 80), {
          x: 50,
          y,
          size: 8,
          font,
          color: lightGray,
        })
        y -= 15
      }
      
      y -= 15 // Space between entries
    }
    
    if (reflections.length > 20) {
      y -= 20
      page.drawText(`... and ${reflections.length - 20} more reflections`, {
        x: 50,
        y,
        size: 12,
        font,
        color: grayColor,
      })
    }
  }
  
  // Modern footer on last page
  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1]
  const footerY = 60
  
  // Footer separator line
  lastPage.drawLine({
    start: { x: 50, y: footerY },
    end: { x: pageWidth - 50, y: footerY },
    thickness: 0.5,
    color: lightGray,
  })
  
  lastPage.drawText('This document contains your personal data from Prompt & Pause.', {
    x: 50,
    y: footerY - 20,
    size: 9,
    font,
    color: lightGray,
  })
  lastPage.drawText('For privacy concerns or data deletion requests, contact support@promptandpause.com', {
    x: 50,
    y: footerY - 35,
    size: 9,
    font,
    color: lightGray,
  })
  
  lastPage.drawText('© 2026 Prompt & Pause. All rights reserved.', {
    x: pageWidth - 220,
    y: footerY - 35,
    size: 8,
    font,
    color: lightGray,
  })
}

// Clean helper function for section headers
function addCleanSection(
  page: PDFPage,
  title: string,
  y: number,
  boldFont: PDFFont,
  color: any,
  pageWidth: number
): number {
  // Simple underline
  page.drawLine({
    start: { x: 50, y: y - 2 },
    end: { x: 180, y: y - 2 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  })
  
  page.drawText(title, {
    x: 50,
    y,
    size: 12,
    font: boldFont,
    color,
  })
  return y - 28
}

// Clean helper function for key-value pairs
function addCleanKeyValue(
  page: PDFPage,
  key: string,
  value: string,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  valueColor: any,
  keyColor: any,
  pageWidth: number
): number {
  page.drawText(key, {
    x: 50,
    y,
    size: 9,
    font,
    color: keyColor,
  })
  
  // Value
  page.drawText(value, {
    x: 200,
    y,
    size: 9,
    font: boldFont,
    color: valueColor,
  })
  
  return y - 20
}

function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  
  if (currentLine) lines.push(currentLine)
  return lines
}

/**
 * Remove emojis and non-WinAnsi characters from text
 * Replaces them with their text equivalents where possible
 */
function sanitizeText(text: string): string {
  if (!text) return ''
  
  // Common emoji to text mappings
  const emojiMap: Record<string, string> = {
    '😊': ':)',
    '😃': ':D',
    '😢': ':(',
    '😡': '>:(',
    '😍': '<3',
    '😎': 'B)',
    '🔥': '[fire]',
    '❤️': '<3',
    '👍': '[thumbs up]',
    '👎': '[thumbs down]',
    '⭐': '[star]',
    '✨': '[sparkles]',
    '🎉': '[party]',
    '💪': '[strong]',
    '🙏': '[pray]',
  }
  
  let sanitized = text
  
  // Replace known emojis with text
  for (const [emoji, replacement] of Object.entries(emojiMap)) {
    sanitized = sanitized.split(emoji).join(replacement)
  }
  
  // Remove any remaining emojis and special Unicode characters
  // Keep only ASCII printable characters and common extended Latin
  sanitized = sanitized.replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
  
  return sanitized
}
