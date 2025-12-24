# Prompt & Pause 🧘‍♀️

A mindfulness and reflection platform that helps users pause, reflect, and grow through daily prompts and journaling.

## 🚀 Quick Start

New to the project? **Start here:**
1. 📖 Read [`docs/guides/START_HERE.md`](docs/guides/START_HERE.md)
2. 🛠️ Follow setup guides in [`docs/guides/`](docs/guides/)
3. 🏗️ Review architecture in [`docs/architecture/`](docs/architecture/)

## 📁 Project Structure

```
PandP/
├── app/                    # Next.js App Router pages and components
├── components/             # Reusable React components
├── lib/                    # Utilities, services, and business logic
├── public/                 # Static assets
├── supabase/              # Supabase configuration and migrations
│
├── 📄 docs/               # All documentation (organized by category)
│   ├── implementation/    # Feature implementation notes
│   ├── guides/           # Setup and operational guides
│   ├── architecture/     # System design and database schema
│   └── archive/          # Historical documentation
│
└── 🗄️ sql/               # All SQL files (organized by purpose)
    ├── migrations/       # Database migrations
    │   ├── admin/       # Admin panel migrations
    │   ├── core/        # Core schema migrations
    │   └── features/    # Feature-specific migrations
    ├── scripts/         # Utility and diagnostic scripts
    └── supabase-schema.sql  # Complete schema definition
```

## 📚 Documentation

All documentation is now organized in the [`docs/`](docs/) folder:

### Implementation Notes
Located in [`docs/implementation/`](docs/implementation/)
- Dark mode implementation
- Admin panel development
- UI improvements and refinements

### Guides & Setup
Located in [`docs/guides/`](docs/guides/)
- [START_HERE.md](docs/guides/START_HERE.md) - Main entry point
- [DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) - Production deployment
- [TESTING_GUIDE.md](docs/guides/TESTING_GUIDE.md) - Testing procedures
- [STRIPE_SETUP.md](docs/guides/STRIPE_SETUP.md) - Payment setup
- [EMAIL_SETUP.md](docs/guides/EMAIL_SETUP.md) - Email configuration

### Architecture
Located in [`docs/architecture/`](docs/architecture/)
- [SUPABASE_SCHEMA.md](docs/architecture/SUPABASE_SCHEMA.md) - Database design

📖 **[View full documentation index](docs/README.md)**

## 🗄️ Database & SQL

All SQL files are organized in the [`sql/`](sql/) folder:

### Migrations
- **Admin Panel**: [`sql/migrations/admin/`](sql/migrations/admin/)
- **Core Schema**: [`sql/migrations/core/`](sql/migrations/core/)
- **Features**: [`sql/migrations/features/`](sql/migrations/features/)

### Utilities
- **Scripts**: [`sql/scripts/`](sql/scripts/) - Diagnostic and utility queries
- **Schema**: [`sql/supabase-schema.sql`](sql/supabase-schema.sql) - Complete database definition

🗄️ **[View SQL organization](sql/README.md)**

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Styling**: Tailwind CSS + Shadcn/UI
- **Email**: Resend
- **Deployment**: Vercel

## 🎨 Features

- ✅ Daily reflection prompts
- ✅ Voice prompt playback (Premium)
- ✅ Mood tracking and analytics
- ✅ Archive search and filtering
- ✅ Dark mode support
- ✅ Admin dashboard
- ✅ Subscription management
- ✅ Email notifications
- ✅ Multi-language support

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📦 Deployment

See [DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Check existing documentation in [`docs/`](docs/)
2. Follow the [TESTING_GUIDE.md](docs/guides/TESTING_GUIDE.md)
3. Add new docs to appropriate folders:
   - Implementation logs → `docs/implementation/`
   - User guides → `docs/guides/`
   - Architecture → `docs/architecture/`
   - SQL migrations → `sql/migrations/[category]/`

## 📝 License

[Your License Here]

---

**Need help?** Start with [docs/guides/START_HERE.md](docs/guides/START_HERE.md)
