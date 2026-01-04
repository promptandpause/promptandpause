# Prompt & Pause - Developer Documentation

## 🚀 GETTING STARTED

### **System Overview**
Prompt & Pause is a mental health reflection platform built with:
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **AI Integration**: Multiple AI providers (OpenAI, Anthropic, Groq)

### **Tech Stack**
```
Frontend:
├─ Next.js 14 (App Router)
├─ TypeScript 5+
├─ Tailwind CSS + shadcn/ui
├─ Framer Motion (animations)
├─ Lucide React (icons)

Backend:
├─ Next.js API Routes
├─ Supabase (Database + Auth)
├─ PostgreSQL
├─ Prisma (optional ORM)
├─ Zod (validation)

Infrastructure:
├─ Vercel (Hosting)
├─ Supabase (Backend as a Service)
├─ Stripe (Payments)
├─ Resend (Email)
├─ Multiple AI APIs
```

---

## 🏗️ PROJECT STRUCTURE

```
promptandpause/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── signin/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (homepage)/               # Public pages
│   │   ├── page.tsx
│   │   ├── terms-of-service/
│   │   ├── privacy-policy/
│   │   └── cookie-policy/
│   ├── dashboard/                # Protected dashboard
│   │   ├── page.tsx
│   │   ├── journals/
│   │   ├── settings/
│   │   ├── achievements/
│   │   ├── archive/
│   │   ├── support/
│   │   └── components/
│   └── api/                      # API routes
│       ├── auth/
│       ├── user/
│       ├── prompts/
│       ├── premium/
│       └── cron/
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui components
│   ├── auth/                    # Auth-specific components
│   └── common/                  # Shared components
├── lib/                         # Utility libraries
│   ├── services/                # Business logic
│   ├── supabase/               # Supabase client
│   ├── utils/                   # Helper functions
│   └── types/                   # TypeScript definitions
├── hooks/                       # Custom React hooks
├── docs/                        # Documentation
├── Sql scripts/                 # Database migrations
└── public/                      # Static assets
```

---

## 🔧 DEVELOPMENT SETUP

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)
- AI API keys (OpenAI, Anthropic, Groq)

### **Local Development**
```bash
# Clone repository
git clone https://github.com/your-org/promptandpause.git
cd promptandpause

# Install dependencies
npm install

# Environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Run SQL scripts in order from Sql scripts/ folder

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public

# Email (Resend)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@promptandpause.com

# Other
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ DATABASE SCHEMA

### **Core Tables**
```sql
-- Users & Authentication
profiles (user profiles with subscription info)
user_preferences (user settings and preferences)

-- Core Features
reflections (daily reflection responses)
self_journals (private journal entries)
prompts_history (generated prompts)
focus_areas (premium custom focus areas)
prompt_focus_area_usage (tracking focus area usage)

-- Subscription & Payments
subscriptions (Stripe subscription data)
subscription_events (webhook events)

-- Compliance
age_verification_tracking (age compliance logs)
data_processing_logs (GDPR compliance)
```

### **Key Relationships**
```
profiles (1) → (many) reflections
profiles (1) → (many) self_journals
profiles (1) → (many) focus_areas
focus_areas (many) → (many) prompt_focus_area_usage
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### **Authentication Flow**
```typescript
// Sign up flow
1. User enters email/password
2. Age verification required
3. Supabase Auth creates user
4. Profile created with compliance data
5. Redirect to dashboard

// Sign in flow
1. User enters credentials
2. Supabase Auth validates
3. Check age compliance
4. If not compliant, show age verification
5. Redirect to dashboard
```

### **Authorization Model**
```typescript
// Tier-based feature access
const getFeatureFlags = (tier: SubscriptionTier) => ({
  unlimitedPrompts: tier === 'premium',
  advancedAnalytics: tier === 'premium',
  customFocusAreas: tier === 'premium',
  weeklyInsights: tier === 'premium',
  exportData: tier !== 'free',
})

// RLS Policies in PostgreSQL
CREATE POLICY "Users can view own data" ON reflections
FOR SELECT USING (auth.uid() = user_id);
```

---

## 🤖 AI INTEGRATION

### **AI Service Architecture**
```typescript
// AI Provider Selection
class AIService {
  private providers = [
    new OpenAIProvider(),
    new AnthropicProvider(),
    new GroqProvider(),
    new GeminiProvider()
  ]
  
  async generatePrompt(context: GeneratePromptContext) {
    // Try providers in order of preference
    for (const provider of this.providers) {
      try {
        return await provider.generate(context)
      } catch (error) {
        continue // Try next provider
      }
    }
    throw new Error('All AI providers failed')
  }
}
```

### **Prompt Generation Flow**
```typescript
// 1. Gather user context
const context = await buildUserContext(userId)

// 2. Select focus area
const focusArea = selectFocusArea(context.focus_areas, isPremium)

// 3. Generate personalized prompt
const prompt = await aiService.generatePrompt({
  focus_areas: context.focus_areas,
  focus_area_name: focusArea,
  recent_moods: context.recentMoods,
  user_reason: context.userReason
})

// 4. Save and deliver
await savePrompt(prompt, userId)
await deliverPrompt(prompt, userId)
```

---

## 📊 ANALYTICS & INSIGHTS

