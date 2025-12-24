# Focus Areas - User Guide

## What Are Focus Areas?

Focus Areas are **custom topics** that personalize your daily reflection prompts. Instead of getting generic prompts, the AI creates questions specifically tailored to what matters most in your life right now.

---

## How Focus Areas Work

### 🎯 **The Problem They Solve**

Generic mental health prompts feel impersonal:
- ❌ "How are you feeling today?"
- ❌ "What made you happy?"
- ❌ "Describe your emotions"

These don't connect to your actual life challenges and goals.

### ✨ **How Focus Areas Help**

When you create focus areas like:
- 💼 **"Career Growth"**
- ❤️ **"Relationships"**
- 🏋️ **"Health & Fitness"**

The AI generates **personalized prompts** like:
- "What's one work challenge this week that's been teaching you something about yourself?"
- "Which relationship in your life feels most nurturing right now, and why?"
- "How is your body feeling today, and what is it asking for?"

---

## How To Use Focus Areas

### Premium Feature
Focus Areas are a **premium-only feature**. Premium users can:
- ✅ Create unlimited custom focus areas
- ✅ Choose custom icons and colors
- ✅ Add descriptions to organize their areas
- ✅ Track reflection counts per area
- ✅ Edit and delete focus areas anytime

### Step-by-Step Setup

#### 1. Navigate to Settings
Go to **Dashboard → Settings → Focus Areas Manager**

#### 2. Create Your First Focus Area
Click the **"+"** button to open the creation dialog

#### 3. Fill In The Details
- **Name** (required): What you want to focus on
  - Examples: "Career Stress", "Family Time", "Physical Health"
- **Description** (optional): Brief context about this area
  - Example: "Managing work-life balance and career transitions"
- **Icon**: Choose an emoji that represents this area
- **Color Theme**: Pick a color gradient for visual organization

#### 4. Save & Repeat
Create 2-5 focus areas for best results. Don't create too many - the AI works better with focused topics.

---

## Examples of Good Focus Areas

### ✅ **Specific & Personal**
- "Managing Anxiety at Work"
- "Rebuilding Confidence After Breakup"
- "Training for First Marathon"
- "Starting Creative Business"
- "Dealing with Parental Stress"

### ❌ **Too Vague**
- "Life" (too broad)
- "Stuff" (meaningless)
- "Things" (not specific)
- "General" (defeats the purpose)

---

## How The AI Uses Your Focus Areas

### Prompt Generation Process

1. **You Create Focus Areas**
   - Example: "Career Growth", "Mental Health"

2. **You Generate Daily Prompt**
   - Click "Generate Prompt" on dashboard

3. **AI Analyzes Your Context**
   - Focus areas: Career Growth, Mental Health
   - Recent moods: 😔, 😐, 😊
   - Recent topics: work, anxiety, progress
   - Your reason for joining: "manage work stress"

4. **AI Creates Personalized Prompt**
   - Instead of generic: "How are you feeling?"
   - You get: "What's one work win today that you're not giving yourself credit for?"

### What Influences Your Prompts

The AI considers:
- ✅ **Your focus areas** (primary influence)
- ✅ Recent moods (last 7 days)
- ✅ Recent reflection topics
- ✅ Your reason for joining Prompt & Pause
- ✅ Time of day and patterns

---

## Best Practices

### 📌 **Keep It Focused**
- Create 2-5 focus areas maximum
- More areas = diluted personalization
- Quality over quantity

### 🔄 **Update Regularly**
- Life changes, so should your focus areas
- Delete areas you've mastered
- Add new challenges as they arise

### 💡 **Be Specific**
- Bad: "Health"
- Better: "Weight Loss Journey"
- Best: "Training for 5K Race"

### 🎨 **Use Visual Organization**
- Different colors for different life domains
- Work/career: Blue/purple tones
- Relationships: Pink/red tones
- Health: Green tones
- Personal growth: Orange/yellow tones

---

## Tracking Your Progress

### Reflection Counts
Each focus area shows:
- **Number of reflections** related to that topic
- Helps you see which areas you're actively working on
- Identifies areas you might be avoiding

### Example Dashboard View
```
💼 Career Growth
   "Navigating leadership challenges"
   📈 12 reflections

❤️ Relationships  
   "Strengthening family bonds"
   📈 8 reflections

🏋️ Health & Fitness
   "Building consistent exercise habit"
   📈 3 reflections ⚠️ (might need more attention!)
```

---

## Technical Details

### Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| Custom Focus Areas | ❌ | ✅ |
| Predefined Focus Areas | ✅ | ✅ |
| AI Personalization | Basic | Advanced |
| Unlimited Areas | ❌ | ✅ |
| Custom Icons/Colors | ❌ | ✅ |
| Reflection Tracking | ❌ | ✅ |

