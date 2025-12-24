# 🚀 Quick Start Guide - Prompt & Pause

## Prerequisites

- Node.js 20+ installed
- npm or pnpm package manager
- Supabase account
- Resend account (for emails)
- OpenAI API key (or other AI provider)

---

## 🔧 Setup Instructions

### 1. Clone & Install

```bash
git clone [your-repo-url]
cd PandP
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers (at least one required)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Email
RESEND_API_KEY=your_resend_key

# Cron Security
CRON_SECRET=generate_random_secret

# Optional
ENCRYPTION_KEY=your_encryption_key
```

### 3. Database Setup

Run SQL migrations in Supabase SQL Editor (in order):

```bash
# Core tables
database/create_admin_users_table.sql
database/create_support_tickets_tables.sql
database/create_maintenance_mode_table.sql

# Trial system
database/setup_7day_trial.sql
database/setup_email_queue.sql

# Email templates
database/seed_all_email_templates.sql

# Admin functions
database/admin_dashboard_stats_functions.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🎯 First Steps

### Create Your First User

1. Go to `/auth/signup`
2. Sign up with email or Google
3. Verify email (check inbox)
4. Complete onboarding
5. Start reflecting!

### Create Admin User

Run in Supabase SQL Editor:

```sql
INSERT INTO admin_users (email, password_hash, role, is_active)
VALUES (
  'admin@yourdomain.com',
  crypt('your_secure_password', gen_salt('bf')),
  'super_admin',
  true
);
```

Access admin at: `/admin/login`

---

## 📁 Project Structure

```
PandP/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Main app
│   ├── admin/             # Admin dashboard
│   └── homepage/          # Landing pages
├── components/            # React components
├── lib/                   # Utilities & services
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── database/              # SQL migrations (organize here)
└── docs/                  # Documentation

```

---

## 🔑 Key Features to Test

1. **Signup & Login** - Email and Google OAuth
2. **Onboarding** - Complete the flow
3. **Daily Prompt** - Get AI-generated prompt
4. **Reflection** - Write and save
5. **Analytics** - View mood charts (premium)
6. **Achievements** - Unlock badges
7. **Settings** - Update preferences
8. **Admin** - Manage users and tickets

---

## 🐛 Common Issues

### API Routes Return 404
**Solution**: Restart dev server
```bash
# Ctrl+C to stop
npm run dev
```

### Database Connection Error
**Solution**: Check Supabase credentials in `.env.local`

### Email Not Sending
**Solution**: Verify Resend API key and domain setup

### AI Prompts Not Generating
**Solution**: Check AI provider API keys

---

## 📚 Documentation

- `README.md` - Main documentation
- `PROJECT_STATUS.md` - Current status & features
- `PROJECT_CLEANUP_GUIDE.md` - File organization
- `CAREERS.md` - Job listings
- `TRIAL_SYSTEM_SETUP.md` - Trial system docs
- `WELCOME_EMAIL_SETUP.md` - Email system docs

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Build the app
- Set up cron jobs
- Configure domains
- Enable analytics

---

## 🤝 Need Help?

- Check documentation in `/docs`
- Review `PROJECT_STATUS.md` for system overview
- Email: support@promptandpause.com

---

**You're all set! Start building amazing reflection experiences.** 🎉