### **Weekly Insights Generation**
```typescript
// Server-side analytics service
export class AnalyticsService {
  async generateWeeklyInsights(userId: string) {
    // 1. Fetch week's data
    const reflections = await this.getReflections(userId, 7)
    const journals = await this.getJournals(userId, 7)
    
    // 2. Calculate metrics
    const metrics = {
      moodDistribution: this.calculateMoodDistribution(reflections),
      topTags: this.extractTopTags(reflections, journals),
      averageWordCount: this.calculateAverageWordCount(reflections),
      currentStreak: this.calculateStreak(reflections)
    }
    
    // 3. Generate AI insights
    const insights = await this.generateInsights(metrics)
    
    // 4. Save and deliver
    await this.saveInsights(userId, insights)
    await this.deliverInsights(userId, insights)
  }
}
```

---

## 💳 PAYMENT INTEGRATION

### **Subscription Flow**
```typescript
// Stripe webhook handling
export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object)
      break
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object)
      break
  }
}
```

### **Tier Management**
```typescript
// Real-time tier updates
const useTier = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free')
  
  useEffect(() => {
    // Listen for subscription changes
    const channel = supabase
      .channel('subscription-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, () => fetchTierData())
      .subscribe()
      
    return () => channel.unsubscribe()
  }, [])
}
```

---

## 📱 COMPONENT ARCHITECTURE

### **Component Hierarchy**
```
App
├── Navigation (public)
├── AuthPages
│   ├── SignInForm
│   ├── SignUpForm
│   └── AgeVerification
├── Dashboard
│   ├── DashboardSidebar
│   ├── Today's Prompt
│   ├── Quick Stats
│   └── Premium Upsell
└── DashboardPages
    ├── JournalsPage
    ├── SettingsPage
    ├── AchievementsPage
    └── ArchivePage
```

### **State Management**
```typescript
// Custom hooks for complex state
const useTier = () => { /* subscription state */ }
const useTheme = () => { /* theme state */ }
const useTranslation = () => { /* i18n state */ }
const useToast = () => { /* notification state */ }

// Context providers
<ThemeProvider>
  <LanguageProvider>
    <TierProvider>
      <App />
    </TierProvider>
  </LanguageProvider>
</ThemeProvider>
```

---

## 🔧 API DESIGN

### **RESTful API Structure**
```
Authentication:
POST /api/auth/signin
POST /api/auth/signup
POST /api/auth/verify-age
GET  /api/auth/detect-country

User Management:
GET  /api/user/profile
PUT  /api/user/profile
GET  /api/user/check-trial
POST /api/user/export-data
DELETE /api/user/delete-account

Prompts & AI:
GET  /api/prompts/today
POST /api/prompts/generate
GET  /api/prompts/history

Premium Features:
GET  /api/premium/focus-areas
POST /api/premium/focus-areas
PATCH /api/premium/focus-areas/:id
DELETE /api/premium/focus-areas/:id

Reflections:
GET  /api/reflections
POST /api/reflections
PUT  /api/reflections/:id
DELETE /api/reflections/:id

Journals:
GET  /api/journals
POST /api/journals
PUT  /api/journals/:id
DELETE /api/journals/:id
```

### **Error Handling**
```typescript
// Standardized API responses
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Error middleware
export function withErrorHandler(handler: Function) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status || 500 }
      )
    }
  }
}
```

---

## 🧪 TESTING STRATEGY

### **Testing Pyramid**
```
E2E Tests (Playwright)
├── User authentication flow
├── Age verification process
├── Subscription lifecycle
└── Core user journeys

Integration Tests
├── API endpoints
├── Database operations
├── AI service integration
└── Payment webhooks

Unit Tests (Jest)
├── Utility functions
├── Custom hooks
├── Component logic
└── Service classes
```

### **Testing Setup**
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 🚀 DEPLOYMENT

### **Environment Setup**
```
Development:
├─ Local development (npm run dev)
├─ Database: Local Supabase
└─ Environment: .env.local

Staging:
├─ Vercel preview deployments
├─ Staging Supabase
└─ Environment: Vercel env vars

Production:
├─ Vercel production
├─ Production Supabase
└─ Environment: Vercel env vars
```

### **Deployment Pipeline**
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: vercel/action@v1
```

---

## 🔍 DEBUGGING

### **Common Issues**
1. **Authentication Problems**
   - Check Supabase configuration
   - Verify environment variables
   - Check RLS policies

2. **AI API Failures**
   - Verify API keys
   - Check rate limits
   - Review provider status

3. **Database Issues**
   - Run migrations
   - Check RLS policies
   - Verify data types

### **Debugging Tools**
```typescript
// Debug logging
const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data)
  }
}

// Error boundaries
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo)
    // Send to error reporting service
  }
}
```

---

## 📚 RESOURCES

### **Documentation**
- [API Reference](./api-reference.md)
- [Database Schema](./database-schema.md)
- [Component Library](./component-library.md)
- [Deployment Guide](./deployment-guide.md)

### **External Resources**
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### **Community**
- [GitHub Discussions](https://github.com/your-org/promptandpause/discussions)
- [Discord Community](https://discord.gg/promptandpause)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/promptandpause)

---

## 🤝 CONTRIBUTING

### **Development Workflow**
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

### **Coding Standards**
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation

### **Pull Request Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```
