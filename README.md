# TaxDoc - World-Class Tax Document Management App

A modern, secure, and AI-powered tax document management application built with Next.js 16, TypeScript, and Prisma.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Windows note

npm scripts such as `build` use POSIX inline env syntax (`DATABASE_URL=file:./dev.db`). On **Windows CMD/PowerShell** this may fail. Options:

- Use **Git Bash** or **WSL** for development, or
- Install [cross-env](https://www.npmjs.com/package/cross-env) and prefix commands, e.g. `npx cross-env DATABASE_URL=file:./dev.db npm run build`, or
- Set `DATABASE_URL` in `.env` (Prisma/Next read it automatically) and run `npx prisma generate && npx next build` directly.

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   The `.env` file is already configured with SQLite for local development. For production, update `DATABASE_URL` to PostgreSQL.

3. **Set up database**
   ```bash
   npm run db:generate  # Generate Prisma Client
   npm run db:migrate   # Run migrations
   ```

4. **Seed database (optional)**
   ```bash
   npm run db:seed      # Create test user and sample data
   ```
   Test credentials:
   - Email: `test@example.com`
   - Password: `password123`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand, React Query
- **AI**: OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini Pro
- **Security**: bcrypt, JWT, rate limiting, encryption

### Key Features
- ✅ User authentication & registration
- ✅ Document upload & management (drag & drop)
- ✅ AI-powered document analysis
- ✅ Tax calculator
- ✅ Advanced search & filtering
- ✅ Bulk operations
- ✅ Command palette (Cmd+K)
- ✅ Responsive design
- ✅ Dark/light theme support
- ✅ Security audit logging
- ✅ Rate limiting

## 📁 Project Structure

```
tax-document-manager/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── documents/         # Document management
│   └── ...
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── ...
├── lib/                   # Utilities and services
│   ├── auth/             # Authentication config
│   ├── ai/               # AI providers
│   ├── db/               # Database client
│   ├── security/         # Security utilities
│   └── utils/            # Helper functions
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## 🔐 Security Features

- Password hashing (bcrypt)
- Account lockout (5 failed attempts)
- Session management (30-day expiry)
- Security event logging
- Input validation (Zod)
- Route protection middleware
- Rate limiting
- AES-256 encryption support

## 🤖 AI Integration

The app supports multiple AI providers with intelligent fallback:
- **OpenAI GPT-4o** (primary)
- **Anthropic Claude 3.5** (fallback)
- **Google Gemini Pro** (secondary fallback)

Add your API keys to `.env`:
```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."
```

## 📊 Database

### Local Development (SQLite)
- Database file: `prisma/dev.db`
- No setup required, works out of the box

### Production (PostgreSQL)
1. Update `prisma/schema.prisma` datasource to `postgresql`
2. Update `.env` `DATABASE_URL` to PostgreSQL connection string
3. Run `npm run db:migrate`

### Database GUI
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

## 🎨 Features

### Document Management
- Upload documents (drag & drop)
- Categorize and tag documents
- Search and filter
- Bulk operations
- Tax relevance marking

### AI Assistant
- Chat interface
- Document analysis
- Tax guidance
- Multi-provider support

### Tax Calculator
- Income tax calculation
- Deductions support
- Refund estimation
- Multiple filing statuses

### Dashboard
- Statistics overview
- Quick actions
- Recent activity
- Visual charts

## 🔧 Configuration

### Environment Variables

Required:
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth (32+ characters)
- `NEXTAUTH_URL` - Application URL

Optional:
- `REDIS_URL` - Distributed rate limiting (in-memory fallback when unset)
- `TRUST_CLOUDFLARE` - Use CF-Connecting-IP when behind Cloudflare proxy
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_AI_API_KEY` - Google AI API key
- `ENCRYPTION_KEY` - Encryption key (32+ characters)
- `SMTP_*` - Email configuration

**Post-beta S3 storage (disabled by default):** set `USE_S3=true` plus `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET` only after wiring `lib/storage/s3-scaffold.ts` into upload/download routes. See [docs/SCALING-SCAFFOLDS.md](./docs/SCALING-SCAFFOLDS.md).

See `.env` file for all options.

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Feature status
- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) - Competitive analysis
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Setup guide
- [IMPROVEMENTS_IMPLEMENTED.md](./IMPROVEMENTS_IMPLEMENTED.md) - UX improvements
- [docs/SCALING-SCAFFOLDS.md](./docs/SCALING-SCAFFOLDS.md) - Post-beta CSP nonces & S3 storage (disabled scaffolds)

