# Discord Clone

A modern, full-featured Discord clone built with Next.js 16, featuring real-time messaging, voice channels, server management, and more. This application replicates the core functionality of Discord with a clean, responsive interface.

![Discord Clone](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.10-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Authentication** with Clerk integration
- **User Profiles** with customizable avatars and display names
- **Protected Routes** with middleware-based authentication

### 🏠 Server Management
- **Create & Join Servers** with unique invite codes
- **Server Customization** with custom names and images
- **Member Management** with role-based permissions (Admin, Moderator, Guest)
- **Server Settings** and moderation tools

### 💬 Real-time Communication
- **Text Channels** with live messaging via Socket.IO
- **Direct Messages** between server members
- **File Sharing** with support for images, PDFs, videos, and audio
- **Emoji Support** with emoji picker integration
- **Message History** with persistent storage

### 🎵 Channel Types
- **Text Channels** for messaging and file sharing
- **Audio Channels** for voice communication (planned)
- **Video Channels** for video calls (planned)

### 🎨 User Experience
- **Dark/Light Theme** toggle with system preference detection
- **Responsive Design** optimized for desktop and mobile
- **Real-time Status Indicators** showing connection status
- **Intuitive Navigation** with collapsible sidebars
- **Modal-based Interactions** for seamless user experience

## 🛠️ Technology Stack

### Frontend
- **[Next.js 16.0.10](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4.1.10](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives

### Backend & Database
- **[PostgreSQL 15](https://www.postgresql.org/)** - Primary database
- **[Prisma 6.12.0](https://www.prisma.io/)** - Database ORM and migrations
- **[Socket.IO 4.8.1](https://socket.io/)** - Real-time bidirectional communication

### Authentication & File Handling
- **[Clerk 6.22.0](https://clerk.com/)** - Authentication and user management
- **[UploadThing 7.7.3](https://uploadthing.com/)** - File upload and storage service

### State Management & Forms
- **[Zustand 5.0.6](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[@tanstack/react-query 5.84.0](https://tanstack.com/query)** - Powerful data fetching and state synchronization
- **[React Hook Form 7.58.1](https://react-hook-form.com/)** - Performant forms
- **[Zod 3.25.67](https://zod.dev/)** - Schema validation

### Utilities & Libraries
- **[Axios 1.10.0](https://axios-http.com/)** - HTTP client
- **[date-fns 4.1.0](https://date-fns.org/)** - Date manipulation library
- **[React Markdown 10.1.0](https://github.com/remarkjs/react-markdown)** - Markdown rendering
- **[UUID 11.1.0](https://github.com/uuidjs/uuid)** - UUID generation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** (version 8.0 or higher) or **yarn** (version 1.22 or higher)
- **PostgreSQL** (version 15 or higher)
- **Git** for version control

### Required Accounts
- **[Clerk](https://clerk.com/)** account for authentication
- **[UploadThing](https://uploadthing.com/)** account for file uploads
- **PostgreSQL database** (local or hosted, e.g., Supabase, Railway, PlanetScale)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/discord-clone.git
cd discord-clone
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker-compose up -d

# The database will be available at:
# Host: localhost
# Port: 5432
# Database: discord_clone
# Username: discord_user
# Password: your_secure_password
```

#### Option B: Local PostgreSQL Installation
Ensure PostgreSQL is running and create a database:
```sql
CREATE DATABASE discord_clone;
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://discord_user:your_secure_password@localhost:5432/discord_clone"
DIRECT_URL="postgresql://discord_user:your_secure_password@localhost:5432/discord_clone"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# UploadThing
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🏗️ Development Workflow

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Database operations
npx prisma studio          # Open Prisma Studio
npx prisma db push         # Push schema changes
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create and apply migrations
```

### Development Server Features

- **Hot Reload** - Changes are reflected instantly
- **Turbopack** - Fast bundler for development
- **TypeScript** - Real-time type checking
- **ESLint** - Code quality and consistency

## 📁 Project Structure

```
discord-clone/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes (grouped)
│   ├── (invite)/               # Server invite handling
│   ├── (main)/                 # Main application routes
│   ├── (setup)/               # Initial user setup
│   ├── api/                   # API routes
│   │   ├── channels/          # Channel management
│   │   ├── members/           # Member management
│   │   ├── messages/          # Message operations
│   │   ├── servers/           # Server operations
│   │   └── uploadthing/       # File upload handling
│   ├── globals.css            # Global styles
│   └── layout.tsx             # Root layout
├── components/                   # React components
│   ├── chat/                  # Chat-related components
│   ├── modals/                # Modal dialogs
│   ├── navigations/           # Navigation components
│   ├── providers/             # Context providers
│   ├── server/                # Server-specific UI
│   ├── ui/                    # Reusable UI components
│   └── *.tsx                  # Shared components (avatar, emoji picker, etc.)
├── hooks/                       # Custom React hooks
│   ├── use-chat-query.ts      # Chat data fetching
│   ├── use-chat-socket.ts     # Real-time chat updates
│   ├── use-modal-store.ts     # Modal state management
│   └── use-origin.ts          # Origin URL hook
├── lib/                         # Utility libraries
│   ├── conversation.ts        # Conversation helpers
│   ├── current-profile.ts     # Profile utilities (App Router)
│   ├── current-profile-pages.ts # Profile utilities (Pages Router)
│   ├── db.ts                  # Database connection
│   ├── initial-profile.ts     # Initial profile setup
│   ├── uploadthing.ts         # File upload utilities
│   └── utils.ts               # Helper functions
├── pages/api/socket/            # Socket.IO API routes
├── prisma/                      # Database schema and migrations
│   ├── migrations/            # Database migrations
│   └── schema.prisma          # Database schema
├── public/                      # Static assets
└── types.ts                     # TypeScript type definitions
```

## 🔧 Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `DIRECT_URL` | Direct database connection (for migrations) | Same as DATABASE_URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `UPLOADTHING_SECRET` | UploadThing secret key | `sk_live_...` |
| `UPLOADTHING_APP_ID` | UploadThing application ID | `your-app-id` |
| `NEXT_PUBLIC_SITE_URL` | Application URL | `http://localhost:3000` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page URL | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page URL | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up | `/` |

### Setting Up External Services

#### Clerk Authentication
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy API keys to your `.env.local`
4. Configure redirect URLs in Clerk dashboard

#### UploadThing File Storage
1. Create account at [uploadthing.com](https://uploadthing.com)
2. Create new application
3. Copy API keys to your `.env.local`
4. Configure file size limits and allowed types

## 🚀 Deployment

### Quick Deploy Options

| Platform | Database | Setup |
|----------|----------|-------|
| **[Vercel](https://vercel.com/)** ⭐ | [Supabase](https://supabase.com/) | Connect GitHub → Add env vars → Deploy |
| **[Railway](https://railway.app/)** | Built-in PostgreSQL | One-click deploy from GitHub |
| **[Netlify](https://netlify.com/)** | [PlanetScale](https://planetscale.com/) | Build: `npm run build`, Dir: `.next` |

### Deployment Checklist

1. **Build locally:** `npm run build` (ensure no errors)
2. **Environment variables:** Copy all from `.env.local` to your platform
3. **Database:** Set up PostgreSQL and run migrations
4. **Domain:** Update `NEXT_PUBLIC_SITE_URL` to your production URL
5. **Test:** Verify authentication and file uploads work

## 🤝 Contributing

We welcome contributions to the Discord Clone project! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/discord-clone.git
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes and commit:**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to your branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- **Code Style:** Follow the existing code style and use ESLint
- **TypeScript:** Maintain type safety throughout the codebase
- **Testing:** Add tests for new features (when test suite is available)
- **Documentation:** Update documentation for significant changes
- **Commits:** Use clear, descriptive commit messages

### Areas for Contribution

- 🎵 **Voice/Video Chat** - WebRTC integration for audio/video channels
- 🔒 **Advanced Permissions** - Granular role-based permissions
- 🎨 **UI/UX Improvements** - Enhanced user interface and experience
- 📱 **Mobile Optimization** - Better mobile responsiveness
- 🔍 **Search Functionality** - Message and server search
- 🤖 **Bot Integration** - Discord bot support
- 🌐 **Internationalization** - Multi-language support
- ⚡ **Performance** - Optimization and caching improvements

### Reporting Issues

When reporting issues, please include:
- **Environment details** (OS, Node.js version, browser)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Error messages** from console/logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Key points:**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability assumed

## 📞 Support & Contact

### Getting Help

- **📖 Documentation:** Check this README and inline code comments
- **🐛 Issues:** Report bugs and request features via GitHub Issues
- **💬 Discussions:** Ask questions and share ideas in GitHub Discussions
- **📚 Code Examples:** Review the codebase for implementation details

### Community Resources

- **Stack Overflow:** Tag your questions with `discord-clone` and `nextjs`
- **Next.js Community:** [Next.js Discord](https://discord.gg/nextjs) for framework-specific help
- **React Community:** [Reactiflux Discord](https://discord.gg/reactiflux) for React questions

---

## 🙏 Acknowledgments

- **[Discord](https://discord.com/)** - For the inspiration and design reference
- **[Vercel](https://vercel.com/)** - For the amazing Next.js framework and hosting
- **[Clerk](https://clerk.com/)** - For seamless authentication
- **[Prisma](https://prisma.io/)** - For the excellent database toolkit
- **[Radix UI](https://radix-ui.com/)** - For accessible component primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - For the utility-first CSS framework

---

<div align="center">
  <p>Made with ❤️ by the Discord Clone team</p>
  <p>
    <a href="#discord-clone">Back to top</a>
  </p>
</div>
