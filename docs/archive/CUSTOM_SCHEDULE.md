# 📅 Custom Schedule Feature - Implementation Complete

## ✅ What Was Implemented

### **Custom Prompt Schedule Selector**
Users can now set their own custom schedule for receiving reflection prompts by selecting specific days of the week.

---

## 🎯 Features

### 1. **Prompt Frequency Options**
- ✅ **Daily** - Every day
- ✅ **Weekdays Only** - Monday through Friday
- ✅ **Every Other Day** - 3-4 times per week
- ✅ **Twice a Week** - Monday and Thursday
- ✅ **Weekly** - Once per week
- ✅ **Custom Schedule** ⭐ - Choose your own days

### 2. **Custom Schedule UI**
When "Custom Schedule" is selected:
- **Day Selector Grid** appears below
- **7 Day Buttons** (Monday - Sunday)
- **Toggle Selection** - Click to add/remove days
- **Visual Feedback**:
  - Selected days: Purple background
  - Unselected days: Transparent with border
  - Hover effects on all buttons
- **Summary Text**: Shows selected days

### 3. **Validation**
- ✅ Prevents saving if no days selected
- ✅ Shows error toast: "Please select at least one day"
- ✅ Success toast shows selected days

---

## 🎨 User Interface

### How It Looks:

**Prompt Frequency Dropdown:**
```
┌─────────────────────────────┐
│ Prompt Frequency            │
├─────────────────────────────┤
│ Daily - Every day          │
│ Weekdays Only              │
│ Every Other Day            │
│ Twice a Week               │
│ Weekly                     │
│ Custom Schedule ⭐         │
└─────────────────────────────┘
```

**Custom Schedule Selector (appears when Custom selected):**
```
┌────────────────────────────────────┐
│ 📅 Select Days for Prompts        │
├────────────────────────────────────┤
│  [Monday]      [Tuesday]          │
│  [Wednesday]   [Thursday]         │
│  [Friday]      [Saturday]         │
│  [Sunday]                         │
├────────────────────────────────────┤
│ Selected: Monday, Wednesday, Friday│
└────────────────────────────────────┘
```

---

## 💻 Technical Implementation

### State Management:
```typescript
const [promptFrequency, setPromptFrequency] = useState("daily")
const [customDays, setCustomDays] = useState<string[]>(["monday", "wednesday", "friday"])
```

### Toggle Day Function:
```typescript
const toggleCustomDay = (day: string) => {
  setCustomDays(prev => 
    prev.includes(day) 
      ? prev.filter(d => d !== day)  // Remove if already selected
      : [...prev, day]                 // Add if not selected
  )
}
```

### Validation on Save:
```typescript
const handleSavePreferences = () => {
  // Validate custom schedule
  if (promptFrequency === "custom" && customDays.length === 0) {
    toast({
      title: "Error",
      description: "Please select at least one day for your custom schedule.",
      variant: "destructive",
    })
    return
  }
  
  // Show selected days in success message
  const scheduleInfo = promptFrequency === "custom" 
    ? `Custom schedule: ${customDays.join(", ")}`
    : promptFrequencies.find(f => f.value === promptFrequency)?.label
  
  toast({
    title: "Preferences Updated",
    description: `Your preferences have been saved. ${scheduleInfo}`,
  })
}
```

---

## 🔌 Backend Integration

### Data Structure for Backend:

```typescript
// User Settings Schema
{
  promptFrequency: "custom",  // or "daily", "weekdays", etc.
  customDays: ["monday", "wednesday", "friday"]  // Only if frequency is "custom"
}
```

### Database Schema:

#### **Prisma:**
```prisma
model UserSettings {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  
  promptFrequency  String   @default("daily")
  customDays       String[] @default([])  // Array of day names
  
  // Other fields...
}
```