### Data Storage
- Focus areas are stored in `focus_areas` table
- Linked to your user account via `user_id`
- Synced automatically across devices
- Never shared with other users

### Privacy & Security
- ✅ Your focus areas are private
- ✅ AI processing happens server-side (secure)
- ✅ Not visible to other users
- ✅ Can be deleted anytime
- ✅ Included in account deletion

---

## Troubleshooting

### Problem: "My prompts don't mention my focus areas"

**Solutions:**
1. **Check you have focus areas created**
   - Go to Settings → Focus Areas
   - Make sure you have at least one area created

2. **Regenerate your prompt**
   - Focus areas only affect NEW prompts
   - Click "Generate Prompt" to get a fresh one

3. **Be patient with AI**
   - AI doesn't always explicitly mention the focus area name
   - It creates prompts ABOUT that topic indirectly
   - Example: Focus area "Career" → Prompt: "What work challenge taught you something?"

4. **Check console logs (dev mode)**
   - Open browser dev tools (F12)
   - Look for: `Using premium focus areas: [...]`
   - Confirms AI is receiving your areas

### Problem: "I can't create focus areas"

**Solutions:**
- Verify you have **premium subscription active**
- Check Settings → Account → Subscription Status
- If expired, renew subscription
- If bug persists, contact support

### Problem: "Focus areas aren't saving"

**Solutions:**
1. Check internet connection
2. Try refreshing the page
3. Check browser console for errors
4. Clear browser cache
5. Try different browser

---

## FAQ

### Q: How many focus areas should I create?
**A:** 2-5 is ideal. Too many dilutes personalization.

### Q: Can I edit focus areas after creating them?
**A:** Yes! Click the edit icon (pencil) on any focus area.

### Q: What happens if I delete a focus area?
**A:** The area is permanently deleted, but your reflections remain unchanged.

### Q: Do focus areas affect old prompts?
**A:** No, only NEW prompts generated after you create the focus area.

### Q: Can I share focus areas with friends?
**A:** No, focus areas are private and personal to your account.

### Q: Does the AI always mention the focus area by name?
**A:** No - it creates prompts ABOUT the topic, not necessarily mentioning the name.

### Q: Can I temporarily disable a focus area?
**A:** Not directly, but you can delete it and recreate it later with the same settings.

---

## Real User Examples

### Example 1: Career Transition
**Focus Area:** "Switching Careers at 35"  
**Description:** "Navigating fear and excitement of career change"

**Prompts Generated:**
- "What skill from your old career is surprisingly useful in this transition?"
- "When you imagine yourself thriving in your new career, what does a typical day look like?"
- "What's the scariest part of this change, and what's exciting you most?"

### Example 2: New Parent
**Focus Area:** "First-Time Parenting"  
**Description:** "Adjusting to life with a newborn"

**Prompts Generated:**
- "What's one tiny moment of joy today that parenting gave you?"
- "When you feel overwhelmed, what would help you feel more supported?"
- "What kind of parent are you becoming that surprises you?"

### Example 3: Mental Health
**Focus Area:** "Managing Depression"  
**Description:** "Building better mental health habits"

**Prompts Generated:**
- "On a scale of 1-10, how's your energy today, and what might help?"
- "What's one thing that felt even slightly easier this week?"
- "When did you feel most like yourself recently?"

---

## Tips From Power Users

> **Sarah, 2 years on Prompt & Pause:**  
> "I rotate my focus areas every 3 months. When I've made progress on something, I archive it and add a new challenge. Keeps the prompts fresh and relevant."

> **Marcus, Premium member:**  
> "I use color coding - blue for work, green for health, pink for relationships. Makes it easy to see which life areas I'm neglecting in my reflection history."

> **Aisha, Mental health advocate:**  
> "Be honest with your focus areas. If anxiety is the real issue, name it 'Anxiety Management', not 'General Wellness'. Specific names = better prompts."

---

## Related Features

### Works Great With:
- **AI Insights** - Analyzes patterns in your focus area reflections
- **Tags** - Tag reflections with focus area names
- **Analytics** - Track progress over time per focus area
- **Email Prompts** - Get personalized prompts delivered daily

---

## Need Help?

**In-App Support:**
- Click profile → Help Center
- Live chat with support team

**Documentation:**
- `docs/AI_PROMPT_PERSONALIZATION.md` - Technical details
- `docs/PREMIUM_FEATURES.md` - All premium features

**Community:**
- Join our Discord for tips from other users
- Share your focus area strategies

---

**Last Updated:** October 13, 2025  
**Version:** 2.0  
**Status:** ✅ Live for Premium Users