## 🚢 Deployment

### Render (TaxDoc beta)

1. Push code: `npm run github:push`
2. Deploy: `npm run render:deploy` (or connect the GitHub repo in Render)
3. Set required env vars in the Render dashboard (`NEXTAUTH_URL`, `APP_URL`, secrets)
4. **Enable the AI assistant** — add at least one of:
   - `OPENAI_API_KEY` — recommended (`sk-…` from [OpenAI API keys](https://platform.openai.com/api-keys))
   - `ANTHROPIC_API_KEY` — optional alternative
   - `GOOGLE_AI_API_KEY` — optional alternative

Without an AI key, the app runs normally but `/ai-assistant` shows a clear message and chat is disabled. After adding `OPENAI_API_KEY`, save and **redeploy** (or use Manual Deploy) so the container picks up the new variable.

See `render.yaml` for the full env var template.

#### Render Free tier — spin-down (important)

The live beta at `https://taxdoc-beta.onrender.com` runs on **Render Free**. After **~15 minutes** without traffic, Render **stops the container**. The next visit shows Render’s loading/welcome screen for **1–2 minutes** while the app cold-starts (migrations + Next.js).

**What to do as a user:** wait ~1 minute, then **hard refresh** (Safari: pull down; Chrome: reload). The login page shows a cloud banner with a retry button when hosted on Render.

**Health check:** `/api/health` (fast, no DB) — used by Render so the service goes “live” sooner after wake.

**Optional keep-alive (beta):** ping every 14 minutes from any machine to reduce sleep:

```bash
# cron example — every 14 min
*/14 * * * * cd /path/to/tax-document-manager && node scripts/keep-alive-render.mjs
```

**Permanent fix:** upgrade the Render service to **Starter** (paid) — no spin-down, persistent disk. Update `RENDER_PLAN=starter` before `npm run render:deploy`, or change plan in the Render dashboard.

#### Optional: Render Starter ($7/mo)

Even if `render.yaml` says `plan: starter`, an existing service may still be on **Free** until you upgrade manually:

1. [Render Dashboard](https://dashboard.render.com) → **taxdoc-beta** → **Settings**
2. **Instance Type** → change **Free** → **Starter** ($7/month)
3. Save — no code redeploy required

Benefits: 24/7 uptime (no 15-min sleep), faster restarts, persistent disk at `/var/data`.

See `docs/cloud/CLOUD-HOSTING.txt` and `dist/mobile/CLOUD-HOSTING.txt` after deploy.

#### Optional: REDIS_URL (distributed rate limiting)

Set `REDIS_URL` in Render (Upstash, Render Redis, etc.) for rate limits shared across instances. Without it, limits use in-memory storage (fine for a single instance). Startup logs `Rate limiting: redis` or `memory (single instance)`. Admin check: `/api/health?admin=1`.

#### Optional: Cloudflare (edge WAF / DDoS)

See `docs/cloud/CLOUDFLARE-SETUP.txt`. Set `TRUST_CLOUDFLARE=true` only when all traffic is proxied through Cloudflare.

See also `dist/mobile/CLOUD-HOSTING.txt` after deploy.

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Update `DATABASE_URL` to production database
- Set all required environment variables
- Run `npm run build`
- Start with `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

Private project - All rights reserved

## 🎉 Status

✅ **All core features implemented and ready to use!**

The application is fully functional with:
- Authentication system
- Document management
- AI assistant
- Tax calculator
- Dashboard
- Settings
- Security features
- Performance optimizations

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