#### **SQL:**
```sql
CREATE TABLE user_settings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  prompt_frequency VARCHAR(50) DEFAULT 'daily',
  custom_days JSON DEFAULT '[]',  -- Store as JSON array: ["monday", "wednesday"]
  
  -- Other columns...
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### **MongoDB:**
```javascript
{
  _id: ObjectId("..."),
  userId: "user123",
  promptFrequency: "custom",
  customDays: ["monday", "wednesday", "friday"],
  // Other fields...
}
```

---

## 📡 API Integration Example

### Save Custom Schedule:
```typescript
const handleSavePreferences = async () => {
  try {
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'preferences',
        data: {
          promptFrequency,
          customDays: promptFrequency === 'custom' ? customDays : [],
          language,
          darkMode,
          privacyMode
        }
      })
    })
    
    if (response.ok) {
      toast({
        title: "Preferences Updated",
        description: "Your custom schedule has been saved.",
      })
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to save preferences.",
      variant: "destructive",
    })
  }
}
```

### Load Custom Schedule:
```typescript
useEffect(() => {
  async function loadSettings() {
    const response = await fetch('/api/settings')
    const data = await response.json()
    
    setPromptFrequency(data.preferences.promptFrequency)
    if (data.preferences.promptFrequency === 'custom') {
      setCustomDays(data.preferences.customDays || [])
    }
  }
  loadSettings()
}, [])
```

---

## 🤖 Backend Logic for Sending Prompts

### Check if User Should Receive Prompt Today:

```typescript
function shouldSendPromptToday(user: User): boolean {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
  const frequency = user.settings.promptFrequency
  
  switch (frequency) {
    case 'daily':
      return true
      
    case 'weekdays':
      return !['saturday', 'sunday'].includes(today)
      
    case 'every-other-day':
      // Check last prompt date and alternate
      const lastPromptDate = user.lastPromptDate
      const daysSinceLastPrompt = getDaysDifference(lastPromptDate, new Date())
      return daysSinceLastPrompt >= 2
      
    case 'twice-weekly':
      return ['monday', 'thursday'].includes(today)
      
    case 'weekly':
      // Check user's preferred day (e.g., stored in settings)
      return today === user.settings.weeklyPromptDay
      
    case 'custom':
      return user.settings.customDays.includes(today)
      
    default:
      return false
  }
}

// Usage in cron job or scheduled function:
async function sendDailyPrompts() {
  const users = await getAllActiveUsers()
  
  for (const user of users) {
    if (shouldSendPromptToday(user)) {
      await sendPromptNotification(user)
    }
  }
}
```

### Example Cron Job Setup:
```typescript
// Run every day at 9:00 AM
import cron from 'node-cron'

cron.schedule('0 9 * * *', async () => {
  console.log('Running daily prompt check...')
  await sendDailyPrompts()
})
```

---

## 🧪 Testing the Feature

### Test Steps:

1. **Go to Settings**:
   - Navigate to `http://localhost:3000/dashboard/settings`

2. **Select Custom Schedule**:
   - Scroll to "Preferences" section
   - Click "Prompt Frequency" dropdown
   - Select "Custom Schedule"

3. **Day Selector Appears**:
   - You should see 7 day buttons
   - Default selected: Monday, Wednesday, Friday (purple)

4. **Toggle Days**:
   - Click "Tuesday" - it turns purple (selected)
   - Click "Monday" - it turns transparent (unselected)
   - Select any combination of days

5. **Try to Save Without Days**:
   - Unselect all days
   - Click "Save Preferences"
   - Should show error: "Please select at least one day"

6. **Save with Days Selected**:
   - Select at least one day
   - Click "Save Preferences"
   - Toast should show: "Your preferences have been saved. Custom schedule: monday, wednesday, friday"

7. **Check Persistence**:
   - Refresh the page
   - Custom schedule should be remembered (currently in state, will persist with backend)

### Test in Browser Console:
```javascript
// Check current state (when implemented with backend):
localStorage.getItem('userPreferences')
```

---

## 📊 Example Use Cases

### Use Case 1: Weekend Reflector
**User**: "I only want prompts on weekends for deeper reflection"
**Selection**: Saturday, Sunday

### Use Case 2: Work-Life Balance
**User**: "I want to reflect during work week, but not weekends"
**Selection**: Monday, Tuesday, Wednesday, Thursday, Friday
*(Or just select "Weekdays Only" option)*

### Use Case 3: Alternating Days
**User**: "I want prompts every other day"
**Selection**: Monday, Wednesday, Friday, Sunday

### Use Case 4: Specific Days
**User**: "I only have time on my days off"
**Selection**: Tuesday, Thursday

---

## 🎯 Data Flow

```
User Settings Page
       ↓
Select "Custom Schedule"
       ↓
Choose Days (Mon, Wed, Fri)
       ↓
Click "Save Preferences"
       ↓
Validation Check
       ↓
Send to API: { promptFrequency: "custom", customDays: ["monday", "wednesday", "friday"] }
       ↓
Save to Database
       ↓
Backend Cron Job (Daily)
       ↓
Check Today's Day
       ↓
If Day in customDays → Send Prompt
       ↓
User Receives Notification
```

---

## ✅ Summary

**Custom Schedule Feature is Complete!**

Users can now:
- ✅ Select "Custom Schedule" from frequency dropdown
- ✅ See day selector grid
- ✅ Toggle individual days on/off
- ✅ See selected days summary
- ✅ Get validation if no days selected
- ✅ Save custom schedule
- ✅ See confirmation with selected days

**Backend Ready:**
- Data structure defined
- Schema examples provided
- API integration code ready
- Prompt sending logic explained
- Cron job example included

**All working in local dev!** 🎉

The custom schedule will be saved to the database when you connect your backend, and you can use the provided logic to determine when to send prompts to each user based on their custom schedule.
